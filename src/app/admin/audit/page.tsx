"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AuditRedirect(){ const r=useRouter(); useEffect(()=>r.replace("/admin/audit-logs"),[r]); return null; }
