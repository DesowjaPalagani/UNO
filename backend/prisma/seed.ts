import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const password = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      password,
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      password,
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      password,
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
  });

  // Create statistics for users
  await prisma.gameStatistic.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      totalGames: 5,
      wins: 3,
      losses: 2,
      winRate: 60,
    },
  });

  await prisma.gameStatistic.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      totalGames: 8,
      wins: 4,
      losses: 4,
      winRate: 50,
    },
  });

  await prisma.gameStatistic.upsert({
    where: { userId: user3.id },
    update: {},
    create: {
      userId: user3.id,
      totalGames: 3,
      wins: 1,
      losses: 2,
      winRate: 33.33,
    },
  });

  console.log('Seeding completed!');
  console.log('Test users created:');
  console.log(`  Email: alice@example.com | Username: alice | Password: password123`);
  console.log(`  Email: bob@example.com | Username: bob | Password: password123`);
  console.log(`  Email: charlie@example.com | Username: charlie | Password: password123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
