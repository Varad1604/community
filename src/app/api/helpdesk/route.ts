import { NextResponse } from "next/server";
import { helpdeskTickets, units, unitMembers, notifications } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
import { getUserRoles } from "@/lib/tenant";
const createSchema = z.object({
  unitId: z.string().uuid(),
  category: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
});
export async function GET(req: Request) {
  const auth = await requireAuthAndSociety("ticket:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const category = url.searchParams.get("category");
    const unitId = url.searchParams.get("unitId");
    const assigneeId = url.searchParams.get("assigneeId");
    const roles = await getUserRoles(sess.userId, societyId);
    const isStaff = roles.some((r: string) => ["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));

    const filterConditions: any[] = [];
    if (status) filterConditions.push(eq(helpdeskTickets.status, status as any));
    if (priority) filterConditions.push(eq(helpdeskTickets.priority, priority as any));
    if (category) filterConditions.push(eq(helpdeskTickets.category, category));
    if (unitId) filterConditions.push(eq(helpdeskTickets.unitId, unitId));
    if (assigneeId) filterConditions.push(eq(helpdeskTickets.assigneeId, assigneeId));

    const items = await withTenant(societyId, sess.userId, async (tx) => {
      if (!isStaff) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        const unitIds = members.map(m => m.unitId);
        const scopeCondition = unitIds.length > 0
          ? or(eq(helpdeskTickets.raisedBy, sess.userId), inArray(helpdeskTickets.unitId, unitIds))
          : eq(helpdeskTickets.raisedBy, sess.userId);

        return await tx
          .select()
          .from(helpdeskTickets)
          .where(and(eq(helpdeskTickets.societyId, societyId), scopeCondition, ...filterConditions))
          .orderBy(desc(helpdeskTickets.createdAt))
          .limit(50);
      }

      return await tx
        .select()
        .from(helpdeskTickets)
        .where(and(eq(helpdeskTickets.societyId, societyId), ...filterConditions))
        .orderBy(desc(helpdeskTickets.createdAt))
        .limit(50);
    });
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("ticket:create");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const { societyId, sess } = auth as any;
    const item = await withTenant(societyId, sess.userId, async (tx) => {
      const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.unitId, parsed.data.unitId), eq(unitMembers.societyId, societyId)));
      if (members.length === 0) {
        const [unit] = await tx.select().from(units).where(and(eq(units.id, parsed.data.unitId), eq(units.societyId, societyId)));
        if (!unit) throw new Error("Unit not in society");
        const isStaff = (await getUserRoles(sess.userId, societyId)).some((r:string)=>["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
        if (!isStaff) throw new Error("Unit not authorized");
      }
      const [created] = await tx.insert(helpdeskTickets).values({
        societyId,
        unitId: parsed.data.unitId,
        raisedBy: sess.userId,
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority: parsed.data.priority || "MEDIUM",
        status: "OPEN",
      }).returning();
      const staffRoles = await tx.select().from(units).where(eq(units.societyId, societyId)).limit(1);
      await tx.insert(notifications).values({
        societyId,
        userId: sess.userId,
        title: `Ticket created: ${parsed.data.title.slice(0,40)}`,
        body: `Category ${parsed.data.category} • Priority ${parsed.data.priority || "MEDIUM"}`,
        channel: "IN_APP",
        relatedEntity: "ticket",
        relatedId: created.id,
      });
      return created;
    });
    await audit({ actorId: sess.userId, societyId, action: "create", entity: "ticket", entityId: item.id, newState: item });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    if (e.message === "Unit not in society" || e.message === "Unit not authorized") return NextResponse.json({ error: e.message }, { status: 403 });
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
