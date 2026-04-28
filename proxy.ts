import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Using a cookie to check auth state because middleware runs on edge
  const token = request.cookies.get('auth-token')?.value;
  const presentationCookie = request.cookies.get('presentation-mode')?.value;
  const { pathname, searchParams } = request.nextUrl;
  const presentationMode =
    searchParams.get('demo') === '1' || presentationCookie === '1';

  const isAuthPage =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

  // Pass through Next.js internals only
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Redirect root to dashboard (auth middleware below handles unauthenticated case)
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(
        presentationMode
          ? '/dashboard?demo=1'
          : token
            ? '/dashboard'
            : '/auth/login',
        request.url,
      ),
    );
  }

  // Redirect unauthenticated users to /auth/login
  if (
    !token &&
    !presentationMode &&
    !isAuthPage &&
    !pathname.startsWith('/auth/forgot-password')
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from /auth/* to /dashboard
  if (token && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
