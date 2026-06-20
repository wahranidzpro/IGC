import { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]

export function validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (!origin && !referer) {
    return { valid: true }
  }

  if (origin) {
    if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
      return { valid: true }
    }
    return { valid: false, error: `Origin '${origin}' not allowed` }
  }

  if (referer) {
    if (ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))) {
      return { valid: true }
    }
    return { valid: false, error: `Referer '${referer}' not allowed` }
  }

  return { valid: true }
}
