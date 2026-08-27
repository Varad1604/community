import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { verifyUnitBelongsToSociety } from "@/lib/tenant";
import { audit } from "@/lib/audit";
export async function GET() { const auth = await requireAuthAndSociety("bill:read"); if ("error" in auth) return auth.error; try { const { societyId } = auth as any; const items = await db.select().from(bills).where(eq(bills.societyId, societyId)).orderBy(desc(bills.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
const s = z.object({ unitId: z.string().uuid(), title: z.string().min(1).max(100), periodStart: z.string(), periodEnd: z.string(), dueDate: z.string(), subtotal: z.string(), tax: z.string().optional(), total: z.string() });
export async function POST(req: Request) { const auth = await requireAuthAndSociety("bill:manage"); if ("error" in auth) return auth.error; try { const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 }); const { societyId, sess } = auth as any; await verifyUnitBelongsToSociety(parsed.data.unitId, societyId); const [item] = await db.insert(bills).values({ ...parsed.data, societyId }).returning(); await audit({ actorId: sess.userId, societyId, action: "create", entity: "bill", entityId: item.id, newState: item }); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
