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

/**
 * Get metadata for a file without downloading it
 * Used to determine file type before deciding how to handle the file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use utility function to safely get route params
    const { id } = await getRouteParams(params);
    
    // Get the token from the request cookies
    const token = getAccessToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`Getting metadata for file: ${id}`);
    
    // Ensure token is properly formatted
    const cleanToken = formatBearerToken(token);
    
    // Make the request to the file storage service metadata endpoint
    const primaryUrl = `http://localhost:8222/api/v1/file-storage/${id}/metadata`;
    const fallbackUrl = `http://82.29.168.17:8030/api/v1/file-storage/${id}/metadata`;
    
    // Create controller for primary request with short timeout
    const primaryController = new AbortController();
    const primaryTimeoutId = setTimeout(() => primaryController.abort(), 2000); // 2 second timeout
    
    let response = null;
    
    try {
      // Try primary URL first with short timeout
      try {
        console.log(`Making request to primary URL: ${primaryUrl}`);
        
        response = await fetch(primaryUrl, {
          method: 'GET',
          headers: {
            'Authorization': cleanToken,
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: primaryController.signal
        });
        
        clearTimeout(primaryTimeoutId);
        console.log(`Primary URL returned status: ${response.status}`);
        
      } catch (primaryError) {
        clearTimeout(primaryTimeoutId);
        console.log(`Primary URL error, trying fallback: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`);
        // Continue to fallback
      }
      
      // If primary URL fails or has error, try fallback
      if (!response || !response.ok) {
        console.log(`Using fallback URL: ${fallbackUrl}`);
        
        response = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Authorization': cleanToken,
            'Accept': 'application/json',
          },
          cache: 'no-store'
        });
        
        console.log(`Fallback URL returned status: ${response.status}`);
      }
      
      if (!response.ok) {
        console.error(`Metadata API returned status: ${response.status}`);
        
        return NextResponse.json(
          { error: `Metadata API returned status: ${response.status}` },
          { status: response.status }
        );
      }
      
      // Get the metadata
      const metadata = await response.json();
      console.log(`Got metadata for file: ${id}`, metadata);
      
      // Return the metadata with CORS headers
      return NextResponse.json(metadata, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-store, no-cache'
        }
      });
    } catch (error) {
      console.error('Metadata proxy error:', error);
      
      return NextResponse.json(
        { error: 'Failed to retrieve file metadata', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Outer metadata proxy error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process metadata request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 