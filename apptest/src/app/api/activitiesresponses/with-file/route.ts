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

// POST endpoint to submit a new activity response with a note
export async function POST(request: NextRequest) {
  try {
    console.log('Received request to /api/activitiesresponses/with-file');
    
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

    console.log('Token found and will be forwarded to backend');

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const activityId = searchParams.get('activityId');
    
    // Get student ID from query params
    const studentId = searchParams.get('studentId');
    
    // Get student name from query params or token
    const studentName = searchParams.get('studentName');

    // Log query parameters
    console.log('Query parameters:');
    console.log('Activity ID:', activityId);
    console.log('Student ID:', studentId);
    console.log('Student Name:', studentName);
    
    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // The request should be a FormData object
    const formData = await request.formData()
    
    // Log all form data fields
    console.log('Form data fields:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    // Get the file from the form data
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // DIRECT BACKEND APPROACH - Skip the proxy and talk directly to the backend
    try {
      // Create FormData for the backend request
      const backendFormData = new FormData()
      backendFormData.append('file', file)
      
      // Add note if available
      const finalNote = formData.get('finalNote')
      if (finalNote) {
        backendFormData.append('finalNote', finalNote.toString())
      }

      // Build the URL with query parameters
      const url = new URL('http://localhost:8222/api/v1/activitiesresponses/with-file');
      url.searchParams.append('activityId', activityId);
      
      // Add studentId if available, otherwise get it from the token
      if (studentId) {
        url.searchParams.append('studentId', studentId);
      } else {
        // Extract from token
        const decodedToken = decodeJwt(accessToken);
        const tokenStudentId = decodedToken?.sub || '';
        url.searchParams.append('studentId', tokenStudentId);
      }
      
      // Add studentName if available, otherwise get it from the token
      if (studentName) {
        url.searchParams.append('studentName', studentName);
      } else {
        // Extract from token
        const decodedToken = decodeJwt(accessToken);
        const tokenStudentName = decodedToken?.name || decodedToken?.preferred_username || 'Unknown';
        url.searchParams.append('studentName', tokenStudentName);
      }
      
      console.log(`Sending direct request to backend: ${url.toString()}`);
      
      const directResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: backendFormData
      });
      
      console.log(`Backend response status: ${directResponse.status}`);
      
      // Handle the response
      if (!directResponse.ok) {
        let errorMessage = `Error from backend: ${directResponse.status}`;
        
        try {
          const errorText = await directResponse.text();
          console.error('Backend error details:', errorText);
          
          if (errorText.includes('already submitted')) {
            return NextResponse.json(
              { error: 'You have already submitted a response for this activity' },
              { status: 400 }
            );
          }
          
          errorMessage = errorText;
        } catch (e) {
          console.error('Could not read error details from backend');
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: directResponse.status }
        );
      }
      
      // Success case
      try {
        const result = await directResponse.json();
        console.log('Success response from backend:', result);
        
        return NextResponse.json(result, {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      } catch (parseError) {
        // Even if we can't parse the JSON, it was still a success
        console.warn('Could not parse JSON from successful response, but request was successful');
        return NextResponse.json({ success: true, message: 'Activity response submitted successfully' }, { status: 201 });
      }
    } catch (directError) {
      console.error('Error with direct backend request:', directError);
      return NextResponse.json(
        { error: 'Failed to communicate with backend server', details: directError instanceof Error ? directError.message : String(directError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit activity response', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 