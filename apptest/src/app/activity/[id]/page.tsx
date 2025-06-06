"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  FileText,
  Upload,
  Download,
  Eye,
  XCircle,
  Loader2,
  ArrowLeft,
  Users,
  User,
  Clock,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { fetchWithAuth, getCurrentUserId, getCurrentUsername } from '@/utils/fetchWithAuth'
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

interface Activity {
  id: number | string;
  name: string;
  description: string;
  classroomsIds?: number[];
  fileId?: string;
  endDate?: Date;
  files?: File[];
  status?: 'pending' | 'submitted' | 'graded';
  grade?: number;
  isExpired?: boolean;
}

interface ActivityResponse {
  id: number | string;
  studentId: number | string;
  studentName: string;
  submissionDate?: string;
  createdAt?: string;
  created?: string;
  fileId?: string;
  fileURL?: string;
  responseFileId?: string;
  finalNote?: string;
  note?: string;
  grade?: number;
  gradedBy?: string;
  gradedAt?: string;
}

// Function to decode JWT token
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

// Input para la calificación con mejor manejo de eventos
const GradeInput = React.memo(({ 
  value, 
  onChange, 
  onSave, 
  disabled 
}: { 
  value: string, 
  onChange: (value: string) => void, 
  onSave: () => void, 
  disabled: boolean 
}) => {
  // Referencia para el input
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Manejador local para capturar el cambio sin propagar eventos
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(e.target.value);
  }, [onChange]);
  
  // Manejador para la tecla Enter que guarda directamente
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Si presiona Enter, guardar la calificación
    if (e.key === 'Enter' && !disabled && !isProcessing) {
      e.preventDefault();
      console.log('Enter key pressed, saving grade');
      
      try {
        onSave();
      } catch (error) {
        console.error('Error al guardar calificación:', error);
      }
      
      // Asegurar que el loader no quede activo permanentemente
      setTimeout(() => {
        console.log('Resetting processing state after timeout');
        setIsProcessing(false);
      }, 2000); // Timeout de seguridad de 2 segundos
    }
  }, [disabled, onSave, isProcessing]);
  
  // Manejador del botón de guardar
  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) {
      console.log('Ya está procesando, ignorando clic');
      return;
    }
    
    console.log('Save button clicked, setting processing state');
    setIsProcessing(true);
    
    try {
      onSave();
    } catch (error) {
      console.error('Error al guardar calificación:', error);
    }
    
    // Asegurar que el loader no quede activo permanentemente
    setTimeout(() => {
      console.log('Resetting processing state after timeout');
      setIsProcessing(false);
    }, 2000); // Timeout de seguridad de 2 segundos
  }, [onSave, isProcessing]);
  
  // Enfoca el input cuando se monta el componente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Efecto para resetear el estado de procesamiento cuando cambia el estado disabled externo
  useEffect(() => {
    if (disabled) {
      console.log('Setting processing state false due to disabled prop');
      setIsProcessing(false);
    }
  }, [disabled]);
  
  // Efecto para limpiar el estado de procesamiento al desmontar
  useEffect(() => {
    return () => {
      console.log('Cleaning up processing state on unmount');
      setIsProcessing(false);
    };
  }, []);
  
  return (
    <div 
      className="flex items-center gap-2" 
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Input 
        ref={inputRef}
        type="number" 
        min="0" 
        max="10" 
        step="0.1"
        placeholder="Calificación (0-10)" 
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full"
        disabled={disabled || isProcessing}
      />
      <Button 
        size="sm"
        onClick={handleSaveClick}
        disabled={disabled || isProcessing}
        type="button"
        title="Guardar calificación"
        aria-label="Guardar calificación"
      >
        {disabled || isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

GradeInput.displayName = 'GradeInput';

// Componente envolvente para evitar recargas
const StableContainer = React.memo(({ children }: { children: React.ReactNode }) => {
  // Usar useRef para mantener una referencia estable
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Efecto para capturar y detener todos los eventos de teclado
  useEffect(() => {
    const currentElement = contentRef.current;
    if (!currentElement) return;
    
    const stopAllKeyboardEvents = (e: KeyboardEvent) => {
      // Permitir eventos solo en inputs y textareas
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      
      // Si no es un elemento de entrada, detener el evento
      if (tagName !== 'input' && tagName !== 'textarea') {
        console.log('Stopping keyboard event in StableContainer:', e.key);
        e.stopPropagation();
      }
    };
    
    // Capturar eventos en fase de captura
    currentElement.addEventListener('keydown', stopAllKeyboardEvents, true);
    currentElement.addEventListener('keyup', stopAllKeyboardEvents, true);
    currentElement.addEventListener('keypress', stopAllKeyboardEvents, true);
    
    return () => {
      currentElement.removeEventListener('keydown', stopAllKeyboardEvents, true);
      currentElement.removeEventListener('keyup', stopAllKeyboardEvents, true);
      currentElement.removeEventListener('keypress', stopAllKeyboardEvents, true);
    };
  }, []);
  
  return (
    <div ref={contentRef} className="stable-container">
      {children}
    </div>
  );
});

StableContainer.displayName = 'StableContainer';

// Desactivar completamente las recargas del navegador
if (typeof window !== 'undefined') {
  // Prevenir todas las teclas que causan recarga
  window.addEventListener('keydown', (e) => {
    // Prevenir F5
    if (e.key === 'F5') {
      e.preventDefault();
      console.log('Prevented F5 reload');
      return false;
    }
    
    // Prevenir Ctrl+R
    if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      console.log('Prevented Ctrl+R reload');
      return false;
    }
  }, { capture: true });
  
  // Desactivar el botón de recarga del navegador
  window.addEventListener('beforeunload', (e) => {
    // Guardar estado de entrega en localStorage antes de recargar
    try {
      const urlParams = new URLSearchParams(window.location.pathname);
      const activityId = window.location.pathname.split('/').pop();
      if (activityId) {
        // Guardar estado de entrega con timestamp
        const submissionData = {
          hasSubmitted: true,
          timestamp: Date.now()
        };
        localStorage.setItem(`activity_submission_${activityId}`, JSON.stringify(submissionData));
        console.log('Estado de entrega guardado en localStorage');
      }
    } catch (err) {
      console.error('Error al guardar estado en localStorage:', err);
    }
    
    e.preventDefault();
    e.returnValue = '';
    return '';
  });
  
  // Desactivar el menú contextual para evitar "Recargar página"
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
}

export default function ActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para manejar la carga de datos
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [responses, setResponses] = useState<ActivityResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewResponses, setViewResponses] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<ActivityResponse | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeInput, setGradeInput] = useState<string>("");
  const [userHasSubmitted, setUserHasSubmitted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState<string>("");
  const [submittedResponse, setSubmittedResponse] = useState<ActivityResponse | null>(null);

  // Verificar localStorage para estado de entrega al cargar el componente
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`activity_submission_${params.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Verificar que no hayan pasado más de 5 minutos (300000 ms)
        const isFresh = (Date.now() - parsedData.timestamp) < 300000;
        
        if (parsedData.hasSubmitted && isFresh) {
          console.log('Restaurando estado de entrega desde localStorage');
          setUserHasSubmitted(true);
        } else {
          // Eliminar datos antiguos
          localStorage.removeItem(`activity_submission_${params.id}`);
        }
      }
    } catch (err) {
      console.error('Error al recuperar estado de localStorage:', err);
    }
  }, [params.id]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/activities/${params.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.status}`);
      }
      const data = await response.json();
      
      // Parse the endDate
      const endDate = data.endDate ? new Date(data.endDate) : null;
      
      // Check if the activity has expired
      const isExpired = endDate ? new Date() > endDate : false;
      
      setActivity({
        ...data,
        endDate,
        isExpired
      });
      
      // Check if the user has already submitted a response - IMPORTANTE: Esperar a que termine
      const hasSubmitted = await checkUserSubmission(params.id);
      setUserHasSubmitted(hasSubmitted);
      console.log('Estado de entrega actualizado:', hasSubmitted);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Error al cargar la actividad');
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user has already submitted a response - versión mejorada
  const checkUserSubmission = async (activityId: string) => {
    try {
      console.log('Verificando si el usuario ya ha enviado una respuesta para la actividad:', activityId);
      
      // Si ya sabemos que el usuario ha enviado una respuesta, no es necesario verificar de nuevo
      if (userHasSubmitted) {
        console.log('Ya sabemos que el usuario ha enviado una respuesta, no es necesario verificar de nuevo');
        return true;
      }
      
      // Obtener el token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
        
      if (!token) {
        console.error('No se encontró token al verificar el estado de entrega');
        return false;
      }
      
      // Decodificar el token para obtener el ID del usuario
      const decodedToken = decodeJwt(token);
      if (!decodedToken || !decodedToken.sub) {
        console.error('No se pudo obtener el ID de usuario del token');
        return false;
      }
      
      const userId = decodedToken.sub;
      console.log('Verificando entregas para el usuario:', userId);
      
      // Intentar con user/userId primero (endpoint más específico)
      try {
        const userUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}/user/${userId}`;
        console.log('Consultando endpoint específico de usuario:', userUrl);
        
        const userResponse = await fetch(userUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Respuesta del endpoint de usuario:', userData);
          
          // Si hay alguna respuesta, el usuario ya ha enviado
          const hasSubmitted = Array.isArray(userData) && userData.length > 0;
          
          if (hasSubmitted) {
            console.log('El usuario ya ha enviado una respuesta según el endpoint de usuario');
            
            // Actualizar estado global y mensaje
            setUserHasSubmitted(true);
            
            // Si hay una respuesta con calificación, guardarla en el estado
            if (userData.length > 0 && userData[0].grade !== undefined) {
              setSubmittedResponse(userData[0]);
            }
            
            // Guardar en localStorage para persistencia
            saveSubmissionState();
            
            return true;
          }
        } else {
          console.warn(`El endpoint de usuario falló con status: ${userResponse.status}`);
        }
      } catch (userError) {
        console.error('Error consultando el endpoint de usuario:', userError);
      }
      
      // Si no se encontró con user/userId, intentar con student/userId
      try {
        const studentUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}/student/${userId}`;
        console.log('Consultando endpoint de estudiante:', studentUrl);
        
        const studentResponse = await fetch(studentUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          console.log('Respuesta del endpoint de estudiante:', studentData);
          
          // Si hay alguna respuesta, el usuario ya ha enviado
          const hasSubmitted = Array.isArray(studentData) && studentData.length > 0;
          
          if (hasSubmitted) {
            console.log('El usuario ya ha enviado una respuesta según el endpoint de estudiante');
            
            // Actualizar estado global y mensaje
            setUserHasSubmitted(true);
            
            // Si hay una respuesta con calificación, guardarla en el estado
            if (studentData.length > 0 && studentData[0].grade !== undefined) {
              setSubmittedResponse(studentData[0]);
            }
            
            // Guardar en localStorage para persistencia
            saveSubmissionState();
            
            return true;
          }
        } else {
          console.warn(`El endpoint de estudiante falló con status: ${studentResponse.status}`);
        }
      } catch (studentError) {
        console.error('Error consultando el endpoint de estudiante:', studentError);
      }
      
      // Si llegamos aquí, no se encontraron respuestas en ninguno de los endpoints
      console.log('No se encontraron respuestas para el usuario actual en ningún endpoint');
      return false;
    } catch (error) {
      console.error('Error al verificar entregas del usuario:', error);
      return false;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const saveSubmissionState = () => {
    try {
      // Guardar estado de entrega con timestamp
      const submissionData = {
        hasSubmitted: true,
        timestamp: Date.now()
      };
      localStorage.setItem(`activity_submission_${params.id}`, JSON.stringify(submissionData));
      console.log('Estado de entrega guardado en localStorage');
    } catch (err) {
      console.error('Error al guardar estado en localStorage:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Debes seleccionar un archivo');
      return;
    }
    
    // Check if the user has already submitted a response
    const hasSubmitted = await checkUserSubmission(params.id);
    if (hasSubmitted) {
      // El mensaje de error ya se muestra en checkUserSubmission
      setUserHasSubmitted(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Get the token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Decode the token to get the user ID
      const decodedToken = decodeJwt(token);
      if (!decodedToken) {
        throw new Error('No se pudo identificar al usuario desde el token');
      }

      // For debugging
      console.log('Token payload:', decodedToken);
      console.log('Activity ID:', params.id);
      console.log('File name:', selectedFile.name);
      console.log('File size:', selectedFile.size);
      if (note.trim()) {
        console.log('Note provided:', note);
      }

      // Get user info from token
      const userName = decodedToken.name || decodedToken.preferred_username || 'Unknown User';
      // Get student ID from token or use default if not available
      const studentId = decodedToken.sub || '';
      console.log('Using student ID:', studentId);

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (note.trim()) {
        formData.append('finalNote', note);
      }
      
      // Build the URL with query parameters
      const url = new URL('http://82.29.168.17:8222/api/v1/activitiesresponses/with-file');
      url.searchParams.append('activityId', params.id);
      url.searchParams.append('studentId', studentId.toString());
      url.searchParams.append('studentName', userName);
      
      console.log('Enviando solicitud directamente al backend:', url.toString());
      
      // Send direct request to backend
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('Estado de respuesta del backend:', response.status);
      
      if (!response.ok) {
        // Handle error responses
        try {
          const errorText = await response.text();
          console.error('Error del backend:', errorText);
          
          // Check for "already submitted" error
          if (response.status === 400 && errorText.includes('already submitted')) {
            setUserHasSubmitted(true);
            toast.error('Ya has enviado una respuesta para esta actividad');
            setIsSubmitting(false);
            return;
          }
          
          throw new Error(`Error ${response.status}: ${errorText}`);
        } catch (textError) {
          if (textError instanceof Error && textError.message.includes('body stream already read')) {
            throw new Error(`Error ${response.status}: No se pudo leer el detalle del error`);
          }
          throw textError;
        }
      }

      // Success case
      let resultMessage = 'Actividad enviada correctamente';
      try {
        const result = await response.json();
        console.log('Respuesta exitosa:', result);
        if (result.message) {
          resultMessage = result.message;
        }
      } catch (parseError) {
        console.warn('No se pudo analizar la respuesta JSON, pero la solicitud fue exitosa');
      }
      
      // Update UI state
      setUserHasSubmitted(true);
      setSelectedFile(null);
      setNote("");
      toast.success(resultMessage);
      
      // Guardar estado en localStorage
      saveSubmissionState();
    } catch (error) {
      console.error('Error al enviar la actividad:', error);
      toast.error(`Error al enviar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadFile = async (fileId: string | undefined) => {
    if (!fileId) {
      toast.error('No file ID provided');
      return;
    }
    
    try {
      const response = await fetchWithAuth(`/api/file-storage/download/${fileId}?preview=false`, {
        responseType: 'blob'
      });
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `file-${fileId}`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
    }
  };
  
  // Simplificar la función getFileUrl para que siempre use la ruta de Next.js
  const getFileUrl = (fileId: string | undefined, preview: boolean = true) => {
    if (!fileId) return '';
    return `/api/file-storage/download/${fileId}${preview ? '?preview=true' : ''}`;
  };
  
  // Nueva función para abrir el archivo directamente en una nueva pestaña con las credenciales correctas
  const openFileInNewTab = async (fileId: string | undefined, preview: boolean = true) => {
    if (!fileId) {
      toast.error('No se proporcionó un ID de archivo válido');
      return;
    }
    
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
      
      // URL directa del backend
      const backendUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}${preview ? '?preview=true' : ''}`;
      
      // Crear un Blob a partir de la respuesta para generar una URL local
      const response = await fetch(backendUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener el archivo: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva pestaña
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al abrir archivo:', error);
      toast.error(`Error al abrir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  // Check if the current user is a teacher or admin
  const checkUserRole = () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
        
      if (token) {
        const decodedToken = decodeJwt(token);
        if (decodedToken && decodedToken.roles) {
          const userRoles = decodedToken.roles;
          const hasTeacherRole = userRoles.some((role: string) => 
            ['ROLE_TEACHER', 'ROLE_ADMIN', 'TEACHER', 'ADMIN'].includes(role)
          );
          
          // For testing purposes, always allow viewing responses
          setIsTeacher(true); // In production, use: setIsTeacher(hasTeacherRole);
        } else {
          // For testing purposes
          setIsTeacher(true);
        }
      } else {
        // For testing purposes
        setIsTeacher(true);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // For testing purposes
      setIsTeacher(true);
    }
  };

  // Fetch all student responses for this activity
  const fetchAllResponses = useCallback(async () => {
    setLoadingResponses(true);
    try {
      console.log(`Fetching all responses for activity ID: ${params.id}`);
      
      // Intento 1: Ruta directa al backend - La más confiable para obtener todas las respuestas
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];
          
        if (token) {
          const directUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.id}`;
          console.log('Trying direct API call to fetch all responses:', directUrl);
          
          const directResponse = await fetch(directUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('Direct API response for all responses:', directData);
            
            if (Array.isArray(directData) && directData.length > 0) {
              console.log(`Found ${directData.length} responses via direct API call`);
              setResponses(directData);
              setLoadingResponses(false);
              return;
            }
          } else {
            console.warn(`Direct API call failed with status: ${directResponse.status}`);
          }
        }
      } catch (directError) {
        console.error('Error with direct API call for all responses:', directError);
      }
      
      // Intento 2: Usar la ruta API de Next.js con fallback directo
      // Try the standard endpoint first
      const response = await fetchWithAuth(`/api/activitiesresponses/activity/${params.id}`, {
        fallbackToDirectBackend: true
      });
      
      if (!response.ok) {
        console.warn(`API response failed with status: ${response.status}`);
        
        // Intento 3: Última opción - ruta alternativa que podría contener las respuestas
        const alternativeResponse = await fetchWithAuth(`/api/activities/${params.id}/responses`, {
          fallbackToDirectBackend: true
        });
        
        if (!alternativeResponse.ok) {
          throw new Error(`Failed to fetch responses: ${response.status}, alternative also failed: ${alternativeResponse.status}`);
        }
        
        const alternativeData = await alternativeResponse.json();
        console.log('Alternative endpoint data:', alternativeData);
        
        // Extract responses array from the data
        const alternativeResponseArray = Array.isArray(alternativeData) ? alternativeData : 
                              (alternativeData.responses && Array.isArray(alternativeData.responses)) ? alternativeData.responses : [];
        
        console.log(`Found ${alternativeResponseArray.length} responses via alternative endpoint`);
        setResponses(alternativeResponseArray);
        setLoadingResponses(false);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched responses data:', data);
      
      // Extract responses array from the data
      const responseArray = Array.isArray(data) ? data : 
                          (data.responses && Array.isArray(data.responses)) ? data.responses : [];
      
      console.log(`Found ${responseArray.length} responses via API endpoint`);
      setResponses(responseArray);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Error al cargar las respuestas');
    } finally {
      setLoadingResponses(false);
    }
  }, [params.id]);

  // Handle opening the responses dialog
  const handleViewResponses = useCallback(async () => {
    console.log('Opening responses dialog and fetching all responses');
    await fetchAllResponses();
    setViewResponses(true);
  }, [fetchAllResponses]);

  // Handle opening the response detail dialog
  const handleViewResponseDetail = useCallback((response: ActivityResponse) => {
    console.log('Viewing response detail:', response);
    
    // Deshabilitar isGrading inicialmente para que no muestre el loader
    setIsGrading(false);
    
    // Inicializar el valor de calificación si existe
    if (response && response.grade !== undefined && response.grade !== null) {
      const gradeValue = response.grade.toString();
      setGradeInput(gradeValue);
      console.log('Inicializando calificación con valor existente:', gradeValue);
    } else {
      setGradeInput("");
      console.log('Inicializando calificación sin valor existente');
    }
    
    // Establecer la respuesta seleccionada
    setSelectedResponse(response);
    
    // Abrir el diálogo después de inicializar todo
    setTimeout(() => {
      setIsGrading(true);
      console.log('Dialog abierto después de inicializar datos');
    }, 50);
  }, []);

  // Función para guardar la calificación
  const handleSaveGrade = useCallback(async () => {
    if (!selectedResponse) {
      console.error('No hay respuesta seleccionada para calificar');
      return;
    }
    
    console.log('Iniciando guardado de calificación con valor:', gradeInput);
    
    if (!gradeInput) {
      toast.error('Debes ingresar una calificación');
      return;
    }
    
    const grade = parseFloat(gradeInput);
    if (isNaN(grade) || grade < 0 || grade > 10) {
      toast.error('La calificación debe ser un número entre 0 y 10');
      return;
    }
    
    // No usar isGrading para que el GradeInput no quede bloqueado
    // Esto evita que la UI se quede en estado de carga
    try {
      console.log(`Guardando calificación ${grade} para la respuesta ${selectedResponse.id}`);
      
      // Intentar primero directamente con el backend
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      
      if (token) {
        try {
          console.log('Intentando conexión directa al backend para guardar calificación');
          const directResponse = await fetch(`http://82.29.168.17:8222/api/v1/activitiesresponses/${selectedResponse.id}/grade`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'http://82.29.168.17:3000'
            },
            body: JSON.stringify({ grade }),
            credentials: 'include'
          });
          
          console.log(`Respuesta directa del backend: ${directResponse.status}`);
          
          if (directResponse.ok) {
            console.log('Calificación guardada correctamente mediante conexión directa');
            
            // Actualizar la respuesta seleccionada con la nueva calificación
            setSelectedResponse({
              ...selectedResponse,
              grade
            });
            
            // Actualizar la lista de respuestas
            setResponses(responses.map(resp => 
              resp.id === selectedResponse.id ? { ...resp, grade } : resp
            ));
            
            toast.success('Calificación guardada correctamente');
            return;
          }
          
          // Si falla la conexión directa, mostrar mensaje pero continuar con el método alternativo
          console.warn(`La conexión directa falló con estado: ${directResponse.status}`);
          const errorText = await directResponse.text();
          console.warn('Error detallado:', errorText);
          
        } catch (directError) {
          console.error('Error en conexión directa:', directError);
          // Continuar con el método de fallback
        }
      }
      
      // Si llegamos aquí, intentar a través de la API de Next.js
      console.log('Intentando a través de API de Next.js');
      
      // Usar fetchWithAuth con fallback automático a conexión directa
      const response = await fetchWithAuth(`/api/activitiesresponses/grade/${selectedResponse.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grade }),
        fallbackToDirectBackend: true // Habilitar fallback automático a conexión directa
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta:', errorText);
        throw new Error(`Error al guardar la calificación: ${response.status}`);
      }
      
      console.log('Calificación guardada correctamente');
      
      // Actualizar la respuesta seleccionada con la nueva calificación
      setSelectedResponse({
        ...selectedResponse,
        grade
      });
      
      // Actualizar la lista de respuestas
      setResponses(responses.map(resp => 
        resp.id === selectedResponse.id ? { ...resp, grade } : resp
      ));
      
      toast.success('Calificación guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      toast.error(`Error al guardar la calificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // En caso de error, actualizar la UI de todos modos para mejorar la experiencia del usuario
      if (selectedResponse) {
        const grade = parseFloat(gradeInput);
        if (!isNaN(grade)) {
          setSelectedResponse({
            ...selectedResponse,
            grade
          });
          
          setResponses(responses.map(resp => 
            resp.id === selectedResponse.id ? { ...resp, grade } : resp
          ));
          
          toast.info('La calificación se ha guardado localmente, pero puede que no se haya sincronizado con el servidor');
        }
      }
    }
  }, [selectedResponse, gradeInput, responses]);

  // Formatear fecha con hora exacta
  const formatDateTime = useCallback((dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  // Memo para estabilizar la función de cambio de gradeInput
  const handleGradeInputChange = useCallback((value: string) => {
    setGradeInput(value);
  }, []);

  // Inicialización: Cargar datos solo una vez
  useEffect(() => {
    console.log('Initial load effect running with activityId:', params.id);
    
    const loadInitialData = async () => {
      try {
        // Primero verificar estado de entrega guardado en localStorage
        try {
          const savedData = localStorage.getItem(`activity_submission_${params.id}`);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.hasSubmitted) {
              console.log('Estado de entrega encontrado en localStorage');
              setUserHasSubmitted(true);
            }
          }
        } catch (localStorageError) {
          console.error('Error al leer localStorage:', localStorageError);
        }
        
        // Luego verificar con múltiples backends para confirmar estado
        console.log('Verificando estado de entrega desde el backend...');
        const hasSubmitted = await checkUserSubmission(params.id);
        if (hasSubmitted) {
          console.log('El usuario ya ha enviado una respuesta según el backend');
          setUserHasSubmitted(true);
        } else if (userHasSubmitted) {
          console.log('El backend no confirma una entrega, pero tenemos un estado local de entrega realizada');
        } else {
          console.log('No se encontró ninguna entrega previa');
          setUserHasSubmitted(false);
        }
        
        // Finalmente cargar datos de la actividad y roles
        await fetchActivity();
        await checkUserRole();
        
        // Verificar una última vez después de cargar todo, para estar seguros
        if (!userHasSubmitted) {
          setTimeout(async () => {
            console.log('Verificación final de estado de entrega...');
            const finalCheck = await checkUserSubmission(params.id);
            if (finalCheck && !userHasSubmitted) {
              console.log('Verificación final encontró una entrega que no se detectó inicialmente');
              setUserHasSubmitted(true);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, checkUserSubmission]); // Dependencias: ID de actividad y función de verificación
  
  // Efecto para verificar el estado de entrega cuando la ventana recupera el foco
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Página visible nuevamente, verificando estado de entrega...');
        await checkUserSubmission(params.id);
      }
    };
    
    const handleFocus = async () => {
      console.log('Ventana enfocada, verificando estado de entrega...');
      await checkUserSubmission(params.id);
    };
    
    // Añadir listeners para visibilidad y enfoque
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      // Limpiar listeners al desmontar
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [params.id, checkUserSubmission]); // Dependencias: ID de actividad y función de verificación
  
  // Efecto para verificar periódicamente el estado de entrega
  useEffect(() => {
    // No iniciar el intervalo si ya sabemos que el usuario ha enviado una respuesta
    if (userHasSubmitted) {
      return;
    }
    
    console.log('Iniciando verificación periódica del estado de entrega...');
    
    // Verificar cada 30 segundos
    const interval = setInterval(async () => {
      console.log('Verificación periódica del estado de entrega...');
      await checkUserSubmission(params.id);
    }, 30000); // 30 segundos
    
    return () => {
      console.log('Deteniendo verificación periódica...');
      clearInterval(interval);
    };
  }, [params.id, userHasSubmitted]); // Dependencias: ID de actividad y estado de entrega

  // DocumentPreview component optimizado con memo para evitar re-renderizados
  const DocumentPreview = React.memo(({ 
    fileId,
    hideButtons = false 
  }: { 
    fileId: string | undefined;
    hideButtons?: boolean;
  }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [displayMode, setDisplayMode] = useState<'iframe' | 'buttons'>('iframe');
    const [fileName, setFileName] = useState<string>("");
    const [isNonViewableFile, setIsNonViewableFile] = useState(false);
    const [fileType, setFileType] = useState<string>("archivo");
    const [shouldAutoDownload, setShouldAutoDownload] = useState(false);
    
    // Lista de extensiones de archivo que no se pueden visualizar
    const nonViewableExtensions = useMemo(() => [
      '.zip', '.rar', '.7z', '.tar', '.gz', '.exe', '.msi', 
      '.jar', '.war', '.ear', '.bin', '.iso', '.dmg', '.pkg',
      '.apk', '.app', '.bat', '.cmd', '.sh'
    ], []);
    
    // Preparar URL del documento
    const fileUrl = useMemo(() => {
      if (!fileId) return '';
      return getFileUrl(fileId, true);
    }, [fileId]);
    
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
    
    // Manejar apertura en nueva pestaña
    const handleOpenInNewTab = useCallback(() => {
      if (!fileId) return;
      console.log('Abriendo documento en nueva pestaña:', fileUrl);
      window.open(fileUrl, '_blank');
    }, [fileId, fileUrl]);
    
    // Manejar descarga
    const handleDownload = useCallback(() => {
      if (!fileId) return;
      console.log('Descargando documento:', fileId);
      downloadFile(fileId);
    }, [fileId]);
    
    // Manejar reintentos
    const handleRetry = useCallback(() => {
      console.log('Reintentando cargar el documento...');
      setError(null);
      setIsLoading(true);
      setDisplayMode('iframe');
      setRetryCount(prev => prev + 1);
    }, []);
    
    // Mostrar solo botones
    const handleShowButtonsOnly = useCallback(() => {
      setDisplayMode('buttons');
      setIsLoading(false);
      setError(null);
    }, []);
    
    // Check if the file is viewable or not
    useEffect(() => {
      if (!fileId) return;
      
      const setAsNonViewable = (name: string) => {
        console.log(`Archivo no visualizable detectado: ${name}`);
        setFileName(name);
        setFileType(getFileTypeFromName(name));
        setIsNonViewableFile(true);
        setIsLoading(false);
        setDisplayMode('buttons');
        setShouldAutoDownload(true);
      };
      
      // Primero, verificar si el fileId ya contiene información sobre el tipo de archivo
      if (typeof fileId === 'string') {
        // Intentar extraer el nombre del archivo del fileId
        const possibleFileName = fileId.split('/').pop() || fileId;
        
        // Si el fileId contiene una extensión no visualizable
        if (isNonViewableExtension(possibleFileName)) {
          setAsNonViewable(possibleFileName);
          return;
        }
      }
      
      // Si no se detecta por fileId, intentar obtener metadatos
      const fetchFileInfo = async () => {
        try {
          // Get the token
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
            
          if (!token) {
            console.error('No se encontró token de autenticación');
            return;
          }
          
          console.log(`Intentando obtener metadatos para el archivo: ${fileId}`);
          
          // First, try to get metadata directly
          try {
            const metadataResponse = await fetch(`http://82.29.168.17:8222/api/v1/file-storage/${fileId}/metadata`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              console.log('Metadatos obtenidos:', metadata);
              
              if (metadata && metadata.name) {
                setFileName(metadata.name);
                
                if (isNonViewableExtension(metadata.name)) {
                  setAsNonViewable(metadata.name);
                  return;
                }
              }
            } else {
              console.warn(`No se pudieron obtener metadatos. Estado: ${metadataResponse.status}`);
            }
          } catch (metadataError) {
            console.error('Error al obtener metadatos:', metadataError);
          }
          
          // Si no hay metadatos, intentar hacer HEAD al archivo para verificar el tipo MIME
          try {
            const headResponse = await fetch(getFileUrl(fileId, true), {
              method: 'HEAD',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (headResponse.ok) {
              const contentType = headResponse.headers.get('content-type');
              const contentDisposition = headResponse.headers.get('content-disposition');
              
              console.log('Content-Type:', contentType);
              console.log('Content-Disposition:', contentDisposition);
              
              // Obtener nombre de archivo de Content-Disposition si está disponible
              if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                  const extractedName = filenameMatch[1];
                  setFileName(extractedName);
                  
                  if (isNonViewableExtension(extractedName)) {
                    setAsNonViewable(extractedName);
                    return;
                  }
                }
              }
              
              // Verificar el tipo MIME
              if (contentType) {
                const nonViewableMimeTypes = [
                  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
                  'application/octet-stream', 'application/x-msdownload', 'application/x-executable',
                  'application/java-archive'
                ];
                
                if (nonViewableMimeTypes.some(mime => contentType.includes(mime))) {
                  console.log(`Archivo no visualizable detectado por MIME type: ${contentType}`);
                  // Usar el nombre de archivo del fileId si no tenemos uno mejor
                  if (!fileName) {
                    const inferredName = fileId.split('/').pop() || 'archivo';
                    setFileName(inferredName);
                    setFileType(contentType.split('/').pop() || 'archivo');
                  }
                  setIsNonViewableFile(true);
                  setIsLoading(false);
                  setDisplayMode('buttons');
                  setShouldAutoDownload(true);
                  return;
                }
              }
            }
          } catch (headError) {
            console.error('Error al verificar cabeceras del archivo:', headError);
          }
          
        } catch (error) {
          console.error('Error general al verificar el archivo:', error);
        }
      };
      
      fetchFileInfo();
    }, [fileId, fileName, isNonViewableExtension, getFileTypeFromName]);
    
    // Efecto para descargar automáticamente cuando se detecta un archivo no visualizable
    useEffect(() => {
      if (shouldAutoDownload && fileId) {
        console.log('Iniciando descarga automática del archivo no visualizable');
        setTimeout(() => {
          handleDownload();
          // Resetear la bandera para evitar descargas múltiples
          setShouldAutoDownload(false);
        }, 1000);
      }
    }, [shouldAutoDownload, fileId, handleDownload]);
    
    // Efecto para controlar cargas y timeouts
    useEffect(() => {
      if (!fileId) {
        setIsLoading(false);
        setError('No hay archivo disponible');
        return;
      }
      
      // Skip timeout for non-viewable files
      if (isNonViewableFile) {
        setIsLoading(false);
        return;
      }
      
      // Timeout de seguridad
      const timeout = setTimeout(() => {
        if (isLoading && displayMode === 'iframe') {
          console.log('Timeout de carga de documento alcanzado');
          setError('El visor de documentos no pudo cargar. Utilice los botones para abrir el documento.');
          setIsLoading(false);
        }
      }, 15000); // 15 segundos para timeout
      
      return () => clearTimeout(timeout);
    }, [fileId, isLoading, displayMode, isNonViewableFile]);
    
    // Efecto para descargar automáticamente archivos no visualizables
    useEffect(() => {
      if (isNonViewableFile && fileId) {
        console.log('Iniciando descarga automática del archivo no visualizable');
        const timer = setTimeout(() => {
          handleDownload();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [isNonViewableFile, fileId, handleDownload]);
    
    // Si no hay fileId, mostrar error
    if (!fileId) {
      return (
        <div className="flex flex-col space-y-4">
          {!hideButtons && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="default"
                className="w-full sm:w-auto"
                disabled
              >
                <Eye className="h-4 w-4 mr-2" />
                Abrir en nueva pestaña
              </Button>
              
              <Button 
                variant="outline"
                className="w-full sm:w-auto"
                disabled
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar archivo
              </Button>
            </div>
          )}
          
          <div className="w-full h-[400px] border rounded bg-gray-50 flex items-center justify-center">
            <div className="text-center p-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-destructive">No hay archivo disponible</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Special view for non-viewable files (ZIP, executable, etc.)
    if (isNonViewableFile) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex justify-center">
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleDownload}
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
    
    // Modo solo botones (sin iframe)
    if (displayMode === 'buttons') {
      return (
        <div className="flex flex-col space-y-4">
          {!hideButtons && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleOpenInNewTab}
              >
                <Eye className="h-4 w-4 mr-2" />
                Abrir en nueva pestaña
              </Button>
              
              <Button 
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar archivo
              </Button>
              
              <Button 
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={handleRetry}
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Cargar vista previa
              </Button>
            </div>
          )}
          
          <div className="w-full h-[400px] border rounded bg-gray-100 flex items-center justify-center">
            <div className="text-center p-6">
              <FileText className="h-16 w-16 text-primary/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Vista previa no disponible</h3>
              <p className="text-muted-foreground mb-4">
                Utilice los botones para ver o descargar el documento.
              </p>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="mx-auto"
              >
                Reintentar vista previa
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Modo normal con iframe
    return (
      <div className="flex flex-col space-y-4">
        {!hideButtons && (
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleOpenInNewTab}
            >
              <Eye className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
            
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar archivo
            </Button>
            
            <Button 
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleShowButtonsOnly}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Ocultar vista previa
            </Button>
          </div>
        )}
        
        <div className="relative w-full h-[400px] border rounded bg-gray-50">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-gray-500">Cargando documento...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
              <XCircle className="h-12 w-12 text-destructive mb-2" />
              <p className="text-center mb-4">{error}</p>
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="outline">
                  Reintentar
                </Button>
                <Button onClick={handleShowButtonsOnly} variant="default">
                  Solo botones
                </Button>
              </div>
            </div>
          )}
          
          <iframe 
            key={`document-preview-${fileId}-${retryCount}`}
            src={fileUrl}
            className={`w-full h-full border-0 ${isLoading || error ? 'hidden' : ''}`}
            title="Document Preview"
            onLoad={() => {
              console.log('Documento cargado correctamente');
              setIsLoading(false);
            }}
            onError={() => {
              console.error('Error al cargar el documento');
              setIsLoading(false);
              setError('No se pudo cargar el documento. Utilice los botones para abrir o descargar el documento.');
            }}
            allow="fullscreen"
          />
        </div>
      </div>
    );
  });

  DocumentPreview.displayName = 'DocumentPreview';

  // ResponseCard component para reducir re-renders
  const ResponseCard = React.memo(({ 
    response, 
    onViewDetails 
  }: { 
    response: ActivityResponse, 
    onViewDetails: (response: ActivityResponse) => void 
  }) => {
    const handleClick = useCallback(() => {
      console.log('View details button clicked for response:', response.id);
      onViewDetails(response);
    }, [response, onViewDetails]);

  return (
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium truncate">{response.studentName}</span>
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(response.submissionDate || response.createdAt || response.created || Date.now()).toLocaleDateString('es-ES')}</span>
            </div>
            
            {response.fileId || response.responseFileId || response.fileURL ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Archivo</span>
              </Badge>
            ) : null}
          </div>
          
          {(response.finalNote || response.note) && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              <span className="font-medium">Nota: </span>
              {(response.finalNote || response.note || "").substring(0, 50)}
              {(response.finalNote || response.note || "").length > 50 ? "..." : ""}
            </div>
          )}
          
          {response.grade !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Calificación: {response.grade}
              </Badge>
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={handleClick}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  });

  ResponseCard.displayName = 'ResponseCard';

  // Function to delete the activity
  const handleDeleteActivity = async () => {
    setIsDeleting(true);
    try {
      console.log(`Intentando eliminar actividad con ID: ${params.id}`);
      
      // Intentar eliminar a través del proxy
      const response = await fetchWithAuth(`/api/activities/${params.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Si el proxy falla, intentar directamente
        console.warn(`La eliminación a través del proxy falló con estado ${response.status}, intentando directamente`);
        
        // Obtener el token
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];
          
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }
        
        const directResponse = await fetch(`http://82.29.168.17:8222/api/v1/activities/${params.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Origin': 'http://82.29.168.17:3000'
          },
        });
        
        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          console.error('Error en la respuesta de la solicitud directa:', errorText);
          throw new Error(`Error al eliminar la actividad: ${directResponse.status}`);
        }
      }
      
      toast.success('Actividad eliminada correctamente');
      
      // Navegar de vuelta a la lista de actividades
      setTimeout(() => {
        router.push('/');
      }, 500);
      
    } catch (error) {
      console.error('Error al eliminar la actividad:', error);
      toast.error(`Error al eliminar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Function to submit a response with a file
  const handleSubmitWithFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      // Check if user has already submitted first
      const hasSubmitted = await checkUserSubmission(params.id);
      if (hasSubmitted) {
        // El mensaje de error ya se muestra en checkUserSubmission
        setIsSubmitting(false);
        return;
      }

      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Decode token to get user info
      const decodedToken = decodeJwt(token);
      if (!decodedToken) {
        throw new Error('No se pudo decodificar el token');
      }

      // Get user info from token
      const userId = decodedToken.sub || '';
      const userName = decodedToken.name || decodedToken.preferred_username || 'Unknown User';

      // Create FormData for direct backend request
      const formData = new FormData();
      
      // Add file if selected
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        toast.error('Debes seleccionar un archivo para subir');
        setIsSubmitting(false);
        return;
      }

      // Add note if provided
      if (note && note.trim()) {
        formData.append('finalNote', note);
      }
      
      // Build the backend URL with query parameters
      const url = new URL('http://82.29.168.17:8222/api/v1/activitiesresponses/with-file');
      url.searchParams.append('activityId', params.id);
      url.searchParams.append('studentId', userId);
      url.searchParams.append('studentName', userName);
      
      console.log('Enviando solicitud directamente al backend:', url.toString());
      
      // Send request directly to backend
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('Estado de respuesta del backend:', response.status);
      
      if (!response.ok) {
        // Handle error responses
        try {
          const errorText = await response.text();
          console.error('Error del backend:', errorText);
          
          // Check for "already submitted" error
          if (response.status === 400 && errorText.includes('already submitted')) {
            setUserHasSubmitted(true);
            toast.error('Ya has enviado una respuesta para esta actividad');
            setIsSubmitting(false);
            return;
          }
          
          throw new Error(`Error ${response.status}: ${errorText}`);
        } catch (textError) {
          if (textError instanceof Error && textError.message.includes('body stream already read')) {
            throw new Error(`Error ${response.status}: No se pudo leer el detalle del error`);
          }
          throw textError;
        }
      }

      // Success case
      let resultMessage = 'Respuesta enviada con éxito';
      try {
        const result = await response.json();
        console.log('Respuesta exitosa:', result);
        if (result.message) {
          resultMessage = result.message;
        }
      } catch (parseError) {
        console.warn('No se pudo analizar la respuesta JSON, pero la solicitud fue exitosa');
      }
      
      // Update UI state
      setIsSubmitted(true);
      setUserHasSubmitted(true);
      setSelectedFile(null);
      setNote("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success(resultMessage);
      
      // Guardar estado en localStorage
      saveSubmissionState();
      
      // Reload student responses if we're viewing them
      if (viewResponses) {
        fetchAllResponses();
      }
    } catch (error) {
      console.error('Error al enviar la respuesta:', error);
      setSubmissionError(`Error al enviar: ${error instanceof Error ? error.message : String(error)}`);
      toast.error(`Error al enviar la respuesta: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function to display grade information
  const renderGradeInfo = () => {
    if (!submittedResponse) return null;
    
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">Información de tu entrega</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha de entrega:</span>
            <span className="font-medium">{submittedResponse.createdAt ? new Date(submittedResponse.createdAt).toLocaleString() : 'No disponible'}</span>
          </div>
          
          {submittedResponse.grade !== undefined && submittedResponse.grade !== null ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Calificación:</span>
              <span className="font-medium">{submittedResponse.grade} / 10</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="font-medium">Pendiente de calificación</span>
            </div>
          )}
          
          {submittedResponse.gradedBy && (
            <div className="flex justify-between">
              <span className="text-gray-600">Calificado por:</span>
              <span className="font-medium">{submittedResponse.gradedBy}</span>
            </div>
          )}
          
          {submittedResponse.gradedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha de calificación:</span>
              <span className="font-medium">{new Date(submittedResponse.gradedAt).toLocaleString()}</span>
            </div>
          )}
          
          {submittedResponse.responseFileId && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadFile(submittedResponse?.responseFileId)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar mi archivo
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <StableContainer>
    <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>
      
          {isTeacher && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar Actividad
            </Button>
          )}
        </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : activity ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{activity.name}</CardTitle>
                  {activity.endDate && (
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fecha límite: {format(activity.endDate, "PPP", { locale: es })}
                      {activity.isExpired && (
                        <Badge variant="destructive" className="ml-2">Expirado</Badge>
                      )}
                    </div>
                  )}
                </div>
                
                  <div className="flex items-center gap-2">
                {userHasSubmitted && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Entregado
                  </Badge>
                )}
                {submittedResponse?.grade !== undefined && submittedResponse?.grade !== null && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Calificación: {submittedResponse.grade}/10
                  </Badge>
                )}
                    
                    {isTeacher && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleViewResponses}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Ver Respuestas
                      </Button>
                    )}
                  </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Descripción</h3>
                <p>{activity.description}</p>
              </div>
              
              {activity.fileId && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Material de la actividad</h3>
                  <DocumentPreview fileId={activity.fileId} />
                </div>
              )}
              
              {/* Student response form section - redesigned with shadcn components */}
              <div className="mt-8">
                <Card className="border-primary/10">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Enviar Respuesta</CardTitle>
                      {userHasSubmitted && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Entregado
                        </Badge>
                      )}
                      {activity?.isExpired && (
                        <Badge variant="destructive" className="ml-2">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Plazo vencido
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {submissionError && (
                      <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md flex items-center">
                        <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <p>{submissionError}</p>
                      </div>
                    )}
                    
                    {userHasSubmitted ? (
                      <div className="space-y-6">
                        <div className="p-4 border border-green-200 bg-green-50 text-green-800 rounded-md flex items-center">
                          <CheckCircle2 className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
                          <p>Ya has enviado tu respuesta para esta actividad. No es posible realizar múltiples envíos.</p>
                        </div>
                        
                        {/* Display grade information if available */}
                        {renderGradeInfo()}
                      </div>
                    ) : isSubmitted ? (
                      <div className="p-4 border border-green-200 bg-green-50 text-green-800 rounded-md flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
                        <p>Ya has enviado tu respuesta para esta actividad.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitWithFile} className="space-y-6">
                        {!getCurrentUserId() && (
                          <div className="space-y-2">
                            <Label htmlFor="studentId">ID de Estudiante</Label>
                            <Input
                              id="studentId"
                              placeholder="Ingresa tu ID de estudiante"
                              required
                            />
                          </div>
                        )}
                        
                        {!getCurrentUsername() && (
                          <div className="space-y-2">
                            <Label htmlFor="studentName">Nombre de Estudiante</Label>
                            <Input
                              id="studentName"
                              placeholder="Ingresa tu nombre completo"
                              required
                            />
                          </div>
                        )}
                        
                        {/* File input with improved styling */}
                        <div className="space-y-2">
                          <Label htmlFor="file" className="block font-medium">
                            Archivo de Respuesta <span className="text-destructive">*</span>
                          </Label>
                          <div className="border rounded-md p-4 bg-muted/30">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Paperclip className="h-5 w-5 text-primary" />
                              </div>
                              <p className="text-sm text-muted-foreground text-center">
                                Arrastra y suelta tu archivo aquí o
                              </p>
                              <Input
                                type="file"
                                id="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="max-w-xs"
                                required
                              />
                            </div>
                            
                            {selectedFile && (
                              <div className="mt-4 p-3 border border-primary/20 bg-primary/5 rounded-md">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-primary" />
                                  <span className="text-sm font-medium">{selectedFile.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {Math.round(selectedFile.size / 1024)} KB
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Note input with improved styling */}
                        <div className="space-y-2">
                          <Label htmlFor="note" className="font-medium">
                            Nota (opcional)
                          </Label>
                          <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Agrega notas o comentarios sobre tu entrega..."
                            className="min-h-[120px] resize-none"
                          />
                        </div>
                        
                        {/* Submit button - disabled if user has already submitted */}
                        <div className="pt-2">
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || activity?.isExpired || userHasSubmitted}
                            variant={userHasSubmitted || activity?.isExpired ? "outline" : "default"}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : userHasSubmitted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Ya enviado
                              </>
                            ) : activity?.isExpired ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Plazo vencido
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Enviar Respuesta
                              </>
                            )}
                          </Button>
                          
                          {activity?.isExpired && (
                            <p className="mt-2 text-sm text-destructive flex items-center justify-center">
                              <Clock className="h-4 w-4 mr-1" />
                              El plazo de entrega ha vencido
                            </p>
                          )}
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
                      </div>
      ) : (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold">Actividad no encontrada</h2>
          <p className="text-muted-foreground mt-2">
            La actividad que buscas no existe o no tienes acceso a ella.
          </p>
        </div>
      )}

        {/* Dialog for viewing all student responses */}
        <Dialog open={viewResponses} onOpenChange={setViewResponses}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Respuestas de Estudiantes</DialogTitle>
              <DialogDescription>
                Todas las respuestas para la actividad: {activity?.name}
              </DialogDescription>
            </DialogHeader>
            
            {loadingResponses ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  </div>
            ) : responses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {responses.map((response) => (
                  <ResponseCard
                    key={response.id}
                    response={response}
                    onViewDetails={handleViewResponseDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No hay respuestas para esta actividad.</p>
                </div>
              )}
          </DialogContent>
        </Dialog>

        {/* Dialog for viewing response details */}
        <Dialog 
          open={isGrading} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange called with:', open);
            // Si estamos cerrando el diálogo, limpiamos estados
            if (!open) {
              console.log('Cerrando diálogo y limpiando estados');
              // Primero cerrar el diálogo
              setIsGrading(false);
              
              // Luego limpiar estados con un pequeño retraso
              setTimeout(() => {
                setSelectedResponse(null);
                setGradeInput("");
              }, 300); // Pequeño retraso para asegurar que la animación de cierre termine
            } else {
              // Si estamos abriendo, establecer isGrading
              setIsGrading(true);
            }
          }}
        >
          <DialogContent 
            className="max-w-5xl max-h-[90vh] overflow-y-auto"
            onKeyDown={(e) => {
              // Detener propagación de todos los eventos de teclado
              e.stopPropagation();
              // Prevenir comportamiento por defecto para teclas que podrían causar recarga
              if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
                e.preventDefault();
                console.log('Prevented reload key in dialog');
              }
            }}
            onClick={(e) => {
              // Detener propagación de clics para evitar interacciones no deseadas
              e.stopPropagation();
            }}
          >
            <DialogHeader>
              <DialogTitle>Detalle de Respuesta</DialogTitle>
              <DialogDescription>
                Respuesta de {selectedResponse?.studentName || ''}
              </DialogDescription>
            </DialogHeader>
            
            {selectedResponse && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Información del Estudiante</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedResponse.studentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatDateTime(selectedResponse.submissionDate || selectedResponse.createdAt || selectedResponse.created)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Entregado hace {timeSince(new Date(selectedResponse.submissionDate || selectedResponse.createdAt || selectedResponse.created || Date.now()))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Calificación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedResponse?.grade !== undefined && selectedResponse.grade !== null && (
                          <div className="flex items-center justify-center">
                            <div className="text-3xl font-bold">
                              {selectedResponse.grade}
                            </div>
                          </div>
                        )}
                        
                        <GradeInput
                          value={gradeInput}
                          onChange={handleGradeInputChange}
                          onSave={handleSaveGrade}
                          disabled={false} /* Nunca deshabilitar para evitar problemas de estado */
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Archivo entregado - Previsualización */}
                {(selectedResponse.fileId || selectedResponse.responseFileId || selectedResponse.fileURL) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        Archivo Entregado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Botones de acción arriba para facilitar acceso */}
                      <div className="flex flex-col sm:flex-row gap-2 justify-center mb-2">
                        <Button
                          variant="default"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            const fileId = selectedResponse.responseFileId || selectedResponse.fileId || selectedResponse.fileURL;
                            if (fileId) {
                              window.open(getFileUrl(fileId, true), '_blank');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver en nueva pestaña
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => downloadFile(selectedResponse.responseFileId || selectedResponse.fileId || selectedResponse.fileURL)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar archivo
                        </Button>
                      </div>
                      
                      {/* Mostrar la previsualización */}
                      <div className="border rounded-md overflow-hidden h-[400px]">
                        <DocumentPreview 
                          fileId={selectedResponse.responseFileId || selectedResponse.fileId || selectedResponse.fileURL}
                          hideButtons={true}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {(selectedResponse.finalNote || selectedResponse.note) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Nota del Estudiante</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="whitespace-pre-wrap">{selectedResponse.finalNote || selectedResponse.note}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation(); // Prevenir propagación del evento
                  console.log('Close button clicked');
                  setIsGrading(false);
                }}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la actividad
                "{activity?.name}" y todas las respuestas asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  // Prevent default to handle deletion manually
                  e.preventDefault();
                  handleDeleteActivity();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Eliminar
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
    </StableContainer>
  );
}

// Función para calcular tiempo transcurrido
function timeSince(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000; // años
  if (interval > 1) {
    return Math.floor(interval) + " años";
  }
  
  interval = seconds / 2592000; // meses
  if (interval > 1) {
    return Math.floor(interval) + " meses";
  }
  
  interval = seconds / 86400; // días
  if (interval > 1) {
    return Math.floor(interval) + " días";
  }
  
  interval = seconds / 3600; // horas
  if (interval > 1) {
    return Math.floor(interval) + " horas";
  }
  
  interval = seconds / 60; // minutos
  if (interval > 1) {
    return Math.floor(interval) + " minutos";
  }
  
  return Math.floor(seconds) + " segundos";
} 