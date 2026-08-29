"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Clock, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";
export default function TicketDetail(){
  const params=useParams<{id:string}>();
  const router=useRouter();
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [comment,setComment]=useState("");
  const load=async()=>{
    const r=await fetch(`/api/helpdesk/${params.id}`);
    if(!r.ok){ setLoading(false); return; }
    const d=await r.json();
    setData(d);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[params.id]);
  const postComment=async()=>{
    if(!comment.trim()) return;
    const r=await fetch(`/api/helpdesk/${params.id}/comments`,{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ body: comment })});
    if(!r.ok){ const d=await r.json(); return toast.error(d.error||"Failed"); }
    setComment(""); toast.success("Comment added"); load();
  };
  if(loading) return <AppShell><div className="max-w-2xl mx-auto animate-pulse h-40 bg-muted rounded-xl"/></AppShell>;
  if(!data) return <AppShell><div className="max-w-2xl mx-auto"><Card><CardContent className="py-10 text-center">Not found <Button variant="outline" onClick={()=>router.push("/helpdesk")}>Back</Button></CardContent></Card></div></AppShell>;
  const { ticket, comments } = data;
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={()=>router.push("/helpdesk")}>← Helpdesk</Button>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5"/>{ticket.title}</CardTitle><div className="flex flex-wrap gap-2"><Badge variant={ticket.status==="OPEN"?"destructive":"secondary"}>{ticket.status}</Badge><Badge>{ticket.priority}</Badge><Badge variant="outline">{ticket.category}</Badge></div></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm whitespace-pre-wrap">{ticket.description || "No description"}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1"><Clock className="h-3 w-3"/>{new Date(ticket.createdAt).toLocaleString()} • Ref {ticket.id.slice(0,8)}</p>
              {ticket.assigneeId && <p className="flex items-center gap-1"><User className="h-3 w-3"/>Assigned: {ticket.assigneeId.slice(0,8)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Comments • Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {comments.length===0 ? <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p> : (
              <div className="space-y-2">
                {comments.map((c:any)=>(
                  <div key={c.id} className="rounded-lg border p-3">
                    <p className="text-sm">{c.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.authorId.slice(0,8)} • {new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment or update" rows={3} maxLength={2000} />
              <Button size="sm" onClick={postComment}>Post Comment</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
