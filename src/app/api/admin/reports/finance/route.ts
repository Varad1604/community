import { NextResponse } from "next/server";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { bills, payments } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { amountToPaise } from "@/lib/payments/provider";
export async function GET() {
  const auth = await requireAuthAndSociety("report:finance");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const data = await withTenant(societyId, sess.userId, async (tx) => {
      const billRows = await tx.select().from(bills).where(eq(bills.societyId, societyId)).limit(500);
      const paymentRows = await tx.select().from(payments).where(eq(payments.societyId, societyId)).limit(500);
      const byStatus: Record<string, { count: number; paise: number }> = {};
      let totalBilled = 0;
      for (const b of billRows) {
        const p = (() => { try { return amountToPaise(b.total); } catch { return 0; } })();
        totalBilled += p;
        if (!byStatus[b.status]) byStatus[b.status] = { count: 0, paise: 0 };
        byStatus[b.status].count += 1;
        byStatus[b.status].paise += p;
      }
      const payByStatus: Record<string, number> = {};
      let collected = 0;
      let failed = 0;
      for (const p of paymentRows) {
        payByStatus[p.status] = (payByStatus[p.status] || 0) + 1;
        if (p.status === "SUCCESS") try { collected += amountToPaise(p.amount); } catch {}
        if (p.status === "FAILED") failed += 1;
      }
      const outstanding = Math.max(0, totalBilled - collected);
      const overdueBills = billRows.filter(b => b.status !== "PAID" && new Date(b.dueDate) < new Date()).length;
      const recent = [...paymentRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map(p => ({ id: p.id, amount: p.amount, status: p.status, createdAt: p.createdAt }));
      return { totalBilledPaise: totalBilled, collectedPaise: collected, outstandingPaise: outstanding, overdueCount: overdueBills, billCount: billRows.length, billByStatus: byStatus, paymentByStatus: payByStatus, failedCount: failed, recentPayments: recent };
    });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
