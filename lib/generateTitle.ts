// import { groq } from "./groq";
// export async function generateTitleFromPdf(text: string) {
//   const completion = await groq.chat.completions.create({
//     model: "llama-3.1-8b-instant",
//     messages: [
//       {
//         role: "system",
//         content:
//           "Generate a short meaningful chat title from this document. Max 6 words. No punctuation.",
//       },
//       {
//         role: "user",
//         content: text.slice(0, 1500),
//       },
//     ],
//     temperature: 0.3,
//     max_tokens: 15,
//   });

//   return (
//     completion.choices[0]?.message?.content?.replace(/["'.]/g, "").trim() ||
//     "Uploaded Document"
//   );
// }

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { chats } from "@/lib/schema";
import { eq } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generates a chat title based on either a PDF's content or a user's question.
 * Then updates the database if the title is currently missing or generic.
 */
export async function generateTitle(chatId: string, input: string) {
  try {
    // 1. Check if chat already has a meaningful title
    const [chat] = await db
      .select({ title: chats.title })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chat?.title && chat.title !== "New Chat") {
      return; // Skip if title already exists
    }

    // 2. Prepare the Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const isPdf = input.length > 500; // Heuristic to detect if we passed full document text
    
    const prompt = isPdf 
      ? `Generate a short meaningful title (max 5 words) for a chat based on this document excerpt: "${input.slice(0, 2000)}". Respond with ONLY the title.`
      : `Generate a short descriptive title (max 4 words) for a chat that starts with this question: "${input}". Respond with ONLY the title.`;

    const result = await model.generateContent(prompt);
    const generatedTitle = result.response.text().trim().replace(/[*"']/g, "");

    // 3. Update the Database
    await db
      .update(chats)
      .set({ title: generatedTitle })
      .where(eq(chats.id, chatId));

    console.log(`🏷️ Chat ${chatId} renamed to: ${generatedTitle}`);
    return generatedTitle;
  } catch (error) {
    console.error("Failed to generate chat title:", error);
    return null;
  }
}