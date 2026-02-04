import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

const pc = new Pinecone({
   apiKey: process.env.PINECONE_API_KEY!,
});

export async function getVectorStore() {
   const index = pc.index("ragapp");

   const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY!,
   });

   return await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex: index }
   );
}
