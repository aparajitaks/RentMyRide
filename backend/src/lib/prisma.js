const { PrismaClient } = require('@prisma/client')

// Single Prisma Client instance to be shared across the application
const prisma = new PrismaClient()

module.exports = prisma
