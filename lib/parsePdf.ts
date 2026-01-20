import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Load pdf-parse as CommonJS (bypasses Turbopack)
const pdfParse = require("pdf-parse");

export async function parsePdfFromBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}
