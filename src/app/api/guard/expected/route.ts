import { NextResponse } from "next/server";
import { visitorInvites, visitors, units } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { withTenant } from "@/lib/db/withTenant";

export async function GET() {
  const auth = await requireAuthAndSociety("visitor:entry");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const now = new Date();
    const items = await withTenant(societyId, sess.userId, async (tx) => {
      const invites = await tx.select().from(visitorInvites).where(and(eq(visitorInvites.societyId, societyId), eq(visitorInvites.status, "PENDING"))).orderBy(desc(visitorInvites.validFrom)).limit(50);
      const filtered = invites.filter(iv => new Date(iv.validTo) >= now);
      const enriched = await Promise.all(filtered.slice(0, 20).map(async iv => {
        const [v] = await tx.select().from(visitors).where(eq(visitors.id, iv.visitorId));
        const [u] = await tx.select().from(units).where(eq(units.id, iv.unitId));
        return { invite: iv, visitor: v, unit: u };
      }));
      return enriched;
    });
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
