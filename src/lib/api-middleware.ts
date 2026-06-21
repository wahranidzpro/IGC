import { NextRequest } from 'next/server'
import { validateOrigin } from './csrf'
import { error } from './api-response'

type Handler = (request: NextRequest, ...args: unknown[]) => Promise<Response>

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/logout', '/api/auth/session', '/api/setup-admin']

export function withCsrf(handler: Handler): Handler {
  return async (request: NextRequest, ...args: unknown[]) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const path = request.nextUrl.pathname
      if (PUBLIC_API_PATHS.some(p => path === p || path.startsWith(p + '/'))) {
        return handler(request, ...args)
      }
      const { valid } = validateOrigin(request)
      if (!valid) {
        return error('CSRF validation failed', 403, 'CSRF_ERROR')
      }
    }
    return handler(request, ...args)
  }
}
