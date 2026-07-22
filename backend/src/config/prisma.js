const { PrismaClient } = require('@prisma/client');

// A single shared Prisma instance for the whole app.
const prisma = new PrismaClient();

module.exports = prisma;
