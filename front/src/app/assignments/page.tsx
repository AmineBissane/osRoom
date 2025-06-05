"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Loader2, AlertTriangle, CheckCircle, ClipboardList, Filter, School } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchClassroomsByCategory } from '@/utils/api'

interface Activity {
  id: number | string;
  name: string;
  description: string;
  classroomsIds?: number[];
  fileId?: string;
  endDate?: string;
  status?: 'pending' | 'submitted' | 'graded';
  grade?: number;
  className?: string;
  classId?: number;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
  const [userClasses, setUserClasses] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const fetchUserActivities = async () => {
      try {
        setLoading(true);
        const token = Cookies.get('access_token');
        if (!token) {
          toast.error('No se encontró sesión activa');
          router.replace('/login');
          return;
        }

        // Obtener el ID del usuario desde el token
        const userId = extractUserIdFromToken(token);
        if (!userId) {
          toast.error('No se pudo identificar al usuario');
          return;
        }

        console.log('Obteniendo clases para el usuario:', userId);

        // Obtener todas las clases a las que el usuario tiene acceso por categoría
        try {
          const classrooms = await fetchClassroomsByCategory();
          console.log(`Se encontraron ${classrooms.length} clases para el usuario`);
          
          // Guardar la lista de clases para el filtro
          const classesForFilter = classrooms.map((classroom: any) => ({
            id: classroom.id,
            name: classroom.name
          }));
          setUserClasses(classesForFilter);
          
          // Crear un array para almacenar todas las actividades
          const allActivities: Activity[] = [];
          
          // Para cada clase, obtener sus actividades
          for (const classroom of classrooms) {
            try {
              console.log(`Obteniendo actividades para la clase: ${classroom.id} - ${classroom.name}`);
              
              const response = await fetch(`http://localhost:8222/api/v1/activities/classrooms/${classroom.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
              
              if (response.ok) {
                const classActivities = await response.json();
                if (Array.isArray(classActivities) && classActivities.length > 0) {
                  console.log(`Se encontraron ${classActivities.length} actividades para la clase ${classroom.id}`);
                  
                  // Añadir información de la clase a cada actividad para mostrarla en la UI
                  const activitiesWithClassInfo = classActivities.map(activity => ({
                    ...activity,
                    className: classroom.name,
                    classId: classroom.id
                  }));
                  
                  // Añadir las actividades al array
                  allActivities.push(...activitiesWithClassInfo);
                } else {
                  console.log(`No se encontraron actividades para la clase ${classroom.id}`);
                }
              } else {
                console.error(`Error al obtener actividades para la clase ${classroom.id}: ${response.status}`);
              }
            } catch (error) {
              console.error(`Error fetching activities for classroom ${classroom.id}:`, error);
            }
          }
          
          console.log(`Total de actividades encontradas: ${allActivities.length}`);

          // Verificar el estado de cada actividad (si el usuario ha respondido o no)
          const activitiesWithStatus = await Promise.all(
            allActivities.map(async (activity) => {
              try {
                // Check if user has responded to this activity
                const responseCheckUrl = `http://localhost:8222/api/v1/activitiesresponses/activity/${activity.id}/user/${userId}`;
                const responseCheck = await fetch(responseCheckUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                });
                
                if (responseCheck.ok) {
                  const responseData = await responseCheck.json();
                  if (Array.isArray(responseData) && responseData.length > 0) {
                    // El usuario ha respondido a esta actividad
                    const status = responseData[0].grade !== undefined ? 'graded' : 'submitted';
                    return { 
                      ...activity, 
                      status: status as 'pending' | 'submitted' | 'graded',
                      grade: responseData[0].grade
                    };
                  }
                }
                
                // Si no hay respuesta o hubo un error, la actividad está pendiente
                return { ...activity, status: 'pending' as const };
              } catch (error) {
                console.error(`Error checking responses for activity ${activity.id}:`, error);
                return { ...activity, status: 'pending' as const };
              }
            })
          );
          
          // Ordenar actividades por fecha
          const sortedActivities = activitiesWithStatus.sort((a, b) => {
            if (!a.endDate) return 1;
            if (!b.endDate) return -1;
            return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          });
          
          setActivities(sortedActivities);
        } catch (apiError) {
          console.error('API error:', apiError);
          toast.error('Error al cargar las clases');
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        toast.error('Error al cargar las actividades');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivities();
  }, [router]);

  // Helper function to extract user ID from JWT token
  const extractUserIdFromToken = (token: string): string | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      return payload.sub;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  };

  // Format date with proper locale
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha límite';
    try {
      const date = new Date(dateString);
      return format(date, "PPP", { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Check if an activity is expired
  const isExpired = (dateString?: string): boolean => {
    if (!dateString) return false;
    try {
      const endDate = new Date(dateString);
      const now = new Date();
      return now > endDate;
    } catch (error) {
      return false;
    }
  };

  // Filtrar actividades según el filtro activo y la clase seleccionada
  const filteredActivities = activities.filter(activity => {
    // Filtrar por estado
    const statusFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'pending' ? activity.status === 'pending' :
      activeFilter === 'submitted' ? (activity.status === 'submitted' || activity.status === 'graded') :
      true;
    
    // Filtrar por clase
    const classFilter = 
      selectedClass === 'all' ? true :
      activity.classId === selectedClass;
    
    // Aplicar ambos filtros
    return statusFilter && classFilter;
  });

  // Obtener el icono y color para el estado de la actividad
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Entregado</Badge>;
      case 'graded':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Calificado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendiente</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Mis Actividades</h1>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveFilter('all')}
            className={cn(
              "flex-1 sm:flex-none",
              activeFilter === 'all' && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Todas
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveFilter('pending')}
            className={cn(
              "flex-1 sm:flex-none",
              activeFilter === 'pending' && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pendientes
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveFilter('submitted')}
            className={cn(
              "flex-1 sm:flex-none",
              activeFilter === 'submitted' && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Entregadas
          </Button>
        </div>
      </div>
      
      {/* Selector de clases */}
      {userClasses.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <School className="h-4 w-4" />
            <span className="text-sm font-medium">Filtrar por clase:</span>
          </div>
          <Select
            value={selectedClass.toString()}
            onValueChange={(value) => setSelectedClass(value === 'all' ? 'all' : parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Seleccionar clase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las clases</SelectItem>
              {userClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 mt-1 text-blue-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{activity.name}</h2>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      {activity.className && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-blue-50/50">
                            Clase: {activity.className}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Entrega: {formatDate(activity.endDate)}
                        </span>
                        
                        {isExpired(activity.endDate) && (
                          <Badge variant="destructive" className="ml-2">
                            Vencido
                          </Badge>
                        )}
                        
                        {activity.grade !== undefined && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
                            Calificación: {activity.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/activity/${activity.id}`)}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">
            {selectedClass !== 'all' ? 
              `No hay actividades ${activeFilter !== 'all' ? 
                (activeFilter === 'pending' ? 'pendientes' : 'entregadas') : 
                ''} en esta clase` :
              activeFilter === 'all' ? 'No hay actividades disponibles' :
              activeFilter === 'pending' ? 'No hay actividades pendientes' :
              'No hay actividades entregadas'}
          </h3>
          <p className="text-muted-foreground mt-2">
            {selectedClass !== 'all' ? 
              `Prueba a seleccionar otra clase o cambiar el filtro` :
              activeFilter === 'pending' ? '¡Todas tus actividades están al día!' : 
              activeFilter === 'submitted' ? 'Aún no has entregado ninguna actividad' :
              'No se encontraron actividades para tu perfil'}
          </p>
        </div>
      )}
    </div>
  )
} 