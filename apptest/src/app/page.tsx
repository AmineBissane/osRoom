"use client"

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Calendar, Home as HomeIcon, Menu, MessageSquare, Settings, User, BookOpen, Users, Clock, MoreVertical, FileText, Download, School, ClipboardList } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { refreshAccessToken } from '@/lib/auth'
import { fetchClassroomsByCategory } from '@/utils/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Classroom {
  id: number;
  name: string;
  description: string;
  activitiesIds: number[];
}

interface Activity {
  id: number;
  name: string;
  description: string;
  classroomsIds: number[];
  fileId?: string;
  endDate?: string;
  status?: 'pending' | 'submitted' | 'graded';
}

const activities = [
  { id: 1, name: "Examen de Matemáticas", date: "Mañana, 10:00 AM" },
  { id: 2, name: "Ensayo de Literatura", date: "Viernes, 11:59 PM" },
  { id: 3, name: "Laboratorio de Física", date: "Próximo Lunes, 1:00 PM" },
]

const announcements = [
  { id: 1, title: "Asamblea Escolar", content: "Habrá una asamblea escolar la próxima semana." },
  { id: 2, title: "Recordatorio de Vacaciones", content: "La escuela estará cerrada durante las próximas vacaciones." },
]

const stats = [
  {
    title: "Clases Activas",
    value: "3",
    icon: BookOpen,
    description: "Cursos en progreso"
  },
  {
    title: "Tareas Pendientes",
    value: "5",
    icon: Clock,
    description: "Por entregar esta semana"
  },
  {
    title: "Compañeros",
    value: "75",
    icon: Users,
    description: "En todas tus clases"
  }
]

// Mock data for initial state
const mockClasses = [
  {
    id: 1,
    name: "Matemáticas Avanzadas",
    description: "Curso de matemáticas del semestre 2024-1",
    activitiesIds: [1, 2]
  },
  {
    id: 2,
    name: "Programación Web",
    description: "Desarrollo de aplicaciones web modernas",
    activitiesIds: [3, 4, 5]
  },
  {
    id: 3,
    name: "Base de Datos",
    description: "Fundamentos de bases de datos relacionales",
    activitiesIds: [6, 7]
  }
]

// Create a simple Skeleton component inline
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export default function Home() {
  const router = useRouter()
  const [classes, setClasses] = useState<Classroom[]>([]); // Initialize with empty array, not mock data
  const [loading, setLoading] = useState(true);
  const [selectedClassActivities, setSelectedClassActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [loadingUpcomingActivities, setLoadingUpcomingActivities] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = Cookies.get('access_token')
        if (!token) {
          toast.error('No se encontró sesión activa')
          router.replace('/login')
          return
        }

        try {
          // Use the new utility function to fetch classrooms by category
          const data = await fetchClassroomsByCategory();
          
          console.log('API data:', data);
          
          if (Array.isArray(data)) {
            if (data.length === 0) {
              setClasses([]);
            } else {
              setClasses(data);
              // Fetch activities for all classes
              fetchAllActivities(data);
            }
            setLoading(false);
            return;
          }
          
          // If we get here, the data format was invalid
          throw new Error('Invalid data format from API');
        } catch (apiError) {
          console.error('API error:', apiError);
          toast.error('Error al cargar las clases');
          setClasses([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        
        // Check if it's a CORS error
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.error('Possible CORS error - check browser console for details');
          toast.error('Error de conexión: posible problema de CORS');
        } else {
          toast.error(error instanceof Error ? error.message : 'Error al cargar las clases');
        }
        
        setClasses([]);
        setLoading(false);
      }
    }

    fetchClasses();
  }, [router]);
  
  // Función para obtener todas las actividades de todas las clases
  const fetchAllActivities = async (classrooms: Classroom[]) => {
    if (!classrooms.length) return;
    
    setLoadingUpcomingActivities(true);
    
    try {
      // Crear un array para almacenar todas las actividades
      const allActivities: Activity[] = [];
      
      // Para cada clase, obtener sus actividades
      for (const classroom of classrooms) {
        try {
          const response = await fetch(`/api/proxy/classrooms/${classroom.id}/activities`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const activities = await response.json();
            if (Array.isArray(activities) && activities.length > 0) {
              // Añadir las actividades al array
              allActivities.push(...activities);
            }
          }
        } catch (error) {
          console.error(`Error fetching activities for classroom ${classroom.id}:`, error);
        }
      }
      
      // Filtrar actividades que tienen fecha límite y ordenarlas por fecha
      const activitiesWithDates = allActivities
        .filter(activity => activity.endDate)
        .sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
      
      // Tomar solo las primeras 5 actividades más próximas
      setUpcomingActivities(activitiesWithDates.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching all activities:', error);
      toast.error('Error al cargar las actividades');
    } finally {
      setLoadingUpcomingActivities(false);
    }
  };

  // Helper function to parse JWT token
  const parseJwt = (token: string) => {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      // Split the token and get the payload part
      const base64Url = cleanToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT token:', e);
      return null;
    }
  };

  const handleViewActivities = async (classId: number) => {
    setLoadingActivities(true);
    try {
      // Use our proxy API endpoint
      const response = await fetch(`/api/proxy/classrooms/${classId}/activities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }).catch(error => {
        console.error('Network error:', error);
        return null;
      });

      if (!response) {
        setSelectedClassActivities([]);
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          Cookies.remove('id_token')
          router.replace('/login')
          return
        }
        throw new Error('Failed to fetch activities')
      }

      const data = await response.json();
      setSelectedClassActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Error loading activities');
      setSelectedClassActivities([])
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      // Use our proxy API endpoint
      const response = await fetch(`/api/proxy/file-storage/download/${fileId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and click it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error downloading file');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-8">
      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clases Activas
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              Clases en las que estás matriculado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tareas Pendientes
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                selectedClassActivities.filter(activity => 
                  !activity.status || activity.status === 'pending'
                ).length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Actividades por entregar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCount || '42+'}
            </div>
            <p className="text-xs text-muted-foreground">
              Miembros de la plataforma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classes Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Mis Clases</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(3).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-2 w-full bg-gray-200 animate-pulse" />
                <CardHeader className="space-y-1">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-9 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : classes.length > 0 ? (
            classes.map((cls) => (
              <Card key={cls.id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className={cn("h-2 w-full bg-gradient-to-r from-blue-500/20 to-cyan-400/20")} />
                <CardHeader className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-blue-500">{cls.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {cls.description}
                      </CardDescription>
                    </div>
                    <div className="relative w-10 h-10 rounded-lg bg-secondary/80">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium">{cls.activitiesIds?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {cls.activitiesIds?.length || 0} Activities
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/class/${cls.id}`} className="w-full">
                        <Button className="w-full" variant="outline">Ver Clase</Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <School className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No hay clases disponibles</h3>
              <p className="text-muted-foreground mt-2">
                No se encontraron clases para tu perfil.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activities and Announcements */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Actividades Próximas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUpcomingActivities ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : upcomingActivities.length > 0 ? (
              <ul className="space-y-4">
                {upcomingActivities.map((activity) => {
                  // Formatear la fecha
                  let formattedDate = "Sin fecha límite";
                  if (activity.endDate) {
                    const date = new Date(activity.endDate);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    const isToday = date.toDateString() === today.toDateString();
                    const isTomorrow = date.toDateString() === tomorrow.toDateString();
                    
                    if (isToday) {
                      formattedDate = `Hoy, ${date.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}`;
                    } else if (isTomorrow) {
                      formattedDate = `Mañana, ${date.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}`;
                    } else {
                      formattedDate = date.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    }
                  }
                  
                  return (
                    <li key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">{formattedDate}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/activity/${activity.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No hay actividades próximas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Anuncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
