interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export async function authenticateWithKeycloak(username: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams({
    username,
    password,
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID || 'backendgateway',
    client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET || 'MYlMMYC1khs8vHXqoOgu0CEAEPPiykbj',
    grant_type: 'password',
    scope: 'openid'
  });

  const response = await fetch(
    'http://82.29.168.17:8080/realms/osRoom/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include'
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Authentication failed');
  }

  const tokenData = await response.json();
  console.log('Auth response check:', {
    hasAccessToken: !!tokenData.access_token,
    tokenLength: tokenData.access_token?.length,
    tokenType: tokenData.token_type
  });

  return tokenData;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const formData = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID || 'backendgateway',
    client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET || 'MYlMMYC1khs8vHXqoOgu0CEAEPPiykbj',
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch(
    'http://82.29.168.17:8080/realms/osRoom/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include'
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  const tokenData = await response.json();
  console.log('Token refresh successful:', {
    hasAccessToken: !!tokenData.access_token,
    tokenLength: tokenData.access_token?.length,
    tokenType: tokenData.token_type
  });

  return tokenData;
}

export function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  
  try {
    // Basic check if token exists and has a reasonable length
    if (token.length < 20) return false;
    
    // For a more thorough check, you could decode the JWT and check its expiration
    // This is a simplified check
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
} 