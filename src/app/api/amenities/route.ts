import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amenities } from "@/lib/db/schema";
export async function GET() { try { const items = await db.select().from(amenities); return NextResponse.json(items); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); } }
export async function POST(req: Request) { try { const body = await req.json(); const [item] = await db.insert(amenities).values(body).returning(); return NextResponse.json(item, { status: 201 }); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
