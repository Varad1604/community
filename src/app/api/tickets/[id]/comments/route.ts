import { NextResponse } from "next/server";
import { helpdeskTickets, ticketComments, notifications, unitMembers } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
import { getUserRoles } from "@/lib/tenant";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("ticket:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const roles = await getUserRoles(sess.userId, societyId);
    const isStaff = roles.some((r: string) => ["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
    const comments = await withTenant(societyId, sess.userId, async (tx) => {
      const [ticket] = await tx.select().from(helpdeskTickets).where(and(eq(helpdeskTickets.id, id), eq(helpdeskTickets.societyId, societyId)));
      if (!ticket) throw new Error("Not found");
      if (!isStaff) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        const unitIds = members.map(m => m.unitId);
        const isOwner = ticket.raisedBy === sess.userId || unitIds.includes(ticket.unitId);
        if (!isOwner) throw new Error("Forbidden");
      }
      return tx.select().from(ticketComments).where(eq(ticketComments.ticketId, id)).orderBy(desc(ticketComments.createdAt));
    });
    return NextResponse.json(comments);
  } catch (e: any) {
    if (e.message === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
const schema = z.object({ body: z.string().min(1).max(2000) });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("ticket:comment");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { societyId, sess } = auth as any;
    const roles = await getUserRoles(sess.userId, societyId);
    const isStaff = roles.some((r: string) => ["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
    const comment = await withTenant(societyId, sess.userId, async (tx) => {
      const [ticket] = await tx.select().from(helpdeskTickets).where(and(eq(helpdeskTickets.id, id), eq(helpdeskTickets.societyId, societyId)));
      if (!ticket) throw new Error("Not found");
      if (!isStaff) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        const unitIds = members.map(m => m.unitId);
        const isOwner = ticket.raisedBy === sess.userId || unitIds.includes(ticket.unitId);
        if (!isOwner) throw new Error("Forbidden");
      }
      const [created] = await tx.insert(ticketComments).values({ ticketId: id, authorId: sess.userId, body: parsed.data.body }).returning();
      const notifyUserId = ticket.raisedBy === sess.userId ? ticket.assigneeId : ticket.raisedBy;
      if (notifyUserId && notifyUserId !== sess.userId) {
        await tx.insert(notifications).values({
          societyId,
          userId: notifyUserId,
          title: `New comment on ${ticket.title.slice(0,30)}`,
          body: parsed.data.body.slice(0,100),
          channel: "IN_APP",
          relatedEntity: "ticket",
          relatedId: ticket.id,
        });
      } else if (!notifyUserId && ticket.raisedBy !== sess.userId) {
        await tx.insert(notifications).values({
          societyId,
          userId: ticket.raisedBy,
          title: `Staff replied: ${ticket.title.slice(0,30)}`,
          body: parsed.data.body.slice(0,100),
          channel: "IN_APP",
          relatedEntity: "ticket",
          relatedId: ticket.id,
        });
      }
      return created;
    });
    await audit({ actorId: sess.userId, societyId, action: "comment", entity: "ticket", entityId: id, newState: { body: parsed.data.body } });
    return NextResponse.json(comment, { status: 201 });
  } catch (e: any) {
    if (e.message === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
