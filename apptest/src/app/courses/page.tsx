"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Book, Loader2, School, Users, GraduationCap, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { fetchWithAuth } from "@/utils/fetchWithAuth"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Cookies from "js-cookie"
import { fetchClassroomsByCategory } from '@/utils/api'
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Classroom {
  id: number;
  name: string;
  description: string;
  activitiesIds?: number[];
  teacherIds?: number[];
  studentIds?: number[];
  creatorId?: number;
  classcategories?: string[];
}

export default function CoursesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    classcategories: ["general"],
    studentIds: [] as number[],
    teacherIds: [] as number[]
  });

  // Fetch classes from the API
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        // Use direct API access
        const token = Cookies.get('access_token');
        if (!token) {
          toast.error('No se encontró sesión activa');
          router.replace('/login');
          return;
        }

        try {
          // Use the utility function to fetch classrooms by category
          const data = await fetchClassroomsByCategory();
          
          console.log('API data:', data);
          
          if (Array.isArray(data)) {
            setClasses(data);
          } else {
            // If we get here, the data format was invalid
            throw new Error('Invalid data format from API');
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          toast.error('Error al cargar las clases');
          setClasses([]);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Error al cargar las clases');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [router]);

  // Create a new class
  const handleCreateClass = async () => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('No se encontró sesión activa');
        router.replace('/login');
        return;
      }

      const response = await fetch('http://82.29.168.17:8222/api/v1/classrooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClass)
      });

      if (!response.ok) {
        throw new Error(`Error creating class: ${response.status}`);
      }

      const createdClass = await response.json();
      setClasses([...classes, createdClass]);
      toast.success('Clase creada correctamente');
      
      // Reset form
      setNewClass({
        name: "",
        description: "",
        classcategories: ["general"],
        studentIds: [],
        teacherIds: []
      });
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Error al crear la clase');
    }
  };

  // Delete a class
  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    
    try {
      setIsDeleting(classToDelete);
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('No se encontró sesión activa');
        router.replace('/login');
        return;
      }

      const response = await fetch(`http://82.29.168.17:8222/api/v1/classrooms/classroom/${classToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error deleting class: ${response.status}`);
      }

      // Remove from state
      setClasses(classes.filter(c => c.id !== classToDelete));
      toast.success('Clase eliminada correctamente');
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Error al eliminar la clase');
    } finally {
      setIsDeleting(null);
      setClassToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Cursos</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Clase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Clase</DialogTitle>
              <DialogDescription>
                Ingresa los detalles para la nueva clase.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="Nombre de la clase" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  value={newClass.description}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  placeholder="Descripción de la clase" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="classcategories">Categorías (separadas por coma)</Label>
                <Input 
                  id="classcategories" 
                  value={newClass.classcategories.join(', ')}
                  onChange={(e) => setNewClass({
                    ...newClass, 
                    classcategories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat !== '')
                  })}
                  placeholder="general, DAM, DAW, ASIR..." 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Las categorías ayudan a organizar y filtrar las clases.
                </p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Los estudiantes y profesores podrán ser asignados después de crear la clase.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateClass}>Crear Clase</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classroom) => (
            <Card key={classroom.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>{classroom.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{classroom.description}</p>
                {classroom.classcategories && classroom.classcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {classroom.classcategories.map((category, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50/50">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Book className="h-4 w-4 mr-1" />
                    <span>{classroom.activitiesIds?.length || 0} Actividades</span>
                  </div>
                  {classroom.studentIds && classroom.studentIds.length > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{classroom.studentIds.length} Estudiantes</span>
                    </div>
                  )}
                  {classroom.teacherIds && classroom.teacherIds.length > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      <span>{classroom.teacherIds.length} Profesores</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/class/${classroom.id}`)}
                    className="mr-2"
                  >
                    Ver Clase
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={isDeleting === classroom.id}
                        onClick={() => setClassToDelete(classroom.id)}
                      >
                        {isDeleting === classroom.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará la clase "{classroom.name}" y no se puede deshacer.
                          Todos los datos asociados a esta clase también serán eliminados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setClassToDelete(null)}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClass}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <School className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No hay clases disponibles</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Comienza creando tu primera clase con el botón arriba.
          </p>
        </div>
      )}
    </div>
  )
} 