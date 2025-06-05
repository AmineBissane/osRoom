import { NextRequest, NextResponse } from 'next/server'
import { refreshToken } from '@/utils/auth'

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await params; // Asegurarse de esperar los parámetros aunque no los usemos
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

// DELETE endpoint to delete an activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    
    // Also check for Authorization header in case token is passed that way
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Use token from cookie or header
    const accessToken = token || tokenFromHeader;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    console.log(`Deleting activity with ID: ${id} through Next.js API route`)

    // Make request to backend API with all necessary details
    const apiUrl = `http://localhost:8222/api/v1/activities/${id}`
    console.log(`Making request to: ${apiUrl}`)
    console.log(`Token (first 30 chars): ${accessToken.substring(0, 30)}...`)

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      credentials: 'include'
    })
    
    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await response.text()
        console.error('Error details:', errorData)
        
        // Return the error details to the client
        return NextResponse.json(
          { error: `Failed to delete activity: ${response.status}`, details: errorData },
          { status: response.status }
        )
      } catch (e) {
        console.error('Could not read error details')
        return NextResponse.json(
          { error: `Failed to delete activity: ${response.status}` },
          { status: response.status }
        )
      }
    }

    // If we get here, we successfully deleted the activity
    console.log('Activity deleted successfully')
    
    return NextResponse.json({ success: true, message: 'Activity deleted successfully' }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch activity details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value;
    const refreshTokenValue = request.cookies.get('refresh_token')?.value;
    
    // Also check for Authorization header in case token is passed that way
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Use token from cookie or header
    const accessToken = token || tokenFromHeader;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    console.log(`Fetching activity with ID: ${id} through Next.js API route`)

    // Make request to backend API
    const apiUrl = `http://localhost:8222/api/v1/activities/${id}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch activity: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 