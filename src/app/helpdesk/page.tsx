"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Wrench, Plus, Clock } from "lucide-react";
export default function HelpdeskPage(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("all");
  const load=async()=>{
    const r=await fetch("/api/helpdesk");
    const d=await r.json();
    setItems(Array.isArray(d)?d:[]);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  const filtered = tab==="all" ? items : items.filter((t:any)=>t.status===tab.toUpperCase());
  if(loading) return <AppShell><div className="max-w-4xl mx-auto"><LoadingSkeleton rows={4}/></div></AppShell>;
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <PageHeader title="Helpdesk" description="Complaints and service requests • your tickets" action={<Link href="/helpdesk/new"><Button size="sm"><Plus className="h-4 w-4 mr-1"/>New Ticket</Button></Link>} />
        <Tabs value={tab} onValueChange={setTab}><TabsList className="grid w-full grid-cols-5"><TabsTrigger value="all">All ({items.length})</TabsTrigger><TabsTrigger value="open">Open</TabsTrigger><TabsTrigger value="assigned">Assigned</TabsTrigger><TabsTrigger value="resolved">Resolved</TabsTrigger><TabsTrigger value="closed">Closed</TabsTrigger></TabsList></Tabs>
        {filtered.length===0 ? <EmptyState icon={<Wrench className="h-5 w-5"/>} title="No tickets" description={tab==="all" ? "Create a complaint to get help." : `No ${tab} tickets.`} /> : (
          <div className="space-y-3">
            {filtered.map((t:any)=>(
              <Link key={t.id} href={`/helpdesk/${t.id}`}>
                <Card className="hover:bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0"><p className="text-sm font-semibold truncate">{t.title}</p><p className="text-xs text-muted-foreground">{t.category} • {t.priority} • {t.status}</p><p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="h-3 w-3"/>{new Date(t.createdAt).toLocaleString()}</p></div>
                      <Badge variant={t.status==="OPEN"?"destructive":t.status==="RESOLVED"?"default":"secondary"}>{t.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
