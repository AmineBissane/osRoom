import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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
    const { url, method = 'GET', headers = {}, data } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Prepare headers
    const requestHeaders = {
      'Authorization': cleanToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    };
    
    // Prepare request options
    const options: RequestInit = {
      method,
      headers: requestHeaders
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }
    
    // Make the request to the gateway
    const response = await fetch(url, options);
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      // Forward the error status and message
      return NextResponse.json(
        { error: `Gateway returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const responseData = await response.json();
    
    // Return the data
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from gateway' },
      { status: 500 }
    );
  }
} 