import {
  DocumentCategory,
  DocumentStatus,
  SignatureType,
} from '@prisma/client';
import type { SeedDeps } from './_context';

export async function seedClinical({ prisma, ctx }: SeedDeps) {
  const { ids, dates } = ctx;

  await prisma.documentType.createMany({
    data: [
      {
        id: ids.documentTypes.oncoHistory,
        tenantId: ids.tenants.nova,
        specialtyId: ids.specialties.onco,
        code: 'ONCO_HISTORY',
        name: 'Historia Clínica Oncológica',
        category: DocumentCategory.CONSULTATION,
        description: 'Formato de historia clínica inicial para oncología',
        requiresSignature: true,
        allowsMultiple: false,
        schemaJson: {
          sections: [
            'identificacion',
            'antecedentes',
            'padecimiento_actual',
            'exploracion_fisica',
            'plan',
          ],
        },
        isActive: true,
      },
      {
        id: ids.documentTypes.gastroEvolution,
        tenantId: ids.tenants.horizonte,
        specialtyId: ids.specialties.gastro,
        code: 'GASTRO_EVOLUTION',
        name: 'Nota de Evolución Gastro',
        category: DocumentCategory.CONSULTATION,
        description: 'Formato de seguimiento gastroenterológico',
        requiresSignature: true,
        allowsMultiple: true,
        schemaJson: {
          sections: [
            'evolucion',
            'signos_vitales',
            'diagnosticos',
            'tratamiento',
            'pronostico',
          ],
        },
        isActive: true,
      },
    ],
  });

  await prisma.clinicalDocument.createMany({
    data: [
      {
        id: ids.clinicalDocuments.anaHistoryDoc,
        tenantId: ids.tenants.nova,
        facilityId: ids.facilities.novaHospital,
        medicalRecordId: ids.medicalRecords.anaNova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        documentTypeId: ids.documentTypes.oncoHistory,
        specialtyId: ids.specialties.onco,
        authorUserId: ids.users.valeria,
        title: 'Historia clínica inicial de oncología',
        status: DocumentStatus.DRAFT,
        documentDate: dates.anaDocumentDate,
        metadataJson: { source: 'seed', versioning: true },
      },
      {
        id: ids.clinicalDocuments.carlosEvolutionDoc,
        tenantId: ids.tenants.horizonte,
        facilityId: ids.facilities.horizonteClinic,
        medicalRecordId: ids.medicalRecords.carlosHorizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        documentTypeId: ids.documentTypes.gastroEvolution,
        specialtyId: ids.specialties.gastro,
        authorUserId: ids.users.ernesto,
        title: 'Nota de evolución gastro',
        status: DocumentStatus.DRAFT,
        documentDate: dates.carlosDocumentDate,
        metadataJson: { source: 'seed', versioning: true },
      },
    ],
  });

  await prisma.documentVersion.createMany({
    data: [
      {
        id: ids.documentVersions.anaHistoryV1,
        documentId: ids.clinicalDocuments.anaHistoryDoc,
        versionNumber: 1,
        contentJson: {
          identificacion: {
            nombre: 'Ana López Hernández',
            edad: 36,
            sexo: 'FEMALE',
          },
          antecedentes: {
            heredofamiliares: 'Madre con antecedente de cáncer de mama',
            personales: 'Sin cirugías previas',
          },
          padecimiento_actual:
            'Refiere nódulo mamario de 2 meses de evolución sin pérdida de peso',
          exploracion_fisica: {
            tension_arterial: '118/76',
            hallazgos: 'Nódulo palpable cuadrante superior externo',
          },
          plan: ['Ultrasonido mamario', 'Biopsia guiada', 'Seguimiento en oncología'],
        },
        narrativeText:
          'Paciente femenina de 36 años con masa mamaria palpable, se integra protocolo diagnóstico inicial.',
        hashSha256: 'hash-seed-ana-history-v1',
        createdByUserId: ids.users.valeria,
        createdAt: dates.anaDocumentDate,
      },
      {
        id: ids.documentVersions.carlosEvolutionV1,
        documentId: ids.clinicalDocuments.carlosEvolutionDoc,
        versionNumber: 1,
        contentJson: {
          evolucion:
            'Persisten síntomas de reflujo nocturno y dolor epigástrico leve.',
          signos_vitales: {
            tension_arterial: '126/82',
            temperatura: '36.7',
          },
          diagnosticos: ['ERGE', 'Dispepsia funcional'],
          tratamiento: ['Omeprazol 20 mg cada 24 h', 'Dieta fraccionada'],
          pronostico: 'Bueno a mediano plazo con adherencia terapéutica',
        },
        narrativeText:
          'Paciente masculino con control gastroenterológico por ERGE y mejoría parcial.',
        hashSha256: 'hash-seed-carlos-evolution-v1',
        createdByUserId: ids.users.ernesto,
        createdAt: dates.carlosDocumentDate,
      },
    ],
  });

  await prisma.clinicalDocument.update({
    where: { id: ids.clinicalDocuments.anaHistoryDoc },
    data: {
      currentVersionId: ids.documentVersions.anaHistoryV1,
      status: DocumentStatus.SIGNED,
      signedAt: dates.anaSignedAt,
      lockedAt: dates.anaSignedAt,
    },
  });

  await prisma.clinicalDocument.update({
    where: { id: ids.clinicalDocuments.carlosEvolutionDoc },
    data: {
      currentVersionId: ids.documentVersions.carlosEvolutionV1,
      status: DocumentStatus.SIGNED,
      signedAt: dates.carlosSignedAt,
      lockedAt: dates.carlosSignedAt,
    },
  });

  await prisma.documentSignature.createMany({
    data: [
      {
        id: ids.documentSignatures.anaSig,
        documentId: ids.clinicalDocuments.anaHistoryDoc,
        userId: ids.users.valeria,
        signatureType: SignatureType.SIMPLE_ELECTRONIC,
        signedHash: 'hash-seed-ana-history-v1',
        signedAt: dates.anaSignedAt,
        metadataJson: { signedBy: 'seed', device: 'web' },
      },
      {
        id: ids.documentSignatures.carlosSig,
        documentId: ids.clinicalDocuments.carlosEvolutionDoc,
        userId: ids.users.ernesto,
        signatureType: SignatureType.SIMPLE_ELECTRONIC,
        signedHash: 'hash-seed-carlos-evolution-v1',
        signedAt: dates.carlosSignedAt,
        metadataJson: { signedBy: 'seed', device: 'web' },
      },
    ],
  });

  await prisma.documentStatusHistory.createMany({
    data: [
      {
        id: ids.documentStatusHistory.anaSigned,
        documentId: ids.clinicalDocuments.anaHistoryDoc,
        fromStatus: DocumentStatus.DRAFT,
        toStatus: DocumentStatus.SIGNED,
        changedByUserId: ids.users.valeria,
        reason: 'Documento validado y firmado por autora',
        createdAt: dates.anaSignedAt,
      },
      {
        id: ids.documentStatusHistory.carlosSigned,
        documentId: ids.clinicalDocuments.carlosEvolutionDoc,
        fromStatus: DocumentStatus.DRAFT,
        toStatus: DocumentStatus.SIGNED,
        changedByUserId: ids.users.ernesto,
        reason: 'Documento validado y firmado por autor',
        createdAt: dates.carlosSignedAt,
      },
    ],
  });
}