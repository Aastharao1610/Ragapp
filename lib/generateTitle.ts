import { db } from "@/lib/db";
import { chats } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { groq as aiGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function generateTitle(chatId: string, input: string) {
  console.log("generateTitle (Groq) called for:", chatId);

  try {
    const [chat] = await db
      .select({ title: chats.title })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    console.log("Current title:", chat?.title);

    // Only generate if empty
    if (
      !chat?.title ||
      chat.title.trim() === "" ||
      chat.title === "New Chat"
    ) {
      console.log("Generating title via Groq...");

      const prompt = `
Generate a short chat title (max 4 words) from this message.
Only return title. No quotes.

Message:
${input}
`;

      const { text } = await generateText({
        model: aiGroq("llama-3.1-8b-instant"),
        prompt,
        maxTokens: 20,
      });

      const title = text
        .trim()
        .replace(/["'*]/g, "")
        .slice(0, 50);

      console.log("Groq title:", title);

      if (!title) return null;

      const updated = await db
        .update(chats)
        .set({ title })
        .where(eq(chats.id, chatId))
        .returning();

      console.log("Update result:", updated);

      console.log(`🏷️ Chat renamed to: ${title}`);

      return title;
    }

    console.log("Title already exists");
    return chat?.title;
  } catch (err) {
    console.error("Title generation failed:", err);
    return null;
  }
}
