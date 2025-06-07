import { NextRequest, NextResponse } from 'next/server'
import { refreshToken } from '@/utils/auth'

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  await params; // Asegurarse de esperar los parámetros aunque no los usemos
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*', // Adjust this in production
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    },
  })
}

// DELETE endpoint to delete an activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const { activityId } = await params;
    
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

    console.log(`Deleting activity with ID: ${activityId} through Next.js API route`)

    // Make request to backend API with all necessary details
    const apiUrl = `http://82.29.168.17:8222/api/v1/activities/${activityId}`
    console.log(`Making request to: ${apiUrl}`)
    console.log(`Token (first 30 chars): ${accessToken.substring(0, 30)}...`)

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://82.29.168.17:3000'
      },
      credentials: 'include'
    })
    
    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await response.text()
        console.error('Error details:', errorData)
        
        // Return the error details to the client
        return NextResponse.json(
          { error: `Failed to delete activity: ${response.status}`, details: errorData },
          { status: response.status }
        )
      } catch (e) {
        console.error('Could not read error details')
        return NextResponse.json(
          { error: `Failed to delete activity: ${response.status}` },
          { status: response.status }
        )
      }
    }

    // If we get here, we successfully deleted the activity
    console.log('Activity deleted successfully')
    
    return NextResponse.json({ success: true, message: 'Activity deleted successfully' }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch activity details
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    // Use await to access params (this is just a pattern to satisfy Next.js warning)
    const { activityId } = await Promise.resolve(params);
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Proxying request for activity: ${activityId}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Make the request to the gateway
    const apiUrl = `http://82.29.168.17:8222/api/v1/activities/${activityId}`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      // Forward the error status and message
      return NextResponse.json(
        { error: `Gateway returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity from gateway' },
      { status: 500 }
    );
  }
} 