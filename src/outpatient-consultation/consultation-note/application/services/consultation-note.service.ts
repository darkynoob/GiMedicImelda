import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import { ENCOUNTER_REPOSITORY } from '../../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../../shared/persistence/repositories/encounter.repository';
import { CONSULTATIONNOTE_REPOSITORY } from '../../../../shared/persistence/tokens/consultationNote.token';
import type { ConsultationNoteRepository } from '../../../../shared/persistence/repositories/consultationNote.repository';
import { CONSULTATIONNOTEVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/consultationNoteVersion.token';
import type { ConsultationNoteVersionRepository } from '../../../../shared/persistence/repositories/consultationNoteVersion.repository';
import type { ConsultationNoteVersionModel } from '../../../../shared/persistence/models/consultationNoteVersion.model';
import { ALLERGY_REPOSITORY } from '../../../../shared/persistence/tokens/allergy.token';
import type { AllergyRepository } from '../../../../shared/persistence/repositories/allergy.repository';
import { MEDICATIONSTATEMENT_REPOSITORY } from '../../../../shared/persistence/tokens/medicationStatement.token';
import type { MedicationStatementRepository } from '../../../../shared/persistence/repositories/medicationStatement.repository';
import { DIAGNOSIS_REPOSITORY } from '../../../../shared/persistence/tokens/diagnosis.token';
import type { DiagnosisRepository } from '../../../../shared/persistence/repositories/diagnosis.repository';
import { VITALSIGN_REPOSITORY } from '../../../../shared/persistence/tokens/vitalSign.token';
import type { VitalSignRepository } from '../../../../shared/persistence/repositories/vitalSign.repository';
import {
  ClinicalDocumentVersioningService,
  type ClinicalVersionPort,
} from '../../../shared/services/clinical-document-versioning.service';
import { PatientClinicalSnapshotService } from '../../../shared/services/patient-clinical-snapshot.service';
import { ClinicalAuditService } from '../../../shared/services/clinical-audit.service';
import { assertEncounterOpen } from '../../../shared/services/encounter-status.guard';
import { SaveConsultationNoteDraftDto } from '../dto/save-consultation-note-draft.dto';

type DraftInput = {
  data: SaveConsultationNoteDraftDto;
  userId: string;
  patientId: string;
};

const SOURCE_TYPE = 'CONSULTATION_NOTE_VERSION';
type JsonInput = NonNullable<Prisma.InputJsonValue>;

function definedEntries<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/// Calcula el IMC a partir de peso/talla sin almacenarlo dos veces (spec 2.7: "read-only calculado").
function calculateBmi(weightKg: unknown, heightCm: unknown): number | null {
  const weight = weightKg ? Number(weightKg) : null;
  const height = heightCm ? Number(heightCm) : null;
  if (!weight || !height) return null;
  const heightMeters = height / 100;
  return Math.round((weight / (heightMeters * heightMeters)) * 10) / 10;
}

@Injectable()
export class ConsultationNoteService {
  constructor(
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(CONSULTATIONNOTE_REPOSITORY)
    private readonly consultationNoteRepository: ConsultationNoteRepository,
    @Inject(CONSULTATIONNOTEVERSION_REPOSITORY)
    private readonly versionRepository: ConsultationNoteVersionRepository,
    @Inject(ALLERGY_REPOSITORY)
    private readonly allergyRepository: AllergyRepository,
    @Inject(MEDICATIONSTATEMENT_REPOSITORY)
    private readonly medicationRepository: MedicationStatementRepository,
    @Inject(DIAGNOSIS_REPOSITORY)
    private readonly diagnosisRepository: DiagnosisRepository,
    @Inject(VITALSIGN_REPOSITORY)
    private readonly vitalSignRepository: VitalSignRepository,
    private readonly versioning: ClinicalDocumentVersioningService,
    private readonly snapshotService: PatientClinicalSnapshotService,
    private readonly auditService: ClinicalAuditService,
  ) {}

  async getDetail(tenantId: string, encounterNumber: string) {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const consultationNote = await this.consultationNoteRepository.findByEncounterId(
      encounter.id,
    );
    const referenceContext = await this.loadReferenceContext(encounter.patientId);

    if (!consultationNote) {
      return { consultationNote: null, versions: [], referenceContext };
    }

    const versions = await this.versionRepository.findAllByConsultationNoteId(
      consultationNote.id,
    );
    return {
      consultationNote,
      versions: versions.map((version) => ({
        ...version,
        bodyMassIndex: calculateBmi(version.vitalWeightKg, version.vitalHeightCm),
      })),
      referenceContext,
    };
  }

  async saveDraft(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    data: SaveConsultationNoteDraftDto,
  ): Promise<ConsultationNoteVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const consultationNote = await this.getOrCreateConsultationNote(encounter);
    const isFirstVersion =
      (await this.versionRepository.findAllByConsultationNoteId(consultationNote.id))
        .length === 0;

    const port = this.buildPort(consultationNote.id, encounter.id, userId);

    try {
      const version = await this.versioning.saveDraft(port, consultationNote.id, {
        data,
        userId,
        patientId: encounter.patientId,
      });

      await this.auditService.record({
        tenantId,
        userId,
        action: isFirstVersion ? 'CREATE' : 'UPDATE_DRAFT',
        entityType: 'ConsultationNoteVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { versionNumber: version.versionNumber },
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
  ): Promise<ConsultationNoteVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const consultationNote = await this.consultationNoteRepository.findByEncounterId(
      encounter.id,
    );
    if (!consultationNote) {
      throw new NotFoundException('No existe Consulta actual para este episodio.');
    }

    const port = this.buildPort(consultationNote.id, encounter.id, userId);

    try {
      const version = await this.versioning.finalize(
        port,
        consultationNote.id,
        (draft) => {
          if (!draft.chiefComplaint?.trim()) {
            throw new BadRequestException(
              'El motivo principal es obligatorio para finalizar la consulta.',
            );
          }
        },
      );

      await this.auditService.record({
        tenantId,
        userId,
        action: 'FINALIZE',
        entityType: 'ConsultationNoteVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { versionNumber: version.versionNumber },
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
    data: SaveConsultationNoteDraftDto,
  ): Promise<ConsultationNoteVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const consultationNote = await this.consultationNoteRepository.findByEncounterId(
      encounter.id,
    );
    if (!consultationNote) {
      throw new NotFoundException('No existe Consulta actual para este episodio.');
    }

    const port = this.buildPort(consultationNote.id, encounter.id, userId);
    const version = await this.versioning.createNewVersion(port, consultationNote.id, {
      data,
      userId,
      patientId: encounter.patientId,
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE_VERSION',
      entityType: 'ConsultationNoteVersion',
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
    if (!encounter) throw new NotFoundException('Episodio no encontrado.');
    return encounter;
  }

  /// 6. Antecedentes de referencia: solo lectura, tomados del perfil clínico transversal.
  private async loadReferenceContext(patientId: string) {
    const [allergies, chronicMedications] = await Promise.all([
      this.allergyRepository.findMany({ where: { patientId, encounterId: null } }),
      this.medicationRepository.findMany({ where: { patientId, encounterId: null } }),
    ]);
    return { allergies, chronicMedications };
  }

  private async getOrCreateConsultationNote(encounter: {
    id: string;
    tenantId: string;
    patientId: string;
    medicalRecordId: string;
  }) {
    const existing = await this.consultationNoteRepository.findByEncounterId(
      encounter.id,
    );
    if (existing) return existing;

    return this.consultationNoteRepository.create({
      tenant: { connect: { id: encounter.tenantId } },
      encounter: { connect: { id: encounter.id } },
      patient: { connect: { id: encounter.patientId } },
      medicalRecord: { connect: { id: encounter.medicalRecordId } },
    });
  }

  private buildPort(
    consultationNoteId: string,
    encounterId: string,
    userId: string,
  ): ClinicalVersionPort<ConsultationNoteVersionModel, DraftInput> {
    return {
      findCurrentDraft: (id) => this.versionRepository.findCurrentDraft(id),
      findLatestFinalized: (id) => this.versionRepository.findLatestFinalized(id),
      createInitialDraft: (id, input) =>
        this.versionRepository.create({
          consultationNote: { connect: { id } },
          versionNumber: 1,
          status: 'DRAFT',
          previousVersionId: null,
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : new Date(),
          createdByUser: { connect: { id: input.userId } },
          ...definedEntries(this.mapDraftFields(input.data)),
        }),
      updateDraft: (document, input) =>
        this.versionRepository.update(document.id, {
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : undefined,
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
          consultationNoteId: _cnId,
          versionNumber: _v,
          status: _status,
          previousVersionId: _pvi,
          recordedAt: _recordedAt,
          finalizedAt: _finalizedAt,
          finalizedByUserId: _fbui,
          createdByUserId: _cbui,
          legalSnapshotJson: _lsj,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...clonableContent
        } = previous;

        return this.versionRepository.create({
          consultationNote: { connect: { id: consultationNoteId } },
          versionNumber: previous.versionNumber + 1,
          status: 'DRAFT',
          previousVersionId: previous.id,
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : new Date(),
          createdByUser: { connect: { id: input.userId } },
          ...clonableContent,
          ...definedEntries(this.mapDraftFields(input.data)),
        } as unknown as Prisma.ConsultationNoteVersionCreateInput);
      },
    };
  }

  private mapDraftFields(data: SaveConsultationNoteDraftDto) {
    return {
      chiefComplaint: data.chiefComplaint,
      secondaryComplaint: data.secondaryComplaint,
      evolutionTimeValue: data.evolutionTimeValue,
      evolutionTimeUnit: data.evolutionTimeUnit,
      currentIllnessOnsetDate: data.currentIllnessOnsetDate
        ? new Date(data.currentIllnessOnsetDate)
        : undefined,
      currentIllnessEvolutionType: data.currentIllnessEvolutionType,
      currentIllnessDescription: data.currentIllnessDescription,
      currentIllnessEvaIntensity: data.currentIllnessEvaIntensity,
      currentIllnessLocation: data.currentIllnessLocation,
      currentIllnessIrradiation: data.currentIllnessIrradiation,
      currentIllnessAssociatedSymptoms: data.currentIllnessAssociatedSymptoms,
      currentIllnessAggravatingFactors: data.currentIllnessAggravatingFactors,
      currentIllnessRelievingFactors: data.currentIllnessRelievingFactors,
      currentIllnessPriorTreatments: data.currentIllnessPriorTreatments,
      vitalSystolicBp: data.vitalSystolicBp,
      vitalDiastolicBp: data.vitalDiastolicBp,
      vitalHeartRate: data.vitalHeartRate,
      vitalRespiratoryRate: data.vitalRespiratoryRate,
      vitalTemperatureC: data.vitalTemperatureC,
      vitalOxygenSaturation: data.vitalOxygenSaturation,
      vitalWeightKg: data.vitalWeightKg,
      vitalHeightCm: data.vitalHeightCm,
      vitalEva: data.vitalEva,
      vitalGlucose: data.vitalGlucose,
      vitalIrregularRhythm: data.vitalIrregularRhythm,
      examGeneralState: data.examGeneralState,
      examHeadStatus: data.examHeadStatus,
      examHeadDetail: data.examHeadDetail,
      examNeckStatus: data.examNeckStatus,
      examNeckDetail: data.examNeckDetail,
      examCardiovascularStatus: data.examCardiovascularStatus,
      examCardiovascularDetail: data.examCardiovascularDetail,
      examRespiratoryStatus: data.examRespiratoryStatus,
      examRespiratoryDetail: data.examRespiratoryDetail,
      examAbdomenStatus: data.examAbdomenStatus,
      examAbdomenDetail: data.examAbdomenDetail,
      examGenitourinaryStatus: data.examGenitourinaryStatus,
      examGenitourinaryDetail: data.examGenitourinaryDetail,
      examExtremitiesStatus: data.examExtremitiesStatus,
      examExtremitiesDetail: data.examExtremitiesDetail,
      examNeurologicalStatus: data.examNeurologicalStatus,
      examNeurologicalDetail: data.examNeurologicalDetail,
      examSkinStatus: data.examSkinStatus,
      examSkinDetail: data.examSkinDetail,
      examLymphaticStatus: data.examLymphaticStatus,
      examLymphaticDetail: data.examLymphaticDetail,
      priorResultsSummary: data.priorResultsSummary,
      primaryDiagnosisCode: data.primaryDiagnosisCode,
      primaryDiagnosisDescription: data.primaryDiagnosisDescription,
      primaryDiagnosisType: data.primaryDiagnosisType,
      primaryDiagnosisStatus: data.primaryDiagnosisStatus,
      secondaryDiagnosesJson: data.secondaryDiagnoses as unknown as JsonInput,
      pharmacologicalTreatmentJson: data.pharmacologicalTreatment as unknown as JsonInput,
      nonPharmacologicalTreatment: data.nonPharmacologicalTreatment,
      plannedStudies: data.plannedStudies,
      plannedReferrals: data.plannedReferrals,
      plannedConsultations: data.plannedConsultations,
      disabilityDays: data.disabilityDays,
      disabilityFrom: data.disabilityFrom ? new Date(data.disabilityFrom) : undefined,
      disabilityTo: data.disabilityTo ? new Date(data.disabilityTo) : undefined,
      disabilityReason: data.disabilityReason,
      prognosis: data.prognosis,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      consentCurrent: data.consentCurrent,
      consentExplanation: data.consentExplanation,
      consentComprehension: data.consentComprehension,
      riskSuddenSevereHeadache: data.riskSuddenSevereHeadache,
      riskFocalNeuroDeficit: data.riskFocalNeuroDeficit,
      riskVisionLoss: data.riskVisionLoss,
      riskChestPain: data.riskChestPain,
      riskDyspnea: data.riskDyspnea,
      riskHighFever: data.riskHighFever,
      riskUnexplainedWeightLoss: data.riskUnexplainedWeightLoss,
      riskActiveBleeding: data.riskActiveBleeding,
      riskAlteredConsciousness: data.riskAlteredConsciousness,
      riskFindingsNotes: data.riskFindingsNotes,
      functionalCapacity: data.functionalCapacity,
      functionalImpact: data.functionalImpact,
      functionalDescription: data.functionalDescription,
      pharmacologicalAdherence: data.pharmacologicalAdherence,
      nonPharmacologicalAdherence: data.nonPharmacologicalAdherence,
      adherenceNotes: data.adherenceNotes,
    };
  }

  private async reflectStructuredDataToSharedTables(
    version: ConsultationNoteVersionModel,
    encounterId: string,
  ) {
    const consultationNote = await this.consultationNoteRepository.findById(
      version.consultationNoteId,
    );
    if (!consultationNote) return;

    const sharedContext = {
      tenant: { connect: { id: consultationNote.tenantId } },
      encounter: { connect: { id: encounterId } },
      patient: { connect: { id: consultationNote.patientId } },
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
      version.vitalHeightCm ||
      version.vitalOxygenSaturation
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
        oxygenSaturation: version.vitalOxygenSaturation ?? undefined,
        painScale: version.vitalEva ?? undefined,
      });
    }

    const medications = Array.isArray(version.pharmacologicalTreatmentJson)
      ? (version.pharmacologicalTreatmentJson as Array<{
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
    const isForbidden = error instanceof Error && error.name === 'ForbiddenException';
    if (!isForbidden) return;

    await this.auditService.record({
      tenantId,
      userId,
      action: 'MODIFY_FINALIZED_DENIED' as AuditAction,
      entityType: 'ConsultationNoteVersion',
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { reason: (error as Error).message },
    });
  }
}
