import { ownerDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
export async function audit(params: { actorId: string; societyId: string; action: string; entity: string; entityId?: string; prevState?: any; newState?: any; ip?: string }) {
  try {
    await ownerDb.insert(auditLogs).values({
      actorId: params.actorId,
      societyId: params.societyId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      prevState: params.prevState,
      newState: params.newState,
      ip: params.ip,
    });
  } catch {}
}
