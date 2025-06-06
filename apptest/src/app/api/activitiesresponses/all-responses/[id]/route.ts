import { NextRequest, NextResponse } from 'next/server'

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

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value
    
    // Also check for Authorization header in case token is passed that way
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null
    
    // Use token from cookie or header
    const accessToken = token || tokenFromHeader

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    console.log(`Fetching all responses for activity ID: ${id}`)

    // Decode the token to check user role
    const decodedToken = decodeJwt(accessToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    // Check if user has teacher/admin role
    // This is a placeholder - adjust according to your actual role structure
    const userRoles = decodedToken.roles || [];
    const isTeacherOrAdmin = userRoles.some((role: string) => 
      ['ROLE_TEACHER', 'ROLE_ADMIN', 'TEACHER', 'ADMIN'].includes(role)
    );

    // For testing purposes, allow access without role check
    // In production, uncomment this check
    /*
    if (!isTeacherOrAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only teachers and administrators can view all responses' },
        { status: 403 }
      )
    }
    */

    // Make request to backend API
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${id}/all`
    console.log(`Making request to: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      mode: 'cors'
    })
    
    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await response.text()
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Could not read error details')
      }
      
      return NextResponse.json(
        { error: `Failed to fetch activity responses: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Response data received');
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity responses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 