import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const alg = "HS256";

export async function createToken(payload: any): Promise<string> {
  console.log("[JWT] Creating token for:", payload.sub);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("20s") // Set expiration to 20 seconds
    .sign(secret);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    console.log("[JWT] Verifying token");
    const { payload } = await jose.jwtVerify(token, secret);
    console.log("[JWT] Token verified successfully for:", payload.sub);
    return payload;
  } catch (error) {
    console.error("[JWT] Token verification failed:", error);
    return null;
  }
}
