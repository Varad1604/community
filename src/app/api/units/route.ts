import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const items = await db.select().from(units).orderBy(desc(units.createdAt)).limit(100);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [item] = await db.insert(units).values(body).returning();
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create unit" }, { status: 500 });
  }
}
