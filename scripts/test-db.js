const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.businessSettings
  .findMany()
  .then((rows) => {
    console.log(`rows=${rows.length}`);
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
