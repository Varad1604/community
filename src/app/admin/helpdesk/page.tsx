"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Wrench } from "lucide-react";
export default function AdminHelpdesk(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/tickets").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Helpdesk — Admin" description="Tickets • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((t:any)=><div key={t.id} className="p-3"><p className="text-sm font-medium">{t.title} • {t.category}</p><p className="text-xs text-muted-foreground">{t.status} • {t.priority} • {new Date(t.createdAt).toLocaleString()}</p></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Wrench className="h-5 w-5"/>} title="No tickets" description="Helpdesk tickets appear here." /></div>}</CardContent></Card></div></AppShell>;
}
