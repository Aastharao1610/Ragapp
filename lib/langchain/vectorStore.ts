import "server-only";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { embeddings } from "./embedding";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function getVectorStore(namespace: string) {
  const index = pc.index("airag-gemini-768"); // IMPORTANT: 768 index

  const stats = await index.describeIndexStats();
  console.log("📊 Pinecone Index Stats:", JSON.stringify(stats.namespaces));
  console.log("🔍 Looking for Namespace:", namespace);
  return new PineconeStore(embeddings, {
    pineconeIndex: index,
    namespace,
    textKey: "text", 
  });
}
