"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Car } from "lucide-react";
export default function AdminVehicles(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/vehicles").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Vehicles — Admin" description="Registered vehicles • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((v:any)=><div key={v.id} className="p-3"><p className="text-sm font-mono font-medium">{v.numberPlate} • {v.type}</p><p className="text-xs text-muted-foreground">Unit {v.unitId.slice(0,8)} • {v.stickerNo||"No sticker"}</p></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Car className="h-5 w-5"/>} title="No vehicles" description="Vehicles appear here." /></div>}</CardContent></Card></div></AppShell>;
}
