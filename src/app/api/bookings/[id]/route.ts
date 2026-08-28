import { NextResponse } from "next/server";
import { bookings, amenities, amenitySlots, units } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("booking:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const data = await withTenant(societyId, sess.userId, async (tx)=>{
      const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.societyId, societyId)));
      if (!b) return null;
      const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
      const isPrivileged = roles.some((r:string)=>["SOCIETY_ADMIN","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
      if (!isPrivileged && b.userId !== sess.userId) {
        const { unitMembers } = await import("@/lib/db/schema");
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.unitId, b.unitId)));
        if (members.length===0) throw new Error("Forbidden");
      }
      const [amenity] = await tx.select().from(amenities).where(eq(amenities.id, b.amenityId));
      const [slot] = b.slotId ? await tx.select().from(amenitySlots).where(eq(amenitySlots.id, b.slotId)) : [null];
      const [unit] = await tx.select().from(units).where(eq(units.id, b.unitId));
      return { booking: b, amenity, slot, unit };
    });
    if (!data) return NextResponse.json({ error:"Not found" }, { status:404 });
    return NextResponse.json(data);
  } catch (e:any) {
    if (e.message==="Forbidden") return NextResponse.json({ error:"Forbidden" }, { status:403 });
    return NextResponse.json({ error:"Failed" }, { status:500 });
  }
}

const patchSchema = z.object({ status: z.enum(["CONFIRMED","CANCELLED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("booking:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error:"Invalid input" }, { status:400 });
    const { societyId, sess } = auth as any;

    const updated = await withTenant(societyId, sess.userId, async (tx)=>{
      const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.societyId, societyId)));
      if (!b) throw new Error("Not found");
      if (b.status==="CANCELLED") throw new Error("Already cancelled");
      if (b.status==="COMPLETED") throw new Error("Cannot cancel completed");
      const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
      const isPrivileged = roles.some((r:string)=>["SOCIETY_ADMIN","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
      const isOwner = b.userId===sess.userId;
      if (!isOwner && !isPrivileged) throw new Error("Forbidden");
      if (parsed.data.status==="CANCELLED" && !isOwner && !isPrivileged) throw new Error("Forbidden");
      const [upd] = await tx.update(bookings).set({ status: parsed.data.status }).where(and(eq(bookings.id, id), eq(bookings.societyId, societyId))).returning();
      return upd;
    });
    await audit({ actorId: sess.userId, societyId, action:"update", entity:"booking", entityId: id, newState: updated, prevState: { status:"CONFIRMED" } });
    return NextResponse.json(updated);
  } catch (e:any) {
    if (e.message==="Forbidden") return NextResponse.json({ error:"Forbidden" }, { status:403 });
    if (e.message==="Not found") return NextResponse.json({ error:"Not found" }, { status:404 });
    if (e.message==="Already cancelled") return NextResponse.json({ error:e.message }, { status:409 });
    return NextResponse.json({ error: e.message || "Failed" }, { status:500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("booking:manage");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    await withTenant(societyId, sess.userId, async (tx)=>{
      const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.societyId, societyId)));
      if (!b) throw new Error("Not found");
      await tx.delete(bookings).where(and(eq(bookings.id, id), eq(bookings.societyId, societyId)));
    });
    await audit({ actorId: sess.userId, societyId, action:"delete", entity:"booking", entityId: id });
    return NextResponse.json({ success:true });
  } catch (e:any) {
    if (e.message==="Not found") return NextResponse.json({ error:"Not found" }, { status:404 });
    return NextResponse.json({ error:"Failed" }, { status:500 });
  }
}
