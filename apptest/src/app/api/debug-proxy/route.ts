import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'proxy-debug.log');

// Helper function to log information
const logRequest = (info: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(info)}\n`;
    fs.appendFileSync(logFile, logEntry);
    console.log(`[PROXY DEBUG] ${JSON.stringify(info)}`);
  } catch (error) {
    console.error('Error logging debug data:', error);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId');
  const userId = searchParams.get('userId');
  
  if (!activityId || !userId) {
    return NextResponse.json({ 
      error: 'Missing required parameters: activityId and userId' 
    }, { status: 400 });
  }
  
  const debugInfo = {
    type: 'Debug Proxy Request',
    timestamp: new Date().toISOString(),
    params: {
      activityId,
      userId
    }
  };
  
  logRequest(debugInfo);
  
  try {
    const url = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}/user/${userId}`;
    
    // Extract authorization header from request
    const authorization = request.headers.get('Authorization');
    
    // Log the outgoing request
    logRequest({
      ...debugInfo,
      outgoingRequest: {
        url,
        headers: {
          Authorization: authorization ? 'Bearer [TOKEN]' : 'None',
          'Content-Type': 'application/json'
        }
      }
    });
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authorization ? { 'Authorization': authorization } : {})
      }
    });
    
    const responseData = await response.json();
    
    // Log the response
    logRequest({
      ...debugInfo,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      }
    });
    
    // Return the data and status for debugging
    return NextResponse.json({
      debug: {
        requestUrl: url,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries())
      },
      data: responseData
    }, {
      status: response.status
    });
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    logRequest({
      ...debugInfo,
      error: errorInfo
    });
    
    return NextResponse.json({ 
      error: 'Error fetching data', 
      details: errorInfo
    }, { status: 500 });
  }
} 