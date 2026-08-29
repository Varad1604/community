import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { bills, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toCsv, csvResponse } from "@/lib/csv";
import { amountToPaise } from "@/lib/payments/provider";
export async function GET() {
  const auth = await requireAuthAndSociety("report:finance");
  if ("error" in auth) return auth.error as any;
  try {
    const { societyId, sess } = auth as any;
    const csv = await withTenant(societyId, sess.userId, async (tx) => {
      const bs = await tx.select().from(bills).where(eq(bills.societyId, societyId)).limit(500);
      const rows = bs.map(b => [b.title, b.unitId.slice(0,8), b.periodStart, b.periodEnd, b.dueDate, b.total, b.status]);
      const h = ["Title", "Unit", "PeriodStart", "PeriodEnd", "DueDate", "Total", "Status"];
      let total = 0; for (const b of bs) try { total += amountToPaise(b.total); } catch {}
      const footer: any[][] = [["", "", "", "", "TotalBilled", (total/100).toFixed(2), ""]];
      return toCsv(h, [...rows, ...footer]);
    });
    return csvResponse(csv, `finance-${societyId}.csv`);
  } catch { return new Response("Failed", { status: 500 }); }
}
