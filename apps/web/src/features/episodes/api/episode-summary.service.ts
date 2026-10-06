import { apiRequest } from '../../../shared/http/api-client';

export interface EpisodeSummaryResponse {
  header: {
    patientId: string;
    patientFullName: string | null;
    encounterNumber: string;
    encounterType: string;
    encounterStatus: string;
    openedAt: string | null;
    closedAt: string | null;
    reasonForVisit: string | null;
    attendingUserId: string | null;
  };
  quickClinicalStatus: {
    allergiesCount: number;
    allergies: Array<{ substance: string; severity: string | null }>;
    activeProblemsCount: number;
    activeProblems: Array<{ id: string; description: string; status: string | null }>;
    activeMedicationsCount: number;
    pendingStudiesCount: number;
  };
  clinicalSummary: {
    chiefComplaint: string | null;
    primaryDiagnosis: { description: string; code: string | null; source: string } | null;
    clinicalStatus: string | null;
  };
  latestVitalSigns: Record<string, unknown> | null;
  diagnosesAndProblems: {
    documentedDiagnoses: Array<Record<string, unknown>>;
    longitudinalProblems: Array<{ id: string; description: string; status: string | null }>;
  };
  currentMedications: {
    chronic: Array<Record<string, unknown>>;
    latestPrescriptionMedications: Array<Record<string, unknown>> | null;
  };
  latestEvolution: {
    noteNumber: number;
    recordedAt?: string;
    clinicalStatus?: string | null;
    trend?: string | null;
    analysisSummary?: string | null;
    plan?: string | null;
  } | null;
  studiesAndResults: {
    labPending: number;
    labWithResult: number;
    imagingPending: number;
    imagingWithResult: number;
  };
  latestPrescription: {
    folio: string;
    status: string | null;
    recordedAt: string | null;
    medicationCount: number;
    nextAppointmentDate: string | null;
  } | null;
  documents: {
    counts: Record<string, number>;
    total: number;
    recent: Array<{ id: string; title: string; status: string; documentDate: string }>;
  };
  documentStatusOverview: {
    clinicalHistory: string;
    consultationNote: string;
    evolutionNotesCount: number;
    prescriptionsCount: number;
    documentsCount: number;
  };
  timeline: Array<{ action: string; entityType: string; createdAt: string }>;
}

export function fetchEpisodeSummary(token: string, encounterNumber: string) {
  return apiRequest<EpisodeSummaryResponse>(`/encounters/${encounterNumber}/summary`, {
    token,
  });
}
