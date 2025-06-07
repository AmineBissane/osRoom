import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const isPreview = searchParams.get('preview') === 'true';
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Proxying file ${isPreview ? 'preview' : 'download'} request for file: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Make the request to the gateway
    const apiUrl = `http://82.29.168.17:8222/api/v1/file-storage/${isPreview ? 'preview' : 'download'}/${id}`;
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
    
    // For previews, we want to display inline instead of downloading
    const disposition = isPreview 
      ? 'inline'
      : (contentDisposition || `attachment; filename="file-${id}"`);
    
    // Create a new response with the file data
    const newResponse = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': isPreview ? 'public, max-age=300' : 'private, no-cache'
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