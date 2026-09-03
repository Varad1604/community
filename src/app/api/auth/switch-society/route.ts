import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userSocietyRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const sess = await getSession();
    if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { societyId } = body;
    if (!societyId) return NextResponse.json({ error: "societyId is required" }, { status: 400 });

    // Verify user belongs to the requested society
    const memberships = await db
      .select()
      .from(userSocietyRoles)
      .where(and(eq(userSocietyRoles.userId, sess.userId), eq(userSocietyRoles.societyId, societyId)));

    if (memberships.length === 0) {
      return NextResponse.json({ error: "Forbidden: Not a member of this society" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set("active_society", societyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, societyId });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
