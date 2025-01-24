import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get auth token from cookies
  const token = request.cookies.get('auth')?.value;

  // If accessing admin routes without token, redirect to login
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      // Store the attempted URL to redirect back after login
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing login page with valid token, redirect to admin
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If accessing root path ('/'), redirect to login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/login'],
}; 