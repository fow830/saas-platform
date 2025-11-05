const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const startAt = 32101; // requested starting simpleId

  // Select only non-admin users (projects), stable order by createdAt then id
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, simpleId: true, email: true },
  });

  let current = startAt;
  let updated = 0;

  for (const u of users) {
    const newSimpleId = String(current);
    if (u.simpleId !== newSimpleId) {
      await prisma.user.update({
        where: { id: u.id },
        data: { simpleId: newSimpleId },
      });
      updated += 1;
    }
    current += 1;
  }

  console.log(`Resequenced ${updated} users. Last assigned: ${current - 1}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


