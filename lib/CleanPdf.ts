export function cleanPdfText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/-\n/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]+/g, "")
    .trim();
}