import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/// Carga/actualiza el catálogo CIE-10 desde un archivo CSV o JSON provisto por el usuario.
/// Uso: tsx prisma/seeds/catalogs/load-icd10.ts <ruta-al-archivo> [--delimiter=;]
///
/// Formatos soportados:
/// - CSV con encabezado: code,description[,chapter]
/// - JSON: arreglo de objetos { code, description, chapter? }

type Icd10Row = { code: string; description: string; chapter?: string | null };

function parseArgs(argv: string[]) {
  const filePath = argv.find((arg) => !arg.startsWith('--'));
  const delimiterArg = argv.find((arg) => arg.startsWith('--delimiter='));
  const delimiter = delimiterArg ? delimiterArg.split('=')[1] : ',';

  if (!filePath) {
    throw new Error(
      'Debes indicar la ruta del archivo CIE-10, ej: tsx prisma/seeds/catalogs/load-icd10.ts ./cie10.csv',
    );
  }

  return { filePath, delimiter };
}

function parseCsv(content: string, delimiter: string): Icd10Row[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0].split(delimiter).map((col) => col.trim().toLowerCase());
  const codeIndex = header.indexOf('code');
  const descriptionIndex = header.indexOf('description');
  const chapterIndex = header.indexOf('chapter');

  if (codeIndex === -1 || descriptionIndex === -1) {
    throw new Error(
      'El CSV debe tener encabezado con al menos las columnas "code" y "description".',
    );
  }

  return lines.slice(1).map((line) => {
    const columns = line.split(delimiter);
    return {
      code: columns[codeIndex]?.trim(),
      description: columns[descriptionIndex]?.trim(),
      chapter: chapterIndex !== -1 ? columns[chapterIndex]?.trim() || null : null,
    };
  });
}

function parseJson(content: string): Icd10Row[] {
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error('El JSON debe ser un arreglo de objetos { code, description, chapter? }.');
  }
  return parsed;
}

async function main() {
  const { filePath, delimiter } = parseArgs(process.argv.slice(2));
  const content = readFileSync(filePath, 'utf-8');
  const extension = extname(filePath).toLowerCase();

  const rows = extension === '.json' ? parseJson(content) : parseCsv(content, delimiter);
  const validRows = rows.filter((row) => row.code && row.description);

  if (validRows.length === 0) {
    console.log('No se encontraron filas válidas en el archivo. Nada que importar.');
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const batchSize = 1000;
    let imported = 0;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const data: Prisma.IcdCatalogEntryCreateManyInput[] = batch.map((row) => ({
        code: row.code,
        description: row.description,
        chapter: row.chapter ?? null,
      }));

      const result = await prisma.icdCatalogEntry.createMany({
        data,
        skipDuplicates: true,
      });
      imported += result.count;
    }

    console.log(
      `Catálogo CIE-10: ${validRows.length} filas leídas, ${imported} entradas nuevas insertadas (duplicados por código omitidos).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error al cargar el catálogo CIE-10:', error);
  process.exit(1);
});
