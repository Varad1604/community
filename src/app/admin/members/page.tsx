"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
export default function AdminMembers(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/admin/members").then(r=>r.json()).then(d=>setItems(Array.isArray(d)?d:[])); },[]);
  return <AppShell><div className="max-w-6xl mx-auto space-y-4"><PageHeader title="Members & Roles" description="Read-only role assignments • tenant-scoped" /><Card><CardContent className="p-0 divide-y">{items.slice(0,50).map((m:any, i:number)=><div key={i} className="flex justify-between p-3"><div><p className="text-sm font-medium">{m.user?.fullName || "Unknown"} • {m.user?.phone}</p><p className="text-xs text-muted-foreground">{m.user?.id.slice(0,8)}</p></div><Badge>{m.role}</Badge></div>)}{items.length===0 && <div className="py-10"><EmptyState icon={<Users className="h-5 w-5"/>} title="No members" description="Members appear here." /></div>}</CardContent></Card><p className="text-xs text-muted-foreground">Role mutation is deferred in MVP — read-only. Prevents self-escalation and SUPER_ADMIN assignment. Use secure migration for changes.</p></div></AppShell>;
}
