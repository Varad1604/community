import { cookies } from "next/headers";
import { verifyJwt } from "./jwt";
export async function getSession() {
  const store = await cookies();
  const token = store.get("session")?.value;
  if (!token) return null;
  try {
    const payload = await verifyJwt(token);
    return payload as { userId: string; phone: string; exp: number };
  } catch { return null; }
}
export async function requireAuth() {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}
