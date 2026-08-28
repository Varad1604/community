"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function BookingDetail() {
  const params = useParams<{id:string}>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetch(`/api/bookings/${params.id}`).then(r=>{ if(!r.ok) throw new Error(); return r.json(); }).then(setData).catch(()=>{}).finally(()=>setLoading(false));
  }, [params.id]);

  async function cancel(){
    const res = await fetch(`/api/bookings/${params.id}`, { method:"PATCH", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ status:"CANCELLED" }) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error || "Failed"); else { toast.success("Booking cancelled"); setData((prev:any)=>({...prev, booking: d})); }
  }

  if (loading) return <AppShell><div className="max-w-2xl mx-auto animate-pulse h-40 bg-muted rounded-xl" /></AppShell>;
  if (!data) return <AppShell><div className="max-w-2xl mx-auto"><Card><CardContent className="py-10 text-center">Not found</CardContent></Card></div></AppShell>;

  const { booking, amenity, slot, unit } = data;
  const canCancel = booking.status==="CONFIRMED" && booking.bookingDate >= new Date().toISOString().slice(0,10);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={()=>router.push("/bookings")}>← My Bookings</Button>

        <Card>
          <CardContent className="pt-6 text-center">
            <h1 className="text-lg font-semibold">{amenity?.name || "Amenity"}</h1>
            <p className="text-sm text-muted-foreground">{booking.bookingDate} • {slot ? `${slot.startTime}–${slot.endTime}` : "No slot"}</p>
            <Badge className="mt-2" variant={booking.status==="CANCELLED" ? "outline" : "default"}>{booking.status}</Badge>
            <p className="text-xs text-muted-foreground mt-2">Booking {booking.id.slice(0,8)} • Unit {unit?.number || booking.unitId.slice(0,8)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Date</span><span className="font-medium">{booking.bookingDate}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Time</span><span className="font-medium">{slot ? `${slot.startTime}–${slot.endTime}` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Amenity</span><span className="font-medium">{amenity?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Capacity</span><span>{amenity?.capacity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span className="font-medium">{unit?.number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={booking.status==="CANCELLED" ? "outline" : "default"}>{booking.status}</Badge></div>
          </CardContent>
        </Card>

        {canCancel ? (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full">Cancel Booking</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Cancel booking?</AlertDialogTitle><AlertDialogDescription>Slot will become available for others. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Keep</AlertDialogCancel><AlertDialogAction onClick={cancel}>Yes, cancel</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <Button variant="outline" className="w-full" disabled>{booking.status==="CANCELLED" ? "Cancelled" : "Cannot cancel"}</Button>}

        <Button variant="ghost" className="w-full" onClick={()=>router.push("/amenities")}>Browse Amenities</Button>
      </div>
    </AppShell>
  );
}
