import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitorInvites } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
export async function GET() {
  try { const items = await db.select().from(visitorInvites).orderBy(desc(visitorInvites.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.code) body.code = Math.random().toString(36).substring(2, 6).toUpperCase();
    if (!body.validTo) body.validTo = new Date(Date.now() + 24 * 3600000).toISOString();
    const [item] = await db.insert(visitorInvites).values(body).returning();
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
