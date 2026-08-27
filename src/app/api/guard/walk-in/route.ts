import { NextResponse } from "next/server";
import { visitors, visitorInvites, visitorEntries, units, gates } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomInt, randomUUID } from "crypto";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";

const schema = z.object({
  visitorName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  purpose: z.string().min(1).max(200),
  unitId: z.string().uuid(),
  gateId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("visitor:entry");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { societyId, sess } = auth as any;

    if (parsed.data.gateId) {
      const gateOk = await withTenant(societyId, sess.userId, async (tx)=>{
        const [g] = await tx.select().from(gates).where(and(eq(gates.id, parsed.data.gateId!), eq(gates.societyId, societyId)));
        return !!g;
      });
      if (!gateOk) return NextResponse.json({ error: "Gate not valid" }, { status: 403 });
    }

    const result = await withTenant(societyId, sess.userId, async (tx)=>{
      const [unit] = await tx.select().from(units).where(and(eq(units.id, parsed.data.unitId), eq(units.societyId, societyId)));
      if (!unit) throw new Error("Unit not in society");
      const [visitor] = await tx.insert(visitors).values({ name: parsed.data.visitorName, phone: parsed.data.phone, societyId }).returning();
      const code = randomInt(100000,1000000).toString().slice(0,4).toUpperCase() + randomInt(10,99).toString();
      const qrToken = randomUUID().replace(/-/g,"").slice(0,16).toUpperCase();
      const now = new Date();
      const [invite] = await tx.insert(visitorInvites).values({
        societyId, unitId: unit.id, visitorId: visitor.id, createdBy: sess.userId, code, qrToken, purpose: parsed.data.purpose, validFrom: now, validTo: new Date(now.getTime()+2*3600000), status: "APPROVED",
      }).returning();
      const [entry] = await tx.insert(visitorEntries).values({
        societyId, inviteId: invite.id, visitorId: visitor.id, unitId: unit.id, gateId: parsed.data.gateId || null, guardId: sess.userId, checkIn: new Date(), idempotencyKey: randomUUID(),
      }).returning();
      return { visitor, invite, entry, unit };
    });

    await audit({ actorId: sess.userId, societyId, action: "guard:walk_in", entity: "visitor_entry", entityId: result.entry.id, newState: result });

    return NextResponse.json(result, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
