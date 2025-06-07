import { NextRequest, NextResponse } from 'next/server';
import { getRouteParams, getAccessToken, formatBearerToken } from '@/app/api/utils';

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
    // Use utility function to safely get route params
    const { id } = await getRouteParams(params);
    
    const searchParams = request.nextUrl.searchParams;
    const isPreview = searchParams.get('preview') === 'true';
    
    // Get the token from the request cookies
    const token = getAccessToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Direct file ${isPreview ? 'preview' : 'download'} request for file: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = formatBearerToken(token);
    
    // Direct URL to the backend API
    const apiUrl = `http://82.29.168.17:8030/api/v1/file-storage/download/${id}?preview=${isPreview}`;
    
    // Fetch the file directly
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Accept': '*/*'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`API returned error status: ${response.status}`);
      
      // For better debugging, try to get the response body
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (e) {
        errorBody = 'Could not read error body';
      }
      
      return NextResponse.json(
        { 
          error: `API returned status: ${response.status}`,
          details: errorBody 
        },
        { status: response.status }
      );
    }
    
    // Get content type and disposition from headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    
    console.log(`Content type: ${contentType}`);
    
    // For previews, use inline disposition
    const disposition = isPreview 
      ? 'inline'
      : (contentDisposition || `attachment; filename="file-${id}"`);
    
    // Get the response data
    const data = await response.arrayBuffer();
    console.log(`Got file data, size: ${data.byteLength} bytes`);
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', disposition);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Add content length
    headers.set('Content-Length', data.byteLength.toString());
    
    // For PDF files, ensure proper content type
    if (contentType.includes('pdf')) {
      headers.set('Content-Type', 'application/pdf');
    }
    
    // Return the data with appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file from API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 