import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route guard: a dashboard page is never rendered for a browser
 * that holds no session cookie.
 *
 * Until now every check ran client-side, after the page's JavaScript had
 * loaded. The API sets the session as an HttpOnly cookie on `.aparte.ng`, so
 * this server can see it even though page scripts cannot.
 *
 * This only checks that the cookie EXISTS. The API validates it on every
 * request, and a cookie it rejects answers 401, which the axios interceptor
 * turns into a sign-out. Decoding the JWT here would need the API's signing
 * secret in the dashboard, which is not worth holding for a redirect.
 */
const SESSION_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "aparte_session";

export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const login = request.nextUrl.clone();
  login.pathname = "/auth/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the auth pages, Next internals, the Sentry tunnel and
  // static files (anything with an extension, e.g. /svg/logo.svg).
  matcher: ["/((?!auth/|_next/|monitoring|.*\\..*).*)"],
};
