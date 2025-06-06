import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'fallback-responses.log');

// Helper function to log information
const logRequest = (info: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(info)}\n`;
    fs.appendFileSync(logFile, logEntry);
    console.log(`[FALLBACK ENDPOINT] ${JSON.stringify(info)}`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
};

export async function GET(
  request: Request,
  { params }: { params: { activityId: string; userId: string } }
) {
  const { activityId, userId } = params;
  
  // Log request details
  const requestInfo = {
    type: 'Fallback Response Endpoint',
    method: 'GET',
    activityId,
    userId,
    timestamp: new Date().toISOString()
  };
  
  logRequest(requestInfo);
  
  // This endpoint always returns an empty array with status 200
  // It's designed to be used when the main endpoint fails
  
  logRequest({
    ...requestInfo,
    message: 'Returning empty array as fallback',
    success: true
  });
  
  // Return an empty array with explicit content type and cache control
  return new NextResponse(JSON.stringify([]), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
} 