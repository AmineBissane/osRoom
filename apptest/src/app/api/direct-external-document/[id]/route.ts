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
      console.error(`External server returned error: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch document: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the content type and other headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = preview 
      ? 'inline' 
      : response.headers.get('content-disposition') || `attachment; filename="document-${id}"`;
    
    // Get the file content as an array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Create a new response with the content and appropriate headers
    const newResponse = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
    return newResponse;
  } catch (error) {
    console.error('Error proxying document request:', error);
    return NextResponse.json(
      { error: 'Failed to proxy document request' },
      { status: 500 }
    );
  }
} 