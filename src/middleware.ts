import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const path = request.nextUrl.pathname;

  // Publicly accessible paths
  const publicPaths = [
    '/login', 
    '/admin-login', 
    '/register', 
    '/contests', 
    '/products', 
    '/design',
    '/about',
    '/sustainability',
    '/contact',
    '/help',
    '/terms',
    '/privacy',
    '/printer-registration',
  ];

  // If the path is public, let the request through
  if (publicPaths.some(p => path.startsWith(p)) || path === '/') {
    return NextResponse.next();
  }

  // For all other paths, check for a session
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // We match all paths except for API routes, Next.js static files, and common image formats.
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)',
};
