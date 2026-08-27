import { db, pool } from "@/lib/db";
import { sql } from "drizzle-orm";
export async function withTenant<T>(societyId: string, userId: string, fn: () => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.society_id', $1, true), set_config('app.user_id', $2, true)", [societyId, userId]);
    const result = await fn();
    return result;
  } finally {
    client.release();
  }
}
export async function setTenantContext(societyId: string, userId: string) {
  await db.execute(sql`SELECT set_config('app.society_id', ${societyId}, true), set_config('app.user_id', ${userId}, true)`);
}
