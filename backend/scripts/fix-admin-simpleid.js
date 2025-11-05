const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, simpleId: true, email: true },
  });

  let updated = 0;
  for (const admin of admins) {
    const isNumeric = !!admin.simpleId && /^[0-9]+$/.test(admin.simpleId);
    if (isNumeric) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { simpleId: uuidv4() },
      });
      updated += 1;
      console.log(`Updated admin ${admin.email}: simpleId -> UUID`);
    }
  }

  console.log(`Done. Updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


