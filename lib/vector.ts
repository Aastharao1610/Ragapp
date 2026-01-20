// lib/vector.ts

// export type VectorItem = {
//   text: string;
//   embedding: number[];
// };

// const globalForVector = globalThis as unknown as {
//   vectorStore?: VectorItem[];
// };

// export const vectorStore =
//   globalForVector.vectorStore ?? (globalForVector.vectorStore = []);

export type VectorItem = {
  text: string;
  embedding: number[];
};

const globalForVector = globalThis as unknown as {
  vectorStore?: Record<string, VectorItem[]>;
};

export const vectorStore =
  globalForVector.vectorStore ?? (globalForVector.vectorStore = {});
