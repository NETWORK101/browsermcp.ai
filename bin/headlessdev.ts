#!/usr/bin/env npx tsx

if (process.argv.includes("init")) {
  console.log("init not yet implemented");
  process.exit(0);
}

await import("../src/index.js");
