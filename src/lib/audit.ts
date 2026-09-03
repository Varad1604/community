import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function audit(params: {
  actorId: string;
  societyId: string;
  action: string;
  entity: string;
  entityId?: string;
  prevState?: any;
  newState?: any;
  ip?: string;
  tx?: any;
}) {
  try {
    // Use the restricted app_user connection (db), NOT ownerDb, so that
    // REVOKE UPDATE, DELETE ON audit_logs FROM app_user is actually enforced.
    // ownerDb bypasses RLS and privilege restrictions — never use it here.
    const dbClient = params.tx || db;
    await dbClient.insert(auditLogs).values({
      actorId: params.actorId,
      societyId: params.societyId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      prevState: params.prevState,
      newState: params.newState,
      ip: params.ip,
    });
  } catch (err) {
    // Log loudly — a silent audit failure is a compliance violation.
    // In production, this should also publish to an out-of-band dead-letter queue.
    console.error("[AUDIT CRITICAL] Failed to record audit log — this is a compliance violation:", {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      actorId: params.actorId,
      error: err,
    });
  }
}

