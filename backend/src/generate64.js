import { readFileSync } from "fs";

function printJsonAsBase64(path) {
  const fileBuffer = readFileSync(path);
  const base64 = fileBuffer.toString("base64");
  console.log(base64);
}

// Usage:
printJsonAsBase64("./api.json");
