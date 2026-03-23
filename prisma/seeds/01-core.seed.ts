import { FacilityType, TenantStatus } from '@prisma/client';
import type { SeedDeps } from './_context';

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

  await prisma.specialty.createMany({
    data: [
      {
        id: ids.specialties.onco,
        tenantId: ids.tenants.nova,
        code: 'ONCO',
        name: 'Oncología',
        description: 'Especialidad para diagnóstico y tratamiento oncológico',
        isActive: true,
      },
      {
        id: ids.specialties.gastro,
        tenantId: ids.tenants.horizonte,
        code: 'GASTRO',
        name: 'Gastroenterología',
        description: 'Especialidad para aparato digestivo',
        isActive: true,
      },
    ],
  });

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