import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const SESSION_COOKIE = "app_session";

export async function createSession(userId: string) {
  const sessionId = randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  cookies().set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session) return null;

  if (new Date() > session.expiresAt) return null;

  return session;
}
