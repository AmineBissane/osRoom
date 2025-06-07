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
export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If not the first attempt, wait a bit before retrying
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
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
      { error: 'Falta el ID del archivo' },
      { status: 400 }
    );
  }
  
  // Check if this is a preview or download
  const searchParams = request.nextUrl.searchParams;
  const isPreview = searchParams.get('preview') !== 'false';
  
  // Log request details
  console.log(`Direct document request for: ${fileId}, preview: ${isPreview}`);
  
  // Extract JWT token
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'No se encontró token de autenticación' },
      { status: 401 }
    );
  }
  
  try {
    // Always use the public IP since we're having issues with localhost
    const fileUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
    
    // Configure request options
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      // Use a reasonable timeout
      signal: AbortSignal.timeout(15000) // 15 seconds
    };
    
    // Attempt the fetch
    console.log(`Attempting document fetch from: ${fileUrl}`);
    let response = await fetchWithRetry(fileUrl, options, 2);
    
    // If all URLs failed, return an error
    if (!response.ok) {
      console.error('Document fetch attempt failed');
      return NextResponse.json(
        { error: 'No se pudo recuperar el documento' },
        { status: 502 }
      );
    }
    
    // Get content type and other headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    
    // Get the original filename if available
    let filename = 'documento';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    // For previews, ensure inline disposition; for downloads, force attachment
    const disposition = isPreview 
      ? 'inline' 
      : `attachment; filename="${filename}"`;
    
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
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
        { error: 'La solicitud ha excedido el tiempo de espera' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'No se pudo recuperar el documento' },
      { status: 500 }
    );
  }
}

/**
 * Handle HEAD requests to check document availability
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
    // Always use the public IP since we're having issues with localhost
    const fileUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
    
    // Configure request options with short timeout
    const options: RequestInit = {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      // Use a shorter timeout for HEAD requests
      signal: AbortSignal.timeout(5000)
    };
    
    // Make HEAD request
    let response = await fetchWithRetry(fileUrl, options, 1);
    
    // If all URLs failed, return an error
    if (!response.ok) {
      console.error('HEAD request failed');
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
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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