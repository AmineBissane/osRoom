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
  { params }: { params: { studentId: string, activityId: string } }
) {
  // Await params to avoid Next.js warnings
  const studentId = await params.studentId;
  const activityId = await params.activityId;
  console.log(`OPTIONS request for student ${studentId} and activity ${activityId} endpoint`);
  
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

// GET endpoint to fetch responses for a specific student and activity
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string, activityId: string } }
) {
  try {
    // Ensure we properly await the params to avoid Next.js warnings
    const studentId = await params.studentId;
    const activityId = await params.activityId;
    
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

    console.log(`Fetching responses for student ID: ${studentId} and activity ID: ${activityId}`);

    // Make direct request to backend API
    let apiUrl: string;
    
    // Determine the correct endpoint based on what we're trying to fetch
    if (activityId && studentId) {
      // Fetching a specific student's submissions for a specific activity
      apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}/student/${studentId}`;
    } else if (studentId && !activityId) {
      // Fetching all activities for a student (fallback)
      apiUrl = `http://82.29.168.17:8222/api/v1/activities/student/${studentId}`;
    } else {
      // Invalid request
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
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
      console.log(`Successfully fetched data from backend`);
      
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
      { error: 'Failed to fetch responses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 