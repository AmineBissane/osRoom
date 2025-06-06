/**
 * Utility function to make authenticated fetch requests
 * This ensures the JWT token is always included in the Authorization header
 */

import Cookies from 'js-cookie';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  responseType?: 'json' | 'blob' | 'text';
  retry?: boolean;  // Add retry option
  fallbackToDirectBackend?: boolean; // Add option to try direct backend connection
}

// Define backend URL
const BACKEND_URL = 'http://82.29.168.17:8222';

/**
 * Decode JWT token and extract payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Get current user ID from JWT token
 * @returns User ID from token sub claim or null if not available
 */
export function getCurrentUserId(): string | null {
  const token = Cookies.get('access_token');
  if (!token) return null;
  
  const decoded = decodeJwt(token);
  return decoded?.sub || null;
}

/**
 * Get current username from JWT token
 * @returns Username from token or null if not available
 */
export function getCurrentUsername(): string | null {
  const token = Cookies.get('access_token');
  if (!token) return null;
  
  const decoded = decodeJwt(token);
  return decoded?.name || decoded?.preferred_username || decoded?.sub || null;
}

/**
 * Check if the current user has a specific role
 * @param role Role to check for
 * @returns boolean indicating if user has the role
 */
export function hasRole(role: string): boolean {
  const token = Cookies.get('access_token');
  if (!token) return false;
  
  const decoded = decodeJwt(token);
  if (!decoded) return false;
  
  // Check in different locations where roles might be stored in JWT
  const roles: string[] = [];
  
  if (decoded.realm_access?.roles) {
    roles.push(...decoded.realm_access.roles);
  }
  
  if (decoded.roles) {
    roles.push(...decoded.roles);
  }
  
  return roles.includes(role) || 
         roles.includes(`ROLE_${role}`) || 
         roles.includes(role.toUpperCase());
}

// Helper function to convert API paths to direct backend paths
const convertToBackendPath = (path: string): string => {
  // Skip conversion if the path is already a full URL
  if (path.startsWith('http')) {
    return path;
  }

  // Paths that need to be mapped to backend
  const pathMap: Record<string, string> = {
    '/api/activities': '/api/v1/activities',
    '/api/activitiesresponses': '/api/v1/activitiesresponses',
    '/api/file-storage': '/api/v1/files',
    '/api/auth': '/api/v1/auth',
    '/api/student-activities': '/api/v1/student-activities',
  };

  // Check each prefix
  for (const [prefix, backendPrefix] of Object.entries(pathMap)) {
    if (path.startsWith(prefix)) {
      return BACKEND_URL + path.replace(prefix, backendPrefix);
    }
  }

  // If no match found, just append to backend URL with api/v1 prefix
  // First remove /api if it exists
  const cleanPath = path.startsWith('/api') ? path.replace('/api', '') : path;
  return `${BACKEND_URL}/api/v1${cleanPath}`;
};

/**
 * Make an authenticated fetch request with JWT token in Authorization header
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Fetch response
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
  const { 
    skipAuth = false, 
    responseType = 'json', 
    retry = true, 
    fallbackToDirectBackend = true, 
    ...fetchOptions 
  } = options;
  
  // Clone the headers to avoid modifying the original
  const headers = new Headers(fetchOptions.headers || {});
  
  // Get token from cookies
  const token = Cookies.get('access_token');
  
  if (!skipAuth) {
    if (token) {
      console.log('Adding Authorization header with token');
      // Add Authorization header with Bearer token
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No access token found in cookies');
    }
  }
  
  // Add common headers if not sending FormData
  const isFormData = fetchOptions.body instanceof FormData;
  
  if (!isFormData) {
    // Only set Content-Type if not FormData (browser will set it with boundary for FormData)
    if (!headers.has('Content-Type') && responseType === 'json' && fetchOptions.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }
    
    if (!headers.has('Accept')) {
      if (responseType === 'json') {
        headers.set('Accept', 'application/json');
      } else if (responseType === 'blob') {
        headers.set('Accept', '*/*');
      }
    }
  } else {
    // If Content-Type is manually set for FormData, remove it to let browser handle it
    if (headers.has('Content-Type')) {
      headers.delete('Content-Type');
    }
  }
  
  // Print all headers for debugging
  console.log('Request headers:');
  headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  
  // Create new options with updated headers
  const newOptions = {
    ...fetchOptions,
    headers,
    credentials: 'include' as RequestCredentials // Include cookies in request
  };
  
  try {
    // Make the request
    const response = await fetch(url, newOptions);
    
    // Handle 401 Unauthorized errors
    if (response.status === 401 && retry) {
      console.log('401 Unauthorized: Token may be expired, checking response');
      
      // Check if the response contains a refreshed token
      // The backend API endpoint may have already refreshed the token and set new cookies
      const refreshedToken = Cookies.get('access_token');
      if (refreshedToken && refreshedToken !== headers.get('Authorization')?.replace('Bearer ', '')) {
        console.log('New token detected after 401, retrying with new token');
        
        // Retry the request with the new token
        return fetchWithAuth(url, {
          ...options,
          retry: false // Prevent infinite retry loop
        });
      }
      
      console.error('Authentication failed and no new token available');
    }
    
    // Handle 403 Forbidden or 404 Not Found - try direct connection to backend if enabled
    if ((response.status === 403 || response.status === 404) && fallbackToDirectBackend) {
      // Check if we can try a direct connection to the backend
      if (url.startsWith('/api/') && token) {
        console.log('Received 403/404, attempting direct connection to backend');
        
        // Special handling for grade endpoints
        if (url.includes('/activitiesresponses/grade/')) {
          const id = url.split('/').pop();
          const directGradeUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/${id}/grade`;
          console.log(`Direct backend URL for grade endpoint: ${directGradeUrl}`);
          
          // Make direct request to backend
          return fetch(directGradeUrl, {
            ...fetchOptions,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'http://82.29.168.17:3000'
            },
            credentials: 'include'
          });
        }
        
        // Standard URL transformations for other endpoints
        const backendUrl = url
          .replace('/api/activities/', 'http://82.29.168.17:8222/api/v1/activities/')
          .replace('/api/activitiesresponses/', 'http://82.29.168.17:8222/api/v1/activitiesresponses/')
          .replace('/api/backend/', 'http://82.29.168.17:8222/api/v1/');
        
        console.log(`Direct backend URL: ${backendUrl}`);
        
        // Make direct request to backend
        return fetch(backendUrl, {
          ...fetchOptions,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'http://82.29.168.17:3000'
          },
          credentials: 'include'
        });
      }
    }
    
    // Special handling for 400 errors about duplicated submissions
    if (response.status === 400) {
      try {
        // Clone the response before reading it to avoid consuming it
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        
        // Check if the error is about already submitted responses
        if (text.includes("already submitted")) {
          console.warn('Detected duplicate submission error:', text);
          
          // Create a custom response with the error
          return new Response(text, {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (error) {
        console.error('Error checking 400 response content:', error);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    
    // If request fails (e.g. network error) and fallback is enabled, try direct connection
    if (fallbackToDirectBackend && url.startsWith('/api/') && token) {
      try {
        console.log('Network error, attempting direct connection to backend');
        
        // Special handling for grade endpoints
        if (url.includes('/activitiesresponses/grade/')) {
          const id = url.split('/').pop();
          const directGradeUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/${id}/grade`;
          console.log(`Direct backend URL for grade endpoint: ${directGradeUrl}`);
          
          return fetch(directGradeUrl, {
            ...fetchOptions,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'http://82.29.168.17:3000'
            },
            credentials: 'include'
          });
        }
        
        // Standard URL transformations for other endpoints
        const backendUrl = url
          .replace('/api/activities/', 'http://82.29.168.17:8222/api/v1/activities/')
          .replace('/api/activitiesresponses/', 'http://82.29.168.17:8222/api/v1/activitiesresponses/')
          .replace('/api/backend/', 'http://82.29.168.17:8222/api/v1/');
        
        console.log(`Direct backend URL on error fallback: ${backendUrl}`);
        
        return fetch(backendUrl, {
          ...fetchOptions,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'http://82.29.168.17:3000'
          },
          credentials: 'include'
        });
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
} 