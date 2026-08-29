"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar } from "lucide-react";
export default function AdminBookings(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/bookings").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Bookings — Admin" description="Amenity bookings • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((b:any)=><div key={b.id} className="p-3 flex justify-between"><div><p className="text-sm font-medium">{b.amenityId.slice(0,8)} • {b.bookingDate}</p><p className="text-xs text-muted-foreground">{b.status} • {new Date(b.createdAt).toLocaleString()}</p></div><span className="text-xs">{b.slotId?.slice(0,6)||""}</span></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Calendar className="h-5 w-5"/>} title="No bookings" description="Bookings appear here." /></div>}</CardContent></Card></div></AppShell>;
}
