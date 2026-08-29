"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreditCard } from "lucide-react";
export default function AdminPayments(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/payments").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Payments — Admin" description="Payment ledger • society-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,20).map((p:any)=><div key={p.id} className="p-3 flex justify-between"><div><p className="text-sm font-medium">{p.amount} • {p.method}</p><p className="text-xs text-muted-foreground">{p.gatewayRef?.slice(0,12)||""} • {new Date(p.createdAt).toLocaleString()}</p></div><span className="text-xs">{p.status}</span></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<CreditCard className="h-5 w-5"/>} title="No payments" description="Payments appear here." /></div>}</CardContent></Card></div></AppShell>;
}
