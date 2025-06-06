import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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
    
    // Get the request body
    const body = await request.json();
    
    console.log(`Proxying grade submission for response: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Make the request to the gateway
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/${id}/grade`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
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
      { error: 'Failed to submit grade to gateway' },
      { status: 500 }
    );
  }
} 