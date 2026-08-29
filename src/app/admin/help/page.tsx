"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/shared/EmptyState";
import { HeartHandshake } from "lucide-react";
export default function AdminHelp(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{ fetch("/api/help").then(r=>{ if(!r.ok) throw new Error(); return r.json(); }).then(d=>setItems(Array.isArray(d)?d:[])).catch(()=>setError("Failed to load domestic help")).finally(()=>setLoading(false)); },[]);
  if(loading) return <AppShell><div className="max-w-6xl mx-auto"><LoadingSkeleton rows={4} /></div></AppShell>;
  if(error) return <AppShell><div className="max-w-6xl mx-auto"><Card><CardContent className="py-10 text-center"><p className="text-sm">{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={()=>location.reload()}>Retry</Button></CardContent></Card></div></AppShell>;
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Domestic Help — Admin" description="Registered help • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((h:any)=><div key={h.help?.id||h.id} className="p-3"><p className="text-sm font-medium">{h.help?.name||h.name} • {h.help?.category||h.category}</p><p className="text-xs text-muted-foreground">{h.help?.phone||h.phone}</p></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<HeartHandshake className="h-5 w-5"/>} title="No help" description="Domestic help appears here." /></div>}</CardContent></Card></div></AppShell>;
}
