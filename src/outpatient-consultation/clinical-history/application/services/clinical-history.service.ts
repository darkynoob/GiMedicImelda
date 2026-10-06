import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';

type JsonInput = NonNullable<Prisma.InputJsonValue>;
import { ENCOUNTER_REPOSITORY } from '../../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../../shared/persistence/repositories/encounter.repository';
import { CLINICALHISTORY_REPOSITORY } from '../../../../shared/persistence/tokens/clinicalHistory.token';
import type { ClinicalHistoryRepository } from '../../../../shared/persistence/repositories/clinicalHistory.repository';
import { CLINICALHISTORYVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/clinicalHistoryVersion.token';
import type { ClinicalHistoryVersionRepository } from '../../../../shared/persistence/repositories/clinicalHistoryVersion.repository';
import type { ClinicalHistoryVersionModel } from '../../../../shared/persistence/models/clinicalHistoryVersion.model';
import { ALLERGY_REPOSITORY } from '../../../../shared/persistence/tokens/allergy.token';
import type { AllergyRepository } from '../../../../shared/persistence/repositories/allergy.repository';
import { DIAGNOSIS_REPOSITORY } from '../../../../shared/persistence/tokens/diagnosis.token';
import type { DiagnosisRepository } from '../../../../shared/persistence/repositories/diagnosis.repository';
import { MEDICATIONSTATEMENT_REPOSITORY } from '../../../../shared/persistence/tokens/medicationStatement.token';
import type { MedicationStatementRepository } from '../../../../shared/persistence/repositories/medicationStatement.repository';
import { VITALSIGN_REPOSITORY } from '../../../../shared/persistence/tokens/vitalSign.token';
import type { VitalSignRepository } from '../../../../shared/persistence/repositories/vitalSign.repository';
import {
  ClinicalDocumentVersioningService,
  type ClinicalVersionPort,
} from '../../../shared/services/clinical-document-versioning.service';
import { PatientClinicalSnapshotService } from '../../../shared/services/patient-clinical-snapshot.service';
import { ClinicalAuditService } from '../../../shared/services/clinical-audit.service';
import { assertEncounterOpen } from '../../../shared/services/encounter-status.guard';
import { SaveClinicalHistoryDraftDto } from '../dto/save-clinical-history-draft.dto';

type DraftInput = {
  data: SaveClinicalHistoryDraftDto;
  userId: string;
  patientId: string;
};

const SOURCE_TYPE = 'CLINICAL_HISTORY_VERSION';

/// Quita las llaves cuyo valor es `undefined` para no pisar contenido clonado al mezclar
/// objetos con spread (regla 0.4: nueva versión parte de snapshot independiente de la anterior).
function definedEntries<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(CLINICALHISTORY_REPOSITORY)
    private readonly clinicalHistoryRepository: ClinicalHistoryRepository,
    @Inject(CLINICALHISTORYVERSION_REPOSITORY)
    private readonly versionRepository: ClinicalHistoryVersionRepository,
    @Inject(ALLERGY_REPOSITORY)
    private readonly allergyRepository: AllergyRepository,
    @Inject(DIAGNOSIS_REPOSITORY)
    private readonly diagnosisRepository: DiagnosisRepository,
    @Inject(MEDICATIONSTATEMENT_REPOSITORY)
    private readonly medicationRepository: MedicationStatementRepository,
    @Inject(VITALSIGN_REPOSITORY)
    private readonly vitalSignRepository: VitalSignRepository,
    private readonly versioning: ClinicalDocumentVersioningService,
    private readonly snapshotService: PatientClinicalSnapshotService,
    private readonly auditService: ClinicalAuditService,
  ) {}

  async getDetail(tenantId: string, encounterNumber: string) {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const clinicalHistory = await this.clinicalHistoryRepository.findByEncounterId(
      encounter.id,
    );
    if (!clinicalHistory) {
      return { clinicalHistory: null, versions: [] };
    }

    const versions = await this.versionRepository.findAllByClinicalHistoryId(
      clinicalHistory.id,
    );
    return { clinicalHistory, versions };
  }

  async saveDraft(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    data: SaveClinicalHistoryDraftDto,
  ): Promise<ClinicalHistoryVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const clinicalHistory = await this.getOrCreateClinicalHistory(encounter);
    const isFirstVersion =
      (await this.versionRepository.findAllByClinicalHistoryId(clinicalHistory.id))
        .length === 0;

    const port = this.buildPort(clinicalHistory.id, encounter.id, userId);

    try {
      const version = await this.versioning.saveDraft(port, clinicalHistory.id, {
        data,
        userId,
        patientId: encounter.patientId,
      });

      await this.auditService.record({
        tenantId,
        userId,
        action: isFirstVersion ? 'CREATE' : 'UPDATE_DRAFT',
        entityType: 'ClinicalHistoryVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { versionNumber: version.versionNumber },
      });

      return version;
    } catch (error) {
      await this.recordModifyFinalizedDeniedIfApplicable(
        error,
        tenantId,
        userId,
        encounter,
      );
      throw error;
    }
  }

  async finalize(
    tenantId: string,
    userId: string,
    encounterNumber: string,
  ): Promise<ClinicalHistoryVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const clinicalHistory = await this.clinicalHistoryRepository.findByEncounterId(
      encounter.id,
    );
    if (!clinicalHistory) {
      throw new NotFoundException('No existe Historia clínica para este episodio.');
    }

    const port = this.buildPort(clinicalHistory.id, encounter.id, userId);

    try {
      const version = await this.versioning.finalize(
        port,
        clinicalHistory.id,
        (draft) => {
          if (!draft.currentIllness?.trim() && !draft.primaryDiagnosisDescription?.trim()) {
            throw new BadRequestException(
              'Captura al menos el padecimiento actual o un diagnóstico antes de finalizar.',
            );
          }
        },
      );

      await this.auditService.record({
        tenantId,
        userId,
        action: 'FINALIZE',
        entityType: 'ClinicalHistoryVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { versionNumber: version.versionNumber },
      });

      return version;
    } catch (error) {
      await this.recordModifyFinalizedDeniedIfApplicable(
        error,
        tenantId,
        userId,
        encounter,
      );
      throw error;
    }
  }

  async createNewVersion(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    data: SaveClinicalHistoryDraftDto,
  ): Promise<ClinicalHistoryVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const clinicalHistory = await this.clinicalHistoryRepository.findByEncounterId(
      encounter.id,
    );
    if (!clinicalHistory) {
      throw new NotFoundException('No existe Historia clínica para este episodio.');
    }

    const port = this.buildPort(clinicalHistory.id, encounter.id, userId);
    const version = await this.versioning.createNewVersion(
      port,
      clinicalHistory.id,
      { data, userId, patientId: encounter.patientId },
    );

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE_VERSION',
      entityType: 'ClinicalHistoryVersion',
      entityId: version.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: {
        versionNumber: version.versionNumber,
        previousVersionId: version.previousVersionId,
      },
    });

    return version;
  }

  // --- Internos -----------------------------------------------------------

  private async resolveEncounter(tenantId: string, encounterNumber: string) {
    const [encounter] = await this.encounterRepository.findMany({
      where: { tenantId, encounterNumber },
      take: 1,
    });
    if (!encounter) {
      throw new NotFoundException('Episodio no encontrado.');
    }
    return encounter;
  }

  private async getOrCreateClinicalHistory(encounter: {
    id: string;
    tenantId: string;
    patientId: string;
    medicalRecordId: string;
  }) {
    const existing = await this.clinicalHistoryRepository.findByEncounterId(
      encounter.id,
    );
    if (existing) return existing;

    return this.clinicalHistoryRepository.create({
      tenant: { connect: { id: encounter.tenantId } },
      encounter: { connect: { id: encounter.id } },
      patient: { connect: { id: encounter.patientId } },
      medicalRecord: { connect: { id: encounter.medicalRecordId } },
    });
  }

  private buildPort(
    clinicalHistoryId: string,
    encounterId: string,
    userId: string,
  ): ClinicalVersionPort<ClinicalHistoryVersionModel, DraftInput> {
    return {
      findCurrentDraft: (id) => this.versionRepository.findCurrentDraft(id),
      findLatestFinalized: (id) => this.versionRepository.findLatestFinalized(id),
      createInitialDraft: async (id, input) => {
        const allergies = await this.loadAllergySnapshot(input.patientId);
        return this.versionRepository.create({
          clinicalHistory: { connect: { id } },
          versionNumber: 1,
          status: 'DRAFT',
          previousVersionId: null,
          recordedAt: input.data.recordedAt
            ? new Date(input.data.recordedAt)
            : new Date(),
          createdByUser: { connect: { id: input.userId } },
          allergiesSnapshotJson: allergies.json,
          allergiesStatus: allergies.status,
          ...definedEntries(this.mapDraftFields(input.data)),
        });
      },
      updateDraft: (document, input) =>
        this.versionRepository.update(document.id, {
          recordedAt: input.data.recordedAt
            ? new Date(input.data.recordedAt)
            : undefined,
          ...definedEntries(this.mapDraftFields(input.data)),
        }),
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
        });
        await this.reflectStructuredDataToSharedTables(finalized, encounterId);
        return finalized;
      },
      createVersionFromFinalized: async (previous, input) => {
        const {
          id: _id,
          clinicalHistoryId: _chId,
          versionNumber: _v,
          status: _status,
          previousVersionId: _pvi,
          recordedAt: _recordedAt,
          finalizedAt: _finalizedAt,
          finalizedByUserId: _fbui,
          createdByUserId: _cbui,
          allergiesSnapshotJson: _asj,
          allergiesStatus: _as,
          legalSnapshotJson: _lsj,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...clonableContent
        } = previous;
        const allergies = await this.loadAllergySnapshot(input.patientId);

        // Los campos Json clonados vienen tipados como `JsonValue | null` (payload de lectura
        // de Prisma); a nivel de ejecución son valores válidos para el create, solo difieren
        // del tipo de entrada esperado por el cliente generado.
        return this.versionRepository.create({
          clinicalHistory: { connect: { id: clinicalHistoryId } },
          versionNumber: previous.versionNumber + 1,
          status: 'DRAFT',
          previousVersionId: previous.id,
          recordedAt: input.data.recordedAt
            ? new Date(input.data.recordedAt)
            : new Date(),
          createdByUser: { connect: { id: input.userId } },
          allergiesSnapshotJson: allergies.json,
          allergiesStatus: allergies.status,
          ...clonableContent,
          ...definedEntries(this.mapDraftFields(input.data)),
        } as unknown as Prisma.ClinicalHistoryVersionCreateInput);
      },
    };
  }

  private mapDraftFields(data: SaveClinicalHistoryDraftDto) {
    return {
      currentIllness: data.currentIllness,
      familyHistoryDiabetes: data.familyHistoryDiabetes,
      familyHistoryHypertension: data.familyHistoryHypertension,
      familyHistoryCancer: data.familyHistoryCancer,
      familyHistoryHeartDisease: data.familyHistoryHeartDisease,
      familyHistoryStroke: data.familyHistoryStroke,
      familyHistoryKidneyDisease: data.familyHistoryKidneyDisease,
      familyHistoryAutoimmune: data.familyHistoryAutoimmune,
      familyHistoryPsychiatric: data.familyHistoryPsychiatric,
      familyHistoryOther: data.familyHistoryOther,
      familyHistoryOtherDetail: data.familyHistoryOtherDetail,
      familyHistoryNotes: data.familyHistoryNotes,
      personalPathologicalChronicDiseases: data.personalPathologicalChronicDiseases,
      personalPathologicalSurgical: data.personalPathologicalSurgical,
      personalPathologicalHospitalizations: data.personalPathologicalHospitalizations,
      personalPathologicalTraumatic: data.personalPathologicalTraumatic,
      personalPathologicalTransfusional: data.personalPathologicalTransfusional,
      personalPathologicalInfectious: data.personalPathologicalInfectious,
      nonPathologicalDiet: data.nonPathologicalDiet,
      nonPathologicalPhysicalActivity: data.nonPathologicalPhysicalActivity,
      nonPathologicalSmoking: data.nonPathologicalSmoking,
      nonPathologicalSmokingDetail: data.nonPathologicalSmokingDetail,
      nonPathologicalAlcohol: data.nonPathologicalAlcohol,
      nonPathologicalAlcoholDetail: data.nonPathologicalAlcoholDetail,
      nonPathologicalSubstances: data.nonPathologicalSubstances,
      nonPathologicalSubstancesDetail: data.nonPathologicalSubstancesDetail,
      nonPathologicalHousing: data.nonPathologicalHousing,
      nonPathologicalHygiene: data.nonPathologicalHygiene,
      nonPathologicalImmunizations: data.nonPathologicalImmunizations,
      gynecoMenarche: data.gynecoMenarche,
      gynecoMenstrualRhythm: data.gynecoMenstrualRhythm,
      gynecoMenstrualRhythmDetail: data.gynecoMenstrualRhythmDetail,
      gynecoLastMenstrualPeriod: data.gynecoLastMenstrualPeriod
        ? new Date(data.gynecoLastMenstrualPeriod)
        : undefined,
      gynecoSexualActivityOnsetAge: data.gynecoSexualActivityOnsetAge,
      gynecoPregnancies: data.gynecoPregnancies,
      gynecoBirths: data.gynecoBirths,
      gynecoMiscarriages: data.gynecoMiscarriages,
      gynecoCSections: data.gynecoCSections,
      gynecoFamilyPlanningMethod: data.gynecoFamilyPlanningMethod,
      gynecoFamilyPlanningDetail: data.gynecoFamilyPlanningDetail,
      gynecoMammographyDate: data.gynecoMammographyDate
        ? new Date(data.gynecoMammographyDate)
        : undefined,
      gynecoMammographyResult: data.gynecoMammographyResult,
      gynecoMenopauseStatus: data.gynecoMenopauseStatus,
      gynecoMenopauseAgeOrDate: data.gynecoMenopauseAgeOrDate,
      reviewCardiovascularStatus: data.reviewCardiovascularStatus,
      reviewCardiovascularDetail: data.reviewCardiovascularDetail,
      reviewRespiratoryStatus: data.reviewRespiratoryStatus,
      reviewRespiratoryDetail: data.reviewRespiratoryDetail,
      reviewDigestiveStatus: data.reviewDigestiveStatus,
      reviewDigestiveDetail: data.reviewDigestiveDetail,
      reviewGenitourinaryStatus: data.reviewGenitourinaryStatus,
      reviewGenitourinaryDetail: data.reviewGenitourinaryDetail,
      reviewMusculoskeletalStatus: data.reviewMusculoskeletalStatus,
      reviewMusculoskeletalDetail: data.reviewMusculoskeletalDetail,
      reviewNervousStatus: data.reviewNervousStatus,
      reviewNervousDetail: data.reviewNervousDetail,
      reviewEndocrineStatus: data.reviewEndocrineStatus,
      reviewEndocrineDetail: data.reviewEndocrineDetail,
      reviewSkinStatus: data.reviewSkinStatus,
      reviewSkinDetail: data.reviewSkinDetail,
      reviewHematologicStatus: data.reviewHematologicStatus,
      reviewHematologicDetail: data.reviewHematologicDetail,
      reviewOphthalmologicStatus: data.reviewOphthalmologicStatus,
      reviewOphthalmologicDetail: data.reviewOphthalmologicDetail,
      reviewEntStatus: data.reviewEntStatus,
      reviewEntDetail: data.reviewEntDetail,
      reviewPsychiatricStatus: data.reviewPsychiatricStatus,
      reviewPsychiatricDetail: data.reviewPsychiatricDetail,
      vitalTemperatureC: data.vitalTemperatureC,
      vitalSystolicBp: data.vitalSystolicBp,
      vitalDiastolicBp: data.vitalDiastolicBp,
      vitalHeartRate: data.vitalHeartRate,
      vitalRespiratoryRate: data.vitalRespiratoryRate,
      vitalWeightKg: data.vitalWeightKg,
      vitalHeightCm: data.vitalHeightCm,
      physicalExamGeneralAppearance: data.physicalExamGeneralAppearance,
      physicalExamHead: data.physicalExamHead,
      physicalExamNeck: data.physicalExamNeck,
      physicalExamChest: data.physicalExamChest,
      physicalExamAbdomen: data.physicalExamAbdomen,
      physicalExamExtremities: data.physicalExamExtremities,
      physicalExamGenitals: data.physicalExamGenitals,
      physicalExamOtherFindings: data.physicalExamOtherFindings,
      primaryDiagnosisCode: data.primaryDiagnosisCode,
      primaryDiagnosisDescription: data.primaryDiagnosisDescription,
      primaryDiagnosisType: data.primaryDiagnosisType,
      secondaryDiagnosesJson: data.secondaryDiagnoses as unknown as JsonInput,
      priorStudiesJson: data.priorStudies as unknown as JsonInput,
      priorStudiesSummary: data.priorStudiesSummary,
      currentTreatmentMedicationsJson: data.currentTreatmentMedications as unknown as JsonInput,
      chronicMedicationsJson: data.chronicMedications as unknown as JsonInput,
      nonPharmacologicalTreatment: data.nonPharmacologicalTreatment,
      followUpPlan: data.followUpPlan,
      prognosis: data.prognosis,
      pharmacologicalAdherence: data.pharmacologicalAdherence,
      nonPharmacologicalAdherence: data.nonPharmacologicalAdherence,
      adherenceNotes: data.adherenceNotes,
      riskFactorSmoking: data.riskFactorSmoking,
      riskFactorAlcohol: data.riskFactorAlcohol,
      riskFactorSedentary: data.riskFactorSedentary,
      riskFactorObesity: data.riskFactorObesity,
      riskFactorDiet: data.riskFactorDiet,
      riskFactorStress: data.riskFactorStress,
      riskFactorCardiovascularHistory: data.riskFactorCardiovascularHistory,
      riskFactorSubstanceUse: data.riskFactorSubstanceUse,
      riskFactorClassification: data.riskFactorClassification,
      riskFactorNotes: data.riskFactorNotes,
    };
  }

  private async loadAllergySnapshot(patientId: string) {
    const allergies = await this.allergyRepository.findMany({
      where: { patientId, encounterId: null },
    });

    return {
      json: allergies as unknown as JsonInput,
      status: allergies.length > 0 ? 'REGISTERED' : 'NOT_CAPTURED',
    };
  }

  private async reflectStructuredDataToSharedTables(
    version: ClinicalHistoryVersionModel,
    encounterId: string,
  ) {
    const clinicalHistory = await this.clinicalHistoryRepository.findById(
      version.clinicalHistoryId,
    );
    if (!clinicalHistory) return;

    const sharedContext = {
      tenant: { connect: { id: clinicalHistory.tenantId } },
      encounter: { connect: { id: encounterId } },
      patient: { connect: { id: clinicalHistory.patientId } },
      sourceType: SOURCE_TYPE,
      sourceVersionId: version.id,
    };

    if (version.primaryDiagnosisDescription) {
      await this.diagnosisRepository.create({
        ...sharedContext,
        code: version.primaryDiagnosisCode ?? undefined,
        description: version.primaryDiagnosisDescription,
        diagnosisType: version.primaryDiagnosisType ?? undefined,
        isPrimary: true,
      });
    }

    const secondaryDiagnoses = Array.isArray(version.secondaryDiagnosesJson)
      ? (version.secondaryDiagnosesJson as Array<{
          code?: string;
          description?: string;
          diagnosisType?: string;
        }>)
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

    if (
      version.vitalSystolicBp ||
      version.vitalDiastolicBp ||
      version.vitalHeartRate ||
      version.vitalRespiratoryRate ||
      version.vitalTemperatureC ||
      version.vitalWeightKg ||
      version.vitalHeightCm
    ) {
      await this.vitalSignRepository.create({
        ...sharedContext,
        takenAt: version.recordedAt,
        weightKg: version.vitalWeightKg ?? undefined,
        heightCm: version.vitalHeightCm ?? undefined,
        temperatureC: version.vitalTemperatureC ?? undefined,
        heartRate: version.vitalHeartRate ?? undefined,
        respiratoryRate: version.vitalRespiratoryRate ?? undefined,
        systolicBp: version.vitalSystolicBp ?? undefined,
        diastolicBp: version.vitalDiastolicBp ?? undefined,
      });
    }

    const medications = Array.isArray(version.currentTreatmentMedicationsJson)
      ? (version.currentTreatmentMedicationsJson as Array<{
          medication?: string;
          dose?: number;
          unit?: string;
          route?: string;
          frequency?: string;
          notes?: string;
        }>)
      : [];
    for (const medication of medications) {
      if (!medication.medication) continue;
      await this.medicationRepository.create({
        ...sharedContext,
        medicationName: medication.medication,
        dose: medication.dose ? `${medication.dose} ${medication.unit ?? ''}`.trim() : undefined,
        route: medication.route,
        frequency: medication.frequency,
        notes: medication.notes,
      });
    }
  }

  private async recordModifyFinalizedDeniedIfApplicable(
    error: unknown,
    tenantId: string,
    userId: string,
    encounter: { id: string; facilityId: string; patientId: string },
  ) {
    const isForbidden =
      error instanceof Error && error.name === 'ForbiddenException';
    if (!isForbidden) return;

    await this.auditService.record({
      tenantId,
      userId,
      action: 'MODIFY_FINALIZED_DENIED' as AuditAction,
      entityType: 'ClinicalHistoryVersion',
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { reason: (error as Error).message },
    });
  }
}
