import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import { ENCOUNTER_REPOSITORY } from '../../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../../shared/persistence/repositories/encounter.repository';
import { EVOLUTIONNOTE_REPOSITORY } from '../../../../shared/persistence/tokens/evolutionNote.token';
import type { EvolutionNoteRepository } from '../../../../shared/persistence/repositories/evolutionNote.repository';
import { EVOLUTIONNOTEVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/evolutionNoteVersion.token';
import type { EvolutionNoteVersionRepository } from '../../../../shared/persistence/repositories/evolutionNoteVersion.repository';
import type { EvolutionNoteVersionModel } from '../../../../shared/persistence/models/evolutionNoteVersion.model';
import type { EvolutionNoteModel } from '../../../../shared/persistence/models/evolutionNote.model';
import { DIAGNOSIS_REPOSITORY } from '../../../../shared/persistence/tokens/diagnosis.token';
import type { DiagnosisRepository } from '../../../../shared/persistence/repositories/diagnosis.repository';
import { VITALSIGN_REPOSITORY } from '../../../../shared/persistence/tokens/vitalSign.token';
import type { VitalSignRepository } from '../../../../shared/persistence/repositories/vitalSign.repository';
import { PROBLEM_REPOSITORY } from '../../../../shared/persistence/tokens/problem.token';
import type { ProblemRepository } from '../../../../shared/persistence/repositories/problem.repository';
import {
  ClinicalDocumentVersioningService,
  type ClinicalVersionPort,
} from '../../../shared/services/clinical-document-versioning.service';
import { PatientClinicalSnapshotService } from '../../../shared/services/patient-clinical-snapshot.service';
import { ClinicalAuditService } from '../../../shared/services/clinical-audit.service';
import { assertEncounterOpen } from '../../../shared/services/encounter-status.guard';
import { SaveEvolutionNoteDraftDto } from '../dto/save-evolution-note-draft.dto';

type DraftInput = {
  data: SaveEvolutionNoteDraftDto;
  userId: string;
  patientId: string;
};

const SOURCE_TYPE = 'EVOLUTION_NOTE_VERSION';
type JsonInput = NonNullable<Prisma.InputJsonValue>;

function definedEntries<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

@Injectable()
export class EvolutionNoteService {
  constructor(
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(EVOLUTIONNOTE_REPOSITORY)
    private readonly evolutionNoteRepository: EvolutionNoteRepository,
    @Inject(EVOLUTIONNOTEVERSION_REPOSITORY)
    private readonly versionRepository: EvolutionNoteVersionRepository,
    @Inject(DIAGNOSIS_REPOSITORY)
    private readonly diagnosisRepository: DiagnosisRepository,
    @Inject(VITALSIGN_REPOSITORY)
    private readonly vitalSignRepository: VitalSignRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly versioning: ClinicalDocumentVersioningService,
    private readonly snapshotService: PatientClinicalSnapshotService,
    private readonly auditService: ClinicalAuditService,
  ) {}

  /// Lista las notas de evolución del episodio (Evolución #1, #2...) con sus versiones.
  async listByEncounter(tenantId: string, encounterNumber: string) {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const notes = await this.evolutionNoteRepository.findAllByEncounterId(encounter.id);

    const notesWithVersions = await Promise.all(
      notes.map(async (note) => ({
        ...note,
        versions: await this.versionRepository.findAllByEvolutionNoteId(note.id),
      })),
    );

    return { notes: notesWithVersions };
  }

  /// Detalle de una nota con su comparación automática contra la evolución previa (spec 3.15).
  async getNoteDetail(tenantId: string, encounterNumber: string, noteId: string) {
    const { encounter, note } = await this.resolveNote(tenantId, encounterNumber, noteId);
    const versions = await this.versionRepository.findAllByEvolutionNoteId(note.id);
    const previous = await this.findPreviousFinalizedVersion(encounter.id, note.noteNumber);

    return {
      note,
      versions,
      previousEvolution: previous
        ? {
            noteNumber: previous.note.noteNumber,
            recordedAt: previous.version.recordedAt,
            clinicalStatus: previous.version.clinicalStatus,
          }
        : null,
    };
  }

  /// Crea una nueva Nota de evolución (evento clínico cronológico independiente, spec 3.3) con
  /// su primera versión en Borrador.
  async createNote(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    data: SaveEvolutionNoteDraftDto,
  ): Promise<EvolutionNoteVersionModel> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    assertEncounterOpen(encounter);
    const noteNumber = (await this.evolutionNoteRepository.countByEncounterId(encounter.id)) + 1;

    const note = await this.evolutionNoteRepository.create({
      tenant: { connect: { id: encounter.tenantId } },
      encounter: { connect: { id: encounter.id } },
      patient: { connect: { id: encounter.patientId } },
      medicalRecord: { connect: { id: encounter.medicalRecordId } },
      noteNumber,
    });

    const port = this.buildPort(note.id, encounter.id, userId);
    const version = await this.versioning.saveDraft(port, note.id, {
      data,
      userId,
      patientId: encounter.patientId,
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'EvolutionNoteVersion',
      entityId: version.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { noteNumber: note.noteNumber, versionNumber: version.versionNumber },
    });

    return version;
  }

  async saveDraft(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    noteId: string,
    data: SaveEvolutionNoteDraftDto,
  ): Promise<EvolutionNoteVersionModel> {
    const { encounter, note } = await this.resolveNote(tenantId, encounterNumber, noteId);
    assertEncounterOpen(encounter);
    const port = this.buildPort(note.id, encounter.id, userId);

    try {
      const version = await this.versioning.saveDraft(port, note.id, {
        data,
        userId,
        patientId: encounter.patientId,
      });

      await this.auditService.record({
        tenantId,
        userId,
        action: 'UPDATE_DRAFT',
        entityType: 'EvolutionNoteVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { noteNumber: note.noteNumber, versionNumber: version.versionNumber },
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
    noteId: string,
  ): Promise<EvolutionNoteVersionModel> {
    const { encounter, note } = await this.resolveNote(tenantId, encounterNumber, noteId);
    assertEncounterOpen(encounter);
    const port = this.buildPort(note.id, encounter.id, userId);

    try {
      const version = await this.versioning.finalize(port, note.id, (draft) => {
        const hasContent =
          draft.subjective?.trim() ||
          draft.objectiveFindings?.trim() ||
          draft.primaryDiagnosisDescription?.trim() ||
          draft.treatmentNotes?.trim();
        if (!hasContent) {
          throw new BadRequestException(
            'Captura contenido en Subjetivo, Objetivo, Análisis o Plan antes de finalizar.',
          );
        }
      });

      await this.auditService.record({
        tenantId,
        userId,
        action: 'FINALIZE',
        entityType: 'EvolutionNoteVersion',
        entityId: version.id,
        facilityId: encounter.facilityId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        metadata: { noteNumber: note.noteNumber, versionNumber: version.versionNumber },
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
    noteId: string,
    data: SaveEvolutionNoteDraftDto,
  ): Promise<EvolutionNoteVersionModel> {
    const { encounter, note } = await this.resolveNote(tenantId, encounterNumber, noteId);
    assertEncounterOpen(encounter);
    const port = this.buildPort(note.id, encounter.id, userId);
    const version = await this.versioning.createNewVersion(port, note.id, {
      data,
      userId,
      patientId: encounter.patientId,
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'CREATE_VERSION',
      entityType: 'EvolutionNoteVersion',
      entityId: version.id,
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: {
        noteNumber: note.noteNumber,
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

  private async resolveNote(
    tenantId: string,
    encounterNumber: string,
    noteId: string,
  ): Promise<{
    encounter: Awaited<ReturnType<EvolutionNoteService['resolveEncounter']>>;
    note: EvolutionNoteModel;
  }> {
    const encounter = await this.resolveEncounter(tenantId, encounterNumber);
    const note = await this.evolutionNoteRepository.findById(noteId);
    if (!note || note.encounterId !== encounter.id) {
      throw new NotFoundException('Nota de evolución no encontrada en este episodio.');
    }
    return { encounter, note };
  }

  /// 15. Comparación con evolución previa: resuelve, sin copiarla, la última nota de evolución
  /// Finalizada anterior a `beforeNoteNumber` dentro del mismo episodio.
  private async findPreviousFinalizedVersion(
    encounterId: string,
    beforeNoteNumber: number,
  ) {
    const previousNotes = await this.evolutionNoteRepository.findAllByEncounterId(encounterId);
    const candidates = previousNotes
      .filter((note) => note.noteNumber < beforeNoteNumber)
      .sort((a, b) => b.noteNumber - a.noteNumber);

    for (const candidate of candidates) {
      const finalized = await this.versionRepository.findLatestFinalized(candidate.id);
      if (finalized) {
        return { note: candidate, version: finalized };
      }
    }
    return null;
  }

  private buildPort(
    evolutionNoteId: string,
    encounterId: string,
    userId: string,
  ): ClinicalVersionPort<EvolutionNoteVersionModel, DraftInput> {
    return {
      findCurrentDraft: (id) => this.versionRepository.findCurrentDraft(id),
      findLatestFinalized: (id) => this.versionRepository.findLatestFinalized(id),
      createInitialDraft: (id, input) =>
        this.versionRepository.create({
          evolutionNote: { connect: { id } },
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
          evolutionNoteId: _enId,
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
          evolutionNote: { connect: { id: evolutionNoteId } },
          versionNumber: previous.versionNumber + 1,
          status: 'DRAFT',
          previousVersionId: previous.id,
          recordedAt: input.data.recordedAt ? new Date(input.data.recordedAt) : new Date(),
          createdByUser: { connect: { id: input.userId } },
          ...clonableContent,
          ...definedEntries(this.mapDraftFields(input.data)),
        } as unknown as Prisma.EvolutionNoteVersionCreateInput);
      },
    };
  }

  private mapDraftFields(data: SaveEvolutionNoteDraftDto) {
    return {
      clinicalStatus: data.clinicalStatus,
      complications: data.complications,
      subjective: data.subjective,
      vitalSystolicBp: data.vitalSystolicBp,
      vitalDiastolicBp: data.vitalDiastolicBp,
      vitalHeartRate: data.vitalHeartRate,
      vitalRespiratoryRate: data.vitalRespiratoryRate,
      vitalTemperatureC: data.vitalTemperatureC,
      vitalOxygenSaturation: data.vitalOxygenSaturation,
      vitalWeightKg: data.vitalWeightKg,
      vitalHeightCm: data.vitalHeightCm,
      vitalCapillaryGlucose: data.vitalCapillaryGlucose,
      vitalEva: data.vitalEva,
      objectiveFindings: data.objectiveFindings,
      recentResults: data.recentResults,
      primaryDiagnosisCode: data.primaryDiagnosisCode,
      primaryDiagnosisDescription: data.primaryDiagnosisDescription,
      primaryDiagnosisStatus: data.primaryDiagnosisStatus,
      primaryDiagnosisLinkedProblemId: data.primaryDiagnosisLinkedProblemId,
      secondaryDiagnosesJson: data.secondaryDiagnoses as unknown as JsonInput,
      prognosisStatus: data.prognosisStatus,
      prognosisDetail: data.prognosisDetail,
      treatmentChangeType: data.treatmentChangeType,
      treatmentNotes: data.treatmentNotes,
      proposedMedicationsJson: data.proposedMedications as unknown as JsonInput,
      plannedStudies: data.plannedStudies,
      plannedConsultations: data.plannedConsultations,
      followUpNotes: data.followUpNotes,
      nextAssessmentDate: data.nextAssessmentDate ? new Date(data.nextAssessmentDate) : undefined,
      consentCurrent: data.consentCurrent,
      informationProvided: data.informationProvided,
      trend: data.trend,
      comparativeAnalysis: data.comparativeAnalysis,
      pharmacologicalResponse: data.pharmacologicalResponse,
      adverseEvents: data.adverseEvents,
      clinicalJustification: data.clinicalJustification,
      glasgowOcular: data.glasgowOcular,
      glasgowVerbal: data.glasgowVerbal,
      glasgowMotor: data.glasgowMotor,
      cardiovascularRisk: data.cardiovascularRisk,
      karnofskyScore: data.karnofskyScore,
      otherScaleName: data.otherScaleName,
      otherScaleResult: data.otherScaleResult,
    };
  }

  private async reflectStructuredDataToSharedTables(
    version: EvolutionNoteVersionModel,
    encounterId: string,
  ) {
    const note = await this.evolutionNoteRepository.findById(version.evolutionNoteId);
    if (!note) return;

    const sharedContext = {
      tenant: { connect: { id: note.tenantId } },
      encounter: { connect: { id: encounterId } },
      patient: { connect: { id: note.patientId } },
      sourceType: SOURCE_TYPE,
      sourceVersionId: version.id,
    };

    if (version.primaryDiagnosisDescription) {
      await this.diagnosisRepository.create({
        ...sharedContext,
        code: version.primaryDiagnosisCode ?? undefined,
        description: version.primaryDiagnosisDescription,
        diagnosisType: version.primaryDiagnosisStatus ?? undefined,
        isPrimary: true,
      });
      if (version.primaryDiagnosisLinkedProblemId) {
        await this.touchLinkedProblem(version.primaryDiagnosisLinkedProblemId);
      }
    }

    const secondaryDiagnoses = Array.isArray(version.secondaryDiagnosesJson)
      ? (version.secondaryDiagnosesJson as Array<{
          code?: string;
          description?: string;
          status?: string;
          linkedProblemId?: string;
        }>)
      : [];
    for (const diagnosis of secondaryDiagnoses) {
      if (!diagnosis.description) continue;
      await this.diagnosisRepository.create({
        ...sharedContext,
        code: diagnosis.code,
        description: diagnosis.description,
        diagnosisType: diagnosis.status,
        isPrimary: false,
      });
      if (diagnosis.linkedProblemId) {
        await this.touchLinkedProblem(diagnosis.linkedProblemId);
      }
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
  }

  /// No modifica retrospectivamente el problema; solo se asegura de que exista (spec 3.12:
  /// "no modificar retrospectivamente evoluciones finalizadas si cambia el estado del problema").
  private async touchLinkedProblem(problemId: string) {
    await this.problemRepository.findById(problemId);
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
      entityType: 'EvolutionNoteVersion',
      facilityId: encounter.facilityId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      metadata: { reason: (error as Error).message },
    });
  }
}
