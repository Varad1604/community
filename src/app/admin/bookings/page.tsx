"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { Calendar } from "lucide-react";
export default function AdminBookings(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{ fetch("/api/bookings").then(r=>{ if(!r.ok) throw new Error(); return r.json(); }).then(d=>setItems(Array.isArray(d)?d:[])).catch(()=>setError("Failed to load bookings")).finally(()=>setLoading(false)); },[]);
  if(loading) return <AppShell><div className="max-w-6xl mx-auto"><LoadingSkeleton rows={4} /></div></AppShell>;
  if(error) return <AppShell><div className="max-w-6xl mx-auto"><Card><CardContent className="py-10 text-center"><p className="text-sm">{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={()=>location.reload()}>Retry</Button></CardContent></Card></div></AppShell>;
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Bookings — Admin" description="Amenity bookings • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((b:any)=><div key={b.id} className="p-3 flex justify-between"><div><p className="text-sm font-medium">{b.amenityId.slice(0,8)} • {b.bookingDate}</p><p className="text-xs text-muted-foreground">{b.status} • {new Date(b.createdAt).toLocaleString()}</p></div><span className="text-xs">{b.slotId?.slice(0,6)||""}</span></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Calendar className="h-5 w-5"/>} title="No bookings" description="Bookings appear here." /></div>}</CardContent></Card></div></AppShell>;
}
