// Load environment variables from a .env file when present
require('dotenv').config();

const { PrismaClient } = require('../prisma-client-app');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting messages archive job...');

    // Archive rule: move messages older than 15 days by updatedAt
    const insertSql = `
      INSERT INTO "messages_archive"
      SELECT *
      FROM "messages"
      WHERE "updatedAt" <= now() - interval '15 days'
      ON CONFLICT DO NOTHING;
    `;

    console.log('Inserting eligible messages into messages_archive...');
    await prisma.$executeRawUnsafe(insertSql);
    console.log('Insert complete.');

    const deleteSql = `
      DELETE FROM "messages"
      WHERE "updatedAt" <= now() - interval '15 days';
    `;

    console.log('Deleting archived messages from "messages" table...');
    await prisma.$executeRawUnsafe(deleteSql);
    console.log('Delete complete. Archive job finished successfully.');
  } catch (err) {
    console.error('Archive job failed with error:');
    if (err && err.message) console.error('Error message:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
