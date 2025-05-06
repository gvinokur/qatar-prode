import exp from "node:constants";
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/predictions/:path*', '/friend-groups/:path*'],
};

export { auth as middleware } from "./auth"

