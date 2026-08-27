import { NextResponse } from "next/server";
import { visitorInvites, visitors, visitorEntries, units } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("visitor:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const data = await withTenant(societyId, sess.userId, async (tx) => {
      const [invite] = await tx.select().from(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId)));
      if (!invite) return null;
      const [visitor] = await tx.select().from(visitors).where(eq(visitors.id, invite.visitorId));
      const [unit] = await tx.select().from(units).where(eq(units.id, invite.unitId));
      const entries = await tx.select().from(visitorEntries).where(eq(visitorEntries.inviteId, id));
      return { invite, visitor, unit, entries };
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("visitor:approve");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const body = await req.json();
    const allowed: any = {};
    if (["APPROVED", "REJECTED", "CANCELLED"].includes(body.status)) allowed.status = body.status;
    else return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const updated = await withTenant(societyId, sess.userId, async (tx) => {
      const [prev] = await tx.select().from(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId)));
      if (!prev) throw new Error("Not found");
      if (prev.status === "CANCELLED" || prev.status === "EXPIRED") throw new Error(`Cannot change ${prev.status} invite`);
      const [item] = await tx.update(visitorInvites).set(allowed).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId))).returning();
      return { prev, item };
    });
    await audit({ actorId: sess.userId, societyId, action: "update", entity: "visitor_invite", entityId: id, prevState: updated.prev, newState: updated.item });
    return NextResponse.json(updated.item);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("visitor:create");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const deleted = await withTenant(societyId, sess.userId, async (tx) => {
      const [prev] = await tx.select().from(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId)));
      if (!prev) throw new Error("Not found");
      await tx.delete(visitorInvites).where(and(eq(visitorInvites.id, id), eq(visitorInvites.societyId, societyId)));
      return prev;
    });
    await audit({ actorId: sess.userId, societyId, action: "delete", entity: "visitor_invite", entityId: id, prevState: deleted });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
