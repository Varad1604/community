"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Phone, Calendar, Plus, AlertCircle } from "lucide-react";

type Invite = { id: string; visitorId: string; code: string; purpose: string | null; validFrom: string; validTo: string; status: string; createdAt: string };
type Visitor = { id: string; name: string; phone: string };
type Entry = { id: string; inviteId: string | null; checkIn: string; checkOut: string | null };

export default function VisitorsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    async function load() {
      try {
        const [iv, vs, en] = await Promise.all([
          fetch("/api/invites").then(r=>{ if(!r.ok) throw new Error(); return r.json(); }),
          fetch("/api/visitors").then(r=>{ if(!r.ok) throw new Error(); return r.json(); }),
          fetch("/api/entries").then(r=>{ if(!r.ok) throw new Error(); return r.json(); }).catch(()=>[]),
        ]);
        setInvites(Array.isArray(iv)? iv : []);
        setVisitors(Array.isArray(vs)? vs : []);
        setEntries(Array.isArray(en)? en : []);
      } catch { setError("Couldn't load visitors"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const visitorMap = useMemo(()=> new Map(visitors.map(v=>[v.id, v])), [visitors]);
  const entryMap = useMemo(()=> new Map(entries.map(e=>[e.inviteId, e])), [entries]);

  const filtered = useMemo(()=>{
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    return invites.filter(iv=>{
      const validTo = new Date(iv.validTo);
      const validFrom = new Date(iv.validFrom);
      const isExpired = validTo < now || iv.status==="EXPIRED";
      const isCancelled = iv.status==="CANCELLED" || iv.status==="REJECTED";
      const isToday = validFrom <= todayEnd && validTo >= todayStart;
      const hasEntry = entryMap.has(iv.id);
      const checkedOut = hasEntry && entryMap.get(iv.id)?.checkOut;
      if (tab==="upcoming") return !isCancelled && !isExpired && !checkedOut && validTo >= now;
      if (tab==="today") return !isCancelled && isToday && !checkedOut;
      if (tab==="active") return hasEntry && !checkedOut;
      if (tab==="past") return isExpired || checkedOut || iv.status==="CANCELLED";
      return true;
    });
  }, [invites, tab, entryMap]);

  const counts = useMemo(()=>{
    const now = new Date(); const todayStart=new Date(now); todayStart.setHours(0,0,0,0); const todayEnd=new Date(now); todayEnd.setHours(23,59,59,999);
    return {
      upcoming: invites.filter(iv=>iv.status!=="CANCELLED" && iv.status!=="REJECTED" && new Date(iv.validTo)>=now && !entryMap.get(iv.id)?.checkOut).length,
      today: invites.filter(iv=>new Date(iv.validFrom)<=todayEnd && new Date(iv.validTo)>=todayStart && !["CANCELLED","REJECTED"].includes(iv.status)).length,
      active: Array.from(entryMap.values()).filter(e=>!e.checkOut).length,
      past: invites.filter(iv=>new Date(iv.validTo)<now || iv.status==="CANCELLED" || !!entryMap.get(iv.id)?.checkOut).length,
    };
  }, [invites, entryMap]);

  if (loading) return <AppShell><div className="max-w-4xl mx-auto"><LoadingSkeleton rows={5} /></div></AppShell>;
  if (error) return <AppShell><div className="max-w-4xl mx-auto"><Card><CardContent className="py-10 text-center"><AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" /><p className="mt-2 text-sm font-medium">{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={()=>location.reload()}>Retry</Button></CardContent></Card></div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <PageHeader
          title="Visitors"
          description="Manage people entering your home"
          action={<Link href="/visitors/new"><Button><Plus className="h-4 w-4 mr-2" />Invite Visitor</Button></Link>}
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="upcoming" className="text-xs">Upcoming {counts.upcoming>0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{counts.upcoming}</Badge>}</TabsTrigger>
            <TabsTrigger value="today" className="text-xs">Today {counts.today>0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{counts.today}</Badge>}</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active {counts.active>0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{counts.active}</Badge>}</TabsTrigger>
            <TabsTrigger value="past" className="text-xs">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length===0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={tab==="upcoming" ? "No upcoming visitors" : tab==="active" ? "No active visitors" : "No visitors"}
            description={tab==="upcoming" ? "Invite someone to make entry quick and secure." : "Visitor invitations appear here."}
            actionLabel="Invite Visitor"
            onAction={()=>location.href="/visitors/new"}
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map(iv=>{
                const v = visitorMap.get(iv.visitorId);
                const entry = entryMap.get(iv.id);
                return (
                  <Link key={iv.id} href={`/visitors/${iv.id}`} className="block">
                    <Card className="hover:bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{v?.name || "Visitor"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{v?.phone || "—"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(iv.validFrom).toLocaleDateString()} → {new Date(iv.validTo).toLocaleDateString()}</p>
                            {iv.purpose && <p className="text-xs mt-1 line-clamp-1">{iv.purpose}</p>}
                          </div>
                          <StatusBadge status={entry?.checkOut ? "CHECKED_OUT" : entry ? "CHECKED_IN" : iv.status} />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{iv.code}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">{entry ? <><Clock className="h-3 w-3" />{entry.checkOut ? "Exited" : "Inside"}</> : "Not checked in"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <Card className="hidden md:block">
              <div className="divide-y">
                {filtered.map(iv=>{
                  const v = visitorMap.get(iv.visitorId);
                  const entry = entryMap.get(iv.id);
                  return (
                    <Link key={iv.id} href={`/visitors/${iv.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">{v?.name?.[0]?.toUpperCase() || "V"}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{v?.name || "Visitor"} <span className="font-normal text-muted-foreground">• {v?.phone}</span></p>
                        <p className="text-xs text-muted-foreground truncate">{iv.purpose || "Visit"} • {new Date(iv.validTo).toLocaleString()}</p>
                      </div>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{iv.code}</span>
                      <span className="text-xs text-muted-foreground hidden lg:block">{entry?.checkIn ? new Date(entry.checkIn).toLocaleTimeString() : "—"} → {entry?.checkOut ? new Date(entry.checkOut).toLocaleTimeString() : "—"}</span>
                      <StatusBadge status={entry?.checkOut ? "CHECKED_OUT" : entry ? "CHECKED_IN" : iv.status} />
                    </Link>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
