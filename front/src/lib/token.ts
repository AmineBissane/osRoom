import { cookies } from 'next/headers'

export function setTokens(tokens: { access_token: string; refresh_token: string; id_token: string }) {
  // Store tokens in HTTP-only cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }

  cookies().set('access_token', tokens.access_token, cookieOptions)
  cookies().set('refresh_token', tokens.refresh_token, cookieOptions)
  cookies().set('id_token', tokens.id_token, cookieOptions)
}

export function clearTokens() {
  cookies().delete('access_token')
  cookies().delete('refresh_token')
  cookies().delete('id_token')
}

export function getAccessToken(): string | undefined {
  return cookies().get('access_token')?.value
}

export function getRefreshToken(): string | undefined {
  return cookies().get('refresh_token')?.value
}

export function getIdToken(): string | undefined {
  return cookies().get('id_token')?.value
} 