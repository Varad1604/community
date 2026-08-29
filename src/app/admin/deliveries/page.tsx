"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Truck } from "lucide-react";
export default function AdminDeliveries(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/deliveries").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Deliveries — Admin" description="Gate deliveries • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((d:any)=><div key={d.id} className="flex justify-between p-3"><div><p className="text-sm font-medium">{d.courierName}</p><p className="text-xs text-muted-foreground">{d.awb||"No AWB"} • {new Date(d.createdAt).toLocaleString()}</p></div><span className="text-xs">{d.status}</span></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Truck className="h-5 w-5"/>} title="No deliveries" description="Deliveries appear here." /></div>}</CardContent></Card></div></AppShell>;
}
