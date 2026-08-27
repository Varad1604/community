import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitorInvites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("visitor:approve");
  if ("error" in auth) return auth.error;
  try { const { id } = await params; const { societyId, sess } = auth as any; const [prev] = await db.select().from(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId))); if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 }); const body = await req.json(); const allowed: any={}; if (["APPROVED","REJECTED","CANCELLED"].includes(body.status)) allowed.status=body.status; const [item] = await db.update(visitorInvites).set(allowed).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId))).returning(); await audit({ actorId: sess.userId, societyId, action: "update", entity: "visitor_invite", entityId: id, prevState: prev, newState: item }); return NextResponse.json(item); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("visitor:create");
  if ("error" in auth) return auth.error;
  try { const { id } = await params; const { societyId, sess } = auth as any; const [prev] = await db.select().from(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId))); if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 }); await db.delete(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId))); await audit({ actorId: sess.userId, societyId, action: "delete", entity: "visitor_invite", entityId: id, prevState: prev }); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
