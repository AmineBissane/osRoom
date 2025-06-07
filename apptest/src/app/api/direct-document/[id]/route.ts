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
function extractToken(request: NextRequest): string | null {
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
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
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
    // Try both direct and fallback URLs - prioritize localhost
    const urls = [
      `http://localhost:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`,
      `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`
    ];
    
    let response = null;
    let lastError = null;
    
    // Try each URL in order
    for (const url of urls) {
      try {
        console.log(`Trying HEAD request to: ${url}`);
        
        // Create a fetch request with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // shorter timeout for HEAD
        
        // Make a HEAD request to the document service
        response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
          },
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Successful HEAD response from: ${url}`);
          break;
        } else {
          console.log(`Failed HEAD response from: ${url}, status: ${response.status}`);
        }
      } catch (error) {
        console.log(`Error with HEAD request to ${url}:`, error);
        lastError = error;
      }
    }
    
    // If all URLs failed, return the last error
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

/**
 * Gets file metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if this is a metadata request
  const path = request.nextUrl.pathname;
  if (path.endsWith('/metadata')) {
    return getFileMetadata(request, params);
  }
  
  // Otherwise, treat as a normal file download request
  return getFileContent(request, params);
}

/**
 * Gets file metadata
 */
async function getFileMetadata(
  request: NextRequest,
  { id: fileId }: { id: string }
) {
  // Log request details
  console.log(`Metadata request for document: ${fileId}`);
  
  // Extract JWT token
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'No authentication token found' },
      { status: 401 }
    );
  }
  
  try {
    // Try both direct URLs
    const urls = [
      `http://localhost:8222/api/v1/file-storage/${fileId}/metadata`,
      `http://82.29.168.17:8222/api/v1/file-storage/${fileId}/metadata`
    ];
    
    console.log(`Will try these URLs for metadata:`, urls);
    
    let response = null;
    let lastError = null;
    
    // Try each URL with retry logic
    for (const url of urls) {
      try {
        console.log(`Attempting metadata fetch from: ${url}`);
        
        // Configure request options
        const options: RequestInit = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          cache: 'no-store',
          // Use a reasonable timeout
          signal: AbortSignal.timeout(5000)
        };
        
        // Use our retry logic
        response = await fetchWithRetry(url, options);
        
        if (response.ok) {
          console.log(`Successful metadata response from: ${url}`);
          break;
        } else {
          console.log(`Failed metadata response from: ${url}, status: ${response.status}`);
        }
      } catch (error) {
        console.log(`Error with metadata request to ${url}:`, error);
        lastError = error;
      }
    }
    
    // If all URLs failed, return an error
    if (!response || !response.ok) {
      console.error('All metadata fetch attempts failed');
      return NextResponse.json(
        { error: 'Failed to retrieve metadata' },
        { status: 502 }
      );
    }
    
    // Parse the metadata
    const metadata = await response.json();
    
    // Set up CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    // Return the metadata
    return NextResponse.json(metadata, {
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Error proxying metadata:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve metadata' },
      { status: 500 }
    );
  }
}

/**
 * Handles direct document requests with proper CORS handling and JWT forwarding
 */
async function getFileContent(
  request: NextRequest,
  { id: fileId }: { id: string }
) {
  // Log request details
  console.log(`Direct document request for: ${fileId}`);
  
  // Check if this is a preview or download
  const searchParams = request.nextUrl.searchParams;
  const isPreview = searchParams.get('preview') !== 'false';
  
  // Extract JWT token
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'No authentication token found' },
      { status: 401 }
    );
  }
  
  try {
    // Try both direct URLs - prioritize localhost since we're on the same server
    const urls = [
      `http://localhost:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`,
      `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${isPreview}`
    ];
    
    console.log(`Will try these URLs in order:`, urls);
    
    let response = null;
    let lastError = null;
    
    // Try each URL with retry logic
    for (const url of urls) {
      try {
        console.log(`Attempting document fetch from: ${url}`);
        
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
        
        // Use our retry logic
        response = await fetchWithRetry(url, options, 3); // Increase max retries to 3
        
        if (response.ok) {
          console.log(`Successful response from: ${url}`);
          break;
        } else {
          console.log(`Failed response from: ${url}, status: ${response.status}`);
        }
      } catch (error) {
        console.log(`Error with request to ${url}:`, error);
        lastError = error;
      }
    }
    
    // If all URLs failed, return an error
    if (!response || !response.ok) {
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