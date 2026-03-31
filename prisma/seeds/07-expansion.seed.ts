import { randomUUID } from 'node:crypto';
import {
  AdmissionSource,
  AuditAction,
  DischargeType,
  DocumentStatus,
  EncounterStatus,
  EncounterType,
  MedicalRecordStatus,
  SignatureType,
  SexAtBirth,
} from '@prisma/client';
import type { SeedDeps } from './_context';
import { dec } from './_context';

type ExpansionScenario = {
  code: string;
  tenantId: string;
  facilityId: string;
  serviceAreaId: string;
  specialtyId: string;
  attendingUserId: string;
  physicianName: string;
  patient: {
    firstName: string;
    lastName: string;
    middleName: string;
    sexAtBirth: SexAtBirth;
    birthDate: Date;
    ageSnapshot: number;
    bloodType: string;
  };
  encounter: {
    encounterType: EncounterType;
    status: EncounterStatus;
    reason: string;
    notes: string;
    openedAt: Date;
    closedAt: Date;
  };
};

export async function seedExpansion({ prisma, ctx }: SeedDeps) {
  const scenarios: ExpansionScenario[] = [
    {
      code: '0002',
      tenantId: ctx.ids.tenants.nova,
      facilityId: ctx.ids.facilities.novaHospital,
      serviceAreaId: ctx.ids.serviceAreas.oncoExternal,
      specialtyId: ctx.ids.specialties.onco,
      attendingUserId: ctx.ids.users.valeria,
      physicianName: 'Valeria Ruiz Santos',
      patient: {
        firstName: 'Patricia',
        lastName: 'Ramírez',
        middleName: 'Nava',
        sexAtBirth: SexAtBirth.FEMALE,
        birthDate: new Date('1990-07-09T00:00:00-06:00'),
        ageSnapshot: 35,
        bloodType: 'B+',
      },
      encounter: {
        encounterType: EncounterType.FOLLOW_UP,
        status: EncounterStatus.CLOSED,
        reason: 'Seguimiento post biopsia',
        notes: 'Sin complicaciones, se discute plan terapéutico inicial.',
        openedAt: new Date('2026-02-20T08:30:00-06:00'),
        closedAt: new Date('2026-02-20T10:00:00-06:00'),
      },
    },
    {
      code: '0003',
      tenantId: ctx.ids.tenants.horizonte,
      facilityId: ctx.ids.facilities.horizonteClinic,
      serviceAreaId: ctx.ids.serviceAreas.gastroExternal,
      specialtyId: ctx.ids.specialties.gastro,
      attendingUserId: ctx.ids.users.ernesto,
      physicianName: 'Ernesto Salas Moreno',
      patient: {
        firstName: 'Jorge',
        lastName: 'Serrano',
        middleName: 'Lima',
        sexAtBirth: SexAtBirth.MALE,
        birthDate: new Date('1982-11-13T00:00:00-06:00'),
        ageSnapshot: 43,
        bloodType: 'O-',
      },
      encounter: {
        encounterType: EncounterType.OUTPATIENT,
        status: EncounterStatus.CLOSED,
        reason: 'Dolor epigástrico persistente',
        notes: 'Se sospecha dispepsia funcional, se ajusta tratamiento.',
        openedAt: new Date('2026-02-24T10:20:00-06:00'),
        closedAt: new Date('2026-02-24T11:45:00-06:00'),
      },
    },
    {
      code: '0004',
      tenantId: ctx.ids.tenants.nova,
      facilityId: ctx.ids.facilities.novaHospital,
      serviceAreaId: ctx.ids.serviceAreas.oncoExternal,
      specialtyId: ctx.ids.specialties.onco,
      attendingUserId: ctx.ids.users.valeria,
      physicianName: 'Valeria Ruiz Santos',
      patient: {
        firstName: 'Mariana',
        lastName: 'Torres',
        middleName: 'Vega',
        sexAtBirth: SexAtBirth.FEMALE,
        birthDate: new Date('1976-04-21T00:00:00-06:00'),
        ageSnapshot: 49,
        bloodType: 'A-',
      },
      encounter: {
        encounterType: EncounterType.OUTPATIENT,
        status: EncounterStatus.CLOSED,
        reason: 'Valoración por hallazgo incidental',
        notes: 'Paciente estable, se solicita control por imagen en 3 meses.',
        openedAt: new Date('2026-03-03T09:10:00-06:00'),
        closedAt: new Date('2026-03-03T10:20:00-06:00'),
      },
    },
  ];

  for (const scenario of scenarios) {
    await createScenario(prisma, scenario);
  }
}

async function createScenario(
  prisma: SeedDeps['prisma'],
  scenario: ExpansionScenario,
) {
  const ids = {
    patientId: randomUUID(),
    patientIdentifierId: randomUUID(),
    medicalRecordId: randomUUID(),
    encounterId: randomUUID(),
    clinicalDocumentId: randomUUID(),
    documentVersionId: randomUUID(),
    documentSignatureId: randomUUID(),
    documentStatusHistoryId: randomUUID(),
    vitalSignId: randomUUID(),
    diagnosisId: randomUUID(),
    problemId: randomUUID(),
    allergyId: randomUUID(),
    medicationId: randomUUID(),
    procedureId: randomUUID(),
    labRequestId: randomUUID(),
    labResultId: randomUUID(),
    imagingRequestId: randomUUID(),
    imagingReportId: randomUUID(),
    nursingNoteId: randomUUID(),
    consentFormId: randomUUID(),
    dischargeId: randomUUID(),
    mpNotificationId: randomUUID(),
    deathRecordId: randomUUID(),
    attachmentId: randomUUID(),
    auditLogId: randomUUID(),
  };

  const patientFullName = [
    scenario.patient.firstName,
    scenario.patient.lastName,
    scenario.patient.middleName,
  ].join(' ');

  const documentType = await prisma.documentType.findFirstOrThrow({
    where: {
      tenantId: scenario.tenantId,
      specialtyId: scenario.specialtyId,
    },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.patient.create({
      data: {
        id: ids.patientId,
        tenantId: scenario.tenantId,
        externalCode: `PAT-EXT-${scenario.code}`,
        firstName: scenario.patient.firstName,
        lastName: scenario.patient.lastName,
        middleName: scenario.patient.middleName,
        fullName: patientFullName,
        sexAtBirth: scenario.patient.sexAtBirth,
        birthDate: scenario.patient.birthDate,
        ageSnapshot: scenario.patient.ageSnapshot,
        maritalStatus: 'CASADO',
        bloodType: scenario.patient.bloodType,
        curp: `CURP${scenario.code}SEED${scenario.patient.lastName.slice(0, 2).toUpperCase()}`,
        phone: `551000${scenario.code}`,
        email: `paciente.${scenario.code}@seed.mx`,
        addressLine1: `Calle Seed ${scenario.code}`,
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '01000',
        country: 'MX',
        emergencyContactName: 'Contacto Seed',
        emergencyContactPhone: `552000${scenario.code}`,
        isActive: true,
      },
    });

    await tx.patientIdentifier.create({
      data: {
        id: ids.patientIdentifierId,
        tenantId: scenario.tenantId,
        patientId: ids.patientId,
        identifierType: 'HOSPITAL_ID',
        identifierValue: `HID-${scenario.code}`,
        isPrimary: true,
      },
    });

    await tx.medicalRecord.create({
      data: {
        id: ids.medicalRecordId,
        tenantId: scenario.tenantId,
        facilityId: scenario.facilityId,
        patientId: ids.patientId,
        recordNumber: `EXP-SEED-${scenario.code}`,
        status: MedicalRecordStatus.ACTIVE,
        openedAt: scenario.encounter.openedAt,
        lastEncounterAt: scenario.encounter.closedAt,
      },
    });

    await tx.encounter.create({
      data: {
        id: ids.encounterId,
        tenantId: scenario.tenantId,
        facilityId: scenario.facilityId,
        serviceAreaId: scenario.serviceAreaId,
        specialtyId: scenario.specialtyId,
        medicalRecordId: ids.medicalRecordId,
        patientId: ids.patientId,
        encounterNumber: `ENC-SEED-${scenario.code}`,
        encounterType: scenario.encounter.encounterType,
        status: scenario.encounter.status,
        admissionSource: AdmissionSource.CONSULTATION,
        openedAt: scenario.encounter.openedAt,
        closedAt: scenario.encounter.closedAt,
        attendingUserId: scenario.attendingUserId,
        reasonForVisit: scenario.encounter.reason,
        notes: scenario.encounter.notes,
      },
    });

    await tx.clinicalDocument.create({
      data: {
        id: ids.clinicalDocumentId,
        tenantId: scenario.tenantId,
        facilityId: scenario.facilityId,
        medicalRecordId: ids.medicalRecordId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        documentTypeId: documentType.id,
        specialtyId: scenario.specialtyId,
        authorUserId: scenario.attendingUserId,
        title: `Documento clínico seed ${scenario.code}`,
        status: DocumentStatus.DRAFT,
        documentDate: scenario.encounter.openedAt,
        metadataJson: { seed: true, scenario: scenario.code },
      },
    });

    await tx.documentVersion.create({
      data: {
        id: ids.documentVersionId,
        documentId: ids.clinicalDocumentId,
        versionNumber: 1,
        contentJson: {
          motivo: scenario.encounter.reason,
          evolucion: scenario.encounter.notes,
          plan: ['control en consulta externa', 'educación del paciente'],
        },
        narrativeText: `Narrativa clínica escenario ${scenario.code}`,
        hashSha256: `hash-seed-scenario-${scenario.code}`,
        createdByUserId: scenario.attendingUserId,
        createdAt: scenario.encounter.openedAt,
      },
    });

    await tx.clinicalDocument.update({
      where: { id: ids.clinicalDocumentId },
      data: {
        currentVersionId: ids.documentVersionId,
        status: DocumentStatus.SIGNED,
        signedAt: scenario.encounter.closedAt,
        lockedAt: scenario.encounter.closedAt,
      },
    });

    await tx.documentSignature.create({
      data: {
        id: ids.documentSignatureId,
        documentId: ids.clinicalDocumentId,
        userId: scenario.attendingUserId,
        signatureType: SignatureType.SIMPLE_ELECTRONIC,
        signedHash: `hash-seed-scenario-${scenario.code}`,
        signedAt: scenario.encounter.closedAt,
        metadataJson: { source: 'seed-expansion' },
      },
    });

    await tx.documentStatusHistory.create({
      data: {
        id: ids.documentStatusHistoryId,
        documentId: ids.clinicalDocumentId,
        fromStatus: DocumentStatus.DRAFT,
        toStatus: DocumentStatus.SIGNED,
        changedByUserId: scenario.attendingUserId,
        reason: 'Cambio de estado automático en seeder de expansión',
        createdAt: scenario.encounter.closedAt,
      },
    });

    await tx.vitalSign.create({
      data: {
        id: ids.vitalSignId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        takenAt: scenario.encounter.openedAt,
        weightKg: dec('70.10'),
        heightCm: dec('168.00'),
        temperatureC: dec('36.8'),
        heartRate: 79,
        respiratoryRate: 18,
        systolicBp: 120,
        diastolicBp: 78,
        oxygenSaturation: dec('97.50'),
        painScale: 3,
      },
    });

    await tx.diagnosis.create({
      data: {
        id: ids.diagnosisId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        code: `DX-${scenario.code}`,
        description: `Diagnóstico seed escenario ${scenario.code}`,
        diagnosisType: 'DEFINITIVO',
        isPrimary: true,
      },
    });

    await tx.problem.create({
      data: {
        id: ids.problemId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        description: `Problema activo seed ${scenario.code}`,
        status: 'ACTIVO',
        onsetAt: new Date('2026-01-01T00:00:00-06:00'),
      },
    });

    await tx.allergy.create({
      data: {
        id: ids.allergyId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        substance: 'Aspirina',
        reaction: 'Náusea',
        severity: 'LEVE',
        status: 'ACTIVA',
      },
    });

    await tx.medicationStatement.create({
      data: {
        id: ids.medicationId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        medicationName: 'Ibuprofeno',
        dose: '400 mg',
        route: 'VO',
        frequency: 'Cada 12 horas',
        startDate: scenario.encounter.openedAt,
        endDate: scenario.encounter.closedAt,
        notes: 'Control sintomático temporal',
      },
    });

    await tx.procedureRecord.create({
      data: {
        id: ids.procedureId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        code: `PROC-SEED-${scenario.code}`,
        description: `Procedimiento de prueba escenario ${scenario.code}`,
        performedAt: scenario.encounter.openedAt,
        performerUserId: scenario.attendingUserId,
      },
    });

    await tx.labRequest.create({
      data: {
        id: ids.labRequestId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        requestedByUserId: scenario.attendingUserId,
        requestedAt: scenario.encounter.openedAt,
        studyName: `Laboratorio seed ${scenario.code}`,
        clinicalQuestion: 'Evaluación integral de seguimiento',
        status: 'REPORTADO',
      },
    });

    await tx.labResult.create({
      data: {
        id: ids.labResultId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        labRequestId: ids.labRequestId,
        studyName: `Laboratorio seed ${scenario.code}`,
        resultText: 'Valores dentro de rango para demo',
        interpretedBy: 'Laboratorio Seed',
        reportedAt: scenario.encounter.closedAt,
      },
    });

    await tx.imagingRequest.create({
      data: {
        id: ids.imagingRequestId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        requestedByUserId: scenario.attendingUserId,
        requestedAt: scenario.encounter.openedAt,
        studyName: `Imagen seed ${scenario.code}`,
        clinicalQuestion: 'Correlación clínica de control',
        status: 'REPORTADO',
      },
    });

    await tx.imagingReport.create({
      data: {
        id: ids.imagingReportId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        imagingRequestId: ids.imagingRequestId,
        studyName: `Imagen seed ${scenario.code}`,
        resultText: 'Sin alteraciones significativas para demo',
        interpretedBy: 'Radiología Seed',
        reportedAt: scenario.encounter.closedAt,
      },
    });

    await tx.nursingNote.create({
      data: {
        id: ids.nursingNoteId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        authoredByUserId: scenario.attendingUserId,
        noteAt: scenario.encounter.openedAt,
        habitusExterior: 'Paciente orientado y colaborador',
        observations: 'Educación al paciente realizada',
        painScale: 3,
        fallRiskLevel: 'BAJO',
      },
    });

    await tx.consentForm.create({
      data: {
        id: ids.consentFormId,
        tenantId: scenario.tenantId,
        facilityId: scenario.facilityId,
        patientId: ids.patientId,
        encounterId: ids.encounterId,
        clinicalDocumentId: ids.clinicalDocumentId,
        title: `Consentimiento seed ${scenario.code}`,
        authorizedAct: 'Procedimiento diagnóstico ambulatorio',
        risksBenefits: 'Riesgo mínimo, beneficio diagnóstico',
        emergencyAuthorization: false,
        grantedByName: patientFullName,
        grantedByRelation: 'PACIENTE',
        grantedAt: scenario.encounter.openedAt,
        witness1Name: 'Testigo Seed 1',
        physicianName: scenario.physicianName,
      },
    });

    await tx.discharge.create({
      data: {
        id: ids.dischargeId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        dischargeAt: scenario.encounter.closedAt,
        dischargeType: DischargeType.NORMAL,
        reason: 'Alta posterior a atención ambulatoria',
        clinicalSummary: `Resumen clínico escenario ${scenario.code}`,
        pendingProblems: 'Seguimiento en consulta externa',
        treatmentPlan: 'Continuar indicaciones y vigilancia',
        ambulatoryRecommendations: 'Acudir a control en 2 semanas',
        prognosis: 'Bueno',
      },
    });

    await tx.mpNotification.create({
      data: {
        id: ids.mpNotificationId,
        tenantId: scenario.tenantId,
        encounterId: ids.encounterId,
        patientId: ids.patientId,
        notificationDate: scenario.encounter.closedAt,
        notifiedAct: `Aviso clínico demo ${scenario.code}`,
        injuryReport: 'Sin lesión relevante, registro de pruebas',
        agencyName: 'Ministerio Público Demo',
        physicianName: scenario.physicianName,
      },
    });

    await tx.deathRecord.create({
      data: {
        id: ids.deathRecordId,
        tenantId: scenario.tenantId,
        patientId: ids.patientId,
        deathDate: new Date('2025-10-10T07:00:00-06:00'),
        causeOfDeath: `Registro histórico demo seed ${scenario.code}`,
        fetalDeath: false,
        notes: 'Registro sintético para escenarios de pruebas',
      },
    });

    await tx.attachment.create({
      data: {
        id: ids.attachmentId,
        tenantId: scenario.tenantId,
        documentId: ids.clinicalDocumentId,
        patientId: ids.patientId,
        encounterId: ids.encounterId,
        fileName: `adjunto_seed_${scenario.code}.pdf`,
        mimeType: 'application/pdf',
        storageKey: `tenant/${scenario.tenantId}/seed/${scenario.code}/adjunto.pdf`,
        fileSizeBytes: BigInt(1024 * 220),
        uploadedByUserId: scenario.attendingUserId,
        uploadedAt: scenario.encounter.closedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        id: ids.auditLogId,
        tenantId: scenario.tenantId,
        userId: scenario.attendingUserId,
        action: AuditAction.SIGN,
        entityType: 'ClinicalDocument',
        entityId: ids.clinicalDocumentId,
        facilityId: scenario.facilityId,
        patientId: ids.patientId,
        encounterId: ids.encounterId,
        metadataJson: { seedScenario: scenario.code, stage: 'expansion' },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-expansion-script',
      },
    });
  });
}
