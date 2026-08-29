import { NextResponse } from "next/server";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { withTenant } from "@/lib/db/withTenant";
import { units, unitMembers, visitorEntries, deliveries, dailyHelpAttendance, vehicles, bookings, bills, payments, emergencyAlerts, helpdeskTickets, announcements, events, polls } from "@/lib/db/schema";
import { eq, and, count, sql, gte, isNull } from "drizzle-orm";
import { amountToPaise } from "@/lib/payments/provider";
export async function GET() {
  const auth = await requireAuthAndSociety("admin:overview");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const data = await withTenant(societyId, sess.userId, async (tx) => {
      const today = new Date(); today.setHours(0,0,0,0);
      const [uCount] = await tx.select({ c: count() }).from(units).where(eq(units.societyId, societyId));
      const [rCount] = await tx.select({ c: count() }).from(unitMembers).where(eq(unitMembers.societyId, societyId));
      const [vToday] = await tx.select({ c: count() }).from(visitorEntries).where(and(eq(visitorEntries.societyId, societyId), gte(visitorEntries.createdAt, today)));
      const [vInside] = await tx.select({ c: count() }).from(visitorEntries).where(and(eq(visitorEntries.societyId, societyId), isNull(visitorEntries.checkOut)));
      const [dPending] = await tx.select({ c: count() }).from(deliveries).where(and(eq(deliveries.societyId, societyId), eq(deliveries.status, "AT_GATE")));
      const [hInside] = await tx.select({ c: count() }).from(dailyHelpAttendance).where(and(eq(dailyHelpAttendance.societyId, societyId), isNull(dailyHelpAttendance.checkOut)));
      const [vehCount] = await tx.select({ c: count() }).from(vehicles).where(eq(vehicles.societyId, societyId));
      const [bActive] = await tx.select({ c: count() }).from(bookings).where(and(eq(bookings.societyId, societyId), eq(bookings.status, "CONFIRMED")));
      const [annCount] = await tx.select({ c: count() }).from(announcements).where(eq(announcements.societyId, societyId));
      const [evCount] = await tx.select({ c: count() }).from(events).where(eq(events.societyId, societyId));
      const [pollCount] = await tx.select({ c: count() }).from(polls).where(eq(polls.societyId, societyId));
      const [emOpen] = await tx.select({ c: count() }).from(emergencyAlerts).where(and(eq(emergencyAlerts.societyId, societyId), eq(emergencyAlerts.status, "OPEN")));
      const billsRows = await tx.select({ total: bills.total, status: bills.status }).from(bills).where(eq(bills.societyId, societyId));
      const paymentsRows = await tx.select({ amount: payments.amount, status: payments.status }).from(payments).where(eq(payments.societyId, societyId));
      let totalBilled = 0, outstanding = 0, collected = 0, overdue = 0;
      for (const b of billsRows) { try { totalBilled += amountToPaise(b.total); if (b.status !== "PAID") overdue += 1; } catch {} }
      let successPaise = 0;
      for (const p of paymentsRows) if (p.status === "SUCCESS") try { successPaise += amountToPaise(p.amount); } catch {}
      collected = successPaise;
      outstanding = Math.max(0, totalBilled - collected);
      const [ticketOpen] = await tx.select({ c: count() }).from(helpdeskTickets).where(and(eq(helpdeskTickets.societyId, societyId), eq(helpdeskTickets.status, "OPEN"))).catch(()=>[{c:0}] as any);
      return {
        totalUnits: uCount.c,
        residents: rCount.c,
        visitorsToday: vToday.c,
        visitorsInside: vInside.c,
        pendingDeliveries: dPending.c,
        helpInside: hInside.c,
        vehicles: vehCount.c,
        activeBookings: bActive.c,
        announcements: annCount.c,
        events: evCount.c,
        polls: pollCount.c,
        emergenciesOpen: emOpen.c,
        ticketsOpen: (ticketOpen as any)?.c || 0,
        finance: { totalBilledPaise: totalBilled, collectedPaise: collected, outstandingPaise: outstanding, overdueCount: overdue, billCount: billsRows.length },
      };
    });
    return NextResponse.json(data);
  } catch (e: any) { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
