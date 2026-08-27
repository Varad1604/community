import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { helpdeskTickets } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
export async function GET() { try { const items = await db.select().from(helpdeskTickets).orderBy(desc(helpdeskTickets.createdAt)).limit(50); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
export async function POST(req: Request) { try { const body = await req.json(); const [item] = await db.insert(helpdeskTickets).values(body).returning(); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
