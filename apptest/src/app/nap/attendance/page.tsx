"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ClipboardCheck, Save, Calendar, Loader2, Users, X, Check } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import { getClassCategoryFromToken, decodeToken } from "@/utils/auth"

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  class?: string;
}

interface Classroom {
  id: number;
  name: string;
  description?: string;
  students?: User[];
}

interface AttendanceRecord {
  id?: number;
  userId: string;
  userName?: string;
  classroomId: number;
  classroomName?: string;
  fecha: string;
  presente: boolean;
  observaciones?: string;
  class?: string;
  estado?: string;
}

export default function AttendancePage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("DAM");

  useEffect(() => {
    fetchClassrooms();
    loadAvailableClasses();
    
    // Attempt to preload real users directly from backend
    const preloadUsers = async () => {
      try {
        // Use a timeout to avoid hanging on the request
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching users')), 5000)
        );
        
        // Race the actual request against the timeout
        await Promise.race([
          api.get('http://82.29.168.17:8226/api/v1/users'),
          timeoutPromise
        ]);
        
        console.log('Successfully preloaded users from backend');
      } catch (error) {
        console.warn('Failed to preload users, will try alternative sources:', error);
        // Silently fail - we'll try other endpoints when needed
      }
    };
    
    preloadUsers();
  }, []);

  useEffect(() => {
    if (selectedClassroom) {
      fetchStudentsForClassroom(selectedClassroom.id);
    }
  }, [selectedClassroom, attendanceDate, selectedClass]);

  // Guardar asistencia automáticamente cuando se cambia
  useEffect(() => {
    // Solo guardar si hay registros y ya han sido inicializados (no es la primera carga)
    if (attendanceRecords.length > 0 && !loading && selectedClassroom) {
      // Utilizamos un temporizador para no guardar en cada pequeño cambio
      const saveTimer = setTimeout(() => {
        saveAttendanceToLocalStorage();
      }, 500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [attendanceRecords, loading]);

  // Guardar en localStorage para persistencia local
  const saveAttendanceToLocalStorage = () => {
    try {
      const key = `attendance_${selectedClassroom?.id}_${selectedClass}_${attendanceDate}`;
      localStorage.setItem(key, JSON.stringify(attendanceRecords));
      console.log(`Guardado temporal de asistencia para ${key}`);
    } catch (error) {
      console.warn('Error guardando asistencia en localStorage:', error);
    }
  };

  // Recuperar del localStorage si existe
  const getAttendanceFromLocalStorage = (classroomId: number, classCategory: string, date: string) => {
    try {
      const key = `attendance_${classroomId}_${classCategory}_${date}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        console.log(`Recuperando asistencia guardada para ${key}`);
        return JSON.parse(saved) as AttendanceRecord[];
      }
    } catch (error) {
      console.warn('Error recuperando asistencia de localStorage:', error);
    }
    return null;
  };

  const loadAvailableClasses = async () => {
    try {
      // Get the current token and extract the user's class
      const token = api.getToken();
      if (!token) return;

      // Get the current user's class as default
      const userClass = getClassCategoryFromToken(token);
      
      // Only include DAM and DAW classes
      const availableClasses = ["DAM", "DAW"];
      
      setAvailableClasses(availableClasses);
      
      // If user has a class, select it by default
      if (userClass && availableClasses.includes(userClass)) {
        setSelectedClass(userClass);
      } else {
        // If no matching class or no user class, default to DAM
        setSelectedClass("DAM");
      }
    } catch (error) {
      console.error('Error loading class categories:', error);
      
      // Fallback with only DAM and DAW
      setAvailableClasses(["DAM", "DAW"]);
      setSelectedClass("DAM");
    }
  };

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await api.get<Classroom[]>('http://82.29.168.17:8226/api/v1/classrooms')
        .catch(error => {
          console.error('Error fetching classrooms:', error);
          return null;
        });
        
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Classrooms fetched:', data.length);
        setClassrooms(data);
        return;
      }
      
      // Try the my-classrooms endpoint as fallback
      const myClassrooms = await api.get<Classroom[]>('http://82.29.168.17:8226/api/v1/classrooms/my-classrooms')
        .catch(error => {
          console.error('Error fetching my classrooms:', error);
          return null;
        });
        
      if (myClassrooms && Array.isArray(myClassrooms) && myClassrooms.length > 0) {
        console.log('My classrooms fetched:', myClassrooms.length);
        setClassrooms(myClassrooms);
        return;
      }
      
      // If all else fails, use dummy classrooms
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
      
      setClassrooms(dummyClassrooms);
    } catch (error) {
      console.error('Fatal error fetching classrooms:', error);
      toast.error('Error al cargar clases. Usando datos de prueba.');
      
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
      
      setClassrooms(dummyClassrooms);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForClassroom = async (classroomId: number) => {
    try {
      setLoading(true);

      // Intentar recuperar del localStorage primero
      const savedRecords = getAttendanceFromLocalStorage(classroomId, selectedClass, attendanceDate);
      if (savedRecords && savedRecords.length > 0) {
        console.log(`Usando ${savedRecords.length} registros de asistencia guardados localmente`);
        setAttendanceRecords(savedRecords);
        setLoading(false);
        return;
      }

      // Primero intentamos obtener los registros de asistencia existentes para esta fecha
      const attendanceResponse = await api.get<AttendanceRecord[]>(`http://82.29.168.17:8226/api/v1/asistencias?classroomId=${classroomId}&fecha=${attendanceDate}`)
        .catch(error => {
          console.warn('Error fetching existing attendance:', error);
          return [];
        });
        
      let existingAttendance: AttendanceRecord[] = attendanceResponse || [];

      // Try to get real students from Keycloak first
      let students: User[] = [];
      
      try {
        // Make direct call to Keycloak users endpoint through our backend
        const keycloakUsers = await Promise.race([
          api.get<any[]>('http://82.29.168.17:8226/api/v1/users'),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout fetching users from Keycloak')), 3000)
          )
        ]).catch(error => {
          console.warn('Error fetching users from Keycloak:', error);
          return null;
        });
          
        if (keycloakUsers && Array.isArray(keycloakUsers) && keycloakUsers.length > 0) {
          console.log(`Found ${keycloakUsers.length} users from Keycloak`);
          
          // Filter users by class if needed
          const filteredUsers = keycloakUsers.filter(user => {
            // Extract class from user
            let userClass = null;
            
            // Check different ways the class might be stored
            if (user.class) {
              userClass = user.class;
            } else if (user.classCategory) {
              userClass = user.classCategory;
            } else if (user.attributes && user.attributes.class) {
              userClass = Array.isArray(user.attributes.class) 
                ? user.attributes.class[0] 
                : user.attributes.class;
            }
            
            // Match the selected class
            if (userClass && typeof userClass === 'string') {
              if (userClass.includes(',')) {
                // Handle comma-separated classes
                return userClass.split(',')
                  .map(c => c.trim())
                  .some(c => c.toLowerCase() === selectedClass.toLowerCase());
              } else {
                return userClass.toLowerCase() === selectedClass.toLowerCase();
              }
            }
            
            return false;
          });
          
          console.log(`Found ${filteredUsers.length} users in class ${selectedClass}`);
          
          // Map to our User interface
          students = filteredUsers.map(user => ({
            id: user.id || user.sub || '',
            firstName: user.firstName || user.given_name || '',
            lastName: user.lastName || user.family_name || '',
            username: user.username || user.preferred_username || '',
            email: user.email || '',
            class: user.class || user.classCategory || selectedClass
          }));
        }
      } catch (error) {
        console.error('Error getting users directly from Keycloak:', error);
      }
      
      // If no students from Keycloak, try getting them from the classroom
      if (students.length === 0) {
        try {
          // Try the dedicated students endpoint that should pull from Keycloak
          const studentsResponse = await api.get<any[]>(`http://82.29.168.17:8226/api/v1/classrooms/${classroomId}/students`);
          
          if (studentsResponse && Array.isArray(studentsResponse) && studentsResponse.length > 0) {
            console.log(`Found ${studentsResponse.length} students for classroom ${classroomId}`);
            
            // Map response to our User interface
            students = studentsResponse.map(student => ({
              id: student.id || '',
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              username: student.username || '',
              email: student.email || '',
              class: student.class || selectedClass
            }));
            
            // Filter by class if needed
            if (selectedClass) {
              console.log(`Filtering students by class: ${selectedClass}`);
              const filtered = students.filter(student => {
                // Handle various class attribute formats
                if (!student.class) return false;
                
                // Handle comma-separated classes
                if (student.class.includes(',')) {
                  return student.class.split(',')
                    .map(c => c.trim())
                    .some(c => c.toLowerCase() === selectedClass.toLowerCase());
                }
                
                return student.class.toLowerCase() === selectedClass.toLowerCase();
              });
              
              console.log(`Found ${filtered.length} students in class ${selectedClass}`);
              students = filtered;
            }
          }
        } catch (error) {
          console.warn('Error fetching students from dedicated endpoint:', error);
        }
      }
      
      // If still no students, try with classroom details
      if (students.length === 0) {
        try {
          const classroom = await api.get<Classroom>(`http://82.29.168.17:8226/api/v1/classrooms/${classroomId}`);
          if (classroom && classroom.students && Array.isArray(classroom.students)) {
            students = classroom.students;
            
            // Filter by class if needed
            if (selectedClass) {
              students = students.filter(student => {
                if (!student.class) return false;
                
                // Handle comma-separated classes
                if (student.class.includes(',')) {
                  return student.class.split(',')
                    .map(c => c.trim())
                    .some(c => c.toLowerCase() === selectedClass.toLowerCase());
                }
                
                return student.class.toLowerCase() === selectedClass.toLowerCase();
              });
            }
          }
        } catch (secondError) {
          console.error('Error fetching classroom details:', secondError);
        }
      }
      
      // If still no students, as a LAST resort, create real-looking students
      if (students.length === 0) {
        console.warn('No real students found for class', selectedClass);
        // Instead of creating dummy students, leave the list empty
        toast.warning(`No se han encontrado estudiantes para el curso ${selectedClass}. Por favor, añada estudiantes a través del sistema.`);
      }

      // Creamos registros de asistencia para cada estudiante, usando los existentes si ya hay
      const records: AttendanceRecord[] = students.map((student: User) => {
        // Primero buscar en registros existentes del servidor
        const existingRecord = existingAttendance.find(record => record.userId === student.id);
        
        if (existingRecord) {
          return existingRecord;
        } 
        // Si no hay registro en el servidor, crear uno nuevo
        else {
          return {
            userId: student.id,
            userName: `${student.firstName} ${student.lastName}`,
            classroomId: classroomId,
            classroomName: selectedClassroom?.name,
            fecha: attendanceDate,
            presente: false,
            observaciones: '',
            class: student.class,
            estado: "AUSENTE"
          };
        }
      });

      setAttendanceRecords(records);
      
      // Guardar en localStorage para persistencia
      setTimeout(() => {
        if (records.length > 0) {
          saveAttendanceToLocalStorage();
        }
      }, 500);
    } catch (error) {
      console.error('Fatal error fetching data:', error);
      toast.error('Error al cargar datos de asistencia');
      
      // Set empty records to avoid UI breaking
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (userId: string, present: boolean) => {
    console.log(`Cambiando asistencia para ${userId} a ${present ? 'presente' : 'ausente'}`);
    setAttendanceRecords(records => {
      const newRecords = records.map(record => 
        record.userId === userId 
          ? { 
              ...record, 
              presente: present,
              // También actualizar el campo estado si existe
              estado: present ? "PRESENTE" : "AUSENTE"
            } 
          : record
      );
      // Devolver inmediatamente para actualización de UI
      return newRecords;
    });
  };

  const handleObservationChange = (userId: string, observation: string) => {
    setAttendanceRecords(records => 
      records.map(record => 
        record.userId === userId 
          ? { ...record, observaciones: observation } 
          : record
      )
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const savedRecords = await api.post<AttendanceRecord[]>('http://82.29.168.17:8226/api/v1/asistencias/batch', attendanceRecords);
      
      // Actualizar los registros con los IDs asignados
      setAttendanceRecords(savedRecords);
      
      // Guardar también en localStorage
      saveAttendanceToLocalStorage();
      
      toast.success('Asistencia guardada correctamente');
    } catch (error) {
      console.error('Error:', error);
      // Intentar guardar localmente aunque falle el servidor
      saveAttendanceToLocalStorage();
      toast.warning('No se pudo guardar en el servidor, pero se guardó localmente');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Control de Asistencia</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Clase y Fecha</CardTitle>
          <CardDescription>Elige la clase, curso y la fecha para registrar la asistencia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="classroom">Clase</Label>
              <Select 
                value={selectedClassroom?.id.toString() || ""}
                onValueChange={(value) => {
                  const classroom = classrooms.find(c => c.id.toString() === value);
                  setSelectedClassroom(classroom || null);
                }}
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
              <Label htmlFor="group">Curso</Label>
              <Select 
                value={selectedClass}
                onValueChange={(value) => setSelectedClass(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((classGroup) => (
                    <SelectItem key={classGroup} value={classGroup}>
                      {classGroup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
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
      ) : selectedClassroom ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Asistencia para {selectedClassroom.name} - Curso {selectedClass} - {formatDate(attendanceDate)}
            </CardTitle>
            <CardDescription>
              {attendanceRecords.length > 0 
                ? `Marcando asistencia para ${attendanceRecords.length} estudiantes de ${selectedClass}`
                : `No se han encontrado estudiantes para el curso ${selectedClass}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Estudiante</TableHead>
                  <TableHead className="w-[100px]">Curso</TableHead>
                  <TableHead className="w-[250px]">Asistencia</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.userId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {!record.presente ? (
                            <X className="h-5 w-5 text-red-500" />
                          ) : (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                          {record.userName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.class || selectedClass}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant={record.presente ? "default" : "outline"}
                            onClick={() => handleAttendanceChange(record.userId, true)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Presente
                          </Button>
                          <Button 
                            size="sm" 
                            variant={!record.presente ? "destructive" : "outline"}
                            onClick={() => handleAttendanceChange(record.userId, false)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Ausente
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Observaciones (opcional)"
                          value={record.observaciones || ''}
                          onChange={(e) => handleObservationChange(record.userId, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {selectedClass === "DAW"
                            ? `No hay estudiantes en el curso DAW para esta clase`
                            : selectedClass === "DAM"
                              ? `No hay estudiantes en el curso DAM para esta clase`
                              : "No hay estudiantes en esta clase"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Los estudiantes deben ser añadidos a través del sistema de administración
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={saveAttendance} 
              disabled={saving || attendanceRecords.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Asistencia
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Selecciona una clase</h3>
          <p className="text-muted-foreground mt-2">
            Por favor, selecciona una clase para registrar la asistencia.
          </p>
        </div>
      )}
    </div>
  );
} 