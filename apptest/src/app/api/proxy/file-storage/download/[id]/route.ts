import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const isPreview = searchParams.get('preview') === 'true';
    const directAccess = searchParams.get('direct') === 'true';
    
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
    
    // If direct access is requested, redirect to the actual API with the token
    if (directAccess) {
      const apiUrl = `http://82.29.168.17:8030/api/v1/file-storage/download/${id}?preview=${isPreview}`;
      return NextResponse.redirect(apiUrl, {
        headers: {
          'Authorization': cleanToken
        }
      });
    }
    
    // Make the request to the gateway - use preview as a query parameter
    const apiUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${id}?preview=${isPreview}`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Accept': '*/*'
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
    
    // Get content type and filename from headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    
    // For previews, we want to display inline instead of downloading
    const disposition = isPreview 
      ? 'inline'
      : (contentDisposition || `attachment; filename="file-${id}"`);
    
    // Stream the response directly
    const { readable, writable } = new TransformStream();
    response.body?.pipeTo(writable);
    
    // Create a new response with the file data
    return new NextResponse(readable, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': isPreview ? 'public, max-age=300' : 'private, no-cache',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download file from gateway' },
      { status: 500 }
    );
  }
} 