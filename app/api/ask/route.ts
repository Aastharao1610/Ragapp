// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { messages, chats } from "@/lib/schema";
// import { eq, desc, count, and, or, ne } from "drizzle-orm";
// import { auth } from "@clerk/nextjs/server";
// // import { embedText } from "@/lib/embedding";
// // import { streamText, stepCountIs } from "ai";
// // import { groq as aiGroq } from "@ai-sdk/groq";
// // import { Pinecone } from "@pinecone-database/pinecone";
// import { runTavilySearch } from "@/lib/tavilySearch";
// import { generateSearchQuery } from "@/lib/generateSearchQuery";
// import { needsWebSearch } from "@/lib/needWebSearch";
// import { generateTitle } from "@/lib/generateTitle";
// import { getRagChain } from "@/lib/langchain/rag";


// export async function POST(req: Request) {
//   console.log("Api of ask called ")
//   const { userId } = await auth();

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
//   // const index = pc.index("ragapp");

//   const { question, chatId } = await req.json();
//   if (!chatId) {
//     return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
//   }

//   const finalQuestion =
//     question?.trim() ||
//     "Please summarize the uploaded document clearly and concisely.";



//   if (/^(hi|hello|hey|hii|hiii)$/i.test(finalQuestion.trim())) {
//     const greeting = "Hi! 😊 How can I help you today?";

//     await db.insert(messages).values({
//       chatId,
//       userId,
//       role: "assistant",
//       content: greeting,
//     });

//     return NextResponse.json({ answer: greeting });
//   }

//   /* Save user message */

//   const [existingChat] = await db
//     .select()
//     .from(chats)
//     .where(eq(chats.id, chatId));

//   if (!existingChat) {
//     await db.insert(chats).values({
//       id: chatId,
//       userId,
//       title: "New Chat",
//     });
//   }

//   // 2️⃣ Save user message
//   await db.insert(messages).values({
//     chatId,
//     userId,
//     role: "user",
//     content: finalQuestion,
//   });

//   // 3️⃣ Generate title
//   await generateTitle(chatId, finalQuestion);
// // 🔗 LangChain RAG
// const chain = await getRagChain();

// const response = await chain.call({
//   query: finalQuestion,
// });

// let answer = response.text;

// if (!answer || answer.trim() === "") {
//   answer = "I couldn’t find relevant information.";
// }

//   /* Load recent conversation */
//   const history = await db
//     .select()
//     .from(messages)
//     .where(eq(messages.chatId, chatId))
//     .orderBy(desc(messages.createdAt))
//     .limit(12);

//   const conversation = history
//     .reverse()
//     .map((m) => `${m.role}: ${m.content}`)
//     .join("\n");

//   /* 🧠 Decide if web search needed */
//   const classifierInput = `
// Conversation:
// ${conversation}

// User question:
// ${finalQuestion}
// `;

//   let shouldSearch = await needsWebSearch(classifierInput);
//   console.log("🤖 shouldSearch:", shouldSearch);

//   /* 🌍 Run Web Search */
//   let webResults: any[] = [];

//   if (shouldSearch) {
//     const searchQuery = await generateSearchQuery(classifierInput);
//     console.log("🔍 Generated search query:", searchQuery);

//     webResults = await runTavilySearch(searchQuery);

//     // Retry once if empty
//     if (webResults.length === 0) {
//       console.log("🔁 Retrying Tavily...");
//       webResults = await runTavilySearch(searchQuery + " latest official");
//     }
//   }

//   const hasWebData = webResults.length > 0;
//   console.log("🌍 Web Results count:", webResults.length);

//   const webContext = hasWebData
//     ? webResults
//       .map(
//         (r, i) => `
// Source ${i + 1}
// Title: ${r.title}
// Summary: ${r.content?.slice(0, 400)}
// `,
//       )
//       .join("\n")
//     : "";

//   /* 📄 Vector Search (PDF RAG) */
//   // const queryEmbedding = (await embedText(finalQuestion)) as number[];

//   // const queryResult = await index.query({
//   //   vector: queryEmbedding,
//   //   topK: 6,
//   //   includeMetadata: true,
//   //   filter: { chatId },
//   // });

//   // const topChunks = (queryResult.matches || [])
//   //   .map((m) => m.metadata?.content as string)
//   //   .filter(Boolean)
//   //   .join("\n\n");

//   // const hasPdfContext = topChunks.trim().length > 50;

//   // console.log("📄 Pinecone chunks found:", queryResult.matches?.length || 0);
//   // console.log("📄 hasPdfContext:", hasPdfContext);

//   /* 🧾 Prompt */
// //   const prompt = `
// // Conversation so far:
// // ${conversation}

// // ${hasPdfContext ? `Relevant document context:\n${topChunks}` : ""}

// // ${hasWebData ? `Web search results:\n${webContext}` : ""}

// // User question:
// // ${finalQuestion}

// // IMPORTANT:
// // ${hasWebData
// //       ? "- Use ONLY web search results."
// //       : hasPdfContext
// //         ? "- Use the document context when relevant."
// //         : "- Answer normally."
// //     }
// // `;

// //   const systemPrompt = `
// // You are a helpful, accurate AI assistant.

// // Rules:
// // - Be clear and concise.
// // - Never invent facts.
// // - Do not mention internal systems or tools.
// // - If web data is present, rely strictly on it.
// // - Do NOT say phrases like "general knowledge", "I think", or "not connected to internet".
// // `;

// //   const result = await streamText({
// //     model: aiGroq("llama-3.1-8b-instant"),
// //     messages: [
// //       { role: "system", content: systemPrompt },
// //       { role: "user", content: prompt },
// //     ],
// //     stopWhen: stepCountIs(5),
// //   });

// //   let answer = await result.text;

//   if (!answer || answer.trim().length === 0) {
//     answer = "I couldn’t find reliable information for this question.";
//   }

//   await db.insert(messages).values({
//     chatId,
//     userId,
//     role: "assistant",
//     content: answer.trim(),
//   });

//   return NextResponse.json({ answer });
// }


import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chats } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { generateTitle } from "@/lib/generateTitle";
import { getRagChain } from "@/lib/langchain/rag";

export async function POST(req: Request) {
  console.log("Api of ask called");

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, chatId } = await req.json();

  if (!chatId) {
    return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
  }

  const finalQuestion =
    question?.trim() ||
    "Please summarize the uploaded document clearly.";

  // Handle greeting
  if (/^(hi|hello|hey|hii|hiii)$/i.test(finalQuestion)) {
    const greeting = "Hi! 😊 How can I help you today?";

    await db.insert(messages).values({
      chatId,
      userId,
      role: "assistant",
      content: greeting,
    });

    return NextResponse.json({ answer: greeting });
  }

  // 1️⃣ Ensure chat exists
  await db
    .insert(chats)
    .values({
      id: chatId,
      userId,
      title: "New Chat",
    })
    .onConflictDoNothing();

  // 2️⃣ Save user message
  await db.insert(messages).values({
    chatId,
    userId,
    role: "user",
    content: finalQuestion,
  });

  // 3️⃣ Generate title
  await generateTitle(chatId, finalQuestion);

  // 4️⃣ LangChain RAG
  const chain = await getRagChain();

  const response = await chain.call({
    query: finalQuestion,
  });

  let answer = response.text?.trim();

  if (!answer) {
    answer = "I couldn’t find relevant information.";
  }

  // 5️⃣ Save assistant reply
  await db.insert(messages).values({
    chatId,
    userId,
    role: "assistant",
    content: answer,
  });

  return NextResponse.json({ answer });
}
