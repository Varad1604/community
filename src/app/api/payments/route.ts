import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { verifyUnitBelongsToSociety } from "@/lib/tenant";
import { audit } from "@/lib/audit";
export async function GET() { const auth = await requireAuthAndSociety("payment:read"); if ("error" in auth) return auth.error; try { const { societyId } = auth as any; const items = await db.select().from(payments).where(eq(payments.societyId, societyId)).orderBy(desc(payments.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
const s = z.object({ unitId: z.string().uuid(), billId: z.string().uuid().optional(), amount: z.string(), method: z.enum(["UPI","CARD","NETBANKING","CASH","PHONEPE","RAZORPAY"]).optional(), gateway: z.string().optional() });
export async function POST(req: Request) { const auth = await requireAuthAndSociety("payment:create"); if ("error" in auth) return auth.error; try { const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 }); const { societyId, sess } = auth as any; await verifyUnitBelongsToSociety(parsed.data.unitId, societyId); const gatewayRef = `mock_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; const [item] = await db.insert(payments).values({ unitId: parsed.data.unitId, billId: parsed.data.billId, amount: parsed.data.amount, method: parsed.data.method || "UPI", gateway: parsed.data.gateway || "mock", gatewayRef, status: "PENDING", societyId, payerId: sess.userId }).returning(); await audit({ actorId: sess.userId, societyId, action: "create", entity: "payment", entityId: item.id, newState: item }); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
