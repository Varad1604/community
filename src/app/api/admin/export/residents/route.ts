import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { unitMembers, users, units, buildings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toCsv, csvResponse } from "@/lib/csv";
export async function GET() {
  const auth = await requireAuthAndSociety("resident:read");
  if ("error" in auth) return auth.error as any;
  try {
    const { societyId, sess } = auth as any;
    const csv = await withTenant(societyId, sess.userId, async (tx) => {
      const members = await tx.select().from(unitMembers).where(eq(unitMembers.societyId, societyId)).limit(500);
      const rows: any[][] = [];
      for (const m of members) {
        const [u] = await tx.select().from(users).where(eq(users.id, m.userId));
        const [unit] = await tx.select().from(units).where(eq(units.id, m.unitId));
        const [b] = unit ? await tx.select().from(buildings).where(eq(buildings.id, unit.buildingId)) : [null];
        rows.push([u?.fullName || "", u?.phone || "", unit?.number || "", b?.name || "", m.relation, m.isPrimary ? "Primary" : "Secondary"]);
      }
      return toCsv(["Name", "Phone", "Unit", "Building", "Relation", "Primary"], rows);
    });
    return csvResponse(csv, `residents-${societyId}.csv`);
  } catch { return new Response("Failed", { status: 500 }); }
}
