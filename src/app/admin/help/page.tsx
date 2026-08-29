"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HeartHandshake } from "lucide-react";
export default function AdminHelp(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/help").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Domestic Help — Admin" description="Registered help • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((h:any)=><div key={h.help?.id||h.id} className="p-3"><p className="text-sm font-medium">{h.help?.name||h.name} • {h.help?.category||h.category}</p><p className="text-xs text-muted-foreground">{h.help?.phone||h.phone}</p></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<HeartHandshake className="h-5 w-5"/>} title="No help" description="Domestic help appears here." /></div>}</CardContent></Card></div></AppShell>;
}
