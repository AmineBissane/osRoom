"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Calendar,
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Paperclip,
  Download,
  Eye,
  Loader2,
  ExternalLink,
  ClipboardList,
  Video, // Add Video icon for the meet button
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

// Función para decodificar token JWT
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

interface Activity {
  id: number | string;
  name: string;
  description: string;
  classroomsIds?: number[];
  fileId?: string;
  dueDate?: Date;
  endDate?: Date | null;
  files?: File[];
  status?: 'pending' | 'submitted' | 'graded';
  grade?: number;
  isExpired?: boolean;
}

interface ActivityResponse {
  id: number | string;
  activityId: number | string;
  studentId: number | string;
  studentName: string;
  grade?: number;
  createdAt?: string;
  submissionDate?: string;
  gradedAt?: string;
  gradedBy?: string;
  responseFileId?: string;
  finalNote?: string;
}

interface ClassDetails {
  id: string;
  name: string;
  teacher: string;
  description: string;
  schedule: string;
}

// Mock data

const mockClass: ClassDetails = {
  id: "1",
  name: "Matemáticas Avanzadas",
  teacher: "Juan Pérez",
  description: "Curso avanzado de matemáticas que cubre cálculo diferencial e integral.",
  schedule: "Lunes, Miércoles y Viernes 10:00 AM"
}

const mockActivities: Activity[] = [
  
]

export default function ClassPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    dueDate: "",
    files: [] as File[]
  });
  const [classDetails, setClassDetails] = useState<ClassDetails>({
    id: id,
    name: "Cargando...",
    teacher: "",
    description: "",
    schedule: ""
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentResponses, setStudentResponses] = useState<ActivityResponse[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const router = useRouter();

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Obtener el token desde las cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
        
      if (!token) {
        console.error('No se encontró token de autenticación');
        toast.error('No se pudo autenticar al usuario');
        setIsLoading(false);
        return;
      }
      
      // Usar conexión directa al backend
      const directUrl = `http://82.29.168.17:8222/api/v1/activities/classrooms/${id}`;
      console.log(`Consultando actividades directamente al backend: ${directUrl}`);
      
      const directResponse = await fetch(directUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!directResponse.ok) {
        console.error(`Error al obtener actividades: ${directResponse.status}`);
        
        // Si falla, intentar con la API proxy
        const response = await fetchWithAuth(`/api/activities/classrooms/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status}`);
        }
        
        const data = await response.json();
        transformAndSetActivities(data);
        return;
      }
      
      const data = await directResponse.json();
      transformAndSetActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Error al cargar las actividades');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función auxiliar para transformar y establecer actividades
  const transformAndSetActivities = (data: any[]) => {
    // Transform API data to match our Activity interface
    const formattedActivities = data.map((item: any) => {
      // Parse the endDate from the API response
      const endDate = item.endDate ? new Date(item.endDate) : null;
      
      // Check if the activity has expired
      const isExpired = endDate ? new Date() > endDate : false;
      
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        classroomsIds: item.classroomsIds,
        fileId: item.fileId,
        endDate: endDate,
        status: 'pending' as const, // Tipado explícito para status
        isExpired: isExpired
      };
    });
    
    setActivities(formattedActivities);
  };

  const fetchStudentGrades = async () => {
    setLoadingGrades(true);
    try {
      // Obtener el ID del estudiante del token JWT
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      
      if (!token) {
        console.error('No se encontró token de autenticación');
        toast.error('No se pudo autenticar al usuario');
        setLoadingGrades(false);
        return;
      }
      
      // Decodificar el token para obtener la información del usuario
      const decodedToken = decodeJwt(token);
      if (!decodedToken) {
        console.error('Error al decodificar el token');
        toast.error('Error de autenticación');
        setLoadingGrades(false);
        return;
      }
      
      // Obtener el ID del usuario del token
      const userId = decodedToken.sub;
      console.log('ID del usuario obtenido del token:', userId);
      
      if (!userId) {
        console.error('No se pudo identificar el ID del usuario desde el token');
        toast.error('Error al identificar usuario');
        setLoadingGrades(false);
        return;
      }

      // Método directo usando las actividades ya cargadas
      if (activities.length > 0) {
        console.log(`Obteniendo calificaciones para ${activities.length} actividades en la clase ${id}`);
        
        // Crear un array para todas las respuestas
        const allResponses: ActivityResponse[] = [];
        
        // Para cada actividad, buscar respuestas del estudiante
        for (const activity of activities) {
          try {
            console.log(`Consultando respuestas para actividad ${activity.id} y usuario ${userId}`);
            
            // Consulta directa al backend
            const responseUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activity.id}/user/${userId}`;
            const response = await fetch(responseUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(`Respuestas para actividad ${activity.id}:`, data);
              
              // Si hay respuestas, agregarlas al array
              if (Array.isArray(data) && data.length > 0) {
                // Marcar actividades con respuestas como "submitted"
                const activityIndex = activities.findIndex(a => a.id === activity.id);
                if (activityIndex !== -1) {
                  const updatedActivities = [...activities];
                  
                  // Determinar el estado de la actividad basado en la respuesta
                  if (data[0].grade !== undefined && data[0].grade !== null) {
                    updatedActivities[activityIndex].status = 'graded';
                    updatedActivities[activityIndex].grade = data[0].grade;
                  } else {
                    updatedActivities[activityIndex].status = 'submitted';
                  }
                  
                  setActivities(updatedActivities);
                }
                
                // Agregar respuestas al array
                allResponses.push(...data.map((resp: any) => ({
                  ...resp,
                  activityId: activity.id // Asegurar que tengamos el ID de la actividad
                })));
              }
            } else {
              console.warn(`Error al obtener respuestas para actividad ${activity.id}: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error al obtener respuestas para actividad ${activity.id}:`, error);
          }
        }
        
        console.log('Todas las respuestas obtenidas:', allResponses);
        setStudentResponses(allResponses);
      }
    } catch (error) {
      console.error('Error al obtener calificaciones:', error);
      toast.error('Error al cargar calificaciones');
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'activities') {
      fetchActivities();
    } else if (value === 'grades') {
      // Force loading grades when the tab is selected
      console.log('Loading grades for student...');
      fetchStudentGrades();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Function to check if user has already submitted a response to an activity
  const checkUserSubmission = async (activityId: string | number) => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        console.error('No token found');
        return false;
      }
      
      // Get user ID from token
      const decodedToken = decodeJwt(token);
      if (!decodedToken || !decodedToken.sub) {
        console.error('No se pudo obtener el ID de usuario del token');
        return false;
      }
      
      const userId = decodedToken.sub;
      console.log('Verificando entregas para el usuario:', userId);
      
      // Use our proxy API endpoint
      const response = await fetch(`/api/proxy/activitiesresponses/activity/${activityId}/user/${userId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Respuestas encontradas:', data);
        
        // Si hay alguna respuesta, el usuario ya ha enviado
        const hasSubmitted = Array.isArray(data) && data.length > 0;
        console.log('El usuario ya ha enviado:', hasSubmitted);
        
        return hasSubmitted;
      }
      
      console.log('No se encontraron respuestas para el usuario actual');
      return false;
    } catch (error) {
      console.error('Error al verificar entregas del usuario:', error);
      return false;
    }
  };

  const handleActivitySubmit = async (activityId: string | number) => {
    // First check if the activity already has a status of submitted or graded in our local state
    const activity = activities.find(a => a.id === activityId);
    if (activity?.status === 'submitted' || activity?.status === 'graded') {
      toast.info('Ya has enviado una respuesta para esta actividad');
      return;
    }
    
    // Then also check with the backend to be sure
    const hasSubmitted = await checkUserSubmission(activityId);
    if (hasSubmitted) {
      toast.info('Ya has enviado una respuesta para esta actividad');
      
      // Update the activity status in our local state
      const updatedActivities = activities.map(a => 
        a.id === activityId ? { ...a, status: 'submitted' as const } : a
      );
      setActivities(updatedActivities);
      
      return;
    }
    
    // If no submission exists, navigate to activity page
    router.push(`/activity/${activityId}`);
  };

  const handleCreateActivity = async () => {
    try {
      // Get the JWT token directly from cookies
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('No se encontró sesión activa');
        router.replace('/login');
        return;
      }
  
      // Create a FormData object to send to the backend
      const formData = new FormData();
      formData.append('name', newActivity.title);
      formData.append('description', newActivity.description);
      
      // Format the date as ISO string for the backend
      // Usar el formato exacto que se muestra en Postman: YYYY-MM-DD HH:MM:SS
      const date = new Date(newActivity.dueDate);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      formData.append('endDate', formattedDate);
      
      // Usar el valor simple para classroomsIds como se muestra en Postman
      formData.append('classroomsIds', id); // O usar '2' si ese es el ID específico que necesitas
      
      // Log all form data for debugging
      console.log('Form data being sent:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      // Handle file upload if present
      if (newActivity.files.length > 0) {
        formData.append('file', newActivity.files[0]);
        console.log('Adding file:', newActivity.files[0].name);
      }
      
      console.log('Sending request to backend API: http://82.29.168.17:8222/api/v1/activities');
      
      // Send the request with FormData
      const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO ESTABLECER Content-Type - el navegador lo configurará automáticamente con el boundary para form-data
        },
        body: formData
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          // Try to get JSON error message
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorText = JSON.stringify(errorData);
        } catch (e) {
          // If not JSON, get as text
          errorText = await response.text();
        }
        console.error('Error creating activity:', errorText);
        toast.error(`Error al crear actividad: ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Activity created successfully:', data);
      toast.success('Actividad creada correctamente');
      
      // Reset form and refresh activities
      setNewActivity({
        title: '',
        description: '',
        dueDate: '',
        files: []
      });
      fetchActivities();
      
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Error al crear la actividad');
    }
  };

  const downloadFile = async (fileId: string) => {
    try {
      // Use our API proxy instead of direct backend call - with preview=false for download
      const response = await fetchWithAuth(`/api/file-storage/download/${fileId}?preview=false`, {
        responseType: 'blob'
      });
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `file-${fileId}`; // You can set a better filename if available
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
    }
  };
  
  // Function to get the file URL for viewing/downloading
  const getFileUrl = (fileId: string, preview: boolean = true) => {
    // Use our API proxy instead of direct backend call
    return `/api/file-storage/download/${fileId}${preview ? '?preview=true' : ''}`;
  };
  
  // DocumentPreview component moved here
  const DocumentPreview = ({ fileId }: { fileId: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isNonViewableFile, setIsNonViewableFile] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const [fileType, setFileType] = useState<string>("archivo");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    // Lista de extensiones de archivo que no se pueden visualizar
    const nonViewableExtensions = useMemo(() => [
      '.zip', '.rar', '.7z', '.tar', '.gz', '.exe', '.msi', 
      '.jar', '.war', '.ear', '.bin', '.iso', '.dmg', '.pkg',
      '.apk', '.app', '.bat', '.cmd', '.sh'
    ], []);
    
    // Función para comprobar si un archivo es no visualizable por su extensión
    const isNonViewableExtension = useCallback((filename: string) => {
      const lowerFilename = filename.toLowerCase();
      return nonViewableExtensions.some(ext => lowerFilename.endsWith(ext));
    }, [nonViewableExtensions]);
    
    // Función para obtener el tipo de archivo a partir de su nombre
    const getFileTypeFromName = useCallback((filename: string) => {
      const lowerFilename = filename.toLowerCase();
      
      if (lowerFilename.endsWith('.zip')) return "ZIP";
      if (lowerFilename.endsWith('.rar')) return "RAR";
      if (lowerFilename.endsWith('.7z')) return "7-Zip";
      if (lowerFilename.endsWith('.tar') || lowerFilename.endsWith('.gz')) return "TAR";
      if (lowerFilename.endsWith('.exe') || lowerFilename.endsWith('.msi')) return "ejecutable";
      if (lowerFilename.endsWith('.jar') || lowerFilename.endsWith('.war')) return "Java";
      
      // Extraer la extensión del archivo
      const extension = lowerFilename.split('.').pop();
      return extension ? extension.toUpperCase() : "archivo";
    }, []);
    
    // Check if the file is viewable or not
    useEffect(() => {
      if (!fileId) return;
      
      // Primero, verificar si el fileId ya contiene información sobre el tipo de archivo
      if (typeof fileId === 'string') {
        const lowerFileId = fileId.toLowerCase();
        
        // Intentar extraer el nombre del archivo del fileId
        const possibleFileName = fileId.split('/').pop() || fileId;
        
        // Si el fileId contiene una extensión no visualizable
        if (isNonViewableExtension(possibleFileName)) {
          console.log(`Detectado archivo no visualizable por fileId: ${possibleFileName}`);
          setFileName(possibleFileName);
          setFileType(getFileTypeFromName(possibleFileName));
          setIsNonViewableFile(true);
          setIsLoading(false);
          return;
        }
      }
      
      // Si no se detecta por fileId, intentar obtener metadatos
      const fetchFileInfo = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          // First, try to get metadata about the file
          const metadataResponse = await fetch(`/api/proxy/file-storage/${fileId}/metadata`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!metadataResponse.ok) {
            throw new Error(`Failed to fetch file metadata: ${metadataResponse.status}`);
          }
          
          const metadata = await metadataResponse.json();
          console.log('File metadata:', metadata);
          
          // Set file name and type from metadata
          if (metadata.name) {
            setFileName(metadata.name);
            
            // Detect file type from extension
            const extension = metadata.name.toLowerCase().split('.').pop();
            if (extension) {
              if (['pdf'].includes(extension)) {
                setFileType('PDF');
              } else if (['doc', 'docx'].includes(extension)) {
                setFileType('Word');
              } else if (['xls', 'xlsx'].includes(extension)) {
                setFileType('Excel');
              } else if (['ppt', 'pptx'].includes(extension)) {
                setFileType('PowerPoint');
              } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
                setFileType('imagen');
              } else if (['txt', 'md'].includes(extension)) {
                setFileType('texto');
              } else {
                setFileType(`archivo ${extension}`);
              }
              
              // Check if this is a non-viewable file type
              if (nonViewableExtensions.some(ext => metadata.name.toLowerCase().endsWith(ext))) {
                setIsNonViewableFile(true);
                setIsLoading(false);
                return;
              }
            }
          }
          
          // Now check if we can preview the file
          const headResponse = await fetch(`/api/proxy/file-storage/${fileId}?preview=true`, {
            method: 'HEAD'
          });
          
          if (!headResponse.ok) {
            throw new Error(`File preview not available: ${headResponse.status}`);
          }
          
          // If we got here, file should be viewable
          setIsLoading(false);
          
        } catch (error) {
          console.error('Error fetching file info:', error);
          setError(error instanceof Error ? error.message : 'Error loading file preview');
          setIsLoading(false);
        }
      };
      
      fetchFileInfo();
    }, [fileId, isNonViewableExtension, getFileTypeFromName, fileName]);
    
    // Efecto para controlar cargas y timeouts
    useEffect(() => {
      // Skip timeout for non-viewable files
      if (isNonViewableFile) {
        setIsLoading(false);
        return;
      }
      
      // Timeout de seguridad (20 segundos)
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log("Timeout de carga de documento alcanzado");
          setError("El documento no pudo cargarse. Intente descargarlo.");
          setIsLoading(false);
        }
      }, 20000);
      
      return () => clearTimeout(timeout);
    }, [isLoading, isNonViewableFile]);
    
    // Efecto para descargar automáticamente archivos no visualizables
    // Este efecto debe estar fuera de condiciones para mantener el orden de los hooks
    useEffect(() => {
      if (isNonViewableFile && fileId) {
        console.log('Iniciando descarga automática del archivo no visualizable');
        const timer = setTimeout(() => {
          downloadFile(fileId);
        }, 1000); // Retraso para evitar problemas con múltiples descargas
        
        return () => clearTimeout(timer);
      }
    }, [isNonViewableFile, fileId]);
    
    // Vista para archivos no visualizables (ZIP, executable, etc.)
    if (isNonViewableFile) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex justify-center">
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => downloadFile(fileId)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar archivo {fileType}
            </Button>
          </div>
          
          <div className="w-full border rounded-md p-6 bg-gray-50 flex flex-col items-center justify-center">
            <div className="bg-blue-50 rounded-full p-4 mb-4">
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">{fileName || `Archivo ${fileType}`}</h3>
            <p className="text-muted-foreground text-center mb-4">
              Los archivos {fileType} no se pueden previsualizar. Haga clic en el botón de descarga para obtener el archivo.
            </p>
          </div>
        </div>
      );
    }
    
    // Si hay error, mostrar mensaje y botón de descarga
    if (error) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex justify-center">
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => downloadFile(fileId)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar archivo
            </Button>
          </div>
          
          <div className="w-full h-96 border rounded flex items-center justify-center bg-gray-50">
            <div className="text-center p-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <p className="text-muted-foreground mb-2">{error}</p>
              <Button 
                variant="secondary"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  setRetryCount(c => c + 1);
                }}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // iframe para vista previa
    return (
      <div className="w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <div className="flex justify-end mb-2 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => downloadFile(fileId)}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
        
        <iframe
          ref={iframeRef}
          key={`${fileId}-${retryCount}`}
          src={`http://82.29.168.17:8222/api/v1/file-storage/${fileId}?preview=true`}
          className="w-full h-[600px] border rounded"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError("No se pudo cargar el documento");
            setIsLoading(false);
          }}
        />
      </div>
    );
  };
  
  // Use effect to fetch activities when component loads
  useEffect(() => {
    fetchActivities();
    // Here you would also fetch class details
    // For now we'll use mock data
    setClassDetails({
      id: id,
      name: "Matemáticas Avanzadas",
      teacher: "Juan Pérez",
      description: "Curso avanzado de matemáticas que cubre cálculo diferencial e integral.",
      schedule: "Lunes, Miércoles y Viernes 10:00 AM"
    });
  }, [id]);

  // Add a function to handle joining the meet
  const handleJoinMeet = () => {
    // Redirect to the LiveKit endpoint with classroom name and ID
    window.location.href = `http://82.29.168.17:3001/rooms/${classDetails.name.replace(/\s+/g, '')}${id}`;
    // Alternatively, if you want to use Next.js router:
    // router.push(`http://82.29.168.17:3000/${classDetails.name.replace(/\s+/g, '')}${id}`);
  };

  // Modify the activities useEffect to also filter student responses once activities are loaded
  useEffect(() => {
    if (activities.length > 0 && studentResponses.length > 0) {
      // Filter responses to only show those for activities in this class
      const activityIds = activities.map(a => a.id.toString());
      const filteredResponses = studentResponses.filter(response => 
        activityIds.includes(response.activityId.toString())
      );
      
      if (filteredResponses.length !== studentResponses.length) {
        setStudentResponses(filteredResponses);
        console.log(`Filtered to ${filteredResponses.length} responses for this classroom`);
      }
    }
  }, [activities, studentResponses]);

  // Add a function to get the activity name from its ID
  const getActivityName = (activityId: string | number): string => {
    if (!activityId) {
      return 'Actividad desconocida';
    }
    
    // Convertir ambos a string para comparación
    const activityIdStr = String(activityId);
    
    const activity = activities.find(a => String(a.id) === activityIdStr);
    return activity ? activity.name : `Actividad ${activityId}`;
  };

  // Add activity status badge component
  const ActivityStatusBadge = ({ status, grade }: { status?: string, grade?: number }) => {
    if (!status || status === 'pending') return null;
    
    if (status === 'submitted') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Entregado
        </Badge>
      );
    }
    
    if (status === 'graded' && grade !== undefined) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Calificación: {grade}/10
        </Badge>
      );
    }
    
    return null;
  };

  // Add a function to handle classroom deletion
  const handleDeleteClassroom = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar esta clase? Esta acción no se puede deshacer.")) {
      try {
        // Obtener el token
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];
          
        if (!token) {
          toast.error('No se encontró token de autenticación');
          return;
        }
        
        // Realizar la solicitud de eliminación
        const response = await fetch(`http://82.29.168.17:8222/api/v1/classrooms/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al eliminar: ${response.status}`);
        }
        
        toast.success('Clase eliminada correctamente');
        // Redirigir a la página de cursos
        setTimeout(() => {
          router.push('/courses');
        }, 1000);
      } catch (error) {
        console.error('Error al eliminar la clase:', error);
        toast.error('Error al eliminar la clase');
      }
    }
  };

  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{classDetails.name}</h1>
          <p className="text-muted-foreground">Prof. {classDetails.teacher}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleJoinMeet}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Video className="h-4 w-4 mr-2" />
            Join Meet
          </Button>
          
          <Button 
            onClick={handleDeleteClassroom}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Clase
          </Button>
        </div>
      </div>

      <Tabs defaultValue="activities" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="forum">Foro</TabsTrigger>
          <TabsTrigger value="grades">Calificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Actividades</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Actividad
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Crear nueva actividad
                      </DialogTitle>
                      <DialogDescription>
                        Completa los detalles para crear una nueva actividad para esta clase.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity-title">
                          Título <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="activity-title"
                          placeholder="Ej: Proyecto Final de Programación"
                          value={newActivity.title}
                          onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity-description">
                          Descripción <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="activity-description"
                          placeholder="Instrucciones detalladas para los estudiantes..."
                          value={newActivity.description}
                          onChange={(e) => 
                            setNewActivity({ ...newActivity, description: e.target.value })
                          }
                          className="min-h-[120px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity-dueDate">
                          Fecha de Entrega <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="activity-dueDate"
                          type="datetime-local"
                          value={newActivity.dueDate}
                          onChange={(e) => setNewActivity({ ...newActivity, dueDate: e.target.value })}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">Fecha límite para la entrega de la actividad</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity-files">
                          Archivos (Opcional)
                        </Label>
                        <div className="border rounded-md p-4 bg-muted/30">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Paperclip className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                              Arrastra y suelta tus archivos aquí o
                            </p>
                            <Input
                              id="activity-files"
                              type="file"
                              multiple
                              onChange={(e) => setNewActivity({ ...newActivity, files: Array.from(e.target.files || []) })}
                              className="max-w-xs"
                            />
                          </div>
                          {newActivity.files && newActivity.files.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {Array.from(newActivity.files).map((file, index) => (
                                <div key={index} className="p-2 border rounded-md flex items-center justify-between bg-background">
                                  <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-primary" />
                                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                  </div>
                                  <Badge variant="outline">{Math.round(file.size / 1024)} KB</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateActivity} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Actividad
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.map((activity) => (
                    <Card key={activity.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg mb-1">
                              {activity.name}
                            </CardTitle>
                            {activity.status && (
                              <ActivityStatusBadge status={activity.status} grade={activity.grade} />
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.push(`/activity/${activity.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {activity.description || "Sin descripción disponible"}
                        </p>
                        
                        {activity.endDate && (
                          <div className="flex items-center text-xs text-muted-foreground mb-3">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>
                              Fecha límite: {format(activity.endDate, "PPP", { locale: es })}
                            </span>
                            {activity.isExpired && (
                              <Badge variant="destructive" className="ml-2 text-[10px] px-1">Expirado</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center py-12">
                  <p className="text-muted-foreground">No hay actividades disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forum" className="space-y-6">
          {/* Forum content */}
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calificaciones</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Calificación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Crear nueva calificación
                      </DialogTitle>
                      <DialogDescription>
                        Completa los detalles para crear una nueva calificación para esta clase.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-id">
                          ID del Estudiante <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="student-id"
                          placeholder="Ej: 123456789"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity-id">
                          ID de la Actividad <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="activity-id"
                          placeholder="Ej: 1"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="grade">
                          Calificación <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="grade"
                          type="number"
                          placeholder="Ej: 9.5"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Calificación
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGrades ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : studentResponses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studentResponses.map((response) => (
                    <Card key={response.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>
                            {getActivityName(response.activityId)}
                          </CardTitle>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {response.grade ? response.grade.toFixed(2) : 'Sin calificar'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleActivitySubmit(response.activityId)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center py-12">
                  <p className="text-muted-foreground">No hay calificaciones disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}