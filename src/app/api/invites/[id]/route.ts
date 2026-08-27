import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitorInvites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const body = await req.json(); const [item] = await db.update(visitorInvites).set(body).where(eq(visitorInvites.id, id)).returning(); return NextResponse.json(item); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await db.delete(visitorInvites).where(eq(visitorInvites.id, id)); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
