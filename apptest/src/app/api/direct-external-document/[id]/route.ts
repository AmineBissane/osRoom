import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * This API route proxies requests to an external document server
 * while handling any CORS issues
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';
    
    // Create the external URL 
    const externalBaseUrl = "http://82.29.168.17:8030/api/v1/file-storage/download";
    const externalUrl = `${externalBaseUrl}/${id}?preview=${preview}`;
    
    console.log(`Proxying request to external URL: ${externalUrl}`);
    
    // Fetch from the external server
    const response = await fetch(externalUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error(`External server returned error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch document: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the content type and other headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Log the content type we received
    console.log(`Received content type: ${contentType}`);
    
    // Determine a sensible filename
    let filename = `document-${id}`;
    const contentDispositionHeader = response.headers.get('content-disposition');
    if (contentDispositionHeader) {
      const filenameMatch = contentDispositionHeader.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    // Set appropriate content-disposition based on preview mode
    const contentDisposition = preview 
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;
    
    console.log(`Setting Content-Disposition: ${contentDisposition}`);
    
    // Get the file content as an array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Log the file size
    console.log(`File size: ${arrayBuffer.byteLength} bytes`);
    
    // For PDF content type, make sure it's properly set
    const finalContentType = contentType.includes('pdf') 
      ? 'application/pdf'
      : contentType;
    
    // Log content type being used
    console.log(`Using content type for response: ${finalContentType}`);
    
    // Create a new response with the content and appropriate headers
    const newResponse = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': finalContentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // X-Frame-Options would block iframe embedding
        'X-Frame-Options': 'ALLOWALL' 
      }
    });
    
    return newResponse;
  } catch (error) {
    console.error('Error proxying document request:', error);
    return NextResponse.json(
      { error: 'Failed to proxy document request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 