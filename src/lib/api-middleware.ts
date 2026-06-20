import { NextRequest } from 'next/server'
import { validateOrigin } from './csrf'
import { error } from './api-response'

type Handler = (request: NextRequest, ...args: unknown[]) => Promise<Response>

export function withCsrf(handler: Handler): Handler {
  return async (request: NextRequest, ...args: unknown[]) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const { valid } = validateOrigin(request)
      if (!valid) {
        return error('CSRF validation failed', 403, 'CSRF_ERROR')
      }
    }
    return handler(request, ...args)
  }
}
