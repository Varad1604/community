import { NextResponse } from "next/server";
import { deliveries, unitMembers, units } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("delivery:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const data = await withTenant(societyId, sess.userId, async (tx)=>{
      const [del] = await tx.select().from(deliveries).where(and(eq(deliveries.id, id), eq(deliveries.societyId, societyId)));
      if (!del) return null;
      const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
      const isGuard = roles.some((r:string)=>["GUARD","SECURITY_MANAGER","SOCIETY_ADMIN","SUPER_ADMIN"].includes(r));
      if (!isGuard) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.unitId, del.unitId)));
        if (members.length===0) throw new Error("Forbidden");
      }
      const [unit] = await tx.select().from(units).where(eq(units.id, del.unitId));
      return { delivery: del, unit };
    });
    if (!data) return NextResponse.json({ error:"Not found" }, { status:404 });
    return NextResponse.json(data);
  } catch (e:any) {
    if (e.message==="Forbidden") return NextResponse.json({ error:"Forbidden" }, { status:403 });
    return NextResponse.json({ error:"Failed" }, { status:500 });
  }
}

const patchSchema = z.object({ status: z.enum(["AT_GATE","DELIVERED","COLLECTED","RETURNED"]).optional(), collected: z.boolean().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("delivery:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error:"Invalid input" }, { status:400 });
    const { societyId, sess } = auth as any;

    const updated = await withTenant(societyId, sess.userId, async (tx)=>{
      const [del] = await tx.select().from(deliveries).where(and(eq(deliveries.id, id), eq(deliveries.societyId, societyId)));
      if (!del) throw new Error("Not found");
      const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
      const isGuard = roles.some((r:string)=>["GUARD","SECURITY_MANAGER","SOCIETY_ADMIN","SUPER_ADMIN"].includes(r));
      const isResidentCollect = parsed.data.status==="COLLECTED" || parsed.data.collected===true;

      if (isResidentCollect) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.unitId, del.unitId)));
        const canCollect = members.length>0 || isGuard;
        if (!canCollect) throw new Error("Forbidden");
        const [upd] = await tx.update(deliveries).set({ status:"COLLECTED", collectedAt: new Date() }).where(and(eq(deliveries.id, id), eq(deliveries.societyId, societyId))).returning();
        return upd;
      }

      if (!isGuard) throw new Error("Forbidden");
      const allowed: any = {};
      if (parsed.data.status) allowed.status = parsed.data.status;
      const [upd] = await tx.update(deliveries).set(allowed).where(and(eq(deliveries.id, id), eq(deliveries.societyId, societyId))).returning();
      return upd;
    });

    await audit({ actorId: sess.userId, societyId, action:"update", entity:"delivery", entityId: id, newState: updated });
    return NextResponse.json(updated);
  } catch (e:any) {
    if (e.message==="Forbidden") return NextResponse.json({ error:"Forbidden" }, { status:403 });
    if (e.message==="Not found") return NextResponse.json({ error:"Not found" }, { status:404 });
    return NextResponse.json({ error: e.message || "Failed" }, { status:500 });
  }
}
