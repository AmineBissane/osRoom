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
  console.log(`OPTIONS request for student responses endpoint with student ID: ${studentId}`);
  
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

// GET endpoint to fetch all activity responses for a student
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
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    console.log(`Fetching activity responses for student ID: ${studentId}`);

    // Make request to backend API
    const apiUrl = `http://localhost:8222/api/v1/activitiesresponses/student/${studentId}`;
    console.log(`Making request to: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        credentials: 'include'
      });
      
      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        // Try to get more details from the error response
        try {
          const errorData = await response.text();
          console.error('Error details:', errorData);
          
          return NextResponse.json(
            { error: `Failed to fetch student responses: ${response.status}`, details: errorData },
            { status: response.status }
          );
        } catch (e) {
          console.error('Could not read error details');
          return NextResponse.json(
            { error: `Failed to fetch student responses: ${response.status}` },
            { status: response.status }
          );
        }
      }

      // If we get here, we successfully fetched the data
      const data = await response.json();
      console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 0} responses`);
      
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
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to connect to backend service', details: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student responses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 