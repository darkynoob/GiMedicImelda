import { randomUUID } from 'node:crypto';
import { FacilityType, SpecialtyCategory, TenantStatus } from '@prisma/client';
import type { SeedDeps } from './_context';

type SeedSpecialtyDefinition = {
  category: SpecialtyCategory;
  name: string;
};

const seedSpecialtyCatalog: SeedSpecialtyDefinition[] = [
  { category: SpecialtyCategory.BASIC, name: 'Medicina general' },
  { category: SpecialtyCategory.BASIC, name: 'Medicina familiar' },
  {
    category: SpecialtyCategory.CLINICAL,
    name: 'Alergología e inmunología',
  },
  { category: SpecialtyCategory.CLINICAL, name: 'Cardiología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Dermatología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Endocrinología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Gastroenterología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Geriatría' },
  { category: SpecialtyCategory.CLINICAL, name: 'Hematología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Infectología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Medicina interna' },
  { category: SpecialtyCategory.CLINICAL, name: 'Nefrología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Neumología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Neurología' },
  { category: SpecialtyCategory.CLINICAL, name: 'Oncología médica' },
  { category: SpecialtyCategory.CLINICAL, name: 'Psiquiatría' },
  { category: SpecialtyCategory.CLINICAL, name: 'Reumatología' },
  {
    category: SpecialtyCategory.SURGICAL,
    name: 'Cirugía cardiovascular',
  },
  { category: SpecialtyCategory.SURGICAL, name: 'Cirugía general' },
  { category: SpecialtyCategory.SURGICAL, name: 'Cirugía oncológica' },
  { category: SpecialtyCategory.SURGICAL, name: 'Cirugía pediátrica' },
  {
    category: SpecialtyCategory.SURGICAL,
    name: 'Cirugía plástica y reconstructiva',
  },
  { category: SpecialtyCategory.SURGICAL, name: 'Cirugía torácica' },
  {
    category: SpecialtyCategory.SURGICAL,
    name: 'Ginecología y obstetricia',
  },
  { category: SpecialtyCategory.SURGICAL, name: 'Neurocirugía' },
  { category: SpecialtyCategory.SURGICAL, name: 'Oftalmología' },
  { category: SpecialtyCategory.SURGICAL, name: 'Otorrinolaringología' },
  {
    category: SpecialtyCategory.SURGICAL,
    name: 'Traumatología y ortopedia',
  },
  { category: SpecialtyCategory.SURGICAL, name: 'Urología' },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Anestesiología',
  },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Medicina del deporte',
  },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Medicina del dolor',
  },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Medicina de rehabilitación',
  },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Medicina nuclear',
  },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Medicina preventiva',
  },
  { category: SpecialtyCategory.DIAGNOSTIC_SUPPORT, name: 'Patología' },
  {
    category: SpecialtyCategory.DIAGNOSTIC_SUPPORT,
    name: 'Radiología e imagen',
  },
  { category: SpecialtyCategory.DIAGNOSTIC_SUPPORT, name: 'Salud pública' },
  {
    category: SpecialtyCategory.COMPLEMENTARY,
    name: 'Nutriología clínica',
  },
  {
    category: SpecialtyCategory.COMPLEMENTARY,
    name: 'Odontología / Estomatología',
  },
  {
    category: SpecialtyCategory.COMPLEMENTARY,
    name: 'Psicología clínica',
  },
  { category: SpecialtyCategory.COMPLEMENTARY, name: 'Terapia física' },
  {
    category: SpecialtyCategory.COMPLEMENTARY,
    name: 'Terapia respiratoria',
  },
  { category: SpecialtyCategory.COMPLEMENTARY, name: 'Trabajo social' },
];

const tenantSeedSpecialties = [
  {
    tenantId: 'nova',
    preferredIds: {
      'Oncología médica': 'onco',
    },
  },
  {
    tenantId: 'horizonte',
    preferredIds: {
      Gastroenterología: 'gastro',
    },
  },
] as const;

function buildSpecialtyCode(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 40);
}

function buildSpecialtyDescription(category: SpecialtyCategory, name: string) {
  return `Especialidad ${name} clasificada en ${category}`;
}

export async function seedCore({ prisma, ctx }: SeedDeps) {
  const { ids } = ctx;

  await prisma.tenant.createMany({
    data: [
      {
        id: ids.tenants.nova,
        code: 'NOVA',
        name: 'Grupo Médico Nova',
        legalName: 'Grupo Médico Nova S.A. de C.V.',
        taxId: 'GMN260101AAA',
        timezone: 'America/Mexico_City',
        status: TenantStatus.ACTIVE,
      },
      {
        id: ids.tenants.horizonte,
        code: 'HORIZONTE',
        name: 'Clínicas Horizonte',
        legalName: 'Clínicas Horizonte S. de R.L. de C.V.',
        taxId: 'CLH260101BBB',
        timezone: 'America/Mexico_City',
        status: TenantStatus.ACTIVE,
      },
    ],
  });

  for (const tenantSeed of tenantSeedSpecialties) {
    const tenantId = ids.tenants[tenantSeed.tenantId];

    for (const specialty of seedSpecialtyCatalog) {
      const code = buildSpecialtyCode(specialty.name);
      const preferredIdKey =
        tenantSeed.preferredIds[
          specialty.name as keyof typeof tenantSeed.preferredIds
        ];

      await prisma.specialty.upsert({
        where: {
          tenantId_code: {
            tenantId,
            code,
          },
        },
        update: {
          name: specialty.name,
          category: specialty.category,
          description: buildSpecialtyDescription(
            specialty.category,
            specialty.name,
          ),
          isActive: true,
        },
        create: {
          id: preferredIdKey ? ids.specialties[preferredIdKey] : randomUUID(),
          tenantId,
          code,
          name: specialty.name,
          category: specialty.category,
          description: buildSpecialtyDescription(
            specialty.category,
            specialty.name,
          ),
          isActive: true,
        },
      });
    }
  }

  await prisma.facility.createMany({
    data: [
      {
        id: ids.facilities.novaHospital,
        tenantId: ids.tenants.nova,
        code: 'HOSP-NOVA-01',
        name: 'Hospital Nova Centro',
        legalName: 'Hospital Nova Centro',
        facilityType: FacilityType.HOSPITAL,
        institutionName: 'Grupo Médico Nova',
        ownerName: 'Grupo Médico Nova',
        addressLine1: 'Av. Reforma 100',
        addressLine2: 'Piso 2',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '06600',
        country: 'MX',
        phone: '5550001111',
        email: 'contacto@nova.mx',
        isActive: true,
      },
      {
        id: ids.facilities.horizonteClinic,
        tenantId: ids.tenants.horizonte,
        code: 'CLIN-HOR-01',
        name: 'Clínica Horizonte Del Valle',
        legalName: 'Clínica Horizonte Del Valle',
        facilityType: FacilityType.CLINIC,
        institutionName: 'Clínicas Horizonte',
        ownerName: 'Clínicas Horizonte',
        addressLine1: 'Insurgentes Sur 2450',
        addressLine2: 'Consultorio 8',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '03100',
        country: 'MX',
        phone: '5550002222',
        email: 'contacto@horizonte.mx',
        isActive: true,
      },
    ],
  });

  await prisma.serviceArea.createMany({
    data: [
      {
        id: ids.serviceAreas.oncoExternal,
        tenantId: ids.tenants.nova,
        facilityId: ids.facilities.novaHospital,
        specialtyId: ids.specialties.onco,
        code: 'ONCO-EXT',
        name: 'Consulta Externa Oncológica',
        description: 'Atención ambulatoria de pacientes oncológicos',
      },
      {
        id: ids.serviceAreas.gastroExternal,
        tenantId: ids.tenants.horizonte,
        facilityId: ids.facilities.horizonteClinic,
        specialtyId: ids.specialties.gastro,
        code: 'GASTRO-EXT',
        name: 'Consulta Externa Gastro',
        description: 'Consulta digestiva y seguimiento gastroenterológico',
      },
    ],
  });
}
