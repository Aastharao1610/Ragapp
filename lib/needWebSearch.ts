import { groq } from "./groq";

export async function needsWebSearch(input: string) {
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
