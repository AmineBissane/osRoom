import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Proxying request for activity responses: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Make the request to the gateway
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${id}`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await response.text();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not read error details');
      }
      
      // Forward the error status and message
      return NextResponse.json(
        { error: `Gateway returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity responses from gateway' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 