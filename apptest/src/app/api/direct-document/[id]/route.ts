import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Utility function to extract JWT token from request
 */
export function extractToken(request: NextRequest): string | null {
  // Try to get from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try to get from cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const accessTokenCookie = cookieHeader
      .split('; ')
      .find(row => row.startsWith('access_token='));
    
    if (accessTokenCookie) {
      return accessTokenCookie.split('=')[1];
    }
  }
  
  return null;
}

/**
 * Utility function to make fetch requests with retry logic
 */
export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If not the first attempt, wait a bit before retrying
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced wait time
        console.log(`Retry attempt ${attempt} for ${url}`);
      }
      
      const response = await fetch(url, options);
      
      // If the response is successful, return it
      if (response.ok) {
        return response;
      }
      
      // If we get a server error, we might want to retry
      if (response.status >= 500 && attempt < maxRetries) {
        console.log(`Server error ${response.status}, will retry...`);
        continue;
      }
      
      // For other error codes, just return the response as is
      return response;
      
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's the last attempt, rethrow the error
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
  
  // This shouldn't be reached, but TypeScript requires a return
  throw lastError || new Error('Unknown error in fetchWithRetry');
}

/**
 * Handle GET requests to download documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get file ID from URL params
  const fileId = params.id;
  if (!fileId) {
    return NextResponse.json(
      { error: 'Missing file ID' },
      { status: 400 }
    );
  }
  
  // Check if this is a preview or download
  const searchParams = request.nextUrl.searchParams;
  const isPreview = searchParams.get('preview') !== 'false';
  
  // Log request details
  console.log(`Direct document request for: ${fileId}`);
  
  // Extract JWT token
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'No authentication token found' },
      { status: 401 }
    );
  }
  
  try {
    // Try direct localhost first since we're on the same server
    // No need for additional proxying inside the VPS
    const localUrl = `http://localhost:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
    
    // Configure request options with longer timeout
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      // Use a longer timeout for document fetching
      signal: AbortSignal.timeout(30000) // 30 seconds
    };
    
    // Attempt the fetch
    console.log(`Attempting direct document fetch from: ${localUrl}`);
    let response = await fetchWithRetry(localUrl, options, 3);
    
    // If that fails, try the public IP as a fallback
    if (!response.ok) {
      console.log(`Direct localhost request failed, trying public IP`);
      const publicUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
      response = await fetchWithRetry(publicUrl, options, 2);
    }
    
    // If all URLs failed, return an error
    if (!response.ok) {
      console.error('All document fetch attempts failed');
      return NextResponse.json(
        { error: 'Failed to retrieve document from all sources' },
        { status: 502 }
      );
    }
    
    // Get content type and other headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    
    // For previews, ensure inline disposition
    const disposition = isPreview 
      ? 'inline'
      : (contentDisposition || `attachment; filename="file-${fileId}"`);
    
    // Get the response data
    const data = await response.arrayBuffer();
    
    // Set up response headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', disposition);
    headers.set('Content-Length', data.byteLength.toString());
    
    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    
    // Add caching headers to prevent caching
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // For PDF files, add extra headers to help with rendering
    if (contentType.includes('pdf')) {
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Accept-Ranges', 'bytes');
    }
    
    // Return the document with appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Error proxying document:', error);
    
    // Check if it's an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}

/**
 * Handle HEAD requests to check document availability
 * Browsers often make HEAD requests before GET to check content type and availability
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get file ID from URL params
  const fileId = params.id;
  if (!fileId) {
    return new NextResponse(null, { status: 400 });
  }

  // Log request details
  console.log(`HEAD request for document: ${fileId}`);
  
  // Check if this is a preview or download
  const searchParams = request.nextUrl.searchParams;
  const isPreview = searchParams.get('preview') !== 'false';
  
  // Extract JWT token
  const token = extractToken(request);
  
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }
  
  try {
    // Try direct localhost first - we're inside the VPS
    const localUrl = `http://localhost:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
    
    // Create a fetch request with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // shorter timeout for HEAD
    
    // Make a HEAD request to the document service
    console.log(`Trying HEAD request to: ${localUrl}`);
    let response;
    
    try {
      response = await fetch(localUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`HEAD request to localhost failed, trying public IP`);
        // Try the public IP as fallback
        const publicUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
        const backupController = new AbortController();
        const backupTimeoutId = setTimeout(() => backupController.abort(), 3000);
        
        response = await fetch(publicUrl, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
          },
          signal: backupController.signal
        });
        
        clearTimeout(backupTimeoutId);
      }
    } catch (error) {
      console.log(`Error with HEAD request:`, error);
      
      // Try the public IP as fallback
      const publicUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
      const backupController = new AbortController();
      const backupTimeoutId = setTimeout(() => backupController.abort(), 3000);
      
      response = await fetch(publicUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
        },
        signal: backupController.signal
      });
      
      clearTimeout(backupTimeoutId);
    }
    
    // If all URLs failed, return an error
    if (!response || !response.ok) {
      console.error('All HEAD requests failed');
      return new NextResponse(null, { status: 502 });
    }
    
    // Get content type and other headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');
    
    // For previews, ensure inline disposition
    const disposition = isPreview 
      ? 'inline'
      : (contentDisposition || `attachment; filename="file-${fileId}"`);
    
    // Set up response headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', disposition);
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    
    // Add caching headers to prevent caching
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // For PDF files, add extra headers to help with rendering
    if (contentType.includes('pdf')) {
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Accept-Ranges', 'bytes');
    }
    
    // Return just the headers for a HEAD request
    return new NextResponse(null, {
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Error handling document HEAD request:', error);
    
    // Check if it's an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse(null, { status: 504 });
    }
    
    return new NextResponse(null, { status: 500 });
  }
} 