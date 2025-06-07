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
    
    console.log(`Proxying file ${isPreview ? 'preview' : 'download'} request for file: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = formatBearerToken(token);
    
    // Make the request to the API directly
    // Try both URLs since there appears to be configuration inconsistency
    // First try the localhost URL (configured in direct-view)
    const backendUrls = [
      `http://localhost:8222/api/v1/file-storage/download/${id}?preview=${isPreview}`,
      `http://82.29.168.17:8030/api/v1/file-storage/download/${id}?preview=${isPreview}`
    ];
    
    // Use AbortController to add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    let response = null;
    let error = null;
    
    try {
      // Try each URL in sequence
      for (const apiUrl of backendUrls) {
        console.log(`Attempting request to: ${apiUrl}`);
        
        try {
          // Use simple fetch with no streaming for reliability
          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': cleanToken,
              'Accept': '*/*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            signal: controller.signal
          });
          
          console.log(`Response status from ${apiUrl}: ${response.status}`);
          
          if (response.ok) {
            // We got a successful response, break out of the loop
            break;
          }
        } catch (urlError) {
          console.error(`Error with URL ${apiUrl}:`, urlError);
          error = urlError;
          // Continue to the next URL
        }
      }
      
      // Clear the timeout since requests completed
      clearTimeout(timeoutId);
      
      // If we still don't have a valid response, throw an error
      if (!response || !response.ok) {
        if (response) {
          throw new Error(`API returned status: ${response.status}`);
        } else {
          throw error || new Error('Failed to connect to any backend API');
        }
      }
      
      // Get content type and filename from headers
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition');
      
      // For previews, we want to display inline instead of downloading
      const disposition = isPreview 
        ? 'inline'
        : (contentDisposition || `attachment; filename="file-${id}"`);
      
      // Get the response data as array buffer
      const data = await response.arrayBuffer();
      
      // Set appropriate headers for CORS and content handling
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', disposition);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      // Add CORS headers to ensure browser can properly handle the response
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      headers.set('Access-Control-Allow-Credentials', 'true');
      
      // Add content length to help browsers properly load the file
      headers.set('Content-Length', data.byteLength.toString());
      
      // For PDF files specifically, ensure proper content type
      if (contentType.includes('pdf')) {
        headers.set('Content-Type', 'application/pdf');
      }
      
      // Return the response with appropriate headers
      return new NextResponse(data, {
        status: 200,
        headers: headers
      });
    } catch (fetchError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request to backend timed out');
        return NextResponse.json(
          { error: 'Request to backend timed out', details: 'The connection to the server timed out' },
          { status: 504 }  // Gateway Timeout
        );
      }
      
      // Handle connection reset specifically
      if (fetchError instanceof Error && 
          (fetchError.message.includes('connection reset') || 
           fetchError.message.includes('ECONNRESET') ||
           fetchError.message.includes('network error'))) {
        console.error('Connection reset error when fetching from backend:', fetchError);
        return NextResponse.json(
          { error: 'Connection reset', details: 'The connection to the server was reset' },
          { status: 502 }  // Bad Gateway
        );
      }
      
      // Re-throw for general error handling
      throw fetchError;
    }
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Create a more detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    
    return NextResponse.json(
      { 
        error: 'Failed to download file from API',
        details: errorMessage,
        type: errorName
      },
      { status: 500 }
    );
  }
} 