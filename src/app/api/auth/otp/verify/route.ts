import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { otpCodes, users, sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const { phone, code, fullName } = await req.json();
    if (!phone || !code) return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
    const clean = phone.replace(/\s/g, "");
    const [otp] = await db.select().from(otpCodes).where(eq(otpCodes.phone, clean)).orderBy(desc(otpCodes.createdAt)).limit(1);
    if (!otp) return NextResponse.json({ error: "No OTP found" }, { status: 400 });
    if (otp.consumed) return NextResponse.json({ error: "OTP already used" }, { status: 400 });
    if (otp.expiresAt < new Date()) return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    if (otp.attempts >= 5) return NextResponse.json({ error: "Too many attempts, locked 15 min" }, { status: 429 });
    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
    await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, otp.id));
    let [user] = await db.select().from(users).where(eq(users.phone, clean)).limit(1);
    if (!user) {
      const [created] = await db.insert(users).values({ phone: clean, fullName: fullName || clean, phoneVerified: true }).returning();
      user = created;
    } else if (!user.phoneVerified) {
      await db.update(users).set({ phoneVerified: true }).where(eq(users.id, user.id));
    }
    const token = await signJwt({ userId: user.id, phone: user.phone }, "24h");
    await db.insert(sessions).values({ userId: user.id, token, expiresAt: new Date(Date.now() + 24 * 3600000) });
    const res = NextResponse.json({ success: true, user });
    res.cookies.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
