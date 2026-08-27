import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { verifyUnitBelongsToSociety } from "@/lib/tenant";
import { audit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAuthAndSociety("unit:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId } = auth as any;
    const items = await db.select().from(units).where(eq(units.societyId, societyId)).orderBy(desc(units.createdAt)).limit(100);
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
const createSchema = z.object({ buildingId: z.string().uuid(), floorId: z.string().uuid(), number: z.string().min(1).max(20), type: z.enum(["FLAT","SHOP","VILLA","PLOT"]).optional(), areaSqft: z.number().optional() });
export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("unit:manage");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { societyId, sess } = auth as any;
    const [item] = await db.insert(units).values({ ...parsed.data, societyId }).returning();
    await audit({ actorId: sess.userId, societyId, action: "create", entity: "unit", entityId: item.id, newState: item });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Failed" }, { status: 500 }); }
}
