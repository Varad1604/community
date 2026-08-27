import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
export async function GET() { try { const items = await db.select().from(bills).orderBy(desc(bills.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
export async function POST(req: Request) { try { const body = await req.json(); const [item] = await db.insert(bills).values(body).returning(); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
