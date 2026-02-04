import { getVectorStore } from "./vectorStore";

export async function getRetriever(namespace: string) {
  const vectorStore = await getVectorStore(namespace);
console.log(vectorStore , "Vectorstore")
  return vectorStore.asRetriever({
    k: 6,
  });
}
