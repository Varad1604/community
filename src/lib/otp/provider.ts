export interface OtpProvider {
  request(phone: string, code: string): Promise<void>;
  verify?(phone: string, code: string): Promise<boolean>;
}

export const mockProvider: OtpProvider = {
  async request(phone, code) {
    if (process.env.NODE_ENV === "production" && process.env.MOCK_OTP_ENABLED === "true") {
      throw new Error("Mock OTP forbidden in production");
    }
    console.log(`[MOCK OTP] ${phone} => ${code}`);
  },
};

export const msg91Provider: OtpProvider = {
  async request(phone, code) {
    const key = process.env.MSG91_AUTH_KEY;
    if (!key) throw new Error("MSG91_AUTH_KEY missing");
    await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: key },
      body: JSON.stringify({ mobile: phone, otp: code }),
    });
  },
};

export function getOtpProvider(): OtpProvider {
  const p = process.env.OTP_PROVIDER || "mock";
  if (p === "msg91") return msg91Provider;
  if (p === "twilio") return mockProvider;
  return mockProvider;
}
