import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the file ID from the URL params
    const fileId = params.id;
    
    // Get preview parameter from query
    const searchParams = request.nextUrl.searchParams;
    const preview = searchParams.get('preview') !== 'false'; // Default to true
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    // Get the token from cookies
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }
    
    // Ensure token is properly formatted
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Construct the URL to the backend service
    const backendUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=${preview}`;
    
    // Make the request to the backend
    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Authorization': authToken,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    });
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }
    
    // Get the content type from the backend response
    const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream';
    
    // For PDFs and PNGs, ensure correct content type
    let finalContentType = contentType;
    if (contentType.includes('pdf')) {
      finalContentType = 'application/pdf';
    } else if (contentType.includes('png') || fileId.toLowerCase().endsWith('png')) {
      finalContentType = 'image/png';
    }
    
    // Get the file data
    const fileData = await backendResponse.arrayBuffer();
    
    // Create response with appropriate headers
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': finalContentType,
        'Content-Disposition': preview ? 'inline' : `attachment; filename="file-${fileId}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Error fetching file:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 