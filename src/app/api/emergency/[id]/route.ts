import { NextResponse } from "next/server";
import { emergencyAlerts } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("emergency:manage");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;
    if (!status || !["OPEN", "ACKNOWLEDGED", "RESOLVED", "CLOSED"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const { societyId, sess } = auth as any;
    const updated = await withTenant(societyId, sess.userId, async (tx) => {
      const [existing] = await tx.select().from(emergencyAlerts).where(and(eq(emergencyAlerts.id, id), eq(emergencyAlerts.societyId, societyId)));
      if (!existing) throw new Error("Not found");
      if (existing.status !== "OPEN" && status === "OPEN") throw new Error("Invalid transition");
      const patch: any = { status };
      if (status === "ACKNOWLEDGED" || status === "RESOLVED" || status === "CLOSED") patch.acknowledgedBy = sess.userId;
      const [upd] = await tx.update(emergencyAlerts).set(patch).where(and(eq(emergencyAlerts.id, id), eq(emergencyAlerts.societyId, societyId))).returning();
      return upd;
    });
    await audit({ actorId: sess.userId, societyId, action: "update", entity: "emergency_alert", entityId: id, newState: updated });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.message === "Invalid transition") return NextResponse.json({ error: "Invalid transition" }, { status: 409 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
