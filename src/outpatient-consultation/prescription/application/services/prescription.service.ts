import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuditAction, Prisma } from '@prisma/client';
import { ENCOUNTER_REPOSITORY } from '../../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../../shared/persistence/repositories/encounter.repository';
import { PRESCRIPTION_REPOSITORY } from '../../../../shared/persistence/tokens/prescription.token';
import type { PrescriptionRepository } from '../../../../shared/persistence/repositories/prescription.repository';
import { PRESCRIPTIONVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/prescriptionVersion.token';
import type { PrescriptionVersionRepository } from '../../../../shared/persistence/repositories/prescriptionVersion.repository';
import type { PrescriptionVersionModel } from '../../../../shared/persistence/models/prescriptionVersion.model';
import type { PrescriptionModel } from '../../../../shared/persistence/models/prescription.model';
import { ALLERGY_REPOSITORY } from '../../../../shared/persistence/tokens/allergy.token';
import type { AllergyRepository } from '../../../../shared/persistence/repositories/allergy.repository';
import { DIAGNOSIS_REPOSITORY } from '../../../../shared/persistence/tokens/diagnosis.token';
import type { DiagnosisRepository } from '../../../../shared/persistence/repositories/diagnosis.repository';
import { MEDICATIONSTATEMENT_REPOSITORY } from '../../../../shared/persistence/tokens/medicationStatement.token';
import type { MedicationStatementRepository } from '../../../../shared/persistence/repositories/medicationStatement.repository';
import { MEDICATIONCATALOGENTRY_REPOSITORY } from '../../../../shared/persistence/tokens/medicationCatalogEntry.token';
import type { MedicationCatalogEntryRepository } from '../../../../shared/persistence/repositories/medicationCatalogEntry.repository';
import {
  ClinicalDocumentVersioningService,
  type ClinicalVersionPort,
} from '../../../shared/services/clinical-document-versioning.service';
import { PatientClinicalSnapshotService } from '../../../shared/services/patient-clinical-snapshot.service';
import { ClinicalAuditService } from '../../../shared/services/clinical-audit.service';
import { assertEncounterOpen } from '../../../shared/services/encounter-status.guard';
import {
  PrescriptionMedicationItemDto,
  SavePrescriptionDraftDto,
} from '../dto/save-prescription-draft.dto';

type DraftInput = {
  data: SavePrescriptionDraftDto;
  userId: string;
  patientId: string;
};

const SOURCE_TYPE = 'PRESCRIPTION_VERSION';
type JsonInput = NonNullable<Prisma.InputJsonValue>;

function definedEntries<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function generateFolio(): string {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `RX-${datePart}-${randomPart}`;
}

function generateVerificationCode(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
}

@Injectable()
export class PrescriptionService {
  constructor(
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: PrescriptionRepository,
    @Inject(PRESCRIPTIONVERSION_REPOSITORY)
    private readonly versionRepository: PrescriptionVersionRepository,
    @Inject(ALLERGY_REPOSITORY)
    private readonly allergyRepository: AllergyRepository,
    @Inject(DIAGNOSIS_REPOSITORY)
    private readonly diagnosisRepository: DiagnosisRepository,
    @Inject(MEDICATIONSTATEMENT_REPOSITORY)
    private readonly medicationRepository: MedicationStatementRepository,
    @Inject(MEDICATIONCATALOGENTRY_REPOSITORY)
    private readonly medicationCatalogRepository: MedicationCatalogEntryRepository,
    private readonly versioning: ClinicalDocumentVersioningService,
    private readonly snapshotService: PatientClinicalSnapshotService,
    private readonly auditService: ClinicalAuditService,
  ) {}

  async listByEncounter(tenantId: string, encounterNumber: string) {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const prescriptions = await this.prescriptionRepository.findAllByEncounterId(
      encounter.id,
    );
    const withVersions = await Promise.all(
      prescriptions.map(async (prescription) => ({
        ...prescription,
        versions: await this.versionRepository.findAllByPrescriptionId(prescription.id),
      })),
    );
    return { prescriptions: withVersions };
  }

  async createPrescription(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    data: SavePrescriptionDraftDto,
  ): Promise<PrescriptionVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const prescriptionNumber =
      (await this.prescriptionRepository.countByEncounterId(encounter.id)) + 1;

    const prescription = await this.createPrescriptionWithUniqueFolio(encounter, prescriptionNumber);

    const port = this.buildPort(prescription.id, encounter.id, userId);
    const version = await this.versioning.saveDraft(port, prescription.id, {
      data,
      userId,
      patientId: encounter.patientId,
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'PrescriptionVersion',
      entityId: version.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { folio: prescription.folio, versionNumber: version.versionNumber },
    });

    return version;
  }

  async saveDraft(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    prescriptionId: string,
    data: SavePrescriptionDraftDto,
  ): Promise<PrescriptionVersionModel> {
    const { encounter, prescription } = await this.resolvePrescription(
      tenantId,
      encounterNumber,
      prescriptionId,
    );
    assertEncounterOpen(encounter);
    const port = this.buildPort(prescription.id, encounter.id, userId);

    try {
      const version = await this.versioning.saveDraft(port, prescription.id, {
        data,
        userId,
        patientId: encounter.patientId,
      });

      await this.auditService.record({
        tenantId,
        userId,
        action: 'UPDATE_DRAFT',
        entityType: 'PrescriptionVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { folio: prescription.folio, versionNumber: version.versionNumber },
      });

      return version;
    } catch (error) {
      await this.recordModifyFinalizedDeniedIfApplicable(error, tenantId, userId, encounter);
      throw error;
    }
  }

  async finalize(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel> {
    const { encounter, prescription } = await this.resolvePrescription(
      tenantId,
      encounterNumber,
      prescriptionId,
    );
    assertEncounterOpen(encounter);
    const port = this.buildPort(prescription.id, encounter.id, userId);

    try {
      const version = await this.versioning.finalize(port, prescription.id, (draft) => {
        const medications = Array.isArray(draft.medicationsJson)
          ? (draft.medicationsJson as unknown as PrescriptionMedicationItemDto[])
          : [];

        if (medications.length === 0 && !draft.generalInstructions?.trim()) {
          throw new BadRequestException(
            'Agrega al menos un medicamento o una indicación clínica antes de finalizar.',
          );
        }

        for (const medication of medications) {
          const hasDose = Boolean(medication.doseQuantity || medication.presentation);
          if (
            !medication.medication ||
            !hasDose ||
            !medication.route ||
            !medication.frequencyPreset
          ) {
            throw new BadRequestException(
              'Hay medicamentos con campos mínimos incompletos (medicamento, dosis/presentación, vía, frecuencia).',
            );
          }
        }

        if (draft.allergyValidationStatus === 'MATCH_DETECTED' && !draft.criticalAlertAcknowledged) {
          throw new BadRequestException(
            'Existe una coincidencia de alergia detectada; confirma/justifica antes de finalizar.',
          );
        }
      });

      await this.auditService.record({
        tenantId,
        userId,
        action: 'FINALIZE',
        entityType: 'PrescriptionVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { folio: prescription.folio, versionNumber: version.versionNumber },
      });

      return version;
    } catch (error) {
      await this.recordModifyFinalizedDeniedIfApplicable(error, tenantId, userId, encounter);
      throw error;
    }
  }

  async createNewVersion(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    prescriptionId: string,
    data: SavePrescriptionDraftDto,
  ): Promise<PrescriptionVersionModel> {
    const { encounter, prescription } = await this.resolvePrescription(
      tenantId,
      encounterNumber,
      prescriptionId,
    );
    const port = this.buildPort(prescription.id, encounter.id, userId);
    assertEncounterOpen(encounter);
    const version = await this.versioning.createNewVersion(port, prescription.id, {
      data,
      userId,
      patientId: encounter.patientId,
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE_VERSION',
      entityType: 'PrescriptionVersion',
      entityId: version.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: {
        folio: prescription.folio,
        versionNumber: version.versionNumber,
        previousVersionId: version.previousVersionId,
      },
    });

    return version;
  }

  /// Descarga oficial del PDF: solo permitida sobre una versión Finalizada; incrementa el
  /// contador real de descargas (spec 4.18) y registra auditoría DOWNLOAD.
  async registerOfficialDownload(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    prescriptionId: string,
    versionId: string,
  ) {
    const { encounter } = await this.resolvePrescription(tenantId, encounterNumber, prescriptionId);
    const version = await this.versionRepository.findById(versionId);
    if (!version || version.prescriptionId !== prescriptionId) {
      throw new NotFoundException('Versión de receta no encontrada.');
    }
    if (version.status !== 'FINALIZED') {
      throw new BadRequestException('Solo se puede descargar el PDF oficial de una receta Finalizada.');
    }

    const updated = await this.versionRepository.update(version.id, {
      downloadCount: { increment: 1 },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'DOWNLOAD',
      entityType: 'PrescriptionVersion',
      entityId: version.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { downloadCount: updated.downloadCount },
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

  private async resolvePrescription(
    tenantId: string,
    encounterNumber: string,
    prescriptionId: string,
  ): Promise<{
    encounter: Awaited<ReturnType<PrescriptionService['resolveEncounter']>>;
    prescription: PrescriptionModel;
  }> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription || prescription.encounterId !== encounter.id) {
      throw new NotFoundException('Receta no encontrada en este episodio.');
    }
    return { encounter, prescription };
  }

  private async createPrescriptionWithUniqueFolio(
    encounter: { id: string; tenantId: string; patientId: string; medicalRecordId: string },
    prescriptionNumber: number,
  ): Promise<PrescriptionModel> {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.prescriptionRepository.create({
          tenant: { connect: { id: encounter.tenantId } },
          encounter: { connect: { id: encounter.id } },
          patient: { connect: { id: encounter.patientId } },
          medicalRecord: { connect: { id: encounter.medicalRecordId } },
          prescriptionNumber,
          folio: generateFolio(),
        });
      } catch (error) {
        const isUniqueViolation =
          error instanceof Object && (error as { code?: string }).code === 'P2002';
        if (!isUniqueViolation || attempt === maxAttempts - 1) throw error;
      }
    }
    throw new Error('No se pudo generar un folio único para la receta.');
  }

  private buildPort(
    prescriptionId: string,
    encounterId: string,
    userId: string,
  ): ClinicalVersionPort<PrescriptionVersionModel, DraftInput> {
    return {
      findCurrentDraft: (id) => this.versionRepository.findCurrentDraft(id),
      findLatestFinalized: (id) => this.versionRepository.findLatestFinalized(id),
      createInitialDraft: async (id, input) => {
        const validations = await this.runSafetyValidations(input.patientId, input.data);
        return this.versionRepository.create({
          prescription: { connect: { id } },
          versionNumber: 1,
          status: 'DRAFT',
          previousVersionId: null,
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : new Date(),
          createdByUser: { connect: { id: input.userId } },
          ...definedEntries(this.mapDraftFields(input.data)),
          ...validations,
        });
      },
      updateDraft: async (document, input) => {
        const validations = await this.runSafetyValidations(input.patientId, input.data);
        return this.versionRepository.update(document.id, {
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : undefined,
          ...definedEntries(this.mapDraftFields(input.data)),
          ...validations,
        });
      },
      finalize: async (document) => {
        const snapshot = await this.snapshotService.buildSnapshot({
          encounterId,
          professionalUserId: userId,
          clinicalDateTime: document.recordedAt,
        });
        const finalized = await this.versionRepository.update(document.id, {
          status: 'FINALIZED',
          finalizedAt: new Date(),
          finalizedByUser: { connect: { id: userId } },
          legalSnapshotJson: snapshot as unknown as JsonInput,
          verificationCode: generateVerificationCode(),
          officialPdfAvailableAt: new Date(),
        });
        await this.reflectStructuredDataToSharedTables(finalized, encounterId);
        return finalized;
      },
      createVersionFromFinalized: async (previous, input) => {
        const {
          id: _id,
          prescriptionId: _pId,
          versionNumber: _v,
          status: _status,
          previousVersionId: _pvi,
          recordedAt: _recordedAt,
          finalizedAt: _finalizedAt,
          finalizedByUserId: _fbui,
          createdByUserId: _cbui,
          legalSnapshotJson: _lsj,
          verificationCode: _vc,
          officialPdfAvailableAt: _opa,
          downloadCount: _dc,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...clonableContent
        } = previous;
        const validations = await this.runSafetyValidations(input.patientId, input.data);

        return this.versionRepository.create({
          prescription: { connect: { id: prescriptionId } },
          versionNumber: previous.versionNumber + 1,
          status: 'DRAFT',
          previousVersionId: previous.id,
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : new Date(),
          createdByUser: { connect: { id: input.userId } },
          ...clonableContent,
          ...definedEntries(this.mapDraftFields(input.data)),
          ...validations,
        } as unknown as Prisma.PrescriptionVersionCreateInput);
      },
    };
  }

  private mapDraftFields(data: SavePrescriptionDraftDto) {
    return {
      prescriptionType: data.prescriptionType,
      validityOption: data.validityOption,
      validityExpiresAt: data.validityExpiresAt ? new Date(data.validityExpiresAt) : undefined,
      primaryDiagnosisCode: data.primaryDiagnosisCode,
      primaryDiagnosisDescription: data.primaryDiagnosisDescription,
      secondaryDiagnosesJson: data.secondaryDiagnoses as unknown as JsonInput,
      generalInstructions: data.generalInstructions,
      medicationsJson: data.medications as unknown as JsonInput,
      criticalAlertAcknowledged: data.criticalAlertAcknowledged,
      criticalAlertJustification: data.criticalAlertJustification,
      warningSignsJson: data.warningSigns as unknown as JsonInput,
      nextAppointmentDate: data.nextAppointmentDate ? new Date(data.nextAppointmentDate) : undefined,
      educationInfoProvided: data.educationInfoProvided,
      educationNonPharmacological: data.educationNonPharmacological,
      patientComprehension: data.patientComprehension,
      educationalMaterialsJson: data.educationalMaterials as unknown as JsonInput,
      followUpType: data.followUpType,
      followUpInstructions: data.followUpInstructions,
    };
  }

  /// Recalcula alergias/duplicidad/interacciones en cada guardado (spec 4.10). Nunca inventa
  /// una validación que no tenga una fuente real detrás (interacciones queda NOT_CONFIGURED).
  private async runSafetyValidations(patientId: string, data: SavePrescriptionDraftDto) {
    const medications = data.medications ?? [];
    const allergies = await this.allergyRepository.findMany({
      where: { patientId, encounterId: null },
    });

    let allergyValidationStatus: string;
    const allergyMatches: Array<{ medication: string; substance: string }> = [];
    if (allergies.length === 0) {
      allergyValidationStatus = 'ALLERGY_INFO_UNAVAILABLE';
    } else {
      for (const medication of medications) {
        const medicationName = medication.medication?.toLowerCase().trim();
        if (!medicationName) continue;
        for (const allergy of allergies) {
          const substance = allergy.substance.toLowerCase().trim();
          if (medicationName.includes(substance) || substance.includes(medicationName)) {
            allergyMatches.push({ medication: medication.medication!, substance: allergy.substance });
          }
        }
      }
      allergyValidationStatus = allergyMatches.length > 0 ? 'MATCH_DETECTED' : 'NO_MATCHES_DETECTED';
    }

    const resolvedItems = await Promise.all(
      medications.map(async (medication) => {
        if (!medication.medication) return { name: '', activeIngredient: null, resolved: false };
        if (medication.activeIngredient) {
          return { name: medication.medication, activeIngredient: medication.activeIngredient, resolved: true };
        }
        const [catalogEntry] = await this.medicationCatalogRepository.findMany({
          where: { name: { equals: medication.medication, mode: 'insensitive' } },
          take: 1,
        });
        return {
          name: medication.medication,
          activeIngredient: catalogEntry?.activeIngredient ?? null,
          resolved: Boolean(catalogEntry?.activeIngredient),
        };
      }),
    );

    const groups = new Map<string, string[]>();
    for (const item of resolvedItems) {
      if (!item.name) continue;
      const key = (item.activeIngredient ?? item.name).toLowerCase().trim();
      const list = groups.get(key) ?? [];
      list.push(item.name);
      groups.set(key, list);
    }
    const duplicateGroups = [...groups.entries()].filter(([, names]) => names.length > 1);
    const anyUnresolved = resolvedItems.some((item) => item.name && !item.resolved);

    let duplicateTherapyValidationStatus: string;
    if (duplicateGroups.length > 0) {
      duplicateTherapyValidationStatus = 'DUPLICATES_DETECTED';
    } else if (anyUnresolved) {
      duplicateTherapyValidationStatus = 'LIMITED_ENGINE';
    } else {
      duplicateTherapyValidationStatus = 'NONE_DETECTED';
    }

    return {
      allergyValidationStatus,
      allergyValidationDetailJson: allergyMatches as unknown as JsonInput,
      duplicateTherapyValidationStatus,
      duplicateTherapyDetailJson: duplicateGroups.map(([key, names]) => ({ key, names })) as unknown as JsonInput,
      interactionValidationStatus: 'NOT_CONFIGURED',
    };
  }

  private async reflectStructuredDataToSharedTables(
    version: PrescriptionVersionModel,
    encounterId: string,
  ) {
    const prescription = await this.prescriptionRepository.findById(version.prescriptionId);
    if (!prescription) return;

    const sharedContext = {
      tenant: { connect: { id: prescription.tenantId } },
      encounter: { connect: { id: encounterId } },
      patient: { connect: { id: prescription.patientId } },
      sourceType: SOURCE_TYPE,
      sourceVersionId: version.id,
    };

    if (version.primaryDiagnosisDescription) {
      await this.diagnosisRepository.create({
        ...sharedContext,
        code: version.primaryDiagnosisCode ?? undefined,
        description: version.primaryDiagnosisDescription,
        isPrimary: true,
      });
    }

    const secondaryDiagnoses = Array.isArray(version.secondaryDiagnosesJson)
      ? (version.secondaryDiagnosesJson as Array<{ code?: string; description?: string; diagnosisType?: string }>)
      : [];
    for (const diagnosis of secondaryDiagnoses) {
      if (!diagnosis.description) continue;
      await this.diagnosisRepository.create({
        ...sharedContext,
        code: diagnosis.code,
        description: diagnosis.description,
        diagnosisType: diagnosis.diagnosisType,
        isPrimary: false,
      });
    }

    const medications = Array.isArray(version.medicationsJson)
      ? (version.medicationsJson as unknown as PrescriptionMedicationItemDto[])
      : [];
    for (const medication of medications) {
      if (!medication.medication) continue;
      await this.medicationRepository.create({
        ...sharedContext,
        medicationName: medication.medication,
        dose: medication.doseQuantity
          ? `${medication.doseQuantity} ${medication.doseUnit ?? ''}`.trim()
          : undefined,
        route: medication.route,
        frequency: medication.frequencyPreset,
        notes: medication.instructions,
      });
    }
  }

  private async recordModifyFinalizedDeniedIfApplicable(
    error: unknown,
    tenantId: string,
    userId: string,
    encounter: { id: string; facilityId: string; patientId: string },
  ) {
    const isForbidden = error instanceof Error && error.name === 'ForbiddenException';
    if (!isForbidden) return;

    await this.auditService.record({
      tenantId,
      userId,
      action: 'MODIFY_FINALIZED_DENIED' as AuditAction,
      entityType: 'PrescriptionVersion',
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { reason: (error as Error).message },
    });
  }
}
