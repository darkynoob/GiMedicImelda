import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ENCOUNTER_REPOSITORY } from '../../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../../shared/persistence/repositories/encounter.repository';
import { PATIENT_REPOSITORY } from '../../../../shared/persistence/tokens/patient.token';
import type { PatientRepository } from '../../../../shared/persistence/repositories/patient.repository';
import { ALLERGY_REPOSITORY } from '../../../../shared/persistence/tokens/allergy.token';
import type { AllergyRepository } from '../../../../shared/persistence/repositories/allergy.repository';
import { PROBLEM_REPOSITORY } from '../../../../shared/persistence/tokens/problem.token';
import type { ProblemRepository } from '../../../../shared/persistence/repositories/problem.repository';
import { MEDICATIONSTATEMENT_REPOSITORY } from '../../../../shared/persistence/tokens/medicationStatement.token';
import type { MedicationStatementRepository } from '../../../../shared/persistence/repositories/medicationStatement.repository';
import { DIAGNOSIS_REPOSITORY } from '../../../../shared/persistence/tokens/diagnosis.token';
import type { DiagnosisRepository } from '../../../../shared/persistence/repositories/diagnosis.repository';
import { VITALSIGN_REPOSITORY } from '../../../../shared/persistence/tokens/vitalSign.token';
import type { VitalSignRepository } from '../../../../shared/persistence/repositories/vitalSign.repository';
import { LABREQUEST_REPOSITORY } from '../../../../shared/persistence/tokens/labRequest.token';
import type { LabRequestRepository } from '../../../../shared/persistence/repositories/labRequest.repository';
import { LABRESULT_REPOSITORY } from '../../../../shared/persistence/tokens/labResult.token';
import type { LabResultRepository } from '../../../../shared/persistence/repositories/labResult.repository';
import { IMAGINGREQUEST_REPOSITORY } from '../../../../shared/persistence/tokens/imagingRequest.token';
import type { ImagingRequestRepository } from '../../../../shared/persistence/repositories/imagingRequest.repository';
import { IMAGINGREPORT_REPOSITORY } from '../../../../shared/persistence/tokens/imagingReport.token';
import type { ImagingReportRepository } from '../../../../shared/persistence/repositories/imagingReport.repository';
import { CLINICALDOCUMENT_REPOSITORY } from '../../../../shared/persistence/tokens/clinicalDocument.token';
import type { ClinicalDocumentRepository } from '../../../../shared/persistence/repositories/clinicalDocument.repository';
import { CLINICALHISTORY_REPOSITORY } from '../../../../shared/persistence/tokens/clinicalHistory.token';
import type { ClinicalHistoryRepository } from '../../../../shared/persistence/repositories/clinicalHistory.repository';
import { CLINICALHISTORYVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/clinicalHistoryVersion.token';
import type { ClinicalHistoryVersionRepository } from '../../../../shared/persistence/repositories/clinicalHistoryVersion.repository';
import { CONSULTATIONNOTE_REPOSITORY } from '../../../../shared/persistence/tokens/consultationNote.token';
import type { ConsultationNoteRepository } from '../../../../shared/persistence/repositories/consultationNote.repository';
import { CONSULTATIONNOTEVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/consultationNoteVersion.token';
import type { ConsultationNoteVersionRepository } from '../../../../shared/persistence/repositories/consultationNoteVersion.repository';
import { EVOLUTIONNOTE_REPOSITORY } from '../../../../shared/persistence/tokens/evolutionNote.token';
import type { EvolutionNoteRepository } from '../../../../shared/persistence/repositories/evolutionNote.repository';
import { EVOLUTIONNOTEVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/evolutionNoteVersion.token';
import type { EvolutionNoteVersionRepository } from '../../../../shared/persistence/repositories/evolutionNoteVersion.repository';
import { PRESCRIPTION_REPOSITORY } from '../../../../shared/persistence/tokens/prescription.token';
import type { PrescriptionRepository } from '../../../../shared/persistence/repositories/prescription.repository';
import { PRESCRIPTIONVERSION_REPOSITORY } from '../../../../shared/persistence/tokens/prescriptionVersion.token';
import type { PrescriptionVersionRepository } from '../../../../shared/persistence/repositories/prescriptionVersion.repository';
import { AUDITLOG_REPOSITORY } from '../../../../shared/persistence/tokens/auditLog.token';
import type { AuditLogRepository } from '../../../../shared/persistence/repositories/auditLog.repository';

const terminalLabStatuses = ['COMPLETADO', 'CANCELADO', 'CANCELLED', 'COMPLETED'];

/// Vista ejecutiva de solo lectura del episodio (spec capítulo 6). No almacena copias editables:
/// todo se consulta en vivo desde las fuentes originales (regla 6.17) en un único endpoint para
/// evitar N consultas redundantes por tarjeta (regla 6.22).
@Injectable()
export class EpisodeSummaryService {
  constructor(
    @Inject(ENCOUNTER_REPOSITORY) private readonly encounterRepository: EncounterRepository,
    @Inject(PATIENT_REPOSITORY) private readonly patientRepository: PatientRepository,
    @Inject(ALLERGY_REPOSITORY) private readonly allergyRepository: AllergyRepository,
    @Inject(PROBLEM_REPOSITORY) private readonly problemRepository: ProblemRepository,
    @Inject(MEDICATIONSTATEMENT_REPOSITORY)
    private readonly medicationRepository: MedicationStatementRepository,
    @Inject(DIAGNOSIS_REPOSITORY) private readonly diagnosisRepository: DiagnosisRepository,
    @Inject(VITALSIGN_REPOSITORY) private readonly vitalSignRepository: VitalSignRepository,
    @Inject(LABREQUEST_REPOSITORY) private readonly labRequestRepository: LabRequestRepository,
    @Inject(LABRESULT_REPOSITORY) private readonly labResultRepository: LabResultRepository,
    @Inject(IMAGINGREQUEST_REPOSITORY)
    private readonly imagingRequestRepository: ImagingRequestRepository,
    @Inject(IMAGINGREPORT_REPOSITORY)
    private readonly imagingReportRepository: ImagingReportRepository,
    @Inject(CLINICALDOCUMENT_REPOSITORY)
    private readonly clinicalDocumentRepository: ClinicalDocumentRepository,
    @Inject(CLINICALHISTORY_REPOSITORY)
    private readonly clinicalHistoryRepository: ClinicalHistoryRepository,
    @Inject(CLINICALHISTORYVERSION_REPOSITORY)
    private readonly clinicalHistoryVersionRepository: ClinicalHistoryVersionRepository,
    @Inject(CONSULTATIONNOTE_REPOSITORY)
    private readonly consultationNoteRepository: ConsultationNoteRepository,
    @Inject(CONSULTATIONNOTEVERSION_REPOSITORY)
    private readonly consultationNoteVersionRepository: ConsultationNoteVersionRepository,
    @Inject(EVOLUTIONNOTE_REPOSITORY)
    private readonly evolutionNoteRepository: EvolutionNoteRepository,
    @Inject(EVOLUTIONNOTEVERSION_REPOSITORY)
    private readonly evolutionNoteVersionRepository: EvolutionNoteVersionRepository,
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: PrescriptionRepository,
    @Inject(PRESCRIPTIONVERSION_REPOSITORY)
    private readonly prescriptionVersionRepository: PrescriptionVersionRepository,
    @Inject(AUDITLOG_REPOSITORY) private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async getSummary(tenantId: string, encounterNumber: string) {
    const [encounter] = await this.encounterRepository.findMany({
      where: { tenantId, encounterNumber },
      take: 1,
    });
    if (!encounter) throw new NotFoundException('Episodio no encontrado.');

    const patient = await this.patientRepository.findById(encounter.patientId);

    const [
      allergies,
      activeProblems,
      chronicMedications,
      diagnoses,
      latestVitalSign,
      labRequests,
      labResults,
      imagingRequests,
      imagingReports,
      documents,
      clinicalHistory,
      consultationNote,
      evolutionNotes,
      prescriptions,
      recentAuditEvents,
    ] = await Promise.all([
      this.allergyRepository.findMany({ where: { patientId: encounter.patientId, encounterId: null } }),
      this.problemRepository.findMany({
        where: { patientId: encounter.patientId, resolvedAt: null },
      }),
      this.medicationRepository.findMany({
        where: { patientId: encounter.patientId, encounterId: null },
      }),
      this.diagnosisRepository.findMany({
        where: { encounterId: encounter.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.vitalSignRepository.findMany({
        where: { encounterId: encounter.id },
        orderBy: { takenAt: 'desc' },
        take: 1,
      }),
      this.labRequestRepository.findMany({ where: { encounterId: encounter.id } }),
      this.labResultRepository.findMany({ where: { encounterId: encounter.id } }),
      this.imagingRequestRepository.findMany({ where: { encounterId: encounter.id } }),
      this.imagingReportRepository.findMany({ where: { encounterId: encounter.id } }),
      this.clinicalDocumentRepository.findMany({ where: { encounterId: encounter.id } }),
      this.clinicalHistoryRepository.findByEncounterId(encounter.id),
      this.consultationNoteRepository.findByEncounterId(encounter.id),
      this.evolutionNoteRepository.findAllByEncounterId(encounter.id),
      this.prescriptionRepository.findAllByEncounterId(encounter.id),
      this.auditLogRepository.findMany({
        where: { encounterId: encounter.id, action: { in: ['FINALIZE', 'CLOSE_EPISODE'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const clinicalHistoryLatestVersion = clinicalHistory
      ? (await this.clinicalHistoryVersionRepository.findAllByClinicalHistoryId(clinicalHistory.id))[0] ?? null
      : null;
    const consultationLatestVersion = consultationNote
      ? (await this.consultationNoteVersionRepository.findAllByConsultationNoteId(consultationNote.id))[0] ?? null
      : null;

    const evolutionNotesWithLatestVersion = await Promise.all(
      evolutionNotes.map(async (note) => ({
        note,
        latestFinalized: await this.evolutionNoteVersionRepository.findLatestFinalized(note.id),
      })),
    );
    const latestEvolution = evolutionNotesWithLatestVersion
      .filter((item) => item.latestFinalized)
      .sort((a, b) => b.note.noteNumber - a.note.noteNumber)[0] ?? null;

    const prescriptionsWithLatestVersion = await Promise.all(
      prescriptions.map(async (prescription) => ({
        prescription,
        latestVersion: (await this.prescriptionVersionRepository.findAllByPrescriptionId(prescription.id))[0] ?? null,
      })),
    );
    const latestPrescription = prescriptionsWithLatestVersion.sort(
      (a, b) => b.prescription.prescriptionNumber - a.prescription.prescriptionNumber,
    )[0] ?? null;

    const pendingLabs = labRequests.filter(
      (request) => !request.status || !terminalLabStatuses.includes(request.status.toUpperCase()),
    );
    const pendingImaging = imagingRequests.filter(
      (request) => !request.status || !terminalLabStatuses.includes(request.status.toUpperCase()),
    );

    const documentCountsByType = documents.reduce<Record<string, number>>((acc, document) => {
      const metadata = (document.metadataJson ?? {}) as { documentTypeCode?: string };
      const key = metadata.documentTypeCode ?? 'OTHER';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      header: {
        patientId: encounter.patientId,
        patientFullName: patient?.fullName ?? null,
        encounterNumber: encounter.encounterNumber,
        encounterType: encounter.encounterType,
        encounterStatus: encounter.status,
        openedAt: encounter.openedAt,
        closedAt: encounter.closedAt,
        reasonForVisit: encounter.reasonForVisit,
        attendingUserId: encounter.attendingUserId,
      },
      quickClinicalStatus: {
        allergiesCount: allergies.length,
        allergies: allergies.map((allergy) => ({ substance: allergy.substance, severity: allergy.severity })),
        activeProblemsCount: activeProblems.length,
        activeProblems: activeProblems.slice(0, 5).map((problem) => ({
          id: problem.id,
          description: problem.description,
          status: problem.status,
        })),
        activeMedicationsCount: chronicMedications.length,
        pendingStudiesCount: pendingLabs.length + pendingImaging.length,
      },
      clinicalSummary: {
        chiefComplaint: consultationLatestVersion?.chiefComplaint ?? encounter.reasonForVisit ?? null,
        primaryDiagnosis:
          consultationLatestVersion?.status === 'FINALIZED' && consultationLatestVersion.primaryDiagnosisDescription
            ? {
                description: consultationLatestVersion.primaryDiagnosisDescription,
                code: consultationLatestVersion.primaryDiagnosisCode,
                source: 'CONSULTATION_NOTE',
              }
            : latestEvolution?.latestFinalized?.primaryDiagnosisDescription
              ? {
                  description: latestEvolution.latestFinalized.primaryDiagnosisDescription,
                  code: latestEvolution.latestFinalized.primaryDiagnosisCode,
                  source: 'EVOLUTION_NOTE',
                }
              : null,
        clinicalStatus: latestEvolution?.latestFinalized?.clinicalStatus ?? null,
      },
      latestVitalSigns: latestVitalSign[0] ?? null,
      diagnosesAndProblems: {
        documentedDiagnoses: diagnoses.slice(0, 10),
        longitudinalProblems: activeProblems,
      },
      currentMedications: {
        chronic: chronicMedications,
        latestPrescriptionMedications: latestPrescription?.latestVersion?.medicationsJson ?? null,
      },
      latestEvolution: latestEvolution
        ? {
            noteNumber: latestEvolution.note.noteNumber,
            recordedAt: latestEvolution.latestFinalized?.recordedAt,
            clinicalStatus: latestEvolution.latestFinalized?.clinicalStatus,
            trend: latestEvolution.latestFinalized?.trend,
            analysisSummary: latestEvolution.latestFinalized?.primaryDiagnosisDescription,
            plan: latestEvolution.latestFinalized?.treatmentNotes,
          }
        : null,
      studiesAndResults: {
        labPending: pendingLabs.length,
        labWithResult: labResults.length,
        imagingPending: pendingImaging.length,
        imagingWithResult: imagingReports.length,
      },
      latestPrescription: latestPrescription
        ? {
            folio: latestPrescription.prescription.folio,
            status: latestPrescription.latestVersion?.status ?? null,
            recordedAt: latestPrescription.latestVersion?.recordedAt ?? null,
            medicationCount: Array.isArray(latestPrescription.latestVersion?.medicationsJson)
              ? (latestPrescription.latestVersion?.medicationsJson as unknown[]).length
              : 0,
            nextAppointmentDate: latestPrescription.latestVersion?.nextAppointmentDate ?? null,
          }
        : null,
      documents: {
        counts: documentCountsByType,
        total: documents.length,
        recent: documents.slice(0, 5).map((document) => ({
          id: document.id,
          title: document.title,
          status: document.status,
          documentDate: document.documentDate,
        })),
      },
      documentStatusOverview: {
        clinicalHistory: clinicalHistoryLatestVersion?.status ?? 'SIN_REGISTRO',
        consultationNote: consultationLatestVersion?.status ?? 'SIN_REGISTRO',
        evolutionNotesCount: evolutionNotes.length,
        prescriptionsCount: prescriptions.length,
        documentsCount: documents.length,
      },
      timeline: recentAuditEvents.map((event) => ({
        action: event.action,
        entityType: event.entityType,
        createdAt: event.createdAt,
      })),
    };
  }
}
