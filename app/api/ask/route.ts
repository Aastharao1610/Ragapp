import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chats } from "@/lib/schema";
import { eq, desc, count, and, or, ne } from "drizzle-orm";
import { embedText } from "@/lib/embedding";
import { groq } from "@/lib/groq";
import { auth } from "@clerk/nextjs/server";
import { streamText, stepCountIs } from "ai";
import { groq as aiGroq } from "@ai-sdk/groq";
import { Pinecone } from "@pinecone-database/pinecone";

async function runTavilySearch(query: string) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVIY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results: 5,
    }),
  });

  const data = await res.json();
  return data?.results || [];
}

async function generateSearchQuery(input: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You generate precise web search queries.

Rules:
- Extract key entities (names, places, dates, products).
- Remove filler and conversational words.
- Keep under 15 words.
- Optimize for factual retrieval.
Return ONLY the query text.
`,
      },
      { role: "user", content: input },
    ],
  });

  return res.choices[0]?.message?.content?.trim() || input;
}

async function needsWebSearch(input: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are a classifier.
Return ONLY JSON.

Return {"needsSearch": true} if answering requires current, factual, or real-world data.
Return {"needsSearch": false} if it can be answered from general knowledge.
`,
      },
      { role: "user", content: input },
    ],
  });

  try {
    return (
      JSON.parse(res.choices[0].message.content || "{}").needsSearch === true
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index("ragapp");

  const { question, chatId } = await req.json();
  if (!chatId) {
    return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
  }

  const finalQuestion =
    question?.trim() ||
    "Please summarize the uploaded document clearly and concisely.";

  if (/^(hi|hello|hey|hii|hiii)$/i.test(finalQuestion.trim())) {
    const greeting = "Hi! 😊 How can I help you today?";

    await db.insert(messages).values({
      chatId,
      userId,
      role: "assistant",
      content: greeting,
    });

    return NextResponse.json({ answer: greeting });
  }

  /* Save user message */
  await db.insert(messages).values({
    chatId,
    userId,
    role: "user",
    content: finalQuestion,
  });

  /* Load recent conversation */
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(12);

  const conversation = history
    .reverse()
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  /* 🧠 Decide if web search needed */
  const classifierInput = `
Conversation:
${conversation}

User question:
${finalQuestion}
`;

  let shouldSearch = await needsWebSearch(classifierInput);
  console.log("🤖 shouldSearch:", shouldSearch);

  /* 🌍 Run Web Search */
  let webResults: any[] = [];

  if (shouldSearch) {
    const searchQuery = await generateSearchQuery(classifierInput);
    console.log("🔍 Generated search query:", searchQuery);

    webResults = await runTavilySearch(searchQuery);

    // Retry once if empty
    if (webResults.length === 0) {
      console.log("🔁 Retrying Tavily...");
      webResults = await runTavilySearch(searchQuery + " latest official");
    }
  }

  const hasWebData = webResults.length > 0;
  console.log("🌍 Web Results count:", webResults.length);

  const webContext = hasWebData
    ? webResults
        .map(
          (r, i) => `
Source ${i + 1}
Title: ${r.title}
Summary: ${r.content?.slice(0, 400)}
`,
        )
        .join("\n")
    : "";

  /* 📄 Vector Search (PDF RAG) */
  const queryEmbedding = (await embedText(finalQuestion)) as number[];

  const queryResult = await index.query({
    vector: queryEmbedding,
    topK: 6,
    includeMetadata: true,
    filter: { chatId },
  });

  const topChunks = (queryResult.matches || [])
    .map((m) => m.metadata?.content as string)
    .filter(Boolean)
    .join("\n\n");

  const hasPdfContext = topChunks.trim().length > 50;

  console.log("📄 Pinecone chunks found:", queryResult.matches?.length || 0);
  console.log("📄 hasPdfContext:", hasPdfContext);

  /* 🧾 Prompt */
  const prompt = `
Conversation so far:
${conversation}

${hasPdfContext ? `Relevant document context:\n${topChunks}` : ""}

${hasWebData ? `Web search results:\n${webContext}` : ""}

User question:
${finalQuestion}

IMPORTANT:
${
  hasWebData
    ? "- Use ONLY web search results."
    : hasPdfContext
      ? "- Use the document context when relevant."
      : "- Answer normally."
}
`;

  const systemPrompt = `
You are a helpful, accurate AI assistant.

Rules:
- Be clear and concise.
- Never invent facts.
- Do not mention internal systems or tools.
- If web data is present, rely strictly on it.
- Do NOT say phrases like "general knowledge", "I think", or "not connected to internet".
`;

  const result = await streamText({
    model: aiGroq("llama-3.1-8b-instant"),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    stopWhen: stepCountIs(5),
  });

  let answer = await result.text;

  if (!answer || answer.trim().length === 0) {
    answer = "I couldn’t find reliable information for this question.";
  }

  await db.insert(messages).values({
    chatId,
    userId,
    role: "assistant",
    content: answer.trim(),
  });

  return NextResponse.json({ answer });
}
