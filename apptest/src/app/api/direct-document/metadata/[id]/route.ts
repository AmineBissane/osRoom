import { NextRequest, NextResponse } from 'next/server';
import { extractToken, fetchWithRetry } from '../../direct-document/[id]/route';

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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Gets file metadata
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
    // Try both direct URLs - prioritize localhost
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