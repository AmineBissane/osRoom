import { NextRequest, NextResponse } from 'next/server'
import { refreshToken, isTokenExpired, sanitizeToken } from '@/utils/auth'

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
  context: { params: { id: string } }
) {
  try {
    // Properly await or destructure params in one line
    const fileId = context.params.id;
    
    // Get the token from the request cookies
    const token = request.cookies.get('access_token')?.value
    const refreshTokenValue = request.cookies.get('refresh_token')?.value
    
    // Also check for Authorization header in case token is passed that way
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null
    
    // Use token from cookie or header
    let accessToken = token || tokenFromHeader

    if (!accessToken) {
      console.error('No authentication token found');
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }
    
    // Sanitize the token
    accessToken = sanitizeToken(accessToken) || accessToken;
    console.log('Token after sanitization:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');

    // Check if the token is expired before making the request
    const tokenExpired = isTokenExpired(accessToken);
    console.log('Token expired?', tokenExpired);
    
    // If token is expired and we have a refresh token, try to refresh before making the request
    if (tokenExpired && refreshTokenValue) {
      console.log('Token expired, attempting refresh before making request');
      try {
        const sanitizedRefreshToken = sanitizeToken(refreshTokenValue) || refreshTokenValue;
        const newTokens = await refreshToken(sanitizedRefreshToken);
        
        if (!newTokens || !newTokens.access_token) {
          console.error('Token refresh failed: No new tokens received');
          return NextResponse.json(
            { error: 'Session expired, please log in again' },
            { status: 401 }
          );
        }
        
        console.log('Token refreshed successfully before request');
        
        // Create a response with the new tokens as cookies
        const response = await makeFileRequest(fileId, newTokens.access_token, request);
        
        // Set the new tokens as cookies on the response
        const nextResponse = new NextResponse(
          response.body,
          {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          }
        );
        
        // Set the new tokens as cookies
        nextResponse.cookies.set('access_token', newTokens.access_token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        if (newTokens.refresh_token) {
          nextResponse.cookies.set('refresh_token', newTokens.refresh_token, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          });
        }
        
        if (newTokens.id_token) {
          nextResponse.cookies.set('id_token', newTokens.id_token, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
          });
        }
        
        return nextResponse;
      } catch (refreshError) {
        console.error('Token refresh failed before request:', refreshError);
      }
    }

    // If we got here, either the token is valid or refresh failed, proceed with the request
    return makeFileRequest(fileId, accessToken, request);
    
  } catch (error) {
    console.error('API error:', error);
    
    // Check if this is a preview request
    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
    
    if (isPreview) {
      // Return a user-friendly HTML error for preview requests
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
              color: #333;
            }
            .error-container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 80%;
            }
            .error-icon {
              font-size: 3rem;
              color: #e53935;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">❌</div>
            <h1>Server Error</h1>
            <p>An unexpected error occurred. Please try again later.</p>
          </div>
        </body>
        </html>`,
        {
          status: 500,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to download file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to make the actual file request
async function makeFileRequest(fileId: string, token: string, request: NextRequest) {
  // Check if this is a preview request
  const isPreview = request.nextUrl.searchParams.get('preview') === 'true';

  console.log(`${isPreview ? 'Previewing' : 'Downloading'} file with ID: ${fileId}`);
  console.log('Using token:', token.substring(0, 20) + '...');

  // For preview requests, pass the preview parameter to the backend 
  // only if our backend supports it directly
  const apiUrl = `http://localhost:8222/api/v1/file-storage/download/${fileId}${isPreview ? '?preview=true' : ''}`;
  console.log(`Making request to: ${apiUrl}`);

  // Log all request headers for debugging
  console.log('Request headers:');
  request.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      },
      cache: 'no-store'
    });
    
    console.log(`Response status: ${response.status}`);
    
    // Log response headers for debugging
    console.log('Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    if (!response.ok) {
      console.error('Error response:', response.status);
      
      // Try to get more details from the error response
      try {
        const errorData = await response.text();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not read error details');
      }
      
      // For iframe preview requests, return HTML error page instead of JSON for better user experience
      if (isPreview) {
        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error Loading Document</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
              color: #333;
            }
            .error-container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 80%;
            }
            .error-icon {
              font-size: 3rem;
              color: #e53935;
              margin-bottom: 1rem;
            }
            .error-code {
              font-size: 1.2rem;
              color: #757575;
              margin-top: 1rem;
            }
          </style>
          <script>
          // Prevent keyboard events from propagating to parent window
          document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('keydown', function(e) {
              e.stopPropagation();
            }, true);
            document.addEventListener('keyup', function(e) {
              e.stopPropagation();
            }, true);
            document.addEventListener('keypress', function(e) {
              e.stopPropagation();
            }, true);
          });
          </script>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">❌</div>
            <h1>Unable to Load Document</h1>
            <p>The document could not be loaded due to an authentication error.</p>
            <p class="error-code">Error: ${response.status}</p>
          </div>
        </body>
        </html>
        `;
        
        return new NextResponse(errorHtml, {
          status: response.status,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
      
      // For regular requests, return JSON error
      return NextResponse.json(
        { error: `Failed to download file: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the file content and headers
    const fileData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // If this is a preview, set inline disposition, otherwise use attachment
    const disposition = isPreview ? 'inline' : 'attachment';
    const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.at(1) || `file-${fileId}`;
    const contentDisposition = `${disposition}; filename="${filename}"`;
    
    console.log(`Content-Type: ${contentType}, Content-Disposition: ${contentDisposition}`);
    
    // For preview in iframe, add extra headers and scripts to prevent keyboard events from propagating
    if (isPreview && contentType.includes('text/html')) {
      // If the content is HTML, we need to inject scripts to prevent keyboard events
      let htmlContent = new TextDecoder().decode(fileData);
      
      // Inject scripts in the HTML head to prevent keyboard events
      const scriptToInject = `
      <script>
        // Prevent keyboard events from propagating to parent window
        document.addEventListener('DOMContentLoaded', function() {
          document.addEventListener('keydown', function(e) {
            e.stopPropagation();
          }, true);
          document.addEventListener('keyup', function(e) {
            e.stopPropagation();
          }, true);
          document.addEventListener('keypress', function(e) {
            e.stopPropagation();
          }, true);
        });
      </script>
      `;
      
      // Add the script to the HTML head
      htmlContent = htmlContent.replace('</head>', `${scriptToInject}</head>`);
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-Frame-Options': 'SAMEORIGIN'
        }
      });
    }
    
    // For PDF files and other non-HTML content, just return the file with appropriate headers
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': String(fileData.byteLength),
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });
  } catch (error) {
    console.error('API fetch error:', error);
    
    // For iframe preview requests, return HTML error page
    if (isPreview) {
      const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Loading Document</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .error-container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 80%;
          }
          .error-icon {
            font-size: 3rem;
            color: #e53935;
            margin-bottom: 1rem;
          }
          .error-message {
            margin: 1rem 0;
          }
        </style>
        <script>
        // Prevent keyboard events from propagating to parent window
        document.addEventListener('DOMContentLoaded', function() {
          document.addEventListener('keydown', function(e) {
            e.stopPropagation();
          }, true);
          document.addEventListener('keyup', function(e) {
            e.stopPropagation();
          }, true);
          document.addEventListener('keypress', function(e) {
            e.stopPropagation();
          }, true);
        });
        </script>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">❌</div>
          <h1>Connection Error</h1>
          <p class="error-message">Could not connect to the file server.</p>
        </div>
      </body>
      </html>
      `;
      
      return new NextResponse(errorHtml, {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // For regular requests, return JSON error
    return NextResponse.json(
      { error: 'Failed to download file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 