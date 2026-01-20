import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "../../../lib/schema";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: Response) {
  console.log("🔥 /api/auth HIT");
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  console.log(existingUser, "existingUser");
  console.log("🔐 API AUTH:", {
    clerkUserId: userId,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress,
  });

  if (existingUser.length === 0) {
    await db.insert(users).values({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
    });
  }
  return NextResponse.json({ success: true });
}
