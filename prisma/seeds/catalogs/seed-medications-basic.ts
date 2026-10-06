import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/// Bootstrap mínimo del catálogo de medicamentos para desarrollo/pruebas.
/// El formulario definitivo de cada institución debe ampliarse con un dataset curado real.
/// Uso: tsx prisma/seeds/catalogs/seed-medications-basic.ts

const basicMedications = [
  { name: 'Paracetamol', activeIngredient: 'Paracetamol', presentation: 'Tableta 500 mg', defaultRoute: 'Oral' },
  { name: 'Ibuprofeno', activeIngredient: 'Ibuprofeno', presentation: 'Tableta 400 mg', defaultRoute: 'Oral' },
  { name: 'Amoxicilina', activeIngredient: 'Amoxicilina', presentation: 'Cápsula 500 mg', defaultRoute: 'Oral' },
  { name: 'Omeprazol', activeIngredient: 'Omeprazol', presentation: 'Cápsula 20 mg', defaultRoute: 'Oral' },
  { name: 'Metformina', activeIngredient: 'Metformina', presentation: 'Tableta 850 mg', defaultRoute: 'Oral' },
  { name: 'Losartán', activeIngredient: 'Losartán potásico', presentation: 'Tableta 50 mg', defaultRoute: 'Oral' },
  { name: 'Salbutamol', activeIngredient: 'Salbutamol', presentation: 'Inhalador 100 mcg/dosis', defaultRoute: 'Inhalada' },
  { name: 'Loratadina', activeIngredient: 'Loratadina', presentation: 'Tableta 10 mg', defaultRoute: 'Oral' },
  { name: 'Diclofenaco', activeIngredient: 'Diclofenaco sódico', presentation: 'Ampolleta 75 mg/3 mL', defaultRoute: 'Intramuscular' },
  { name: 'Ceftriaxona', activeIngredient: 'Ceftriaxona', presentation: 'Frasco ámpula 1 g', defaultRoute: 'Intravenosa' },
  { name: 'Solución fisiológica 0.9%', activeIngredient: 'Cloruro de sodio', presentation: 'Solución 1000 mL', defaultRoute: 'Intravenosa' },
  { name: 'Metamizol sódico', activeIngredient: 'Metamizol sódico', presentation: 'Tableta 500 mg', defaultRoute: 'Oral' },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.medicationCatalogEntry.createMany({
      data: basicMedications,
      skipDuplicates: true,
    });
    console.log(`Catálogo de medicamentos: ${result.count} entradas nuevas insertadas.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error al poblar el catálogo de medicamentos:', error);
  process.exit(1);
});
