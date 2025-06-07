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
    
    // Make the request to the API directly
    const apiUrl = `http://82.29.168.17:8030/api/v1/file-storage/download/${id}?preview=${isPreview}`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Accept': '*/*',
        'User-Agent': request.headers.get('user-agent') || 'Next.js Proxy',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      // Forward the error status and message
      return NextResponse.json(
        { error: `API returned status: ${response.status}` },
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
    
    // Create response headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': disposition,
      'Cache-Control': isPreview ? 'public, max-age=300' : 'private, no-cache',
      'Accept-Ranges': 'bytes'
    });

    // Copy any additional headers from the API response
    for (const [key, value] of response.headers.entries()) {
      if (!headers.has(key) && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    // Special handling for text files
    const isTextFile = 
      contentType.startsWith('text/') || 
      contentType === 'application/json' ||
      contentType === 'application/javascript' ||
      contentType === 'application/xml' ||
      contentType === 'application/x-yaml';

    if (isPreview && isTextFile) {
      // For text files, we read the entire content and return it directly
      const text = await response.text();
      return new NextResponse(text, {
        status: 200,
        headers: headers
      });
    }

    // For other files, stream the response
    return new NextResponse(response.body, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download file from API' },
      { status: 500 }
    );
  }
} 