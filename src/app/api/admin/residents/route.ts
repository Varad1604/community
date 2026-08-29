import { NextResponse } from "next/server";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { unitMembers, users, units, buildings, floors } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
export async function GET(req: Request) {
  const auth = await requireAuthAndSociety("resident:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50"));
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const q = url.searchParams.get("q") || "";
    const data = await withTenant(societyId, sess.userId, async (tx) => {
      const rows = await tx.select().from(unitMembers).where(eq(unitMembers.societyId, societyId)).orderBy(desc(unitMembers.createdAt)).limit(limit).offset(offset);
      const enriched = await Promise.all(rows.map(async (m) => {
        const [u] = await tx.select().from(users).where(eq(users.id, m.userId));
        const [unit] = await tx.select().from(units).where(eq(units.id, m.unitId));
        if (!u || !unit) return null;
        if (q && !(`${u.fullName} ${u.phone} ${unit.number}`.toLowerCase().includes(q.toLowerCase()))) return null;
        const [b] = await tx.select().from(buildings).where(eq(buildings.id, unit.buildingId));
        const [f] = await tx.select().from(floors).where(eq(floors.id, unit.floorId));
        return { member: m, user: { id: u.id, fullName: u.fullName, phone: u.phone }, unit: { id: unit.id, number: unit.number, type: unit.type }, building: b ? { id: b.id, name: b.name } : null, floor: f ? { id: f.id, number: f.number } : null };
      }));
      return enriched.filter(Boolean);
    });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
