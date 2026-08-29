import { NextResponse } from "next/server";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { units, buildings, floors, unitMembers, vehicles } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
export async function GET(req: Request) {
  const auth = await requireAuthAndSociety("unit:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50"));
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const buildingId = url.searchParams.get("buildingId");
    const data = await withTenant(societyId, sess.userId, async (tx) => {
      const where = buildingId ? eq(units.buildingId, buildingId) : eq(units.societyId, societyId);
      const rows = await tx.select().from(units).where(buildingId ? where : eq(units.societyId, societyId)).orderBy(desc(units.createdAt)).limit(limit).offset(offset);
      const enriched = await Promise.all(rows.map(async (u) => {
        const [b] = await tx.select().from(buildings).where(eq(buildings.id, u.buildingId));
        const [f] = await tx.select().from(floors).where(eq(floors.id, u.floorId));
        const members = await tx.select().from(unitMembers).where(eq(unitMembers.unitId, u.id));
        const vehs = await tx.select().from(vehicles).where(eq(vehicles.unitId, u.id));
        return { unit: u, building: b || null, floor: f || null, memberCount: members.length, vehicleCount: vehs.length };
      }));
      return enriched;
    });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
