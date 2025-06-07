import { NextResponse } from 'next/server';
import { getRouteParams, getAccessToken, formatBearerToken } from '@/app/api/utils';

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
  // Use utility function to safely get route params
  const { activityId, userId } = await getRouteParams(params);
  
  try {
    // Get the token from cookies
    const token = getAccessToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Format the token
    const cleanToken = formatBearerToken(token);
    
    // Build the URL
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}/user/${userId}`;
    
    try {
      // Make request to backend with timeout
      const response = await fetchWithTimeout(apiUrl, {
        headers: {
          'Authorization': cleanToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }, 15000); // 15 second timeout
      
      // Handle response errors
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: 'Authentication failed' },
            { status: response.status }
          );
        }
        
        // Return empty array due to error response
        return NextResponse.json([]);
      }
      
      // Get response as text first
      const responseText = await response.text();
      
      // Handle empty responses explicitly
      if (!responseText || responseText.trim() === '') {
        return NextResponse.json([]);
      }
      
      // Handle case where response might be invalid JSON but have content
      if (responseText.trim() === '[]') {
        return NextResponse.json([]);
      }
      
      // Parse response as JSON, with fallback for empty responses
      let data: any = [];
      
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        // Return empty array on parse error
        return NextResponse.json([]);
      }
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        data = [];
      }
      
      // Return the response
      return NextResponse.json(data);
      
    } catch (fetchError) {
      // Return empty array on fetch error
      return NextResponse.json([]);
    }
    
  } catch (error) {
    // Return empty array in case of any error
    return NextResponse.json([]);
  }
} 