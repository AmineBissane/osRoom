import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isTokenValid } from './lib/auth'

export function middleware(request: NextRequest) {
  // For API routes, only add CORS headers
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', '*') // Adjust this in production
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )
    
    return response
  }
  
  // Get all cookies for debugging
  const allCookies = request.cookies.getAll()
  console.log('All cookies in middleware:', allCookies.map(c => `${c.name}=${c.value.substring(0, 10)}...`))
  
  // Check for access token
  const tokenCookie = request.cookies.get('access_token')
  const tokenValue = tokenCookie?.value
  
  console.log('Access token in middleware:', tokenValue ? `Present (${tokenValue.substring(0, 10)}...)` : 'Not found')
  
  // Validate the token
  const hasValidToken = isTokenValid(tokenValue)
  console.log('Token validation result:', hasValidToken ? 'Valid' : 'Invalid')
  
  const response = NextResponse.next()

  // Check if the user is trying to access the login page
  if (request.nextUrl.pathname === '/login') {
    // If they have a valid token, redirect to home or the 'from' parameter if available
    if (hasValidToken) {
      const fromPath = request.nextUrl.searchParams.get('from')
      const redirectUrl = fromPath && fromPath !== '/' ? fromPath : '/'
      console.log('Redirecting from login to:', redirectUrl)
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    // If no valid token, allow access to login
    return response
  }

  // For all other routes, check for valid token
  if (!hasValidToken) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    console.log('No valid token found, redirecting to:', loginUrl.toString())
    return NextResponse.redirect(loginUrl)
  }

  // Add token validation header for client-side use
  if (tokenValue) {
    response.headers.set('x-auth-token', tokenValue)
  }

  return response
}

// Handle OPTIONS requests for CORS preflight
export function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )
  
  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all other routes except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 