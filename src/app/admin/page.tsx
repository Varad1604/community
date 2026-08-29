"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Shield, Truck, HeartHandshake, Car, Calendar, Wallet, Siren, Megaphone, BarChart3, Wrench, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
function paiseToINR(p: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(p / 100); }
export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/admin/overview").then(r => r.json()).then(setData).finally(() => setLoading(false)); }, []);
  if (loading) return <AppShell><div className="max-w-6xl mx-auto space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div></div></AppShell>;
  if (!data || data.error) return <AppShell><div className="max-w-6xl mx-auto"><Card><CardContent className="py-10 text-center text-sm">Failed to load overview. {data?.error}</CardContent></Card></div></AppShell>;
  const f = data.finance;
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4">
        <PageHeader title="Operations Overview" description="Real society metrics • server-authoritative" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Units" value={data.totalUnits} icon={<Building2 className="h-4 w-4" />} sub={`${data.residents} residents`} />
          <StatCard label="Visitors Inside" value={data.visitorsInside} icon={<Shield className="h-4 w-4" />} sub={`${data.visitorsToday} today`} />
          <StatCard label="Pending Deliveries" value={data.pendingDeliveries} icon={<Truck className="h-4 w-4" />} />
          <StatCard label="Help Inside" value={data.helpInside} icon={<HeartHandshake className="h-4 w-4" />} />
          <StatCard label="Vehicles" value={data.vehicles} icon={<Car className="h-4 w-4" />} />
          <StatCard label="Active Bookings" value={data.activeBookings} icon={<Calendar className="h-4 w-4" />} />
          <StatCard label="Open Tickets" value={data.ticketsOpen} icon={<Wrench className="h-4 w-4" />} />
          <StatCard label="Emergencies Open" value={data.emergenciesOpen} icon={<Siren className="h-4 w-4" />} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="col-span-2"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Billed</p><p className="text-lg font-semibold">{paiseToINR(f.totalBilledPaise)}</p><p className="text-xs text-muted-foreground">{f.billCount} bills • {f.overdueCount} not paid</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Collected</p><p className="text-lg font-semibold text-emerald-600">{paiseToINR(f.collectedPaise)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-lg font-semibold text-amber-600">{paiseToINR(f.outstandingPaise)}</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><Megaphone className="h-5 w-5" /><div><p className="text-sm font-semibold">{data.announcements}</p><p className="text-xs text-muted-foreground">Announcements</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><BarChart3 className="h-5 w-5" /><div><p className="text-sm font-semibold">{data.polls}</p><p className="text-xs text-muted-foreground">Polls</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Calendar className="h-5 w-5" /><div><p className="text-sm font-semibold">{data.events}</p><p className="text-xs text-muted-foreground">Events</p></div></CardContent></Card>
        </div>
        <Card><CardContent className="p-3 text-xs text-muted-foreground">All metrics from live database with tenant isolation and paise-exact finance. No mock data.</CardContent></Card>
      </div>
    </AppShell>
  );
}
