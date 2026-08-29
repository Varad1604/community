"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, BarChart3, Calendar, Siren, Bell } from "lucide-react";
export default function AdminCommunityDashboard() {
  const [stats, setStats] = useState({ announcements: 0, polls: 0, events: 0, upcomingEvents: 0, emergencies: 0, notifications: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    Promise.all([
      fetch("/api/announcements").then(r=>r.json()).catch(()=>[]),
      fetch("/api/polls").then(r=>r.json()).catch(()=>[]),
      fetch("/api/events").then(r=>r.json()).catch(()=>[]),
      fetch("/api/emergency").then(r=>r.json()).catch(()=>[]),
      fetch("/api/notifications").then(r=>r.json()).catch(()=>[]),
    ]).then(([ann, polls, events, emergencies, notifs])=>{
      const annCount = Array.isArray(ann)? ann.length : 0;
      const pollCount = Array.isArray(polls)? polls.length : 0;
      const activePolls = Array.isArray(polls)? polls.filter((p:any)=> !p.isClosed).length : 0;
      const evCount = Array.isArray(events)? events.length : 0;
      const upcoming = Array.isArray(events)? events.filter((e:any)=> new Date(e.startsAt) >= new Date()).length : 0;
      const activeEmerg = Array.isArray(emergencies)? emergencies.filter((e:any)=> e.status==="OPEN").length : 0;
      const unread = Array.isArray(notifs)? notifs.filter((n:any)=> !n.readAt).length : 0;
      setStats({ announcements: annCount, polls: activePolls, events: evCount, upcomingEvents: upcoming, emergencies: activeEmerg, notifications: unread });
    }).finally(()=>setLoading(false));
  },[]);
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4">
        <PageHeader title="Community — Overview" description="Real counts from society data • communication hub" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard title="Announcements" value={loading?"—":stats.announcements} icon={Megaphone} />
          <StatCard title="Active Polls" value={loading?"—":stats.polls} icon={BarChart3} />
          <StatCard title="Upcoming Events" value={loading?"—":stats.upcomingEvents} subtext={`${stats.events} total`} icon={Calendar} />
          <StatCard title="Active Emergencies" value={loading?"—":stats.emergencies} icon={Siren} />
          <StatCard title="Unread Notifications" value={loading?"—":stats.notifications} icon={Bell} />
          <StatCard title="Total Events" value={loading?"—":stats.events} icon={Calendar} />
        </div>
        <Card><CardContent className="p-4 text-xs text-muted-foreground">Counts are live from database. No mock data. Refresh to update. Use Engage nav to manage Announcements, Polls, Events, Emergency.</CardContent></Card>
      </div>
    </AppShell>
  );
}
