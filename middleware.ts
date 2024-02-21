import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname;

  //go to home in browser language if pathname & locale is missing
  /* if (pathname === '/') {
    return NextResponse.redirect(new URL(`/home`, request.url));
  } */
}

export const config = {
  matcher: ['/((?!.*\\.|_next|api\\/).*)'],
};
