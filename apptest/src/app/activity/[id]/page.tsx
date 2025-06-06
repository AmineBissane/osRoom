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
import { fetchWithAuth, getCurrentUsername } from '@/utils/fetchWithAuth'
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

// GradeInput component for grading
const GradeInput = ({ 
  value, 
  onChange, 
  onSave, 
  disabled 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onSave: () => void; 
  disabled: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        placeholder="Calificación (0-10)"
        value={value}
        onChange={onChange}
        disabled={disabled}
        min="0"
        max="10"
        step="0.1"
        className="flex-1"
      />
      <Button 
        variant="default" 
        onClick={onSave}
        disabled={disabled}
      >
        <Save className="h-4 w-4 mr-2" />
        Guardar
      </Button>
    </div>
  );
};

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
  // Access params directly since we're in a client component
  // In the future this will need to be updated to use React.use with proper setup
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
  const [activityId, setActivityId] = useState<string>('');
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showEmergencyReset, setShowEmergencyReset] = useState(false);

  // Initialize activityId from params when component mounts
  useEffect(() => {
    // Extract ID directly and set it immediately
    if (params && params.id) {
      console.log("Setting activity ID from params:", params.id);
      setActivityId(params.id);
    } else {
      console.error("No activity ID found in params");
      setError("No se pudo cargar la actividad: ID no encontrado");
    }
    setInitializing(false);
  }, [params]);

  // Check authentication status and ensure token validity
  useEffect(() => {
    const checkAuth = async () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      
      if (!token) {
        console.error("No authentication token found");
        setAuthError("No se encontró un token de autenticación válido. Por favor, inicie sesión nuevamente.");
        setIsLoading(false); // Make sure to clear loading state
        
        // Delay redirect slightly to ensure state updates
        setTimeout(() => {
          window.location.href = "/login?from=" + encodeURIComponent(window.location.pathname);
        }, 100);
        return;
      }
      
      try {
        // Verify token by making a simple API call
        const response = await fetch('/api/auth/check', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error("Token validation failed");
          setAuthError("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
          setIsLoading(false); // Make sure to clear loading state
          
          // Delay redirect slightly to ensure state updates
          setTimeout(() => {
            window.location.href = "/login?from=" + encodeURIComponent(window.location.pathname);
          }, 100);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsLoading(false); // Make sure to clear loading state
      }
    };
    
    checkAuth();
  }, []);

  // Verificar localStorage para estado de entrega al cargar el componente
  useEffect(() => {
    if (!activityId) return; // Don't proceed if activityId is not set yet
    
    try {
      const savedData = localStorage.getItem(`activity_submission_${activityId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Verificar que no hayan pasado más de 5 minutos (300000 ms)
        const isFresh = (Date.now() - parsedData.timestamp) < 300000;
        
        if (parsedData.hasSubmitted && isFresh) {
          console.log('Restaurando estado de entrega desde localStorage');
          setUserHasSubmitted(true);
        } else {
          // Eliminar datos antiguos
          localStorage.removeItem(`activity_submission_${activityId}`);
        }
      }
    } catch (err) {
      console.error('Error al recuperar estado de localStorage:', err);
    }
  }, [activityId]);

  // Fetch activity data when activityId is available
  useEffect(() => {
    if (activityId && !initializing) {
      console.log("Fetching activity with ID:", activityId);
      serverLog("Starting fetch data process", { activityId });
      
      let fetchDataCompleted = false;
      
      // Create a function to fetch both activity and user submission data
      const fetchData = async () => {
        try {
          setIsLoading(true);
          serverLog("Setting isLoading to true");
          
          // Fetch activity data
          serverLog("About to fetch activity data");
          await fetchActivity();
          serverLog("Completed fetchActivity");
          
          // Check user submission
          serverLog("About to check user submission");
          await checkUserSubmission(activityId);
          serverLog("Completed checkUserSubmission");
          
          // Mark as completed to prevent the timeout from considering this a hanging request
          fetchDataCompleted = true;
          
        } catch (error) {
          console.error("Error fetching data:", error);
          serverLog("Error in fetchData", { error: error instanceof Error ? error.message : String(error) });
          setError("Error al cargar los datos de la actividad");
        } finally {
          // Ensure loading state is set to false when everything is done, whether successful or not
          serverLog("Setting isLoading to false in finally block");
          setIsLoading(false);
        }
      };
      
      // Start fetching data
      fetchData();
      
      // Set a backup timeout to ensure loading state is cleared even if something goes wrong
      const backupTimeout = setTimeout(() => {
        if (!fetchDataCompleted) {
          serverLog("Backup timeout triggered - fetchData didn't complete in time", { fetchDataCompleted });
          setIsLoading(false);
        }
      }, 10000); // 10 seconds should be more than enough for the fetch to complete
      
      // Clear the timeout if the component unmounts or activityId changes
      return () => {
        clearTimeout(backupTimeout);
        serverLog("Cleared backup timeout for fetchData", { activityId });
      };
    }
  }, [activityId, initializing]);

  const fetchActivity = async () => {
    if (!activityId) {
      console.error("Attempted to fetch activity without ID");
      serverLog("Attempted to fetch activity without ID", { activityId });
      setIsLoading(false); // Ensure loading state is cleared
      return;
    }

    try {
      console.log('Fetching activity details for ID:', activityId);
      serverLog('Starting fetchActivity', { activityId });
      
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const url = `/api/proxy/activities/${activityId}?_=${timestamp}`;
      serverLog('Preparing to fetch activity', { url });
      
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        serverLog('Activity fetch response received', { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error("Authentication error:", response.status);
            serverLog('Authentication error in fetchActivity', { status: response.status });
            setAuthError("Error de autenticación. Por favor, inicie sesión nuevamente.");
            setTimeout(() => {
              window.location.href = "/login?from=" + encodeURIComponent(window.location.pathname);
            }, 100);
            setIsLoading(false); // Ensure loading state is cleared
            return;
          }
          
          if (response.status === 404) {
            serverLog('Activity not found', { status: 404 });
            setError('Actividad no encontrada');
          } else {
            serverLog('Error loading activity', { status: response.status });
            setError(`Error al cargar la actividad: ${response.status}`);
          }
          setIsLoading(false); // Ensure loading state is cleared
          return;
        }
        
        // Get response as text first to safely handle JSON parsing
        const responseText = await response.text();
        serverLog('Activity response text received', { 
          textLength: responseText.length,
          textPreview: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
        });
        
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          console.error('Error parsing activity JSON:', parseError);
          serverLog('Error parsing activity JSON', { 
            error: parseError instanceof Error ? parseError.message : String(parseError),
            textPreview: responseText.substring(0, 200)
          });
          setError('Error al procesar la respuesta del servidor');
          setIsLoading(false); // Ensure loading state is cleared
          return;
        }
        
        if (!data) {
          console.error('Activity data is null or empty');
          serverLog('Activity data is null or empty', {});
          setError('No se recibieron datos de la actividad');
          setIsLoading(false); // Ensure loading state is cleared
          return;
        }
        
        console.log('Activity data:', data);
        serverLog('Activity data received', { data });
        
        // Format the activity data
        const formattedActivity = {
          ...data,
          endDate: data.endDate ? new Date(data.endDate) : undefined
        };
        
        setActivity(formattedActivity);
        serverLog('Activity state updated', { 
          id: formattedActivity.id, 
          name: formattedActivity.name 
        });
        
        // Check if the activity has expired
        const isActivityExpired = formattedActivity.endDate && new Date() > formattedActivity.endDate;
        if (isActivityExpired) {
          serverLog('Activity is expired', { 
            endDate: formattedActivity.endDate?.toISOString(),
            now: new Date().toISOString()
          });
          setIsExpired(true);
        }
      } catch (fetchError) {
        console.error('Fetch error in fetchActivity:', fetchError);
        serverLog('Fetch error in fetchActivity', { 
          error: fetchError instanceof Error ? fetchError.message : String(fetchError)
        });
        setError('Error de conexión al cargar la actividad');
        setIsLoading(false); // Ensure loading state is cleared
        return;
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      serverLog('Error in fetchActivity', { 
        error: error instanceof Error ? error.message : String(error)
      });
      setIsLoading(false); // Ensure loading state is cleared
      throw error; // Propagate the error to be handled by the parent function
    }
  };

  // Save submission state to localStorage
  const saveSubmissionState = () => {
    try {
      if (!activityId) return;
      
      // Guardar estado de entrega con timestamp
      const submissionData = {
        hasSubmitted: true,
        timestamp: Date.now()
      };
      localStorage.setItem(`activity_submission_${activityId}`, JSON.stringify(submissionData));
      console.log('Estado de entrega guardado en localStorage');
    } catch (err) {
      console.error('Error al guardar estado en localStorage:', err);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Download a file
  const downloadFile = async (fileId: string | undefined) => {
    if (!fileId) {
      toast.error('No file ID provided');
      return;
    }
    
    try {
      const response = await fetch(`/api/proxy/file-storage/download/${fileId}?preview=false`, {
        headers: {
          'Accept': 'application/json'
        }
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

  // Function to check if user has already submitted a response - versión mejorada
  const checkUserSubmission = async (activityId: string) => {
    try {
      console.log('Verificando si el usuario ya ha enviado una respuesta para la actividad:', activityId);
      serverLog('Starting checkUserSubmission', { activityId });
      
      // Si ya sabemos que el usuario ha enviado una respuesta, no es necesario verificar de nuevo
      if (userHasSubmitted) {
        console.log('Ya sabemos que el usuario ha enviado una respuesta, no es necesario verificar de nuevo');
        serverLog('User has already submitted - skipping check', { userHasSubmitted });
        return true;
      }
        
      // Obtener el token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
          
      if (!token) {
        console.error('No se encontró token al verificar el estado de entrega');
        serverLog('No token found', { tokenExists: false });
        return false;
      }
      
      // Decodificar el token para obtener el ID del usuario
      const decodedToken = decodeJwt(token);
      if (!decodedToken || !decodedToken.sub) {
        console.error('No se pudo obtener el ID de usuario del token');
        serverLog('Failed to decode token or get user ID', { decodedToken: !!decodedToken });
        return false;
      }
      
      const userId = decodedToken.sub;
      console.log('Verificando entregas para el usuario:', userId);
      serverLog('Checking submissions for user', { userId });
      
      // Use our proxy API endpoint to check user responses
      const userUrl = `/api/proxy/activitiesresponses/activity/${activityId}/user/${userId}`;
      console.log('Consultando endpoint para verificar entregas:', userUrl);
      serverLog('Fetching user submissions', { url: userUrl });
      
      // Add cache-busting
      const timestamp = new Date().getTime();
      const cacheBustingUrl = `${userUrl}?_=${timestamp}`;
      
      serverLog('Sending fetch request', { cacheBustingUrl });
      
      // To make the request even more robust, set a timeout
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout fetching user submissions')), 5000);
      });
      
      try {
        // Use Promise.race to implement timeout
        const userResponse = await Promise.race([
          fetch(cacheBustingUrl, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }),
          timeoutPromise
        ]) as Response;
        
        serverLog('Received response', { 
          status: userResponse.status,
          ok: userResponse.ok,
          statusText: userResponse.statusText
        });
        
        if (!userResponse.ok) {
          console.error('Error en la respuesta del servidor:', userResponse.status, userResponse.statusText);
          serverLog('Error in server response', { 
            status: userResponse.status,
            statusText: userResponse.statusText
          });
          
          // If the API fails, use the fallback endpoint that always returns []
          serverLog('Using fallback endpoint', {});
          const fallbackUrl = `/api/proxy/activitiesresponses/fallback?activityId=${activityId}&userId=${userId}`;
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (!fallbackResponse.ok) {
            // Even the fallback failed, give up
            setIsLoading(false);
            return false;
          }
          
          // Use the fallback response instead
          const fallbackData = await fallbackResponse.json();
          serverLog('Received fallback data', { data: fallbackData });
          
          // Since the fallback always returns [], the user has not submitted
          setUserHasSubmitted(false);
          serverLog('Set userHasSubmitted to false (from fallback)');
          return false;
        }
        
        // Get the response as text first
        const responseText = await userResponse.text();
        serverLog('Raw response text', { 
          textLength: responseText.length,
          text: responseText.length < 100 ? responseText : responseText.substring(0, 100) + '...'
        });
        
        // Handle empty responses explicitly
        if (!responseText || responseText.trim() === '') {
          serverLog('Empty response text - treating as empty array', {});
          setUserHasSubmitted(false);
          serverLog('Set userHasSubmitted to false (empty response)');
          return false;
        }
        
        // Try to parse the response as JSON
        let userData: any[] = [];
        try {
          userData = JSON.parse(responseText);
          // Ensure it's an array
          if (!Array.isArray(userData)) {
            serverLog('Response is not an array', { userData });
            userData = [];
          }
        } catch (parseError) {
          serverLog('Error parsing JSON response', { 
            error: parseError instanceof Error ? parseError.message : String(parseError),
            responseText
          });
          userData = [];
        }
        
        console.log('Respuesta del endpoint de usuario:', userData);
        serverLog('User submission data', { 
          dataLength: userData.length,
          data: userData
        });
        
        // Si hay alguna respuesta, el usuario ya ha enviado
        const hasSubmitted = Array.isArray(userData) && userData.length > 0;
        
        if (hasSubmitted) {
          console.log('El usuario ya ha enviado una respuesta');
          serverLog('User has submitted', { hasSubmitted: true });
          
          // Actualizar estado global y mensaje
          setUserHasSubmitted(true);
          serverLog('Set userHasSubmitted to true');
          
          // Si hay una respuesta con calificación, guardarla en el estado
          if (userData.length > 0 && userData[0].grade !== undefined) {
            setSubmittedResponse(userData[0]);
            serverLog('Set submitted response with grade', { grade: userData[0].grade });
          }
          
          // Guardar en localStorage para persistencia
          saveSubmissionState();
          serverLog('Saved submission state to localStorage');
          
          return true;
        } else {
          // Explicitly set to false if no submissions found
          console.log('El usuario no ha enviado ninguna respuesta');
          serverLog('User has not submitted any responses', { hasSubmitted: false });
          setUserHasSubmitted(false);
          serverLog('Set userHasSubmitted to false');
          return false;
        }
      } catch (fetchError) {
        console.error('Error en la petición fetch:', fetchError);
        serverLog('Fetch error in checkUserSubmission', { 
          error: fetchError instanceof Error ? fetchError.message : String(fetchError)
        });
        
        // If there's a timeout or network error, assume the user hasn't submitted
        setUserHasSubmitted(false);
        serverLog('Set userHasSubmitted to false due to fetch error');
        
        // Set loading state to false explicitly here to prevent infinite loading
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error al verificar entregas del usuario:', error);
      serverLog('Error checking user submissions', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Set loading state to false explicitly here to prevent infinite loading
      setIsLoading(false);
      return false;
    }
  };
  
  // Function to handle activity deletion
  const handleDeleteActivity = async () => {
    try {
      setIsDeleting(true);
      console.log(`Intentando eliminar actividad con ID: ${activityId}`);
      
      // Obtener el token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
          
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      const directResponse = await fetch(`http://82.29.168.17:8222/api/v1/activities/${activityId}`, {
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
      const hasSubmitted = await checkUserSubmission(activityId);
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
      url.searchParams.append('activityId', activityId);
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

  // Function to fetch all responses for an activity (for teachers)
  const fetchAllResponses = async () => {
    if (!activityId) return;
    
    setLoadingResponses(true);
    
    try {
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/proxy/activitiesresponses/activity/${activityId}?_=${timestamp}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching responses: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Responses data:', data);
      setResponses(data);
    } catch (error) {
      console.error('Error fetching all responses:', error);
      toast.error('Error al cargar las respuestas');
      // Clear responses in case of error
      setResponses([]);
    } finally {
      // Always clear loading state
      setLoadingResponses(false);
    }
  };

  // Function to handle viewing all responses (for teachers)
  const handleViewResponses = () => {
    setViewResponses(true);
    fetchAllResponses();
  };

  // Function to view a specific response detail
  const handleViewResponseDetail = (response: ActivityResponse) => {
    setSelectedResponse(response);
    setIsGrading(true);
    
    // If the response already has a grade, pre-fill the input
    if (response.grade !== undefined && response.grade !== null) {
      setGradeInput(response.grade.toString());
    } else {
      setGradeInput("");
    }
  };

  // Function to handle grade input change
  const handleGradeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers between 0 and 10
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) <= 10)) {
      setGradeInput(value);
    }
  };

  // Function to save a grade for a response
  const saveGrade = async () => {
    if (!selectedResponse) return;
    
    try {
      // Add validation
      const gradeValue = parseFloat(gradeInput);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
        toast.error('La calificación debe ser un número entre 0 y 10');
        return;
      }
      
      // Get user info from token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
        
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      // Decode token to get grader info
      const decodedToken = decodeJwt(token);
      if (!decodedToken) {
        throw new Error('No se pudo decodificar el token');
      }
      
      const graderId = decodedToken.sub || '';
      const graderName = decodedToken.name || decodedToken.preferred_username || 'Unknown User';
      
      // Create payload for grade update
      const payload = {
        id: selectedResponse.id,
        grade: gradeValue,
        gradedBy: graderName,
        gradedAt: new Date().toISOString()
      };
      
      // Save the grade via API
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/proxy/activitiesresponses/${selectedResponse.id}?_=${timestamp}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error saving grade: ${response.status}`);
      }
      
      toast.success('Calificación guardada correctamente');
      
      // Update local state
      const updatedResponse = {
        ...selectedResponse,
        grade: gradeValue,
        gradedBy: graderName,
        gradedAt: new Date().toISOString()
      };
      
      setSelectedResponse(updatedResponse);
      
      // Update in the responses list
      setResponses(responses.map(r => 
        r.id === selectedResponse.id ? updatedResponse : r
      ));
      
      // Close the grading dialog after a short delay
      setTimeout(() => {
        setIsGrading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      toast.error(`Error al guardar la calificación: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Function to get a file URL for download or preview
  const getFileUrl = (fileId: string | undefined): string => {
    if (!fileId) return '';
    return `/api/proxy/file-storage/download/${fileId}`;
  };

  // Format date and time for display
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return 'No disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // DocumentPreview component to preview files
  const DocumentPreview = ({ fileId, hideButtons = false }: { fileId: string | undefined, hideButtons?: boolean }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      const loadPreview = async () => {
        try {
          setLoading(true);
          if (!fileId) {
            throw new Error('No file ID provided');
          }
          // For preview, we'll use our proxy endpoint
          const url = `/api/proxy/file-storage/download/${fileId}?preview=true`;
          setPreviewUrl(url);
        } catch (err) {
          console.error('Error loading preview:', err);
          setError('No se pudo cargar la vista previa');
        } finally {
          setLoading(false);
        }
      };
      
      if (fileId) {
        loadPreview();
      } else {
        setError('No se proporcionó un ID de archivo');
        setLoading(false);
      }
    }, [fileId]);
    
    if (loading) {
      return (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (error || !fileId) {
      return (
        <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md">
          <p>{error || 'No hay archivo disponible'}</p>
          {!hideButtons && fileId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadFile(fileId)}
              className="mt-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar archivo
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {!hideButtons && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Vista previa del archivo
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadFile(fileId)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        )}
        <div className="border rounded-md overflow-hidden">
          <iframe 
            src={previewUrl} 
            className="w-full h-[400px]" 
            title="Vista previa" 
          />
        </div>
      </div>
    );
  };

  // Response card component to display in the list
  const ResponseCard = ({ response, onViewDetails }: { 
    response: ActivityResponse, 
    onViewDetails: (response: ActivityResponse) => void 
  }) => {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium truncate">{response.studentName}</h3>
              {response.grade !== undefined && response.grade !== null ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {response.grade}/10
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Pendiente
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Enviado: {response.createdAt ? formatDateTime(response.createdAt) : 'No disponible'}
            </p>
          </div>
          <div className="p-4">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => onViewDetails(response)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Safety mechanism to ensure loading state doesn't get stuck
  useEffect(() => {
    if (isLoading) {
      serverLog('Safety timeout started for isLoading', { isLoading: true });
      // Set a timeout to clear loading state after 15 seconds if it's still loading
      const safetyTimer = setTimeout(() => {
        console.log('Safety timeout: clearing loading state after timeout');
        serverLog('Safety timeout triggered - clearing isLoading', { isLoading: true });
        setIsLoading(false);
      }, 15000);
      
      // Clear the timeout when loading state changes or component unmounts
      return () => {
        clearTimeout(safetyTimer);
        serverLog('Safety timeout for isLoading cleared', { isLoading });
      };
    }
  }, [isLoading]);

  // Safety mechanism for loadingResponses state
  useEffect(() => {
    if (loadingResponses) {
      serverLog('Safety timeout started for loadingResponses', { loadingResponses: true });
      // Set a timeout to clear loading state after 10 seconds if it's still loading
      const safetyTimer = setTimeout(() => {
        console.log('Safety timeout: clearing loadingResponses state after timeout');
        serverLog('Safety timeout triggered - clearing loadingResponses', { loadingResponses: true });
        setLoadingResponses(false);
      }, 10000);
      
      // Clear the timeout when loading state changes or component unmounts
      return () => {
        clearTimeout(safetyTimer);
        serverLog('Safety timeout for loadingResponses cleared', { loadingResponses });
      };
    }
  }, [loadingResponses]);

  // Server-side debug logger function
  const serverLog = async (message: string, data: any = {}) => {
    try {
      await fetch('/api/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component: 'ActivityPage',
          activityId,
          message,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to log to server:', error);
    }
  };

  // Add the debug mode indicator
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Helper function to get current user ID
  const getCurrentUserId = (): string | null => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      
      if (!token) return null;
      
      const decodedToken = decodeJwt(token);
      return decodedToken?.sub || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  };

  // Log initial component state
  useEffect(() => {
    serverLog('Component mounted', {
      activityId,
      initializing,
      isLoading,
      loadingResponses,
      userHasSubmitted,
      params: params ? { id: params.id } : null,
      userId: getCurrentUserId(),
    });
  }, []);

  // Determine if loading is taking too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowEmergencyReset(true);
        serverLog("Emergency reset button shown", { isLoading });
      }, 5000); // Show after 5 seconds of loading
    } else {
      setShowEmergencyReset(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);
  
  // Handle emergency reset
  const handleEmergencyReset = () => {
    serverLog("Emergency reset triggered by user", { 
      isLoading, 
      initializing,
      activityId,
      userHasSubmitted 
    });
    setIsLoading(false);
    setError("La carga se ha reiniciado. Por favor, intenta recargar la página si sigues teniendo problemas.");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {initializing ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p>Inicializando...</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p>Cargando actividad...</p>
            
            {showEmergencyReset && (
              <div className="mt-8 p-4 bg-red-100 border border-red-500 text-red-700 rounded-md">
                <p className="font-bold">La carga está tardando más de lo esperado</p>
                <p className="mb-4">Puedes reiniciar la carga si crees que hay un problema</p>
                <button 
                  onClick={handleEmergencyReset}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
                >
                  Reiniciar Carga
                </button>
              </div>
            )}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="mt-4 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
          >
            Volver al Dashboard
          </button>
        </div>
      ) : authError ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Error de Autenticación</p>
          <p>{authError}</p>
          <button 
            onClick={() => window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname)} 
            className="mt-4 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
          >
            Iniciar Sesión
          </button>
        </div>
      ) : activity ? (
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
          ) : (
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
          )}
        </div>
        
        {/* Debug tools in development mode */}
        {isDevelopment && (
          <div className="mt-8 border-t pt-4 text-xs text-gray-500">
            <p>Debug Tools (Development Only)</p>
            <div className="flex gap-2 mt-2">
              <a 
                href="/debug" 
                target="_blank" 
                className="text-blue-500 hover:underline"
              >
                View Debug Logs
              </a>
              <span>|</span>
              <a 
                href={`/api/debug-proxy?activityId=${activityId}&userId=${getCurrentUserId() || ''}`} 
                target="_blank" 
                className="text-blue-500 hover:underline"
              >
                Test API Response
              </a>
              <span>|</span>
              <a 
                href={`/api/debug/test-proxy?activityId=${activityId}&userId=${getCurrentUserId() || ''}`} 
                target="_blank" 
                className="text-blue-500 hover:underline"
              >
                Test Proxy
              </a>
              <span>|</span>
              <a 
                href={`/api/proxy/activitiesresponses/fallback?activityId=${activityId}&userId=${getCurrentUserId() || ''}`} 
                target="_blank" 
                className="text-blue-500 hover:underline"
              >
                Fallback API
              </a>
              <span>|</span>
              <button 
                onClick={() => {
                  setIsLoading(false);
                  serverLog('Manual reset of loading state', { isLoading: false });
                }}
                className="text-red-500 hover:underline"
              >
                Reset Loading State
              </button>
            </div>
          </div>
        )}
        </StableContainer>
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
                            window.open(getFileUrl(fileId), '_blank');
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver en nueva pestaña
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          const fileId = selectedResponse.responseFileId || selectedResponse.fileId || selectedResponse.fileURL;
                          if (fileId) {
                            downloadFile(fileId);
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar archivo
                      </Button>
                    </div>
                    
                    {/* Mostrar la previsualización */}
                    <div className="border rounded-md overflow-hidden h-[400px]">
                      {selectedResponse.responseFileId || selectedResponse.fileId || selectedResponse.fileURL ? (
                        <DocumentPreview 
                          fileId={selectedResponse.responseFileId || selectedResponse.fileId || selectedResponse.fileURL}
                          hideButtons={true}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No hay archivo disponible para previsualizar</p>
                        </div>
                      )}
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