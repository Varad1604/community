import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema";

const runtimeUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL!;
const pool = new Pool({
  connectionString: runtimeUrl,
});

export const db = drizzle(pool, { schema });
export { pool };
