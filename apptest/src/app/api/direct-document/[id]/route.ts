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
  
  // Extract JWT token from cookies or Authorization header
  let token = null;
  
  // Try to get from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Try to get from cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const accessTokenCookie = cookieHeader
        .split('; ')
        .find(row => row.startsWith('access_token='));
      
      if (accessTokenCookie) {
        token = accessTokenCookie.split('=')[1];
      }
    }
  }
  
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }
  
  try {
    // Construct the target URL
    const targetUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
    
    // Create a fetch request with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // shorter timeout for HEAD
    
    // Make a HEAD request to the document service
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
      },
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle errors
    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
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

/**
 * Handles direct document requests with proper CORS handling and JWT forwarding
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

  // Log request details
  console.log(`Direct document request for: ${fileId}`);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Check if this is a preview or download
  const searchParams = request.nextUrl.searchParams;
  const isPreview = searchParams.get('preview') !== 'false';
  
  // Extract JWT token from cookies or Authorization header
  let token = null;
  
  // Try to get from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Try to get from cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const accessTokenCookie = cookieHeader
        .split('; ')
        .find(row => row.startsWith('access_token='));
      
      if (accessTokenCookie) {
        token = accessTokenCookie.split('=')[1];
      }
    }
  }
  
  if (!token) {
    return NextResponse.json(
      { error: 'No authentication token found' },
      { status: 401 }
    );
  }
  
  try {
    // Construct the target URL - use the gateway
    const targetUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`;
    
    console.log(`Fetching document from: ${targetUrl}`);
    
    // Create a fetch request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Make the request to the document service
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle errors
    if (!response.ok) {
      console.error(`Document service returned status: ${response.status}`);
      return NextResponse.json(
        { error: `Document service returned status: ${response.status}` },
        { status: response.status }
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
      { error: 'Failed to retrieve document', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 