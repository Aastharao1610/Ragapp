import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export function parsePdfOutsideNext(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(process.cwd(), `temp-${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, buffer);

    const proc = spawn("node", ["pdf-worker/run.cjs", tempPath]);

    let output = "";
    let error = "";

    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.stderr.on("data", (e) => (error += e.toString()));

    proc.on("close", (code) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (code !== 0) {
        console.error("PDF worker error:", error);
        reject(new Error("PDF parsing failed"));
      } else {
        resolve(output);
      }
    });
  });
}