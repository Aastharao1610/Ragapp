import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { title } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  await db.update(chats).set({ title: title.trim() }).where(eq(chats.id, id));

  return NextResponse.json({ success: true });
}
