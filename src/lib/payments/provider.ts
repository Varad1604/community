import { createHmac } from "crypto";

export type CreateOrderParams = {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type PaymentProvider = {
  createOrder(params: CreateOrderParams): Promise<{ id: string; amount: number; currency: string; receipt: string }>;
  verifySignature(params: { orderId: string; paymentId: string; signature: string }): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
};

function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function amountToPaise(amountStr: string): number {
  const s = amountStr.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error("Invalid amount");
  const [intPart, decPart = ""] = s.split(".");
  const paiseStr = intPart + decPart.padEnd(2, "0").slice(0, 2);
  const paise = parseInt(paiseStr, 10);
  if (isNaN(paise) || paise <= 0) throw new Error("Invalid amount");
  return paise;
}

export function getPaymentProvider(): PaymentProvider {
  const gateway = getEnv("PAYMENT_GATEWAY") || "mock";
  if (gateway === "razorpay") return razorpayProvider;
  if (gateway === "mock") return mockProvider;
  return mockProvider;
}

const mockProvider: PaymentProvider = {
  async createOrder({ amountPaise, currency, receipt }) {
    if (process.env.NODE_ENV === "production" && process.env.PAYMENT_GATEWAY === "mock") {
      throw new Error("Mock gateway not allowed in production");
    }
    const id = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { id, amount: amountPaise, currency, receipt };
  },
  verifySignature({ orderId, paymentId, signature }) {
    if (process.env.NODE_ENV === "production" && process.env.PAYMENT_GATEWAY === "mock") return false;
    const secret = getEnv("RAZORPAY_KEY_SECRET") || "mock_secret";
    const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    return expected === signature;
  },
  verifyWebhookSignature(rawBody, signature) {
    const secret = getEnv("RAZORPAY_WEBHOOK_SECRET") || "mock_webhook_secret";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  },
};

const razorpayProvider: PaymentProvider = {
  async createOrder({ amountPaise, currency, receipt, notes }) {
    const keyId = getEnv("RAZORPAY_KEY_ID");
    const keySecret = getEnv("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new Error("Razorpay not configured: missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency,
        receipt,
        notes: notes || {},
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay order failed: ${err}`);
    }
    const data = await res.json();
    return { id: data.id, amount: data.amount, currency: data.currency, receipt: data.receipt };
  },
  verifySignature({ orderId, paymentId, signature }) {
    const secret = getEnv("RAZORPAY_KEY_SECRET");
    if (!secret) throw new Error("Missing RAZORPAY_KEY_SECRET");
    const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    return expected === signature;
  },
  verifyWebhookSignature(rawBody, signature) {
    const secret = getEnv("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  },
};
