import { NextRequest } from 'next/server';

/**
 * Safely extracts route parameters to avoid synchronous access errors
 * Use this instead of destructuring params directly
 * @param params The route parameters object
 * @returns The resolved parameters
 */
export async function getRouteParams<T extends Record<string, string>>(params: T): Promise<T> {
  return await Promise.resolve(params);
}

/**
 * Gets a token from the request cookies
 * @param request The request object
 * @returns The access token or null if not found
 */
export function getAccessToken(request: Request | NextRequest): string | null {
  // For NextRequest objects
  if (request instanceof NextRequest) {
    return request.cookies.get('access_token')?.value || null;
  }
  
  // For standard Request objects
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/access_token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

/**
 * Ensures the token has the proper Bearer prefix
 * @param token The token to format
 * @returns The properly formatted token
 */
export function formatBearerToken(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
} 