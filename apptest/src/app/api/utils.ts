import { NextRequest } from 'next/server';

/**
 * Safely gets route parameters and returns them as an object
 */
export async function getRouteParams(params: any) {
  return await Promise.resolve(params);
}

/**
 * Gets the access token from cookies in the request
 */
export function getAccessToken(request: NextRequest): string | null {
  return request.cookies.get('access_token')?.value || null;
}

/**
 * Formats a token as a Bearer token if it's not already
 */
export function formatBearerToken(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
} 