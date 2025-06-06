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
    console.log(`[FALLBACK RESPONSES] ${JSON.stringify(info)}`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId');
  const userId = searchParams.get('userId');
  
  // Log request details
  const requestInfo = {
    type: 'Fallback Responses Request',
    method: 'GET',
    activityId,
    userId,
    timestamp: new Date().toISOString()
  };
  
  logRequest(requestInfo);
  
  // This endpoint always returns an empty array
  // It's designed to be a fallback when the real endpoint fails
  
  logRequest({
    ...requestInfo,
    message: 'Returning empty array as fallback',
    success: true
  });
  
  return NextResponse.json([]);
} 