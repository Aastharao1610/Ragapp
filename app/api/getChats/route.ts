import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export const runtime ='nodejs'; 
export async function GET(req :any) {
// console.log("🍪 RAW COOKIE HEADER:", req.headers.get("cookie"));

  const { userId ,sessionId } =await auth();
  console.log("/getchats called")
  console.log("Testing userID" ,userId)
  console.log("Testing Session id" , sessionId)


  console.log("CLERK_SECRET_KEY present:", !!process.env.CLERK_SECRET_KEY);
console.log(
  "CLERK_SECRET_KEY prefix:",
  process.env.CLERK_SECRET_KEY?.slice(0, 7)
);

  console.log(userId, "API User userID");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt));
  return NextResponse.json(userChats);
}
