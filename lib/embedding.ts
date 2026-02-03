// import { pipeline } from "@xenova/transformers";

// let embedder: any;

// export async function embedText(text: string) {
//   if (!embedder) {
//     embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
//   }

//   const output = await embedder(text, {
//     pooling: "mean",
//     normalize: true,
//   });

//   return Array.from(output.data);
// }

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI =new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
export async function embedText(text:string):Promise<number[]> {
 try{
  // const model= genAI.getGenerativeModel({model :"gemini-embedding-001"})
  // const result=await model.embedContent(text);
  // const embedding =result.embedding;
  // return embedding.values;
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const result = await model.embedContent({
      content: { 
        role: "user", 
        parts: [{ text }] 
      },

      outputDimensionality: 384,         // 🔥 Explicitly matches your Pinecone index
    });

    return result.embedding.values;

 } catch(error){
  console.error("Gemini Embedding Error" ,error)
  throw new Error("Failed to generate embedding ")
 }
}