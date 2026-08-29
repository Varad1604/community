import { NextResponse } from "next/server";
import { emergencyAlerts, notifications, userSocietyRoles } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
export async function GET() {
  const auth = await requireAuthAndSociety("emergency:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const items = await withTenant(societyId, sess.userId, async (tx) => tx.select().from(emergencyAlerts).where(eq(emergencyAlerts.societyId, societyId)).orderBy(desc(emergencyAlerts.createdAt)).limit(20));
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
const schema = z.object({ type: z.string().min(2).max(20), unitId: z.string().uuid().optional(), description: z.string().max(500).optional() });
export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("emergency:manage");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const { societyId, sess } = auth as any;
    const item = await withTenant(societyId, sess.userId, async (tx) => {
      const [created] = await tx.insert(emergencyAlerts).values({ societyId, raisedBy: sess.userId, type: parsed.data.type, unitId: parsed.data.unitId || null, status: "OPEN" }).returning();
      const members = await tx.select().from(userSocietyRoles).where(eq(userSocietyRoles.societyId, societyId));
      for (const m of members) { await tx.insert(notifications).values({ societyId, userId: m.userId, title: `🚨 Emergency: ${parsed.data.type}`, body: parsed.data.description || `Alert raised • ${created.id.slice(0,8)}`, channel: "IN_APP", relatedEntity: "emergency", relatedId: created.id }); }
      return created;
    });
    await audit({ actorId: sess.userId, societyId, action: "create", entity: "emergency_alert", entityId: item.id, newState: item });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Failed" }, { status: 500 }); }
}
