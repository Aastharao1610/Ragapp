const fs = require("fs");
const { parsePdf } = require("./parse.cjs");

const filePath = process.argv[2];

(async () => {
  try {
    const buffer = fs.readFileSync(filePath);
    const text = await parsePdf(buffer);
    process.stdout.write(text);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
