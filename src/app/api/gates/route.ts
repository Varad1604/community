import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gates } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/audit";
export async function GET() { const auth = await requireAuthAndSociety("gate:read"); if ("error" in auth) return auth.error; try { const { societyId } = auth as any; const items = await db.select().from(gates).where(eq(gates.societyId, societyId)); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
const s = z.object({ name: z.string().min(1).max(100), type: z.string().optional() });
export async function POST(req: Request) { const auth = await requireAuthAndSociety("gate:manage"); if ("error" in auth) return auth.error; try { const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 }); const { societyId, sess } = auth as any; const [item] = await db.insert(gates).values({ name: parsed.data.name, type: parsed.data.type || "MAIN", societyId }).returning(); await audit({ actorId: sess.userId, societyId, action: "create", entity: "gate", entityId: item.id, newState: item }); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
