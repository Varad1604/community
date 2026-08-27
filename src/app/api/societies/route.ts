import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { societies } from "@/lib/db/schema";

export async function GET() {
  try {
    const items = await db.select().from(societies);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Failed to fetch societies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [item] = await db.insert(societies).values(body).returning();
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create society" }, { status: 500 });
  }
}
