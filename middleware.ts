import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from "./auth"

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/predictions/:path*', '/friend-groups/:path*', '/tournaments/:path*'],
};

export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old friend groups URL to new URL
  const groupsMatch = pathname.match(/^\/tournaments\/(\d+)\/groups$/);
  if (groupsMatch) {
    const tournamentId = groupsMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/tournaments/${tournamentId}/friend-groups`;
    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  return NextResponse.next();
})

