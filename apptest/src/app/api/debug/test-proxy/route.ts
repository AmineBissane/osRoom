import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'test-proxy.log');

// Helper function to log information
const logRequest = (info: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(info)}\n`;
    fs.appendFileSync(logFile, logEntry);
    console.log(`[TEST PROXY] ${JSON.stringify(info)}`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId') || '1';
  const userId = searchParams.get('userId') || '0fa2086b-d51f-42a7-b46c-b37737bfe570';
  
  // Log request details
  const requestInfo = {
    type: 'Test Proxy Request',
    method: 'GET',
    activityId,
    userId,
    timestamp: new Date().toISOString()
  };
  
  logRequest(requestInfo);
  
  try {
    // Test our proxy endpoint
    const proxyUrl = `/api/proxy/activitiesresponses/activity/${activityId}/user/${userId}`;
    
    logRequest({
      ...requestInfo,
      message: 'Testing proxy endpoint',
      proxyUrl
    });
    
    // Get cookies from request
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Make the request
    const proxyResponse = await fetch(new URL(proxyUrl, request.url), {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Log response details
    logRequest({
      ...requestInfo,
      responseStatus: proxyResponse.status,
      responseStatusText: proxyResponse.statusText,
      responseHeaders: Object.fromEntries(proxyResponse.headers.entries())
    });
    
    // Get response as text
    const responseText = await proxyResponse.text();
    
    // Log response text
    logRequest({
      ...requestInfo,
      responseTextLength: responseText.length,
      responseText: responseText.length < 100 ? responseText : responseText.substring(0, 100) + '...'
    });
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      responseData = {
        error: 'Failed to parse JSON response',
        text: responseText.substring(0, 200)
      };
    }
    
    // Return test results
    return NextResponse.json({
      success: proxyResponse.ok,
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      responseLength: responseText.length,
      isArray: Array.isArray(responseData),
      arrayLength: Array.isArray(responseData) ? responseData.length : null,
      data: responseData
    });
    
  } catch (error) {
    // Log error
    logRequest({
      ...requestInfo,
      error: 'Test failed',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return error response
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 