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
  { params }: { params: { id: string } }
) {
  // Await params to avoid Next.js warnings
  const id = await params.id;
  console.log(`OPTIONS request for grade endpoint with ID: ${id}`);
  
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

// POST endpoint to save grade for an activity response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we properly await the params to avoid Next.js warnings
    const id = await params.id;
    
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

    console.log(`Saving grade for activity response ID: ${id} through Next.js API route`)

    // Get the grade from the request body
    const { grade } = await request.json();
    
    if (grade === undefined || isNaN(grade) || grade < 0 || grade > 10) {
      return NextResponse.json(
        { error: 'Invalid grade. Must be a number between 0 and 10' },
        { status: 400 }
      )
    }

    // Make request to backend API with all necessary details
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/${id}/grade`
    console.log(`Making request to: ${apiUrl}`)
    console.log(`Grade value: ${grade}`)
    console.log(`Token (first 30 chars): ${accessToken.substring(0, 30)}...`)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://82.29.168.17:3000'
        },
        body: JSON.stringify({ grade }),
        credentials: 'include'
      });
      
      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        // Try to get more details from the error response
        try {
          const errorData = await response.text();
          console.error('Error details:', errorData);
          
          // Return the error details to the client
          return NextResponse.json(
            { error: `Failed to save grade: ${response.status}`, details: errorData },
            { status: response.status }
          );
        } catch (e) {
          console.error('Could not read error details');
          return NextResponse.json(
            { error: `Failed to save grade: ${response.status}` },
            { status: response.status }
          );
        }
      }

      // If we get here, we successfully saved the grade
      console.log('Grade saved successfully');
      
      return NextResponse.json({ success: true, message: 'Grade saved successfully' }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
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
      { error: 'Failed to save grade', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 