import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitorInvites, visitors } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { verifyUnitBelongsToSociety } from "@/lib/tenant";
import { randomInt } from "crypto";
import { audit } from "@/lib/audit";
export async function GET() {
  const auth = await requireAuthAndSociety("visitor:read");
  if ("error" in auth) return auth.error;
  try { const { societyId } = auth as any; const items = await db.select().from(visitorInvites).where(eq(visitorInvites.societyId, societyId)).orderBy(desc(visitorInvites.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
const s = z.object({ unitId: z.string().uuid(), visitorId: z.string().uuid(), purpose: z.string().max(200).optional(), validTo: z.string().optional() });
export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("visitor:create");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { societyId, sess } = auth as any;
    await verifyUnitBelongsToSociety(parsed.data.unitId, societyId);
    const [visitor] = await db.select().from(visitors).where(and(eq(visitors.id, parsed.data.visitorId), eq(visitors.societyId, societyId)));
    if (!visitor) return NextResponse.json({ error: "Visitor not in society" }, { status: 403 });
    const code = randomInt(100000, 1000000).toString().slice(0,4).toUpperCase() + randomInt(10,99).toString();
    const [item] = await db.insert(visitorInvites).values({ societyId, unitId: parsed.data.unitId, visitorId: parsed.data.visitorId, createdBy: sess.userId, code, purpose: parsed.data.purpose, validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : new Date(Date.now()+86400000) }).returning();
    await audit({ actorId: sess.userId, societyId, action: "create", entity: "visitor_invite", entityId: item.id, newState: item });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
