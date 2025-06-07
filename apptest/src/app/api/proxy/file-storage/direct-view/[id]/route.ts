import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, formatBearerToken } from '@/app/api/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Handler for direct file viewing that preserves content type
 * This is used to display files directly in the browser
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the file ID from the URL params
    const fileId = params.id;
    
    // Get preview parameter from query
    const searchParams = request.nextUrl.searchParams;
    const preview = searchParams.get('preview') === 'true';
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    // Get auth token
    const token = getAccessToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }
    
    // Format the token properly
    const authToken = formatBearerToken(token);
    
    // Construct the URL to the backend service
    const backendUrl = `http://localhost:8222/api/v1/file-storage/download/${fileId}${preview ? '?preview=true' : ''}`;
    
    console.log(`Proxying file request to: ${backendUrl}`);
    
    // Make the request to the backend
    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Authorization': authToken,
        'Accept': '*/*',
      },
      cache: 'no-store',
    });
    
    if (!backendResponse.ok) {
      console.error(`Backend responded with status: ${backendResponse.status}`);
      return NextResponse.json(
        { error: `Failed to fetch file: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }
    
    // Get the content type from the backend response
    const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = backendResponse.headers.get('content-disposition');
    
    // Get the file data as an array buffer
    const fileData = await backendResponse.arrayBuffer();
    
    // Create response with appropriate headers
    const response = new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    // Add Content-Disposition header if present in the backend response
    if (contentDisposition) {
      response.headers.set('Content-Disposition', contentDisposition);
    }
    
    return response;
  } catch (error) {
    console.error('Error proxying file:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 