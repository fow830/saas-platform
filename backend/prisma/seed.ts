import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create plans
  const basicPlan = await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      description: 'Basic plan for individuals',
      price: 990,
      billingPeriod: 'MONTHLY',
      features: {
        maxRequests: 1000,
        support: 'email',
      },
      maxServices: 1,
      maxUsers: 1,
      trialDays: 7,
      sortOrder: 1,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      description: 'Professional plan for teams',
      price: 2990,
      billingPeriod: 'MONTHLY',
      features: {
        maxRequests: 10000,
        support: 'priority',
        api: true,
      },
      maxServices: 5,
      maxUsers: 5,
      trialDays: 14,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      description: 'Enterprise plan for large organizations',
      price: 9990,
      billingPeriod: 'MONTHLY',
      features: {
        maxRequests: 100000,
        support: 'dedicated',
        api: true,
        sso: true,
      },
      maxServices: -1,
      maxUsers: -1,
      trialDays: 30,
      sortOrder: 3,
    },
  });

  console.log({ basicPlan, proPlan, enterprisePlan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

