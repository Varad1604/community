import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
export async function POST() {
  try {
    const store = await cookies();
    const token = store.get("session")?.value;
    if (token) await db.delete(sessions).where(eq(sessions.token, token));
  } catch {}
  const res = NextResponse.json({ success: true });
  res.cookies.set("session", "", { maxAge: 0, path: "/" });
  res.cookies.set("active_society", "", { maxAge: 0, path: "/" });
  return res;
}
