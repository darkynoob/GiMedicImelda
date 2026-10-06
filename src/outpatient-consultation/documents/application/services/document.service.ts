import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { AuditAction, DocumentCategory, Prisma } from '@prisma/client';
import { ENCOUNTER_REPOSITORY } from '../../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../../shared/persistence/repositories/encounter.repository';
import { CLINICALDOCUMENT_REPOSITORY } from '../../../../shared/persistence/tokens/clinicalDocument.token';
import type { ClinicalDocumentRepository } from '../../../../shared/persistence/repositories/clinicalDocument.repository';
import { DOCUMENTVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/documentVersion.token';
import type { DocumentVersionRepository } from '../../../../shared/persistence/repositories/documentVersion.repository';
import { DOCUMENTTYPE_REPOSITORY } from '../../../../shared/persistence/tokens/documentType.token';
import type { DocumentTypeRepository } from '../../../../shared/persistence/repositories/documentType.repository';
import { DOCUMENTSTATUSHISTORY_REPOSITORY } from '../../../../shared/persistence/tokens/documentStatusHistory.token';
import type { DocumentStatusHistoryRepository } from '../../../../shared/persistence/repositories/documentStatusHistory.repository';
import { DIAGNOSIS_REPOSITORY } from '../../../../shared/persistence/tokens/diagnosis.token';
import type { DiagnosisRepository } from '../../../../shared/persistence/repositories/diagnosis.repository';
import type { ClinicalDocumentModel } from '../../../../shared/persistence/models/clinicalDocument.model';
import { PatientClinicalSnapshotService } from '../../../shared/services/patient-clinical-snapshot.service';
import { ClinicalAuditService } from '../../../shared/services/clinical-audit.service';
import { assertEncounterOpen } from '../../../shared/services/encounter-status.guard';
import {
  OUTPATIENT_DOCUMENT_TYPES,
  SaveDocumentContentDto,
  type OutpatientDocumentTypeCode,
} from '../dto/save-document-content.dto';

type JsonInput = NonNullable<Prisma.InputJsonValue>;

const documentTypeDefinitions: Record<
  OutpatientDocumentTypeCode,
  { name: string; category: DocumentCategory }
> = {
  LAB_REQUEST: { name: 'Solicitud de laboratorio', category: 'DIAGNOSTIC' },
  IMAGING_REQUEST: { name: 'Solicitud de imagenología', category: 'DIAGNOSTIC' },
  REFERRAL: { name: 'Referencia / contrarreferencia', category: 'OTHER' },
  INFORMED_CONSENT: { name: 'Consentimiento informado', category: 'LEGAL' },
  CERTIFICATE: { name: 'Certificado / constancia', category: 'ADMINISTRATIVE' },
  CLOSURE_NOTE: { name: 'Nota de cierre del episodio', category: 'CONSULTATION' },
};

function hashContent(content: unknown): string {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

@Injectable()
export class DocumentService {
  constructor(
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(CLINICALDOCUMENT_REPOSITORY)
    private readonly documentRepository: ClinicalDocumentRepository,
    @Inject(DOCUMENTVERSION_REPOSITORY)
    private readonly documentVersionRepository: DocumentVersionRepository,
    @Inject(DOCUMENTTYPE_REPOSITORY)
    private readonly documentTypeRepository: DocumentTypeRepository,
    @Inject(DOCUMENTSTATUSHISTORY_REPOSITORY)
    private readonly statusHistoryRepository: DocumentStatusHistoryRepository,
    @Inject(DIAGNOSIS_REPOSITORY)
    private readonly diagnosisRepository: DiagnosisRepository,
    private readonly snapshotService: PatientClinicalSnapshotService,
    private readonly auditService: ClinicalAuditService,
  ) {}

  async list(tenantId: string, encounterNumber: string) {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const documents = await this.documentRepository.findMany({
      where: { tenantId, encounterId: encounter.id },
      orderBy: { createdAt: 'desc' },
    });
    return { documents };
  }

  /// Detalle de un documento: el contenido estructurado vive en `DocumentVersion.contentJson`,
  /// separado de `ClinicalDocument` (estado/título), por lo que se arma aquí para el frontend.
  async getDetail(tenantId: string, encounterNumber: string, documentId: string) {
    const { document } = await this.resolveDocument(tenantId, encounterNumber, documentId);
    const typeCode = this.readTypeCode(document);
    const versions = await this.documentVersionRepository.findMany({
      where: { documentId: document.id },
      orderBy: { versionNumber: 'desc' },
    });
    return {
      document,
      typeCode,
      content: versions[0]?.contentJson ?? null,
      versions,
    };
  }

  async create(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    documentTypeCode: string,
    data: SaveDocumentContentDto,
  ): Promise<ClinicalDocumentModel> {
    if (!OUTPATIENT_DOCUMENT_TYPES.includes(documentTypeCode as OutpatientDocumentTypeCode)) {
      throw new BadRequestException(`Tipo de documento no soportado: ${documentTypeCode}`);
    }
    const typeCode = documentTypeCode as OutpatientDocumentTypeCode;
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const documentType = await this.ensureDocumentType(tenantId, typeCode);

    const content = this.extractContentForType(typeCode, data);
    const document = await this.documentRepository.create({
      tenant: { connect: { id: tenantId } },
      facility: { connect: { id: encounter.facilityId } },
      medicalRecord: { connect: { id: encounter.medicalRecordId } },
      encounter: { connect: { id: encounter.id } },
      patient: { connect: { id: encounter.patientId } },
      documentType: { connect: { id: documentType.id } },
      author: { connect: { id: userId } },
      title: `${documentTypeDefinitions[typeCode].name} V1`,
      status: 'DRAFT',
      documentDate: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      metadataJson: { documentTypeCode: typeCode },
    });

    const version = await this.documentVersionRepository.create({
      document: { connect: { id: document.id } },
      versionNumber: 1,
      contentJson: content as unknown as JsonInput,
      hashSha256: hashContent(content),
      createdByUser: { connect: { id: userId } },
    });

    const updated = await this.documentRepository.update(document.id, {
      currentVersion: { connect: { id: version.id } },
    });

    await this.statusHistoryRepository.create({
      document: { connect: { id: document.id } },
      toStatus: 'DRAFT',
      changedByUser: { connect: { id: userId } },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'ClinicalDocument',
      entityId: document.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { documentTypeCode: typeCode, versionNumber: 1 },
    });

    return updated;
  }

  async saveDraft(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    documentId: string,
    data: SaveDocumentContentDto,
  ) {
    const { encounter, document } = await this.resolveDocument(tenantId, encounterNumber, documentId);
    assertEncounterOpen(encounter);

    if (document.status !== 'DRAFT') {
      await this.recordModifyFinalizedDenied(tenantId, userId, encounter, document.id);
      throw new ForbiddenException('El documento está Finalizado y es inmutable.');
    }
    if (!document.currentVersionId) {
      throw new NotFoundException('El documento no tiene una versión activa.');
    }

    const typeCode = this.readTypeCode(document);
    const content = this.extractContentForType(typeCode, data);

    await this.documentVersionRepository.update(document.currentVersionId, {
      contentJson: content as unknown as JsonInput,
      hashSha256: hashContent(content),
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'UPDATE_DRAFT',
      entityType: 'ClinicalDocument',
      entityId: document.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { documentTypeCode: typeCode },
    });

    return this.documentRepository.findById(document.id);
  }

  async finalize(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    documentId: string,
  ) {
    const { encounter, document } = await this.resolveDocument(tenantId, encounterNumber, documentId);
    assertEncounterOpen(encounter);

    if (document.status !== 'DRAFT') {
      await this.recordModifyFinalizedDenied(tenantId, userId, encounter, document.id);
      throw new ForbiddenException('El documento está Finalizado y es inmutable.');
    }
    if (!document.currentVersionId) {
      throw new NotFoundException('El documento no tiene una versión activa.');
    }

    const typeCode = this.readTypeCode(document);
    const currentVersion = await this.documentVersionRepository.findById(document.currentVersionId);
    if (!currentVersion) throw new NotFoundException('Versión activa no encontrada.');

    const content = currentVersion.contentJson as Record<string, unknown>;
    this.validateMinimumsForFinalization(typeCode, content);

    const legalSnapshot = await this.snapshotService.buildSnapshot({
      encounterId: encounter.id,
      professionalUserId: userId,
      clinicalDateTime: document.documentDate,
    });
    const finalContent = { ...content, legalSnapshot };

    await this.documentVersionRepository.update(currentVersion.id, {
      contentJson: finalContent as unknown as JsonInput,
      hashSha256: hashContent(finalContent),
    });

    const finalized = await this.documentRepository.update(document.id, {
      status: 'FINALIZED',
      lockedAt: new Date(),
    });

    await this.statusHistoryRepository.create({
      document: { connect: { id: document.id } },
      fromStatus: 'DRAFT',
      toStatus: 'FINALIZED',
      changedByUser: { connect: { id: userId } },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'FINALIZE',
      entityType: 'ClinicalDocument',
      entityId: document.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { documentTypeCode: typeCode },
    });

    await this.reflectDiagnosesToSharedTable(typeCode, content, {
      tenantId,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      documentId: document.id,
    });

    if (typeCode === 'CLOSURE_NOTE') {
      await this.encounterRepository.update(encounter.id, {
        status: 'CLOSED',
        closedAt: new Date(),
      } as Prisma.EncounterUpdateInput);

      await this.auditService.record({
        tenantId,
        userId,
        action: 'CLOSE_EPISODE',
        entityType: 'Encounter',
        entityId: encounter.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { closedByDocumentId: document.id },
      });
    }

    return finalized;
  }

  async createNewVersion(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    documentId: string,
    data: SaveDocumentContentDto,
  ) {
    const { encounter, document } = await this.resolveDocument(tenantId, encounterNumber, documentId);
    assertEncounterOpen(encounter);

    if (document.status !== 'FINALIZED') {
      throw new BadRequestException(
        'Solo se puede crear una nueva versión a partir de un documento Finalizado.',
      );
    }

    const typeCode = this.readTypeCode(document);
    const latestVersions = await this.documentVersionRepository.findMany({
      where: { documentId: document.id },
      orderBy: { versionNumber: 'desc' },
      take: 1,
    });
    const previousVersion = latestVersions[0];
    const previousContent = (previousVersion?.contentJson ?? {}) as Record<string, unknown>;
    const newContent = { ...previousContent, ...this.extractContentForType(typeCode, data) };
    const newVersionNumber = (previousVersion?.versionNumber ?? 0) + 1;

    const version = await this.documentVersionRepository.create({
      document: { connect: { id: document.id } },
      versionNumber: newVersionNumber,
      contentJson: newContent as unknown as JsonInput,
      hashSha256: hashContent(newContent),
      createdByUser: { connect: { id: userId } },
    });

    const updated = await this.documentRepository.update(document.id, {
      status: 'DRAFT',
      currentVersion: { connect: { id: version.id } },
      title: `${documentTypeDefinitions[typeCode].name} V${newVersionNumber}`,
      lockedAt: null,
    });

    await this.statusHistoryRepository.create({
      document: { connect: { id: document.id } },
      fromStatus: 'FINALIZED',
      toStatus: 'DRAFT',
      changedByUser: { connect: { id: userId } },
      reason: 'Nueva versión documental',
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE_VERSION',
      entityType: 'ClinicalDocument',
      entityId: document.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { documentTypeCode: typeCode, versionNumber: newVersionNumber },
    });

    return updated;
  }

  /// Descarga oficial del PDF: solo sobre documento Finalizado; incrementa el contador real
  /// (spec 5.5/5.17) y registra auditoría DOWNLOAD. La generación real del PDF queda pendiente.
  async registerOfficialDownload(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    documentId: string,
  ) {
    const { encounter, document } = await this.resolveDocument(tenantId, encounterNumber, documentId);
    if (document.status !== 'FINALIZED') {
      throw new BadRequestException('Solo se puede descargar el PDF oficial de un documento Finalizado.');
    }

    const updated = await this.documentRepository.update(document.id, {
      downloadCount: { increment: 1 },
    } as Prisma.ClinicalDocumentUpdateInput);

    await this.auditService.record({
      tenantId,
      userId,
      action: 'DOWNLOAD',
      entityType: 'ClinicalDocument',
      entityId: document.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
    });

    return updated;
  }

  // --- Internos -----------------------------------------------------------

  private async resolveEncounter(tenantId: string, encounterNumber: string) {
    const [encounter] = await this.encounterRepository.findMany({
      where: { tenantId, encounterNumber },
      take: 1,
    });
    if (!encounter) throw new NotFoundException('Episodio no encontrado.');
    return encounter;
  }

  private async resolveDocument(
    tenantId: string,
    encounterNumber: string,
    documentId: string,
  ) {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const document = await this.documentRepository.findById(documentId);
    if (!document || document.encounterId !== encounter.id) {
      throw new NotFoundException('Documento no encontrado en este episodio.');
    }
    return { encounter, document };
  }

  private readTypeCode(document: ClinicalDocumentModel): OutpatientDocumentTypeCode {
    const metadata = (document.metadataJson ?? {}) as { documentTypeCode?: string };
    const code = metadata.documentTypeCode;
    if (!code || !OUTPATIENT_DOCUMENT_TYPES.includes(code as OutpatientDocumentTypeCode)) {
      throw new BadRequestException('No se pudo determinar el tipo de documento.');
    }
    return code as OutpatientDocumentTypeCode;
  }

  private async ensureDocumentType(tenantId: string, code: OutpatientDocumentTypeCode) {
    const [existing] = await this.documentTypeRepository.findMany({
      where: { tenantId, code },
      take: 1,
    });
    if (existing) return existing;

    const definition = documentTypeDefinitions[code];
    return this.documentTypeRepository.create({
      tenant: { connect: { id: tenantId } },
      code,
      name: definition.name,
      category: definition.category,
      requiresSignature: false,
      allowsMultiple: true,
    });
  }

  private extractContentForType(
    typeCode: OutpatientDocumentTypeCode,
    data: SaveDocumentContentDto,
  ): Record<string, unknown> {
    switch (typeCode) {
      case 'LAB_REQUEST':
        return {
          reasonForRequest: data.labReasonForRequest,
          studies: data.labStudies,
          diagnosisCode: data.labDiagnosisCode,
          diagnosisDescription: data.labDiagnosisDescription,
          observations: data.labObservations,
          priority: data.labPriority,
        };
      case 'IMAGING_REQUEST':
        return {
          reasonForStudy: data.imagingReasonForStudy,
          modality: data.imagingModality,
          modalityOtherDetail: data.imagingModalityOtherDetail,
          studyRequested: data.imagingStudyRequested,
          anatomicalRegion: data.imagingAnatomicalRegion,
          presumptiveDiagnosisCode: data.imagingPresumptiveDiagnosisCode,
          presumptiveDiagnosisDescription: data.imagingPresumptiveDiagnosisDescription,
          specialInstructions: data.imagingSpecialInstructions,
          priority: data.imagingPriority,
        };
      case 'REFERRAL':
        return {
          type: data.referralType,
          destinationUnit: data.referralDestinationUnit,
          originUnit: data.referralOriginUnit,
          reason: data.referralReason,
          clinicalSummary: data.referralClinicalSummary,
          diagnoses: data.referralDiagnoses,
          currentTreatmentSummary: data.referralCurrentTreatmentSummary,
          studiesPerformed: data.referralStudiesPerformed,
          recommendations: data.referralRecommendations,
          priority: data.referralPriority,
          destinationSpecialty: data.referralDestinationSpecialty,
        };
      case 'INFORMED_CONSENT':
        return {
          procedureType: data.consentProcedureType,
          procedureDescription: data.consentProcedureDescription,
          risks: data.consentRisks,
          benefits: data.consentBenefits,
          alternatives: data.consentAlternatives,
          prognosisWithoutTreatment: data.consentPrognosisWithoutTreatment,
          patientOrGuardianName: data.consentPatientOrGuardianName,
          relationship: data.consentRelationship,
          relationshipDetail: data.consentRelationshipDetail,
          contingencyAuthorization: data.consentContingencyAuthorization,
          contingencyNotes: data.consentContingencyNotes,
          witness1: data.consentWitness1,
          witness2: data.consentWitness2,
          consentDateTime: data.consentDateTime,
        };
      case 'CERTIFICATE':
        return {
          type: data.certificateType,
          typeOtherDetail: data.certificateTypeOtherDetail,
          documentUse: data.certificateDocumentUse,
          reason: data.certificateReason,
          diagnosisCode: data.certificateDiagnosisCode,
          diagnosisDescription: data.certificateDiagnosisDescription,
          restStartDate: data.certificateRestStartDate,
          restEndDate: data.certificateRestEndDate,
          observations: data.certificateObservations,
          hideDiagnosisInPdf: data.certificateHideDiagnosisInPdf,
        };
      case 'CLOSURE_NOTE':
        return {
          closureReason: data.closureReason,
          finalClinicalSummary: data.closureFinalClinicalSummary,
          finalDiagnoses: data.closureFinalDiagnoses,
          finalStatus: data.closureFinalStatus,
          dischargeInstructions: data.closureDischargeInstructions,
          followUpPlan: data.closureFollowUpPlan,
          nextAppointmentDate: data.closureNextAppointmentDate,
          destination: data.closureDestination,
        };
      default:
        return {};
    }
  }

  /// Reglas mínimas de finalización por tipo (spec 5.14). No obliga campos irrelevantes.
  private validateMinimumsForFinalization(
    typeCode: OutpatientDocumentTypeCode,
    content: Record<string, unknown>,
  ) {
    const missing = (label: string) =>
      new BadRequestException(`Falta "${label}" para finalizar este documento.`);
    const isEmpty = (value: unknown) => typeof value !== 'string' || !value.trim();
    const isEmptyArray = (value: unknown) => !Array.isArray(value) || value.length === 0;

    switch (typeCode) {
      case 'LAB_REQUEST':
        if (isEmpty(content.reasonForRequest)) throw missing('Motivo de solicitud');
        if (isEmptyArray(content.studies)) throw missing('al menos un estudio solicitado');
        break;
      case 'IMAGING_REQUEST':
        if (isEmpty(content.reasonForStudy)) throw missing('Motivo de estudio');
        if (isEmpty(content.modality) && isEmpty(content.studyRequested)) {
          throw missing('al menos un estudio/modalidad');
        }
        break;
      case 'REFERRAL':
        if (isEmpty(content.type)) throw missing('Tipo (Referencia/Contrarreferencia)');
        if (isEmpty(content.reason)) throw missing('Motivo de envío');
        if (isEmpty(content.clinicalSummary)) throw missing('Resumen clínico');
        if (isEmpty(content.destinationUnit) && isEmpty(content.destinationSpecialty)) {
          throw missing('Unidad destino o especialidad destino');
        }
        break;
      case 'INFORMED_CONSENT':
        if (isEmpty(content.procedureType)) throw missing('Tipo de procedimiento');
        if (isEmpty(content.procedureDescription)) throw missing('Descripción del procedimiento');
        if (isEmpty(content.risks)) throw missing('Riesgos');
        if (isEmpty(content.benefits)) throw missing('Beneficios');
        if (isEmpty(content.alternatives)) throw missing('Alternativas');
        if (isEmpty(content.patientOrGuardianName)) throw missing('Nombre de paciente/tutor');
        break;
      case 'CERTIFICATE':
        if (isEmpty(content.type)) throw missing('Tipo de certificado/constancia');
        if (isEmpty(content.reason)) throw missing('Motivo/contenido');
        break;
      case 'CLOSURE_NOTE':
        if (isEmpty(content.closureReason)) throw missing('Motivo de cierre');
        if (isEmpty(content.finalClinicalSummary)) throw missing('Resumen clínico final');
        if (isEmpty(content.finalStatus)) throw missing('Estado final');
        break;
    }
  }

  private async reflectDiagnosesToSharedTable(
    typeCode: OutpatientDocumentTypeCode,
    content: Record<string, unknown>,
    context: { tenantId: string; encounterId: string; patientId: string; documentId: string },
  ) {
    const sharedContext = {
      tenant: { connect: { id: context.tenantId } },
      encounter: { connect: { id: context.encounterId } },
      patient: { connect: { id: context.patientId } },
      sourceType: 'DOCUMENT_VERSION',
      sourceVersionId: context.documentId,
    };

    const singleDiagnosis = (code: unknown, description: unknown) => {
      if (typeof description === 'string' && description.trim()) {
        return this.diagnosisRepository.create({
          ...sharedContext,
          code: typeof code === 'string' ? code : undefined,
          description,
          isPrimary: false,
        });
      }
      return null;
    };

    if (typeCode === 'LAB_REQUEST') {
      await singleDiagnosis(content.diagnosisCode, content.diagnosisDescription);
    } else if (typeCode === 'IMAGING_REQUEST') {
      await singleDiagnosis(content.presumptiveDiagnosisCode, content.presumptiveDiagnosisDescription);
    } else if (typeCode === 'CERTIFICATE') {
      await singleDiagnosis(content.diagnosisCode, content.diagnosisDescription);
    } else if (typeCode === 'REFERRAL' || typeCode === 'CLOSURE_NOTE') {
      const list = Array.isArray(content.diagnoses ?? content.finalDiagnoses)
        ? ((content.diagnoses ?? content.finalDiagnoses) as Array<{ code?: string; description?: string }>)
        : [];
      for (const diagnosis of list) {
        await singleDiagnosis(diagnosis.code, diagnosis.description);
      }
    }
  }

  private async recordModifyFinalizedDenied(
    tenantId: string,
    userId: string,
    encounter: { id: string; facilityId: string; patientId: string },
    documentId: string,
  ) {
    await this.auditService.record({
      tenantId,
      userId,
      action: 'MODIFY_FINALIZED_DENIED' as AuditAction,
      entityType: 'ClinicalDocument',
      entityId: documentId,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
    });
  }
}
