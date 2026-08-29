"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader, SectionHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Users, Wallet, Wrench, Megaphone, Building2, Calendar, Shield, HeartHandshake, Truck, CreditCard, UserPlus, PhoneCall } from "lucide-react";

export default function Dashboard() {
  const [society, setSociety] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await fetch("/api/auth/me").then(r=>r.json());
        if (!me.user) { setAuth(false); setLoading(false); return; }
        setUser(me.user);
        setAuth(true);
        const [s, u, iv, b, t, a, d] = await Promise.all([
          fetch("/api/societies").then(r=>r.json()).catch(()=>[]),
          fetch("/api/units").then(r=>r.json()).catch(()=>[]),
          fetch("/api/invites").then(r=>r.json()).catch(()=>[]),
          fetch("/api/bills").then(r=>r.json()).catch(()=>[]),
          fetch("/api/tickets").then(r=>r.json()).catch(()=>[]),
          fetch("/api/announcements").then(r=>r.json()).catch(()=>[]),
          fetch("/api/deliveries").then(r=>r.json()).catch(()=>[]),
        ]);
        setSociety(Array.isArray(s)? s[0] : null);
        setUnits(Array.isArray(u)? u : []);
        setInvites(Array.isArray(iv)? iv : []);
        setBills(Array.isArray(b)? b : []);
        setTickets(Array.isArray(t)? t : []);
        setAnnouncements(Array.isArray(a)? a : []);
        setDeliveries(Array.isArray(d)? d : []);
      } catch { setAuth(false); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <AppShell><div className="max-w-6xl mx-auto"><LoadingSkeleton rows={6} /></div></AppShell>;
  if (auth===false) return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground mt-1">Phone OTP authentication required to view society data.</p>
            <Link href="/auth/sign-in"><Button className="mt-4">Sign in with phone</Button></Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );

  const pendingBills = bills.filter(b=>b.status!=="PAID").length;
  const openTickets = tickets.filter(t=>t.status==="OPEN").length;
  const pendingDeliveries = deliveries.filter((d:any)=>d.status==="AT_GATE").length;
  const myUnit = units[0];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          eyebrow={society?.code || "GAR001"}
          title={`Good morning, ${user?.fullName?.split(" ")[0] || "Resident"}`}
          description={`${society?.name || "Green Acres Residency"} • ${society?.city || "Chennai"} • Pilot with ${units.length} flats across 3 towers`}
          action={<div className="flex gap-2"><Link href="/auth/sign-in"><Button variant="outline" size="sm">Switch account</Button></Link><Link href="/emergency" aria-label="View emergency alerts"><Button size="sm" className="bg-red-600 hover:bg-red-700" aria-label="Emergency alerts"><PhoneCall className="h-4 w-4 mr-2" aria-hidden />Emergency</Button></Link></div>}
        />

        <div className="rounded-xl border bg-card px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold">{society?.name} • Unit {myUnit?.number || "A-101"}</p>
              <p className="text-xs text-muted-foreground">{myUnit?.type || "FLAT"} • {myUnit?.areaSqft || 1210} sq ft • Verified resident</p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit">RWA verified</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Flats" value={units.length} sub="3 towers • 4 floors" icon={<Building2 className="h-4 w-4" />} />
          <StatCard label="Upcoming visitors" value={invites.length} sub="PIN/QR pending" icon={<Users className="h-4 w-4" />} />
          <StatCard label="Bills due" value={pendingBills} sub={pendingBills? "Pay before due date" : "All clear"} icon={<Wallet className="h-4 w-4" />} />
          <StatCard label="Helpdesk open" value={openTickets} sub={openTickets? "Needs attention" : "No open tickets"} icon={<Wrench className="h-4 w-4" />} />
        </div>

        {pendingDeliveries>0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-amber-700" /><div><p className="text-sm font-semibold">{pendingDeliveries} delivery{pendingDeliveries>1?"ies":""} ready for pickup</p><p className="text-xs text-muted-foreground">At gate • Collect soon</p></div></div>
              <Link href="/deliveries"><Button size="sm" variant="outline">View</Button></Link>
            </CardContent>
          </Card>
        )}

        <section aria-labelledby="quick-actions">
          <SectionHeader title="Quick actions" description="Frequent tasks — tap to start" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Invite Visitor", icon: UserPlus, href: "/visitors", desc: "PIN & QR" },
              { label: "View Bills", icon: CreditCard, href: "/bills", desc: `${pendingBills} due` },
              { label: "Book Amenity", icon: Calendar, href: "/amenities", desc: "Pool • Gym" },
              { label: "Helpdesk", icon: Wrench, href: "/helpdesk", desc: "Raise ticket" },
              { label: "Deliveries", icon: Truck, href: "/deliveries", desc: pendingDeliveries ? `${pendingDeliveries} ready` : "At gate" },
              { label: "Domestic Help", icon: HeartHandshake, href: "/help", desc: "Check-in" },
            ].map(a=>(
              <Link key={a.label} href={a.href} className="rounded-xl border bg-card p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <a.icon className="h-5 w-5" aria-hidden />
                <p className="text-sm font-medium mt-2">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Upcoming visitors</CardTitle></CardHeader>
            <CardContent>
              {invites.length===0 ? <EmptyState title="No upcoming visitors" description="Pre-approve guests with a PIN to speed up gate entry." icon={<Users className="h-5 w-5" />} /> : (
                <ul className="space-y-3">
                  {invites.slice(0,3).map((iv:any)=>(
                    <li key={iv.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div><p className="text-sm font-medium">{iv.code}</p><p className="text-xs text-muted-foreground">{iv.purpose || "Visit"} • {new Date(iv.validTo).toLocaleDateString()}</p></div>
                      <StatusBadge status={iv.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Bills & payments</CardTitle></CardHeader>
            <CardContent>
              {bills.length===0 ? <EmptyState title="No outstanding bills" description="Maintenance bills appear here when issued by accounts." icon={<Wallet className="h-5 w-5" />} /> : (
                <ul className="space-y-3">
                  {bills.slice(0,3).map((b:any)=>(
                    <li key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div><p className="text-sm font-medium">{b.title}</p><p className="text-xs text-muted-foreground">₹{b.total} • due {b.dueDate}</p></div>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
              {bills.length>0 && <Link href="/bills" className="text-xs text-primary underline mt-3 inline-block">View all bills</Link>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Recent announcements</CardTitle></CardHeader>
            <CardContent>
              {announcements.length===0 ? <EmptyState title="No new announcements" description="Society updates from RWA appear here." icon={<Megaphone className="h-5 w-5" />} /> : (
                <ul className="space-y-3">
                  {announcements.slice(0,3).map((a:any)=>(
                    <li key={a.id} className="rounded-lg border px-3 py-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Helpdesk</CardTitle></CardHeader>
            <CardContent>
              {tickets.length===0 ? <EmptyState title="No open tickets" description="Raise a ticket for plumbing, electrical or housekeeping." icon={<Wrench className="h-5 w-5" />} actionLabel="Raise ticket" href="/helpdesk/new" /> : (
                <ul className="space-y-3">
                  {tickets.slice(0,3).map((t:any)=>(
                    <li key={t.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.category} • {t.priority}</p></div>
                      <StatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><p className="text-sm font-semibold">Emergency & gate</p><p className="text-xs text-muted-foreground">One-tap SOS reaches security + RWA. For gate entry, keep visitor PIN ready.</p></div>
            <div className="flex gap-2"><Link href="/guard" aria-label="Gate directory and console"><Button variant="outline" size="sm" aria-label="Gate directory"><Shield className="h-4 w-4 mr-2" aria-hidden />Gate directory</Button></Link><Link href="/emergency" aria-label="Emergency alerts and SOS"><Button size="sm" className="bg-red-600 hover:bg-red-700" aria-label="SOS emergency alerts">SOS — View alerts</Button></Link></div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
