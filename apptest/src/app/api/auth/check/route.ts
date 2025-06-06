import { NextRequest, NextResponse } from 'next/server';
import { isTokenValid } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Check for token in cookies as fallback
    const cookieToken = request.cookies.get('access_token')?.value;
    
    // Use either token source
    const accessToken = token || cookieToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    // Validate the token
    const isValid = isTokenValid(accessToken);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Token is valid
    return NextResponse.json(
      { status: 'authenticated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
} 