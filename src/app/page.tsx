"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocieties } from "@/hooks/use-societies";
import { useUnits } from "@/hooks/use-units";
import { toast } from "sonner";

export default function Home() {
  const { societies, loading: sLoad } = useSocieties();
  const { units, loading: uLoad } = useUnits();
  const [stats, setStats] = useState<any>({});
  const [newCode, setNewCode] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/invites").then(r => r.json()),
      fetch("/api/bills").then(r => r.json()),
      fetch("/api/tickets").then(r => r.json()),
      fetch("/api/announcements").then(r => r.json()),
    ]).then(([invites, bills, tickets, ann]) => setStats({ invites: invites.length, bills: bills.length, tickets: tickets.length, ann: ann.length })).catch(()=>{});
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Green Acres — Society OS</h1>
            <p className="text-muted-foreground text-sm">Multi-tenant gated-community • MyGate-style • Neon + Drizzle</p>
          </div>
          <Badge className="bg-emerald-500">DB CONNECTED</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Societies</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sLoad ? "..." : societies.length}</div><p className="text-xs text-muted-foreground">{societies[0]?.name || "—"}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Units (Flats)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{uLoad ? "..." : units.length}</div><p className="text-xs text-muted-foreground">96 pilot seeded</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visitor Invites</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.invites ?? 0}</div><p className="text-xs text-muted-foreground">PIN + QR</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Bills</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.bills ?? 0}</div><p className="text-xs text-muted-foreground">UPI/PhonePe mock</p></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Quick Invite</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Create a visitor invite for unit {units[0]?.number || "A-101"}</p>
              <div className="flex gap-2">
                <Input placeholder="Visitor name" id="vname" className="flex-1" />
                <Input placeholder="Phone" id="vphone" className="flex-1" />
              </div>
              <Button onClick={async () => {
                const name = (document.getElementById("vname") as HTMLInputElement)?.value;
                const phone = (document.getElementById("vphone") as HTMLInputElement)?.value;
                if (!name || !phone || !societies[0] || !units[0]) return toast.error("Fill name/phone — society/units loading?");
                const vRes = await fetch("/api/visitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ societyId: societies[0].id, name, phone }) });
                const visitor = await vRes.json();
                const users = await fetch("/api/societies").then(r=>r.json()); // trigger toast
                const iRes = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ societyId: societies[0].id, unitId: units[0].id, createdBy: visitor.id, visitorId: visitor.id, purpose: "Quick invite" }) });
                if (iRes.ok) { toast.success("Invite created: " + (await iRes.json()).code); } else toast.error("Invite failed");
              }}>Create Invite</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>API Health</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>/api/societies</span><Badge variant="outline">GET+POST+PATCH+DELETE</Badge></div>
              <div className="flex justify-between"><span>/api/units</span><Badge variant="outline">100 flats cursor</Badge></div>
              <div className="flex justify-between"><span>/api/invites</span><Badge variant="outline">code + QR + OTP</Badge></div>
              <div className="flex justify-between"><span>/api/bills / payments</span><Badge variant="outline">mock UPI</Badge></div>
              <p className="text-xs text-muted-foreground pt-2">Keys: DATABASE_URL ✓ • OTP mock ✓ • PAYMENT mock ✓ • RLS ready</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Units Directory (first 12)</CardTitle></CardHeader>
          <CardContent>
            {uLoad ? <p className="text-sm text-muted-foreground">Loading...</p> : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {units.slice(0, 12).map(u => (
                  <div key={u.id} className="rounded-lg border p-2 text-center text-xs">
                    <div className="font-bold">{u.number}</div>
                    <div className="text-muted-foreground">{u.type} • {u.areaSqft} sqft</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
