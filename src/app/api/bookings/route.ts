import { NextResponse } from "next/server";
import { bookings, amenities, amenitySlots, units, unitMembers, notifications } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAuthAndSociety("booking:read");
  if ("error" in auth) return auth.error;
  try {
    const { societyId, sess } = auth as any;
    const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
    const isPrivileged = roles.some((r:string)=>["SOCIETY_ADMIN","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
    const items = await withTenant(societyId, sess.userId, async (tx)=>{
      let rows;
      if (isPrivileged) {
        rows = await tx.select().from(bookings).where(eq(bookings.societyId, societyId)).orderBy(desc(bookings.createdAt)).limit(50);
      } else {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        const unitIds = members.map(m=>m.unitId);
        if (unitIds.length===0) return [];
        rows = await tx.select().from(bookings).where(and(eq(bookings.societyId, societyId), inArray(bookings.unitId, unitIds))).orderBy(desc(bookings.createdAt)).limit(50);
      }
      const enriched = await Promise.all(rows.map(async b=>{
        const [amenity] = await tx.select().from(amenities).where(eq(amenities.id, b.amenityId));
        const [slot] = b.slotId ? await tx.select().from(amenitySlots).where(eq(amenitySlots.id, b.slotId)) : [null];
        const [unit] = await tx.select().from(units).where(eq(units.id, b.unitId));
        return { booking: b, amenity, slot, unit };
      }));
      return enriched;
    });
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error:"Failed" }, { status:500 }); }
}

const createSchema = z.object({
  amenityId: z.string().uuid(),
  slotId: z.string().uuid().optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  unitId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuthAndSociety("booking:create");
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error:"Invalid input" }, { status:400 });
    const { societyId, sess } = auth as any;

    const result = await withTenant(societyId, sess.userId, async (tx)=>{
      const [amenity] = await tx.select().from(amenities).where(and(eq(amenities.id, parsed.data.amenityId), eq(amenities.societyId, societyId)));
      if (!amenity) throw new Error("Amenity not found");
      if (!amenity.isActive) throw new Error("Amenity inactive");

      let unitId = parsed.data.unitId;
      if (!unitId) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        if (members.length===0) throw new Error("No unit membership");
        unitId = members[0].unitId;
      }
      const [unit] = await tx.select().from(units).where(and(eq(units.id, unitId), eq(units.societyId, societyId)));
      if (!unit) throw new Error("Unit not in society");
      const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.unitId, unitId)));
      const roles = await import("@/lib/tenant").then(m=>m.getUserRoles(sess.userId, societyId));
      const isPrivileged = roles.some((r:string)=>["SOCIETY_ADMIN","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
      if (members.length===0 && !isPrivileged) throw new Error("Not a member of unit");

      let slotId = parsed.data.slotId || null;
      if (slotId) {
        const [slot] = await tx.select().from(amenitySlots).where(and(eq(amenitySlots.id, slotId), eq(amenitySlots.societyId, societyId), eq(amenitySlots.amenityId, amenity.id)));
        if (!slot) throw new Error("Slot not in amenity");
      }

      const bookingDate = parsed.data.bookingDate;
      const today = new Date().toISOString().slice(0,10);
      if (bookingDate < today) throw new Error("Cannot book past date");

      const [created] = await tx.insert(bookings).values({
        societyId, amenityId: amenity.id, slotId, bookingDate, unitId, userId: sess.userId, status: "CONFIRMED",
      }).returning();
      return created;
    });

    await audit({ actorId: sess.userId, societyId, action:"create", entity:"booking", entityId: result.id, newState: result });
    try {
      await withTenant(societyId, sess.userId, async (tx)=>{
        await tx.insert(notifications).values({
          societyId, userId: sess.userId, title: `Booking confirmed: ${result.id.slice(0,8)}`,
          body: `Amenity booked for ${result.bookingDate}`, channel: "IN_APP", relatedEntity: "booking", relatedId: result.id,
        });
      });
    } catch {}

    return NextResponse.json(result, { status:201 });
  } catch (e:any) {
    const msg = `${e.message || ""} ${e.cause?.message || ""} ${JSON.stringify(e.cause || {})}`;
    if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("23505") || e.code==="23505" || e.cause?.code==="23505") return NextResponse.json({ error:"Slot already booked for this date" }, { status:409 });
    if (e.message==="Amenity not found" || e.message==="Slot not in amenity" || e.message==="Unit not in society") return NextResponse.json({ error:e.message }, { status:404 });
    if (e.message==="Not a member of unit" || e.message==="No unit membership") return NextResponse.json({ error:e.message }, { status:403 });
    return NextResponse.json({ error: e.message || "Failed" }, { status:500 });
  }
}
