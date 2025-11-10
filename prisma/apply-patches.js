// Load environment variables from a .env file when present
require("dotenv").config();

const fs = require("fs").promises;
const path = require("path");
const { PrismaClient } = require("../prisma-client-app");

async function main() {
  const prisma = new PrismaClient();
  const sqlPath = path.join(__dirname, "raw", "pg-patches.sql");
  try {
    console.log("Reading SQL patches from", sqlPath);
    const sql = await fs.readFile(sqlPath, "utf8");
    console.log("Applying SQL patches...");
    // Split into executable statements, preserving DO $$ ... $$ blocks
    const statements = [];
    let buffer = "";
    let inDollarBlock = false;
    const lines = sql.split(/\r?\n/);
    for (const line of lines) {
      const l = line.trimEnd();
      // detect start/end of $$ blocks (simple heuristics)
      if (l.includes("$$")) {
        inDollarBlock = !inDollarBlock;
      }
      buffer += line + "\n";
      if (!inDollarBlock && /;\s*$/.test(l)) {
        const stmt = buffer.trim();
        if (stmt) statements.push(stmt);
        buffer = "";
      }
    }
    const last = buffer.trim();
    if (last) statements.push(last);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log("Patches applied successfully.");
  } catch (err) {
    console.error("Failed to apply patches.");
    // Provide useful debug output
    if (err && err.message) console.error("Error message:", err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("Error disconnecting prisma:", e);
    }
  }
}

// Run when executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
