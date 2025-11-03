const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get max simpleId to generate next one
  const maxUser = await prisma.user.findFirst({
    orderBy: { simpleId: 'desc' },
    select: { simpleId: true },
  });
  
  let nextNumber = 1;
  if (maxUser && maxUser.simpleId) {
    const maxNumber = parseInt(maxUser.simpleId, 10);
    if (!isNaN(maxNumber)) {
      nextNumber = maxNumber + 1;
    }
  }
  const simpleId = nextNumber.toString().padStart(5, '0');
  
  const passwordHash = await bcrypt.hash('test123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      simpleId: simpleId,
      email: 'test@example.com',
      passwordHash: passwordHash,
      firstName: 'Test',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✓ Тестовый пользователь создан:');
  console.log('  Email: test@example.com');
  console.log('  Password: test123456');
  console.log('  User ID:', user.id);
  
  // Создаем также админа для тестирования
  // Get next simpleId for admin
  const maxUser2 = await prisma.user.findFirst({
    orderBy: { simpleId: 'desc' },
    select: { simpleId: true },
  });
  
  let nextNumber2 = 1;
  if (maxUser2 && maxUser2.simpleId) {
    const maxNumber2 = parseInt(maxUser2.simpleId, 10);
    if (!isNaN(maxNumber2)) {
      nextNumber2 = maxNumber2 + 1;
    }
  }
  const adminSimpleId = nextNumber2.toString().padStart(5, '0');
  
  const adminHash = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      simpleId: adminSimpleId,
      email: 'admin@example.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('\n✓ Администратор создан:');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123456');
  console.log('  User ID:', admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

