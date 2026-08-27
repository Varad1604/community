import { NextResponse } from "next/server";
import { visitors } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
export async function GET() {
  const auth = await requireAuthAndSociety("visitor:read");
  if ("error" in auth) return auth.error;
  try { const { societyId, sess } = auth as any; const items = await withTenant(societyId, sess.userId, async (tx)=> tx.select().from(visitors).where(eq(visitors.societyId, societyId)).orderBy(desc(visitors.createdAt)).limit(50)); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
const s = z.object({ name: z.string().min(1).max(100), phone: z.string().min(10).max(20), photoUrl: z.string().optional(), govIdType: z.string().optional() });
export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("visitor:create");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json(); const parsed = s.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { societyId, sess } = auth as any;
    const item = await withTenant(societyId, sess.userId, async (tx)=> {
      const [created] = await tx.insert(visitors).values({ ...parsed.data, societyId }).returning(); return created;
    });
    await audit({ actorId: sess.userId, societyId, action: "create", entity: "visitor", entityId: item.id, newState: item });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
