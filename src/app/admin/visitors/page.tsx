"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
export default function AdminVisitors(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/visitors").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Visitors — Admin" description="Visitor invites • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((v:any)=><div key={v.id} className="p-3"><p className="text-sm font-medium">{v.name} • {v.phone}</p><p className="text-xs text-muted-foreground">{v.purpose||"Visit"} • {new Date(v.createdAt).toLocaleString()}</p></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Users className="h-5 w-5"/>} title="No visitors" description="Invites appear here." /></div>}</CardContent></Card></div></AppShell>;
}
