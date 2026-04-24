export interface EncounterCatalogOptionResponse {
  value: string;
  label: string;
}

export interface EncounterMetaResponse {
  encounterTypes: EncounterCatalogOptionResponse[];
  encounterStatuses: EncounterCatalogOptionResponse[];
  admissionSources: EncounterCatalogOptionResponse[];
  patients: Array<{
    id: string;
    fullName: string;
    curp: string | null;
    patientStatus: string;
    medicalUnit: string | null;
  }>;
  facilities: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  serviceAreas: Array<{
    id: string;
    name: string;
    facilityId: string;
    specialtyId: string | null;
  }>;
  specialties: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
  }>;
  clinicians: Array<{
    id: string;
    fullName: string;
    facilityId: string | null;
    professionalLicense: string | null;
  }>;
}

export interface EncountersListResponse {
  items: EncounterListItemResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EncounterListItemResponse {
  id: string;
  encounterNumber: string;
  encounterType: string;
  status: string;
  admissionSource: string | null;
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
  reasonForVisit: string | null;
  patient: {
    id: string;
    fullName: string;
    curp: string | null;
    ageLabel: string | null;
    sexAtBirth: string;
  };
  facility: {
    id: string;
    code: string;
    name: string;
  } | null;
  serviceArea: {
    id: string;
    name: string;
  } | null;
  specialty: {
    id: string;
    name: string;
  } | null;
  attendingClinician: {
    id: string;
    fullName: string;
  } | null;
  activeAlerts: string[];
  documentCount: number;
  diagnosisCount: number;
}

export interface EncounterDetailResponse {
  id: string;
  encounterNumber: string;
  encounterType: string;
  status: string;
  admissionSource: string | null;
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
  reasonForVisit: string | null;
  notes: string | null;
  patient: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    curp: string | null;
    sexAtBirth: string;
    birthDate: string | null;
    ageLabel: string | null;
    phone: string | null;
    email: string | null;
    bloodType: string | null;
    patientStatus: string;
    allergiesSummary: string[];
    activeProblems: string[];
  };
  facility: {
    id: string;
    code: string;
    name: string;
  } | null;
  serviceArea: {
    id: string;
    name: string;
    facilityId: string;
  } | null;
  specialty: {
    id: string;
    code: string;
    name: string;
  } | null;
  medicalRecord: {
    id: string;
    recordNumber: string;
    status: string;
  };
  attendingClinician: {
    id: string;
    fullName: string;
    professionalLicense: string | null;
  } | null;
  metrics: {
    documents: number;
    diagnoses: number;
    problems: number;
    allergies: number;
    medications: number;
    labs: number;
    imaging: number;
    attachments: number;
  };
  latestVitalSigns: Array<{
    label: string;
    value: string;
    unit: string;
  }>;
  diagnoses: Array<{
    id: string;
    code: string | null;
    description: string;
    diagnosisType: string | null;
    isPrimary: boolean;
  }>;
  problems: Array<{
    id: string;
    description: string;
    status: string | null;
  }>;
  allergies: Array<{
    id: string;
    substance: string;
    reaction: string | null;
    severity: string | null;
    status: string | null;
  }>;
  documents: Array<{
    id: string;
    title: string;
    status: string;
    documentDate: string;
    authorName: string | null;
  }>;
  sectionRecords: Array<{
    id: string;
    tabKey: string;
    noteType: string;
    title: string;
    status: string;
    recordedAt: string;
    updatedAt: string;
    signedAt: string | null;
    authorName: string | null;
    authorLicense: string | null;
    formData: Record<string, unknown>;
    metadata: {
      versionNumber: number | null;
      historyType: string | null;
      inheritedFromRecordId: string | null;
    };
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: string;
    uploadedAt: string;
  }>;
  timeline: Array<{
    id: string;
    label: string;
    timestamp: string;
    detail: string;
    kind: 'episode' | 'document' | 'vital' | 'diagnosis' | 'record' | 'attachment';
  }>;
  profile: {
    encounterType: string;
    sections: Record<string, unknown>;
    alerts: string[];
  };
}
