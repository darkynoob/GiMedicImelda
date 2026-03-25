export interface PatientListItemResponse {
  id: string;
  fullName: string;
  curp: string | null;
  email: string | null;
  phone: string | null;
  sexAtBirth: string;
  birthDate: string | null;
  medicalRecordNumber: string | null;
  primaryIdentifier: string | null;
  lastEncounterAt: string | null;
}

export interface PatientsListResponse {
  items: PatientListItemResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PatientDetailResponse {
  id: string;
  tenantId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  curp: string | null;
  birthDate: string | null;
  sexAtBirth: string;
  maritalStatus: string | null;
  bloodType: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
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
