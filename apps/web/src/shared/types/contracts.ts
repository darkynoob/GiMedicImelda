export interface AuthenticatedRoleResponse {
  code: string;
  name: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName: string;
  professionalLicense: string | null;
  tenant: {
    id: string;
    code: string;
    name: string;
  };
  facility: {
    id: string;
    code: string;
    name: string;
  } | null;
  roles: AuthenticatedRoleResponse[];
  permissions: string[];
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: CurrentUserResponse;
}

export interface DashboardSummaryResponse {
  tenant: {
    id: string;
    name: string;
  };
  metrics: Array<{
    label: string;
    value: number;
    accent: string;
  }>;
  recentEncounters: Array<{
    id: string;
    encounterNumber: string;
    encounterType: string;
    status: string;
    patientName: string;
    facilityName: string | null;
    openedAt: string;
  }>;
}

export interface EncounterMetaResponse {
  encounterTypes: Array<{ value: string; label: string }>;
  encounterStatuses: Array<{ value: string; label: string }>;
  admissionSources: Array<{ value: string; label: string }>;
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
  timeline: Array<{
    id: string;
    label: string;
    timestamp: string;
    detail: string;
    kind: 'episode' | 'document' | 'vital' | 'diagnosis';
  }>;
  profile: {
    encounterType: string;
    sections: Record<string, unknown>;
    alerts: string[];
  };
}

export interface PatientsListResponse {
  items: PatientListItemResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PatientListItemResponse {
  id: string;
  fullName: string;
  curp: string | null;
  email: string | null;
  phone: string | null;
  sexAtBirth: string;
  birthDate: string | null;
  ageLabel: string | null;
  patientStatus: string;
  medicalRecordNumber: string | null;
  primaryIdentifier: string | null;
  lastEncounterAt: string | null;
  encounterCount: number;
  allergiesSummary: string[];
  hasKnownAllergies: boolean | null;
}

export interface PatientDetailResponse {
  id: string;
  tenantId: string;
  externalCode: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  curp: string | null;
  rfc: string | null;
  birthDate: string | null;
  ageSnapshot: number | null;
  sexAtBirth: string;
  maritalStatus: string | null;
  bloodType: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  municipality: string | null;
  neighborhood: string | null;
  street: string | null;
  exteriorNumber: string | null;
  interiorNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  patientStatus: string;
  patientType: string | null;
  medicalUnit: string | null;
  hasKnownAllergies: boolean | null;
  allergiesNotes: string | null;
  occupation: string | null;
  educationLevel: string | null;
  religion: string | null;
  primaryLanguage: string | null;
  requiresTranslator: boolean | null;
  registrationSource: string | null;
  administrativeNotes: string | null;
  updatedAt: string;
  responsibleContact: {
    id: string;
    fullName: string;
    relationship: string | null;
    phone: string;
    alternatePhone: string | null;
    email: string | null;
    legalRepresentationType: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    notes: string | null;
  } | null;
  coverages: Array<{
    id: string;
    coverageType: string;
    providerName: string;
    planName: string | null;
    policyNumber: string | null;
    membershipNumber: string | null;
    insuredPersonName: string | null;
    relationshipToInsured: string | null;
    validFrom: string | null;
    validUntil: string | null;
    authorizationNotes: string | null;
    isPrimary: boolean;
  }>;
  documents: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    issuedBy: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    notes: string | null;
    isPrimary: boolean;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: string;
    uploadedAt: string;
  }>;
  allergies: Array<{
    id: string;
    substance: string;
    reaction: string | null;
    severity: string | null;
    status: string | null;
  }>;
  problems: Array<{
    id: string;
    description: string;
    status: string | null;
  }>;
  clinicalProfile: {
    id: string;
    organDonorStatus: string | null;
    rhFactor: string | null;
    pregnancyStatus: string | null;
    disabilityNotes: string | null;
    clinicalAlerts: string | null;
    clinicalObservations: string | null;
    chronicConditionsNotes: string | null;
    currentMedicationsNotes: string | null;
  } | null;
  demographicProfile: {
    id: string;
    preferredName: string | null;
    genderIdentity: string | null;
    preferredPronouns: string | null;
    nationality: string | null;
    countryOfBirth: string | null;
    stateOfBirth: string | null;
    ethnicGroup: string | null;
  } | null;
  billingProfile: {
    id: string;
    requiresInvoice: boolean;
    businessName: string | null;
    taxRfc: string | null;
    taxRegime: string | null;
    taxPostalCode: string | null;
    billingEmail: string | null;
    cfdiUse: string | null;
  } | null;
  identifiers: Array<{
    id: string;
    identifierType: string;
    identifierValue: string;
    isPrimary: boolean;
  }>;
  medicalRecords: Array<{
    id: string;
    recordNumber: string;
    status: string;
    facility: {
      id: string;
      code: string;
      name: string;
    } | null;
    lastEncounterAt: string | null;
  }>;
  recentEncounters: Array<{
    id: string;
    encounterNumber: string;
    encounterType: string;
    status: string;
    openedAt: string;
    closedAt: string | null;
    reasonForVisit: string | null;
    facilityName: string | null;
  }>;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  sexAtBirth: string;
  birthDate?: string;
  ageSnapshot?: number;
  maritalStatus?: string;
  bloodType?: string;
  curp?: string;
  rfc?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  municipality?: string;
  neighborhood?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  patientStatus: string;
  patientType: string;
  medicalUnit: string;
  hasKnownAllergies: boolean;
  allergiesNotes?: string;
  occupation?: string;
  educationLevel?: string;
  religion?: string;
  primaryLanguage?: string;
  requiresTranslator?: boolean;
  registrationSource?: string;
  administrativeNotes?: string;
  externalCode?: string;
  identifierType?: string;
  identifierValue?: string;
  recordNumber?: string;
  facilityId?: string;
}

export interface CreateEncounterRequest {
  patientId: string;
  facilityId?: string;
  serviceAreaId?: string;
  specialtyId?: string;
  attendingUserId?: string;
  encounterType: string;
  status?: string;
  admissionSource?: string;
  openedAt?: string;
  closedAt?: string;
  reasonForVisit?: string;
  notes?: string;
}

export interface UpdateEncounterRequest {
  facilityId?: string;
  serviceAreaId?: string;
  specialtyId?: string;
  attendingUserId?: string;
  encounterType?: string;
  status?: string;
  admissionSource?: string;
  openedAt?: string;
  closedAt?: string;
  reasonForVisit?: string;
  notes?: string;
  structuredSections?: Record<string, unknown>;
}

export interface UpdatePatientRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  sexAtBirth: string;
  birthDate?: string;
  ageSnapshot?: number;
  maritalStatus?: string;
  bloodType?: string;
  curp?: string;
  rfc?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  municipality?: string;
  neighborhood?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  patientStatus: string;
  patientType: string;
  medicalUnit: string;
  hasKnownAllergies: boolean;
  allergiesNotes?: string;
  occupation?: string;
  educationLevel?: string;
  religion?: string;
  primaryLanguage?: string;
  requiresTranslator?: boolean;
  registrationSource?: string;
  administrativeNotes?: string;
  externalCode?: string;
  identifierType?: string;
  identifierValue?: string;
  responsibleContact?: {
    fullName: string;
    relationship?: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
    legalRepresentationType?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
  };
  coverages?: Array<{
    coverageType: string;
    providerName: string;
    planName?: string;
    policyNumber?: string;
    membershipNumber?: string;
    insuredPersonName?: string;
    relationshipToInsured?: string;
    validFrom?: string;
    validUntil?: string;
    authorizationNotes?: string;
    isPrimary?: boolean;
  }>;
  documents?: Array<{
    documentType: string;
    documentNumber: string;
    issuedBy?: string;
    issuedAt?: string;
    expiresAt?: string;
    notes?: string;
    isPrimary?: boolean;
  }>;
  allergies?: Array<{
    substance: string;
    reaction?: string;
    severity?: string;
    status?: string;
  }>;
  problems?: Array<{
    description: string;
    status?: string;
  }>;
  clinicalProfile?: {
    organDonorStatus?: string;
    rhFactor?: string;
    pregnancyStatus?: string;
    disabilityNotes?: string;
    clinicalAlerts?: string;
    clinicalObservations?: string;
    chronicConditionsNotes?: string;
    currentMedicationsNotes?: string;
  };
  demographicProfile?: {
    preferredName?: string;
    genderIdentity?: string;
    preferredPronouns?: string;
    nationality?: string;
    countryOfBirth?: string;
    stateOfBirth?: string;
    ethnicGroup?: string;
  };
  billingProfile?: {
    requiresInvoice: boolean;
    businessName?: string;
    taxRfc?: string;
    taxRegime?: string;
    taxPostalCode?: string;
    billingEmail?: string;
    cfdiUse?: string;
  };
}
