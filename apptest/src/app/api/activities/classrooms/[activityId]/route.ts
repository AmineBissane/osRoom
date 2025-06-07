import { NextRequest, NextResponse } from 'next/server'
import { refreshToken } from '@/utils/auth'

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

// GET endpoint to fetch activities by classroom ID
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const { activityId } = params
    
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

    console.log(`Fetching activities for classroom ID: ${activityId}`)
    console.log('Using token:', accessToken.substring(0, 20) + '...')

    // Log the full URL for debugging
    const apiUrl = `http://82.29.168.17:8222/api/v1/activities/classrooms/${activityId}`
    console.log(`Making request to: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      mode: 'cors'
    })

    // Log response status for debugging
    console.log(`Response status: ${response.status}`)

    // If we get a 401, try to refresh the token
    if (response.status === 401 && refreshTokenValue) {
      console.log('Token expired, attempting refresh')
      
      try {
        // Get new tokens
        const newTokens = await refreshToken(refreshTokenValue)
        
        // Create a response with the data
        const nextResponse = NextResponse.next()
        
        // Set the new tokens as cookies
        nextResponse.cookies.set('access_token', newTokens.access_token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        
        nextResponse.cookies.set('refresh_token', newTokens.refresh_token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
        
        if (newTokens.id_token) {
          nextResponse.cookies.set('id_token', newTokens.id_token, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
          })
        }
        
        // Retry the request with the new token
        console.log('Retrying with new token:', newTokens.access_token.substring(0, 20) + '...')
        
        const retryResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${newTokens.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store',
          mode: 'cors'
        })
        
        console.log(`Retry response status: ${retryResponse.status}`)
        
        if (!retryResponse.ok) {
          return NextResponse.json(
            { error: `Failed to fetch activities after token refresh: ${retryResponse.status}` },
            { status: retryResponse.status }
          )
        }
        
        const data = await retryResponse.json()
        
        // Return the data with the updated cookies
        return NextResponse.json(data, {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        )
      }
    }

    if (!response.ok) {
      console.error('Error response:', response.status)
      
      // Try to get more details from the error response
      try {
        const errorData = await response.text()
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Could not read error details')
      }
      
      return NextResponse.json(
        { error: `Failed to fetch activities: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Add CORS headers to the response
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
      { error: 'Failed to fetch activities', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 