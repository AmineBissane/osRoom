import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For API routes, only add CORS headers
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', '*') // Adjust this in production
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )
    
    return response
  }
  
  const token = request.cookies.get('access_token')
  const response = NextResponse.next()

  // Check if the user is trying to access the login page
  if (request.nextUrl.pathname === '/login') {
    // If they have a token, redirect to home or the 'from' parameter if available
    if (token) {
      const fromPath = request.nextUrl.searchParams.get('from')
      const redirectUrl = fromPath && fromPath !== '/' ? fromPath : '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    // If no token, allow access to login
    return response
  }

  // For all other routes, check for token
  if (!token) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Add token validation header for client-side use
  response.headers.set('x-auth-token', token.value)

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