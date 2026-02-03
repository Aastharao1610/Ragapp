import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { chunkText } from "@/lib/chunkText";
import { embedText } from "@/lib/embedding";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { messages } from "@/lib/schema"; // Removed documentChunks as we use Pinecone now
import { desc, eq } from "drizzle-orm";
import { Pinecone } from "@pinecone-database/pinecone";
import { groq } from "@/lib/groq";
import { chats } from "@/lib/schema";
import { generateTitle } from "@/lib/generateTitle";

export const runtime = "nodejs";

function cleanPdfText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/-\n/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]+/g, "")
    .trim();
}



function parsePdfOutsideNext(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(process.cwd(), `temp-${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, buffer);

    const proc = spawn("node", ["pdf-worker/run.cjs", tempPath]);

    let output = "";
    let error = "";

    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.stderr.on("data", (e) => (error += e.toString()));

    proc.on("close", (code) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (code !== 0) {
        console.error("PDF worker error:", error);
        reject(new Error("PDF parsing failed"));
      } else {
        resolve(output);
      }
    });
  });
}

// --- Main Route ---

export async function POST(req: Request) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index("ragapp");

  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const chatId = formData.get("chatId") as string;
    const file = formData.get("file");

    if (!chatId || !file || typeof file === "string") {
      return NextResponse.json(
        { error: "Missing chatId or PDF file" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Extract and Clean Text
    const rawText = await parsePdfOutsideNext(buffer);
    const text = cleanPdfText(rawText);
    // 🏷️ Auto-generate chat title from PDF
    const [chat] = await db
      .select({ title: chats.title })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat?.title || chat.title === "New Chat") {
      const title = await generateTitle(chatId, text);

      await db.update(chats).set({ title }).where(eq(chats.id, chatId));

      console.log("🏷️ Chat title generated from PDF:", title);
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text found in PDF" },
        { status: 400 },
      );
    }

    // 2. Insert Message Record into Neon/Postgres
    await db.insert(messages).values({
      chatId,
      userId,
      type: "file",
      fileName: (file as File).name,
      role: "user",
      content: `Uploaded file: ${(file as File).name}`,
    });

    // 3. Chunk and Embed
    const chunks = chunkText(text);
    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await embedText(chunk);
        return {
          content: chunk,
          values: embedding as number[],
        };
      }),
    );

    // 4. Sync to Pinecone (Skipping SQL insert for vectors to avoid parameter limits)
    try {
      const vectors = embeddings.map((item, idx) => ({
        id: `${chatId}-${idx}-${Date.now()}`, // Unique ID
        values: item.values,
        metadata: {
          chatId,
          content: item.content, // Crucial for retrieval
        },
      }));

      // Pinecone handles batches efficiently
      await index.upsert(vectors);
      console.log("🌲 Successfully synced to Pinecone");
    } catch (pcError) {
      console.error("Pinecone Sync Error:", pcError);
      return NextResponse.json(
        { error: "Vector DB sync failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      chunks: chunks.length,
      message: "PDF processed and vectors stored in Pinecone",
    });
  } catch (err) {
    console.error("Global Upload error:", err);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 },
    );
  }
}
