import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
    
    console.log(`Fetching file from: ${backendUrl}`);
    
    // Make the request to the backend
    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Authorization': authToken,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!backendResponse.ok) {
      console.error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
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
    
    // Get original filename from backend response if available
    const contentDisposition = backendResponse.headers.get('content-disposition');
    let filename = `file-${fileId}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    // Get the file data
    const fileData = await backendResponse.arrayBuffer();
    
    // Create response with appropriate headers
    const headers = new Headers({
      'Content-Type': finalContentType,
      'Content-Disposition': preview ? 'inline' : `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    
    return new NextResponse(fileData, {
      status: 200,
      headers,
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