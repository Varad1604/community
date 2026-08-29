"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Wrench, Clock, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";
export default function AdminHelpdesk(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [filters,setFilters]=useState({ status:"all", priority:"all", category:"all" });
  const [selected,setSelected]=useState<any>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [comment,setComment]=useState("");
  const [staff,setStaff]=useState<any[]>([]);
  const [assignId,setAssignId]=useState("");
  const load=async()=>{
    const params=new URLSearchParams();
    if(filters.status!=="all") params.set("status",filters.status);
    if(filters.priority!=="all") params.set("priority",filters.priority);
    if(filters.category!=="all") params.set("category",filters.category);
    const r=await fetch(`/api/helpdesk?${params}`);
    const d=await r.json();
    setItems(Array.isArray(d)?d:[]);
    setLoading(false);
  };
  useEffect(()=>{ load(); fetch("/api/admin/members").then(r=>r.json()).then(d=>setStaff(Array.isArray(d)?d.filter((m:any)=>["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER"].includes(m.role)):[])); },[filters]);
  const openTicket=async(id:string)=>{
    const r=await fetch(`/api/helpdesk/${id}`);
    const d=await r.json();
    setSelected(d.ticket);
    setComments(d.comments||[]);
    setAssignId(d.ticket.assigneeId||"");
  };
  const updateStatus=async(status:string)=>{
    if(!selected) return;
    const r=await fetch(`/api/helpdesk/${selected.id}`,{ method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ status })});
    const d=await r.json();
    if(!r.ok) return toast.error(d.error||"Failed");
    toast.success(`Status → ${status}`);
    setSelected(d);
    load();
  };
  const assign=async()=>{
    if(!selected || !assignId) return;
    const r=await fetch(`/api/helpdesk/${selected.id}`,{ method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ assigneeId: assignId })});
    const d=await r.json();
    if(!r.ok) return toast.error(d.error||"Failed");
    toast.success("Assigned");
    setSelected(d);
    load();
  };
  const postComment=async()=>{
    if(!selected || !comment.trim()) return;
    const r=await fetch(`/api/helpdesk/${selected.id}/comments`,{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ body: comment })});
    if(!r.ok){ const d=await r.json(); return toast.error(d.error||"Failed"); }
    setComment(""); toast.success("Replied");
    const d=await fetch(`/api/helpdesk/${selected.id}`).then(r=>r.json());
    setComments(d.comments);
  };
  const counts={ open: items.filter((t:any)=>t.status==="OPEN").length, assigned: items.filter((t:any)=>t.status==="ASSIGNED").length, inprog: items.filter((t:any)=>t.status==="IN_PROGRESS").length, resolved: items.filter((t:any)=>t.status==="RESOLVED").length, closed: items.filter((t:any)=>t.status==="CLOSED").length, urgent: items.filter((t:any)=>["HIGH","URGENT"].includes(t.priority)).length };
  if(loading) return <AppShell><div className="max-w-6xl mx-auto"><LoadingSkeleton rows={5}/></div></AppShell>;
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4">
        <PageHeader title="Helpdesk — Operations" description="Society tickets • assign, progress, resolve" />
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{counts.open}</p><p className="text-xs">Open</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{counts.assigned}</p><p className="text-xs">Assigned</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{counts.inprog}</p><p className="text-xs">In Progress</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{counts.resolved}</p><p className="text-xs">Resolved</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{counts.closed}</p><p className="text-xs">Closed</p></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-700">{counts.urgent}</p><p className="text-xs">High/Urgent</p></CardContent></Card>
        </div>
        <Card><CardContent className="p-3 flex flex-wrap gap-2">
          <Select value={filters.status} onValueChange={v=>setFilters({...filters, status:v})}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="OPEN">OPEN</SelectItem><SelectItem value="ASSIGNED">ASSIGNED</SelectItem><SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem><SelectItem value="RESOLVED">RESOLVED</SelectItem><SelectItem value="CLOSED">CLOSED</SelectItem></SelectContent></Select>
          <Select value={filters.priority} onValueChange={v=>setFilters({...filters, priority:v})}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All priority</SelectItem><SelectItem value="LOW">LOW</SelectItem><SelectItem value="MEDIUM">MEDIUM</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="URGENT">URGENT</SelectItem></SelectContent></Select>
          <Select value={filters.category} onValueChange={v=>setFilters({...filters, category:v})}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All category</SelectItem><SelectItem value="Plumbing">Plumbing</SelectItem><SelectItem value="Electrical">Electrical</SelectItem><SelectItem value="Cleaning">Cleaning</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>
          <Button size="sm" variant="outline" onClick={load}>Apply</Button>
        </CardContent></Card>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">Tickets ({items.length})</CardTitle></CardHeader><CardContent className="p-0 divide-y max-h-[60vh] overflow-auto">
            {items.length===0 ? <div className="py-10"><EmptyState icon={<Wrench className="h-5 w-5"/>} title="No tickets" description="No tickets match filter." /></div> : items.map((t:any)=>(
              <button key={t.id} onClick={()=>openTicket(t.id)} className={`w-full text-left p-3 hover:bg-muted/30 ${selected?.id===t.id?"bg-muted":""}`}>
                <div className="flex justify-between"><p className="text-sm font-medium truncate">{t.title}</p><Badge variant={t.status==="OPEN"?"destructive":"secondary"} className="shrink-0">{t.status}</Badge></div>
                <p className="text-xs text-muted-foreground">{t.category} • {t.priority} • {new Date(t.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/>{t.id.slice(0,8)} • Unit {t.unitId.slice(0,6)}</p>
              </button>
            ))}
          </CardContent></Card>
          <div className="space-y-3">
            {!selected ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Select a ticket</CardContent></Card> : (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4"/>{selected.title}</CardTitle><div className="flex flex-wrap gap-2"><Badge>{selected.status}</Badge><Badge variant="outline">{selected.priority}</Badge><Badge variant="outline">{selected.category}</Badge></div></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{selected.description||"No description"}</p>
                    <p className="text-xs text-muted-foreground">Ref {selected.id.slice(0,8)} • Unit {selected.unitId.slice(0,6)} • {new Date(selected.createdAt).toLocaleString()}</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.status==="OPEN" && <Button size="sm" onClick={()=>updateStatus("ASSIGNED")}>Assign → ASSIGNED</Button>}
                      {selected.status==="ASSIGNED" && <Button size="sm" onClick={()=>updateStatus("IN_PROGRESS")}>Start → IN_PROGRESS</Button>}
                      {selected.status==="IN_PROGRESS" && <Button size="sm" onClick={()=>updateStatus("RESOLVED")}>Resolve → RESOLVED</Button>}
                      {selected.status==="RESOLVED" && <Button size="sm" onClick={()=>updateStatus("CLOSED")}>Close → CLOSED</Button>}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Assign staff</p>
                      <div className="flex gap-2"><Select value={assignId} onValueChange={setAssignId}><SelectTrigger className="flex-1"><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map((s:any)=><SelectItem key={s.user.id} value={s.user.id}>{s.user.fullName} • {s.role}</SelectItem>)}</SelectContent></Select><Button size="sm" onClick={assign}>Assign</Button></div>
                      {selected.assigneeId && <p className="text-xs flex items-center gap-1"><User className="h-3 w-3"/>Assigned: {selected.assigneeId.slice(0,8)}</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Comments</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {comments.length===0 ? <p className="text-xs text-muted-foreground text-center py-2">No comments</p> : comments.map((c:any)=><div key={c.id} className="rounded border p-2"><p className="text-sm">{c.body}</p><p className="text-xs text-muted-foreground">{c.authorId.slice(0,8)} • {new Date(c.createdAt).toLocaleString()}</p></div>)}
                    <div className="flex gap-2"><Textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Reply as staff" rows={2} className="flex-1" /><Button size="sm" onClick={postComment}>Reply</Button></div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
function MessageSquare(props:any){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
