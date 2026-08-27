import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { helpdeskTickets } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { verifyUnitBelongsToSociety } from "@/lib/tenant";
import { audit } from "@/lib/audit";
export async function GET() { const auth = await requireAuthAndSociety("ticket:read"); if ("error" in auth) return auth.error; try { const { societyId } = auth as any; const items = await db.select().from(helpdeskTickets).where(eq(helpdeskTickets.societyId, societyId)).orderBy(desc(helpdeskTickets.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
const s = z.object({ unitId: z.string().uuid(), category: z.string().min(1).max(50), title: z.string().min(1).max(200), description: z.string().optional(), priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional() });
export async function POST(req: Request) { const auth = await requireAuthAndSociety("ticket:read"); if ("error" in auth) return auth.error; try { const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 }); const { societyId, sess } = auth as any; await verifyUnitBelongsToSociety(parsed.data.unitId, societyId); const [item] = await db.insert(helpdeskTickets).values({ ...parsed.data, societyId, raisedBy: sess.userId }).returning(); await audit({ actorId: sess.userId, societyId, action: "create", entity: "ticket", entityId: item.id, newState: item }); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
