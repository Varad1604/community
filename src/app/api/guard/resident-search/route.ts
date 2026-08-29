import { NextResponse } from "next/server";
import { units, users, unitMembers } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { withTenant } from "@/lib/db/withTenant";
import { maskPhone } from "@/lib/privacy";

export async function GET(req: Request) {
  const auth = await requireAuthAndSociety("visitor:entry");
  if ("error" in auth) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json([]);
    const { societyId, sess } = auth as any;
    const items = await withTenant(societyId, sess.userId, async (tx) => {
      const us = await tx.select().from(units).where(and(eq(units.societyId, societyId), ilike(units.number, `%${q}%`))).limit(10);
      const byName = await tx.select().from(users).where(ilike(users.fullName, `%${q}%`)).limit(10);
      const members = byName.length ? await tx.select().from(unitMembers).where(eq(unitMembers.societyId, societyId)).then(rows=> rows.filter(r=> byName.some(u=>u.id===r.userId))) : [];
      const unitIds = new Set([...us.map(u=>u.id), ...members.map(m=>m.unitId)]);
      const allUnits = unitIds.size ? await tx.select().from(units).where(and(eq(units.societyId, societyId), sql`${units.id} IN ${Array.from(unitIds)}`)).catch(()=> us) : us;
      const enriched = await Promise.all(allUnits.slice(0,10).map(async u=>{
        const mems = await tx.select().from(unitMembers).where(eq(unitMembers.unitId, u.id));
        const residents = await Promise.all(mems.map(async m=>{
          const [user] = await tx.select().from(users).where(eq(users.id, m.userId));
          return { ...m, user: user ? { id: user.id, fullName: user.fullName, phone: maskPhone(user.phone) } : null };
        }));
        return { unit: u, residents };
      }));
      return enriched;
    });
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
