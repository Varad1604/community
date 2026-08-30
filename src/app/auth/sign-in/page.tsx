"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Phone, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    if (!phone) return toast.error("Enter phone number");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("OTP sent");
      setStep("otp");
    } catch (e: any) { toast.error(e.message || "Failed to send OTP"); } finally { setLoading(false); }
  }
  async function verifyOtp() {
    if (otp.length !== 6) return toast.error("Enter 6-digit OTP");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code: otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Welcome ${data.user.fullName}!`);
      router.push("/");
      router.refresh();
    } catch (e: any) { toast.error(e.message || "Invalid OTP"); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center"><Phone className="h-6 w-6" /></div>
          <CardTitle className="text-2xl mt-2">MyGate-style Sign In</CardTitle>
          <CardDescription>Phone OTP • 5 min expiry • 60s cooldown • 3/hr limit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" ? (
            <>
              <Input placeholder="+91 99999 99999" value={phone} onChange={e => setPhone(e.target.value)} />
              
              <Button onClick={requestOtp} disabled={loading} className="w-full">{loading ? "Sending..." : "Send OTP"}</Button>
            </>
          ) : (
            <>
              <p className="text-sm">OTP sent to <b>{phone}</b> <button onClick={() => setStep("phone")} className="text-primary underline text-xs ml-2">Change</button></p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full">{loading ? "Verifying..." : "Verify & Sign In"}</Button>
              <Button variant="ghost" className="w-full" onClick={requestOtp} disabled={loading}>Resend (60s cooldown)</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
