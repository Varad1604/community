import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { otpCodes, users } from "@/lib/db/schema";
import { eq, gt, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getOtpProvider } from "@/lib/otp/provider";

const cooldownMap = new Map<string, number>();
const hourlyMap = new Map<string, number[]>();

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }
    const clean = phone.replace(/\s/g, "");
    const now = Date.now();
    const last = cooldownMap.get(clean) || 0;
    if (now - last < 60000) return NextResponse.json({ error: "Resend cooldown 60s" }, { status: 429 });
    const arr = (hourlyMap.get(clean) || []).filter(t => now - t < 3600000);
    if (arr.length >= 3) return NextResponse.json({ error: "Rate limit 3/hr" }, { status: 429 });
    arr.push(now); hourlyMap.set(clean, arr); cooldownMap.set(clean, now);

    const code = process.env.OTP_PROVIDER === "mock" && process.env.MOCK_OTP_ENABLED === "true" ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(code, 10);
    await db.insert(otpCodes).values({ phone: clean, codeHash: hash, expiresAt: new Date(now + 5 * 60 * 1000) });
    const provider = getOtpProvider();
    await provider.request(clean, code);
    return NextResponse.json({ success: true, mockOtp: process.env.OTP_PROVIDER === "mock" ? code : undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
