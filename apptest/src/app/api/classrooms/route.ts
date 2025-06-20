import { NextRequest, NextResponse } from 'next/server'
import { refreshToken, getClassCategoryFromToken } from '@/utils/auth'

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

export async function GET(request: NextRequest) {
  try {
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

    console.log('Proxy API - Using token:', accessToken.substring(0, 20) + '...')
    
    // Get class category from token
    const classCategory = getClassCategoryFromToken(accessToken)
    
    // Build the URL based on whether we have a class category
    let url = 'http://82.29.168.17:8222/api/v1/classrooms'
    if (classCategory) {
      url = `http://82.29.168.17:8222/api/v1/classrooms/category/${classCategory}`
      console.log(`Filtering classrooms for category: ${classCategory}`)
    }
    
    console.log(`Making request to: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      mode: 'cors'
    })
    
    console.log(`Response status: ${response.status}`)

    // If we get a 401, try to refresh the token
    if (response.status === 401 && refreshTokenValue) {
      console.log('Proxy API - Token expired, attempting refresh')
      
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
        
        // Get class category from new token
        const newClassCategory = getClassCategoryFromToken(newTokens.access_token)
        
        // Build the URL based on whether we have a class category
        let retryUrl = 'http://82.29.168.17:8222/api/v1/classrooms'
        if (newClassCategory) {
          retryUrl = `http://82.29.168.17:8222/api/v1/classrooms/category/${newClassCategory}`
          console.log(`Filtering classrooms for category: ${newClassCategory}`)
        }
        
        console.log('Retrying with new token:', newTokens.access_token.substring(0, 20) + '...')
        console.log(`Making retry request to: ${retryUrl}`)
        
        // Retry the request with the new token
        const retryResponse = await fetch(retryUrl, {
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
          // Try to get more details from the error response
          try {
            const errorData = await retryResponse.text()
            console.error('Error details:', errorData)
          } catch (e) {
            console.error('Could not read error details')
          }
          
          return NextResponse.json(
            { error: `Failed to fetch classrooms after token refresh: ${retryResponse.status}` },
            { status: retryResponse.status }
          )
        }
        
        const data = await retryResponse.json()
        
        // Return the data with the updated cookies
        return NextResponse.json(data, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
      console.error('Proxy API - Error response:', response.status)
      
      // Try to get more details from the error response
      try {
        const errorData = await response.text()
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Could not read error details')
      }
      
      return NextResponse.json(
        { error: `Failed to fetch classrooms: ${response.status}` },
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
    console.error('Proxy API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classrooms', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    console.log('Proxy API - Using token for POST:', accessToken.substring(0, 20) + '...')
    
    // Get request body
    const body = await request.json()
    
    // URL for creating classrooms
    const url = 'http://82.29.168.17:8222/api/v1/classrooms'
    console.log(`Making POST request to: ${url}`)

    // Ensure token is properly formatted - this is the key fix
    // Remove 'Bearer ' prefix if it exists in the token
    const cleanToken = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    console.log(`Response status: ${response.status}`)

    // If we get a 401, try to refresh the token
    if (response.status === 401 && refreshTokenValue) {
      console.log('Proxy API - Token expired, attempting refresh')
      
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
        
        console.log('Retrying with new token:', newTokens.access_token.substring(0, 20) + '...')
        
        // Ensure new token is properly formatted
        const newCleanToken = newTokens.access_token.startsWith('Bearer ') ? 
          newTokens.access_token : `Bearer ${newTokens.access_token}`
        
        // Retry the request with the new token
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': newCleanToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(body)
        })
        
        console.log(`Retry response status: ${retryResponse.status}`)
        
        if (!retryResponse.ok) {
          // Try to get more details from the error response
          try {
            const errorData = await retryResponse.text()
            console.error('Error details:', errorData)
          } catch (e) {
            console.error('Could not read error details')
          }
          
          return NextResponse.json(
            { error: `Failed to create classroom after token refresh: ${retryResponse.status}` },
            { status: retryResponse.status }
          )
        }
        
        const data = await retryResponse.json()
        
        // Return the data with the updated cookies
        return NextResponse.json(data, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
      console.error('Proxy API - Error response:', response.status)
      
      // Try to get more details from the error response
      try {
        const errorData = await response.text()
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Could not read error details')
      }
      
      return NextResponse.json(
        { error: `Failed to create classroom: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Proxy API error:', error)
    return NextResponse.json(
      { error: 'Failed to create classroom', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 