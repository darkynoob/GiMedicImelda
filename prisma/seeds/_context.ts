import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

export const dec = (value: string) => new Prisma.Decimal(value);

export type SeedDeps = {
  prisma: PrismaClient;
  ctx: SeedContext;
};

export function buildSeedContext() {
  const ids = {
    tenants: {
      nova: randomUUID(),
      horizonte: randomUUID(),
    },
    specialties: {
      onco: randomUUID(),
      gastro: randomUUID(),
    },
    facilities: {
      novaHospital: randomUUID(),
      horizonteClinic: randomUUID(),
    },
    serviceAreas: {
      oncoExternal: randomUUID(),
      gastroExternal: randomUUID(),
    },
    roles: {
      tenantAdmin: randomUUID(),
      physician: randomUUID(),
    },
    permissions: {
      patientsRead: randomUUID(),
      patientsCreate: randomUUID(),
      patientsUpdate: randomUUID(),
      patientsAttachmentsManage: randomUUID(),
      documentsSign: randomUUID(),
    },
    users: {
      valeria: randomUUID(),
      ernesto: randomUUID(),
    },
    userRoles: {
      valeriaAdmin: randomUUID(),
      ernestoPhysician: randomUUID(),
    },
    rolePermissions: {
      adminPatientsRead: randomUUID(),
      adminPatientsCreate: randomUUID(),
      adminPatientsUpdate: randomUUID(),
      adminPatientsAttachmentsManage: randomUUID(),
      physicianPatientsRead: randomUUID(),
      physicianDocumentsSign: randomUUID(),
    },
    patients: {
      ana: randomUUID(),
      carlos: randomUUID(),
    },
    patientIdentifiers: {
      anaNss: randomUUID(),
      carlosPolicy: randomUUID(),
    },
    patientResponsibleContacts: {
      anaResponsible: randomUUID(),
      carlosResponsible: randomUUID(),
    },
    patientCoverages: {
      anaPrimary: randomUUID(),
      anaSecondary: randomUUID(),
      carlosPrimary: randomUUID(),
    },
    patientDocuments: {
      anaIne: randomUUID(),
      anaPassport: randomUUID(),
      carlosIne: randomUUID(),
    },
    patientDemographicProfiles: {
      anaProfile: randomUUID(),
      carlosProfile: randomUUID(),
    },
    patientClinicalProfiles: {
      anaProfile: randomUUID(),
      carlosProfile: randomUUID(),
    },
    patientBillingProfiles: {
      anaBilling: randomUUID(),
      carlosBilling: randomUUID(),
    },
    medicalRecords: {
      anaNova: randomUUID(),
      carlosHorizonte: randomUUID(),
    },
    encounters: {
      anaConsult: randomUUID(),
      carlosConsult: randomUUID(),
    },
    documentTypes: {
      oncoHistory: randomUUID(),
      gastroEvolution: randomUUID(),
    },
    clinicalDocuments: {
      anaHistoryDoc: randomUUID(),
      carlosEvolutionDoc: randomUUID(),
    },
    documentVersions: {
      anaHistoryV1: randomUUID(),
      carlosEvolutionV1: randomUUID(),
    },
    documentSignatures: {
      anaSig: randomUUID(),
      carlosSig: randomUUID(),
    },
    documentStatusHistory: {
      anaSigned: randomUUID(),
      carlosSigned: randomUUID(),
    },
    vitalSigns: {
      anaVs: randomUUID(),
      carlosVs: randomUUID(),
    },
    diagnoses: {
      anaDx: randomUUID(),
      carlosDx: randomUUID(),
    },
    problems: {
      anaProblem: randomUUID(),
      carlosProblem: randomUUID(),
    },
    allergies: {
      anaAllergy: randomUUID(),
      carlosAllergy: randomUUID(),
    },
    meds: {
      anaMed: randomUUID(),
      carlosMed: randomUUID(),
    },
    procedures: {
      anaProc: randomUUID(),
      carlosProc: randomUUID(),
    },
    labRequests: {
      anaLabReq: randomUUID(),
      carlosLabReq: randomUUID(),
    },
    labResults: {
      anaLabRes: randomUUID(),
      carlosLabRes: randomUUID(),
    },
    imagingRequests: {
      anaImgReq: randomUUID(),
      carlosImgReq: randomUUID(),
    },
    imagingReports: {
      anaImgRep: randomUUID(),
      carlosImgRep: randomUUID(),
    },
    nursingNotes: {
      anaNurse: randomUUID(),
      carlosNurse: randomUUID(),
    },
    consentForms: {
      anaConsent: randomUUID(),
      carlosConsent: randomUUID(),
    },
    discharges: {
      anaDischarge: randomUUID(),
      carlosDischarge: randomUUID(),
    },
    mpNotifications: {
      anaMp: randomUUID(),
      carlosMp: randomUUID(),
    },
    deathRecords: {
      anaDeath: randomUUID(),
      carlosDeath: randomUUID(),
    },
    attachments: {
      anaAttachment: randomUUID(),
      carlosAttachment: randomUUID(),
      anaPatientFile: randomUUID(),
      carlosPatientFile: randomUUID(),
    },
    auditLogs: {
      anaAudit: randomUUID(),
      carlosAudit: randomUUID(),
    },
  };

  const dates = {
    anaBirth: new Date('1989-03-12T00:00:00-06:00'),
    carlosBirth: new Date('1978-10-22T00:00:00-06:00'),

    anaEncounterOpen: new Date('2026-01-15T09:00:00-06:00'),
    anaEncounterClose: new Date('2026-01-15T11:30:00-06:00'),
    carlosEncounterOpen: new Date('2026-02-03T10:15:00-06:00'),
    carlosEncounterClose: new Date('2026-02-03T12:00:00-06:00'),

    anaDocumentDate: new Date('2026-01-15T09:25:00-06:00'),
    carlosDocumentDate: new Date('2026-02-03T10:45:00-06:00'),

    anaSignedAt: new Date('2026-01-15T10:40:00-06:00'),
    carlosSignedAt: new Date('2026-02-03T11:20:00-06:00'),

    anaTakenAt: new Date('2026-01-15T09:10:00-06:00'),
    carlosTakenAt: new Date('2026-02-03T10:20:00-06:00'),

    anaRequestedAt: new Date('2026-01-15T10:00:00-06:00'),
    anaReportedAt: new Date('2026-01-15T15:30:00-06:00'),
    carlosRequestedAt: new Date('2026-02-03T11:00:00-06:00'),
    carlosReportedAt: new Date('2026-02-03T16:00:00-06:00'),

    anaConsentAt: new Date('2026-01-15T09:35:00-06:00'),
    carlosConsentAt: new Date('2026-02-03T10:50:00-06:00'),

    anaDischargeAt: new Date('2026-01-15T11:30:00-06:00'),
    carlosDischargeAt: new Date('2026-02-03T12:00:00-06:00'),

    anaMpDate: new Date('2026-01-15T12:15:00-06:00'),
    carlosMpDate: new Date('2026-02-03T13:00:00-06:00'),

    anaDeathDate: new Date('2025-11-08T07:20:00-06:00'),
    carlosDeathDate: new Date('2025-12-14T19:45:00-06:00'),

    anaUploadAt: new Date('2026-01-15T10:20:00-06:00'),
    carlosUploadAt: new Date('2026-02-03T11:30:00-06:00'),
  };

  return { ids, dates };
}

export type SeedContext = ReturnType<typeof buildSeedContext>;
