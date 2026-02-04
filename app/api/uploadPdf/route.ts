import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunkText";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { messages } from "@/lib/schema"; // Removed documentChunks as we use Pinecone now
import {  eq } from "drizzle-orm";
import { chats } from "@/lib/schema";
import { generateTitle } from "@/lib/generateTitle";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "@/lib/langchain/vectorStore";
import { parsePdfOutsideNext } from "@/lib/parsePdfOutside";
import { cleanPdfText } from "@/lib/CleanPdf";
import { uploadPdfToCloudinary } from "@/lib/langchain/uploadCloudinary";
import { documents } from "@/lib/schema";
export const runtime = "nodejs";


export async function POST(req: Request) {
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
    const uploadResult = await uploadPdfToCloudinary(
  buffer,
  (file as File).name
);

await db.insert(documents).values({
  chatId,
  userId,
  fileName: (file as File).name,
  fileUrl: uploadResult.url,          // 👈 Cloudinary URL
  cloudinaryId: uploadResult.publicId,
  status: "uploaded",
});

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
   
    const docs = chunks.map(
  (chunk) =>
    new Document({
      pageContent: chunk,
      metadata: {
        chatId,
        source: uploadResult.url,   // 👈 Cloudinary URL
        fileName: (file as File).name,
      },
    })
);
console.log("Sending to pinecone...")
try {
    const vectorStore = await getVectorStore(chatId);
    await vectorStore.addDocuments(docs); // <--- THIS IS THE MISSING "SEND" BUTTON
    console.log("PINECOne UPSERT SUCCESSFUL");
} catch (pineconeErr) {
    console.error(" Pinecone Upsert Error:", pineconeErr);
    throw pineconeErr; // This ensures it hits your catch block
}
    

    console.log("EMBEDDED DOCS COUNT:", docs.length);
console.log("NAMESPACE:", chatId);

    await db
  .update(documents)
  .set({ status: "embedded" })
  .where(eq(documents.chatId, chatId));


    
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
