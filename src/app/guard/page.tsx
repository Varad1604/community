"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Clock, Building2, Users, LogIn, LogOut, Search, UserPlus, QrCode, Phone, MapPin, AlertTriangle, Package, HeartHandshake } from "lucide-react";

export default function GuardConsole() {
  const [society, setSociety] = useState<any>(null);
  const [gates, setGates] = useState<any[]>([]);
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [guard, setGuard] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [code, setCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [expected, setExpected] = useState<any[]>([]);
  const [inside, setInside] = useState<any[]>([]);
  const [walkin, setWalkin] = useState({ visitorName:"", phone:"", purpose:"Guest", unitId:"" });
  const [residentQuery, setResidentQuery] = useState("");
  const [residentResults, setResidentResults] = useState<any[]>([]);
  const [tab, setTab] = useState("verify");
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryForm, setDeliveryForm] = useState({ courierName:"", awb:"", unitId:"" });
  const [deliveryQuery, setDeliveryQuery] = useState("");
  const [deliveryResults, setDeliveryResults] = useState<any[]>([]);
  const [helpList, setHelpList] = useState<any[]>([]);
  const [helpAttendance, setHelpAttendance] = useState<any[]>([]);
  const [helpQuery, setHelpQuery] = useState("");
  const [helpSearchResults, setHelpSearchResults] = useState<any[]>([]);

  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date()), 1000);
    fetch("/api/auth/me").then(r=>r.json()).then(d=> setGuard(d.user)).catch(()=>{});
    fetch("/api/societies").then(r=>r.json()).then(d=> setSociety(Array.isArray(d)? d[0]: null)).catch(()=>{});
    fetch("/api/gates").then(r=>r.json()).then(d=>{ if(Array.isArray(d)){ setGates(d); if(d[0]) setSelectedGate(d[0].id); }}).catch(()=>{});
    loadExpected(); loadInside(); loadDeliveries(); loadHelp(); loadHelpAttendance();
    const saved = localStorage.getItem("guard_gate");
    if (saved) setSelectedGate(saved);
    return ()=>clearInterval(t);
  }, []);

  useEffect(()=>{ if(selectedGate) localStorage.setItem("guard_gate", selectedGate); }, [selectedGate]);

  async function loadExpected(){ fetch("/api/guard/expected").then(r=>r.json()).then(d=> setExpected(Array.isArray(d)? d : [])).catch(()=>{}); }
  async function loadInside(){ fetch("/api/guard/inside").then(r=>r.json()).then(d=> setInside(Array.isArray(d)? d : [])).catch(()=>{}); }
  async function loadDeliveries(){ fetch("/api/deliveries").then(r=>r.json()).then(d=> setDeliveries(Array.isArray(d)? d : [])).catch(()=>{}); }
  async function loadHelp(){ fetch("/api/help").then(r=>r.json()).then(d=> setHelpList(Array.isArray(d)? d : [])).catch(()=>{}); }
  async function loadHelpAttendance(){ fetch("/api/help/attendance").then(r=>r.json()).then(d=> setHelpAttendance(Array.isArray(d)? d : [])).catch(()=>{}); }

  async function verify(){
    if (!code.trim()) return toast.error("Enter pass code");
    setVerifyResult(null); setVerifyError(null);
    const res = await fetch("/api/guard/verify", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ code: code.trim() }) });
    const data = await res.json();
    if (!res.ok){ setVerifyError(data.error || "Not found"); toast.error(data.error || "Not found"); }
    else { setVerifyResult(data); toast.success("Visitor verified"); }
  }

  async function checkIn(){
    if (!verifyResult?.invite) return;
    const res = await fetch("/api/guard/check-in", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ inviteId: verifyResult.invite.id, gateId: selectedGate || undefined }) });
    const data = await res.json();
    if (!res.ok){ toast.error(data.error || "Check-in failed"); } else { toast.success("Entry recorded"); setVerifyResult(null); setCode(""); loadExpected(); loadInside(); }
  }

  async function checkOut(entryId: string){
    const res = await fetch("/api/guard/check-out", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ entryId }) });
    if (!res.ok){ const d=await res.json(); toast.error(d.error||"Failed"); } else { toast.success("Checked out"); loadInside(); }
  }

  async function searchResident(){
    if (residentQuery.length<2) return;
    const res = await fetch(`/api/guard/resident-search?q=${encodeURIComponent(residentQuery)}`);
    const d = await res.json();
    setResidentResults(Array.isArray(d)? d : []);
  }

  async function doWalkIn(){
    if (!walkin.visitorName || !walkin.phone || !walkin.unitId) return toast.error("Fill visitor, phone, unit");
    const res = await fetch("/api/guard/walk-in", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ visitorName: walkin.visitorName, phone: walkin.phone, purpose: walkin.purpose, unitId: walkin.unitId, gateId: selectedGate || undefined }) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error||"Walk-in failed"); else { toast.success(`Walk-in: ${d.entry.id.slice(0,8)} checked in`); setWalkin({ visitorName:"", phone:"", purpose:"Guest", unitId:""}); loadInside(); }
  }
  async function searchDeliveryUnit(){
    if (deliveryQuery.length<2) return;
    const res = await fetch(`/api/guard/resident-search?q=${encodeURIComponent(deliveryQuery)}`);
    const d = await res.json();
    setDeliveryResults(Array.isArray(d)? d : []);
  }
  async function recordDelivery(){
    if (!deliveryForm.courierName || !deliveryForm.unitId) return toast.error("Enter courier and unit");
    const res = await fetch("/api/deliveries", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ courierName: deliveryForm.courierName, awb: deliveryForm.awb || undefined, unitId: deliveryForm.unitId }) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error||"Failed"); else { toast.success(`Delivery for ${d.courierName} recorded`); setDeliveryForm({ courierName:"", awb:"", unitId:""}); setDeliveryQuery(""); setDeliveryResults([]); loadDeliveries(); }
  }
  async function searchHelp(){
    if (helpQuery.length<2) return;
    const q = helpQuery.toLowerCase();
    const filtered = helpList.filter((h:any)=> h.help.name.toLowerCase().includes(q) || h.help.phone.includes(q));
    setHelpSearchResults(filtered);
  }
  async function helpCheckIn(helpId: string, unitId: string){
    const res = await fetch("/api/help/attendance", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ helpId, unitId, gateId: selectedGate || undefined }) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error||"Check-in failed"); else { toast.success("Help checked in"); loadHelpAttendance(); }
  }
  async function helpCheckOut(attendanceId: string){
    const res = await fetch("/api/help/attendance", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ attendanceId }) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error||"Check-out failed"); else { toast.success("Checked out"); loadHelpAttendance(); }
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><Shield className="h-5 w-5" />Gate Console</h1>
            <p className="text-xs text-muted-foreground">{society?.name || "Green Acres"} • {gates.find(g=>g.id===selectedGate)?.name || "Select gate"} • {guard?.fullName || "Guard"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4" />{time.toLocaleTimeString()} • {time.toLocaleDateString()}</div>
            <Select value={selectedGate} onValueChange={setSelectedGate}>
              <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Select gate" /></SelectTrigger>
              <SelectContent>
                {gates.map(g=> <SelectItem key={g.id} value={g.id}>{g.name} ({g.type})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-10">
            <TabsTrigger value="verify" className="text-xs">Verify</TabsTrigger>
            <TabsTrigger value="expected" className="text-xs">Expected {expected.length>0 && <Badge className="ml-1 px-1">{expected.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="inside" className="text-xs">Inside {inside.length>0 && <Badge className="ml-1 px-1 bg-emerald-600">{inside.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="deliveries" className="text-xs">Deliveries {deliveries.filter((d:any)=>d.status==="AT_GATE").length>0 && <Badge className="ml-1 px-1 bg-amber-600">{deliveries.filter((d:any)=>d.status==="AT_GATE").length}</Badge>}</TabsTrigger>
            <TabsTrigger value="help" className="text-xs">Help {helpAttendance.filter((h:any)=>!h.attendance.checkOut).length>0 && <Badge className="ml-1 px-1 bg-emerald-600">{helpAttendance.filter((h:any)=>!h.attendance.checkOut).length}</Badge>}</TabsTrigger>
            <TabsTrigger value="walkin" className="text-xs">Walk-in</TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="space-y-4 mt-4">
            <Card className="border-2">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-5 w-5" />Verify Visitor — Pass / QR Code</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Enter 6-digit pass code or scan QR token. Large input for speed.</p>
                <div className="flex gap-2">
                  <Input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3" className="h-14 text-2xl font-mono tracking-widest text-center" autoFocus />
                  <Button onClick={verify} className="h-14 px-8 text-base font-semibold">Verify</Button>
                </div>
                <p className="text-xs text-muted-foreground">QR uses same code. Camera scan not yet in this environment — enter code manually. Token verification is server-side.</p>
              </CardContent>
            </Card>

            {verifyError && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="py-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">{verifyError}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {verifyError.includes("expired") ? "Pass expired — ask resident to re-invite." : verifyError.includes("cancelled") ? "Invite cancelled — deny entry." : verifyError.includes("already") ? "Already inside — check Inside tab." : "Check code and try again."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {verifyResult && (
              <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
                <CardContent className="pt-6">
                  <p className="text-center text-sm font-bold tracking-widest uppercase text-emerald-700">Visitor Verified</p>
                  <div className="text-center mt-2">
                    <p className="text-xl font-semibold">{verifyResult.visitor.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Phone className="h-3 w-3" />{verifyResult.visitor.phone}</p>
                    <p className="text-sm mt-2">Visiting <span className="font-semibold">{verifyResult.unit?.number || verifyResult.invite.unitId.slice(0,8)}</span> • {verifyResult.invite.purpose}</p>
                    <p className="text-xs text-muted-foreground mt-1">Valid {new Date(verifyResult.invite.validFrom).toLocaleString()} → {new Date(verifyResult.invite.validTo).toLocaleString()}</p>
                    <Badge className="mt-2 bg-emerald-600">READY</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button variant="outline" className="h-14 text-base" onClick={()=>setVerifyResult(null)}>Deny</Button>
                    <Button className="h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700" onClick={checkIn}><LogIn className="mr-2 h-5 w-5" />Allow Entry</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expected" className="space-y-3 mt-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Expected Visitors</h2><Button variant="ghost" size="sm" onClick={loadExpected}>Refresh</Button></div>
            {expected.length===0 ? <Card><CardContent className="py-10 text-center"><Users className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-sm font-medium mt-2">No expected visitors</p><p className="text-xs text-muted-foreground">Invites from residents appear here.</p></CardContent></Card> : (
              <div className="grid md:grid-cols-2 gap-3">
                {expected.map((e:any)=>(
                  <Card key={e.invite.id} className="hover:bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{e.visitor.name}</p>
                          <p className="text-xs text-muted-foreground">{e.visitor.phone} • {e.invite.purpose}</p>
                          <p className="text-xs flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{e.unit?.number} • {new Date(e.invite.validTo).toLocaleTimeString()}</p>
                        </div>
                        <Badge variant="outline" className="h-fit font-mono">{e.invite.code}</Badge>
                      </div>
                      <Button size="sm" className="w-full mt-3 h-10" onClick={()=>{ setCode(e.invite.code); setTab("verify"); setTimeout(verify, 100); }}>Verify & Allow</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inside" className="space-y-3 mt-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Inside — Currently in society</h2><Badge variant="secondary">{inside.length} inside</Badge></div>
            {inside.length===0 ? <Card><CardContent className="py-10 text-center"><Building2 className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-sm font-medium mt-2">No one inside</p></CardContent></Card> : (
              <div className="space-y-3">
                {inside.map((it:any)=>(
                  <Card key={it.entry.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium">{it.visitor.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{it.visitor.name} • {it.unit.number}</p>
                        <p className="text-xs text-muted-foreground">In since {new Date(it.entry.checkIn).toLocaleTimeString()} • {Math.floor((Date.now() - new Date(it.entry.checkIn).getTime())/60000)} min</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-10" onClick={()=>checkOut(it.entry.id)}><LogOut className="h-4 w-4 mr-1" />Check out</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" />Record Delivery at Gate</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Courier / Provider *</Label><Input value={deliveryForm.courierName} onChange={e=>setDeliveryForm({...deliveryForm, courierName:e.target.value})} placeholder="Amazon, Flipkart, BlueDart" /></div>
                  <div className="space-y-1"><Label>AWB / Tracking (optional)</Label><Input value={deliveryForm.awb} onChange={e=>setDeliveryForm({...deliveryForm, awb:e.target.value})} placeholder="AWB123456" /></div>
                </div>
                <div className="space-y-1"><Label>Destination Unit *</Label><Input value={deliveryForm.unitId} onChange={e=>setDeliveryForm({...deliveryForm, unitId:e.target.value})} placeholder="Unit ID or search below" className="font-mono text-xs" /></div>
                <div className="flex gap-2">
                  <Input value={deliveryQuery} onChange={e=>setDeliveryQuery(e.target.value)} placeholder="Search unit e.g. A-101" className="flex-1" />
                  <Button type="button" variant="outline" onClick={searchDeliveryUnit}><Search className="h-4 w-4 mr-1" />Find</Button>
                </div>
                {deliveryResults.length>0 && (
                  <div className="rounded-lg border divide-y max-h-40 overflow-auto">
                    {deliveryResults.map((r:any)=>(
                      <button key={r.unit.id} onClick={()=>setDeliveryForm({...deliveryForm, unitId: r.unit.id})} className="w-full text-left px-3 py-2 hover:bg-muted flex justify-between">
                        <span className="text-sm font-medium">{r.unit.number} • {r.residents[0]?.user?.fullName || "Resident"}</span>
                        <span className="text-xs text-muted-foreground">{r.unit.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button onClick={recordDelivery} className="w-full h-12 text-base"><Package className="mr-2 h-5 w-5" />Record Delivery</Button>
                <p className="text-xs text-muted-foreground">Creates notification for all residents of the unit. Status AT_GATE → resident collects.</p>
              </CardContent>
            </Card>
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent Deliveries</h2><Button variant="ghost" size="sm" onClick={loadDeliveries}>Refresh</Button></div>
            {deliveries.length===0 ? <Card><CardContent className="py-8 text-center"><Package className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-sm font-medium mt-2">No deliveries yet</p></CardContent></Card> : (
              <div className="space-y-2">
                {deliveries.slice(0,10).map((d:any)=>(
                  <Card key={d.id} className="border-l-4 border-l-amber-500">
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold">{d.courierName}</p>
                        <p className="text-xs text-muted-foreground">{d.awb || "No AWB"} • {new Date(d.createdAt).toLocaleString()}</p>
                        <p className="text-xs">Unit {d.unitId.slice(0,8)} • {d.status}</p>
                      </div>
                      <Badge variant={d.status==="AT_GATE" ? "default" : "secondary"} className={d.status==="AT_GATE" ? "bg-amber-600" : ""}>{d.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><HeartHandshake className="h-4 w-4" />Domestic Help — Attendance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={helpQuery} onChange={e=>setHelpQuery(e.target.value)} placeholder="Search name or phone e.g. Lakshmi" className="flex-1" />
                  <Button type="button" variant="outline" onClick={searchHelp}><Search className="h-4 w-4 mr-1" />Find</Button>
                  <Button type="button" variant="ghost" onClick={()=>{ setHelpQuery(""); setHelpSearchResults([]); loadHelp(); }}>All</Button>
                </div>
                {(helpSearchResults.length>0 ? helpSearchResults : helpList).length===0 ? <p className="text-sm text-muted-foreground text-center py-4">No domestic help found</p> : (
                  <div className="space-y-2 max-h-[45vh] overflow-auto">
                    {(helpSearchResults.length>0 ? helpSearchResults : helpList).slice(0,20).map((item:any)=> {
                      const isInside = helpAttendance.some((a:any)=> a.help?.id===item.help.id && !a.attendance.checkOut);
                      const att = helpAttendance.find((a:any)=> a.help?.id===item.help.id && !a.attendance.checkOut);
                      return (
                        <Card key={item.help.id} className="border">
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">{item.help.name[0]}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{item.help.name} • {item.help.category}</p>
                              <p className="text-xs text-muted-foreground">{item.help.phone} • {item.links.length} unit(s) {isInside && "• Inside"}</p>
                            </div>
                            {isInside ? <Button size="sm" variant="outline" onClick={()=>helpCheckOut(att.attendance.id)}><LogOut className="h-4 w-4 mr-1" />Out</Button> : <Button size="sm" onClick={()=>helpCheckIn(item.help.id, item.links[0]?.unitId)}><LogIn className="h-4 w-4 mr-1" />In</Button>}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Check-in creates attendance per unit. Guard verifies link belongs to society. RLS enforced.</p>
              </CardContent>
            </Card>
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Help Inside Now</h2><Badge variant="secondary">{helpAttendance.filter((h:any)=>!h.attendance.checkOut).length} inside</Badge></div>
            {helpAttendance.filter((h:any)=>!h.attendance.checkOut).length===0 ? <p className="text-sm text-muted-foreground text-center py-4">No help inside</p> : (
              <div className="space-y-2">
                {helpAttendance.filter((h:any)=>!h.attendance.checkOut).map((it:any)=>(
                  <Card key={it.attendance.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1"><p className="text-sm font-medium">{it.help?.name} • {it.unit?.number}</p><p className="text-xs text-muted-foreground">In since {new Date(it.attendance.checkIn).toLocaleTimeString()} • Gate {it.attendance.gateId?.slice(0,6) || "—"}</p></div>
                      <Button size="sm" variant="outline" onClick={()=>helpCheckOut(it.attendance.id)}><LogOut className="h-4 w-4 mr-1" />Out</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="walkin" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" />Walk-in Visitor (no invite)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Visitor name *</Label><Input value={walkin.visitorName} onChange={e=>setWalkin({...walkin, visitorName:e.target.value})} placeholder="Name" /></div>
                  <div className="space-y-1"><Label>Phone *</Label><Input value={walkin.phone} onChange={e=>setWalkin({...walkin, phone:e.target.value})} placeholder="98765 43210" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Purpose *</Label><Input value={walkin.purpose} onChange={e=>setWalkin({...walkin, purpose:e.target.value})} placeholder="Guest / Delivery" /></div>
                  <div className="space-y-1"><Label>Host unit *</Label>
                    <div className="flex gap-2">
                      <Input value={walkin.unitId} onChange={e=>setWalkin({...walkin, unitId:e.target.value})} placeholder="Unit ID or search below" className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input value={residentQuery} onChange={e=>setResidentQuery(e.target.value)} placeholder="Search unit / resident e.g. A-101" className="flex-1" />
                  <Button type="button" variant="outline" onClick={searchResident}><Search className="h-4 w-4 mr-1" />Find</Button>
                </div>
                {residentResults.length>0 && (
                  <div className="rounded-lg border divide-y max-h-40 overflow-auto">
                    {residentResults.map((r:any)=>(
                      <button key={r.unit.id} onClick={()=>setWalkin({...walkin, unitId: r.unit.id})} className="w-full text-left px-3 py-2 hover:bg-muted flex justify-between">
                        <span className="text-sm font-medium">{r.unit.number} • {r.residents[0]?.user?.fullName || "Resident"}</span>
                        <span className="text-xs text-muted-foreground">{r.unit.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button onClick={doWalkIn} className="w-full h-12 text-base"><LogIn className="mr-2 h-5 w-5" />Record Walk-in & Allow Entry</Button>
                <p className="text-xs text-muted-foreground">Walk-in creates an APPROVED invite + entry immediately. Resident lookup is society-scoped. No approval workflow faked — guard records entry directly.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
