"use client";
import { useEffect, useState } from "react";
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
export default function NewTicket(){
  const router=useRouter();
  const [units,setUnits]=useState<any[]>([]);
  const [form,setForm]=useState({ unitId:"", category:"Plumbing", title:"", description:"", priority:"MEDIUM" });
  useEffect(()=>{ fetch("/api/units").then(r=>r.json()).then(d=>setUnits(Array.isArray(d)?d:[])); },[]);
  const submit=async()=>{
    if(!form.unitId||!form.title) return toast.error("Unit and title required");
    const r=await fetch("/api/helpdesk",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(form)});
    const d=await r.json();
    if(!r.ok) return toast.error(d.error||"Failed");
    toast.success("Ticket created");
    router.push(`/helpdesk/${d.id}`);
  };
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <PageHeader title="New Complaint" description="Describe the issue • assigned to facility staff" />
        <Card>
          <CardHeader><CardTitle className="text-sm">Create Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Unit *</Label><Select value={form.unitId} onValueChange={v=>setForm({...form, unitId:v})}><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent>{units.map((u:any)=><SelectItem key={u.id} value={u.id}>{u.number} • {u.type}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Category *</Label><Select value={form.category} onValueChange={v=>setForm({...form, category:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Plumbing">Plumbing</SelectItem><SelectItem value="Electrical">Electrical</SelectItem><SelectItem value="Cleaning">Cleaning</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Priority</Label><Select value={form.priority} onValueChange={v=>setForm({...form, priority:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Leak in bathroom" maxLength={200} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Details, location, photos note" rows={4} maxLength={2000} /></div>
            <div className="flex gap-2"><Button onClick={submit}>Create Ticket</Button><Button variant="outline" onClick={()=>router.push("/helpdesk")}>Cancel</Button></div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
