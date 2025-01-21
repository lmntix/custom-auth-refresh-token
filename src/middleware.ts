import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const SESSION_COOKIE = "auth_session";
const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function middleware(request: NextRequest) {
  console.log(
    `[Middleware] Processing request for: ${request.nextUrl.pathname}`
  );

  // Exclude public routes
  if (
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register")
  ) {
    console.log("[Middleware] Public route, skipping auth check");
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    console.log("[Middleware] No refresh token found, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    // Verify JWT without database query
    const payload = await verifyToken(token);
    if (payload) {
      console.log("[Middleware] Valid token, proceeding with request");
      return NextResponse.next();
    }
  }

  console.log("[Middleware] Invalid or expired token, redirecting to refresh");
  // Token is invalid or expired, try refresh flow
  const response = NextResponse.redirect(
    new URL("/api/auth/refresh", request.url)
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
