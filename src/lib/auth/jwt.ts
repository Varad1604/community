import { SignJWT, jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-32chars-long-change-me!");

export async function signJwt(payload: Record<string, any>, expiresIn = "24h") {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(secret);
}
export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
