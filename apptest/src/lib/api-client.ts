import Cookies from 'js-cookie';
import { toast } from 'sonner';

const API_BASE_URL = 'http://82.29.168.17:8222/api/v1';

interface FetchOptions extends RequestInit {
  skipAuthHeader?: boolean;
}

/**
 * Obtiene el token JWT almacenado en las cookies
 */
export const getToken = (): string | undefined => {
  return Cookies.get('access_token');
};

/**
 * Cliente HTTP personalizado que incluye automáticamente el token JWT en todas las solicitudes
 */
export async function apiClient<T = any>(
  endpoint: string,
  { body, headers, skipAuthHeader = false, ...customConfig }: FetchOptions = {}
): Promise<T> {
  const token = getToken();
  
  // Construir la URL completa
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Configuración por defecto de la solicitud
  const config: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token && !skipAuthHeader ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    mode: 'cors',
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);
    
    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        Cookies.remove('access_token');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
      
      // Try to parse error response as JSON, fall back to text if not JSON
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
      } catch (jsonError) {
        // If JSON parsing fails, try to get text content
        try {
          const textContent = await response.text();
          errorMessage = textContent || `Error: ${response.status} ${response.statusText}`;
        } catch (textError) {
          // If that also fails, use status and statusText
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
      }
      
      // Don't show toast for 404 errors on GET requests, as these might be expected
      // (e.g., checking if a resource exists)
      if (!(config.method === 'GET' && response.status === 404)) {
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    // Para respuestas vacías (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }
    
    // Intentar parsear la respuesta como JSON
    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      // If JSON parsing fails, check if the response is empty
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      
      // Otherwise, this is an unexpected error
      console.error('Error parsing JSON response:', text);
      throw new Error('Error parsing server response');
    }
  } catch (error) {
    if (error instanceof Error) {
      // Si ya es un error conocido, simplemente re-lanzarlo
      if (error.message === 'Sesión expirada') {
        throw error;
      }
      
      // Network errors (CORS, server down, etc.)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error:', error);
        toast.error('Error de conexión con el servidor. Verifica tu conexión a internet.');
        throw new Error('Network error: Unable to connect to server');
      }
      
      console.error('Error en la solicitud API:', error);
      
      // Don't show duplicate toasts if we've already shown one above
      if (!error.message.startsWith('Error:') && !error.message.startsWith('Network error:')) {
        toast.error(`Error de conexión: ${error.message}`);
      }
    }
    throw error;
  }
}

// Métodos HTTP comunes
export const api = {
  get: <T = any>(endpoint: string, config: FetchOptions = {}) => 
    apiClient<T>(endpoint, { ...config, method: 'GET' }),
  
  post: <T = any>(endpoint: string, body: any, config: FetchOptions = {}) => 
    apiClient<T>(endpoint, { ...config, body, method: 'POST' }),
  
  put: <T = any>(endpoint: string, body: any, config: FetchOptions = {}) => 
    apiClient<T>(endpoint, { ...config, body, method: 'PUT' }),
  
  patch: <T = any>(endpoint: string, body: any, config: FetchOptions = {}) => 
    apiClient<T>(endpoint, { ...config, body, method: 'PATCH' }),
  
  delete: <T = any>(endpoint: string, config: FetchOptions = {}) => 
    apiClient<T>(endpoint, { ...config, method: 'DELETE' }),
  
  getToken: () => getToken(),
}; 