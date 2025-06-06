import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const preview = request.nextUrl.searchParams.get('preview') === 'true';
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Proxying file request for file: ${id}, preview: ${preview}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Make the request to the gateway
    const apiUrl = `http://82.29.168.17:8222/api/v1/file-storage/${id}${preview ? '?preview=true' : ''}`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken
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
    
    // If it's a HEAD request or preview, just return the status
    if (preview) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          'Content-Length': response.headers.get('content-length') || '0'
        }
      });
    }
    
    // Otherwise, get the file data as blob
    const blob = await response.blob();
    
    // Get content type from headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Create a new response with the file data
    const newResponse = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType
      }
    });
    
    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file from gateway' },
      { status: 500 }
    );
  }
} 