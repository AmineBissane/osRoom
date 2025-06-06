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
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  // Await params to avoid Next.js warnings
  const studentId = await params.studentId;
  console.log(`OPTIONS request for student ${studentId} activities endpoint`);
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    },
  })
}

// GET endpoint to fetch all activities for a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    // Ensure we properly await the params to avoid Next.js warnings
    const studentId = await params.studentId;
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    // Also check for Authorization header in case token is passed that way
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Use token from cookie or header
    const accessToken = token || tokenFromHeader;

    if (!accessToken) {
      console.error('No authentication token found');
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    console.log(`Fetching all activities for student ID: ${studentId}`);

    // Check if a classId filter is provided in the query parameters
    const classId = request.nextUrl.searchParams.get('classId');
    
    // Build the API URL
    let apiUrl = `http://82.29.168.17:8222/api/v1/activities/student/${studentId}`;
    
    // Add classId to query parameters if provided
    if (classId) {
      apiUrl = `http://82.29.168.17:8222/api/v1/activities/student/${studentId}/class/${classId}`;
      console.log(`Filtering by class ID: ${classId}`);
    }
    
    console.log(`Making direct request to backend: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Backend response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = `Error from backend: ${response.status}`;
        
        try {
          const errorText = await response.text();
          console.error('Backend error details:', errorText);
          errorMessage = errorText;
        } catch (e) {
          console.error('Could not read error details from backend');
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }

      // If we get here, we successfully fetched the data
      const data = await response.json();
      console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 0} activities for student`);
      
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (fetchError) {
      console.error('Error connecting to backend:', fetchError);
      return NextResponse.json(
        { error: 'Failed to connect to backend service', details: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 