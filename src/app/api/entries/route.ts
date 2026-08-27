import { NextResponse } from "next/server";
import { visitorEntries } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, desc } from "drizzle-orm";
import { withTenant } from "@/lib/db/withTenant";
export async function GET() {
  const auth = await requireAuthAndSociety("visitor:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const items = await withTenant(societyId, sess.userId, async (tx) =>
      tx.select().from(visitorEntries).where(eq(visitorEntries.societyId, societyId)).orderBy(desc(visitorEntries.createdAt)).limit(50)
    );
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
