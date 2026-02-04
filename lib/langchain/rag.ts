import { RetrievalQAChain } from "langchain/chains";
import { llm } from "./llm";
import { getVectorStore } from "./vector";

export async function getRagChain() {
   const vectorStore = await getVectorStore();

   const retriever = vectorStore.asRetriever({
      k: 5,
   });

   return RetrievalQAChain.fromLLM(llm, retriever, {
      returnSourceDocuments: true,
   });
}
