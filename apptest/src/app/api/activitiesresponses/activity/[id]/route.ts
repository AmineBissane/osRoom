import { NextRequest, NextResponse } from 'next/server'
import { refreshToken, getUserIdFromToken } from '@/utils/auth'

// Function to decode JWT token
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*', // Adjust this in production
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const { activityId } = params;
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Use token from cookie or header
    const accessToken = token || tokenFromHeader;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    console.log(`Fetching activity responses for activity: ${activityId}`);

    // Make request to backend API
    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${activityId}`;
    console.log(`Making request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await response.text();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not read error details');
      }
      
      return NextResponse.json(
        { error: `Failed to fetch activity responses: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Response data received');
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity responses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint to submit a new activity response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value
    const refreshTokenValue = request.cookies.get('refresh_token')?.value
    
    // Also check for Authorization header in case token is passed that way
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null
    
    // Use token from cookie or header
    const accessToken = token || tokenFromHeader

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    // Get user information from token
    const userId = getUserIdFromToken(accessToken)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to identify user from token' },
        { status: 400 }
      )
    }

    // First, fetch the activity to check if it has expired
    const activityUrl = `http://82.29.168.17:8222/api/v1/activities/${id}`
    console.log(`Fetching activity details: ${activityUrl}`)
    
    const activityResponse = await fetch(activityUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      mode: 'cors'
    })
    
    if (!activityResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch activity details: ${activityResponse.status}` },
        { status: activityResponse.status }
      )
    }
    
    const activityData = await activityResponse.json()
    
    // Check if the activity has expired
    if (activityData.endDate) {
      const endDate = new Date(activityData.endDate)
      const now = new Date()
      
      if (now > endDate) {
        return NextResponse.json(
          { error: 'This activity has expired and is no longer accepting submissions' },
          { status: 400 }
        )
      }
    }

    const apiUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${id}`
    console.log(`Checking for existing responses: ${apiUrl}`)
    
    // Check if the user has already submitted a response
    const checkResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      mode: 'cors'
    })
    
    console.log(`Check response status: ${checkResponse.status}`)

    if (checkResponse.ok) {
      const existingResponses = await checkResponse.json()
      const userHasSubmitted = Array.isArray(existingResponses) && existingResponses.some(
        (response: any) => response.userId === userId || response.username === userId
      )

      if (userHasSubmitted) {
        return NextResponse.json(
          { error: 'You have already submitted a response for this activity' },
          { status: 400 }
        )
      }
    }

    // Get the response data from the request body
    const responseData = await request.json()
    
    // Add the activity ID and user ID to the response data
    const submissionData = {
      ...responseData,
      activityId: id,
      userId: userId
    }
    
    console.log(`Submitting response for activity ${id}, user ${userId}`)

    // Submit the response
    const submitUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses`
    console.log(`Submitting to: ${submitUrl}`)
    
    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(submissionData),
      mode: 'cors'
    })
    
    console.log(`Submit response status: ${submitResponse.status}`)

    if (!submitResponse.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await submitResponse.text()
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Could not read error details')
      }
      
      return NextResponse.json(
        { error: `Failed to submit activity response: ${submitResponse.status}` },
        { status: submitResponse.status }
      )
    }

    const result = await submitResponse.json()
    
    return NextResponse.json(result, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit activity response', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 