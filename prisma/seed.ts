import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { buildSeedContext } from './seeds/_context';
import { cleanupSeed } from './seeds/00-cleanup.seed';
import { seedCore } from './seeds/01-core.seed';
import { seedAuth } from './seeds/02-auth.seed';
import { seedPatients } from './seeds/03-patients.seed';
import { seedClinical } from './seeds/04-clinical.seed';
import { seedSupport } from './seeds/05-support.seed';
import { seedLegalAndAudit } from './seeds/06-legal-audit.seed';
import { seedEncounterRecords } from './seeds/07-encounter-records.seed';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const ctx = buildSeedContext();
  const deps = { prisma, ctx };

  await cleanupSeed(deps);
  await seedCore(deps);
  await seedAuth(deps);
  await seedPatients(deps);
  await seedClinical(deps);
  await seedSupport(deps);
  await seedLegalAndAudit(deps);
  await seedEncounterRecords(deps);

  console.log('Seed completado');
  console.log('Seed dividido por dominios');
}

main()
  .catch((error) => {
    console.error('Error al ejecutar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
