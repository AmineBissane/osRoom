import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'activity-responses-proxy.log');

// Helper function to log information
const logRequest = (info: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(info)}\n`;
    fs.appendFileSync(logFile, logEntry);
    console.log(`[ACTIVITY RESPONSES PROXY] ${JSON.stringify(info)}`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
};

// Add timeout for fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
};

export async function GET(
  request: Request,
  { params }: { params: { activityId: string; userId: string } }
) {
  const { activityId, userId } = params;
  
  // Log request details
  const requestInfo = {
    type: 'ActivityResponses Proxy Request',
    method: 'GET',
    activityId,
    userId,
    timestamp: new Date().toISOString()
  };
  
  logRequest(requestInfo);
  
  try {
    // Get the token from cookies header
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/access_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      logRequest({
        ...requestInfo,
        error: 'No token found in cookies',
        cookieHeader: cookieHeader.substring(0, 50) + '...'
      });
      
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Build the URL
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}/user/${userId}`;
    
    logRequest({
      ...requestInfo,
      apiUrl,
      hasToken: !!token,
      message: "Preparing to fetch from backend"
    });
    
    // Make request to backend with timeout
    try {
      // Make request to backend with timeout
      const response = await fetchWithTimeout(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }, 15000); // 15 second timeout
      
      // Log response status
      logRequest({
        ...requestInfo,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      
      // Handle response errors
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: 'Authentication failed' },
            { status: response.status }
          );
        }
        
        // Return error but don't fail
        logRequest({
          ...requestInfo,
          error: `Error response from backend: ${response.status} ${response.statusText}`,
          message: "Returning empty array due to error response"
        });
        
        return NextResponse.json([]);
      }
      
      // Get response as text first
      const responseText = await response.text();
      
      // Log the raw response for debugging
      logRequest({
        ...requestInfo,
        responseTextLength: responseText.length,
        responseContentType: response.headers.get('content-type'),
        responseRaw: responseText.substring(0, 300) // Log more of the response for debugging
      });
      
      // Handle empty responses explicitly
      if (!responseText || responseText.trim() === '') {
        logRequest({
          ...requestInfo,
          message: 'Empty response from backend, returning empty array',
        });
        return NextResponse.json([]);
      }
      
      // Handle case where response might be invalid JSON but have content
      if (responseText.trim() === '[]') {
        logRequest({
          ...requestInfo,
          message: 'Response is empty array string, returning empty array',
        });
        return NextResponse.json([]);
      }
      
      // Parse response as JSON, with fallback for empty responses
      let data: any = [];
      
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        logRequest({
          ...requestInfo,
          error: 'Error parsing JSON response',
          errorMessage: error instanceof Error ? error.message : String(error),
          responseText: responseText.substring(0, 500) // Include more of the response for debugging
        });
        // Return empty array on parse error
        return NextResponse.json([]);
      }
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        logRequest({
          ...requestInfo,
          warning: 'Response was not an array, returning empty array',
          originalData: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : String(data)
        });
        data = [];
      }
      
      // Log final response
      logRequest({
        ...requestInfo,
        success: true,
        dataLength: data.length
      });
      
      // Return the response
      return NextResponse.json(data);
      
    } catch (fetchError) {
      // Handle fetch errors (timeout, network error, etc.)
      logRequest({
        ...requestInfo,
        error: 'Fetch error',
        errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
        errorType: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: "Falling back to empty array due to fetch error"
      });
      
      // Return empty array on fetch error
      return NextResponse.json([]);
    }
    
  } catch (error) {
    // Log error
    logRequest({
      ...requestInfo,
      error: 'Exception in proxy handler',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return empty array in case of any error
    return NextResponse.json([]);
  }
} 