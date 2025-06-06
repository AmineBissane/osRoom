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
    
    console.log(`Proxying file download request for file: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Make the request to the gateway
    const apiUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${id}`;
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
    
    // Get the file data as blob
    const blob = await response.blob();
    
    // Get content type and filename from headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    
    // Create a new response with the file data
    const newResponse = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || `attachment; filename="file-${id}"`
      }
    });
    
    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download file from gateway' },
      { status: 500 }
    );
  }
} 