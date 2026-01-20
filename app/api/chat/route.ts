import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats } from "@/lib/schema";
import { v4 as uuid } from "uuid";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = uuid();

  await db.insert(chats).values({
    id,
    title: null,
    userId,
  });

  return NextResponse.json({ id });
}
