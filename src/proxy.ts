import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  reception: 60,
  staff: 60,
  coach: 40,
  member: 10,
}

function hasAccess(userRole: string, minLevel: number): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= minLevel
}

function getDashboardPath(role: string): string {
  if (role === "admin" || role === "staff") return "/admin"
  if (role === "reception") return "/reception"
  if (role === "coach") return "/coach"
  return "/dashboard"
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
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
  const role = ((user?.user_metadata?.role as string) || "member")

  if (user && ["/login", "/signup"].includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = getDashboardPath(role)
    return NextResponse.redirect(url)
  }

  if (!user) {
    if (["/dashboard", "/reception", "/coach", "/admin"].some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (pathname.startsWith("/admin") && !hasAccess(role, 60)) {
    const url = request.nextUrl.clone()
    url.pathname = getDashboardPath(role)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/reception") && !hasAccess(role, 60)) {
    const url = request.nextUrl.clone()
    url.pathname = getDashboardPath(role)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/coach") && !hasAccess(role, 40)) {
    const url = request.nextUrl.clone()
    url.pathname = getDashboardPath(role)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
