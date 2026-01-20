export function cosinSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * b[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
export function findTopK(
  queryEmbedding: number[],
  documents: { text: string; embedding: number[] }[],
  k = 4
) {
  return documents
    .map((doc) => ({
      ...doc,
      score: cosinSimilarity(queryEmbedding, doc.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
