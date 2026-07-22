// Run with: npm run seed
// Creates the default departments/categories and the first admin account
// from the SEED_ADMIN_* values in your .env file.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_DEPARTMENTS = ['Production', 'Quality', 'Logistics', 'HR', 'IT', 'Finance', 'Management'];
const DEFAULT_CATEGORIES = ['Safety', 'Quality', 'Cost Reduction', 'Process Improvement', 'Environment', 'Other'];

async function main() {
  console.log('Seeding departments...');
  for (const name of DEFAULT_DEPARTMENTS) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seeding categories...');
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@yourcompany.com').toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`Admin account ${adminEmail} already exists — skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
    console.log(`Created admin account: ${adminEmail}`);
    console.log('IMPORTANT: log in and change this password immediately.');
  }

  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
