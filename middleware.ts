import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/database.types"

const protectedPaths = ['/admin', '/reception', '/members', '/payments', '/pos', '/checkin', '/products', '/coaches', '/programs', '/plans', '/notifications', '/settings', '/turnstiles', '/rfid', '/access', '/ai-coach', '/events', '/expenses', '/fidelity', '/commissions', '/private-coaching', '/consumables', '/equipment', '/finance', '/personnel', '/coach']

const receptionAllowedPaths = ['/checkin', '/members', '/payments', '/pos', '/products', '/coaches', '/programs', '/plans', '/notifications', '/turnstiles', '/access', '/events', '/expenses', '/fidelity', '/commissions', '/private-coaching', '/consumables', '/equipment']
const coachAllowedPaths = ['/coach', '/members', '/coaches', '/programs', '/plans', '/private-coaching', '/ai-coach']
const adherentAllowedPaths = ['/ai-coach', '/members/profile']

function hasRoleAccess(role: string, pathname: string): boolean {
  if (role === 'admin' || role === 'staff') return true
  if (role === 'reception') return receptionAllowedPaths.some(p => pathname.startsWith(p))
  if (role === 'coach') return coachAllowedPaths.some(p => pathname.startsWith(p))
  if (role === 'adherent') return adherentAllowedPaths.some(p => pathname.startsWith(p))
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))
  const isApiRoute = pathname.startsWith('/api/')

  if (!isProtected && !isApiRoute) return NextResponse.next()

  const publicApiPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/session']
  if (isApiRoute && publicApiPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = user.user_metadata?.role as string || 'adherent'

  if (!hasRoleAccess(role, pathname)) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*', '/reception/:path*', '/members/:path*', '/payments/:path*', '/pos/:path*',
    '/checkin/:path*', '/products/:path*', '/coaches/:path*', '/programs/:path*',
    '/plans/:path*', '/notifications/:path*', '/settings/:path*', '/turnstiles/:path*',
    '/rfid/:path*', '/access/:path*', '/ai-coach/:path*', '/events/:path*', '/expenses/:path*',
    '/fidelity/:path*', '/commissions/:path*', '/private-coaching/:path*',
    '/consumables/:path*', '/equipment/:path*', '/finance/:path*', '/personnel/:path*',
    '/coach/:path*',
    '/api/:path*',
  ],
}