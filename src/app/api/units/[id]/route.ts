import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("unit:read");
  if ("error" in auth) return auth.error;
  try { const { id } = await params; const { societyId } = auth as any; const [item] = await db.select().from(units).where(and(eq(units.id, id), eq(units.societyId, societyId))); if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 }); return NextResponse.json(item); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("unit:manage");
  if ("error" in auth) return auth.error;
  try { const { id } = await params; const { societyId, sess } = auth as any; const [prev] = await db.select().from(units).where(and(eq(units.id, id), eq(units.societyId, societyId))); if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 }); const body = await req.json(); const allowed: any = {}; if (body.number) allowed.number = String(body.number).slice(0,20); if (body.status) allowed.status = String(body.status).slice(0,20); const [item] = await db.update(units).set(allowed).where(and(eq(units.id, id), eq(units.societyId, societyId))).returning(); await audit({ actorId: sess.userId, societyId, action: "update", entity: "unit", entityId: id, prevState: prev, newState: item }); return NextResponse.json(item); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("unit:manage");
  if ("error" in auth) return auth.error;
  try { const { id } = await params; const { societyId, sess } = auth as any; const [prev] = await db.select().from(units).where(and(eq(units.id, id), eq(units.societyId, societyId))); if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 }); await db.delete(units).where(and(eq(units.id, id), eq(units.societyId, societyId))); await audit({ actorId: sess.userId, societyId, action: "delete", entity: "unit", entityId: id, prevState: prev }); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
