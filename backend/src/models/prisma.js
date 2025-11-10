// Centralized Prisma client singleton with a test injection hook
import { PrismaClient } from "../../../prisma-client-app/index.js";

let prisma = new PrismaClient();

export function getPrisma() {
  return prisma;
}

// Test-only: allow injecting a mock Prisma instance
export function setPrismaForTest(p) {
  prisma = p;
}
