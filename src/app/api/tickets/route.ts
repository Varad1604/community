import { NextResponse } from "next/server";
import { helpdeskTickets, units } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
export async function GET() { const auth = await requireAuthAndSociety("ticket:read"); if ("error" in auth) return auth.error; try { const { societyId, sess } = auth as any; const items = await withTenant(societyId, sess.userId, async (tx)=> tx.select().from(helpdeskTickets).where(eq(helpdeskTickets.societyId, societyId)).orderBy(desc(helpdeskTickets.createdAt)).limit(50)); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
const s = z.object({ unitId: z.string().uuid(), category: z.string().min(1).max(50), title: z.string().min(1).max(200), description: z.string().optional(), priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional() });
export async function POST(req: Request) { const auth = await requireAuthAndSociety("ticket:read"); if ("error" in auth) return auth.error; try { const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 }); const { societyId, sess } = auth as any; const item = await withTenant(societyId, sess.userId, async (tx)=> {
  const [unit] = await tx.select().from(units).where(and(eq(units.id, parsed.data.unitId), eq(units.societyId, societyId))); if (!unit) throw new Error("Unit not in society");
  const [created] = await tx.insert(helpdeskTickets).values({ ...parsed.data, societyId, raisedBy: sess.userId }).returning(); return created;
}); await audit({ actorId: sess.userId, societyId, action: "create", entity: "ticket", entityId: item.id, newState: item }); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
