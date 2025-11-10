import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  // Point Prisma CLI to the Postgres app schema only
  schema: "./prisma/app.schema.prisma",
});
