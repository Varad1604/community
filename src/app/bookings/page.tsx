"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Calendar, Clock } from "lucide-react";

export default function BookingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  useEffect(()=>{
    fetch("/api/bookings").then(r=>r.json()).then(d=> setItems(Array.isArray(d)? d: [])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = useMemo(()=>{
    const today = new Date().toISOString().slice(0,10);
    const now = new Date();
    return items.filter(({booking}:any)=>{
      if (tab==="upcoming") return booking.status==="CONFIRMED" && booking.bookingDate >= today;
      if (tab==="today") return booking.bookingDate===today && booking.status==="CONFIRMED";
      if (tab==="past") return booking.bookingDate < today && booking.status==="CONFIRMED";
      if (tab==="cancelled") return booking.status==="CANCELLED";
      return true;
    });
  }, [items, tab]);

  const counts = useMemo(()=>{
    const today = new Date().toISOString().slice(0,10);
    return {
      upcoming: items.filter(({booking}:any)=> booking.status==="CONFIRMED" && booking.bookingDate >= today).length,
      today: items.filter(({booking}:any)=> booking.bookingDate===today && booking.status==="CONFIRMED").length,
      past: items.filter(({booking}:any)=> booking.bookingDate < today).length,
      cancelled: items.filter(({booking}:any)=> booking.status==="CANCELLED").length,
    };
  }, [items]);

  if (loading) return <AppShell><div className="max-w-4xl mx-auto"><LoadingSkeleton rows={4} /></div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <PageHeader title="My Bookings" description="Amenity bookings • Tap to view details" />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full overflow-x-auto gap-1 h-10 p-1 justify-start">
            <TabsTrigger value="upcoming" className="text-xs whitespace-nowrap shrink-0">Upcoming {counts.upcoming>0 && <Badge variant="secondary" className="ml-1 px-1">{counts.upcoming}</Badge>}</TabsTrigger>
            <TabsTrigger value="today" className="text-xs whitespace-nowrap shrink-0">Today {counts.today>0 && <Badge variant="secondary" className="ml-1 px-1">{counts.today}</Badge>}</TabsTrigger>
            <TabsTrigger value="past" className="text-xs whitespace-nowrap shrink-0">Past</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs whitespace-nowrap shrink-0">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length===0 ? (
          <EmptyState icon={<Calendar className="h-5 w-5" />} title={tab==="upcoming" ? "No upcoming bookings" : tab==="today" ? "No bookings today" : tab==="cancelled" ? "No cancelled bookings" : "No bookings"} description="Book an amenity slot to see it here." actionLabel="Browse Amenities" onAction={()=>location.href="/amenities"} />
        ) : (
          <div className="space-y-3">
            {filtered.map(({booking, amenity, slot, unit}:any)=>(
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="hover:bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{amenity?.name || booking.amenityId.slice(0,8)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{booking.bookingDate} • {slot ? `${slot.startTime}–${slot.endTime}` : "No slot"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Unit {unit?.number || booking.unitId.slice(0,8)} • {new Date(booking.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={booking.status==="CANCELLED" ? "outline" : booking.status==="CONFIRMED" ? "default" : "secondary"}>{booking.status}</Badge>
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
