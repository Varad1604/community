"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Building2, Users, Car } from "lucide-react";
export default function AdminUnits() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const load = async () => {
    const r = await fetch("/api/admin/units?limit=50");
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const filtered = items.filter((it: any) => !q || it.unit.number.toLowerCase().includes(q.toLowerCase()) || it.building?.name.toLowerCase().includes(q.toLowerCase()));
  if (loading) return <AppShell><div className="max-w-6xl mx-auto"><LoadingSkeleton rows={5} /></div></AppShell>;
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4">
        <PageHeader title="Units" description="Buildings • Floors • Occupancy" />
        <Card><CardContent className="p-3 flex gap-2"><Input placeholder="Filter unit or building" value={q} onChange={e => setQ(e.target.value)} className="flex-1" /><Button variant="outline" onClick={load}>Refresh</Button></CardContent></Card>
        {filtered.length === 0 ? <EmptyState icon={<Building2 className="h-5 w-5" />} title="No units" description="No units match." /> : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.slice(0, 50).map((it: any) => (
              <Card key={it.unit.id} className="hover:bg-muted/20">
                <CardContent className="p-3">
                  <div className="flex justify-between"><p className="text-sm font-semibold">{it.unit.number} <Badge variant="outline">{it.unit.type}</Badge></p><Badge>{it.unit.status}</Badge></div>
                  <p className="text-xs text-muted-foreground mt-1">{it.building?.name} • Floor {it.floor?.number ?? "?"} • {it.unit.areaSqft ? `${it.unit.areaSqft} sqft` : ""}</p>
                  <div className="flex gap-2 mt-2 text-xs"><span className="flex items-center gap-1"><Users className="h-3 w-3" />{it.memberCount} members</span><span className="flex items-center gap-1"><Car className="h-3 w-3" />{it.vehicleCount} vehicles</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
