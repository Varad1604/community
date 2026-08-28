import { NextResponse } from "next/server";
import { payments, bills, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
import { getPaymentProvider, amountToPaise } from "@/lib/payments/provider";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || req.headers.get("X-Razorpay-Signature") || "";

  const provider = getPaymentProvider();
  try {
    const isValid = provider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Webhook verification failed" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event || payload.entity;
  const paymentEntity = payload.payload?.payment?.entity || payload.payment;
  const orderId = payload.payload?.payment?.entity ? payload.payload.payment.entity.order_id || payload.payload.order?.entity?.id || payload.payload.payment.entity.id : payload.razorpay_order_id || payload.order_id;
  // More robust extraction
  let razorpayOrderId: string | null = null;
  let razorpayPaymentId: string | null = null;
  let amount: number | null = null;
  let currency: string | null = null;

  if (payload.payload?.payment?.entity) {
    razorpayPaymentId = payload.payload.payment.entity.id;
    razorpayOrderId = payload.payload.payment.entity.order_id;
    amount = payload.payload.payment.entity.amount;
    currency = payload.payload.payment.entity.currency;
  } else if (payload.payload?.order?.entity) {
    razorpayOrderId = payload.payload.order.entity.id;
    amount = payload.payload.order.entity.amount;
    currency = payload.payload.order.entity.currency;
  } else {
    razorpayOrderId = payload.razorpay_order_id || payload.order_id || null;
    razorpayPaymentId = payload.razorpay_payment_id || payload.payment_id || null;
  }

  if (!razorpayOrderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const [payment] = await db.select().from(payments).where(eq(payments.gatewayRef, razorpayOrderId));
    if (!payment) {
      return NextResponse.json({ error: "Payment not found for order" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }
    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: `Invalid payment status ${payment.status}` }, { status: 400 });
    }

    const societyId = payment.societyId;

    const result = await withTenant(societyId, payment.payerId, async (tx) => {
      const [bill] = await tx.select().from(bills).where(and(eq(bills.id, payment.billId!), eq(bills.societyId, societyId)));
      if (!bill) throw new Error("Bill not found");

      if (amount !== null) {
        const expectedPaise = amountToPaise(payment.amount);
        if (amount !== expectedPaise) throw new Error("Amount mismatch");
      }

      const [updatedPayment] = await tx.update(payments).set({
        status: "SUCCESS",
        rawPayload: { ...(payment.rawPayload as any), webhookEvent: event, razorpay_payment_id: razorpayPaymentId, razorpay_order_id: razorpayOrderId, webhookVerifiedAt: new Date().toISOString() },
      }).where(eq(payments.id, payment.id)).returning();

      const allSuccess = await tx.select().from(payments).where(and(eq(payments.billId, bill.id), eq(payments.status, "SUCCESS")));
      const totalPaise = amountToPaise(bill.total);
      const paidPaise = allSuccess.reduce((sum, p) => sum + amountToPaise(p.amount), 0);
      let newBillStatus: string = bill.status;
      if (paidPaise >= totalPaise) newBillStatus = "PAID";
      else if (paidPaise > 0) newBillStatus = "PARTIAL";

      let updatedBill = bill;
      if (newBillStatus !== bill.status) {
        const [ub] = await tx.update(bills).set({ status: newBillStatus as any }).where(eq(bills.id, bill.id)).returning();
        updatedBill = ub;
      }

      await tx.insert(notifications).values({
        societyId,
        userId: payment.payerId,
        title: `Payment successful: ₹${payment.amount}`,
        body: `Bill ${bill.title} • Ref ${(payment.gatewayRef || "").slice(0,12)}`,
        channel: "IN_APP",
        relatedEntity: "payment",
        relatedId: payment.id,
      });

      return { payment: updatedPayment, bill: updatedBill };
    });

    await audit({ actorId: payment.payerId, societyId: payment.societyId, action: "payment:webhook_success", entity: "payment", entityId: payment.id, newState: { gatewayRef: razorpayOrderId, status: "SUCCESS" } });

    return NextResponse.json({ success: true, payment: (result as any).payment, bill: (result as any).bill });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
