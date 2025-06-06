"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Award, Download, FileText, Search, User, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface Classroom {
  id: number;
  name: string;
  description?: string;
}

interface Grade {
  id: number;
  userId: string;
  userName: string;
  classroomId: number;
  classroomName: string;
  valor: number;
  descripcion: string;
  date: string;
  // Legacy fields for compatibility
  estudianteId?: string;
  estudianteNombre?: string;
  claseId?: number;
  claseNombre?: string;
  comentarios?: string;
  fecha?: string | Date;
  valorMaximo?: number;
  tipo?: string;
}

export default function GradesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedUserForPDF, setSelectedUserForPDF] = useState<string>("");
  const [newGrade, setNewGrade] = useState({
    userId: "",
    classroomId: "",
    value: 0,
    description: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassroom || selectedUser || searchTerm) {
      fetchGrades();
    }
  }, [selectedClassroom, selectedUser, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchClassrooms(),
        fetchGrades()
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get<User[]>('http://82.29.168.17:8226/api/v1/users')
        .catch(error => {
          console.error('Error fetching users:', error);
          return null;
        });
        
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Users fetched:', data.length);
        setUsers(data);
        return;
      }
      
      // Fallback to dummy users if the API fails or returns empty data
      console.warn('Using fallback user data');
      const dummyUsers: User[] = [
        {
          id: "test-user-1",
          firstName: "Usuario",
          lastName: "De Prueba 1",
          username: "usuario1",
          email: "usuario1@test.com"
        },
        {
          id: "test-user-2",
          firstName: "Usuario",
          lastName: "De Prueba 2",
          username: "usuario2",
          email: "usuario2@test.com"
        }
      ];
      
      console.log('Using dummy users for testing');
      setUsers(dummyUsers);
    } catch (error) {
      console.error('Fatal error fetching users:', error);
      toast.error('Error al cargar usuarios: Usando datos de prueba');
      
      // Fallback to dummy users
      const dummyUsers: User[] = [
        {
          id: "test-user-1",
          firstName: "Usuario",
          lastName: "De Prueba 1",
          username: "usuario1",
          email: "usuario1@test.com"
        },
        {
          id: "test-user-2",
          firstName: "Usuario",
          lastName: "De Prueba 2",
          username: "usuario2",
          email: "usuario2@test.com"
        }
      ];
      
      console.log('Using dummy users for testing');
      setUsers(dummyUsers);
    }
  };

  const fetchClassrooms = async () => {
    try {
      // Try to get all classrooms first (this should work for all users)
      let data = await api.get<Classroom[]>('http://82.29.168.17:8226/api/v1/classrooms')
        .catch(error => {
          console.error('Error fetching all classrooms:', error);
          return null;
        });
      
      // If we have data and it's an array, use it
      if (data && Array.isArray(data)) {
        console.log('Classrooms fetched:', data.length);
        setClassrooms(data);
        return;
      }
      
      // If getting all classrooms failed, try my-classrooms endpoint
      data = await api.get<Classroom[]>('http://82.29.168.17:8226/api/v1/classrooms/my-classrooms')
        .catch(error => {
          console.error('Error fetching my classrooms:', error);
          return null;
        });
      
      // If we have data and it's an array, use it
      if (data && Array.isArray(data)) {
        console.log('My classrooms fetched:', data.length);
        setClassrooms(data);
        return;
      }
      
      // If all else fails, use dummy data
      console.warn('Using fallback classroom data');
      const dummyClassrooms: Classroom[] = [
        {
          id: 1,
          name: "Matemáticas",
          description: "Clase de prueba de matemáticas"
        },
        {
          id: 2,
          name: "Historia",
          description: "Clase de prueba de historia"
        },
        {
          id: 3,
          name: "Ciencias",
          description: "Clase de prueba de ciencias"
        }
      ];
      
      console.log('Using dummy classrooms for testing');
      setClassrooms(dummyClassrooms);
    } catch (error) {
      console.error('Fatal error fetching classrooms:', error);
      toast.error('Error al cargar clases: Usando datos de prueba');
      
      // Fallback to dummy classrooms
      const dummyClassrooms: Classroom[] = [
        {
          id: 1,
          name: "Matemáticas",
          description: "Clase de prueba de matemáticas"
        },
        {
          id: 2,
          name: "Historia",
          description: "Clase de prueba de historia"
        },
        {
          id: 3,
          name: "Ciencias",
          description: "Clase de prueba de ciencias"
        }
      ];
      
      console.log('Using dummy classrooms for testing');
      setClassrooms(dummyClassrooms);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      let url = 'http://82.29.168.17:8226/api/v1/calificaciones';
      const params = new URLSearchParams();
      
      if (selectedClassroom && selectedClassroom !== "all") {
        params.append('classroomId', selectedClassroom);
      }
      
      if (selectedUser && selectedUser !== "all") {
        params.append('userId', selectedUser);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Fetching grades from:', url);
      const response = await api.get(url);
      console.log('Grades fetched successfully:', response);
      
      if (Array.isArray(response)) {
        // Normalize data to handle both old and new field formats
        const normalizedGrades = response.map(grade => {
          // Cast to any to avoid TypeScript errors with potentially missing fields
          const g = grade as any;
          
          return {
            id: g.id,
            userId: g.userId || g.estudianteId || "",
            userName: g.userName || g.estudianteNombre || "",
            classroomId: g.classroomId || g.claseId || 0,
            classroomName: g.classroomName || g.claseNombre || "",
            valor: g.valor || 0,
            descripcion: g.descripcion || g.comentarios || "",
            date: g.fecha ? (typeof g.fecha === 'string' ? g.fecha : g.fecha.toString())
                 : (g.date ? (typeof g.date === 'string' ? g.date : g.date.toString()) 
                 : new Date().toISOString().split('T')[0])
          } as Grade;
        });
        
        setGrades(normalizedGrades);
        console.log(`Set ${normalizedGrades.length} normalized grades`);
      } else {
        console.warn('Received non-array data for grades:', response);
        setGrades([]);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Error al cargar calificaciones');
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrade = async () => {
    try {
      // Find the selected classroom to get its name
      const selectedClassroomObj = classrooms.find(c => c.id.toString() === newGrade.classroomId);
      
      if (!selectedClassroomObj) {
        toast.error('Por favor selecciona una clase válida');
        return;
      }
      
      // Find the selected user to get their name
      const selectedUserObj = users.find(u => u.id === newGrade.userId);
      
      if (!selectedUserObj) {
        toast.error('Por favor selecciona un estudiante válido');
        return;
      }
      
      const userFullName = `${selectedUserObj.firstName} ${selectedUserObj.lastName}`;
      const classroomId = parseInt(newGrade.classroomId);
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Include both old and new field names for better compatibility
      await api.post('http://82.29.168.17:8226/api/v1/calificaciones', {
        // New field format
        userId: newGrade.userId,
        userName: userFullName,
        classroomId: classroomId,
        classroomName: selectedClassroomObj.name,
        valor: parseFloat(newGrade.value.toString()),
        valorMaximo: 10.0,
        descripcion: newGrade.description,
        fecha: currentDate,
        
        // Legacy field format (for compatibility)
        estudianteId: newGrade.userId,
        estudianteNombre: userFullName,
        claseId: classroomId,
        claseNombre: selectedClassroomObj.name,
        date: currentDate
      });

      toast.success('Calificación creada correctamente');
      setDialogOpen(false);
      setNewGrade({
        userId: "",
        classroomId: "",
        value: 0,
        description: ""
      });
      fetchGrades();
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    }
  };

  const generatePDF = async (userId?: string) => {
    try {
      if (!userId && !selectedUserForPDF) {
        toast.error('Por favor selecciona un estudiante');
        return;
      }
      
      const userIdToUse = userId || selectedUserForPDF;
      const url = `http://82.29.168.17:8226/api/v1/calificaciones/pdf/${userIdToUse}`;
      
      const toastId = toast.loading('Generando PDF...');
      
      console.log(`Intentando descargar PDF desde: ${url}`);
      
      // Use fetch with a timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api.getToken()}`,
            'Accept': 'application/pdf'
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('El PDF generado está vacío');
        }
        
        // Create URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `calificaciones_${userIdToUse}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
        
        // Close dialog and show success message
        if (pdfDialogOpen) {
          setPdfDialogOpen(false);
        }
        
        toast.dismiss(toastId);
        toast.success('PDF generado correctamente');
      } catch (error: any) {
        toast.dismiss(toastId);
        
        if (error.name === 'AbortError') {
          console.error('La solicitud fue cancelada por tiempo de espera');
          toast.error('La solicitud tomó demasiado tiempo. Intente de nuevo más tarde.');
        } else {
          console.error('Error al descargar PDF:', error);
          toast.error(`Error al generar PDF: ${error.message}`);
          
          // Try alternative method as fallback
          useAlternativeMethod(url, userIdToUse, String(toastId));
        }
      }
    } catch (error: any) {
      console.error('Error general:', error);
      toast.error(`Error al generar PDF: ${error.message}`);
    }
  };
  
  // Alternative download method as fallback
  const useAlternativeMethod = (url: string, userId: string, toastId: string) => {
    toast.loading('Intentando método alternativo...', { id: toastId });
    
    // Create an iframe to download the file
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    
    // Listen for load or error events
    iframe.onload = () => {
      toast.dismiss(toastId);
      toast.success('PDF generado correctamente (método alternativo)');
      
      // Close dialog
      if (pdfDialogOpen) {
        setPdfDialogOpen(false);
      }
      
      // Clean up after a delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };
    
    iframe.onerror = () => {
      toast.dismiss(toastId);
      toast.error('No se pudo generar el PDF. Intente de nuevo más tarde.');
      
      // Clean up
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
    
    // Add to document to start the download
    document.body.appendChild(iframe);
  };

  const getGradeColor = (valor: number) => {
    if (valor >= 9) return "text-green-600 font-bold";
    if (valor >= 7) return "text-blue-600";
    if (valor >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  // Add a function to delete a grade
  const handleDeleteGrade = async (gradeId: number) => {
    try {
      if (!confirm('¿Estás seguro de que deseas eliminar esta calificación?')) {
        return;
      }
      
      await api.delete(`http://82.29.168.17:8226/api/v1/calificaciones/${gradeId}`);
      toast.success('Calificación eliminada correctamente');
      fetchGrades();
    } catch (error) {
      console.error('Error al eliminar calificación:', error);
      toast.error('Error al eliminar la calificación');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calificaciones</h1>
        <div className="flex gap-2">
          <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generar PDF de todas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Seleccionar Estudiante</DialogTitle>
                <DialogDescription>
                  Selecciona un estudiante para generar su reporte de calificaciones.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-pdf">Estudiante</Label>
                  <Select 
                    value={selectedUserForPDF}
                    onValueChange={setSelectedUserForPDF}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => generatePDF()}>Descargar PDF</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Award className="mr-2 h-4 w-4" />
                Nueva Calificación
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Calificación</DialogTitle>
                <DialogDescription>
                  Asigna una calificación a un estudiante en una clase específica.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user">Estudiante</Label>
                  <Select 
                    value={newGrade.userId}
                    onValueChange={(value) => setNewGrade({...newGrade, userId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="classroom">Clase</Label>
                  <Select 
                    value={newGrade.classroomId}
                    onValueChange={(value) => setNewGrade({...newGrade, classroomId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una clase" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id.toString()}>
                          {classroom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Calificación</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newGrade.value}
                    onChange={(e) => setNewGrade({...newGrade, value: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={newGrade.description}
                    onChange={(e) => setNewGrade({...newGrade, description: e.target.value})}
                    placeholder="Descripción o comentario"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateGrade}>Guardar Calificación</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra las calificaciones por clase, estudiante o término de búsqueda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="classroom-filter">Clase</Label>
              <Select 
                value={selectedClassroom}
                onValueChange={setSelectedClassroom}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las clases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las clases</SelectItem>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id.toString()}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-filter">Estudiante</Label>
              <Select 
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estudiantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estudiantes</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="search">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableCaption>Lista de calificaciones</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.length > 0 ? (
                  grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.userName}</TableCell>
                      <TableCell>{grade.classroomName}</TableCell>
                      <TableCell className={getGradeColor(grade.valor)}>
                        {grade.valor.toFixed(1)}
                      </TableCell>
                      <TableCell>{grade.descripcion}</TableCell>
                      <TableCell>
                        {new Date(grade.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => generatePDF(grade.userId)}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleDeleteGrade(grade.id)}
                            title="Eliminar calificación"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron calificaciones
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 