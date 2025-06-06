import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { activityId: string; userId: string } }
) {
  // This endpoint always returns an empty array with status 200
  // It's designed to be used when the main endpoint fails
  
  // Return an empty array with explicit content type and cache control
  return new NextResponse(JSON.stringify([]), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
} 