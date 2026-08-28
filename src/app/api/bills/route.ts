import { NextResponse } from "next/server";
import { bills, units, unitMembers, payments, notifications } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";

function isDecimal(s: string){ return /^\d+(\.\d{1,2})?$/.test(s) && parseFloat(s) >= 0; }

export async function GET() {
  const auth = await requireAuthAndSociety("bill:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
    const isPrivileged = roles.some((r:string)=>["SOCIETY_ADMIN","ACCOUNTANT","SUPER_ADMIN"].includes(r));
    const items = await withTenant(societyId, sess.userId, async (tx)=>{
      if (isPrivileged) {
        const rows = await tx.select().from(bills).where(eq(bills.societyId, societyId)).orderBy(desc(bills.createdAt)).limit(50);
        return rows;
      } else {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        const unitIds = members.map(m=>m.unitId);
        if (unitIds.length===0) return [];
        return tx.select().from(bills).where(and(eq(bills.societyId, societyId), inArray(bills.unitId, unitIds))).orderBy(desc(bills.createdAt)).limit(50);
      }
    });
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error:"Failed" }, { status:500 }); }
}

const createSchema = z.object({
  unitId: z.string().uuid(),
  title: z.string().min(1).max(100),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subtotal: z.string().refine(isDecimal, "Invalid subtotal"),
  tax: z.string().refine(isDecimal, "Invalid tax").optional(),
  total: z.string().refine(isDecimal, "Invalid total"),
  status: z.enum(["DRAFT","ISSUED","OVERDUE","PAID","PARTIAL"]).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("bill:manage");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error:"Invalid input", details: parsed.error.flatten() }, { status:400 });
    if (new Date(parsed.data.dueDate) <= new Date(parsed.data.periodEnd)) return NextResponse.json({ error:"dueDate must be after periodEnd" }, { status:400 });
    if (new Date(parsed.data.periodStart) > new Date(parsed.data.periodEnd)) return NextResponse.json({ error:"periodStart must be before periodEnd" }, { status:400 });
    const totalNum = parseFloat(parsed.data.total);
    const subNum = parseFloat(parsed.data.subtotal);
    const taxNum = parseFloat(parsed.data.tax || "0");
    if (Math.abs(totalNum - (subNum + taxNum)) > 0.01) return NextResponse.json({ error:"total must equal subtotal + tax" }, { status:400 });

    const { societyId, sess } = auth as any;
    const item = await withTenant(societyId, sess.userId, async (tx)=>{
      const [unit] = await tx.select().from(units).where(and(eq(units.id, parsed.data.unitId), eq(units.societyId, societyId)));
      if (!unit) throw new Error("Unit not in society");
      const [created] = await tx.insert(bills).values({
        societyId, unitId: unit.id, title: parsed.data.title, periodStart: parsed.data.periodStart as any, periodEnd: parsed.data.periodEnd as any, dueDate: parsed.data.dueDate as any,
        subtotal: parsed.data.subtotal, tax: parsed.data.tax || "0", total: parsed.data.total, status: parsed.data.status || "ISSUED",
      }).returning();
      const members = await tx.select().from(unitMembers).where(eq(unitMembers.unitId, unit.id));
      for (const m of members) {
        await tx.insert(notifications).values({
          societyId, userId: m.userId, title: `New bill: ${parsed.data.title}`, body: `₹${parsed.data.total} due ${parsed.data.dueDate} for ${unit.number}`, channel:"IN_APP", relatedEntity:"bill", relatedId: created.id,
        });
      }
      return created;
    });
    await audit({ actorId: sess.userId, societyId, action:"create", entity:"bill", entityId: item.id, newState: item });
    return NextResponse.json(item, { status:201 });
  } catch (e:any) { return NextResponse.json({ error: e.message || "Failed" }, { status:500 }); }
}
