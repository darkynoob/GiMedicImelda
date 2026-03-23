import { AuditAction, DischargeType } from '@prisma/client';
import type { SeedDeps } from './_context';

export async function seedLegalAndAudit({ prisma, ctx }: SeedDeps) {
  const { ids, dates } = ctx;

  await prisma.consentForm.createMany({
    data: [
      {
        id: ids.consentForms.anaConsent,
        tenantId: ids.tenants.nova,
        facilityId: ids.facilities.novaHospital,
        patientId: ids.patients.ana,
        encounterId: ids.encounters.anaConsult,
        clinicalDocumentId: ids.clinicalDocuments.anaHistoryDoc,
        title: 'Consentimiento informado para biopsia',
        authorizedAct: 'Biopsia guiada por imagen',
        risksBenefits: 'Riesgo de sangrado menor, beneficio diagnóstico',
        emergencyAuthorization: false,
        grantedByName: 'Ana López Hernández',
        grantedByRelation: 'PACIENTE',
        grantedAt: dates.anaConsentAt,
        witness1Name: 'Luis López',
        witness2Name: 'María Herrera',
        physicianName: 'Valeria Ruiz Santos',
        notes: 'Paciente entiende y acepta procedimiento',
      },
      {
        id: ids.consentForms.carlosConsent,
        tenantId: ids.tenants.horizonte,
        facilityId: ids.facilities.horizonteClinic,
        patientId: ids.patients.carlos,
        encounterId: ids.encounters.carlosConsult,
        clinicalDocumentId: ids.clinicalDocuments.carlosEvolutionDoc,
        title: 'Consentimiento informado para endoscopia',
        authorizedAct: 'Endoscopia digestiva alta',
        risksBenefits: 'Molestia transitoria, beneficio diagnóstico',
        emergencyAuthorization: false,
        grantedByName: 'Carlos Mendoza Pérez',
        grantedByRelation: 'PACIENTE',
        grantedAt: dates.carlosConsentAt,
        witness1Name: 'Laura Mendoza',
        witness2Name: 'Pedro Solís',
        physicianName: 'Ernesto Salas Moreno',
        notes: 'Paciente acepta procedimiento programado',
      },
    ],
  });

  await prisma.discharge.createMany({
    data: [
      {
        id: ids.discharges.anaDischarge,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        dischargeAt: dates.anaDischargeAt,
        dischargeType: DischargeType.NORMAL,
        reason: 'Consulta concluida con plan diagnóstico',
        clinicalSummary: 'Paciente estable, se solicitan estudios complementarios',
        pendingProblems: 'Resultado histopatológico pendiente',
        treatmentPlan: 'Continuar protocolo diagnóstico',
        ambulatoryRecommendations: 'Acudir con resultados y signos de alarma',
        prognosis: 'Reservado a resultado de biopsia',
      },
      {
        id: ids.discharges.carlosDischarge,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        dischargeAt: dates.carlosDischargeAt,
        dischargeType: DischargeType.VOLUNTARY,
        reason: 'Seguimiento ambulatorio',
        clinicalSummary: 'Paciente estable, sin datos de alarma',
        pendingProblems: 'Programar endoscopia',
        treatmentPlan: 'Continuar IBP y medidas higiénico-dietéticas',
        ambulatoryRecommendations: 'Evitar irritantes y cenas abundantes',
        prognosis: 'Bueno',
      },
    ],
  });

  await prisma.mpNotification.createMany({
    data: [
      {
        id: ids.mpNotifications.anaMp,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        notificationDate: dates.anaMpDate,
        notifiedAct: 'Reporte de lesión sospechosa asociada a violencia referida por paciente',
        injuryReport: 'Paciente refiere antecedente de golpe previo en región mamaria',
        agencyName: 'Ministerio Público Benito Juárez',
        physicianName: 'Valeria Ruiz Santos',
      },
      {
        id: ids.mpNotifications.carlosMp,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        notificationDate: dates.carlosMpDate,
        notifiedAct: 'Reporte preventivo por probable intoxicación referida',
        injuryReport: 'Paciente refiere ingesta accidental de sustancia irritante días antes',
        agencyName: 'Ministerio Público Coyoacán',
        physicianName: 'Ernesto Salas Moreno',
      },
    ],
  });

  await prisma.deathRecord.createMany({
    data: [
      {
        id: ids.deathRecords.anaDeath,
        tenantId: ids.tenants.nova,
        encounterId: null,
        patientId: ids.patients.ana,
        deathDate: dates.anaDeathDate,
        causeOfDeath: 'Registro histórico demo: causa no especificada',
        fetalDeath: false,
        notes: 'Dato histórico de demostración para pruebas',
      },
      {
        id: ids.deathRecords.carlosDeath,
        tenantId: ids.tenants.horizonte,
        encounterId: null,
        patientId: ids.patients.carlos,
        deathDate: dates.carlosDeathDate,
        causeOfDeath: 'Registro histórico demo: paro cardiorrespiratorio',
        fetalDeath: false,
        notes: 'Dato histórico de demostración para pruebas',
      },
    ],
  });

  await prisma.attachment.createMany({
    data: [
      {
        id: ids.attachments.anaAttachment,
        tenantId: ids.tenants.nova,
        documentId: ids.clinicalDocuments.anaHistoryDoc,
        patientId: ids.patients.ana,
        encounterId: ids.encounters.anaConsult,
        fileName: 'ultrasonido_mamario_ana.pdf',
        mimeType: 'application/pdf',
        storageKey: `tenant/${ids.tenants.nova}/facility/${ids.facilities.novaHospital}/patient/${ids.patients.ana}/document/${ids.clinicalDocuments.anaHistoryDoc}/ultrasonido_mamario_ana.pdf`,
        fileSizeBytes: BigInt(248320),
        uploadedByUserId: ids.users.valeria,
        uploadedAt: dates.anaUploadAt,
        metadataJson: { source: 'seed', type: 'ultrasonido' },
      },
      {
        id: ids.attachments.carlosAttachment,
        tenantId: ids.tenants.horizonte,
        documentId: ids.clinicalDocuments.carlosEvolutionDoc,
        patientId: ids.patients.carlos,
        encounterId: ids.encounters.carlosConsult,
        fileName: 'ultrasonido_abdominal_carlos.pdf',
        mimeType: 'application/pdf',
        storageKey: `tenant/${ids.tenants.horizonte}/facility/${ids.facilities.horizonteClinic}/patient/${ids.patients.carlos}/document/${ids.clinicalDocuments.carlosEvolutionDoc}/ultrasonido_abdominal_carlos.pdf`,
        fileSizeBytes: BigInt(198765),
        uploadedByUserId: ids.users.ernesto,
        uploadedAt: dates.carlosUploadAt,
        metadataJson: { source: 'seed', type: 'ultrasonido' },
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: ids.auditLogs.anaAudit,
        tenantId: ids.tenants.nova,
        userId: ids.users.valeria,
        action: AuditAction.SIGN,
        entityType: 'ClinicalDocument',
        entityId: ids.clinicalDocuments.anaHistoryDoc,
        facilityId: ids.facilities.novaHospital,
        patientId: ids.patients.ana,
        encounterId: ids.encounters.anaConsult,
        metadataJson: {
          message: 'Documento firmado durante seed',
          documentType: 'ONCO_HISTORY',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
      {
        id: ids.auditLogs.carlosAudit,
        tenantId: ids.tenants.horizonte,
        userId: ids.users.ernesto,
        action: AuditAction.SIGN,
        entityType: 'ClinicalDocument',
        entityId: ids.clinicalDocuments.carlosEvolutionDoc,
        facilityId: ids.facilities.horizonteClinic,
        patientId: ids.patients.carlos,
        encounterId: ids.encounters.carlosConsult,
        metadataJson: {
          message: 'Documento firmado durante seed',
          documentType: 'GASTRO_EVOLUTION',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
    ],
  });
}