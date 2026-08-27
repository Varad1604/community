"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Share2, Check, Calendar, User } from "lucide-react";

export default function InviteVisitorPage() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", purpose: "Guest", visitDate: new Date().toISOString().slice(0,10), validFrom: "", validTo: "", unitId: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(()=>{
    fetch("/api/units").then(r=>r.json()).then(d=>{ if(Array.isArray(d) && d.length){ setUnits(d); setForm(f=>({...f, unitId: d[0].id})); }}).catch(()=>{});
  }, []);

  async function submit(e: React.FormEvent){
    e.preventDefault();
    if (!form.name || !form.phone || !form.purpose) return toast.error("Fill required fields");
    if (!/^\+?\d{10,15}$/.test(form.phone.replace(/\s/g,""))) return toast.error("Invalid phone");
    setLoading(true);
    try {
      const validFrom = form.validFrom ? new Date(`${form.visitDate}T${form.validFrom}`).toISOString() : new Date(`${form.visitDate}T09:00`).toISOString();
      const validTo = form.validTo ? new Date(`${form.visitDate}T${form.validTo}`).toISOString() : new Date(`${form.visitDate}T21:00`).toISOString();
      const res = await fetch("/api/visitors/invite", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ name: form.name, phone: form.phone, purpose: form.purpose, validFrom, validTo, unitId: form.unitId || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      toast.success("Invitation created");
    } catch (e:any){ toast.error(e.message || "Failed to create invite"); }
    finally { setLoading(false); }
  }

  if (result) {
    const invite = result.invite; const visitor = result.visitor;
    return (
      <AppShell>
        <div className="max-w-lg mx-auto space-y-4">
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto"><Check className="h-6 w-6" /></div>
              <h2 className="mt-3 text-lg font-semibold">Invitation ready</h2>
              <p className="text-sm text-muted-foreground">Share this pass with {visitor.name}</p>
              <div className="mt-4 rounded-xl bg-white dark:bg-black border p-4 text-left">
                <div className="flex justify-between items-start">
                  <div><p className="text-sm font-semibold">{visitor.name}</p><p className="text-xs text-muted-foreground">{visitor.phone} • {invite.purpose}</p></div>
                  <span className="text-xs bg-muted px-2 py-1 rounded">PENDING</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-muted-foreground">Valid from</p><p className="font-medium">{new Date(invite.validFrom).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Valid until</p><p className="font-medium">{new Date(invite.validTo).toLocaleString()}</p></div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">Gate pass code</p>
                  <p className="text-2xl font-mono font-bold tracking-widest mt-1">{invite.code}</p>
                  <p className="text-xs text-muted-foreground mt-1">Show at gate • Valid for one entry</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={async()=>{
                  if(navigator.share){ try{ await navigator.share({ title:`Visitor Pass ${invite.code}`, text:`Pass ${invite.code} for ${visitor.name} on ${new Date(invite.validTo).toLocaleDateString()}`}); } catch{} } else { await navigator.clipboard.writeText(invite.code); toast.success("Code copied"); }
                }}><Share2 className="h-4 w-4 mr-2" />Share</Button>
                <Button variant="outline" className="flex-1" onClick={async()=>{ await navigator.clipboard.writeText(invite.code); toast.success("Copied"); }}><Copy className="h-4 w-4 mr-2" />Copy code</Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" className="flex-1" onClick={()=>router.push(`/visitors/${invite.id}`)}>View details</Button>
                <Button className="flex-1" onClick={()=>router.push("/visitors")}>Done</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <PageHeader title="Invite Visitor" description="Create a gate pass — guard will verify code at entry" />
        <form onSubmit={submit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Visitor details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Visitor name *</Label>
                  <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="e.g. Amit Kumar" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number *</Label>
                  <Input id="phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="98765 43210" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purpose *</Label>
                  <Select value={form.purpose} onValueChange={v=>setForm({...form, purpose:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guest">Guest</SelectItem>
                      <SelectItem value="Family">Family / Friend</SelectItem>
                      <SelectItem value="Service Provider">Service Provider</SelectItem>
                      <SelectItem value="Cab / Driver">Cab / Driver</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Host unit</Label>
                  <Select value={form.unitId} onValueChange={v=>setForm({...form, unitId:v})}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u:any)=><SelectItem key={u.id} value={u.id}>{u.number} • {u.type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Visit window</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Visit date *</Label>
                <Input id="date" type="date" value={form.visitDate} onChange={e=>setForm({...form, visitDate:e.target.value})} required />
                <p className="text-xs text-muted-foreground">Defaults to today 09:00–21:00. Adjust if needed.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">Valid from (optional)</Label>
                  <Input id="from" type="time" value={form.validFrom} onChange={e=>setForm({...form, validFrom:e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">Valid until (optional)</Label>
                  <Input id="to" type="time" value={form.validTo} onChange={e=>setForm({...form, validTo:e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={()=>router.push("/visitors")}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Creating..." : "Create invite"}</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
