import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.businessSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      workingHoursStart: '08:00',
      workingHoursEnd: '13:00',
      activeDays: [0, 1, 2, 3, 4],
      blockedDates: [],
      blockedHours: [],
      slotMinutes: 30
    }
  });

  await prisma.admin.upsert({
    where: { email: 'admin@hairsalon108.local' },
    update: {},
    create: {
      email: 'admin@hairsalon108.local',
      passwordHash: await bcrypt.hash('ChangeMe108!', 12)
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
