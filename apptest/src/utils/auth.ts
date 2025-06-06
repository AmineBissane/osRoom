import jwt, { JwtPayload } from 'jsonwebtoken'

// Define custom interface for our JWT payload
export interface CustomJwtPayload extends JwtPayload {
  preferred_username?: string;
  classCategory?: string;
  class?: string;
  sub?: string;
  exp?: number;
}

// Function to validate if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as CustomJwtPayload;
    if (!decoded || !decoded.exp) return true;
    
    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if we can't decode
  }
}

// Function to sanitize token format
export function sanitizeToken(token: string): string | null {
  if (!token) return null;
  
  // Some token issues to check for:
  
  // 1. Remove any quotes if the token was incorrectly stored with them
  let sanitized = token.replace(/^["'](.*)["']$/, '$1');
  
  // 2. Check if the token has the correct format (3 parts separated by dots)
  if (!sanitized.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
    console.error('Invalid token format after sanitization:', sanitized.substring(0, 20) + '...');
    return null;
  }
  
  return sanitized;
}

// Function to decode JWT token and extract user attributes
export function decodeToken(token: string): CustomJwtPayload | null {
  try {
    // Sanitize the token first
    const sanitizedToken = sanitizeToken(token);
    if (!sanitizedToken) {
      console.error('Invalid token format:', token ? token.substring(0, 20) + '...' : 'null');
      return null;
    }
    
    const decoded = jwt.decode(sanitizedToken) as CustomJwtPayload;
    
    // Log token details for debugging
    if (decoded) {
      console.log('Token decoded successfully, contains:', {
        sub: decoded.sub ? `${decoded.sub.substring(0, 8)}...` : 'missing',
        username: decoded.preferred_username ? `${decoded.preferred_username.substring(0, 8)}...` : 'missing',
        class: decoded.class || 'missing',
        category: decoded.classCategory || 'missing',
        expiry: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'missing'
      });
    } else {
      console.error('Token decoded to null');
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Function to refresh token
export async function refreshToken(refreshToken: string) {
  console.log('Attempting to refresh token');
  
  if (!refreshToken) {
    console.error('No refresh token provided');
    throw new Error('No refresh token provided');
  }
  
  const formData = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID || 'backendgateway',
    client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET || 'vuYLYCo5JrMbLTZQCOH8nBkltsqXPCLe',
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  try {
    console.log('Sending refresh token request to Keycloak');
    
    const response = await fetch(
      'http://82.29.168.17:8080/realms/osRoom/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );
    
    console.log('Refresh token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to refresh token:', errorText);
      throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Token refreshed successfully');
    
    return result;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

// Extract user ID from token
export function getUserIdFromToken(token: string): string | null {
  if (!token) {
    console.error('Cannot extract user ID: No token provided');
    return null;
  }
  
  console.log('Extracting user ID from token');
  const decodedToken = decodeToken(token);
  
  if (!decodedToken) {
    console.error('Failed to decode token for user ID extraction');
    return null;
  }
  
  const userId = decodedToken.sub || decodedToken.preferred_username || null;
  console.log('Extracted user ID:', userId ? `${userId.substring(0, 8)}...` : 'null');
  
  return userId;
}

// Get class category from token
export function getClassCategoryFromToken(token: string): string | null {
  if (!token) {
    console.error('Cannot extract class category: No token provided');
    return null;
  }
  
  console.log('Extracting class category from token');
  const decodedToken = decodeToken(token);
  
  if (!decodedToken) {
    console.error('Failed to decode token for class category extraction');
    return null;
  }
  
  // First try to get the 'class' attribute, then fall back to classCategory or preferred_username
  const category = decodedToken.class || decodedToken.classCategory || decodedToken.preferred_username || null;
  console.log('Extracted class category:', category || 'null');
  
  return category;
} 