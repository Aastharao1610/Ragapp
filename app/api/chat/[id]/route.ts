import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  console.log("🗑️ Deleting chat:", id);

  await db.delete(chats).where(eq(chats.id, id));

  return NextResponse.json({ success: true });
}
