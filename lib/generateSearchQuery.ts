
import { groq } from "./groq";
export async function generateSearchQuery(input: string) {
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