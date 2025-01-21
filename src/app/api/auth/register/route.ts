import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  console.log("[API] Registration attempt");
  try {
    const { name, email, password } = await request.json();
    console.log("[API] Received registration data:", { name, email });

    // Validate input
    if (!name || !email || !password) {
      console.log("[API] Invalid input data");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();
    if (existingUser) {
      console.log("[API] User already exists:", email);
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const [user] = await db
      .insert(users)
      .values({
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role: "user",
      })
      .returning();

    console.log("[API] User created successfully:", user.id);

    // Create session for the new user
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    console.log("[API] Session created for new user");

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
