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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

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
    try {
      setIsLoading(true);
      
      console.log('Fetching activity details for ID:', params.id);
      
      // Use our proxy API endpoint
      const response = await fetch(`/api/proxy/activities/${params.id}`, {
          headers: {
          'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Actividad no encontrada');
        } else {
          setError(`Error al cargar la actividad: ${response.status}`);
        }
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Activity data:', data);
      
      // Format the activity data
      const formattedActivity = {
        ...data,
        endDate: data.endDate ? new Date(data.endDate) : undefined
      };
      
      setActivity(formattedActivity);
      
      // Check if the activity has expired
      if (formattedActivity.endDate && new Date() > formattedActivity.endDate) {
        setIsExpired(true);
      }
      
      // If the activity has a file, fetch responses
      if (data.fileId) {
        fetchResponses();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching activity:', error);
      setError('Error al cargar la actividad');
        setIsLoading(false);
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
      
      // Use our proxy API endpoint to check user responses
      try {
        const userUrl = `/api/proxy/activitiesresponses/activity/${activityId}/user/${userId}`;
        console.log('Consultando endpoint para verificar entregas:', userUrl);
        
        const userResponse = await fetch(userUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Respuesta del endpoint de usuario:', userData);
          
          // Si hay alguna respuesta, el usuario ya ha enviado
          const hasSubmitted = Array.isArray(userData) && userData.length > 0;
          
          if (hasSubmitted) {
            console.log('El usuario ya ha enviado una respuesta');
            
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
        }
      } catch (error) {
        console.error('Error consultando las entregas del usuario:', error);
      }
      
      // Si llegamos aquí, no se encontraron respuestas
      return false;
    } catch (error) {
      console.error('Error al verificar entregas del usuario:', error);
      return false;
    }
  };
  
  // Function to handle activity deletion
  const handleDeleteActivity = async () => {
    try {
      setIsDeleting(true);
      console.log(`Intentando eliminar actividad con ID: ${params.id}`);
      
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
                          onSave={saveGrade}
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