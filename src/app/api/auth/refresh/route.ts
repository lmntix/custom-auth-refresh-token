import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await refreshSession(refreshToken);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the session was successfully refreshed, redirect back to the original page
  const referer = request.headers.get("referer");
  return NextResponse.redirect(new URL(referer || "/", request.url));
}
