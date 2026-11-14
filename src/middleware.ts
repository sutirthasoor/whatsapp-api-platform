import { NextResponse, type NextRequest } from 'next/server'

const COOKIE = 'wc_session'
/** Routes of the previous Supabase dashboard — the app now opens at the login screen instead. */
const LEGACY = /^\/(dashboard|inbox|contacts|pipelines|broadcasts|automations|flows|agents|notifications|settings|demo)(\/|$)/

/**
 * Fast pre-check only: a missing cookie never reaches /admin or /panel. The real check
 * (signature, expiry, role) runs in the server layouts via getSession().
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (LEGACY.test(pathname)) { const u = req.nextUrl.clone(); u.pathname = '/'; u.search = ''; return NextResponse.redirect(u) }
  if (!req.cookies.get(COOKIE)?.value) { const u = req.nextUrl.clone(); u.pathname = '/login'; u.search = ''; return NextResponse.redirect(u) }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/panel/:path*', '/dashboard/:path*', '/inbox/:path*', '/contacts/:path*', '/pipelines/:path*', '/broadcasts/:path*', '/automations/:path*', '/flows/:path*', '/agents/:path*', '/notifications/:path*', '/settings/:path*', '/demo/:path*', '/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/flows', '/agents', '/notifications', '/settings', '/demo'],
}
