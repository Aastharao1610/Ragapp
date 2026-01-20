import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chats } from "@/lib/schema";
import { eq, asc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await ctx.params;
  const { userId } = await auth();

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔐 Verify chat belongs to user
  const chat = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);

  if (!chat.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(chatMessages);
}
