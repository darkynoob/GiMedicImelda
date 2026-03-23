import { MedicalRecordStatus, SexAtBirth, AdmissionSource, EncounterStatus, EncounterType } from '@prisma/client';
import type { SeedDeps } from './_context';

export async function seedPatients({ prisma, ctx }: SeedDeps) {
  const { ids, dates } = ctx;

  await prisma.patient.createMany({
    data: [
      {
        id: ids.patients.ana,
        tenantId: ids.tenants.nova,
        externalCode: 'PAT-NOVA-0001',
        firstName: 'Ana',
        lastName: 'López',
        middleName: 'Hernández',
        fullName: 'Ana López Hernández',
        sexAtBirth: SexAtBirth.FEMALE,
        birthDate: dates.anaBirth,
        ageSnapshot: 36,
        maritalStatus: 'CASADA',
        bloodType: 'O+',
        curp: 'LOHA890312MDFPRN05',
        phone: '5511111111',
        email: 'ana.lopez@email.com',
        addressLine1: 'Calle Magnolia 22',
        addressLine2: 'Depto 3',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '03650',
        country: 'MX',
        emergencyContactName: 'Luis López',
        emergencyContactPhone: '5522222222',
        isActive: true,
      },
      {
        id: ids.patients.carlos,
        tenantId: ids.tenants.horizonte,
        externalCode: 'PAT-HOR-0001',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        middleName: 'Pérez',
        fullName: 'Carlos Mendoza Pérez',
        sexAtBirth: SexAtBirth.MALE,
        birthDate: dates.carlosBirth,
        ageSnapshot: 47,
        maritalStatus: 'SOLTERO',
        bloodType: 'A+',
        curp: 'MEPC781022HDFNRR02',
        phone: '5533333333',
        email: 'carlos.mendoza@email.com',
        addressLine1: 'Eje 5 Sur 120',
        addressLine2: null,
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '03240',
        country: 'MX',
        emergencyContactName: 'Laura Mendoza',
        emergencyContactPhone: '5544444444',
        isActive: true,
      },
    ],
  });

  await prisma.patientIdentifier.createMany({
    data: [
      {
        id: ids.patientIdentifiers.anaNss,
        tenantId: ids.tenants.nova,
        patientId: ids.patients.ana,
        identifierType: 'NSS',
        identifierValue: 'NSS-ANA-0001',
        isPrimary: true,
      },
      {
        id: ids.patientIdentifiers.carlosPolicy,
        tenantId: ids.tenants.horizonte,
        patientId: ids.patients.carlos,
        identifierType: 'POLIZA',
        identifierValue: 'POL-CARLOS-100',
        isPrimary: true,
      },
    ],
  });

  await prisma.medicalRecord.createMany({
    data: [
      {
        id: ids.medicalRecords.anaNova,
        tenantId: ids.tenants.nova,
        facilityId: ids.facilities.novaHospital,
        patientId: ids.patients.ana,
        recordNumber: 'EXP-NOVA-0001',
        status: MedicalRecordStatus.ACTIVE,
        openedAt: dates.anaEncounterOpen,
        lastEncounterAt: dates.anaEncounterClose,
      },
      {
        id: ids.medicalRecords.carlosHorizonte,
        tenantId: ids.tenants.horizonte,
        facilityId: ids.facilities.horizonteClinic,
        patientId: ids.patients.carlos,
        recordNumber: 'EXP-HOR-0001',
        status: MedicalRecordStatus.ACTIVE,
        openedAt: dates.carlosEncounterOpen,
        lastEncounterAt: dates.carlosEncounterClose,
      },
    ],
  });

  await prisma.encounter.createMany({
    data: [
      {
        id: ids.encounters.anaConsult,
        tenantId: ids.tenants.nova,
        facilityId: ids.facilities.novaHospital,
        serviceAreaId: ids.serviceAreas.oncoExternal,
        specialtyId: ids.specialties.onco,
        medicalRecordId: ids.medicalRecords.anaNova,
        patientId: ids.patients.ana,
        encounterNumber: 'ENC-NOVA-0001',
        encounterType: EncounterType.OUTPATIENT,
        status: EncounterStatus.CLOSED,
        admissionSource: AdmissionSource.CONSULTATION,
        openedAt: dates.anaEncounterOpen,
        closedAt: dates.anaEncounterClose,
        attendingUserId: ids.users.valeria,
        reasonForVisit: 'Valoración inicial por masa mamaria',
        notes: 'Paciente refiere hallazgo de nódulo en autoexploración',
      },
      {
        id: ids.encounters.carlosConsult,
        tenantId: ids.tenants.horizonte,
        facilityId: ids.facilities.horizonteClinic,
        serviceAreaId: ids.serviceAreas.gastroExternal,
        specialtyId: ids.specialties.gastro,
        medicalRecordId: ids.medicalRecords.carlosHorizonte,
        patientId: ids.patients.carlos,
        encounterNumber: 'ENC-HOR-0001',
        encounterType: EncounterType.OUTPATIENT,
        status: EncounterStatus.CLOSED,
        admissionSource: AdmissionSource.CONSULTATION,
        openedAt: dates.carlosEncounterOpen,
        closedAt: dates.carlosEncounterClose,
        attendingUserId: ids.users.ernesto,
        reasonForVisit: 'Dolor abdominal y reflujo',
        notes: 'Paciente con historia de gastritis crónica',
      },
    ],
  });
}