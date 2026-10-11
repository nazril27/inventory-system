import { execSync } from 'node:child_process';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { prisma } from '../../prisma/prisma.js';

const getDatabaseURL = () => {
  const url = process.env.TEST_DB_URL;
  if (!url) {
    throw new Error(
      'Harap sediakan TEST_DB_URL atau DATABASE_URL di environment variables.'
    );
  }
  return url;
};

const databaseUrl = getDatabaseURL();
process.env.DATABASE_URL = databaseUrl;

beforeAll(async () => {
  // Push schema Prisma ke database testing sebelum seluruh test suite berjalan
  try {
    execSync('npx prisma db push --accept-data-loss', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'ignore',
    });
  } catch (_error) {}
});

beforeEach(async () => {
  // Bersihkan semua tabel sesuai urutan relasi/foreign key sebelum setiap test case
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.token.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // Disconnect prisma client setelah pengujian selesai
  await prisma.$disconnect();
});
