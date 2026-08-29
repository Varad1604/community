import { NextResponse } from "next/server";
import { helpdeskTickets, ticketComments, notifications, units, unitMembers, userSocietyRoles, users } from "@/lib/db/schema";
import { requireAuthAndSociety } from "@/lib/api-helpers";
import { eq, and, desc } from "drizzle-orm";
import { withTenant } from "@/lib/db/withTenant";
import { audit } from "@/lib/audit";
import { getUserRoles } from "@/lib/tenant";
const transitions: Record<string, string[]> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("ticket:read");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const { societyId, sess } = auth as any;
    const roles = await getUserRoles(sess.userId, societyId);
    const isStaff = roles.some((r: string) => ["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER","SUPER_ADMIN"].includes(r));
    const data = await withTenant(societyId, sess.userId, async (tx) => {
      const [ticket] = await tx.select().from(helpdeskTickets).where(and(eq(helpdeskTickets.id, id), eq(helpdeskTickets.societyId, societyId)));
      if (!ticket) throw new Error("Not found");
      if (!isStaff) {
        const members = await tx.select().from(unitMembers).where(and(eq(unitMembers.userId, sess.userId), eq(unitMembers.societyId, societyId)));
        const unitIds = members.map(m => m.unitId);
        const isOwner = ticket.raisedBy === sess.userId || unitIds.includes(ticket.unitId);
        if (!isOwner) throw new Error("Forbidden");
      }
      const comments = await tx.select().from(ticketComments).where(eq(ticketComments.ticketId, id)).orderBy(desc(ticketComments.createdAt));
      return { ticket, comments };
    });
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.message === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAndSociety("ticket:manage");
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assigneeId, priority, category } = body;
    const { societyId, sess } = auth as any;
    const updated = await withTenant(societyId, sess.userId, async (tx) => {
      const [ticket] = await tx.select().from(helpdeskTickets).where(and(eq(helpdeskTickets.id, id), eq(helpdeskTickets.societyId, societyId)));
      if (!ticket) throw new Error("Not found");
      const patch: any = {};
      if (status) {
        if (!transitions[ticket.status]?.includes(status)) throw new Error(`Invalid transition ${ticket.status} -> ${status}`);
        patch.status = status;
      }
      if (assigneeId !== undefined) {
        if (assigneeId) {
          const [assignee] = await tx.select().from(users).where(eq(users.id, assigneeId));
          if (!assignee) throw new Error("Assignee not found");
          const roles = await tx.select().from(userSocietyRoles).where(and(eq(userSocietyRoles.userId, assigneeId), eq(userSocietyRoles.societyId, societyId)));
          if (roles.length === 0) throw new Error("Assignee not in society");
          const allowed = roles.some(r => ["SOCIETY_ADMIN","RWA_MEMBER","FACILITY_MANAGER","SECURITY_MANAGER","SUPER_ADMIN"].includes(r.role));
          if (!allowed) throw new Error("Assignee not authorized");
          patch.assigneeId = assigneeId;
        } else {
          patch.assigneeId = null;
        }
      }
      if (priority) {
        if (!["LOW","MEDIUM","HIGH","URGENT"].includes(priority)) throw new Error("Invalid priority");
        patch.priority = priority;
      }
      if (category) patch.category = category;
      if (Object.keys(patch).length === 0) return ticket;
      const [upd] = await tx.update(helpdeskTickets).set(patch).where(and(eq(helpdeskTickets.id, id), eq(helpdeskTickets.societyId, societyId))).returning();
      if (status) {
        await tx.insert(notifications).values({
          societyId,
          userId: ticket.raisedBy,
          title: `Ticket ${status}: ${ticket.title.slice(0,30)}`,
          body: `Status changed to ${status}`,
          channel: "IN_APP",
          relatedEntity: "ticket",
          relatedId: ticket.id,
        });
      }
      if (assigneeId) {
        await tx.insert(notifications).values({
          societyId,
          userId: assigneeId,
          title: `Assigned ticket: ${ticket.title.slice(0,30)}`,
          body: `You have been assigned`,
          channel: "IN_APP",
          relatedEntity: "ticket",
          relatedId: ticket.id,
        });
        await tx.insert(notifications).values({
          societyId,
          userId: ticket.raisedBy,
          title: `Ticket assigned: ${ticket.title.slice(0,30)}`,
          body: `Assigned to staff`,
          channel: "IN_APP",
          relatedEntity: "ticket",
          relatedId: ticket.id,
        });
      }
      return upd;
    });
    await audit({ actorId: sess.userId, societyId, action: "update", entity: "ticket", entityId: id, newState: updated });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.message.startsWith("Invalid transition")) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e.message === "Assignee not found" || e.message === "Assignee not in society" || e.message === "Assignee not authorized") return NextResponse.json({ error: e.message }, { status: 400 });
    if (e.message === "Invalid priority") return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
