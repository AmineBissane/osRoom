import { NextRequest, NextResponse } from 'next/server';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const isPreview = searchParams.get('preview') === 'true';
    const direct = searchParams.get('direct') === 'true';
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Generating link for file: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Generate the direct URL to the backend API
    const directUrl = `http://82.29.168.17:8030/api/v1/file-storage/download/${id}?preview=${isPreview}`;
    
    // If direct access is requested, fetch the file and return it
    if (direct) {
      console.log('Direct access requested, fetching file from backend');
      
      // Fetch the file from the backend
      const response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Authorization': cleanToken,
          'Accept': '*/*'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Backend returned status: ${response.status}` },
          { status: response.status }
        );
      }
      
      // Get content type and disposition from headers
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition');
      
      // For previews, use inline disposition
      const disposition = isPreview 
        ? 'inline'
        : (contentDisposition || `attachment; filename="file-${id}"`);
      
      // Get the response data
      const data = await response.arrayBuffer();
      
      // Return the file with appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', disposition);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      headers.set('Content-Length', data.byteLength.toString());
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new NextResponse(data, {
        status: 200,
        headers: headers
      });
    }
    
    // Otherwise, return the URL and token for the client to use
    return NextResponse.json({
      url: directUrl,
      token: cleanToken,
      // Add a direct access URL through our proxy
      directAccessUrl: `/api/proxy/file-storage/file-link/${id}?preview=${isPreview}&direct=true&t=${Date.now()}`
    });
  } catch (error) {
    console.error('Link generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate file link', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 