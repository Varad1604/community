"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Siren, Clock } from "lucide-react";
export default function EmergencyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch("/api/emergency").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])).finally(()=>setLoading(false)); },[]);
  const active = items.filter((a)=>a.status==="OPEN");
  const resolved = items.filter((a)=>a.status!=="OPEN");
  if (loading) return <AppShell><div className="max-w-3xl mx-auto"><LoadingSkeleton rows={2} /></div></AppShell>;
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4">
        <PageHeader title="Emergency Alerts" description="Active alerts from society management" />
        {active.length===0 ? <Card className="border-green-200 bg-green-50"><CardContent className="p-4 text-center"><p className="text-sm font-medium text-green-700">No active emergency. All clear.</p></CardContent></Card> : (
          <div className="space-y-3">
            {active.map((a:any)=>(
              <Card key={a.id} className="border-l-4 border-l-red-600 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2"><Siren className="h-5 w-5 text-red-600" /><p className="text-sm font-bold text-red-700">{a.type}</p><Badge variant="destructive">{a.status}</Badge></div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><Clock className="h-3 w-3" />{new Date(a.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {resolved.length>0 && (
          <Card>
            <CardContent className="p-0 divide-y">
              <p className="text-xs font-semibold px-3 py-2">Resolved</p>
              {resolved.map((a:any)=>(
                <div key={a.id} className="px-3 py-2 flex justify-between">
                  <div><p className="text-sm">{a.type}</p><p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p></div>
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {items.length===0 && <EmptyState icon={<Siren className="h-5 w-5" />} title="No alerts" description="Emergency alerts appear here when active." />}
      </div>
    </AppShell>
  );
}
