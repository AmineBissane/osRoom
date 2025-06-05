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
    client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET || 'vuYLYCo5JrMbLTZQCOH8nBkltsqXPCLe',
    grant_type: 'password',
    scope: 'openid'
  });

  const response = await fetch(
    'http://localhost:8080/realms/osRoom/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
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
    client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET || 'vuYLYCo5JrMbLTZQCOH8nBkltsqXPCLe',
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch(
    'http://localhost:8080/realms/osRoom/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
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