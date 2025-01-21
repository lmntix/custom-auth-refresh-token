"use server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { createToken, verifyToken } from "./jwt";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import type { SessionUser, Session } from "./types";

const SESSION_COOKIE = "auth_session";
const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function createSession(user: SessionUser): Promise<void> {
  console.log("[Session] Creating session for user:", user.id);
  const refreshToken = uuidv4();

  try {
    await db.insert(sessions).values({
      id: uuidv4(),
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const token = await createToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionData: {
        createdAt: Date.now(),
        lastActive: Date.now(),
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 20, // 20 seconds
      path: "/",
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    console.log("[Session] Session created successfully");
  } catch (error) {
    console.error("[Session] Error creating session:", error);
    throw new Error(
      "Failed to create session: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

export async function getSession(): Promise<Session | null> {
  console.log("[Session] Getting session");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    console.log("[Session] No refresh token found");
    return null;
  }

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      console.log("[Session] Valid session found for user:", payload.sub);
      return {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
        expiresAt: payload.exp * 1000,
      };
    }
  }

  console.log("[Session] Session token invalid or expired, attempting refresh");
  return refreshSession(refreshToken);
}

export async function refreshSession(
  refreshToken: string
): Promise<Session | null> {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, refreshToken))
    .leftJoin(users, eq(sessions.userId, users.id))
    .get();

  if (!session || new Date(session.sessions.expiresAt) <= new Date()) {
    console.log("[Session] No valid session found or session expired");
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    return null;
  }

  console.log("[Session] Refreshing session for user:", session.users.id);
  const newToken = await createToken({
    sub: session.users.id,
    email: session.users.email,
    name: session.users.name,
    role: session.users.role,
    sessionData: {
      createdAt: Date.now(),
      lastActive: Date.now(),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 20, // 20 seconds
    path: "/",
  });

  console.log("[Session] Session refreshed successfully");
  return {
    user: {
      id: session.users.id,
      email: session.users.email,
      name: session.users.name,
      role: session.users.role,
    },
    expiresAt: new Date(session.sessions.expiresAt).getTime(),
    refreshToken,
  };
}

export async function destroySession(): Promise<void> {
  console.log("[Session] Destroying session");
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  console.log("[Session] Session destroyed successfully");
}
