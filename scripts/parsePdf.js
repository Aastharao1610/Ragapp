import fs from "fs";
import pdf from "pdf-parse";

export async function parsePdfFromBuffer(buffer) {
  const data = await pdf(buffer);
  return data.text || "";
}
