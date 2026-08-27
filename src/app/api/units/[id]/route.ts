import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const [item] = await db.select().from(units).where(eq(units.id, id)); if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 }); return NextResponse.json(item); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const body = await req.json(); const [item] = await db.update(units).set(body).where(eq(units.id, id)).returning(); return NextResponse.json(item); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await db.delete(units).where(eq(units.id, id)); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
