import { useEffect, useMemo, useState, type ReactNode, type ComponentType } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Paperclip,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
  UserRound,
  X,
  MapPin,
  UserCheck,
  FileText,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import type {
  PatientDetailResponse,
  UpdatePatientRequest,
} from '../../../shared/types/contracts';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  deletePatientAttachment,
  updatePatient,
  uploadPatientAttachments,
} from '../api/patients.service';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
const PHONE_REGEX = /^[\d\s\-+()]{10,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sexOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'INTERSEX', label: 'Intersexual' },
  { value: 'UNKNOWN', label: 'No especificado' },
] as const;

const patientStatusOptions = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
  { value: 'Fallecido', label: 'Fallecido' },
  { value: 'Bloqueado', label: 'Bloqueado' },
] as const;

const patientTypeOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'Ambulatorio', label: 'Ambulatorio' },
  { value: 'Hospitalizado', label: 'Hospitalizado' },
  { value: 'Urgencias', label: 'Urgencias' },
  { value: 'Externo', label: 'Externo' },
] as const;

const maritalStatusOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'SOLTERO', label: 'Soltero(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'UNION_LIBRE', label: 'Union libre' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUDO', label: 'Viudo(a)' },
] as const;

const bloodTypeOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'AB', label: 'AB' },
  { value: 'O', label: 'O' },
] as const;

const rhFactorOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'POSITIVO', label: 'Positivo' },
  { value: 'NEGATIVO', label: 'Negativo' },
] as const;

const allergyOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'yes', label: 'Si' },
  { value: 'no', label: 'No, sin alergias conocidas' },
] as const;

const booleanOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Si' },
] as const;

const invoiceOptions = [
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Si' },
] as const;

const educationOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'Ninguna', label: 'Ninguna' },
  { value: 'Primaria', label: 'Primaria' },
  { value: 'Secundaria', label: 'Secundaria' },
  { value: 'Preparatoria', label: 'Preparatoria' },
  { value: 'Licenciatura', label: 'Licenciatura' },
  { value: 'Posgrado', label: 'Posgrado' },
] as const;

const registrationSourceOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Telemedicina', label: 'Telemedicina' },
  { value: 'Referido', label: 'Referido' },
  { value: 'Urgencias', label: 'Urgencias' },
] as const;

const identifierTypeOptions = [
  { value: '', label: 'Sin identificador' },
  { value: 'NSS', label: 'NSS' },
  { value: 'POLIZA', label: 'Poliza' },
  { value: 'INE', label: 'INE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'LEGADO', label: 'Codigo legado' },
] as const;

const documentTypeOptions = [
  { value: 'CURP', label: 'CURP' },
  { value: 'INE', label: 'INE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'CARTILLA', label: 'Cartilla / credencial' },
] as const;

const coverageTypeOptions = [
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'SEGURO_PRIVADO', label: 'Seguro privado' },
  { value: 'PUBLICO', label: 'Cobertura publica' },
  { value: 'CONVENIO', label: 'Convenio / empresa' },
] as const;

const relationshipOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'MADRE', label: 'Madre' },
  { value: 'PADRE', label: 'Padre' },
  { value: 'ESPOSO', label: 'Esposo(a)' },
  { value: 'HIJO', label: 'Hijo(a)' },
  { value: 'HERMANO', label: 'Hermano(a)' },
  { value: 'TUTOR', label: 'Tutor(a)' },
  { value: 'OTRO', label: 'Otro' },
] as const;

const allergySeverityOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADA', label: 'Moderada' },
  { value: 'SEVERA', label: 'Severa' },
] as const;

const problemStatusOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'CONTROLADO', label: 'Controlado' },
  { value: 'RESUELTO', label: 'Resuelto' },
] as const;

const donorStatusOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'SI', label: 'Si' },
  { value: 'NO', label: 'No' },
  { value: 'DESCONOCIDO', label: 'Desconocido' },
] as const;

const pregnancyStatusOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'NO_APLICA', label: 'No aplica' },
  { value: 'NO', label: 'No' },
  { value: 'SOSPECHA', label: 'Sospecha' },
  { value: 'SI', label: 'Si' },
] as const;

const mexicanStates = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de Mexico',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de Mexico',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacan',
  'Morelos',
  'Nayarit',
  'Nuevo Leon',
  'Oaxaca',
  'Puebla',
  'Queretaro',
  'Quintana Roo',
  'San Luis Potosi',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatan',
  'Zacatecas',
] as const;

type ResponsibleFormState = {
  fullName: string;
  relationship: string;
  phone: string;
  alternatePhone: string;
  email: string;
  legalRepresentationType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
};

type CoverageFormState = {
  coverageType: string;
  providerName: string;
  planName: string;
  policyNumber: string;
  membershipNumber: string;
  insuredPersonName: string;
  relationshipToInsured: string;
  validFrom: string;
  validUntil: string;
  authorizationNotes: string;
  isPrimary: boolean;
};

type DocumentFormState = {
  documentType: string;
  documentNumber: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  notes: string;
  isPrimary: boolean;
};

type AllergyFormState = {
  substance: string;
  reaction: string;
  severity: string;
  status: string;
};

type ProblemFormState = {
  description: string;
  status: string;
};

type ClinicalProfileFormState = {
  organDonorStatus: string;
  rhFactor: string;
  pregnancyStatus: string;
  disabilityNotes: string;
  clinicalAlerts: string;
  clinicalObservations: string;
  chronicConditionsNotes: string;
  currentMedicationsNotes: string;
};

type DemographicProfileFormState = {
  preferredName: string;
  genderIdentity: string;
  preferredPronouns: string;
  nationality: string;
  countryOfBirth: string;
  stateOfBirth: string;
  ethnicGroup: string;
};

type BillingProfileFormState = {
  requiresInvoiceSelection: string;
  businessName: string;
  taxRfc: string;
  taxRegime: string;
  taxPostalCode: string;
  billingEmail: string;
  cfdiUse: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  sexAtBirth: string;
  birthDate: string;
  ageSnapshot: string;
  curp: string;
  rfc: string;
  externalCode: string;
  patientStatus: string;
  patientType: string;
  medicalUnit: string;
  phone: string;
  alternatePhone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  city: string;
  state: string;
  municipality: string;
  country: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  postalCode: string;
  maritalStatus: string;
  bloodType: string;
  identifierType: string;
  identifierValue: string;
  allergiesSelection: string;
  allergiesNotes: string;
  occupation: string;
  educationLevel: string;
  religion: string;
  primaryLanguage: string;
  requiresTranslatorSelection: string;
  registrationSource: string;
  administrativeNotes: string;
  responsible: ResponsibleFormState;
  coverages: CoverageFormState[];
  documents: DocumentFormState[];
  allergies: AllergyFormState[];
  problems: ProblemFormState[];
  clinicalProfile: ClinicalProfileFormState;
  demographicProfile: DemographicProfileFormState;
  billingProfile: BillingProfileFormState;
};

type FormErrors = Partial<Record<string, string>>;

const modalSections = [
  {
    id: 'identidad',
    title: 'Identidad del paciente',
    description:
      'Datos básicos para identificar al paciente en el sistema.',
  },
  {
    id: 'contacto',
    title: 'Contacto y facturacion',
    description: 'Medios de contacto y datos fiscales para comunicacion y comprobantes.',
  },
  {
    id: 'domicilio',
    title: 'Domicilio',
    description:
      'Dirección del paciente para contacto y seguimiento.',
  },
  {
    id: 'responsable',
    title: 'Responsable',
    description:
      'Contacto principal para decisiones, autorizaciones y seguimiento del paciente.',
  },
  {
    id: 'cobertura',
    title: 'Cobertura',
    description:
      'Aseguradoras, planes y condiciones de pago vinculadas al paciente.',
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description:
      'Documentos y archivos adjuntos vinculados al paciente.',
  },
  {
    id: 'clinico',
    title: 'Clinico',
    description:
      'Banderas clinicas rapidas, alergias y problemas activos del perfil.',
  },
  {
    id: 'demografico',
    title: 'Demografico',
    description:
      'Contexto social y de identidad ampliada util para atencion integral.',
  },
] as const;

type ModalSectionId = (typeof modalSections)[number]['id'];

const emptyResponsible: ResponsibleFormState = {
  fullName: '',
  relationship: '',
  phone: '',
  alternatePhone: '',
  email: '',
  legalRepresentationType: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MX',
  notes: '',
};

const emptyCoverage = (): CoverageFormState => ({
  coverageType: 'PARTICULAR',
  providerName: '',
  planName: '',
  policyNumber: '',
  membershipNumber: '',
  insuredPersonName: '',
  relationshipToInsured: '',
  validFrom: '',
  validUntil: '',
  authorizationNotes: '',
  isPrimary: false,
});

const emptyDocument = (): DocumentFormState => ({
  documentType: 'INE',
  documentNumber: '',
  issuedBy: '',
  issuedAt: '',
  expiresAt: '',
  notes: '',
  isPrimary: false,
});

const emptyAllergy = (): AllergyFormState => ({
  substance: '',
  reaction: '',
  severity: '',
  status: '',
});

const emptyProblem = (): ProblemFormState => ({
  description: '',
  status: '',
});

const emptyClinicalProfile: ClinicalProfileFormState = {
  organDonorStatus: '',
  rhFactor: '',
  pregnancyStatus: '',
  disabilityNotes: '',
  clinicalAlerts: '',
  clinicalObservations: '',
  chronicConditionsNotes: '',
  currentMedicationsNotes: '',
};

const emptyDemographicProfile: DemographicProfileFormState = {
  preferredName: '',
  genderIdentity: '',
  preferredPronouns: '',
  nationality: '',
  countryOfBirth: '',
  stateOfBirth: '',
  ethnicGroup: '',
};

const emptyBillingProfile: BillingProfileFormState = {
  requiresInvoiceSelection: 'false',
  businessName: '',
  taxRfc: '',
  taxRegime: '',
  taxPostalCode: '',
  billingEmail: '',
  cfdiUse: '',
};

function splitBloodType(
  bloodType: string | null,
  rhFactor: string | null | undefined,
) {
  if (!bloodType) {
    return {
      bloodType: '',
      rhFactor: rhFactor ?? '',
    };
  }

  if (bloodType.endsWith('+')) {
    return {
      bloodType: bloodType.slice(0, -1),
      rhFactor: rhFactor ?? 'POSITIVO',
    };
  }

  if (bloodType.endsWith('-')) {
    return {
      bloodType: bloodType.slice(0, -1),
      rhFactor: rhFactor ?? 'NEGATIVO',
    };
  }

  return {
    bloodType,
    rhFactor: rhFactor ?? '',
  };
}

function trimToUndefined(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function parseBooleanSelection(value: string) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function calculateAge(birthDate: string) {
  if (!birthDate) {
    return null;
  }

  const birthMoment = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthMoment.getFullYear();
  const monthDifference = today.getMonth() - birthMoment.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthMoment.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function hasAnyValue(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

function buildInitialState(patient: PatientDetailResponse): FormState {
  const primaryIdentifier =
    patient.identifiers.find((identifier) => identifier.isPrimary) ??
    patient.identifiers[0] ??
    null;
  const bloodTypeState = splitBloodType(
    patient.bloodType,
    patient.clinicalProfile?.rhFactor,
  );

  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    middleName: patient.middleName ?? '',
    sexAtBirth: patient.sexAtBirth,
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : '',
    ageSnapshot:
      patient.ageSnapshot !== null ? String(patient.ageSnapshot) : '',
    curp: patient.curp ?? '',
    rfc: patient.rfc ?? '',
    externalCode: patient.externalCode ?? '',
    patientStatus: patient.patientStatus,
    patientType: patient.patientType ?? '',
    medicalUnit: patient.medicalUnit ?? '',
    phone: patient.phone ?? '',
    alternatePhone: patient.alternatePhone ?? '',
    email: patient.email ?? '',
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactRelation: patient.emergencyContactRelation ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    municipality: patient.municipality ?? '',
    country: patient.country ?? 'MX',
    street: patient.street ?? '',
    exteriorNumber: patient.exteriorNumber ?? '',
    interiorNumber: patient.interiorNumber ?? '',
    neighborhood: patient.neighborhood ?? '',
    postalCode: patient.postalCode ?? '',
    maritalStatus: patient.maritalStatus ?? '',
    bloodType: bloodTypeState.bloodType,
    identifierType: primaryIdentifier?.identifierType ?? '',
    identifierValue: primaryIdentifier?.identifierValue ?? '',
    allergiesSelection:
      patient.hasKnownAllergies === true
        ? 'yes'
        : patient.hasKnownAllergies === false
          ? 'no'
          : '',
    allergiesNotes: patient.allergiesNotes ?? '',
    occupation: patient.occupation ?? '',
    educationLevel: patient.educationLevel ?? '',
    religion: patient.religion ?? '',
    primaryLanguage: patient.primaryLanguage ?? '',
    requiresTranslatorSelection:
      patient.requiresTranslator === true
        ? 'true'
        : patient.requiresTranslator === false
          ? 'false'
          : '',
    registrationSource: patient.registrationSource ?? '',
    administrativeNotes: patient.administrativeNotes ?? '',
    responsible: patient.responsibleContact
      ? {
          fullName: patient.responsibleContact.fullName,
          relationship: patient.responsibleContact.relationship ?? '',
          phone: patient.responsibleContact.phone,
          alternatePhone: patient.responsibleContact.alternatePhone ?? '',
          email: patient.responsibleContact.email ?? '',
          legalRepresentationType:
            patient.responsibleContact.legalRepresentationType ?? '',
          addressLine1: patient.responsibleContact.addressLine1 ?? '',
          addressLine2: patient.responsibleContact.addressLine2 ?? '',
          city: patient.responsibleContact.city ?? '',
          state: patient.responsibleContact.state ?? '',
          postalCode: patient.responsibleContact.postalCode ?? '',
          country: patient.responsibleContact.country ?? 'MX',
          notes: patient.responsibleContact.notes ?? '',
        }
      : emptyResponsible,
    coverages:
      patient.coverages.length > 0
        ? patient.coverages.map((coverage) => ({
            coverageType: coverage.coverageType,
            providerName: coverage.providerName,
            planName: coverage.planName ?? '',
            policyNumber: coverage.policyNumber ?? '',
            membershipNumber: coverage.membershipNumber ?? '',
            insuredPersonName: coverage.insuredPersonName ?? '',
            relationshipToInsured: coverage.relationshipToInsured ?? '',
            validFrom: coverage.validFrom
              ? coverage.validFrom.slice(0, 10)
              : '',
            validUntil: coverage.validUntil
              ? coverage.validUntil.slice(0, 10)
              : '',
            authorizationNotes: coverage.authorizationNotes ?? '',
            isPrimary: coverage.isPrimary,
          }))
        : [emptyCoverage()],
    documents:
      patient.documents.length > 0
        ? patient.documents.map((document) => ({
            documentType: document.documentType,
            documentNumber: document.documentNumber,
            issuedBy: document.issuedBy ?? '',
            issuedAt: document.issuedAt ? document.issuedAt.slice(0, 10) : '',
            expiresAt: document.expiresAt
              ? document.expiresAt.slice(0, 10)
              : '',
            notes: document.notes ?? '',
            isPrimary: document.isPrimary,
          }))
        : [emptyDocument()],
    allergies:
      patient.allergies.length > 0
        ? patient.allergies.map((allergy) => ({
            substance: allergy.substance,
            reaction: allergy.reaction ?? '',
            severity: allergy.severity ?? '',
            status: allergy.status ?? '',
          }))
        : [emptyAllergy()],
    problems:
      patient.problems.length > 0
        ? patient.problems.map((problem) => ({
            description: problem.description,
            status: problem.status ?? '',
          }))
        : [emptyProblem()],
    clinicalProfile: patient.clinicalProfile
      ? {
          organDonorStatus: patient.clinicalProfile.organDonorStatus ?? '',
          rhFactor: bloodTypeState.rhFactor,
          pregnancyStatus: patient.clinicalProfile.pregnancyStatus ?? '',
          disabilityNotes: patient.clinicalProfile.disabilityNotes ?? '',
          clinicalAlerts: patient.clinicalProfile.clinicalAlerts ?? '',
          clinicalObservations:
            patient.clinicalProfile.clinicalObservations ?? '',
          chronicConditionsNotes:
            patient.clinicalProfile.chronicConditionsNotes ?? '',
          currentMedicationsNotes:
            patient.clinicalProfile.currentMedicationsNotes ?? '',
        }
      : emptyClinicalProfile,
    demographicProfile: patient.demographicProfile
      ? {
          preferredName: patient.demographicProfile.preferredName ?? '',
          genderIdentity: patient.demographicProfile.genderIdentity ?? '',
          preferredPronouns: patient.demographicProfile.preferredPronouns ?? '',
          nationality: patient.demographicProfile.nationality ?? '',
          countryOfBirth: patient.demographicProfile.countryOfBirth ?? '',
          stateOfBirth: patient.demographicProfile.stateOfBirth ?? '',
          ethnicGroup: patient.demographicProfile.ethnicGroup ?? '',
        }
      : emptyDemographicProfile,
    billingProfile: patient.billingProfile
      ? {
          requiresInvoiceSelection: patient.billingProfile.requiresInvoice
            ? 'true'
            : 'false',
          businessName: patient.billingProfile.businessName ?? '',
          taxRfc: patient.billingProfile.taxRfc ?? '',
          taxRegime: patient.billingProfile.taxRegime ?? '',
          taxPostalCode: patient.billingProfile.taxPostalCode ?? '',
          billingEmail: patient.billingProfile.billingEmail ?? '',
          cfdiUse: patient.billingProfile.cfdiUse ?? '',
        }
      : emptyBillingProfile,
  };
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const hasBirthDateOrAge =
    form.birthDate.trim().length > 0 || form.ageSnapshot.trim().length > 0;

  if (!form.firstName.trim()) errors.firstName = 'Obligatorio';
  if (!form.lastName.trim()) errors.lastName = 'Obligatorio';
  if (!form.sexAtBirth) errors.sexAtBirth = 'Obligatorio';
  if (!hasBirthDateOrAge) {
    errors.birthDateOrAge = 'Captura fecha de nacimiento o edad referida';
  }
  if (!form.patientStatus.trim()) errors.patientStatus = 'Obligatorio';
  if (!form.patientType.trim()) errors.patientType = 'Obligatorio';
  if (!form.medicalUnit.trim()) errors.medicalUnit = 'Obligatorio';

  if (!form.phone.trim()) {
    errors.phone = 'Obligatorio';
  } else if (!PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = 'Formato invalido';
  }

  if (
    form.alternatePhone.trim() &&
    !PHONE_REGEX.test(form.alternatePhone.trim())
  ) {
    errors.alternatePhone = 'Formato invalido';
  }

  if (form.email.trim()) {
    if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Formato invalido';
    }
  }

  if (!form.city.trim()) errors.city = 'Obligatorio';
  if (!form.state.trim()) errors.state = 'Obligatorio';
  if (!form.allergiesSelection) errors.allergiesSelection = 'Obligatorio';

  if (form.allergiesSelection === 'yes' && !form.allergiesNotes.trim()) {
    errors.allergiesNotes = 'Especifica las alergias conocidas';
  }

  if (form.curp.trim() && !CURP_REGEX.test(form.curp.trim().toUpperCase())) {
    errors.curp = 'Formato CURP invalido';
  }

  if (form.rfc.trim() && !RFC_REGEX.test(form.rfc.trim().toUpperCase())) {
    errors.rfc = 'Formato RFC invalido';
  }

  if (
    form.emergencyContactPhone.trim() &&
    !PHONE_REGEX.test(form.emergencyContactPhone.trim())
  ) {
    errors.emergencyContactPhone = 'Formato invalido';
  }

  if (
    Boolean(form.identifierType.trim()) !== Boolean(form.identifierValue.trim())
  ) {
    errors.identifierValue = 'Captura tipo y valor del identificador';
  }

  if (
    hasAnyValue(Object.values(form.responsible)) &&
    !form.responsible.phone.trim()
  ) {
    errors.responsiblePhone = 'El telefono del responsable es obligatorio';
  }

  if (
    form.responsible.phone.trim() &&
    !PHONE_REGEX.test(form.responsible.phone.trim())
  ) {
    errors.responsiblePhone = 'Formato invalido';
  }

  if (
    form.responsible.alternatePhone.trim() &&
    !PHONE_REGEX.test(form.responsible.alternatePhone.trim())
  ) {
    errors.responsibleAlternatePhone = 'Formato invalido';
  }  

  if (form.responsible.email.trim()) {
    if (!EMAIL_REGEX.test(form.responsible.email.trim())) {
      errors.responsibleEmail = 'Formato invalido';
    }
  }

  if (form.billingProfile.requiresInvoiceSelection === 'true') {
    if (!form.billingProfile.businessName.trim()) {
      errors.billingBusinessName = 'Obligatorio';
    }
    if (
      !form.billingProfile.taxRfc.trim() ||
      !RFC_REGEX.test(form.billingProfile.taxRfc.trim().toUpperCase())
    ) {
      errors.billingTaxRfc = 'RFC fiscal invalido';
    }
    if (!form.billingProfile.taxRegime.trim()) {
      errors.billingTaxRegime = 'Obligatorio';
    }
    if (!form.billingProfile.taxPostalCode.trim()) {
      errors.billingTaxPostalCode = 'Obligatorio';
    }
    if (!form.billingProfile.billingEmail.trim()) {
      errors.billingEmail = 'Obligatorio';
    }
    if (!form.billingProfile.cfdiUse.trim()) {
      errors.billingCfdiUse = 'Obligatorio';
    }
    if (form.billingProfile.billingEmail.trim()) {
      if (!EMAIL_REGEX.test(form.billingProfile.billingEmail.trim())) {
        errors.billingEmail = 'Formato invalido';
      }
    }
  }


  const primaryCoverages = form.coverages.filter(
    (coverage) => coverage.isPrimary,
  );
  if (primaryCoverages.length > 1) {
    errors.coverages = 'Solo puede haber una cobertura primaria';
  }

  const primaryDocuments = form.documents.filter(
    (document) => document.isPrimary,
  );
  if (primaryDocuments.length > 1) {
    errors.documents = 'Solo puede haber un documento primario';
  }

  return errors;
}

function buildPayload(
  form: FormState,
  calculatedAge: number | null,
): UpdatePatientRequest {
  const normalizedCoverages = form.coverages
    .filter((coverage) =>
      hasAnyValue([
        coverage.providerName,
        coverage.planName,
        coverage.policyNumber,
        coverage.membershipNumber,
      ]),
    )
    .map((coverage) => ({
      coverageType: coverage.coverageType,
      providerName: coverage.providerName.trim(),
      planName: trimToUndefined(coverage.planName),
      policyNumber: trimToUndefined(coverage.policyNumber),
      membershipNumber: trimToUndefined(coverage.membershipNumber),
      insuredPersonName: trimToUndefined(coverage.insuredPersonName),
      relationshipToInsured: trimToUndefined(coverage.relationshipToInsured),
      validFrom: trimToUndefined(coverage.validFrom),
      validUntil: trimToUndefined(coverage.validUntil),
      authorizationNotes: trimToUndefined(coverage.authorizationNotes),
      isPrimary: coverage.isPrimary,
    }));

  const normalizedDocuments = form.documents
    .filter((document) =>
      hasAnyValue([
        document.documentType,
        document.documentNumber,
        document.issuedBy,
      ]),
    )
    .map((document) => ({
      documentType: document.documentType.trim(),
      documentNumber: document.documentNumber.trim(),
      issuedBy: trimToUndefined(document.issuedBy),
      issuedAt: trimToUndefined(document.issuedAt),
      expiresAt: trimToUndefined(document.expiresAt),
      notes: trimToUndefined(document.notes),
      isPrimary: document.isPrimary,
    }));

  const normalizedAllergies =
    form.allergiesSelection === 'yes'
      ? form.allergies
          .filter((allergy) => allergy.substance.trim().length > 0)
          .map((allergy) => ({
            substance: allergy.substance.trim(),
            reaction: trimToUndefined(allergy.reaction),
            severity: trimToUndefined(allergy.severity),
            status: trimToUndefined(allergy.status),
          }))
      : [];

  const normalizedProblems = form.problems
    .filter((problem) => problem.description.trim().length > 0)
    .map((problem) => ({
      description: problem.description.trim(),
      status: trimToUndefined(problem.status),
    }));

  const hasResponsibleContact = hasAnyValue(Object.values(form.responsible));

  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    middleName: trimToUndefined(form.middleName),
    sexAtBirth: form.sexAtBirth,
    birthDate: trimToUndefined(form.birthDate),
    ageSnapshot: form.birthDate
      ? (calculatedAge ?? undefined)
      : trimToUndefined(form.ageSnapshot)
        ? Number(form.ageSnapshot)
        : undefined,
    maritalStatus: trimToUndefined(form.maritalStatus),
    bloodType: trimToUndefined(form.bloodType),
    curp: trimToUndefined(form.curp)?.toUpperCase(),
    rfc: trimToUndefined(form.rfc)?.toUpperCase(),
    phone: trimToUndefined(form.phone),
    alternatePhone: trimToUndefined(form.alternatePhone),
    email: trimToUndefined(form.email),
    emergencyContactName: trimToUndefined(form.emergencyContactName),
    emergencyContactRelation: trimToUndefined(form.emergencyContactRelation),
    emergencyContactPhone: trimToUndefined(form.emergencyContactPhone),
    city: trimToUndefined(form.city),
    state: trimToUndefined(form.state),
    municipality: trimToUndefined(form.municipality),
    country: trimToUndefined(form.country),
    street: trimToUndefined(form.street),
    exteriorNumber: trimToUndefined(form.exteriorNumber),
    interiorNumber: trimToUndefined(form.interiorNumber),
    neighborhood: trimToUndefined(form.neighborhood),
    postalCode: trimToUndefined(form.postalCode),
    patientStatus: form.patientStatus.trim(),
    patientType: form.patientType.trim(),
    medicalUnit: form.medicalUnit.trim(),
    hasKnownAllergies: form.allergiesSelection === 'yes',
    allergiesNotes:
      form.allergiesSelection === 'yes'
        ? trimToUndefined(form.allergiesNotes)
        : undefined,
    occupation: trimToUndefined(form.occupation),
    educationLevel: trimToUndefined(form.educationLevel),
    religion: trimToUndefined(form.religion),
    primaryLanguage: trimToUndefined(form.primaryLanguage),
    requiresTranslator: parseBooleanSelection(form.requiresTranslatorSelection),
    registrationSource: trimToUndefined(form.registrationSource),
    administrativeNotes: trimToUndefined(form.administrativeNotes),
    externalCode: trimToUndefined(form.externalCode),
    identifierType: trimToUndefined(form.identifierType),
    identifierValue: trimToUndefined(form.identifierValue),
    responsibleContact: hasResponsibleContact
      ? {
          fullName: form.responsible.fullName.trim(),
          relationship: trimToUndefined(form.responsible.relationship),
          phone: form.responsible.phone.trim(),
          alternatePhone: trimToUndefined(form.responsible.alternatePhone),
          email: trimToUndefined(form.responsible.email),
          legalRepresentationType: trimToUndefined(
            form.responsible.legalRepresentationType,
          ),
          addressLine1: trimToUndefined(form.responsible.addressLine1),
          addressLine2: trimToUndefined(form.responsible.addressLine2),
          city: trimToUndefined(form.responsible.city),
          state: trimToUndefined(form.responsible.state),
          postalCode: trimToUndefined(form.responsible.postalCode),
          country: trimToUndefined(form.responsible.country),
          notes: trimToUndefined(form.responsible.notes),
        }
      : undefined,
    coverages: normalizedCoverages,
    documents: normalizedDocuments,
    allergies: normalizedAllergies,
    problems: normalizedProblems,
    clinicalProfile: hasAnyValue(Object.values(form.clinicalProfile))
      ? {
          organDonorStatus: trimToUndefined(
            form.clinicalProfile.organDonorStatus,
          ),
          rhFactor: trimToUndefined(form.clinicalProfile.rhFactor),
          pregnancyStatus: trimToUndefined(
            form.clinicalProfile.pregnancyStatus,
          ),
          disabilityNotes: trimToUndefined(
            form.clinicalProfile.disabilityNotes,
          ),
          clinicalAlerts: trimToUndefined(form.clinicalProfile.clinicalAlerts),
          clinicalObservations: trimToUndefined(
            form.clinicalProfile.clinicalObservations,
          ),
          chronicConditionsNotes: trimToUndefined(
            form.clinicalProfile.chronicConditionsNotes,
          ),
          currentMedicationsNotes: trimToUndefined(
            form.clinicalProfile.currentMedicationsNotes,
          ),
        }
      : undefined,
    demographicProfile: hasAnyValue(Object.values(form.demographicProfile))
      ? {
          preferredName: trimToUndefined(form.demographicProfile.preferredName),
          genderIdentity: trimToUndefined(
            form.demographicProfile.genderIdentity,
          ),
          preferredPronouns: trimToUndefined(
            form.demographicProfile.preferredPronouns,
          ),
          nationality: trimToUndefined(form.demographicProfile.nationality),
          countryOfBirth: trimToUndefined(
            form.demographicProfile.countryOfBirth,
          ),
          stateOfBirth: trimToUndefined(form.demographicProfile.stateOfBirth),
          ethnicGroup: trimToUndefined(form.demographicProfile.ethnicGroup),
        }
      : undefined,
    billingProfile:
      form.billingProfile.requiresInvoiceSelection === 'true'
        ? {
            requiresInvoice: true,
            businessName: trimToUndefined(form.billingProfile.businessName),
            taxRfc: trimToUndefined(form.billingProfile.taxRfc)?.toUpperCase(),
            taxRegime: trimToUndefined(form.billingProfile.taxRegime),
            taxPostalCode: trimToUndefined(form.billingProfile.taxPostalCode),
            billingEmail: trimToUndefined(form.billingProfile.billingEmail),
            cfdiUse: trimToUndefined(form.billingProfile.cfdiUse),
          }
        : {
            requiresInvoice: false,
          },
  };
}

function FieldShell({
  label,
  required = false,
  helper,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-clinical-alert-foreground"> *</span> : null}
      </span>
      {children}
      {error ? <p className="text-xs text-clinical-alert-foreground">{error}</p> : null}
      {!error && helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  helper,
  required = false,
  error,
  maxLength,
  onBlur,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  helper?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <FieldShell error={error} helper={helper} label={label} required={required}>
      <Input
        disabled={disabled}
        maxLength={maxLength}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  helper?: string;
}) {
  return (
    <FieldShell error={error} helper={helper} label={label} required={required}>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option
            key={`${label}-${option.value || 'empty'}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  error,
  helper,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  placeholder?: string;
}) {
  return (
    <FieldShell error={error} helper={helper} label={label} required={required}>
      <Textarea
        className="min-h-[92px]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </FieldShell>
  );
}

function Section({
  icon: Icon,
  sectionId,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  sectionId: ModalSectionId;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      className="scroll-mt-36 overflow-hidden rounded-2xl border border-gray-200 bg-white"
      data-section-id={sectionId}
      id={sectionId}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function CollectionCard({
  title,
  subtitle,
  onRemove,
  children,
}: {
  title: string;
  subtitle: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <button
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-red-600"
          onClick={onRemove}
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

interface PatientEditModalProps {
  patient: PatientDetailResponse;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientEditModal({
  patient,
  isOpen,
  onClose,
}: PatientEditModalProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => buildInitialState(patient));
  const [clientError, setClientError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<ModalSectionId>('identidad');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(buildInitialState(patient));
    setClientError(null);
    setActiveSection('identidad');
  }, [isOpen, patient]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const calculatedAge = useMemo(
    () => calculateAge(form.birthDate),
    [form.birthDate],
  );
  const formErrors = useMemo(() => validateForm(form), [form]);
  const isValid = Object.keys(formErrors).length === 0;

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));

    if (clientError) {
      setClientError(null);
    }
  };

  const updateResponsibleField = <K extends keyof ResponsibleFormState>(
    key: K,
    value: ResponsibleFormState[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      responsible: {
        ...currentForm.responsible,
        [key]: value,
      },
    }));
  };

  const updateClinicalProfileField = <K extends keyof ClinicalProfileFormState>(
    key: K,
    value: ClinicalProfileFormState[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      clinicalProfile: {
        ...currentForm.clinicalProfile,
        [key]: value,
      },
    }));
  };

  const updateDemographicProfileField = <
    K extends keyof DemographicProfileFormState,
  >(
    key: K,
    value: DemographicProfileFormState[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      demographicProfile: {
        ...currentForm.demographicProfile,
        [key]: value,
      },
    }));
  };

  const updateBillingProfileField = <K extends keyof BillingProfileFormState>(
    key: K,
    value: BillingProfileFormState[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      billingProfile: {
        ...currentForm.billingProfile,
        [key]: value,
      },
    }));
  };

  const updateCollectionItem = <
    K extends 'coverages' | 'documents' | 'allergies' | 'problems',
    T extends FormState[K][number],
    Field extends keyof T,
  >(
    collection: K,
    index: number,
    field: Field,
    value: T[Field],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [collection]: currentForm[collection].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ) as FormState[K],
    }));
  };

  const addCollectionItem = (
    collection: 'coverages' | 'documents' | 'allergies' | 'problems',
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [collection]:
        collection === 'coverages'
          ? [...currentForm.coverages, emptyCoverage()]
          : collection === 'documents'
            ? [...currentForm.documents, emptyDocument()]
            : collection === 'allergies'
              ? [...currentForm.allergies, emptyAllergy()]
              : [...currentForm.problems, emptyProblem()],
    }));
  };

  const removeCollectionItem = (
    collection: 'coverages' | 'documents' | 'allergies' | 'problems',
    index: number,
  ) => {
    setForm((currentForm) => {
      const nextCollection = currentForm[collection].filter(
        (_, itemIndex) => itemIndex !== index,
      );

      const fallback =
        collection === 'coverages'
          ? [emptyCoverage()]
          : collection === 'documents'
            ? [emptyDocument()]
            : collection === 'allergies'
              ? [emptyAllergy()]
              : [emptyProblem()];

      return {
        ...currentForm,
        [collection]: nextCollection.length > 0 ? nextCollection : fallback,
      };
    });
  };

  const markPrimaryItem = (
    collection: 'coverages' | 'documents',
    index: number,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [collection]: currentForm[collection].map((item, itemIndex) => ({
        ...item,
        isPrimary: itemIndex === index,
      })) as FormState[typeof collection],
    }));
  };

  const updatePatientMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('La sesion no esta disponible');
      }

      if (!isValid) {
        throw new Error('Completa los campos obligatorios antes de guardar');
      }

      return updatePatient(
        session.accessToken,
        patient.id,
        buildPayload(form, calculatedAge),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({
          queryKey: ['patient-detail', patient.id],
        }),
      ]);
      onClose();
    },
    onError: (error) => {
      setClientError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el paciente',
      );
    },
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!session) {
        throw new Error('La sesion no esta disponible');
      }

      return uploadPatientAttachments(session.accessToken, patient.id, files);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['patient-detail', patient.id],
      });
    },
    onError: (error) => {
      setClientError(
        error instanceof Error
          ? error.message
          : 'No fue posible subir los archivos del paciente',
      );
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      if (!session) {
        throw new Error('La sesion no esta disponible');
      }

      return deletePatientAttachment(session.accessToken, patient.id, attachmentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['patient-detail', patient.id],
      });
    },
    onError: (error) => {
      setClientError(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar el archivo adjunto',
      );
    },
  });

  if (!isOpen) {
    return null;
  }

  const scrollToSection = (sectionId: ModalSectionId) => {
    const sectionElement = document.getElementById(sectionId);
    sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/55 p-4 md:p-6"
      role="dialog"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border-slate-200 bg-slate-100 shadow-2xl">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                <UserRound className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  Edición de paciente
                </p>
                <h2 className="truncate text-lg font-semibold text-white">
                  {patient.fullName}
                </h2>
                <p className="text-xs text-white/60 truncate">
                  Perfil clínico, administrativo y cobertura
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-white/15 bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 gap-3 flex flex-wrap gap-2">
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs">
              <p className="text-primary-foreground/60">
                Expediente activo
              </p>
              <p className="text-xs text-primary-foreground">
                {patient.medicalRecords[0]?.recordNumber ?? 'Sin expediente'}
              </p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs">
              <p className="text-primary-foreground/60">
                Cobertura primaria
              </p>
              <p className="text-xs text-primary-foreground">
                {form.coverages.find((coverage) => coverage.isPrimary)
                  ?.providerName || 'Sin cobertura primaria'}
              </p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs">
              <p className="text-primary-foreground/60">
                Alertas clinicas
              </p>
              <p className="text-xs text-primary-foreground">
                {form.clinicalProfile.clinicalAlerts.trim() ||
                  (form.allergiesSelection === 'yes'
                    ? 'Con alergias registradas'
                    : 'Sin alertas clinicas')}
              </p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs">
              <p className="text-primary-foreground/60">
                Ultima actualizacion visible
              </p>
              <p className="text-xs text-primary-foreground">
                {new Date(patient.updatedAt).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>

        <form
          className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6"
          onSubmit={(event) => {
            event.preventDefault();
            setClientError(null);
            updatePatientMutation.mutate();
          }}
          onScroll={(event) => {
            const container = event.currentTarget;
            const visibleSections = Array.from(
              container.querySelectorAll<HTMLElement>('[data-section-id]'),
            );

            if (!visibleSections.length) {
              return;
            }

            const activeVisibleSection =
              visibleSections
              .map((section) => {
                const bounds = section.getBoundingClientRect();
                const containerBounds = container.getBoundingClientRect();

                return {
                  section,
                  offset: Math.abs(bounds.top - containerBounds.top - 120), // offset visual
                };
              })
              .sort((a, b) => a.offset - b.offset)[0]?.section;

            const nextSectionId = activeVisibleSection.dataset.sectionId as
              | ModalSectionId
              | undefined;

            if (nextSectionId && nextSectionId !== activeSection) {
              setActiveSection(nextSectionId);
            }
          }}
        >
          <div className="mx-auto space-y-5">
            {clientError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{clientError}</span>
              </div>
            ) : null}

            
            <div className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
                {modalSections.map((section, index) => {
                  const isCurrentSection = section.id === activeSection;

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      type="button"
                      className={`rounded-xl flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-xs font-medium transition
                        ${
                          isCurrentSection
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      {section.title}
                    </button>
                  );
                })}
              </div>
              <div className="px-3 pb-2">
                <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-300"
                    style={{
                      width: `${
                        ((modalSections.findIndex(s => s.id === activeSection) + 1) /
                          modalSections.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>


            <Section
              description={modalSections[0].description}
              sectionId="identidad"
              title={modalSections[0].title}
              icon={UserRound}
            >
              <TextField
                error={formErrors.firstName}
                label="Nombre(s)"
                onChange={(value) => updateField('firstName', value)}
                required
                value={form.firstName}
              />
              <TextField
                error={formErrors.lastName}
                label="Primer apellido"
                onChange={(value) => updateField('lastName', value)}
                required
                value={form.lastName}
              />
              <TextField
                label="Segundo apellido"
                onChange={(value) => updateField('middleName', value)}
                value={form.middleName}
              />
              <SelectField
                error={formErrors.sexAtBirth}
                label="Sexo biologico al nacer"
                onChange={(value) => updateField('sexAtBirth', value)}
                options={sexOptions}
                required
                value={form.sexAtBirth}
              />
              <TextField
                helper={
                  calculatedAge !== null
                    ? `Edad calculada: ${calculatedAge} anos`
                    : 'Captura la fecha si se conoce con precision.'
                }
                label="Fecha de nacimiento"
                onChange={(value) => updateField('birthDate', value)}
                type="date"
                value={form.birthDate}
              />
              <TextField
                disabled={Boolean(form.birthDate.trim())}
                error={formErrors.birthDateOrAge}
                helper={
                  form.birthDate.trim()
                    ? 'Se calcula automaticamente cuando ya hay fecha.'
                    : 'Usala cuando no se conoce la fecha exacta.'
                }
                label="Edad referida"
                onChange={(value) => updateField('ageSnapshot', value)}
                type="number"
                value={
                  form.birthDate.trim()
                    ? String(calculatedAge ?? '')
                    : form.ageSnapshot
                }
              />
              <SelectField
                error={formErrors.patientStatus}
                label="Estatus del paciente"
                onChange={(value) => updateField('patientStatus', value)}
                options={patientStatusOptions}
                required
                value={form.patientStatus}
              />
              <SelectField
                error={formErrors.patientType}
                label="Tipo de paciente"
                onChange={(value) => updateField('patientType', value)}
                options={patientTypeOptions}
                required
                value={form.patientType}
              />
              <TextField
                error={formErrors.medicalUnit}
                label="Unidad medica"
                onChange={(value) => updateField('medicalUnit', value)}
                required
                value={form.medicalUnit}
              />
              <TextField
                error={formErrors.curp}
                label="CURP"
                onChange={(value) => updateField('curp', value.toUpperCase())}
                value={form.curp}
              />
              <TextField
                error={formErrors.rfc}
                label="RFC"
                onChange={(value) => updateField('rfc', value.toUpperCase())}
                value={form.rfc}
              />
              <TextField
                label="Codigo externo"
                onChange={(value) => updateField('externalCode', value)}
                value={form.externalCode}
              />
              <SelectField
                label="Tipo de identificador principal"
                onChange={(value) => updateField('identifierType', value)}
                options={identifierTypeOptions}
                value={form.identifierType}
              />
              <TextField
                error={formErrors.identifierValue}
                label="Valor del identificador principal"
                onChange={(value) => updateField('identifierValue', value)}
                value={form.identifierValue}
              />
              <TextField
                label="Contacto de emergencia"
                onChange={(value) => updateField('emergencyContactName', value)}
                value={form.emergencyContactName}
              />
              <TextField
                label="Relacion de emergencia"
                onChange={(value) =>
                  updateField('emergencyContactRelation', value)
                }
                value={form.emergencyContactRelation}
              />
              <TextField
                error={formErrors.emergencyContactPhone}
                label="Telefono de emergencia"
                onChange={(value) =>
                  updateField('emergencyContactPhone', value)
                }
                value={form.emergencyContactPhone}
              />
            </Section>

            <Section
              description={modalSections[1].description}
              sectionId="contacto"
              title={modalSections[1].title}
              icon={Receipt}
            >
              <TextField
                error={formErrors.phone}
                label="Telefono principal"
                onChange={(value) => updateField('phone', value)}
                required
                value={form.phone}
              />
              <TextField
                error={formErrors.alternatePhone}
                label="Telefono alterno"
                onChange={(value) => updateField('alternatePhone', value)}
                value={form.alternatePhone}
              />
              <TextField
                error={formErrors.email}
                label="Correo electronico"
                onChange={(value) => updateField('email', value)}
                type="email"
                value={form.email}
              />
              <SelectField
                label="Requiere factura"
                onChange={(value) =>
                  updateBillingProfileField('requiresInvoiceSelection', value)
                }
                options={invoiceOptions}
                value={form.billingProfile.requiresInvoiceSelection}
              />
              {form.billingProfile.requiresInvoiceSelection === 'true' ? (
                <>
                  <TextField
                    error={formErrors.billingBusinessName}
                    label="Razon social"
                    onChange={(value) =>
                      updateBillingProfileField('businessName', value)
                    }
                    required
                    value={form.billingProfile.businessName}
                  />
                  <TextField
                    error={formErrors.billingTaxRfc}
                    label="RFC fiscal"
                    onChange={(value) =>
                      updateBillingProfileField('taxRfc', value.toUpperCase())
                    }
                    required
                    value={form.billingProfile.taxRfc}
                  />
                  <TextField
                    error={formErrors.billingTaxRegime}
                    label="Regimen fiscal"
                    onChange={(value) =>
                      updateBillingProfileField('taxRegime', value)
                    }
                    required
                    value={form.billingProfile.taxRegime}
                  />
                  <TextField
                    error={formErrors.billingTaxPostalCode}
                    label="C.P. fiscal"
                    onChange={(value) =>
                      updateBillingProfileField('taxPostalCode', value)
                    }
                    required
                    value={form.billingProfile.taxPostalCode}
                  />
                  <TextField
                    error={formErrors.billingEmail}
                    label="Correo de facturacion"
                    onChange={(value) =>
                      updateBillingProfileField('billingEmail', value)
                    }
                    required
                    type="email"
                    value={form.billingProfile.billingEmail}
                  />
                  <TextField
                    error={formErrors.billingCfdiUse}
                    label="Uso CFDI"
                    onChange={(value) =>
                      updateBillingProfileField('cfdiUse', value)
                    }
                    required
                    value={form.billingProfile.cfdiUse}
                  />
                </>
              ) : null}
            </Section>

            <Section
              description={modalSections[2].description}
              sectionId="domicilio"
              title={modalSections[2].title}
              icon={MapPin}
            >
              <TextField
                error={formErrors.city}
                label="Ciudad / localidad"
                onChange={(value) => updateField('city', value)}
                required
                value={form.city}
              />
              <SelectField
                error={formErrors.state}
                label="Estado"
                onChange={(value) => updateField('state', value)}
                options={[
                  { value: '', label: 'Selecciona un estado' },
                  ...mexicanStates.map((state) => ({
                    value: state,
                    label: state,
                  })),
                ]}
                required
                value={form.state}
              />
              <TextField
                label="Pais"
                onChange={(value) => updateField('country', value)}
                value={form.country}
              />
              <TextField
                label="Municipio / alcaldia"
                onChange={(value) => updateField('municipality', value)}
                value={form.municipality}
              />
              <TextField
                label="Colonia"
                onChange={(value) => updateField('neighborhood', value)}
                value={form.neighborhood}
              />
              <TextField
                label="Codigo postal"
                onChange={(value) => updateField('postalCode', value)}
                value={form.postalCode}
              />
              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-[minmax(0,1fr)_140px_140px]">
                <TextField
                  label="Calle"
                  onChange={(value) => updateField('street', value)}
                  value={form.street}
                />
                <TextField
                  label="No. exterior"
                  onChange={(value) => updateField('exteriorNumber', value)}
                  value={form.exteriorNumber}
                />
                <TextField
                  label="No. interior"
                  onChange={(value) => updateField('interiorNumber', value)}
                  value={form.interiorNumber}
                />
              </div>
            </Section>

            <Section
              description={modalSections[3].description}
              sectionId="responsable"
              title={modalSections[3].title}
              icon={UserCheck}
            >
              <TextField
                label="Nombre completo"
                onChange={(value) => updateResponsibleField('fullName', value)}
                value={form.responsible.fullName}
              />
              <SelectField
                label="Relacion"
                onChange={(value) =>
                  updateResponsibleField('relationship', value)
                }
                options={relationshipOptions}
                value={form.responsible.relationship}
              />
              <TextField
                error={formErrors.responsiblePhone}
                label="Telefono principal"
                onChange={(value) => updateResponsibleField('phone', value)}
                value={form.responsible.phone}
              />
              <TextField
                label="Telefono alterno"
                error={formErrors.responsibleAlternatePhone}
                onChange={(value) =>
                  updateResponsibleField('alternatePhone', value)
                }
                value={form.responsible.alternatePhone}
              />
              <TextField
                label="Correo electronico"
                error={formErrors.responsibleEmail}
                onChange={(value) => updateResponsibleField('email', value)}
                type="email"
                value={form.responsible.email}
              />
              <TextField
                label="Tipo de representacion"
                onChange={(value) =>
                  updateResponsibleField('legalRepresentationType', value)
                }
                value={form.responsible.legalRepresentationType}
              />
              <TextField
                label="Direccion principal"
                onChange={(value) =>
                  updateResponsibleField('addressLine1', value)
                }
                value={form.responsible.addressLine1}
              />
              <TextField
                label="Complemento de direccion"
                onChange={(value) =>
                  updateResponsibleField('addressLine2', value)
                }
                value={form.responsible.addressLine2}
              />
              <TextField
                label="Ciudad"
                onChange={(value) => updateResponsibleField('city', value)}
                value={form.responsible.city}
              />
              <TextField
                label="Estado"
                onChange={(value) => updateResponsibleField('state', value)}
                value={form.responsible.state}
              />
              <TextField
                label="Codigo postal"
                onChange={(value) =>
                  updateResponsibleField('postalCode', value)
                }
                value={form.responsible.postalCode}
              />
              <TextField
                label="Pais"
                onChange={(value) => updateResponsibleField('country', value)}
                value={form.responsible.country}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Notas del responsable"
                  onChange={(value) => updateResponsibleField('notes', value)}
                  value={form.responsible.notes}
                />
              </div>
            </Section>

            <Section
              description={modalSections[4].description}
              sectionId="cobertura"
              title={modalSections[4].title}
              icon={ShieldCheck}
            >
              <div className="md:col-span-2 space-y-4">
                {formErrors.coverages ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formErrors.coverages}
                  </div>
                ) : null}

                {form.coverages.map((coverage, index) => (
                  <CollectionCard
                    key={`coverage-${index}`}
                    onRemove={() => removeCollectionItem('coverages', index)}
                    subtitle={`${
                                coverageTypeOptions.find(
                                  (opt) => opt.value === coverage.coverageType
                                )?.label ?? 'Tipo desconocido'
                              } · ${coverage.providerName}`}
                    title={`Cobertura ${index + 1}`}
                  >
                    <SelectField
                      label="Tipo de cobertura"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'coverageType',
                          value,
                        )
                      }
                      options={coverageTypeOptions}
                      value={coverage.coverageType}
                    />
                    <TextField
                      label="Proveedor / aseguradora"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'providerName',
                          value,
                        )
                      }
                      value={coverage.providerName}
                    />
                    <TextField
                      label="Plan"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'planName',
                          value,
                        )
                      }
                      value={coverage.planName}
                    />
                    <TextField
                      label="Numero de poliza"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'policyNumber',
                          value,
                        )
                      }
                      value={coverage.policyNumber}
                    />
                    <TextField
                      label="Numero de afiliacion"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'membershipNumber',
                          value,
                        )
                      }
                      value={coverage.membershipNumber}
                    />
                    <TextField
                      label="Titular asegurado"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'insuredPersonName',
                          value,
                        )
                      }
                      value={coverage.insuredPersonName}
                    />
                    <TextField
                      label="Relacion con el titular"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'relationshipToInsured',
                          value,
                        )
                      }
                      value={coverage.relationshipToInsured}
                    />
                    <div
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 transition
                        ${
                          coverage.isPrimary
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            coverage.isPrimary ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-sm font-medium text-slate-800">
                          Cobertura primaria
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => markPrimaryItem('coverages', index)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition
                          ${coverage.isPrimary ? 'bg-emerald-500' : 'bg-slate-300'}
                        `}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                            ${coverage.isPrimary ? 'translate-x-4' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                    <TextField
                      label="Vigencia inicial"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'validFrom',
                          value,
                        )
                      }
                      type="date"
                      value={coverage.validFrom}
                    />
                    <TextField
                      label="Vigencia final"
                      onChange={(value) =>
                        updateCollectionItem(
                          'coverages',
                          index,
                          'validUntil',
                          value,
                        )
                      }
                      type="date"
                      value={coverage.validUntil}
                    />
                    <div className="md:col-span-2">
                      <TextAreaField
                        label="Notas de autorizacion"
                        onChange={(value) =>
                          updateCollectionItem(
                            'coverages',
                            index,
                            'authorizationNotes',
                            value,
                          )
                        }
                        value={coverage.authorizationNotes}
                      />
                    </div>
                  </CollectionCard>
                ))}

                <Button
                  onClick={() => addCollectionItem('coverages')}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Agregar cobertura
                </Button>
              </div>
            </Section>

            <Section
              description={modalSections[5].description}
              sectionId="documentos"
              title={modalSections[5].title}
              icon={FileText}
            >
              <div className="md:col-span-2 space-y-4">
                {formErrors.documents ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formErrors.documents}
                  </div>
                ) : null}

                {form.documents.map((document, index) => (
                  <CollectionCard
                    key={`document-${index}`}
                    onRemove={() => removeCollectionItem('documents', index)}
                    subtitle="Aqui vive el metadato del documento para referencia rapida desde el perfil."
                    title={`Documento ${index + 1}`}
                  >
                    <SelectField
                      label="Tipo de documento"
                      onChange={(value) =>
                        updateCollectionItem(
                          'documents',
                          index,
                          'documentType',
                          value,
                        )
                      }
                      options={documentTypeOptions}
                      value={document.documentType}
                    />
                    <TextField
                      label="Numero / folio"
                      onChange={(value) =>
                        updateCollectionItem(
                          'documents',
                          index,
                          'documentNumber',
                          value,
                        )
                      }
                      value={document.documentNumber}
                    />
                    <TextField
                      label="Emisor"
                      onChange={(value) =>
                        updateCollectionItem(
                          'documents',
                          index,
                          'issuedBy',
                          value,
                        )
                      }
                      value={document.issuedBy}
                    />
                    <div
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 transition
                        ${
                          document.isPrimary
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            document.isPrimary ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-sm font-medium text-slate-800">
                          Documento principal
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => markPrimaryItem('documents', index)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition
                          ${document.isPrimary ? 'bg-emerald-500' : 'bg-slate-300'}
                        `}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                            ${document.isPrimary ? 'translate-x-4' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                    <TextField
                      label="Fecha de emision"
                      onChange={(value) =>
                        updateCollectionItem(
                          'documents',
                          index,
                          'issuedAt',
                          value,
                        )
                      }
                      type="date"
                      value={document.issuedAt}
                    />
                    <TextField
                      label="Fecha de vencimiento"
                      onChange={(value) =>
                        updateCollectionItem(
                          'documents',
                          index,
                          'expiresAt',
                          value,
                        )
                      }
                      type="date"
                      value={document.expiresAt}
                    />
                    <div className="md:col-span-2">
                      <TextAreaField
                        label="Notas"
                        onChange={(value) =>
                          updateCollectionItem(
                            'documents',
                            index,
                            'notes',
                            value,
                          )
                        }
                        value={document.notes}
                      />
                    </div>
                  </CollectionCard>
                ))}

                <Button
                  onClick={() => addCollectionItem('documents')}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Agregar documento
                </Button>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 transition hover:border-slate-400 hover:bg-slate-100/60">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-slate-900/5 p-2 text-slate-700">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Archivos adjuntos
                        </p>
                        <p className="text-xs text-slate-500">
                          Sube documentos e imagenes del paciente
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                      <Upload className="h-4 w-4" />
                      {uploadAttachmentsMutation.isPending
                        ? 'Subiendo...'
                        : 'Subir archivos'}
                      <input
                        className="hidden"
                        multiple
                        onChange={(event) => {
                          const selectedFiles = Array.from(
                            event.target.files ?? [],
                          );

                          if (selectedFiles.length > 0) {
                            uploadAttachmentsMutation.mutate(selectedFiles);
                          }

                          event.currentTarget.value = '';
                        }}
                        type="file"
                      />
                    </label>
                  </div>

                  <div className="mt-4 space-y-3">
                    {patient.attachments.length > 0 ? (
                      patient.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                              <Paperclip className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-900">
                                {attachment.fileName}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                  {attachment.mimeType}
                                </span>
                                <span>
                                  {Math.max(1, Math.round(Number(attachment.fileSizeBytes) / 1024))} KB
                                </span>
                                <span>
                                  {new Date(attachment.uploadedAt).toLocaleString(
                                    'es-MX',
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            disabled={deleteAttachmentMutation.isPending}
                            onClick={() =>
                              deleteAttachmentMutation.mutate(attachment.id)
                            }
                            type="button"
                            variant="outline"
                            className="opacity-70 transition group-hover:opacity-100"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                        <Paperclip className="h-5 w-5 text-slate-400" />
                        <p className="text-sm text-slate-600">
                          No hay archivos adjuntos
                        </p>
                        <p className="text-xs text-slate-400">
                          Sube documentos para mantener el perfil completo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            <Section
              description={modalSections[6].description}
              sectionId="clinico"
              title={modalSections[6].title}
              icon={UserRound}
            >
              <SelectField
                label="Tipo sanguineo"
                onChange={(value) => updateField('bloodType', value)}
                options={bloodTypeOptions}
                value={form.bloodType}
              />
              <SelectField
                label="RH"
                onChange={(value) =>
                  updateClinicalProfileField('rhFactor', value)
                }
                options={rhFactorOptions}
                value={form.clinicalProfile.rhFactor}
              />
              <SelectField
                error={formErrors.allergiesSelection}
                label="Tiene alergias conocidas"
                onChange={(value) => updateField('allergiesSelection', value)}
                options={allergyOptions}
                required
                value={form.allergiesSelection}
              />
              {form.allergiesSelection === 'yes' ? (
                <div className="md:col-span-2 space-y-4">
                  <TextAreaField
                    error={formErrors.allergiesNotes}
                    label="Resumen rapido de alergias"
                    onChange={(value) => updateField('allergiesNotes', value)}
                    required
                    value={form.allergiesNotes}
                  />
                  {form.allergies.map((allergy, index) => (
                    <CollectionCard
                      key={`allergy-${index}`}
                      onRemove={() => removeCollectionItem('allergies', index)}
                      subtitle="Alergias de perfil no ligadas a episodio."
                      title={`Alergia ${index + 1}`}
                    >
                      <TextField
                        label="Sustancia"
                        onChange={(value) =>
                          updateCollectionItem(
                            'allergies',
                            index,
                            'substance',
                            value,
                          )
                        }
                        value={allergy.substance}
                      />
                      <TextField
                        label="Reaccion"
                        onChange={(value) =>
                          updateCollectionItem(
                            'allergies',
                            index,
                            'reaction',
                            value,
                          )
                        }
                        value={allergy.reaction}
                      />
                      <SelectField
                        label="Severidad"
                        onChange={(value) =>
                          updateCollectionItem(
                            'allergies',
                            index,
                            'severity',
                            value,
                          )
                        }
                        options={allergySeverityOptions}
                        value={allergy.severity}
                      />
                      <TextField
                        label="Estado"
                        onChange={(value) =>
                          updateCollectionItem(
                            'allergies',
                            index,
                            'status',
                            value,
                          )
                        }
                        value={allergy.status}
                      />
                    </CollectionCard>
                  ))}
                  <Button
                    onClick={() => addCollectionItem('allergies')}
                    type="button"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar alergia
                  </Button>
                </div>
              ) : (
                <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {form.allergiesSelection === 'no'
                      ? 'Se guardara explicitamente que el paciente no reporta alergias conocidas.'
                      : 'Selecciona una opcion para dejar el estado clinico consistente.'}
                  </span>
                </div>
              )}

              <div className="md:col-span-2 space-y-4">
                {form.problems.map((problem, index) => (
                  <CollectionCard
                    key={`problem-${index}`}
                    onRemove={() => removeCollectionItem('problems', index)}
                    subtitle="Problemas activos o controlados que deben ser visibles desde la portada clínica."
                    title={`Problema ${index + 1}`}
                  >
                    <TextField
                      label="Descripcion"
                      onChange={(value) =>
                        updateCollectionItem(
                          'problems',
                          index,
                          'description',
                          value,
                        )
                      }
                      value={problem.description}
                    />
                    <SelectField
                      label="Estado"
                      onChange={(value) =>
                        updateCollectionItem('problems', index, 'status', value)
                      }
                      options={problemStatusOptions}
                      value={problem.status}
                    />
                  </CollectionCard>
                ))}
                <Button
                  onClick={() => addCollectionItem('problems')}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Agregar problema
                </Button>
              </div>

              <SelectField
                label="Donador de organos"
                onChange={(value) =>
                  updateClinicalProfileField('organDonorStatus', value)
                }
                options={donorStatusOptions}
                value={form.clinicalProfile.organDonorStatus}
              />
              <SelectField
                label="Estatus de embarazo"
                onChange={(value) =>
                  updateClinicalProfileField('pregnancyStatus', value)
                }
                options={pregnancyStatusOptions}
                value={form.clinicalProfile.pregnancyStatus}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Alertas clinicas"
                  onChange={(value) =>
                    updateClinicalProfileField('clinicalAlerts', value)
                  }
                  value={form.clinicalProfile.clinicalAlerts}
                />
              </div>
              <div className="md:col-span-2">
                <TextAreaField
                  label="Observaciones clinicas"
                  onChange={(value) =>
                    updateClinicalProfileField('clinicalObservations', value)
                  }
                  value={form.clinicalProfile.clinicalObservations}
                />
              </div>
              <div className="md:col-span-2">
                <TextAreaField
                  label="Condiciones cronicas relevantes"
                  onChange={(value) =>
                    updateClinicalProfileField('chronicConditionsNotes', value)
                  }
                  value={form.clinicalProfile.chronicConditionsNotes}
                />
              </div>
              <div className="md:col-span-2">
                <TextAreaField
                  label="Medicacion actual resumida"
                  onChange={(value) =>
                    updateClinicalProfileField('currentMedicationsNotes', value)
                  }
                  value={form.clinicalProfile.currentMedicationsNotes}
                />
              </div>
              <div className="md:col-span-2">
                <TextAreaField
                  label="Discapacidad o apoyos especiales"
                  onChange={(value) =>
                    updateClinicalProfileField('disabilityNotes', value)
                  }
                  value={form.clinicalProfile.disabilityNotes}
                />
              </div>
            </Section>

            <Section
              description={modalSections[7].description}
              sectionId="demografico"
              title={modalSections[7].title}
              icon={UserRound}
            >
              <TextField
                label="Nombre preferido"
                onChange={(value) =>
                  updateDemographicProfileField('preferredName', value)
                }
                value={form.demographicProfile.preferredName}
              />
              <TextField
                label="Identidad de genero"
                onChange={(value) =>
                  updateDemographicProfileField('genderIdentity', value)
                }
                value={form.demographicProfile.genderIdentity}
              />
              <TextField
                label="Pronombres preferidos"
                onChange={(value) =>
                  updateDemographicProfileField('preferredPronouns', value)
                }
                value={form.demographicProfile.preferredPronouns}
              />
              <TextField
                label="Nacionalidad"
                onChange={(value) =>
                  updateDemographicProfileField('nationality', value)
                }
                value={form.demographicProfile.nationality}
              />
              <TextField
                label="Pais de nacimiento"
                onChange={(value) =>
                  updateDemographicProfileField('countryOfBirth', value)
                }
                value={form.demographicProfile.countryOfBirth}
              />
              <TextField
                label="Estado de nacimiento"
                onChange={(value) =>
                  updateDemographicProfileField('stateOfBirth', value)
                }
                value={form.demographicProfile.stateOfBirth}
              />
              <TextField
                label="Grupo etnico / pertenencia cultural"
                onChange={(value) =>
                  updateDemographicProfileField('ethnicGroup', value)
                }
                value={form.demographicProfile.ethnicGroup}
              />
              <SelectField
                label="Estado civil"
                onChange={(value) => updateField('maritalStatus', value)}
                options={maritalStatusOptions}
                value={form.maritalStatus}
              />
              <TextField
                label="Ocupacion"
                onChange={(value) => updateField('occupation', value)}
                value={form.occupation}
              />
              <SelectField
                label="Escolaridad"
                onChange={(value) => updateField('educationLevel', value)}
                options={educationOptions}
                value={form.educationLevel}
              />
              <TextField
                label="Religion"
                onChange={(value) => updateField('religion', value)}
                value={form.religion}
              />
              <TextField
                label="Lengua principal"
                onChange={(value) => updateField('primaryLanguage', value)}
                value={form.primaryLanguage}
              />
              <SelectField
                label="Requiere traductor"
                onChange={(value) =>
                  updateField('requiresTranslatorSelection', value)
                }
                options={booleanOptions}
                value={form.requiresTranslatorSelection}
              />
              <SelectField
                label="Fuente de registro"
                onChange={(value) => updateField('registrationSource', value)}
                options={registrationSourceOptions}
                value={form.registrationSource}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Observaciones administrativas"
                  onChange={(value) =>
                    updateField('administrativeNotes', value)
                  }
                  value={form.administrativeNotes}
                />
              </div>
            </Section>
          </div>
        </form>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span className="truncate">
                Cambios en perfil clínico y administrativo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                type="button"
                variant="ghost"
                className="text-sm"
              >
                Cancelar
              </Button>
              <Button
                disabled={updatePatientMutation.isPending || !isValid}
                type="submit"
                className="text-sm"
              >
                {updatePatientMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
