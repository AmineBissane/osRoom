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
 * Specialized endpoint for PDF files that ensures proper content type
 * and headers for reliable PDF viewing in browsers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use utility function to safely get route params
    const { id } = await getRouteParams(params);
    
    // Default to preview mode for PDFs
    const searchParams = request.nextUrl.searchParams;
    const isPreview = searchParams.get('preview') !== 'false'; // default to true
    
    // Get the token from the request cookies
    const token = getAccessToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log(`PDF proxy request for file: ${id}, preview: ${isPreview}`);
    
    // Ensure token is properly formatted
    const cleanToken = formatBearerToken(token);
    
    // Make the request to the file storage service
    const apiUrl = `http://82.29.168.17:8030/api/v1/file-storage/download/${id}?preview=${isPreview}`;
    console.log(`Making request to: ${apiUrl}`);
    
    // Special headers to ensure we get the right response
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Accept': 'application/pdf',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      console.error(`PDF API returned status: ${response.status}`);
      
      // Try to get more information about the error
      let errorDetails = '';
      try {
        errorDetails = await response.text();
      } catch (e) {
        errorDetails = 'Could not retrieve error details';
      }
      
      return NextResponse.json(
        { error: `PDF API returned status: ${response.status}`, details: errorDetails },
        { status: response.status }
      );
    }
    
    // Get the file data
    const data = await response.arrayBuffer();
    console.log(`PDF data size: ${data.byteLength} bytes`);
    
    // Set headers optimized for PDF viewing
    const headers = new Headers();
    
    // Always set PDF content type
    headers.set('Content-Type', 'application/pdf');
    
    // Set disposition based on preview flag
    const disposition = isPreview 
      ? 'inline' 
      : `attachment; filename="file-${id}.pdf"`;
    headers.set('Content-Disposition', disposition);
    
    // Add content length
    headers.set('Content-Length', data.byteLength.toString());
    
    // Prevent browser caching
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    
    // Additional security and optimization headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    
    // Return the file data with our enhanced headers
    return new NextResponse(data, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve PDF file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 