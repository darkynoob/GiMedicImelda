import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Download,
  Eye,
  FileUp,
  FileText,
  HeartPulse,
  LoaderCircle,
  PencilLine,
  Plus,
  Save,
  ShieldAlert,
  Stethoscope,
  Trash2,
  FolderOpen,
  ClipboardPen,
  Pill,
  FileSignature,
  Siren,
  Activity,
  MessagesSquare,
  BedDouble,
  Scissors,
  PanelRight,
  History,
  Info,
  LayoutDashboard,
  Paperclip
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatDate, formatDateTime } from '../../../shared/lib/formatters';
import type {
  CurrentUserResponse,
  EncounterDetailResponse,
  UpdateEncounterRequest,
} from '../../../shared/types/contracts';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  createEncounterSectionRecord,
  correctEmergencyInitialNote,
  deleteEncounterAttachment,
  downloadEncounterSectionRecordPdf,
  fetchEncounterDetail,
  fetchEncounterMeta,
  previewEncounterSectionRecordPdf,
  signEncounterSectionRecord,
  updateEncounterSectionRecord,
  updateEncounter,
  uploadEncounterAttachments,
} from '../api/encounters.service';
import {
  admissionSourceLabels,
  encounterStatusConfig,
  encounterTypeConfig,
  getEncounterTabs,
  timelineKindConfig,
} from './episode-helpers';
import {
  buildDefaultFieldValue,
  emergencyTriageClinicalQuickStateFields,
  getAmbulatoryProcedureDocumentTabDefinition,
  getConsultationDocumentTabDefinition,
  getEpisodeDocumentTypes,
  getHospitalDocumentTabDefinition,
  buildHistoryVersionPrefill,
  buildInitialStructuredSections,
  getEpisodeTabDefinition,
  isPresentationField,
  triageClinicalDiscriminatorFields,
  triageOtherClinicalDiscriminatorFieldKey,
  type EpisodeFieldDefinition,
  isConsultationHistoryTab,
  type EpisodeTabDefinition,
} from './episode-profile-schema';
import {
  buildDefaultRecordTitle,
  encounterRecordStatusConfig,
  getEpisodeRecordPanelConfig,
} from './episode-record-config';

type FormState = {
  facilityId: string;
  serviceAreaId: string;
  specialtyId: string;
  attendingUserId: string;
  encounterType: string;
  status: string;
  admissionSource: string;
  openedAt: string;
  closedAt: string;
  reasonForVisit: string;
  notes: string;
};

type StructuredSectionsState = Record<string, Record<string, string>>;
type RecordFieldValue =
  | string
  | number
  | boolean
  | string[]
  | Array<Record<string, unknown>>
  | null;

type RecordFormState = {
  noteType: string;
  title: string;
  status: string;
  recordedAt: string;
  formData: Record<string, RecordFieldValue>;
};

const emergencyEvolutionDiagnosisFieldKey = 'diagnosticosEvolucionUrg';
const emergencyEvolutionDiagnosisTypeValues = [
  'PRESUNTIVO',
  'CONFIRMADO',
  'DIFERENCIAL',
];
const emergencyEvolutionDiagnosticResultsFieldKey =
  'resultadosAuxiliaresDiagnosticoUrg';
const emergencyEvolutionDiagnosticStudyTypeValues = [
  'ECG',
  'TROPONINA',
  'BIOMETRIA_HEMATICA',
  'GASOMETRIA',
  'RX_TORAX',
  'TAC',
  'ULTRASONIDO',
  'OTRO',
];
const emergencyEvolutionDiagnosticStudyTypeLabels: Record<string, string> = {
  ECG: 'ECG',
  TROPONINA: 'Troponina',
  BIOMETRIA_HEMATICA: 'Biometría hemática',
  GASOMETRIA: 'Gasometría',
  RX_TORAX: 'RX tórax',
  TAC: 'TAC',
  ULTRASONIDO: 'Ultrasonido',
  OTRO: 'Otro',
};

function createClientRecordId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeEmergencyEvolutionDiagnosisItem(
  item: Record<string, unknown>,
) {
  const diagnosisType =
    typeof item.tipo === 'string' && emergencyEvolutionDiagnosisTypeValues.includes(item.tipo)
      ? item.tipo
      : '';

  return {
    ...item,
    id: typeof item.id === 'string' && item.id ? item.id : createClientRecordId(),
    diagnostico: typeof item.diagnostico === 'string' ? item.diagnostico : '',
    cie10: typeof item.cie10 === 'string' ? item.cie10 : '',
    tipo: diagnosisType,
  };
}

function normalizeEmergencyEvolutionDiagnoses(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map(normalizeEmergencyEvolutionDiagnosisItem)
    : [];
}

function hasEmergencyEvolutionDiagnosisValue(item: Record<string, unknown>) {
  return ['diagnostico', 'cie10', 'tipo'].some((fieldKey) => {
    const value = item[fieldKey];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function hasValidEmergencyEvolutionDiagnosis(value: unknown) {
  return normalizeEmergencyEvolutionDiagnoses(value).some((item) => {
    return item.diagnostico.trim().length > 0;
  });
}

function readTextRecordValue(item: Record<string, unknown>, fieldKey: string) {
  const value = item[fieldKey];
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmergencyEvolutionDiagnosticStudyType(value: unknown) {
  return typeof value === 'string' &&
    emergencyEvolutionDiagnosticStudyTypeValues.includes(value)
    ? value
    : '';
}

function normalizeEmergencyEvolutionDiagnosticResultItem(
  item: Record<string, unknown>,
) {
  return {
    ...item,
    id: readTextRecordValue(item, 'id') || createClientRecordId(),
    tipoEstudio: normalizeEmergencyEvolutionDiagnosticStudyType(item.tipoEstudio),
    otroEstudio: readTextRecordValue(item, 'otroEstudio'),
    problemaEstudio: readTextRecordValue(item, 'problemaEstudio'),
    resultado: readTextRecordValue(item, 'resultado'),
    interpretacionClinica: readTextRecordValue(item, 'interpretacionClinica'),
    incidentes: readTextRecordValue(item, 'incidentes'),
    fechaHoraEstudio: readTextRecordValue(item, 'fechaHoraEstudio'),
  };
}

function hasEmergencyEvolutionDiagnosticResultValue(
  item: Record<string, unknown>,
) {
  return [
    'tipoEstudio',
    'otroEstudio',
    'problemaEstudio',
    'resultado',
    'interpretacionClinica',
    'incidentes',
    'fechaHoraEstudio',
  ].some((fieldKey) => readTextRecordValue(item, fieldKey).length > 0);
}

function buildEmergencyEvolutionLegacyDiagnosticResults(
  value: unknown,
): Array<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const formData = value as Record<string, unknown>;
  const readLegacyAuxiliaryValue = (fieldKey: string) => {
    const fieldValue = readTextRecordValue(formData, fieldKey);

    return fieldValue &&
      !fieldValue.toLowerCase().startsWith('sin ') &&
      fieldValue !== 'Sin dato disponible'
      ? fieldValue
      : '';
  };
  const resultLines = [
    readLegacyAuxiliaryValue('auxEcgUrg'),
    readLegacyAuxiliaryValue('auxLaboratoriosUrg'),
  ].filter(Boolean);
  const interpretation = readLegacyAuxiliaryValue('auxInterpretacionUrg');
  const incidents = readLegacyAuxiliaryValue('auxIncidentesUrg');

  if (
    resultLines.length === 0 &&
    !interpretation &&
    !incidents
  ) {
    return [];
  }

  return [
    normalizeEmergencyEvolutionDiagnosticResultItem({
      tipoEstudio: 'OTRO',
      otroEstudio: 'Servicios auxiliares previos',
      resultado: resultLines.join('\n'),
      interpretacionClinica: interpretation,
      incidentes: incidents,
    }),
  ];
}

function normalizeEmergencyEvolutionDiagnosticResults(
  value: unknown,
  legacySource?: Record<string, unknown>,
) {
  const items = Array.isArray(value)
    ? value
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map(normalizeEmergencyEvolutionDiagnosticResultItem)
        .filter(hasEmergencyEvolutionDiagnosticResultValue)
    : [];

  return items.length > 0
    ? items
    : buildEmergencyEvolutionLegacyDiagnosticResults(legacySource);
}

function getEmergencyEvolutionDiagnosticResultValidationMessage(value: unknown) {
  const incompleteResult = normalizeEmergencyEvolutionDiagnosticResults(value).find(
    (item) =>
      hasEmergencyEvolutionDiagnosticResultValue(item) &&
      (!item.tipoEstudio || !item.resultado || !item.fechaHoraEstudio),
  );

  return incompleteResult
    ? 'Completa tipo de estudio, resultado y fecha/hora en cada resultado de estudio antes de firmar.'
    : '';
}

const emergencyTriageClinicalQuickStateFieldKeys =
  emergencyTriageClinicalQuickStateFields.map((field) => field.key);
const emergencyTriageClinicalQuickStateFieldLabels =
  Object.fromEntries(
    emergencyTriageClinicalQuickStateFields.map((field) => [field.key, field.label]),
  );
const emergencyTriageClinicalQuickStateAllowedValues =
  Object.fromEntries(
    emergencyTriageClinicalQuickStateFields.map((field) => [
      field.key,
      (field.options ?? [])
        .map((option) => option.value)
        .filter((value) => value.length > 0),
    ]),
  );
const emergencyTriageStructuredDestinationFieldLabels: Record<string, string> = {
  destinoInicial: 'Destino inicial',
  requiereReevaluacion: 'Requiere reevaluación',
  horaReevaluacion: 'Hora de reevaluación',
  nuevaPrioridadReevaluacion: 'Nueva prioridad',
  motivoCambioReevaluacion: 'Motivo del cambio',
};
const emergencyTriageDestinationAllowedValues = [
  'SALA_ESPERA',
  'OBSERVACION',
  'SALA_CHOQUE',
  'CONSULTA_MEDICA',
  'UCI',
  'HOSPITALIZACION',
];
const emergencyTriageReevaluationRequiredValues = ['NO', 'SI'];
const emergencyTriageReevaluationPriorityValues = [
  'SIN_CAMBIO',
  'REANIMACION',
  'EMERGENCIA',
  'URGENTE',
  'MENOR_URGENCIA',
  'NO_URGENTE',
];
const emergencyTriageConditionalReevaluationFields = [
  'horaReevaluacion',
  'nuevaPrioridadReevaluacion',
  'motivoCambioReevaluacion',
];
const emergencyTriageReevaluationTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const emergencyTriageOriginAllowedValues = [
  'DOMICILIO',
  'VIA_PUBLICA',
  'TRABAJO',
  'ESCUELA',
  'OTRA_UNIDAD_MEDICA',
  'OTRO',
];
const emergencyTriageReferenceAdmissionValues = ['NO', 'SI'];
const emergencyTriageCompanionRelationshipValues = [
  'ESPOSO_A',
  'HIJO_A',
  'PADRE_MADRE',
  'HERMANO_A',
  'OTRO',
  'NINGUNO',
];
const emergencyTriageConditionalReferenceFields = [
  'unidadQueRefiere',
  'documentoReferencia',
];
const emergencyTriagePhonePattern = /^[0-9+\-\s()]{7,20}$/;
const emergencyTriageInitialStateFieldLabels: Record<string, string> = {
  estadoGeneralInicial: 'Estado general inicial',
  estadoMentalInicial: 'Estado mental inicial',
  riesgoVitalAparente: 'Riesgo vital aparente',
  aislamientoRequerido: 'Aislamiento requerido',
};
const emergencyTriageInitialStateAllowedValues: Record<string, string[]> = {
  estadoGeneralInicial: ['BUENO', 'REGULAR', 'GRAVE'],
  estadoMentalInicial: [
    'ORIENTADO_COOPERADOR',
    'CONFUSO',
    'AGITADO',
    'SOMNOLIENTO',
    'ESTUPOROSO',
    'COMATOSO',
  ],
  riesgoVitalAparente: ['NO', 'SI', 'INDETERMINADO'],
  aislamientoRequerido: ['NO', 'CONTACTO', 'GOTAS', 'AEROSOLES'],
};
const emergencyTriageObsoleteInitialStateFields = [
  'estadoGeneral',
  'estadoMental',
  'riesgoVital',
];

function getHistoryTypeLabel(historyType: string | null | undefined) {
  if (historyType === 'INICIAL') {
    return 'Inicial';
  }

  if (historyType === 'SUBSECUENTE') {
    return 'Subsecuente';
  }

  return 'Sin clasificar';
}

function getLatestHistoryRecord(records: EncounterDetailResponse['sectionRecords']) {
  return [...records].sort((left, right) => {
    const leftVersion = left.metadata.versionNumber ?? 0;
    const rightVersion = right.metadata.versionNumber ?? 0;

    if (leftVersion !== rightVersion) {
      return rightVersion - leftVersion;
    }

    return right.recordedAt.localeCompare(left.recordedAt);
  })[0] ?? null;
}

function buildHistoryLegalSnapshot(detail: EncounterDetailResponse) {
  return {
    legalMedico: detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    legalCedula: detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    legalEspecialidad: detail.specialty?.name ?? 'Sin especialidad',
  };
}

function mergeHistoryReadOnlyFields(
  formData: Record<string, RecordFieldValue>,
  detail: EncounterDetailResponse,
) {
  return {
    ...formData,
    ...buildHistoryLegalSnapshot(detail),
  };
}

function isConsultationCurrentTab(encounterType: string, tabTitle: string) {
  return encounterType === 'OUTPATIENT' && tabTitle === 'Consulta actual';
}

function isConsultationEvolutionTab(encounterType: string, tabTitle: string) {
  return encounterType === 'OUTPATIENT' && tabTitle === 'Evolución';
}

function isConsultationPrescriptionTab(encounterType: string, tabTitle: string) {
  return encounterType === 'OUTPATIENT' && tabTitle === 'Receta / Indicaciones';
}

function isConsultationDocumentsTab(encounterType: string, tabTitle: string) {
  return (
    (encounterType === 'OUTPATIENT' ||
      encounterType === 'EMERGENCY' ||
      encounterType === 'HOSPITALIZATION' ||
      encounterType === 'SURGERY') &&
    tabTitle === 'Documentos'
  );
}

function isEmergencyTriageTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Triage';
}

const emergencyInitialTriageType = 'Triaje inicial';

function inferTriageResponsibleType(
  sessionUser: CurrentUserResponse | null | undefined,
) {
  const roleText = (sessionUser?.roles ?? [])
    .map((role) => `${role.code} ${role.name}`.toLowerCase())
    .join(' ');

  if (roleText.includes('paramed')) return 'Paramédico';
  if (roleText.includes('enferm') || roleText.includes('nurse')) return 'Enfermería';
  if (roleText.includes('medic') || roleText.includes('physician') || roleText.includes('doctor')) {
    return 'Médico';
  }

  return 'Médico';
}

function resolveTriageResponsibleShift(dateValue: string) {
  const date = dateValue ? new Date(dateValue) : new Date();
  const hour = Number.isNaN(date.getTime()) ? new Date().getHours() : date.getHours();

  if (hour >= 6 && hour < 14) return 'Matutino';
  if (hour >= 14 && hour < 22) return 'Vespertino';
  return 'Nocturno';
}

function buildTriageResponsibleSnapshot(input: {
  sessionUser: CurrentUserResponse | null | undefined;
  detail: EncounterDetailResponse;
  recordedAt: string;
}) {
  const user = input.sessionUser;

  return {
    triageResponsableUserId: user?.id ?? '',
    triageResponsableNombre:
      user?.fullName ??
      input.detail.attendingClinician?.fullName ??
      'Sin profesional responsable',
    triageResponsableCedula:
      user?.professionalLicense ??
      input.detail.attendingClinician?.professionalLicense ??
      'Sin cédula',
    triageResponsableTipo: inferTriageResponsibleType(user),
    triageResponsableTurno: resolveTriageResponsibleShift(input.recordedAt),
    triageResponsableArea: 'Urgencias — Triaje',
  };
}

function mapInitialMentalStatusToLegacyValue(value: unknown) {
  if (value === 'NORMAL' || value === 'ALTERADO') return value;
  if (value === 'ORIENTADO_COOPERADOR') return 'NORMAL';
  if (
    typeof value === 'string' &&
    emergencyTriageInitialStateAllowedValues.estadoMentalInicial.includes(value)
  ) {
    return 'ALTERADO';
  }

  return '';
}

function mergeEmergencyTriageSystemFields(
  formData: Record<string, RecordFieldValue>,
  detail: EncounterDetailResponse,
  sessionUser: CurrentUserResponse | null | undefined,
  recordedAt: string,
) {
  const cleanFormData = { ...formData };
  if (cleanFormData.discAlteracionConciencia === true) {
    cleanFormData.discEstadoMentalAlterado = true;
  }
  if (cleanFormData.discOtro !== true) {
    cleanFormData[triageOtherClinicalDiscriminatorFieldKey] = '';
  }
  if (cleanFormData.ingresoPorReferencia !== 'SI') {
    for (const referenceFieldKey of emergencyTriageConditionalReferenceFields) {
      cleanFormData[referenceFieldKey] = '';
    }
  }
  delete cleanFormData.tipoRegistro;
  delete cleanFormData.tipoTriage;
  delete cleanFormData.discAlteracionConciencia;
  delete cleanFormData.responsableTriage;
  delete cleanFormData.procedenciaAdministrativa;
  for (const fieldKey of emergencyTriageObsoleteInitialStateFields) {
    delete cleanFormData[fieldKey];
  }

  return {
    ...cleanFormData,
    tipoTriaje: emergencyInitialTriageType,
    ...buildTriageResponsibleSnapshot({
      sessionUser,
      detail,
      recordedAt,
    }),
    triageLegalMedico:
      sessionUser?.fullName ??
      detail.attendingClinician?.fullName ??
      'Sin profesional responsable',
    triageLegalCedula:
      sessionUser?.professionalLicense ??
      detail.attendingClinician?.professionalLicense ??
      'Sin cédula',
  };
}

function isEmergencyInitialNoteTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Nota inicial';
}

function isEmergencyNursingSheetTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Hoja de enfermería';
}

function buildEmergencyNursingSheetTitle(versionNumber: number) {
  return `Hoja de enfermería V${versionNumber}`;
}

function buildEmergencyNursingSheetSnapshot(input: {
  currentFormData?: Record<string, RecordFieldValue>;
  sessionUser: CurrentUserResponse | null | undefined;
  detail: EncounterDetailResponse;
}) {
  const nurseName =
    input.sessionUser?.fullName ??
    input.detail.attendingClinician?.fullName ??
    'Sin profesional responsable';
  const professionalLicense =
    input.sessionUser?.professionalLicense ??
    input.detail.attendingClinician?.professionalLicense ??
    'Sin cédula';
  const currentFormData = input.currentFormData ?? {};
  const medications = Array.isArray(currentFormData.medicacionAdministradaEnfUrg)
    ? currentFormData.medicacionAdministradaEnfUrg
    : [];
  const procedures = Array.isArray(currentFormData.procedimientosEnfermeriaEnfUrg)
    ? currentFormData.procedimientosEnfermeriaEnfUrg
    : [];

  return {
    ...currentFormData,
    medicacionAdministradaEnfUrg: medications.map((medication) =>
      medication && typeof medication === 'object' && !Array.isArray(medication)
        ? {
            ...medication,
            responsable: nurseName,
          }
        : medication,
    ),
    procedimientosEnfermeriaEnfUrg: procedures.map((procedure) =>
      procedure && typeof procedure === 'object' && !Array.isArray(procedure)
        ? {
            ...procedure,
            responsable: nurseName,
          }
        : procedure,
    ),
    elaboroEnfUrg: nurseName,
    cedulaEnfUrg: professionalLicense,
  };
}

function isEmergencyEvolutionTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'EMERGENCY' &&
    (tabTitle === 'Evolución en urgencias' || tabTitle === 'Evolución')
  );
}

function isEmergencyOrdersTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'EMERGENCY' &&
    (tabTitle === 'Órdenes / Indicaciones' || tabTitle === 'Órdenes e indicaciones')
  );
}

type EmergencyOrdersDocumentType = 'Orden médica' | 'Hoja de indicaciones';

function resolveEmergencyOrdersDocumentType(
  noteType: unknown,
  formData?: Record<string, unknown>,
): EmergencyOrdersDocumentType {
  const visibleType =
    typeof formData?.tipoRegistro === 'string' ? formData.tipoRegistro : '';

  if (noteType === 'Hoja de indicaciones' || visibleType === 'Hoja de indicaciones') {
    return 'Hoja de indicaciones';
  }

  return 'Orden médica';
}

function buildEmergencyOrdersTitle(
  versionNumber: number,
  documentType: EmergencyOrdersDocumentType = 'Orden médica',
) {
  return `${documentType} V${versionNumber}`;
}

function buildEmergencyOrdersCreateLabel(noteType: string) {
  return noteType === 'Hoja de indicaciones'
    ? 'Nueva hoja de indicaciones'
    : 'Nueva orden médica';
}

function isEmergencyConsultationTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Interconsultas';
}

function isEmergencyDischargeTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'EMERGENCY' &&
    (tabTitle === 'Egreso de urgencias' || tabTitle === 'Egreso')
  );
}

function isHospitalAdmissionTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'HOSPITALIZATION' &&
    (tabTitle === 'Ingreso' || tabTitle === 'Ingreso hospitalario')
  );
}

function buildHospitalAdmissionTitle(versionNumber: number) {
  return `Ingreso hospitalario V${versionNumber}`;
}

function isHospitalEvolutionTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'HOSPITALIZATION' &&
    (tabTitle === 'Evolución' || tabTitle === 'Evolución hospitalaria')
  );
}

function buildHospitalEvolutionTitle(versionNumber: number) {
  return `Evolución hospitalaria V${versionNumber}`;
}

function isHospitalMedicalOrdersTab(encounterType: string, tabTitle: string) {
  return encounterType === 'HOSPITALIZATION' && tabTitle === 'Indicaciones médicas';
}

function buildHospitalMedicalOrdersTitle(versionNumber: number) {
  return `Indicaciones médicas V${versionNumber}`;
}

function isHospitalConsultationTab(encounterType: string, tabTitle: string) {
  return encounterType === 'HOSPITALIZATION' && tabTitle === 'Interconsultas';
}

function buildHospitalConsultationTitle(versionNumber: number) {
  return `Interconsultas V${versionNumber}`;
}

function isHospitalSurgicalTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'HOSPITALIZATION' &&
    (tabTitle === 'Procedimientos y cirugía' ||
      tabTitle === 'Procedimientos / Cirugía')
  );
}

function buildHospitalSurgicalTitle(versionNumber: number) {
  return `Procedimientos y cirugía V${versionNumber}`;
}

function isHospitalNursingTab(encounterType: string, tabTitle: string) {
  return encounterType === 'HOSPITALIZATION' && tabTitle === 'Enfermería';
}

function buildHospitalNursingTitle(versionNumber: number) {
  return `Enfermería V${versionNumber}`;
}

function isHospitalDischargeTab(encounterType: string, tabTitle: string) {
  return (
    encounterType === 'HOSPITALIZATION' &&
    (tabTitle === 'Egreso' || tabTitle === 'Egreso hospitalario')
  );
}

function buildHospitalDischargeTitle() {
  return 'Egreso V1';
}

function isAmbulatoryPreprocedureTab(encounterType: string, tabTitle: string) {
  return encounterType === 'SURGERY' && tabTitle === 'Valoración preprocedimiento';
}

function isAmbulatoryProcedureTab(encounterType: string, tabTitle: string) {
  return encounterType === 'SURGERY' && tabTitle === 'Procedimiento';
}

function isAmbulatoryRecoveryEvaluationTab(
  encounterType: string,
  tabTitle: string,
) {
  return (
    encounterType === 'SURGERY' &&
    (tabTitle === 'Recuperación / Evaluación' ||
      tabTitle === 'Recuperación / Evolución')
  );
}

function isAmbulatoryDischargePrescriptionTab(
  encounterType: string,
  tabTitle: string,
) {
  return (
    encounterType === 'SURGERY' &&
    (tabTitle === 'Receta e indicaciones de egreso' ||
      tabTitle === 'Indicaciones / Receta')
  );
}

function getDisplayedRecordStatusConfig(
  status: string,
  isAmbulatoryClinicalSection: boolean,
) {
  if (isAmbulatoryClinicalSection && status === 'CLOSED') {
    return { label: 'Completo', badgeVariant: 'success' as const };
  }

  return (
    encounterRecordStatusConfig[status] ?? encounterRecordStatusConfig.DRAFT
  );
}

function isAmbulatoryDischargeTab(encounterType: string, tabTitle: string) {
  return encounterType === 'SURGERY' && tabTitle === 'Egreso';
}

function buildAmbulatoryProcedureTitle(versionNumber: number) {
  return `Procedimiento V${versionNumber}`;
}

function buildAmbulatoryDischargePrescriptionTitle(versionNumber: number) {
  return `Receta e indicaciones de egreso V${versionNumber}`;
}

function buildAmbulatoryDischargeTitle(versionNumber: number) {
  return `Egreso V${versionNumber}`;
}

function buildAmbulatoryRecoveryEvaluationTitle(versionNumber: number) {
  return `Recuperación / Evaluación V${versionNumber}`;
}

function buildAmbulatoryPreprocedureTitle(versionNumber: number) {
  return `Valoración preprocedimiento V${versionNumber}`;
}

function calculateDurationMinutes(date: string, startTime: string, endTime: string) {
  if (!date || !startTime || !endTime) {
    return '';
  }

  const start = new Date(`${date}T${startTime}`);
  let end = new Date(`${date}T${endTime}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '';
  }
  if (end < start) {
    end = new Date(end.getTime() + 86_400_000);
  }
  return String(Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000)));
}

function buildAmbulatoryProcedureSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  preprocedureRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const currentFormData = args.currentFormData ?? {};
  const preprocedureFormData = args.preprocedureRecord?.formData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const keep = (key: string, fallback: string) => readString(currentFormData[key]) || fallback;
  const date = keep('fechaProcedimientoProc', args.recordedAt.slice(0, 10));
  const startTime = keep('horaInicioRealProc', args.recordedAt.slice(11, 16));
  const endTime = readString(currentFormData.horaFinRealProc);
  const anesthesiaType = keep(
    'tipoAnestesiaProc',
    readString(preprocedureFormData.tipoAnestesiaPrevistaPreproc) || 'NO_APLICA',
  );
  const hasAnesthesia = anesthesiaType !== '' && anesthesiaType !== 'NO_APLICA';
  const allergyWarning =
    Boolean(preprocedureFormData.antAlergiasMedicamentosasPreproc) &&
    (readString(currentFormData.medicamentosAnestesicosProc) ||
      readString(currentFormData.postMedicamentosAnestesicosProc))
      ? 'Verificar alergias medicamentosas antes de cerrar anestesia.'
      : '';
  const destinationWarning =
    readString(currentFormData.destinoPostprocedimientoProc) === 'HOSPITALIZACION'
      ? 'Destino hospitalización: preparar enlace a episodio hospitalario.'
      : 'Sin alerta de destino.';

  return {
    tipoRegistroProcedimiento: 'Procedimiento',
    cirujanoPrincipalProc:
      keep('cirujanoPrincipalProc', args.detail.attendingClinician?.fullName ?? '') ||
      'Sin profesional responsable',
    cedulaCirujanoProc:
      keep('cedulaCirujanoProc', args.detail.attendingClinician?.professionalLicense ?? '') ||
      'Sin cédula',
    anestesiologoProc:
      keep('anestesiologoProc', readString(preprocedureFormData.nombreAnestesiologoPreproc)) ||
      'Sin anestesiólogo asignado',
    cedulaAnestesiologoProc:
      keep('cedulaAnestesiologoProc', readString(preprocedureFormData.cedulaAnestesiologoPreproc)) ||
      'Sin cédula',
    fechaProcedimientoProc: date,
    horaInicioRealProc: startTime,
    duracionMinutosProc:
      readString(currentFormData.duracionMinutosProc) ||
      calculateDurationMinutes(date, startTime, endTime),
    codigoProcedimientoProc:
      keep('codigoProcedimientoProc', readString(preprocedureFormData.codigoProcedimientoPreproc)),
    diagnosticoPreoperatorioProc:
      keep(
        'diagnosticoPreoperatorioProc',
        readString(preprocedureFormData.diagnosticoPreoperatorioPreproc),
      ),
    ciePreoperatorioProc:
      keep('ciePreoperatorioProc', readString(preprocedureFormData.cie10Preproc)),
    procedimientoRealizadoProc:
      keep('procedimientoRealizadoProc', readString(preprocedureFormData.procedimientoIndicadoPreproc)),
    tipoAnestesiaProc: anesthesiaType,
    alertasAnestesiaProc: allergyWarning || 'Sin alertas anestésicas',
    postNombreAnestesiologoProc:
      keep('postNombreAnestesiologoProc', readString(currentFormData.anestesiologoProc)) ||
      'Sin anestesiólogo asignado',
    postCedulaAnestesiologoProc:
      keep('postCedulaAnestesiologoProc', readString(currentFormData.cedulaAnestesiologoProc)) ||
      'Sin cédula',
    alertaDestinoProc: destinationWarning,
    profesionalNombreProc:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    profesionalCedulaProc:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    profesionalEspecialidadProc: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionProc: args.detail.facility?.name ?? 'Sin sede',
    hashProc:
      readString(currentFormData.hashProc) ||
      `PENDIENTE-FIRMA-${args.detail.encounterNumber}-PROC`,
    huboAnestesiaProc: hasAnesthesia ? 'SI' : 'NO',
  };
}

function readNumericRecordValue(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function calculateAldreteTotal(formData: Record<string, RecordFieldValue>) {
  const values = [
    formData.aldreteActividadRecEval,
    formData.aldreteRespiracionRecEval,
    formData.aldreteCirculacionRecEval,
    formData.aldreteConcienciaRecEval,
    formData.aldreteSpo2RecEval,
  ].map(readNumericRecordValue);

  if (values.some((value) => value === null)) {
    return null;
  }

  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function buildRecoveryEvaluationAlerts(formData: Record<string, RecordFieldValue>) {
  const alerts: Array<{ severity: 'VERDE' | 'AMARILLO' | 'ROJO'; message: string }> = [];
  const systolic = readNumericRecordValue(formData.taSistolicaRecEval);
  const diastolic = readNumericRecordValue(formData.taDiastolicaRecEval);
  const heartRate = readNumericRecordValue(formData.fcRecEval);
  const spo2 = readNumericRecordValue(formData.spo2RecEval);
  const temperature = readNumericRecordValue(formData.temperaturaRecEval);
  const painEva = readNumericRecordValue(formData.dolorEvaRecEval);
  const glasgow = readNumericRecordValue(formData.glasgowRecEval);
  const aldreteTotal = calculateAldreteTotal(formData);

  if (spo2 !== null && spo2 < 92) {
    alerts.push({ severity: 'ROJO', message: 'SpO2 < 92%: bloqueo de alta.' });
  }
  if (
    (systolic !== null && (systolic < 90 || systolic > 180)) ||
    (diastolic !== null && (diastolic < 50 || diastolic > 110))
  ) {
    alerts.push({ severity: 'ROJO', message: 'Tensión arterial fuera de rango seguro.' });
  }
  if (painEva !== null && painEva > 6) {
    alerts.push({ severity: 'AMARILLO', message: 'Dolor EVA > 6: continuar vigilancia.' });
  }
  if (glasgow !== null && glasgow < 15) {
    alerts.push({ severity: 'ROJO', message: 'Glasgow < 15: no permitir alta.' });
  }
  if (heartRate !== null && (heartRate < 50 || heartRate > 120)) {
    alerts.push({ severity: 'AMARILLO', message: 'FC fuera de rango de vigilancia.' });
  }
  if (temperature !== null && (temperature < 35.5 || temperature >= 38)) {
    alerts.push({ severity: 'AMARILLO', message: 'Temperatura fuera de rango esperado.' });
  }
  if (aldreteTotal !== null && aldreteTotal < 9) {
    alerts.push({ severity: 'AMARILLO', message: 'Aldrete < 9: continuar vigilancia.' });
  }

  return alerts;
}

function calculatePostprocedureTimeLabel(args: {
  recordedAt: string;
  procedureRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
}) {
  const procedureFormData = args.procedureRecord?.formData ?? {};
  const date =
    typeof procedureFormData.fechaProcedimientoProc === 'string'
      ? procedureFormData.fechaProcedimientoProc
      : '';
  const endTime =
    typeof procedureFormData.horaFinRealProc === 'string'
      ? procedureFormData.horaFinRealProc
      : '';
  if (!date || !endTime) {
    return '';
  }
  const procedureEndedAt = new Date(`${date}T${endTime}`);
  const recoveryRecordedAt = new Date(args.recordedAt);
  if (
    Number.isNaN(procedureEndedAt.getTime()) ||
    Number.isNaN(recoveryRecordedAt.getTime()) ||
    recoveryRecordedAt < procedureEndedAt
  ) {
    return '';
  }
  const elapsedMinutes = Math.round(
    (recoveryRecordedAt.getTime() - procedureEndedAt.getTime()) / 60_000,
  );
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function buildAmbulatoryRecoveryEvaluationSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  procedureRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const currentFormData = args.currentFormData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const aldreteTotal = calculateAldreteTotal(currentFormData);
  const alerts = buildRecoveryEvaluationAlerts(currentFormData);
  const hasRedAlert = alerts.some((alert) => alert.severity === 'ROJO');
  const trafficLight = hasRedAlert
    ? 'Rojo - crítico'
    : alerts.length > 0
      ? 'Amarillo - vigilancia'
      : 'Verde - normal';
  const aldreteInterpretation =
    aldreteTotal === null
      ? 'Aldrete pendiente de cálculo'
      : `Aldrete ${aldreteTotal}/10 — ${aldreteTotal >= 9 ? 'Cumple criterios de alta' : 'No cumple criterios de alta'}`;

  return {
    tipoRegistroRecEval: 'Recuperación / Evaluación',
    fechaRecEval: readString(currentFormData.fechaRecEval) || args.recordedAt.slice(0, 10),
    horaValoracionRecEval:
      readString(currentFormData.horaValoracionRecEval) || args.recordedAt.slice(11, 16),
    tiempoPostprocedimientoRecEval:
      calculatePostprocedureTimeLabel({
        recordedAt: args.recordedAt,
        procedureRecord: args.procedureRecord,
      }) || readString(currentFormData.tiempoPostprocedimientoRecEval),
    aldreteTotalRecEval: aldreteTotal === null ? '' : String(aldreteTotal),
    aldreteInterpretacionRecEval: aldreteInterpretation,
    altaAldreteMayorIgual9RecEval:
      aldreteTotal === null ? Boolean(currentFormData.altaAldreteMayorIgual9RecEval) : aldreteTotal >= 9,
    semaforoRecEval: trafficLight,
    alertasAutomaticasRecEval:
      alerts.length > 0
        ? alerts.map((alert) => `${alert.severity}: ${alert.message}`).join('\n')
        : 'Sin alertas activas',
    profesionalNombreRecEval:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    profesionalCedulaRecEval:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    profesionalEspecialidadRecEval: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionRecEval: args.detail.facility?.name ?? 'Sin sede',
    hashRecEval:
      readString(currentFormData.hashRecEval) ||
      `PENDIENTE-FIRMA-${args.detail.encounterNumber}-REC-EVAL`,
  };
}

function buildAmbulatoryDischargePrescriptionAlerts(
  formData: Record<string, RecordFieldValue>,
) {
  const medications = Array.isArray(formData.medicamentosRecetaEgreso)
    ? formData.medicamentosRecetaEgreso
    : [];
  const normalized = medications
    .map((item) =>
      typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item) &&
      typeof item.medicamento === 'string'
        ? item.medicamento.trim().toLowerCase()
        : '',
    )
    .filter(Boolean);
  const alerts: Array<{ severity: 'VERDE' | 'AMARILLO' | 'ROJO'; message: string }> = [];
  const duplicates = normalized.filter(
    (name, index) => normalized.indexOf(name) !== index,
  );
  if (duplicates.length > 0) {
    alerts.push({
      severity: 'AMARILLO',
      message: `Duplicidad terapéutica posible: ${[...new Set(duplicates)].join(', ')}`,
    });
  }
  const hasWarfarin = normalized.some((name) => name.includes('warfarina'));
  const hasIbuprofen = normalized.some((name) => name.includes('ibuprofeno'));
  if (hasWarfarin && hasIbuprofen) {
    alerts.push({
      severity: 'ROJO',
      message: 'Interacción grave: warfarina con ibuprofeno aumenta riesgo de sangrado.',
    });
  }
  const hasPenicillin = normalized.some((name) =>
    ['penicilina', 'amoxicilina', 'ampicilina'].some((keyword) =>
      name.includes(keyword),
    ),
  );
  if (hasPenicillin) {
    alerts.push({
      severity: 'AMARILLO',
      message: 'Si hay alergia a penicilina, verificar antes de prescribir.',
    });
  }
  return alerts;
}

function buildAmbulatoryDischargePrescriptionSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
  versionNumber: number;
}) {
  const currentFormData = args.currentFormData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const alerts = buildAmbulatoryDischargePrescriptionAlerts(currentFormData);
  const hasRedAlert = alerts.some((alert) => alert.severity === 'ROJO');
  const folio =
    readString(currentFormData.folioRecetaEgreso) ||
    `${args.detail.encounterNumber}-RA${String(args.versionNumber).padStart(2, '0')}`;

  return {
    tipoRegistroRecetaEgreso: 'Receta e indicaciones de egreso',
    folioRecetaEgreso: folio,
    fechaEmisionRecetaEgreso:
      readString(currentFormData.fechaEmisionRecetaEgreso) ||
      args.recordedAt.slice(0, 10),
    vigenciaRecetaEgreso: readString(currentFormData.vigenciaRecetaEgreso) || '7 días',
    institucionEmisoraRecetaEgreso:
      args.detail.legalContext.facilityInstitutionName ||
      args.detail.legalContext.tenantLegalName ||
      args.detail.legalContext.tenantName,
    rfcMedicoRecetaEgreso:
      args.detail.legalContext.tenantTaxId || 'RFC no configurado',
    licenciaSanitariaRecetaEgreso:
      args.detail.legalContext.facilityLegalName || 'Licencia no configurada',
    qrVerificacionRecetaEgreso:
      readString(currentFormData.qrVerificacionRecetaEgreso) || 'Se activará al firmar',
    alertasAlergiasRecetaEgreso:
      alerts.some((alert) => alert.message.toLowerCase().includes('alergia'))
        ? alerts
            .filter((alert) => alert.message.toLowerCase().includes('alergia'))
            .map((alert) => alert.message)
            .join('\n')
        : 'Sin alergias conflictivas detectadas automáticamente',
    validacionesMedicamentosRecetaEgreso:
      alerts.length > 0
        ? alerts.map((alert) => `${alert.severity}: ${alert.message}`).join('\n')
        : 'VERDE: sin problemas detectados',
    semaforoMedicamentosRecetaEgreso: hasRedAlert
      ? 'Rojo - bloqueo'
      : alerts.length > 0
        ? 'Amarillo - precaución'
        : 'Verde - sin problemas',
    profesionalNombreRecetaEgreso:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    profesionalCedulaRecetaEgreso:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    profesionalEspecialidadRecetaEgreso:
      args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionRecetaEgreso: args.detail.facility?.name ?? 'Sin sede',
    hashRecetaEgreso:
      readString(currentFormData.hashRecetaEgreso) ||
      `PENDIENTE-FIRMA-${args.detail.encounterNumber}-RECETA-EGRESO`,
  };
}

function summarizeMedicationList(value: unknown) {
  if (!Array.isArray(value)) {
    return '';
  }
  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return '';
      }
      const medication = typeof item.medicamento === 'string' ? item.medicamento : '';
      const dose = typeof item.dosis === 'string' ? item.dosis : '';
      const frequency = typeof item.frecuencia === 'string' ? item.frecuencia : '';
      return `${index + 1}. ${[medication, dose, frequency].filter(Boolean).join(' · ')}`;
    })
    .filter(Boolean)
    .join('\n');
}

function buildAmbulatoryDischargeSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  procedureRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  recoveryRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  prescriptionRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  currentFormData?: Record<string, RecordFieldValue>;
  versionNumber: number;
}): Record<string, RecordFieldValue> {
  const currentFormData = args.currentFormData ?? {};
  const procedureFormData = args.procedureRecord?.formData ?? {};
  const recoveryFormData = args.recoveryRecord?.formData ?? {};
  const prescriptionFormData = args.prescriptionRecord?.formData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const readPrimitive = (value: unknown): RecordFieldValue =>
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
      ? value
      : '';
  const keep = (key: string, fallback: string) => readString(currentFormData[key]) || fallback;
  const aldrete =
    readString(currentFormData.aldreteEgresoAmb) ||
    readString(recoveryFormData.aldreteTotalRecEval);
  const recipeFolio = readString(prescriptionFormData.folioRecetaEgreso);

  return {
    tipoRegistroEgresoAmb: 'Egreso',
    versionEgresoAmb: args.versionNumber,
    tipoEgresoAmb: keep('tipoEgresoAmb', 'ALTA_MEDICA'),
    destinoEgresoAmb: keep('destinoEgresoAmb', 'DOMICILIO'),
    fechaEgresoAmb: keep('fechaEgresoAmb', args.recordedAt.slice(0, 10)),
    horaEgresoAmb: keep('horaEgresoAmb', args.recordedAt.slice(11, 16)),
    diagnosticoFinalEgresoAmb: keep(
      'diagnosticoFinalEgresoAmb',
      readString(procedureFormData.diagnosticoPostoperatorioProc) ||
        args.detail.diagnoses[0]?.description ||
        '',
    ),
    cie10EgresoAmb: keep(
      'cie10EgresoAmb',
      readString(procedureFormData.ciePostoperatorioProc) ||
        args.detail.diagnoses[0]?.code ||
        '',
    ),
    taEgresoAmb: keep(
      'taEgresoAmb',
      readString(recoveryFormData.taSistolicaRecEval) && readString(recoveryFormData.taDiastolicaRecEval)
        ? `${readString(recoveryFormData.taSistolicaRecEval)}/${readString(recoveryFormData.taDiastolicaRecEval)}`
        : '',
    ),
    fcEgresoAmb: currentFormData.fcEgresoAmb || readPrimitive(recoveryFormData.fcRecEval),
    frEgresoAmb: currentFormData.frEgresoAmb || readPrimitive(recoveryFormData.frRecEval),
    temperaturaEgresoAmb:
      currentFormData.temperaturaEgresoAmb || readPrimitive(recoveryFormData.temperaturaRecEval),
    spo2EgresoAmb: currentFormData.spo2EgresoAmb || readPrimitive(recoveryFormData.spo2RecEval),
    evaDolorEgresoAmb:
      currentFormData.evaDolorEgresoAmb || readPrimitive(recoveryFormData.dolorEvaRecEval),
    aldreteEgresoAmb: aldrete,
    aldreteFinalEgresoAmb: currentFormData.aldreteFinalEgresoAmb || aldrete,
    motivoProcedimientoEgresoAmb: keep(
      'motivoProcedimientoEgresoAmb',
      readString(procedureFormData.diagnosticoPreoperatorioProc),
    ),
    procedimientoRealizadoEgresoAmb: keep(
      'procedimientoRealizadoEgresoAmb',
      readString(procedureFormData.procedimientoRealizadoProc),
    ),
    evolucionRecuperacionEgresoAmb: keep(
      'evolucionRecuperacionEgresoAmb',
      readString(recoveryFormData.planVigilanciaRecEval) ||
        readString(recoveryFormData.aldreteInterpretacionRecEval),
    ),
    estadoAlEgresoResumenAmb: keep(
      'estadoAlEgresoResumenAmb',
      readString(recoveryFormData.estadoGeneralRecEval),
    ),
    planVinculadoRecetaEgresoAmb:
      readString(prescriptionFormData.dietaIndicacionesEgreso) ||
      readString(currentFormData.planVinculadoRecetaEgresoAmb) ||
      'Sin receta vinculada',
    medicamentosRecetaEgresoAmb:
      summarizeMedicationList(prescriptionFormData.medicamentosRecetaEgreso) ||
      readString(currentFormData.medicamentosRecetaEgresoAmb) ||
      'Sin medicamentos vinculados',
    recetaIdEgresoAmb: recipeFolio || readString(currentFormData.recetaIdEgresoAmb),
    seguimientoEgresoAmb:
      readString(prescriptionFormData.fechaCitaSeguimientoEgreso) ||
      readString(currentFormData.seguimientoEgresoAmb),
    recetaRelacionadaEgresoAmb:
      recipeFolio || readString(currentFormData.recetaRelacionadaEgresoAmb),
    educacionPacienteEgresoAmb:
      readString(currentFormData.educacionPacienteEgresoAmb) ||
      readString(prescriptionFormData.educacionOtorgadaEgreso),
    pacienteComprendeEgresoAmb:
      Boolean(currentFormData.pacienteComprendeEgresoAmb) ||
      Boolean(prescriptionFormData.pacienteComprendeIndicacionesEgreso),
    familiarInformadoEgresoAmb:
      Boolean(currentFormData.familiarInformadoEgresoAmb) ||
      Boolean(prescriptionFormData.familiarInformadoEgreso),
    referenciaEstablecimientoEnviaEgresoAmb:
      args.detail.facility?.name ?? 'Sin sede',
    referenciaMedicoEmisorEgresoAmb:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    medicoAutorizaEgresoAmb:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaAutorizaEgresoAmb:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    alertaCierreEgresoAmb:
      'Al firmar esta nota de egreso, el episodio se marcará como cerrado, todo el expediente quedará en solo lectura, se generará sello digital y hash, y se registrará en auditoría.',
    profesionalNombreEgresoAmb:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    profesionalCedulaEgresoAmb:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    profesionalEspecialidadEgresoAmb:
      args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionEgresoAmb: args.detail.facility?.name ?? 'Sin sede',
    hashEgresoAmb:
      readString(currentFormData.hashEgresoAmb) ||
      `PENDIENTE-FIRMA-${args.detail.encounterNumber}-EGRESO`,
  };
}

function buildAmbulatoryPreprocedureSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const currentFormData = args.currentFormData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const readNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  };
  const weight = readNumber(currentFormData.pesoKgPreproc);
  const height = readNumber(currentFormData.tallaCmPreproc);
  const heightMeters = height ? height / 100 : null;
  const imc =
    weight && heightMeters && heightMeters > 0
      ? (weight / (heightMeters * heightMeters)).toFixed(1)
      : '';
  const hasAnesthesia =
    readString(currentFormData.tipoAnestesiaPrevistaPreproc) !== '' &&
    readString(currentFormData.tipoAnestesiaPrevistaPreproc) !== 'NO_APLICA';
  const alerts = [
    ['ASA_III', 'ASA_IV', 'ASA_V'].includes(
      readString(currentFormData.clasificacionAsaPreproc),
    )
      ? 'ASA alto: requiere revisión de factibilidad ambulatoria.'
      : '',
    readString(currentFormData.riesgoQuirurgicoPreproc) === 'ALTO'
      ? 'Riesgo quirúrgico alto.'
      : '',
    readString(currentFormData.riesgoCardiovascularPreproc) === 'ALTO'
      ? 'Riesgo cardiovascular alto.'
      : '',
    readString(currentFormData.riesgoTromboembolicoCapriniPreproc) === 'ALTO'
      ? 'Riesgo tromboembólico alto.'
      : '',
    readString(currentFormData.ayunoConfirmadoPreproc) === 'NO'
      ? 'Ayuno no confirmado.'
      : '',
    Boolean(currentFormData.antAlergiasMedicamentosasPreproc) &&
    readString(currentFormData.atbProfilacticoPreproc)
      ? 'Verificar alergias antes de ATB profiláctico.'
      : '',
  ].filter(Boolean);

  return {
    tipoRegistroPreproc: 'Valoración preprocedimiento',
    tituloDocumentoConsentimientoPreproc: 'Consentimiento informado NOM-004',
    institucionConsentimientoPreproc:
      readString(currentFormData.institucionConsentimientoPreproc) ||
      args.detail.legalContext.facilityInstitutionName ||
      args.detail.legalContext.tenantName,
    razonSocialConsentimientoPreproc:
      readString(currentFormData.razonSocialConsentimientoPreproc) ||
      args.detail.legalContext.tenantLegalName ||
      args.detail.legalContext.tenantName,
    lugarFechaConsentimientoPreproc:
      readString(currentFormData.lugarFechaConsentimientoPreproc) ||
      `${args.detail.facility?.name ?? 'Lugar no configurado'} · ${args.recordedAt.slice(0, 10)}`,
    medicoExplicaPreproc:
      readString(currentFormData.medicoExplicaPreproc) ||
      args.detail.attendingClinician?.fullName ||
      'Sin profesional responsable',
    nombreRealizaActoPreproc:
      readString(currentFormData.nombreRealizaActoPreproc) ||
      args.detail.attendingClinician?.fullName ||
      'Sin profesional responsable',
    profesionalNombrePreproc:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    profesionalCedulaPreproc:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    profesionalEspecialidadPreproc: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionPreproc: args.detail.facility?.name ?? 'Sin sede',
    imcPreproc: imc,
    consentimientoAnestesicoPreproc: hasAnesthesia
      ? readString(currentFormData.consentimientoAnestesicoPreproc)
      : 'NO_APLICA',
    alertasClinicasPreproc: alerts.length > 0 ? alerts.join('\n') : 'Sin alertas críticas',
    hashPreproc:
      readString(currentFormData.hashPreproc) ||
      `PENDIENTE-FIRMA-${args.detail.encounterNumber}`,
  };
}

function buildTriageTitle(versionNumber: number) {
  return `Triage V${versionNumber}`;
}

function buildEmergencyInitialNoteTitle() {
  return 'Nota inicial';
}

function buildEmergencyEvolutionTitle(versionNumber: number) {
  return `Evolución en urgencias V${versionNumber}`;
}

function buildEmergencyConsultationTitle(versionNumber: number) {
  return `Interconsultas V${versionNumber}`;
}

function buildEmergencyDischargeTitle() {
  return 'Egreso de urgencias V1';
}

function readNumericFormValue(value: RecordFieldValue | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function calculateTriageTargetTime(priority: RecordFieldValue | undefined) {
  const priorityMap: Record<string, string> = {
    '1': 'Atención inmediata',
    '2': '10 minutos',
    '3': '30 minutos',
    '4': '60 minutos',
    '5': '120 minutos',
  };

  return typeof priority === 'string' ? priorityMap[priority] ?? '' : '';
}

function calculateTriageWaitTime(
  arrival: RecordFieldValue | undefined,
  triage: RecordFieldValue | undefined,
) {
  if (typeof arrival !== 'string' || typeof triage !== 'string') {
    return '';
  }

  const arrivalDate = new Date(arrival);
  const triageDate = new Date(triage);

  if (
    Number.isNaN(arrivalDate.getTime()) ||
    Number.isNaN(triageDate.getTime()) ||
    triageDate < arrivalDate
  ) {
    return '';
  }

  return `${Math.round((triageDate.getTime() - arrivalDate.getTime()) / 60000)} min`;
}

function calculateGlasgowTotal(formData: Record<string, RecordFieldValue>) {
  const eye = readNumericFormValue(formData.glasgowE);
  const verbal = readNumericFormValue(formData.glasgowV);
  const motor = readNumericFormValue(formData.glasgowM);

  return eye === null || verbal === null || motor === null
    ? ''
    : String(eye + verbal + motor);
}

function scoreNews2RespiratoryRate(value: number) {
  return value <= 8 ? 3 : value <= 11 ? 1 : value <= 20 ? 0 : value <= 24 ? 2 : 3;
}

function scoreNews2OxygenSaturation(value: number) {
  return value <= 91 ? 3 : value <= 93 ? 2 : value <= 95 ? 1 : 0;
}

function scoreNews2Temperature(value: number) {
  return value <= 35 ? 3 : value <= 36 ? 1 : value <= 38 ? 0 : value <= 39 ? 1 : 2;
}

function scoreNews2SystolicPressure(value: number) {
  return value <= 90
    ? 3
    : value <= 100
      ? 2
      : value <= 110
        ? 1
        : value <= 219
          ? 0
          : 3;
}

function scoreNews2HeartRate(value: number) {
  return value <= 40 ? 3 : value <= 50 ? 1 : value <= 90 ? 0 : value <= 110 ? 1 : value <= 130 ? 2 : 3;
}

function calculateNews2(formData: Record<string, RecordFieldValue>) {
  const fr = readNumericFormValue(formData.fr);
  const spo2 = readNumericFormValue(formData.spo2);
  const temp = readNumericFormValue(formData.temp);
  const taSistolica = readNumericFormValue(formData.taSistolica);
  const fc = readNumericFormValue(formData.fc);

  if (
    fr === null ||
    spo2 === null ||
    temp === null ||
    taSistolica === null ||
    fc === null
  ) {
    return '';
  }

  return String(
    scoreNews2RespiratoryRate(fr) +
      scoreNews2OxygenSaturation(spo2) +
      scoreNews2Temperature(temp) +
      scoreNews2SystolicPressure(taSistolica) +
      scoreNews2HeartRate(fc),
  );
}

type TriageClinicalAlert = {
  code: string;
  message: string;
  severity: 'WARNING' | 'CRITICAL';
};

function buildTriageAutomaticAlerts(
  formData: Record<string, RecordFieldValue>,
): TriageClinicalAlert[] {
  const alerts: TriageClinicalAlert[] = [];
  const spo2 = readNumericFormValue(formData.spo2);
  const taSistolica = readNumericFormValue(formData.taSistolica);
  const fc = readNumericFormValue(formData.fc);
  const fr = readNumericFormValue(formData.fr);
  const temp = readNumericFormValue(formData.temp);
  const eva = readNumericFormValue(formData.eva);
  const news2Total = readNumericFormValue(formData.news2Total);

  if (taSistolica !== null && taSistolica < 90) {
    alerts.push({ code: 'LOW_SBP', message: 'Hipotensión — valorar choque', severity: 'CRITICAL' });
  } else if (taSistolica !== null && taSistolica > 140) {
    alerts.push({ code: 'HIGH_SBP', message: 'Evaluar emergencia hipertensiva', severity: 'WARNING' });
  }
  if (news2Total !== null && news2Total >= 6) {
    alerts.push({ code: 'NEWS2_ESCALATION', message: 'Escalamiento clínico recomendado', severity: 'CRITICAL' });
  } else if (news2Total !== null && news2Total >= 5) {
    alerts.push({ code: 'NEWS2_ALERT', message: 'Alerta clínica', severity: 'WARNING' });
  }
  if (spo2 !== null && spo2 < 95) {
    alerts.push({ code: 'LOW_SPO2', message: 'Monitorizar oxigenación', severity: 'WARNING' });
  }
  if (fc !== null && fc > 120) {
    alerts.push({ code: 'TACHYCARDIA', message: 'Taquicardia — evaluar causa', severity: 'WARNING' });
  }
  if (fr !== null && fr > 22) {
    alerts.push({ code: 'TACHYPNEA', message: 'Taquipnea — evaluar compromiso respiratorio', severity: 'WARNING' });
  }
  if (temp !== null && temp > 38.5) {
    alerts.push({ code: 'FEVER', message: 'Fiebre — evaluar foco infeccioso', severity: 'WARNING' });
  }
  if (eva !== null && eva >= 7) {
    alerts.push({ code: 'SEVERE_PAIN', message: 'Dolor severo — manejo analgésico prioritario', severity: 'WARNING' });
  }

  return alerts.sort((left, right) => {
    if (left.severity === right.severity) return 0;
    return left.severity === 'CRITICAL' ? -1 : 1;
  });
}

function hasSelectedTriageClinicalDiscriminator(
  formData: Record<string, RecordFieldValue>,
) {
  return triageClinicalDiscriminatorFields.some(({ key }) => formData[key] === true);
}

function getLatestRecordByTab(
  records: EncounterDetailResponse['sectionRecords'],
  tabKey: string,
) {
  return [...records]
    .filter((record) => record.tabKey === tabKey)
    .sort((left, right) => {
      const leftVersion = left.metadata.versionNumber ?? 0;
      const rightVersion = right.metadata.versionNumber ?? 0;

      if (leftVersion !== rightVersion) {
        return rightVersion - leftVersion;
      }

      return right.recordedAt.localeCompare(left.recordedAt);
    })[0] ?? null;
}

function readSummaryText(
  formData: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = formData?.[key];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return '';
}

function readSummaryArray(
  formData: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = formData?.[key];
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
}

function compactSummaryList(values: Array<string | null | undefined>) {
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
}

function uniqueSummaryItems(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase('es-MX');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatSummaryEnum(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLocaleLowerCase('es-MX')
    .replace(/(^|\s)\S/g, (match) => match.toLocaleUpperCase('es-MX'));
}

function formatSummaryDateTime(dateValue?: string, timeValue?: string) {
  if (dateValue && timeValue) return formatDateTime(`${dateValue}T${timeValue}`);
  if (dateValue) return formatDate(dateValue);
  return '';
}

function resolveHospitalSummaryDate(record: EncounterDetailResponse['sectionRecords'][number]) {
  const formData = record.formData;
  return (
    readSummaryText(formData, 'fechaHoraEvolucionHosp') ||
    readSummaryText(formData, 'fechaHoraDocumentoQuirurgico') ||
    formatSummaryDateTime(
      readSummaryText(formData, 'fechaSolicitudInterHosp'),
      readSummaryText(formData, 'horaSolicitudInterHosp'),
    ) ||
    record.recordedAt
  );
}

function calculateHospitalSummaryStayDays(admittedAt: string, endedAt: string) {
  const admissionDate = admittedAt ? new Date(admittedAt) : null;
  const endDate = endedAt ? new Date(endedAt) : new Date();

  if (!admissionDate || Number.isNaN(admissionDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '';
  }

  const diffMs = endDate.getTime() - admissionDate.getTime();
  if (diffMs < 0) return '';

  return String(Math.max(1, Math.ceil(diffMs / 86_400_000)));
}

function buildSummaryMedicationLine(item: Record<string, unknown>) {
  return compactSummaryList([
    readSummaryText(item, 'medicamento'),
    readSummaryText(item, 'dosis'),
    readSummaryText(item, 'via'),
    readSummaryText(item, 'frecuencia'),
    readSummaryText(item, 'indicacion'),
  ]).join(' · ');
}

function buildHospitalClinicalSummary(detail: EncounterDetailResponse) {
  const records = detail.sectionRecords;
  const admission = getLatestRecordByTab(records, 'Ingreso');
  const evolution = getLatestRecordByTab(records, 'Evolución');
  const orders = getLatestRecordByTab(records, 'Indicaciones médicas');
  const nursing = getLatestRecordByTab(records, 'Enfermería');
  const consultation = getLatestRecordByTab(records, 'Interconsultas');
  const surgery = getLatestRecordByTab(records, 'Procedimientos / Cirugía');
  const discharge = getLatestRecordByTab(records, 'Egreso');
  const latestSignedDocument =
    [...records]
      .filter((record) => record.tabKey === 'Documentos' && record.status === 'SIGNED')
      .sort((left, right) => (right.signedAt ?? right.recordedAt).localeCompare(left.signedAt ?? left.recordedAt))[0] ??
    null;
  const admissionForm = admission?.formData ?? {};
  const evolutionForm = evolution?.formData ?? {};
  const ordersForm = orders?.formData ?? {};
  const nursingForm = nursing?.formData ?? {};
  const consultationForm = consultation?.formData ?? {};
  const surgeryForm = surgery?.formData ?? {};
  const dischargeForm = discharge?.formData ?? {};
  const admissionAt =
    readSummaryText(admissionForm, 'fechaIngresoHosp') &&
    readSummaryText(admissionForm, 'horaIngresoHosp')
      ? `${readSummaryText(admissionForm, 'fechaIngresoHosp')}T${readSummaryText(admissionForm, 'horaIngresoHosp')}`
      : detail.openedAt;
  const dischargeAt =
    readSummaryText(dischargeForm, 'fechaHoraEgresoHosp') ||
    detail.closedAt ||
    new Date().toISOString();
  const locationParts = compactSummaryList([
    readSummaryText(admissionForm, 'pisoIngresoHosp')
      ? `Piso ${readSummaryText(admissionForm, 'pisoIngresoHosp')}`
      : '',
    readSummaryText(admissionForm, 'habitacionIngresoHosp')
      ? `Hab. ${readSummaryText(admissionForm, 'habitacionIngresoHosp')}`
      : '',
    readSummaryText(admissionForm, 'camaIngresoHosp')
      ? `Cama ${readSummaryText(admissionForm, 'camaIngresoHosp')}`
      : '',
  ]);
  const evolutionDiagnoses = readSummaryArray(evolutionForm, 'diagnosticosActivosEvolHosp');
  const primaryEvolutionDiagnosis =
    evolutionDiagnoses.find((item) => readSummaryText(item, 'estado') === 'ACTIVO') ??
    evolutionDiagnoses.find((item) => readSummaryText(item, 'diagnostico')) ??
    null;
  const primaryDiagnosis = {
    label:
      readSummaryText(primaryEvolutionDiagnosis ?? {}, 'diagnostico') ||
      readSummaryText(evolutionForm, 'diagnosticoPrincipalEvolHosp') ||
      readSummaryText(admissionForm, 'diagnosticoPrincipalHosp') ||
      detail.diagnoses.find((diagnosis) => diagnosis.isPrimary)?.description ||
      '',
    code:
      readSummaryText(primaryEvolutionDiagnosis ?? {}, 'cie10') ||
      readSummaryText(evolutionForm, 'cie10EvolHosp') ||
      readSummaryText(admissionForm, 'cie10Hosp') ||
      detail.diagnoses.find((diagnosis) => diagnosis.isPrimary)?.code ||
      '',
  };
  const activeProblems = uniqueSummaryItems([
    ...evolutionDiagnoses
      .filter((item) => !['RESUELTO', 'DESCARTADO', 'INACTIVO'].includes(readSummaryText(item, 'estado')))
      .map((item) =>
        compactSummaryList([
          readSummaryText(item, 'diagnostico'),
          readSummaryText(item, 'cie10'),
        ]).join(' · '),
      ),
    ...readSummaryArray(admissionForm, 'diagnosticosSecundariosHosp')
      .filter((item) => !['RESUELTO', 'DESCARTADO', 'INACTIVO'].includes(readSummaryText(item, 'estado')))
      .map((item) =>
        compactSummaryList([
          readSummaryText(item, 'diagnostico'),
          readSummaryText(item, 'cie10'),
        ]).join(' · '),
      ),
    ...readSummaryArray(admissionForm, 'comorbilidadesHosp')
      .filter((item) => readSummaryText(item, 'estado') !== 'INACTIVO')
      .map((item) => readSummaryText(item, 'comorbilidad')),
    ...detail.problems
      .filter((problem) => !['RESUELTO', 'DESCARTADO', 'INACTIVO'].includes(problem.status ?? ''))
      .map((problem) => problem.description),
  ].filter(Boolean));
  const medicationLines = readSummaryArray(ordersForm, 'medicamentosIndicacionesHosp')
    .map(buildSummaryMedicationLine)
    .filter(Boolean)
    .slice(0, 4);
  const solutionLines = readSummaryArray(ordersForm, 'solucionesIvIndicacionesHosp')
    .map((item) =>
      compactSummaryList([
        readSummaryText(item, 'tipoSolucion'),
        readSummaryText(item, 'volumenMl') ? `${readSummaryText(item, 'volumenMl')} ml` : '',
        readSummaryText(item, 'velocidadMlHora') ? `${readSummaryText(item, 'velocidadMlHora')} ml/h` : '',
        readSummaryText(item, 'duracion'),
      ]).join(' · '),
    )
    .filter(Boolean)
    .slice(0, 3);
  const activeIndications = [
    ...medicationLines.map((value) => `Medicamento: ${value}`),
    ...solutionLines.map((value) => `Solución IV: ${value}`),
    readSummaryText(ordersForm, 'oxigenoIndicacionesHosp')
      ? `Oxígeno: ${formatSummaryEnum(readSummaryText(ordersForm, 'oxigenoIndicacionesHosp'))}`
      : '',
    readSummaryText(ordersForm, 'dietaIndicacionesHosp')
      ? `Dieta: ${formatSummaryEnum(readSummaryText(ordersForm, 'dietaIndicacionesHosp'))}`
      : '',
    readSummaryText(ordersForm, 'reposoActividadIndicacionesHosp')
      ? `Reposo/actividad: ${formatSummaryEnum(readSummaryText(ordersForm, 'reposoActividadIndicacionesHosp'))}`
      : '',
    readSummaryText(ordersForm, 'monitoreoEnfermeriaIndicacionesHosp')
      ? `Monitoreo: ${readSummaryText(ordersForm, 'monitoreoEnfermeriaIndicacionesHosp')}`
      : '',
    readSummaryText(ordersForm, 'cuidadosGeneralesIndicacionesHosp')
      ? `Cuidados: ${readSummaryText(ordersForm, 'cuidadosGeneralesIndicacionesHosp')}`
      : '',
  ].filter(Boolean);
  const pendingProcedures = uniqueSummaryItems([
    readSummaryText(admissionForm, 'procedimientosPlanHosp'),
    readSummaryText(surgeryForm, 'cirugiaPropuestaQuirHosp'),
    readSummaryText(surgeryForm, 'procedimientoRealizadoPostopHosp') &&
    !['SIGNED', 'CLOSED'].includes(surgery?.status ?? '')
      ? readSummaryText(surgeryForm, 'procedimientoRealizadoPostopHosp')
      : '',
  ].filter(Boolean));
  const activeConsultations = [
    consultation
      ? compactSummaryList([
          readSummaryText(consultationForm, 'servicioInterconsultadoHosp'),
          readSummaryText(consultationForm, 'estatusInterconsultaHosp') ||
            (readSummaryText(consultationForm, 'fechaRespuestaInterHosp') ? 'Respondida' : 'Pendiente'),
          readSummaryText(consultationForm, 'prioridadInterHosp'),
          formatSummaryDateTime(
            readSummaryText(consultationForm, 'fechaSolicitudInterHosp'),
            readSummaryText(consultationForm, 'horaSolicitudInterHosp'),
          ),
        ]).join(' · ')
      : '',
    ...readSummaryArray(ordersForm, 'interconsultasSolicitadasIndicacionesHosp').map((item) =>
      compactSummaryList([
        readSummaryText(item, 'servicio'),
        readSummaryText(item, 'prioridad'),
        readSummaryText(item, 'motivo'),
      ]).join(' · '),
    ),
  ].filter(Boolean);
  const pendingStudies = readSummaryArray(ordersForm, 'estudiosSolicitadosIndicacionesHosp')
    .map((item) =>
      compactSummaryList([
        readSummaryText(item, 'tipoEstudio'),
        readSummaryText(item, 'prioridad'),
        readSummaryText(item, 'indicacion'),
      ]).join(' · '),
    )
    .filter(Boolean);
  const nursingVitals = readSummaryArray(nursingForm, 'signosVitalesSeriadosEnfHosp')
    .map((item) => ({
      source: 'Enfermería',
      recordedAt:
        readSummaryText(item, 'fecha') && readSummaryText(item, 'hora')
          ? `${readSummaryText(item, 'fecha')}T${readSummaryText(item, 'hora')}`
          : nursing?.recordedAt ?? '',
      formData: {
        taSistolica: readSummaryText(item, 'taSistolica'),
        taDiastolica: readSummaryText(item, 'taDiastolica'),
        fc: readSummaryText(item, 'fc'),
        fr: readSummaryText(item, 'fr'),
        temperatura: readSummaryText(item, 'temperatura'),
        spo2: readSummaryText(item, 'spo2'),
        dolorEva: readSummaryText(item, 'dolorEva'),
        glucosa: readSummaryText(item, 'glucosaCapilar'),
      },
      responsible: readSummaryText(nursingForm, 'profesionalEnfermeriaLegal') || nursing?.authorName || '',
    }))
    .filter((item) => item.recordedAt);
  const vitalCandidates = [
    evolution
      ? {
          source: 'Evolución hospitalaria',
          recordedAt:
            readSummaryText(evolutionForm, 'fechaHoraEvolucionHosp') || evolution.recordedAt,
          formData: {
            taSistolica: readSummaryText(evolutionForm, 'taSistolicaEvolHosp'),
            taDiastolica: readSummaryText(evolutionForm, 'taDiastolicaEvolHosp'),
            fc: readSummaryText(evolutionForm, 'fcEvolHosp'),
            fr: readSummaryText(evolutionForm, 'frEvolHosp'),
            temperatura: readSummaryText(evolutionForm, 'temperaturaEvolHosp'),
            spo2: readSummaryText(evolutionForm, 'spo2EvolHosp'),
            dolorEva: readSummaryText(evolutionForm, 'dolorEvaEvolHosp'),
            glucosa: readSummaryText(evolutionForm, 'glucosaCapilarEvolHosp'),
          },
          responsible: readSummaryText(evolutionForm, 'medicoEvolHospLegal') || evolution.authorName || '',
        }
      : null,
    ...nursingVitals,
    admission
      ? {
          source: 'Ingreso hospitalario',
          recordedAt: admissionAt,
          formData: {
            taSistolica: readSummaryText(admissionForm, 'taSistolicaHosp'),
            taDiastolica: readSummaryText(admissionForm, 'taDiastolicaHosp'),
            fc: readSummaryText(admissionForm, 'fcHosp'),
            fr: readSummaryText(admissionForm, 'frHosp'),
            temperatura: readSummaryText(admissionForm, 'temperaturaHosp'),
            spo2: readSummaryText(admissionForm, 'spo2Hosp'),
            dolorEva: readSummaryText(admissionForm, 'dolorEvaHosp'),
            glucosa: readSummaryText(admissionForm, 'glucosaHosp'),
          },
          responsible: readSummaryText(admissionForm, 'medicoIngresoLegal') || admission.authorName || '',
        }
      : null,
  ]
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const latestVitals = vitalCandidates[0] ?? null;
  const safetyAlerts = uniqueSummaryItems([
    ...detail.allergies
      .filter((allergy) => !['INACTIVA', 'RESUELTA', 'DESCARTADA'].includes(allergy.status ?? ''))
      .map((allergy) =>
        compactSummaryList([
          `Alergia: ${allergy.substance}`,
          allergy.reaction ?? '',
          allergy.severity ?? '',
        ]).join(' · '),
      ),
    readSummaryText(nursingForm, 'riesgoCaidaMorseEnfHosp')
      ? `Riesgo de caída: ${formatSummaryEnum(readSummaryText(nursingForm, 'riesgoCaidaMorseEnfHosp'))}`
      : readSummaryText(admissionForm, 'riesgoCaidasMorseHosp')
        ? `Riesgo de caída: ${formatSummaryEnum(readSummaryText(admissionForm, 'riesgoCaidasMorseHosp'))}`
        : '',
    readSummaryText(admissionForm, 'aislamientoRequeridoHosp') === 'SI'
      ? 'Aislamiento requerido'
      : '',
    readSummaryText(admissionForm, 'riesgoTromboticoHosp')
      ? `Riesgo trombótico: ${formatSummaryEnum(readSummaryText(admissionForm, 'riesgoTromboticoHosp'))}`
      : '',
    readSummaryText(ordersForm, 'dietaIndicacionesHosp') === 'AYUNO' ||
    readSummaryText(admissionForm, 'dietaInicialHosp') === 'AYUNO'
      ? 'Ayuno'
      : '',
    readSummaryText(nursingForm, 'eventoAdversoEnfHosp') === 'SI'
      ? compactSummaryList([
          'Evento adverso activo',
          readSummaryText(nursingForm, 'tipoEventoAdversoEnfHosp'),
        ]).join(' · ')
      : '',
  ].filter(Boolean));
  const medicationAdministration = readSummaryArray(nursingForm, 'medicamentosMinistradosEnfHosp')
    .filter((item) => readSummaryText(item, 'estado') === 'ADMINISTRADO')
    .sort((left, right) => readSummaryText(right, 'horaAdministrada').localeCompare(readSummaryText(left, 'horaAdministrada')))[0] ?? null;
  const balanceLine =
    readSummaryText(nursingForm, 'ingresosMlEnfHosp') ||
    readSummaryText(nursingForm, 'egresosMlEnfHosp') ||
    readSummaryText(nursingForm, 'balanceTotalEnfHosp')
      ? compactSummaryList([
          readSummaryText(nursingForm, 'ingresosMlEnfHosp')
            ? `Ingresos ${readSummaryText(nursingForm, 'ingresosMlEnfHosp')} ml`
            : '',
          readSummaryText(nursingForm, 'egresosMlEnfHosp')
            ? `Egresos ${readSummaryText(nursingForm, 'egresosMlEnfHosp')} ml`
            : '',
          readSummaryText(nursingForm, 'balanceTotalEnfHosp')
            ? `Balance ${readSummaryText(nursingForm, 'balanceTotalEnfHosp')}`
            : '',
        ]).join(' · ')
      : '';
  const activityItems = [
    evolution
      ? {
          type: 'Última evolución hospitalaria',
          date: resolveHospitalSummaryDate(evolution),
          professional: readSummaryText(evolutionForm, 'medicoEvolHospLegal') || evolution.authorName || '',
          status: evolution.status,
          recordId: evolution.id,
        }
      : null,
    orders
      ? {
          type: 'Última indicación médica',
          date: orders.recordedAt,
          professional: readSummaryText(ordersForm, 'medicoIndicacionesLegal') || orders.authorName || '',
          status: orders.status,
          recordId: orders.id,
        }
      : null,
    surgery
      ? {
          type: 'Último procedimiento',
          date: resolveHospitalSummaryDate(surgery),
          professional: readSummaryText(surgeryForm, 'medicoQuirLegal') || surgery.authorName || '',
          status: surgery.status,
          recordId: surgery.id,
        }
      : null,
    latestSignedDocument
      ? {
          type: 'Último documento firmado',
          date: latestSignedDocument.signedAt ?? latestSignedDocument.recordedAt,
          professional: latestSignedDocument.authorName || '',
          status: latestSignedDocument.noteType,
          recordId: latestSignedDocument.id,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    admission,
    evolution,
    orders,
    nursing,
    consultation,
    surgery,
    discharge,
    admissionAt,
    location: locationParts.join(' · '),
    stayDays: calculateHospitalSummaryStayDays(admissionAt, dischargeAt),
    primaryDiagnosis,
    activeProblems,
    currentStatus:
      readSummaryText(evolutionForm, 'estadoClinicoEvolHosp') ||
      readSummaryText(admissionForm, 'estadoClinicoIngresoHosp'),
    currentLocation: locationParts[0] || readSummaryText(admissionForm, 'servicioIngresoHosp') || detail.facility?.name || '',
    relevantBadges: uniqueSummaryItems([
      readSummaryText(surgeryForm, 'estadoInmediatoPostop') ? 'Postoperatorio' : '',
      readSummaryText(ordersForm, 'oxigenoIndicacionesHosp')
        ? `Oxígeno ${formatSummaryEnum(readSummaryText(ordersForm, 'oxigenoIndicacionesHosp'))}`
        : '',
      readSummaryText(admissionForm, 'aislamientoRequeridoHosp') === 'SI' ? 'Aislamiento' : '',
      readSummaryText(ordersForm, 'dietaIndicacionesHosp') === 'AYUNO' ? 'Ayuno' : '',
      readSummaryText(nursingForm, 'riesgoCaidaMorseEnfHosp')
        ? `Riesgo caída ${formatSummaryEnum(readSummaryText(nursingForm, 'riesgoCaidaMorseEnfHosp'))}`
        : '',
    ].filter(Boolean)).slice(0, 6),
    baseData: [
      { label: 'Fecha y hora de ingreso', value: formatDateTime(admissionAt) },
      { label: 'Servicio', value: readSummaryText(admissionForm, 'servicioIngresoHosp') },
      { label: 'Piso / habitación / cama', value: locationParts.join(' · ') },
      { label: 'Médico tratante', value: readSummaryText(admissionForm, 'medicoAdscritoHosp') || detail.attendingClinician?.fullName || '' },
      { label: 'Diagnóstico de ingreso', value: compactSummaryList([readSummaryText(admissionForm, 'diagnosticoPrincipalHosp'), readSummaryText(admissionForm, 'cie10Hosp')]).join(' · ') },
      { label: 'Motivo de hospitalización', value: readSummaryText(admissionForm, 'motivoIngresoClinicoHosp') || detail.reasonForVisit || '' },
      { label: 'Días de estancia', value: calculateHospitalSummaryStayDays(admissionAt, dischargeAt) },
      { label: 'Vía de ingreso', value: readSummaryText(admissionForm, 'origenIngresoHosp') ? formatSummaryEnum(readSummaryText(admissionForm, 'origenIngresoHosp')) : '' },
      { label: 'Tipo de ingreso', value: readSummaryText(admissionForm, 'tipoIngresoHosp') ? formatSummaryEnum(readSummaryText(admissionForm, 'tipoIngresoHosp')) : '' },
      { label: 'Especialidad', value: detail.specialty?.name || readSummaryText(evolutionForm, 'especialidadGuardiaEvolHosp') },
    ].filter((item) => item.value),
    treatmentPlan: readSummaryText(evolutionForm, 'tratamientoEvolHosp') || readSummaryText(evolutionForm, 'seguimientoEvolHosp') || readSummaryText(admissionForm, 'planAdicionalHosp'),
    treatmentPlanDate: evolution ? resolveHospitalSummaryDate(evolution) : '',
    activeIndications,
    pendingProcedures,
    activeConsultations,
    pendingStudies,
    probableDischargeDate:
      readSummaryText(dischargeForm, 'fechaProximaCitaEgresoHosp') ||
      readSummaryText(evolutionForm, 'fechaProbableEgresoHosp') ||
      '',
    latestVitals,
    safetyAlerts,
    nursingSummary: nursing
      ? {
          date: nursing.recordedAt,
          responsible: readSummaryText(nursingForm, 'profesionalEnfermeriaLegal') || nursing.authorName || '',
          lastAdministration: medicationAdministration
            ? compactSummaryList([
                readSummaryText(medicationAdministration, 'medicamento'),
                readSummaryText(medicationAdministration, 'horaAdministrada'),
                readSummaryText(medicationAdministration, 'enfermeria'),
              ]).join(' · ')
            : '',
          balance: balanceLine,
          observations: readSummaryText(nursingForm, 'observacionesGeneralesEnfHosp'),
          fallRisk: readSummaryText(nursingForm, 'riesgoCaidaMorseEnfHosp'),
          painEva: nursingVitals[0]?.formData.dolorEva ?? '',
          status: nursing.status,
        }
      : null,
    activityItems,
  };
}

function getLatestRecordByTabExcluding(
  records: EncounterDetailResponse['sectionRecords'],
  tabKey: string,
  excludedRecordId: string | null,
) {
  return getLatestRecordByTab(
    excludedRecordId
      ? records.filter((record) => record.id !== excludedRecordId)
      : records,
    tabKey,
  );
}

function resolveHospitalShiftValue(dateTimeValue: string) {
  const date = dateTimeValue ? new Date(dateTimeValue) : new Date();
  const hour = Number.isNaN(date.getTime()) ? new Date().getHours() : date.getHours();

  if (hour >= 6 && hour < 14) return 'MATUTINO';
  if (hour >= 14 && hour < 22) return 'VESPERTINO';
  return 'NOCTURNO';
}

function formatHospitalEvolutionPreviousReference(
  record: EncounterDetailResponse['sectionRecords'][number] | null,
) {
  if (!record) {
    return 'Sin evolución hospitalaria previa';
  }

  return `Evolución hospitalaria previa — ${formatDateTime(record.recordedAt)}`;
}

function calculateHospitalStayDay(admittedAtValue: string, evolutionAtValue: string) {
  const admittedAt = new Date(admittedAtValue);
  const evolutionAt = new Date(evolutionAtValue);

  if (Number.isNaN(admittedAt.getTime()) || Number.isNaN(evolutionAt.getTime())) {
    return '';
  }

  const admissionDay = new Date(
    admittedAt.getFullYear(),
    admittedAt.getMonth(),
    admittedAt.getDate(),
  );
  const evolutionDay = new Date(
    evolutionAt.getFullYear(),
    evolutionAt.getMonth(),
    evolutionAt.getDate(),
  );
  const dayDifference = Math.floor(
    (evolutionDay.getTime() - admissionDay.getTime()) / 86_400_000,
  );

  return String(Math.max(dayDifference + 1, 1));
}

function buildEmergencyInitialNoteSnapshot(args: {
  detail: EncounterDetailResponse;
  triageRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const triageFormData = args.triageRecord?.formData ?? {};
  const currentFormData = args.currentFormData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const readCurrentOrTriage = (currentKey: string, triageKey: string) =>
    currentFormData[currentKey] !== undefined &&
    currentFormData[currentKey] !== null &&
    `${currentFormData[currentKey]}`.trim().length > 0
      ? currentFormData[currentKey]
      : readString(triageFormData[triageKey]);

  return {
    tipoRegistro: 'Nota inicial',
    notaInicialTriageOrigenId: args.triageRecord?.id ?? '',
    modoLlegadaNota: readCurrentOrTriage('modoLlegadaNota', 'modoLlegada'),
    taSistolicaNota: readCurrentOrTriage('taSistolicaNota', 'taSistolica'),
    taDiastolicaNota: readCurrentOrTriage('taDiastolicaNota', 'taDiastolica'),
    fcNota: readCurrentOrTriage('fcNota', 'fc'),
    frNota: readCurrentOrTriage('frNota', 'fr'),
    tempNota: readCurrentOrTriage('tempNota', 'temp'),
    spo2Nota: readCurrentOrTriage('spo2Nota', 'spo2'),
    evaNota: readCurrentOrTriage('evaNota', 'eva'),
    glucosaNota: readCurrentOrTriage('glucosaNota', 'glucosa'),
    glasgowNota: readCurrentOrTriage('glasgowNota', 'glasgowTotal'),
    estadoMentalNota:
      readCurrentOrTriage('estadoMentalNota', 'estadoMentalNota') ||
      mapInitialMentalStatusToLegacyValue(
        triageFormData.estadoMentalInicial ?? triageFormData.estadoMental,
      ),
    llegadaVisual: readString(triageFormData.horaLlegada),
    triageVisual: readString(triageFormData.horaTriage),
    inicioAtencionVisual:
      readString(currentFormData.inicioAtencionVisual) || args.recordedAt,
    decisionVisual: readString(currentFormData.horaDecision),
    alertasTriage: readString(triageFormData.alertasAutomaticas),
    antecedentesNota:
      readString(currentFormData.antecedentesNota) ||
      [
        args.detail.patient.allergiesSummary.length
          ? `Alergias: ${args.detail.patient.allergiesSummary.join(', ')}`
          : '',
        args.detail.patient.activeProblems.length
          ? `Problemas activos: ${args.detail.patient.activeProblems.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    notaInicialLegalMedico:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    notaInicialLegalCedula:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
  };
}

function buildEmergencyEvolutionDiagnoses(
  initialNoteFormData: Record<string, unknown>,
) {
  const diagnostico =
    typeof initialNoteFormData.diagnosticoNota === 'string'
      ? initialNoteFormData.diagnosticoNota
      : '';
  const cie10 =
    typeof initialNoteFormData.cie10Nota === 'string'
      ? initialNoteFormData.cie10Nota
      : '';

  return diagnostico || cie10
    ? [
        {
          id: createClientRecordId(),
          diagnostico,
          cie10,
          tipo: '',
        },
      ]
    : [];
}

function buildEmergencyEvolutionSnapshot(args: {
  detail: EncounterDetailResponse;
  initialNoteRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  previousEvolutionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const initialFormData = args.initialNoteRecord?.formData ?? {};
  const previousFormData = args.previousEvolutionRecord?.formData ?? {};
  const currentFormData = args.currentFormData ?? {};
  const recordedDate = args.recordedAt ? new Date(args.recordedAt) : new Date();
  const openedDate = new Date(args.detail.openedAt);
  const evolutionDay =
    Number.isNaN(recordedDate.getTime()) || Number.isNaN(openedDate.getTime())
      ? '1'
      : String(
          Math.max(
            1,
            Math.floor(
              (recordedDate.getTime() - openedDate.getTime()) / 86_400_000,
            ) + 1,
          ),
        );
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const toRecordFieldValue = (value: unknown): RecordFieldValue => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      if (value.every((item) => typeof item === 'string')) {
        return value;
      }

      return value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      );
    }

    return '';
  };
  const readCurrentOrSource = (
    currentKey: string,
    previousKey: string,
    initialKey: string,
  ) =>
    currentFormData[currentKey] !== undefined &&
    currentFormData[currentKey] !== null &&
      `${currentFormData[currentKey]}`.trim().length > 0
      ? currentFormData[currentKey]
      : toRecordFieldValue(previousFormData[previousKey] ?? initialFormData[initialKey] ?? '');

  return {
    tipoRegistro: 'Evolución en urgencias',
    fechaEvolucionUrg:
      readString(currentFormData.fechaEvolucionUrg) ||
      args.recordedAt.slice(0, 10),
    horaEvolucionUrg:
      readString(currentFormData.horaEvolucionUrg) ||
      args.recordedAt.slice(11, 16),
    diaEvolucionUrg: evolutionDay,
    taSistolicaEvolUrg: readCurrentOrSource(
      'taSistolicaEvolUrg',
      'taSistolicaEvolUrg',
      'taSistolicaNota',
    ),
    taDiastolicaEvolUrg: readCurrentOrSource(
      'taDiastolicaEvolUrg',
      'taDiastolicaEvolUrg',
      'taDiastolicaNota',
    ),
    fcEvolUrg: readCurrentOrSource('fcEvolUrg', 'fcEvolUrg', 'fcNota'),
    frEvolUrg: readCurrentOrSource('frEvolUrg', 'frEvolUrg', 'frNota'),
    tempEvolUrg: readCurrentOrSource('tempEvolUrg', 'tempEvolUrg', 'tempNota'),
    spo2EvolUrg: readCurrentOrSource('spo2EvolUrg', 'spo2EvolUrg', 'spo2Nota'),
    evaEvolUrg: readCurrentOrSource('evaEvolUrg', 'evaEvolUrg', 'evaNota'),
    glucosaEvolUrg: readCurrentOrSource(
      'glucosaEvolUrg',
      'glucosaEvolUrg',
      'glucosaNota',
    ),
    glasgowEvolUrg: readCurrentOrSource(
      'glasgowEvolUrg',
      'glasgowEvolUrg',
      'glasgowNota',
    ),
    diagnosticosEvolucionUrg: normalizeEmergencyEvolutionDiagnoses(
      Array.isArray(currentFormData.diagnosticosEvolucionUrg) &&
        currentFormData.diagnosticosEvolucionUrg.length > 0
        ? currentFormData.diagnosticosEvolucionUrg
        : Array.isArray(previousFormData.diagnosticosEvolucionUrg) &&
            previousFormData.diagnosticosEvolucionUrg.length > 0
          ? previousFormData.diagnosticosEvolucionUrg
          : buildEmergencyEvolutionDiagnoses(initialFormData),
    ),
    tratamientoEvolUrg: readCurrentOrSource(
      'tratamientoEvolUrg',
      'tratamientoEvolUrg',
      'medicamentosPlan',
    ),
    estudiosPendientesUrg: readCurrentOrSource(
      'estudiosPendientesUrg',
      'estudiosPendientesUrg',
      'estudiosPlan',
    ),
    interconsultasEvolUrg: readCurrentOrSource(
      'interconsultasEvolUrg',
      'interconsultasEvolUrg',
      'interconsultasPlan',
    ),
    seguimientoEvolUrg: readCurrentOrSource(
      'seguimientoEvolUrg',
      'seguimientoEvolUrg',
      'resumenPronostico',
    ),
    consentimientoVigenteUrg: readCurrentOrSource(
      'consentimientoVigenteUrg',
      'consentimientoVigenteUrg',
      'consentimientoUrgenciasNota',
    )
      ? readString(currentFormData.consentimientoVigenteUrg) ||
        readString(previousFormData.consentimientoVigenteUrg) ||
        'VIGENTE'
      : '',
    informacionBrindadaUrg: readCurrentOrSource(
      'informacionBrindadaUrg',
      'informacionBrindadaUrg',
      'observacionesConsentimientoNota',
    ),
    resultadosEstudiosIntegrados:
      args.detail.metrics.labs || args.detail.metrics.imaging
        ? `Laboratorio: ${args.detail.metrics.labs} · Imagenología: ${args.detail.metrics.imaging}`
        : 'Sin resultados externos vinculados al episodio.',
    resultadosAuxiliaresDiagnosticoUrg:
      normalizeEmergencyEvolutionDiagnosticResults(
        currentFormData.resultadosAuxiliaresDiagnosticoUrg ??
          previousFormData.resultadosAuxiliaresDiagnosticoUrg,
        currentFormData,
      ),
    evolucionUrgLegalNombre:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    evolucionUrgLegalCedula:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    evolucionUrgLegalEspecialidad: args.detail.specialty?.name ?? 'Sin especialidad',
    evolucionUrgLegalLugar:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function normalizeObjectArrayField(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
}

function buildEmergencyOrderSafetyAlerts(args: {
  medications: unknown;
  allergies: string[];
}) {
  const medications = normalizeObjectArrayField(args.medications);
  const medicationNames = medications
    .map((item) => (typeof item.medicamento === 'string' ? item.medicamento.trim() : ''))
    .filter(Boolean);
  const lowerMedicationNames = medicationNames.map((name) => name.toLowerCase());
  const allergyMatches = args.allergies.filter((allergy) =>
    lowerMedicationNames.some((medication) =>
      medication.includes(allergy.toLowerCase()),
    ),
  );
  const duplicatedMedicationNames = medicationNames.filter(
    (name, index) => lowerMedicationNames.indexOf(name.toLowerCase()) !== index,
  );
  const missingDoseItems = medications
    .filter(
      (item) =>
        typeof item.medicamento === 'string' &&
        item.medicamento.trim() &&
        (typeof item.dosis !== 'string' || !item.dosis.trim()),
    )
    .map((item) => item.medicamento as string);

  return {
    alertaAlergiasOrdenes:
      allergyMatches.length > 0
        ? `Verificar alergias registradas: ${allergyMatches.join(', ')}`
        : 'Sin alertas de alergia con los medicamentos capturados.',
    alertaDuplicidadOrdenes:
      duplicatedMedicationNames.length > 0
        ? `Posible duplicidad: ${[...new Set(duplicatedMedicationNames)].join(', ')}`
        : 'Sin duplicidad terapéutica detectada por nombre.',
    alertaDosisOrdenes:
      missingDoseItems.length > 0
        ? `Capturar dosis para: ${missingDoseItems.join(', ')}`
        : 'Dosis capturada para los medicamentos indicados.',
  };
}

function buildEmergencyOrdersTraceability(args: {
  medications: unknown;
  studies: unknown;
  solutions: unknown;
  responsibleUserName: string;
}) {
  const rows: string[] = [];

  normalizeObjectArrayField(args.medications).forEach((item, index) => {
    const medication =
      typeof item.medicamento === 'string' && item.medicamento.trim()
        ? item.medicamento
        : `Medicamento ${index + 1}`;
    rows.push(
      `${medication} | pendiente | ${args.responsibleUserName} | sin ejecución | enfermería`,
    );
  });

  normalizeObjectArrayField(args.studies).forEach((item, index) => {
    const study =
      typeof item.estudio === 'string' && item.estudio.trim()
        ? item.estudio
        : `Estudio ${index + 1}`;
    const type = typeof item.tipo === 'string' && item.tipo ? item.tipo : 'auxiliar';
    const status =
      typeof item.estado === 'string' && item.estado ? item.estado : 'PENDIENTE';
    rows.push(
      `${study} | ${status.toLowerCase()} | ${args.responsibleUserName} | sin ejecución | ${type.toLowerCase()}`,
    );
  });

  normalizeObjectArrayField(args.solutions).forEach((item, index) => {
    const solution =
      typeof item.tipoSolucion === 'string' && item.tipoSolucion.trim()
        ? item.tipoSolucion
        : `Solución ${index + 1}`;
    rows.push(
      `${solution} | pendiente | ${args.responsibleUserName} | sin ejecución | enfermería`,
    );
  });

  return rows.join('\n') || 'Sin órdenes operativas capturadas.';
}

type EmergencyOrderTraceCard = {
  id: string;
  title: string;
  status: string;
  responsible: string;
  service: string;
  relevantTime: string;
};

const emergencyOrderTraceStatusLabels: Record<string, string> = {
  PROGRAMADA: 'Programada',
  EJECUTADA: 'Ejecutada',
  PENDIENTE_RESULTADO: 'Pendiente de resultado',
  CANCELADA: 'Cancelada',
  PENDIENTE: 'Programada',
  EN_PROCESO: 'Programada',
  RESULTADO: 'Pendiente de resultado',
};

function normalizeEmergencyOrderTraceStatus(value: unknown) {
  const rawValue = typeof value === 'string' ? value : 'PROGRAMADA';
  return emergencyOrderTraceStatusLabels[rawValue] ?? 'Programada';
}

function buildEmergencyOrdersTraceCards(
  formData: Record<string, RecordFieldValue>,
): EmergencyOrderTraceCard[] {
  const responsible =
    typeof formData.ordenesLegalMedico === 'string' && formData.ordenesLegalMedico.trim()
      ? formData.ordenesLegalMedico
      : 'Sin profesional responsable';
  const cards: EmergencyOrderTraceCard[] = [];

  normalizeObjectArrayField(formData.medicamentosOrdenesUrg).forEach((item, index) => {
    cards.push({
      id: `medication-${index}`,
      title: readTextRecordValue(item, 'medicamento') || `Medicamento ${index + 1}`,
      status: 'Programada',
      responsible,
      service: 'Enfermería',
      relevantTime: 'Sin horario de ejecución',
    });
  });

  normalizeObjectArrayField(formData.solucionesIntravenosasOrdenes).forEach((item, index) => {
    cards.push({
      id: `solution-${index}`,
      title: readTextRecordValue(item, 'tipoSolucion') || `Solución ${index + 1}`,
      status: 'Programada',
      responsible,
      service: 'Enfermería',
      relevantTime: readTextRecordValue(item, 'duracion') || 'Sin horario de ejecución',
    });
  });

  normalizeObjectArrayField(formData.estudiosSolicitadosOrdenes).forEach((item, index) => {
    const studyType = readTextRecordValue(item, 'tipo');
    cards.push({
      id: `study-${index}`,
      title: readTextRecordValue(item, 'estudio') || `Estudio ${index + 1}`,
      status: normalizeEmergencyOrderTraceStatus(item.estado),
      responsible,
      service: studyType === 'LABORATORIO' ? 'Laboratorio' : 'Gabinete',
      relevantTime: readTextRecordValue(item, 'frecuencia') || 'Sin horario de ejecución',
    });
  });

  if (formData.transfusionAplica === true) {
    cards.push({
      id: 'transfusion',
      title:
        formData.transfusionTipoHemoderivado === 'OTRO' &&
        typeof formData.transfusionOtroHemoderivado === 'string' &&
        formData.transfusionOtroHemoderivado.trim()
          ? formData.transfusionOtroHemoderivado
          : 'Transfusión',
      status: 'Programada',
      responsible,
      service:
        typeof formData.transfusionServicioAplica === 'string' &&
        formData.transfusionServicioAplica.trim()
          ? formData.transfusionServicioAplica
          : 'Enfermería',
      relevantTime:
        typeof formData.transfusionHoraInicio === 'string' && formData.transfusionHoraInicio
          ? formatDateTime(formData.transfusionHoraInicio)
          : 'Sin hora de inicio',
    });
  }

  return cards;
}

function buildEmergencyOrdersSnapshot(args: {
  detail: EncounterDetailResponse;
  initialNoteRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  evolutionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  documentType: EmergencyOrdersDocumentType;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const initialFormData = args.initialNoteRecord?.formData ?? {};
  const evolutionFormData = args.evolutionRecord?.formData ?? {};
  const currentFormData = args.currentFormData ?? {};
  const readString = (value: unknown) => (typeof value === 'string' ? value : '');
  const medicationSuggestion =
    readString(evolutionFormData.tratamientoEvolUrg) ||
    readString(initialFormData.medicamentosPlan);
  const studySuggestion =
    readString(evolutionFormData.estudiosPendientesUrg) ||
    readString(initialFormData.estudiosPlan) ||
    readString(initialFormData.estudiosAnalisis);
  const interventionSuggestion = readString(initialFormData.intervencionesPlan);
  const medications =
    Array.isArray(currentFormData.medicamentosOrdenesUrg) &&
    currentFormData.medicamentosOrdenesUrg.length > 0
      ? currentFormData.medicamentosOrdenesUrg
      : medicationSuggestion
        ? [
            {
              medicamento: medicationSuggestion,
              dosis: '',
              via: '',
              frecuencia: '',
              duracion: '',
              indicacion: 'Sugerido desde plan clínico',
              prioridad: 'NORMAL',
            },
          ]
        : [];
  const studies =
    Array.isArray(currentFormData.estudiosSolicitadosOrdenes) &&
    currentFormData.estudiosSolicitadosOrdenes.length > 0
      ? currentFormData.estudiosSolicitadosOrdenes
      : studySuggestion
        ? [
            {
              tipo: 'LABORATORIO',
              estudio: studySuggestion,
              prioridad: 'NORMAL',
              justificacion: 'Sugerido desde plan clínico',
              frecuencia: '',
              estado: 'PENDIENTE',
            },
          ]
        : [];
  const safetyAlerts = buildEmergencyOrderSafetyAlerts({
    medications,
    allergies: args.detail.patient.allergiesSummary,
  });

  return {
    tipoRegistro: args.documentType,
    medicamentosOrdenesUrg: medications,
    estudiosSolicitadosOrdenes: studies,
    monitoreoOrdenes:
      readString(currentFormData.monitoreoOrdenes) || interventionSuggestion,
    transfusionMedicoIndica:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    ...safetyAlerts,
    estadoOrdenesTrazabilidad: buildEmergencyOrdersTraceability({
      medications,
      studies,
      solutions: currentFormData.solucionesIntravenosasOrdenes,
      responsibleUserName:
        args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    }),
    ordenesLegalMedico:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    ordenesLegalCedula:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    ordenesLegalEspecialidad: args.detail.specialty?.name ?? 'Sin especialidad',
    ordenesLegalLugar:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function calculateConsultationTarget(priority: RecordFieldValue | undefined) {
  const targets: Record<string, string> = {
    INMEDIATA: '30 minutos',
    URGENTE: '1 hora',
    PREFERENTE: '4 horas',
    DIFERIDA: 'Diferida',
  };
  return typeof priority === 'string' ? targets[priority] ?? '' : '';
}

function buildEmergencyConsultationSnapshot(args: {
  detail: EncounterDetailResponse;
  initialNoteRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  evolutionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  ordersRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const initial = args.initialNoteRecord?.formData ?? {};
  const evolution = args.evolutionRecord?.formData ?? {};
  const orders = args.ordersRecord?.formData ?? {};
  const current = args.currentFormData ?? {};
  const read = (value: unknown) => (typeof value === 'string' ? value : '');
  const requestDate = read(current.fechaInterconsulta) || args.recordedAt.slice(0, 10);
  const requestTime = read(current.horaInterconsulta) || args.recordedAt.slice(11, 16);
  const requestedAt = new Date(`${requestDate}T${requestTime}`);
  const receivedAt =
    typeof current.horaRecepcionInterconsulta === 'string'
      ? new Date(current.horaRecepcionInterconsulta)
      : null;
  const respondedAt =
    typeof current.horaRespuestaInterconsulta === 'string'
      ? new Date(current.horaRespuestaInterconsulta)
      : null;
  const endAt =
    respondedAt && !Number.isNaN(respondedAt.getTime())
      ? respondedAt
      : receivedAt && !Number.isNaN(receivedAt.getTime())
        ? receivedAt
        : null;
  const priority =
    read(current.prioridadInterconsulta) ||
    (read(initial.riesgoVitalNota) === 'ALTO' ||
    read(evolution.estadoClinicoEvolucionUrg) === 'CRITICO'
      ? 'INMEDIATA'
      : 'URGENTE');

  return {
    tipoRegistro: 'Interconsultas',
    fechaInterconsulta: requestDate,
    horaInterconsulta: requestTime,
    medicoSolicitanteInterconsulta:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaSolicitanteInterconsulta:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    servicioSolicitanteInterconsulta: 'Urgencias',
    prioridadInterconsulta: priority,
    tiempoObjetivoInterconsulta: calculateConsultationTarget(priority),
    estatusInterconsulta: read(current.estatusInterconsulta) || 'PENDIENTE',
    motivoInterconsulta:
      read(current.motivoInterconsulta) ||
      read(initial.motivoAtencion) ||
      read(evolution.referenciaPacienteUrg),
    resumenClinicoInterconsulta:
      read(current.resumenClinicoInterconsulta) ||
      read(evolution.justificacionClinicaNom004) ||
      read(initial.resumenPronostico) ||
      read(initial.estudiosAnalisis),
    diagnosticoRelacionadoInterconsulta:
      read(current.diagnosticoRelacionadoInterconsulta) ||
      read(initial.diagnosticoNota),
    cie10Interconsulta: read(initial.cie10Nota),
    ordenesAsociadasInterconsulta:
      read(current.ordenesAsociadasInterconsulta) ||
      read(orders.estadoOrdenesTrazabilidad),
    horaSolicitudInterconsulta:
      Number.isNaN(requestedAt.getTime()) ? '' : requestedAt.toISOString(),
    tiempoRespuestaInterconsulta:
      endAt && !Number.isNaN(requestedAt.getTime()) && endAt >= requestedAt
        ? `${Math.round((endAt.getTime() - requestedAt.getTime()) / 60000)} min`
        : '',
    interconsultaLegalNombre:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    interconsultaLegalCedula:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    interconsultaLegalEspecialidad:
      args.detail.specialty?.name ?? 'Sin especialidad',
    interconsultaLegalLugar:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function summarizeOrderMedications(value: unknown) {
  return normalizeObjectArrayField(value)
    .map((item) =>
      [
        typeof item.medicamento === 'string' ? item.medicamento : '',
        typeof item.dosis === 'string' ? item.dosis : '',
        typeof item.via === 'string' ? item.via : '',
        typeof item.frecuencia === 'string' ? item.frecuencia : '',
        typeof item.duracion === 'string' ? item.duracion : '',
      ]
        .filter(Boolean)
        .join(' · '),
    )
    .filter(Boolean)
    .join('\n');
}

function buildEmergencyDischargeSnapshot(args: {
  detail: EncounterDetailResponse;
  triageRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  initialNoteRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  evolutionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  ordersRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  consultationRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const triage = args.triageRecord?.formData ?? {};
  const initial = args.initialNoteRecord?.formData ?? {};
  const evolution = args.evolutionRecord?.formData ?? {};
  const orders = args.ordersRecord?.formData ?? {};
  const consultation = args.consultationRecord?.formData ?? {};
  const current = args.currentFormData ?? {};
  const read = (value: unknown) => (typeof value === 'string' ? value : '');
  const hasValue = (value: RecordFieldValue | undefined) =>
    Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : value !== undefined && value !== null && value !== false;
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue =>
    hasValue(current[fieldKey]) ? current[fieldKey] : suggestion;
  const facilityName = args.detail.facility?.name ?? '';
  const careLocation =
    [args.detail.facility?.name, args.detail.serviceArea?.name]
      .filter(Boolean)
      .join(' · ') || 'Lugar no configurado';
  const responsibleName =
    args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable';
  const responsibleLicense =
    args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula';
  const today = args.recordedAt.slice(0, 10);
  const time = args.recordedAt.slice(11, 16);

  return {
    tipoRegistro: 'Egreso de urgencias',
    fechaHoraEgresoUrg: keep('fechaHoraEgresoUrg', args.recordedAt),
    destinoEgresoUrg:
      read(current.destinoEgresoUrg) ||
      (read(current.tipoEgresoUrg) === 'ALTA_DOMICILIO' ? 'DOMICILIO' : ''),
    motivoIngresoEgresoUrg: keep(
      'motivoIngresoEgresoUrg',
      read(triage.motivoPrincipal) || read(initial.motivoAtencion),
    ),
    diagnosticoEgresoUrg: keep(
      'diagnosticoEgresoUrg',
      read(initial.diagnosticoNota),
    ),
    cie10EgresoUrg: keep('cie10EgresoUrg', read(initial.cie10Nota)),
    manejoUrgenciasEgresoUrg: keep(
      'manejoUrgenciasEgresoUrg',
      read(orders.estadoOrdenesTrazabilidad),
    ),
    procedimientosRealizadosEgresoUrg: keep(
      'procedimientosRealizadosEgresoUrg',
      read(evolution.procedimientosEvolucionUrg),
    ),
    evolucionEstanciaEgresoUrg: keep(
      'evolucionEstanciaEgresoUrg',
      read(evolution.justificacionClinicaNom004) || read(evolution.referenciaPacienteUrg),
    ),
    medicamentosEgresoUrg: keep(
      'medicamentosEgresoUrg',
      summarizeOrderMedications(orders.medicamentosOrdenesUrg),
    ),
    cuidadosGeneralesEgresoUrg: keep(
      'cuidadosGeneralesEgresoUrg',
      read(orders.monitoreoOrdenes),
    ),
    dietaEgresoUrg: keep('dietaEgresoUrg', read(orders.dietaOrdenes)),
    seguimientoEgresoUrg: keep(
      'seguimientoEgresoUrg',
      read(evolution.seguimientoEvolUrg) || read(consultation.seguimientoRecomendado),
    ),
    signosAlarmaEgresoUrg: keep(
      'signosAlarmaEgresoUrg',
      'Regresar a Urgencias ante fiebre persistente, dolor intenso, dificultad respiratoria, deterioro neurológico, sangrado, vómito incoercible o empeoramiento del estado general.',
    ),
    recetaAsociadaEgresoUrg: keep(
      'recetaAsociadaEgresoUrg',
      'Sin receta vinculada en este módulo',
    ),
    educacionOtorgadaEgresoUrg: keep(
      'educacionOtorgadaEgresoUrg',
      'Se explica diagnóstico, tratamiento recibido, indicaciones, datos de alarma y plan de seguimiento.',
    ),
    comprensionPacienteEgresoUrg: keep('comprensionPacienteEgresoUrg', 'ADECUADA'),
    fechaHoraReferenciaTrasladoUrg: keep(
      'fechaHoraReferenciaTrasladoUrg',
      args.recordedAt,
    ),
    unidadOrigenTrasladoUrg: keep(
      'unidadOrigenTrasladoUrg',
      facilityName,
    ),
    unidadDestinoTrasladoUrg: keep(
      'unidadDestinoTrasladoUrg',
      read(current.servicioReceptorUrg) || read(current.destinoEgresoUrg),
    ),
    taTrasladoUrg: keep(
      'taTrasladoUrg',
      read(initial.taSistolicaNota) && read(initial.taDiastolicaNota)
        ? `${read(initial.taSistolicaNota)}/${read(initial.taDiastolicaNota)}`
        : '',
    ),
    fcTrasladoUrg: keep('fcTrasladoUrg', read(initial.fcNota)),
    frTrasladoUrg: keep('frTrasladoUrg', read(initial.frNota)),
    temperaturaTrasladoUrg: keep('temperaturaTrasladoUrg', read(initial.tempNota)),
    spo2TrasladoUrg: keep('spo2TrasladoUrg', read(initial.spo2Nota)),
    resultadosRelevantesTrasladoUrg: keep(
      'resultadosRelevantesTrasladoUrg',
      read(evolution.resultadosEstudiosIntegrados) || read(initial.estudiosAnalisis),
    ),
    pronosticoTrasladoUrg: keep(
      'pronosticoTrasladoUrg',
      read(initial.pronosticoNota) || read(initial.resumenPronostico),
    ),
    motivoTrasladoUrg: keep(
      'motivoTrasladoUrg',
      read(current.motivoTrasladoUrg) || read(current.tipoEgresoUrg),
    ),
    resumenTrasladoUrg: keep(
      'resumenTrasladoUrg',
      read(evolution.justificacionClinicaNom004) || read(initial.resumenPronostico),
    ),
    diagnosticoTrasladoUrg: keep(
      'diagnosticoTrasladoUrg',
      read(initial.diagnosticoNota),
    ),
    tratamientoPrevioTrasladoUrg: keep(
      'tratamientoPrevioTrasladoUrg',
      read(orders.estadoOrdenesTrazabilidad),
    ),
    medicoReceptorTrasladoUrg: keep('medicoReceptorTrasladoUrg', read(current.medicoReceptorUrg)),
    institucionConsentimientoUrg: keep('institucionConsentimientoUrg', facilityName),
    razonSocialConsentimientoUrg: keep('razonSocialConsentimientoUrg', facilityName),
    tituloConsentimientoUrg: keep(
      'tituloConsentimientoUrg',
      'Consentimiento informado',
    ),
    lugarFechaConsentimientoUrg: keep(
      'lugarFechaConsentimientoUrg',
      `${careLocation} · ${today}`,
    ),
    actoAutorizadoConsentimientoUrg: keep(
      'actoAutorizadoConsentimientoUrg',
      read(current.actoAutorizadoConsentimientoUrg),
    ),
    profesionalActoConsentimientoUrg: keep(
      'profesionalActoConsentimientoUrg',
      responsibleName,
    ),
    cedulaProfesionalActoConsentimientoUrg: keep(
      'cedulaProfesionalActoConsentimientoUrg',
      responsibleLicense,
    ),
    establecimientoAvisoMpUrg: keep('establecimientoAvisoMpUrg', facilityName),
    fechaAvisoMpUrg: keep('fechaAvisoMpUrg', today),
    medicoNotificaAvisoMpUrg: keep('medicoNotificaAvisoMpUrg', responsibleName),
    cedulaNotificaAvisoMpUrg: keep(
      'cedulaNotificaAvisoMpUrg',
      responsibleLicense,
    ),
    fechaCertificadoDefuncionUrg: keep('fechaCertificadoDefuncionUrg', today),
    horaCertificadoDefuncionUrg: keep('horaCertificadoDefuncionUrg', time),
    elaboraCertificadoDefuncionUrg: keep(
      'elaboraCertificadoDefuncionUrg',
      responsibleName,
    ),
    cedulaCertificadoDefuncionUrg: keep(
      'cedulaCertificadoDefuncionUrg',
      responsibleLicense,
    ),
    registroFechaHoraCertificadoDefuncionUrg: keep(
      'registroFechaHoraCertificadoDefuncionUrg',
      args.recordedAt,
    ),
    medicoResponsableEgresoUrg: responsibleName,
    cedulaResponsableEgresoUrg: responsibleLicense,
    especialidadResponsableEgresoUrg: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionEgresoUrg: careLocation,
    fechaHoraFirmaEgresoUrg: '',
    egresoLegalNombre:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    egresoLegalCedula:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    egresoLegalEspecialidad: args.detail.specialty?.name ?? 'Sin especialidad',
    egresoLegalLugar:
      careLocation,
  };
}

function buildHospitalAdmissionSnapshot(args: {
  detail: EncounterDetailResponse;
  emergencyDischargeRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const emergency = args.emergencyDischargeRecord?.formData ?? {};
  const read = (value: unknown) => (typeof value === 'string' ? value : '');
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (Array.isArray(currentValue)) {
      return currentValue.length > 0 ? currentValue : suggestion;
    }

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };

  return {
    tipoRegistro: 'Ingreso hospitalario',
    tipoIngresoHosp: keep(
      'tipoIngresoHosp',
      args.detail.admissionSource === 'EMERGENCY' ? 'URGENTE' : 'PROGRAMADO',
    ),
    origenIngresoHosp: keep(
      'origenIngresoHosp',
      args.detail.admissionSource === 'EMERGENCY' ? 'URGENCIAS' : 'MANUAL',
    ),
    servicioIngresoHosp: keep(
      'servicioIngresoHosp',
      args.detail.serviceArea?.name ?? args.detail.specialty?.name ?? '',
    ),
    fechaIngresoHosp: keep('fechaIngresoHosp', args.recordedAt.slice(0, 10)),
    horaIngresoHosp: keep('horaIngresoHosp', args.recordedAt.slice(11, 16)),
    episodioOrigenHosp: keep(
      'episodioOrigenHosp',
      args.detail.admissionSource === 'EMERGENCY' ? args.detail.encounterNumber : '',
    ),
    referenciaUrgenciasHosp: keep(
      'referenciaUrgenciasHosp',
      read(emergency.resumenTrasladoUrg) || read(emergency.evolucionEstanciaEgresoUrg),
    ),
    medicoAdscritoHosp: keep(
      'medicoAdscritoHosp',
      args.detail.attendingClinician?.fullName ?? '',
    ),
    grupoSanguineoRhHosp: keep(
      'grupoSanguineoRhHosp',
      args.detail.patient.bloodType ?? '',
    ),
    motivoIngresoClinicoHosp: keep(
      'motivoIngresoClinicoHosp',
      read(emergency.motivoIngresoEgresoUrg) || (args.detail.reasonForVisit ?? ''),
    ),
    historiaPadecimientoActualHosp: keep(
      'historiaPadecimientoActualHosp',
      read(emergency.evolucionEstanciaEgresoUrg),
    ),
    diagnosticoPrincipalHosp: keep(
      'diagnosticoPrincipalHosp',
      read(emergency.diagnosticoEgresoUrg) ||
        (args.detail.diagnoses[0]?.description ?? ''),
    ),
    cie10Hosp: keep(
      'cie10Hosp',
      read(emergency.cie10EgresoUrg) || (args.detail.diagnoses[0]?.code ?? ''),
    ),
    comorbilidadesHosp: keep(
      'comorbilidadesHosp',
      args.detail.problems.map((problem) => ({
        comorbilidad: problem.description,
        estado: problem.status === 'INACTIVE' ? 'INACTIVO' : 'ACTIVO',
      })),
    ),
    medicoIngresoLegal:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaIngresoLegal:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadIngresoLegal: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionIngresoLegal:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function buildHospitalEvolutionSnapshot(args: {
  detail: EncounterDetailResponse;
  admissionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  previousEvolutionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const previous = args.previousEvolutionRecord?.formData ?? {};
  const admission = args.admissionRecord?.formData ?? {};
  const read = (value: unknown) => (typeof value === 'string' ? value : '');
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (Array.isArray(currentValue)) {
      return currentValue.length > 0 ? currentValue : suggestion;
    }

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };
  const previousDiagnoses = normalizeObjectArrayField(
    previous.diagnosticosActivosEvolHosp,
  );
  const admissionDiagnoses: Array<Record<string, string>> = [];

  if (read(admission.diagnosticoPrincipalHosp)) {
    admissionDiagnoses.push({
      diagnostico: read(admission.diagnosticoPrincipalHosp),
      cie10: read(admission.cie10Hosp),
      estado: 'ACTIVO',
    });
  }

  admissionDiagnoses.push(
    ...normalizeObjectArrayField(admission.diagnosticosSecundariosHosp)
      .map((item) => ({
        diagnostico: read(item.diagnostico),
        cie10: read(item.cie10),
        estado: read(item.estado) || 'ACTIVO',
      }))
      .filter((item) => item.diagnostico.trim().length > 0),
  );
  const encounterDiagnoses = args.detail.diagnoses.map((diagnosis) => ({
    diagnostico: diagnosis.description,
    cie10: diagnosis.code ?? '',
    estado: 'ACTIVO',
    sourceDiagnosisId: diagnosis.id,
  }));
  const admissionDate = read(admission.fechaIngresoHosp);
  const admissionTime = read(admission.horaIngresoHosp);
  const admittedAt =
    admissionDate && admissionTime
      ? `${admissionDate}T${admissionTime}`
      : args.detail.openedAt.slice(0, 16);
  const responsibleSpecialty =
    [args.detail.specialty?.name, args.detail.serviceArea?.name]
      .filter(Boolean)
      .join(' — ') || 'Sin especialidad / guardia responsable';
  const stayDaySuggestion = calculateHospitalStayDay(admittedAt, args.recordedAt);
  const hasManualStayDay = current.diaEstanciaHospManual === 'SI';

  return {
    tipoRegistro: 'Evolución hospitalaria',
    fechaHoraEvolucionHosp: args.recordedAt,
    diaEstanciaHosp: hasManualStayDay
      ? keep('diaEstanciaHosp', stayDaySuggestion)
      : stayDaySuggestion,
    diaEstanciaHospManual: hasManualStayDay ? 'SI' : 'NO',
    estadoClinicoEvolHosp: keep('estadoClinicoEvolHosp', ''),
    turnoEvolHosp: keep('turnoEvolHosp', resolveHospitalShiftValue(args.recordedAt)),
    especialidadGuardiaEvolHosp: responsibleSpecialty,
    referenciaEvolucionPreviaHosp: formatHospitalEvolutionPreviousReference(
      args.previousEvolutionRecord,
    ),
    diagnosticosActivosEvolHosp: keep(
      'diagnosticosActivosEvolHosp',
      previousDiagnoses.length > 0
        ? previousDiagnoses
        : admissionDiagnoses.length > 0
          ? admissionDiagnoses
          : encounterDiagnoses,
    ),
    cambiosClinicosEvolHosp: keep(
      'cambiosClinicosEvolHosp',
      read(previous.interpretacionClinicaEvolHosp)
        ? `Evolución previa: ${read(previous.interpretacionClinicaEvolHosp)}`
        : '',
    ),
    referenciaIngresoHosp: keep(
      'referenciaIngresoHosp',
      read(admission.motivoIngresoClinicoHosp) ||
        read(admission.diagnosticoPrincipalHosp),
    ),
    medicoEvolHospLegal:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaEvolHospLegal:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadEvolHospLegal: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionEvolHospLegal:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function buildHospitalMedicalOrdersSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (Array.isArray(currentValue)) {
      return currentValue.length > 0 ? currentValue : suggestion;
    }

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };

  return {
    tipoRegistro: 'Indicaciones médicas',
    horaInicioIndicacionesHosp: keep(
      'horaInicioIndicacionesHosp',
      args.recordedAt.slice(11, 16),
    ),
    programacionSiguienteTurnoHosp: keep(
      'programacionSiguienteTurnoHosp',
      'Pendiente de programación por enfermería',
    ),
    usuarioEjecutorHosp: keep(
      'usuarioEjecutorHosp',
      'Pendiente de asignación por enfermería',
    ),
    medicoIndicacionesLegal:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaIndicacionesLegal:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadIndicacionesLegal:
      args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionIndicacionesLegal:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function buildHospitalConsultationSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };
  const priority =
    typeof current.prioridadInterHosp === 'string' ? current.prioridadInterHosp : '';
  const targetByPriority: Record<string, string> = {
    URGENTE: '60',
    PREFERENTE: '240',
    RUTINARIO: '1440',
  };

  return {
    tipoRegistro: 'Interconsultas',
    fechaSolicitudInterHosp: keep(
      'fechaSolicitudInterHosp',
      args.recordedAt.slice(0, 10),
    ),
    horaSolicitudInterHosp: keep(
      'horaSolicitudInterHosp',
      args.recordedAt.slice(11, 16),
    ),
    medicoSolicitanteInterHosp:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaSolicitanteInterHosp:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadSolicitanteInterHosp:
      args.detail.specialty?.name ?? 'Sin especialidad',
    servicioSolicitanteInterHosp: keep(
      'servicioSolicitanteInterHosp',
      args.detail.serviceArea?.name ?? args.detail.specialty?.name ?? '',
    ),
    tiempoObjetivoRespuestaInterHosp: keep(
      'tiempoObjetivoRespuestaInterHosp',
      targetByPriority[priority] ?? '1440',
    ),
    estatusInterconsultaHosp: keep(
      'estatusInterconsultaHosp',
      current.responseSignedAtInterHosp
        ? 'RESPONDIDA'
        : current.requestSignedAtInterHosp
          ? 'SOLICITADA'
          : 'BORRADOR',
    ),
    diagnosticoRelacionadoInterHosp: keep(
      'diagnosticoRelacionadoInterHosp',
      args.detail.diagnoses[0]?.description ?? '',
    ),
    cie10RelacionadoInterHosp: keep(
      'cie10RelacionadoInterHosp',
      args.detail.diagnoses[0]?.code ?? '',
    ),
    medicoInterLegal:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaInterLegal:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadInterLegal: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionInterLegal:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function buildHospitalSurgicalSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  noteType: string;
  nextVersion: number;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };
  const folio = keep(
    'folioDocumentoQuirurgico',
    `${args.detail.encounterNumber}-QX-${String(args.nextVersion).padStart(3, '0')}`,
  );
  const hashSeed = `${args.detail.encounterNumber}-${args.noteType}-${args.nextVersion}`;

  return {
    tipoRegistro: 'Procedimientos y cirugía',
    tipoSubdocumentoQuirurgico: args.noteType,
    folioDocumentoQuirurgico: folio,
    versionDocumentoQuirurgico: String(args.nextVersion),
    estadoDocumentoQuirurgico: keep('estadoDocumentoQuirurgico', 'BORRADOR'),
    progresoQuirurgicoGlobal: keep(
      'progresoQuirurgicoGlobal',
      'Procedimiento incompleto',
    ),
    hashDocumentoQuirurgico: keep(
      'hashDocumentoQuirurgico',
      hashSeed.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 32),
    ),
    selloDigitalQuirurgico: keep(
      'selloDigitalQuirurgico',
      `SELLO-${String(args.nextVersion).padStart(3, '0')}`,
    ),
    pacienteDocumentoQuirurgico: args.detail.patient.fullName,
    curpDocumentoQuirurgico: args.detail.patient.curp ?? 'CURP no registrada',
    expedienteDocumentoQuirurgico:
      args.detail.medicalRecord?.recordNumber ?? 'Expediente no configurado',
    folioEpisodioDocumentoQuirurgico: args.detail.encounterNumber,
    tipoEpisodioDocumentoQuirurgico: 'Hospitalización',
    servicioDocumentoQuirurgico:
      args.detail.serviceArea?.name ?? args.detail.specialty?.name ?? 'Servicio no configurado',
    medicoResponsableDocumentoQuirurgico:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    fechaHoraDocumentoQuirurgico: args.recordedAt,
    idDocumentoQuirurgico: folio,
    usuarioCreadorDocumentoQuirurgico:
      args.detail.attendingClinician?.fullName ?? 'Usuario no identificado',
    ipDocumentoQuirurgico: keep('ipDocumentoQuirurgico', 'IP no capturada'),
    medicoQuirLegal:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaQuirLegal:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadQuirLegal: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionQuirLegal:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function buildHospitalNursingSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  noteType: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };
  const intake = readNumericFormValue(current.ingresosMlEnfHosp);
  const output = readNumericFormValue(current.egresosMlEnfHosp);
  const balance = intake !== null || output !== null ? (intake ?? 0) - (output ?? 0) : '';
  const latestOrders = getLatestRecordByTab(
    args.detail.sectionRecords,
    'Indicaciones médicas',
  );
  const orderMedications =
    Array.isArray(latestOrders?.formData.medicamentosIndicacionesHosp)
      ? latestOrders.formData.medicamentosIndicacionesHosp
      : [];
  const existingMedications = Array.isArray(current.medicamentosMinistradosEnfHosp)
    ? current.medicamentosMinistradosEnfHosp
    : [];
  const suggestedMedications =
    existingMedications.length > 0
      ? existingMedications
      : orderMedications.map((item, index) => {
          const medication =
            item && typeof item === 'object' && !Array.isArray(item)
              ? (item as Record<string, RecordFieldValue>)
              : {};
          return {
            medicamento: String(medication.medicamento ?? ''),
            horaProgramada: args.recordedAt.slice(11, 16),
            horaAdministrada: '',
            estado: '',
            motivoNoAdministracion: '',
            enfermeria:
              args.detail.attendingClinician?.fullName ??
              'Sin profesional responsable',
            sourceMedicalOrderId: latestOrders?.id ?? '',
            sourceMedicationId: String(medication.id ?? `med-${index + 1}`),
          };
        });

  return {
    tipoRegistro: 'Enfermería',
    turnoEnfermeriaHosp: args.noteType,
    estadoTurnoEnfermeriaHosp: keep('estadoTurnoEnfermeriaHosp', 'BORRADOR'),
    balanceTotalEnfHosp: String(balance),
    medicamentosMinistradosEnfHosp: suggestedMedications,
    profesionalEnfermeriaLegal:
      args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    cedulaEnfermeriaLegal:
      args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    especialidadEnfermeriaLegal: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionEnfermeriaLegal:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

const hospitalDischargeConditionalFieldKeys = [
  'motivoAltaVoluntariaEgresoHosp',
  'riesgosExplicadosAltaVoluntariaEgresoHosp',
  'profesionalResponsableAltaVoluntariaEgresoHosp',
  'firmanteConformidadNombreEgresoHosp',
  'firmanteConformidadCalidadEgresoHosp',
  'firmanteConformidadRelacionEgresoHosp',
  'fechaHoraConformidadEgresoHosp',
  'confirmacionConformidadEgresoHosp',
  'unidadReceptoraEgresoHosp',
  'medicoReceptorEgresoHosp',
  'cedulaMedicoReceptorEgresoHosp',
  'servicioReceptorEgresoHosp',
  'medioTrasladoEgresoHosp',
  'horaDefuncionEgresoHosp',
  'causaDefuncionEgresoHosp',
  'certificadoDefuncionRelacionadoEgresoHosp',
  'horaUltimoContactoEgresoHosp',
  'circunstanciasAbandonoEgresoHosp',
  'profesionalDocumentaAbandonoEgresoHosp',
  'fechaHoraDocumentacionAbandonoEgresoHosp',
] as const;

const hospitalDischargeConditionalFieldKeysByType: Record<string, string[]> = {
  ALTA_MEDICA: [],
  ALTA_VOLUNTARIA: [
    'motivoAltaVoluntariaEgresoHosp',
    'riesgosExplicadosAltaVoluntariaEgresoHosp',
    'profesionalResponsableAltaVoluntariaEgresoHosp',
    'firmanteConformidadNombreEgresoHosp',
    'firmanteConformidadCalidadEgresoHosp',
    'firmanteConformidadRelacionEgresoHosp',
    'fechaHoraConformidadEgresoHosp',
    'confirmacionConformidadEgresoHosp',
  ],
  TRASLADO: [
    'unidadReceptoraEgresoHosp',
    'medicoReceptorEgresoHosp',
    'cedulaMedicoReceptorEgresoHosp',
    'servicioReceptorEgresoHosp',
    'medioTrasladoEgresoHosp',
  ],
  REFERENCIA: [
    'unidadReceptoraEgresoHosp',
    'medicoReceptorEgresoHosp',
    'cedulaMedicoReceptorEgresoHosp',
    'servicioReceptorEgresoHosp',
    'medioTrasladoEgresoHosp',
  ],
  DEFUNCION: [
    'horaDefuncionEgresoHosp',
    'causaDefuncionEgresoHosp',
    'certificadoDefuncionRelacionadoEgresoHosp',
  ],
  FUGA_ABANDONO: [
    'horaUltimoContactoEgresoHosp',
    'circunstanciasAbandonoEgresoHosp',
    'profesionalDocumentaAbandonoEgresoHosp',
    'fechaHoraDocumentacionAbandonoEgresoHosp',
  ],
};

function buildHospitalDischargeConditionalCleanup(
  dischargeType: string,
): Record<string, string> {
  const compatibleKeys =
    hospitalDischargeConditionalFieldKeysByType[dischargeType] ?? [];

  return Object.fromEntries(
    hospitalDischargeConditionalFieldKeys
      .filter((fieldKey) => !compatibleKeys.includes(fieldKey))
      .map((fieldKey) => [fieldKey, '']),
  );
}

function hasHospitalDischargeIncompatibleCapture(
  formData: Record<string, RecordFieldValue>,
  dischargeType: string,
) {
  const compatibleKeys =
    hospitalDischargeConditionalFieldKeysByType[dischargeType] ?? [];

  return hospitalDischargeConditionalFieldKeys
    .filter((fieldKey) => !compatibleKeys.includes(fieldKey))
    .some((fieldKey) => {
      const value = formData[fieldKey];
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
    });
}

function buildHospitalDischargeSnapshot(args: {
  detail: EncounterDetailResponse;
  recordedAt: string;
  currentFormData?: Record<string, RecordFieldValue>;
}) {
  const current = args.currentFormData ?? {};
  const keep = (fieldKey: string, suggestion: RecordFieldValue): RecordFieldValue => {
    const currentValue = current[fieldKey];

    if (typeof currentValue === 'string') {
      return currentValue.trim().length > 0 ? currentValue : suggestion;
    }

    return currentValue ?? suggestion;
  };
  const admission = getLatestRecordByTab(args.detail.sectionRecords, 'Ingreso');
  const evolution = getLatestRecordByTab(args.detail.sectionRecords, 'Evolución');
  const orders = getLatestRecordByTab(args.detail.sectionRecords, 'Indicaciones médicas');
  const procedure = getLatestRecordByTab(
    args.detail.sectionRecords,
    'Procedimientos / Cirugía',
  );
  const read = (record: typeof admission, fieldKey: string) => {
    const value = record?.formData[fieldKey];
    return typeof value === 'string' ? value : '';
  };
  const admissionDate = [
    read(admission, 'fechaIngresoHosp'),
    read(admission, 'horaIngresoHosp'),
  ]
    .filter(Boolean)
    .join('T');
  const stayDays = (() => {
    const admittedAt = admissionDate ? new Date(admissionDate) : null;
    const dischargedAt = new Date(args.recordedAt);
    if (!admittedAt || Number.isNaN(admittedAt.getTime())) return '';
    return String(
      Math.max(
        1,
        Math.ceil((dischargedAt.getTime() - admittedAt.getTime()) / 86_400_000),
      ),
    );
  })();
  const dischargeType =
    typeof current.tipoEgresoHosp === 'string' ? current.tipoEgresoHosp : '';
  const legalProfessional =
    args.detail.attendingClinician?.fullName ?? 'Sin profesional responsable';
  const legalLicense = args.detail.attendingClinician?.professionalLicense ?? 'Sin cédula';

  return {
    tipoRegistro: 'Egreso',
    ...buildHospitalDischargeConditionalCleanup(dischargeType),
    fechaHoraEgresoHosp: keep('fechaHoraEgresoHosp', args.recordedAt),
    fechaIngresoReadonlyHosp: keep('fechaIngresoReadonlyHosp', admissionDate),
    diasEstanciaHosp: stayDays,
    alertaCierreEgresoHosp:
      'Al firmar esta nota de egreso, el episodio se cerrará y el expediente quedará en modo solo lectura.',
    motivoIngresoEgresoHosp: keep(
      'motivoIngresoEgresoHosp',
      read(admission, 'motivoIngresoClinicoHosp') || args.detail.reasonForVisit || '',
    ),
    diagnosticoIngresoEgresoHosp: keep(
      'diagnosticoIngresoEgresoHosp',
      read(admission, 'diagnosticoPrincipalHosp'),
    ),
    diagnosticoFinalEgresoHosp: keep(
      'diagnosticoFinalEgresoHosp',
      read(admission, 'diagnosticoPrincipalHosp') ||
        args.detail.diagnoses[0]?.description ||
        '',
    ),
    cie10EgresoHosp: keep(
      'cie10EgresoHosp',
      read(admission, 'cie10Hosp') || args.detail.diagnoses[0]?.code || '',
    ),
    procedimientosRealizadosEstanciaHosp: keep(
      'procedimientosRealizadosEstanciaHosp',
      read(procedure, 'procedimientoRealizadoPostopHosp') ||
        read(admission, 'procedimientosPlanHosp'),
    ),
    manejoRealizadoEgresoHosp: keep(
      'manejoRealizadoEgresoHosp',
      read(orders, 'planAdicionalIndicacionesHosp') ||
        read(admission, 'medicamentosPlanHosp'),
    ),
    evolucionEstanciaEgresoHosp: keep(
      'evolucionEstanciaEgresoHosp',
      read(evolution, 'interpretacionClinicaEvolHosp') ||
        read(evolution, 'justificacionNom004EvolHosp'),
    ),
    medicamentosEgresoHosp: keep(
      'medicamentosEgresoHosp',
      read(orders, 'medicamentosIndicacionesHosp'),
    ),
    dietaEgresoHosp: keep(
      'dietaEgresoHosp',
      read(orders, 'dietaIndicacionesHosp') || read(admission, 'dietaInicialHosp'),
    ),
    actividadRestriccionesEgresoHosp: keep(
      'actividadRestriccionesEgresoHosp',
      read(orders, 'reposoActividadIndicacionesHosp'),
    ),
    seguimientoEgresoHosp: keep(
      'seguimientoEgresoHosp',
      read(evolution, 'seguimientoEvolHosp'),
    ),
    signosAlarmaEgresoHosp: keep(
      'signosAlarmaEgresoHosp',
      'Acudir a urgencias ante fiebre persistente, dolor intenso, dificultad respiratoria, sangrado, deterioro neurológico o empeoramiento del estado general.',
    ),
    educacionOtorgadaEgresoHosp: keep(
      'educacionOtorgadaEgresoHosp',
      'Se explica diagnóstico, tratamiento, medicamentos, cuidados, restricciones, signos de alarma y seguimiento.',
    ),
    comprensionPacienteEgresoHosp: keep('comprensionPacienteEgresoHosp', 'ADECUADA'),
    profesionalResponsableAltaVoluntariaEgresoHosp:
      dischargeType === 'ALTA_VOLUNTARIA' ? legalProfessional : '',
    profesionalDocumentaAbandonoEgresoHosp:
      dischargeType === 'FUGA_ABANDONO' ? legalProfessional : '',
    fechaHoraDocumentacionAbandonoEgresoHosp:
      dischargeType === 'FUGA_ABANDONO'
        ? keep('fechaHoraDocumentacionAbandonoEgresoHosp', args.recordedAt)
        : '',
    medicoResponsableEgresoHosp: legalProfessional,
    cedulaResponsableEgresoHosp: legalLicense,
    medicoLegalEgresoHosp: legalProfessional,
    cedulaLegalEgresoHosp: legalLicense,
    especialidadLegalEgresoHosp: args.detail.specialty?.name ?? 'Sin especialidad',
    lugarAtencionEgresoHosp:
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') || 'Lugar no configurado',
  };
}

function getConsultationTypeLabel(
  consultationType: string | null | undefined,
) {
  if (consultationType === 'PRIMERA_VEZ') {
    return 'Primera vez';
  }

  if (consultationType === 'SUBSECUENTE') {
    return 'Subsecuente';
  }

  return 'Sin clasificar';
}

function buildConsultationReferenceSnapshot(detail: EncounterDetailResponse) {
  const historyRecord = getLatestHistoryRecord(
    detail.sectionRecords.filter((record) => record.tabKey === 'Historia clínica'),
  );
  const historyFormData = (historyRecord?.formData ?? {}) as Record<string, unknown>;
  const medicationList = Array.isArray(historyFormData.medicacionCronicaActual)
    ? historyFormData.medicacionCronicaActual
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) =>
          [
            typeof item.medicamento === 'string' ? item.medicamento : '',
            typeof item.via === 'string' ? item.via : '',
            typeof item.frecuencia === 'string' ? item.frecuencia : '',
          ]
            .filter(Boolean)
            .join(' · '),
        )
        .filter(Boolean)
        .join('\n')
    : '';

  return {
    referenciaAlergiasCriticas:
      (typeof historyFormData.appAlergias === 'string' && historyFormData.appAlergias) ||
      detail.patient.allergiesSummary.join(', ') ||
      'Sin alergias críticas registradas',
    referenciaCronicos:
      (typeof historyFormData.appEnfermedadesCronicas === 'string' &&
        historyFormData.appEnfermedadesCronicas) ||
      'Sin enfermedades crónicas registradas',
    referenciaMedicacionCronica:
      medicationList || 'Sin medicación crónica registrada',
    consultaResultadosPreviosResumen:
      (typeof historyFormData.resultadosPreviosResumen === 'string' &&
        historyFormData.resultadosPreviosResumen) ||
      '',
  };
}

function buildConsultationLegalSnapshot(detail: EncounterDetailResponse) {
  return {
    consultaLegalMedico:
      detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    consultaLegalCedula:
      detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    consultaLegalEspecialidad: detail.specialty?.name ?? 'Sin especialidad',
  };
}

function mergeConsultationSystemFields(
  formData: Record<string, RecordFieldValue>,
  detail: EncounterDetailResponse,
) {
  return {
    ...formData,
    ...buildConsultationReferenceSnapshot(detail),
    ...buildConsultationLegalSnapshot(detail),
  };
}

function buildEvolutionLegalSnapshot(detail: EncounterDetailResponse) {
  return {
    evolucionLegalMedico:
      detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
    evolucionLegalCedula:
      detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    evolucionLegalEspecialidad: detail.specialty?.name ?? 'Sin especialidad',
  };
}

function buildEvolutionDiagnosesBaseline(
  previousEvolutionRecord?: EncounterDetailResponse['sectionRecords'][number] | null,
  latestConsultationRecord?: EncounterDetailResponse['sectionRecords'][number] | null,
) {
  const previousDiagnoses = Array.isArray(previousEvolutionRecord?.formData.evolucionDiagnosticos)
    ? (previousEvolutionRecord?.formData.evolucionDiagnosticos as Array<Record<string, unknown>>)
    : [];

  if (previousDiagnoses.length > 0) {
    return previousDiagnoses.map((diagnosis) => ({ ...diagnosis }));
  }

  const consultationDiagnoses: Array<Record<string, unknown>> = [];

  if (latestConsultationRecord?.formData.idDiagnosticoPrincipal) {
    consultationDiagnoses.push({
      diagnostico: latestConsultationRecord.formData.idDiagnosticoPrincipal,
      cie10: latestConsultationRecord.formData.idCie10 ?? '',
      estado: latestConsultationRecord.formData.idEstado ?? '',
    });
  }

  if (Array.isArray(latestConsultationRecord?.formData.idSecundarios)) {
    consultationDiagnoses.push(
      ...(latestConsultationRecord?.formData.idSecundarios as Array<Record<string, unknown>>).map(
        (diagnosis) => ({
          diagnostico: diagnosis.diagnostico ?? '',
          cie10: diagnosis.cie10 ?? '',
          estado: diagnosis.estado ?? '',
        }),
      ),
    );
  }

  return consultationDiagnoses;
}

function mergeEvolutionSystemFields(
  formData: Record<string, RecordFieldValue>,
  detail: EncounterDetailResponse,
  previousEvolutionRecord?: EncounterDetailResponse['sectionRecords'][number] | null,
) {
  return {
    ...formData,
    evolucionPreviaTitulo:
      previousEvolutionRecord?.title ?? 'Sin evolución previa registrada',
    evolucionPreviaEstado:
      (previousEvolutionRecord?.formData.evolucionEstadoClinicoGeneral as string | undefined) ??
      'Sin estado previo',
    ...buildEvolutionLegalSnapshot(detail),
  };
}

function buildPrescriptionFolio(
  encounterNumber: string,
  versionNumber: number,
) {
  return `${encounterNumber}-RB${String(versionNumber).padStart(2, '0')}`;
}

function buildPrescriptionLegalSnapshot(detail: EncounterDetailResponse) {
  return {
    recetaInstitucionEmisora:
      detail.legalContext.facilityInstitutionName ??
      detail.legalContext.facilityLegalName ??
      detail.legalContext.tenantLegalName ??
      detail.legalContext.tenantName ??
      detail.facility?.name ??
      '',
    recetaRfcMedico:
      detail.legalContext.tenantTaxId ??
      '',
    recetaLicenciaSanitaria:
      detail.legalContext.facilityLegalName ??
      '',
    recetaNombreProfesional:
      detail.attendingClinician?.fullName ?? '',
    recetaCedulaProfesional:
      detail.attendingClinician?.professionalLicense ?? '',
    recetaEspecialidadProfesional:
      detail.specialty?.name ?? '',
    recetaLugarAtencion:
      [detail.facility?.name, detail.serviceArea?.name].filter(Boolean).join(' · ') || '',
  };
}

function getLatestClinicalLegalFallback(detail: EncounterDetailResponse) {
  const candidateRecords = [...detail.sectionRecords]
    .filter((record) =>
      ['Historia clínica', 'Consulta actual', 'Evolución'].includes(record.tabKey),
    )
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));

  const firstNonEmptyRecordField = (fieldKeys: string[]) => {
    for (const record of candidateRecords) {
      for (const fieldKey of fieldKeys) {
        const value = record.formData[fieldKey];

        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
    }

    return '';
  };

  const latestAuthor = candidateRecords.find(
    (record) =>
      (record.authorName && record.authorName.trim().length > 0) ||
      (record.authorLicense && record.authorLicense.trim().length > 0),
  );

  return {
    professionalName:
      firstNonEmptyRecordField([
        'evolucionLegalMedico',
        'consultaLegalMedico',
        'legalMedico',
      ]) || latestAuthor?.authorName || '',
    professionalLicense:
      firstNonEmptyRecordField([
        'evolucionLegalCedula',
        'consultaLegalCedula',
        'legalCedula',
      ]) || latestAuthor?.authorLicense || '',
    specialty:
      firstNonEmptyRecordField([
        'evolucionLegalEspecialidad',
        'consultaLegalEspecialidad',
        'legalEspecialidad',
      ]) || '',
    place:
      firstNonEmptyRecordField(['evolucionLugar']) || '',
  };
}

function buildPrescriptionLegalSnapshotWithFallback(args: {
  detail: EncounterDetailResponse;
  sessionUser?: {
    id: string;
    fullName: string;
    professionalLicense: string | null;
    tenant: {
      name: string;
    };
    facility: {
      id: string;
      name: string;
    } | null;
  } | null;
  encounterMeta?: {
    facilities: Array<{
      id: string;
      code: string;
      name: string;
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
  } | null;
}) {
  const baseSnapshot = buildPrescriptionLegalSnapshot(args.detail);
  const latestClinicalFallback = getLatestClinicalLegalFallback(args.detail);
  const episodeFacility =
    args.encounterMeta?.facilities.find(
      (facility) => facility.id === args.detail.facility?.id,
    ) ?? null;
  const responsibleClinician =
    (args.detail.attendingClinician?.id
      ? args.encounterMeta?.clinicians.find(
          (clinician) => clinician.id === args.detail.attendingClinician?.id,
        )
      : null) ?? null;
  const specialtyName =
    args.detail.specialty?.name ??
    args.encounterMeta?.specialties.find(
      (specialty) => specialty.id === args.detail.specialty?.id,
    )?.name ??
    '';

  return {
    recetaInstitucionEmisora:
      baseSnapshot.recetaInstitucionEmisora ||
      episodeFacility?.name ||
      args.sessionUser?.facility?.name ||
      args.sessionUser?.tenant.name ||
      'Sin dato disponible',
    recetaRfcMedico:
      baseSnapshot.recetaRfcMedico || 'Sin dato disponible',
    recetaLicenciaSanitaria:
      baseSnapshot.recetaLicenciaSanitaria ||
      episodeFacility?.code ||
      'Sin dato disponible',
    recetaNombreProfesional:
      baseSnapshot.recetaNombreProfesional ||
      latestClinicalFallback.professionalName ||
      responsibleClinician?.fullName ||
      args.sessionUser?.fullName ||
      'Sin dato disponible',
    recetaCedulaProfesional:
      baseSnapshot.recetaCedulaProfesional ||
      latestClinicalFallback.professionalLicense ||
      responsibleClinician?.professionalLicense ||
      args.sessionUser?.professionalLicense ||
      'Sin dato disponible',
    recetaEspecialidadProfesional:
      baseSnapshot.recetaEspecialidadProfesional ||
      latestClinicalFallback.specialty ||
      specialtyName ||
      'Sin dato disponible',
    recetaLugarAtencion:
      baseSnapshot.recetaLugarAtencion ||
      latestClinicalFallback.place ||
      [args.detail.facility?.name, args.detail.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') ||
      args.sessionUser?.facility?.name ||
      'Sin dato disponible',
  };
}

function buildDocumentLegalSnapshot(
  detail: EncounterDetailResponse,
  sessionUser?: {
    id: string;
    fullName: string;
    professionalLicense: string | null;
    tenant: {
      name: string;
    };
    facility: {
      id: string;
      name: string;
    } | null;
  } | null,
  encounterMeta?: {
    facilities: Array<{
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
  } | null,
) {
  const clinicalFallback = getLatestClinicalLegalFallback(detail);
  const responsibleClinician =
    (detail.attendingClinician?.id
      ? encounterMeta?.clinicians.find(
          (clinician) => clinician.id === detail.attendingClinician?.id,
        )
      : null) ?? null;
  const facilityMeta =
    encounterMeta?.facilities.find((facility) => facility.id === detail.facility?.id) ??
    null;

  return {
    documentoPacienteNombre: detail.patient.fullName,
    documentoPacienteCurp: detail.patient.curp ?? '',
    documentoExpediente: detail.medicalRecord.recordNumber,
    documentoFolioEpisodio: detail.encounterNumber,
    documentoTipoEpisodio:
      detail.encounterType === 'HOSPITALIZATION'
        ? 'Hospitalización'
        : detail.encounterType === 'SURGERY'
          ? 'Procedimiento ambulatorio'
        : detail.encounterType,
    documentoInstitucionEmisora:
      detail.legalContext.facilityInstitutionName ??
      detail.legalContext.facilityLegalName ??
      detail.legalContext.tenantLegalName ??
      detail.legalContext.tenantName ??
      detail.facility?.name ??
      sessionUser?.facility?.name ??
      sessionUser?.tenant.name ??
      '',
    documentoRfcMedico: detail.legalContext.tenantTaxId ?? '',
    documentoLicenciaSanitaria:
      detail.legalContext.facilityLegalName ??
      facilityMeta?.code ??
      '',
    documentoCodigoVerificacion: 'Se generará al guardar',
    documentoHash: 'Se generará al guardar',
    documentoSelloDigital: 'Se generará al guardar',
    documentoNombreProfesional:
      detail.attendingClinician?.fullName ??
      clinicalFallback.professionalName ??
      responsibleClinician?.fullName ??
      sessionUser?.fullName ??
      '',
    documentoCedulaProfesional:
      detail.attendingClinician?.professionalLicense ??
      clinicalFallback.professionalLicense ??
      responsibleClinician?.professionalLicense ??
      sessionUser?.professionalLicense ??
      '',
    documentoEspecialidadProfesional:
      detail.specialty?.name ??
      clinicalFallback.specialty ??
      '',
    documentoLugarAtencion:
      [detail.facility?.name, detail.serviceArea?.name].filter(Boolean).join(' · ') ||
      clinicalFallback.place ||
      sessionUser?.facility?.name ||
      '',
  };
}

function buildDocumentSuggestionSnapshot(
  detail: EncounterDetailResponse,
  noteType: string,
): Record<string, RecordFieldValue> {
  if (detail.encounterType === 'HOSPITALIZATION') {
    return buildHospitalDocumentSuggestionSnapshot(detail, noteType);
  }

  if (detail.encounterType === 'SURGERY') {
    const latestPreprocedure = getLatestRecordByTab(
      detail.sectionRecords,
      'Valoración preprocedimiento',
    );
    const latestProcedure = getLatestRecordByTab(detail.sectionRecords, 'Procedimiento');
    const latestRecovery =
      getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evaluación') ??
      getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evolución');
    const latestDischarge = getLatestRecordByTab(detail.sectionRecords, 'Egreso');
    const diagnosis =
      (latestDischarge?.formData.diagnosticoFinalEgresoAmb as string | undefined) ??
      (latestProcedure?.formData.diagnosticoPostoperatorioProc as string | undefined) ??
      (latestPreprocedure?.formData.diagnosticoPreoperatorioPreproc as string | undefined) ??
      '';
    const cie10 =
      (latestDischarge?.formData.cie10EgresoAmb as string | undefined) ??
      (latestProcedure?.formData.cie10PostoperatorioProc as string | undefined) ??
      (latestPreprocedure?.formData.cie10Preproc as string | undefined) ??
      '';
    const procedure =
      (latestProcedure?.formData.procedimientoRealizadoProc as string | undefined) ??
      (latestPreprocedure?.formData.procedimientoIndicadoPreproc as string | undefined) ??
      '';
    const recoverySummary =
      (latestRecovery?.formData.exploracionPostprocedimientoRecEval as string | undefined) ??
      (latestRecovery?.formData.planVigilanciaRecEval as string | undefined) ??
      '';

    if (noteType === 'Solicitud de laboratorio' || noteType === 'Solicitud de imagenología') {
      return {
        documentoDiagnosticoPrincipal: diagnosis,
        documentoDiagnosticoCie10: cie10,
      };
    }

    if (noteType === 'Referencia / contrarreferencia') {
      return {
        documentoDiagnosticoPrincipal: diagnosis,
        documentoProcedimientoRealizado: procedure,
        documentoEvolucionBreve: recoverySummary,
        documentoTratamientoActual:
          (latestDischarge?.formData.planEgresoVinculadoRecetaAmb as string | undefined) ??
          '',
      };
    }

    if (noteType === 'Consentimiento informado') {
      return {
        documentoProcedimientoNombre: procedure,
        documentoTipoAnestesia:
          (latestProcedure?.formData.tipoAnestesiaProc as string | undefined) ??
          (latestPreprocedure?.formData.tipoAnestesiaPrevistaPreproc as string | undefined) ??
          '',
        documentoRiesgos:
          (latestPreprocedure?.formData.riesgosInformadosPreproc as string | undefined) ??
          '',
        documentoBeneficios:
          (latestPreprocedure?.formData.beneficiosEsperadosPreproc as string | undefined) ??
          '',
      };
    }

    if (noteType === 'Certificado / constancia') {
      return {
        documentoDiagnosticoPrincipal: diagnosis,
        documentoTextoConstancia: procedure
          ? `Se realizó procedimiento ambulatorio: ${procedure}.`
          : '',
      };
    }

    return {};
  }

  const latestConsultationRecord =
    [...detail.sectionRecords]
      .filter((record) => record.tabKey === 'Consulta actual')
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;
  const latestEvolutionRecord =
    [...detail.sectionRecords]
      .filter((record) => record.tabKey === 'Evolución')
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;
  const latestPrescriptionRecord =
    [...detail.sectionRecords]
      .filter((record) => record.tabKey === 'Receta / Indicaciones')
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;
  const evolutionPrimaryDiagnosis =
    Array.isArray(latestEvolutionRecord?.formData.evolucionDiagnosticos)
      ? ((latestEvolutionRecord?.formData.evolucionDiagnosticos as Array<Record<string, unknown>>)
          .find((item) => typeof item.diagnostico === 'string' && item.diagnostico) ??
          null)
      : null;
  const evolutionPrimaryCode =
    Array.isArray(latestEvolutionRecord?.formData.evolucionDiagnosticos)
      ? ((latestEvolutionRecord?.formData.evolucionDiagnosticos as Array<Record<string, unknown>>)
          .find((item) => typeof item.cie10 === 'string' && item.cie10) ??
          null)
      : null;
  const primaryDiagnosis =
    (typeof latestConsultationRecord?.formData.idDiagnosticoPrincipal === 'string'
      ? latestConsultationRecord.formData.idDiagnosticoPrincipal
      : '') ||
    (typeof evolutionPrimaryDiagnosis?.diagnostico === 'string'
      ? evolutionPrimaryDiagnosis.diagnostico
      : '') ||
    '';
  const primaryDiagnosisCode =
    (typeof latestConsultationRecord?.formData.idCie10 === 'string'
      ? latestConsultationRecord.formData.idCie10
      : '') ||
    (typeof evolutionPrimaryCode?.cie10 === 'string'
      ? evolutionPrimaryCode.cie10
      : '') ||
    '';
  const secondaryDiagnoses = Array.isArray(latestConsultationRecord?.formData.idSecundarios)
    ? (latestConsultationRecord?.formData.idSecundarios as Array<Record<string, unknown>>).map(
        (item) => ({
          diagnostico: typeof item.diagnostico === 'string' ? item.diagnostico : '',
          cie10: typeof item.cie10 === 'string' ? item.cie10 : '',
          estado: typeof item.estado === 'string' ? item.estado : '',
        }),
      )
    : [];
  const treatmentSummary =
    (typeof latestPrescriptionRecord?.formData.recetaIndicacionesGenerales === 'string'
      ? latestPrescriptionRecord.formData.recetaIndicacionesGenerales
      : '') ||
    (typeof latestEvolutionRecord?.formData.evolucionTratamiento === 'string'
      ? latestEvolutionRecord.formData.evolucionTratamiento
      : '') ||
    (typeof latestConsultationRecord?.formData.planTratamientoFarmacologico === 'string'
      ? latestConsultationRecord.formData.planTratamientoFarmacologico
      : '');
  const studiesSummary =
    (typeof latestConsultationRecord?.formData.consultaResultadosPreviosResumen === 'string'
      ? latestConsultationRecord.formData.consultaResultadosPreviosResumen
      : '') ||
    (typeof latestEvolutionRecord?.formData.evolucionResultadosRecientes === 'string'
      ? latestEvolutionRecord.formData.evolucionResultadosRecientes
      : '');
  const nextFollowUp =
    (typeof latestPrescriptionRecord?.formData.recetaSeguimientoFecha === 'string'
      ? latestPrescriptionRecord.formData.recetaSeguimientoFecha
      : '') ||
    (typeof latestConsultationRecord?.formData.planSeguimiento === 'string'
      ? latestConsultationRecord.formData.planSeguimiento
      : '') ||
    (typeof latestEvolutionRecord?.formData.evolucionSeguimiento === 'string'
      ? latestEvolutionRecord.formData.evolucionSeguimiento
      : '');

  if (noteType === 'Solicitud de laboratorio') {
    return {
      documentoDiagnosticoPrincipal: primaryDiagnosis,
      documentoDiagnosticoCie10: primaryDiagnosisCode,
    };
  }

  if (noteType === 'Solicitud de imagenología') {
    return {
      documentoDiagnosticoPrincipal: primaryDiagnosis,
      documentoDiagnosticoCie10: primaryDiagnosisCode,
    };
  }

  if (noteType === 'Referencia / contrarreferencia') {
    return {
      documentoResumenClinico:
        (typeof latestConsultationRecord?.formData.paDescripcion === 'string'
          ? latestConsultationRecord.formData.paDescripcion
          : '') ||
        (typeof latestEvolutionRecord?.formData.evolucionSubjetivo === 'string'
          ? latestEvolutionRecord.formData.evolucionSubjetivo
          : ''),
      documentoDiagnosticos: secondaryDiagnoses.length
        ? secondaryDiagnoses
        : primaryDiagnosis || primaryDiagnosisCode
          ? [{ diagnostico: primaryDiagnosis, cie10: primaryDiagnosisCode }]
          : [],
      documentoTratamientoActual: treatmentSummary,
      documentoEstudiosRealizados: studiesSummary,
    };
  }

  if (noteType === 'Consentimiento informado') {
    return {
      documentoNombreTutor: detail.patient.fullName,
    };
  }

  if (noteType === 'Certificado / constancia') {
    return {
      documentoDiagnosticoPrincipal: primaryDiagnosis,
      documentoDiagnosticoCie10: primaryDiagnosisCode,
    };
  }

  if (noteType === 'Nota de cierre') {
    return {
      documentoResumenClinicoFinal:
        (typeof latestEvolutionRecord?.formData.evolucionAnalisisComparativo === 'string'
          ? latestEvolutionRecord.formData.evolucionAnalisisComparativo
          : '') ||
        (typeof latestConsultationRecord?.formData.paDescripcion === 'string'
          ? latestConsultationRecord.formData.paDescripcion
          : ''),
      documentoDiagnosticos: secondaryDiagnoses.length
        ? secondaryDiagnoses
        : primaryDiagnosis || primaryDiagnosisCode
          ? [
              {
                diagnostico: primaryDiagnosis,
                cie10: primaryDiagnosisCode,
                estado:
                  (latestConsultationRecord?.formData.idEstado as string | undefined) ?? '',
              },
            ]
          : [],
      documentoIndicacionesEgreso:
        (typeof latestPrescriptionRecord?.formData.recetaIndicacionesGenerales === 'string'
          ? latestPrescriptionRecord.formData.recetaIndicacionesGenerales
          : '') ||
        treatmentSummary,
      documentoPlanSeguimiento: nextFollowUp,
    };
  }

  return {};
}

function mergeDocumentSystemFields(
  formData: Record<string, RecordFieldValue>,
  detail: EncounterDetailResponse,
  noteType: string,
  options?: {
    sessionUser?: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
      tenant: {
        name: string;
      };
      facility: {
        id: string;
        name: string;
      } | null;
    } | null;
    encounterMeta?: {
      facilities: Array<{
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
    } | null;
  },
) {
  return {
    ...buildDocumentSuggestionSnapshot(detail, noteType),
    ...formData,
    ...buildDocumentLegalSnapshot(
      detail,
      options?.sessionUser ?? null,
      options?.encounterMeta ?? null,
    ),
  };
}

function buildDocumentVersionTitle(noteType: string, versionNumber: number) {
  return `${noteType} V${versionNumber}`;
}

function buildHospitalDocumentSuggestionSnapshot(
  detail: EncounterDetailResponse,
  noteType: string,
): Record<string, RecordFieldValue> {
  const latestAdmission = getLatestRecordByTab(detail.sectionRecords, 'Ingreso');
  const latestEvolution = getLatestRecordByTab(detail.sectionRecords, 'Evolución');
  const latestOrders = getLatestRecordByTab(detail.sectionRecords, 'Indicaciones médicas');
  const latestSurgical = getLatestRecordByTab(
    detail.sectionRecords,
    'Procedimientos / Cirugía',
  );
  const latestDischarge = getLatestRecordByTab(detail.sectionRecords, 'Egreso');
  const diagnosis =
    (latestDischarge?.formData.diagnosticoFinalEgresoHosp as string | undefined) ??
    (latestEvolution?.formData.diagnosticoPrincipalEvolHosp as string | undefined) ??
    (latestAdmission?.formData.diagnosticoPrincipalHosp as string | undefined) ??
    '';
  const cie10 =
    (latestDischarge?.formData.cie10EgresoHosp as string | undefined) ??
    (latestEvolution?.formData.cie10EvolHosp as string | undefined) ??
    (latestAdmission?.formData.cie10Hosp as string | undefined) ??
    '';

  if (noteType === 'Solicitud de laboratorio') {
    return {
      documentoServicioSolicitud:
        (latestAdmission?.formData.servicioIngresoHosp as string | undefined) ?? '',
      documentoDiagnosticoPrincipal: diagnosis,
      documentoDiagnosticoCie10: cie10,
    };
  }

  if (noteType === 'Solicitud de imagenología') {
    return {
      documentoServicioSolicitud:
        (latestAdmission?.formData.servicioIngresoHosp as string | undefined) ?? '',
      documentoDiagnosticoPrincipal: diagnosis,
      documentoDiagnosticoCie10: cie10,
    };
  }

  if (noteType === 'Consentimiento informado') {
    return {
      documentoProcedimientoNombre:
        (latestSurgical?.formData.cirugiaPropuestaQuirHosp as string | undefined) ??
        (latestSurgical?.formData.procedimientoRealizadoPostopHosp as string | undefined) ??
        '',
      documentoNombrePacienteConsentimiento: detail.patient.fullName,
    };
  }

  if (noteType === 'Resumen clínico') {
    return {
      documentoMotivoAtencion:
        (latestAdmission?.formData.motivoIngresoClinicoHosp as string | undefined) ?? '',
      documentoDiagnosticosIniciales:
        (latestAdmission?.formData.diagnosticoPrincipalHosp as string | undefined) ??
        diagnosis,
      documentoDiagnosticosFinales:
        (latestDischarge?.formData.diagnosticoFinalEgresoHosp as string | undefined) ??
        diagnosis,
      documentoEvolucion:
        (latestDischarge?.formData.evolucionEstanciaEgresoHosp as string | undefined) ??
        (latestEvolution?.formData.interpretacionClinicaEvolHosp as string | undefined) ??
        '',
      documentoTratamientos:
        (latestDischarge?.formData.manejoRealizadoEgresoHosp as string | undefined) ??
        '',
      documentoPlan:
        (latestDischarge?.formData.seguimientoEgresoHosp as string | undefined) ??
        (latestEvolution?.formData.seguimientoEvolHosp as string | undefined) ??
        '',
    };
  }

  if (noteType === 'Referencia / traslado') {
    return {
      documentoUnidadOrigen:
        (latestAdmission?.formData.servicioIngresoHosp as string | undefined) ?? '',
      documentoResumenClinicoBreve:
        (latestDischarge?.formData.resumenNarrativoEgresoHosp as string | undefined) ??
        (latestEvolution?.formData.interpretacionClinicaEvolHosp as string | undefined) ??
        '',
      documentoManejoPrevio:
        (latestDischarge?.formData.manejoRealizadoEgresoHosp as string | undefined) ??
        '',
    };
  }

  if (noteType === 'Defunción') {
    return {
      documentoDatosPacienteDefuncion: `${detail.patient.fullName} · Exp. ${detail.medicalRecord.recordNumber}`,
    };
  }

  return {};
}

function buildDocumentVersionPrefill(args: {
  noteType: string;
  detail: EncounterDetailResponse;
  nextVersionNumber: number;
  sessionUser?: {
    id: string;
    fullName: string;
    professionalLicense: string | null;
    tenant: {
      name: string;
    };
    facility: {
      id: string;
      name: string;
    } | null;
  } | null;
  encounterMeta?: {
    facilities: Array<{
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
  } | null;
}) {
  const tabDefinition =
    args.detail.encounterType === 'SURGERY'
      ? getAmbulatoryProcedureDocumentTabDefinition(args.noteType)
      : args.detail.encounterType === 'HOSPITALIZATION'
      ? getHospitalDocumentTabDefinition(args.noteType)
      : getConsultationDocumentTabDefinition(args.noteType);
  const nextFormData = normalizeRecordFormData(tabDefinition, undefined);

  return mergeDocumentSystemFields(
    {
      ...nextFormData,
      ...buildDocumentSuggestionSnapshot(args.detail, args.noteType),
      documentoCodigoVerificacion: 'Se generará al guardar',
    },
    args.detail,
    args.noteType,
    {
      sessionUser: args.sessionUser ?? null,
      encounterMeta: args.encounterMeta ?? null,
    },
  );
}

function readDiagnosesArrayFromUnknown(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    )
    .map((item) => ({
      diagnostico: typeof item.diagnostico === 'string' ? item.diagnostico : '',
      cie10: typeof item.cie10 === 'string' ? item.cie10 : '',
      estado:
        typeof item.estado === 'string'
          ? item.estado
          : typeof item.tipo === 'string'
            ? item.tipo
            : '',
    }))
    .filter((item) => item.diagnostico || item.cie10 || item.estado);
}

function buildPrescriptionSuggestionSnapshot(detail: EncounterDetailResponse) {
  const latestConsultationRecord =
    [...detail.sectionRecords]
      .filter((record) => record.tabKey === 'Consulta actual')
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;
  const latestEvolutionRecord =
    [...detail.sectionRecords]
      .filter((record) => record.tabKey === 'Evolución')
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;

  const evolutionDiagnoses = readDiagnosesArrayFromUnknown(
    latestEvolutionRecord?.formData.evolucionDiagnosticos,
  );
  const consultationSecondaryDiagnoses = readDiagnosesArrayFromUnknown(
    latestConsultationRecord?.formData.idSecundarios,
  );

  return {
    recetaDiagnosticoPrincipal:
      (latestConsultationRecord?.formData.idDiagnosticoPrincipal as string | undefined) ??
      evolutionDiagnoses[0]?.diagnostico ??
      '',
    recetaDiagnosticoCie10:
      (latestConsultationRecord?.formData.idCie10 as string | undefined) ??
      evolutionDiagnoses[0]?.cie10 ??
      '',
    recetaDiagnosticoSecundarios:
      evolutionDiagnoses.slice(1).length > 0
        ? evolutionDiagnoses.slice(1)
        : consultationSecondaryDiagnoses,
    recetaSeguimientoFecha:
      (latestConsultationRecord?.formData.planSeguimiento as string | undefined) ??
      (latestEvolutionRecord?.formData.evolucionSeguimiento as string | undefined) ??
      '',
    recetaSeguimientoInstrucciones:
      (latestEvolutionRecord?.formData.evolucionSeguimiento as string | undefined) ??
      (latestConsultationRecord?.formData.planSeguimiento as string | undefined) ??
      '',
    recetaSignosAlarma: [
      ...(latestConsultationRecord?.formData.rfDolorToracico ? ['Dolor torácico'] : []),
      ...(latestConsultationRecord?.formData.rfDisnea ? ['Disnea'] : []),
      ...(latestConsultationRecord?.formData.rfFiebreAlta ? ['Fiebre >38.5°C'] : []),
      ...(latestConsultationRecord?.formData.rfSangradoActivo ? ['Sangrado activo'] : []),
      ...(latestConsultationRecord?.formData.rfAlteracionConciencia
        ? ['Alteración del estado de conciencia']
        : []),
    ],
  };
}

function mergePrescriptionSystemFields(
  formData: Record<string, RecordFieldValue>,
  detail: EncounterDetailResponse,
  options?: {
    sessionUser?: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
      tenant: {
        name: string;
      };
      facility: {
        id: string;
        name: string;
      } | null;
    } | null;
    encounterMeta?: {
      facilities: Array<{
        id: string;
        code: string;
        name: string;
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
    } | null;
  },
) {
  return {
    ...buildPrescriptionSuggestionSnapshot(detail),
    ...formData,
    ...buildPrescriptionLegalSnapshotWithFallback({
      detail,
      sessionUser: options?.sessionUser,
      encounterMeta: options?.encounterMeta ?? null,
    }),
  };
}

function buildPrescriptionVersionPrefill(args: {
  tabDefinition: EpisodeTabDefinition;
  detail: EncounterDetailResponse;
  encounterNumber: string;
  nextVersionNumber: number;
  sessionUser?: {
    id: string;
    fullName: string;
    professionalLicense: string | null;
    tenant: {
      name: string;
    };
    facility: {
      id: string;
      name: string;
    } | null;
  } | null;
  encounterMeta?: {
    facilities: Array<{
      id: string;
      code: string;
      name: string;
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
  } | null;
}) {
  const nextFormData = normalizeRecordFormData(args.tabDefinition, undefined);

  return mergePrescriptionSystemFields(
    {
      ...nextFormData,
      recetaFolio: buildPrescriptionFolio(
        args.encounterNumber,
        args.nextVersionNumber,
      ),
      recetaCodigoVerificacion: 'Se generará al guardar',
      recetaDiagnosticoPrincipal:
        buildPrescriptionSuggestionSnapshot(args.detail).recetaDiagnosticoPrincipal,
      recetaDiagnosticoCie10:
        buildPrescriptionSuggestionSnapshot(args.detail).recetaDiagnosticoCie10,
      recetaDiagnosticoSecundarios:
        buildPrescriptionSuggestionSnapshot(args.detail).recetaDiagnosticoSecundarios as RecordFieldValue,
      recetaSeguimientoFecha:
        buildPrescriptionSuggestionSnapshot(args.detail).recetaSeguimientoFecha,
      recetaSeguimientoInstrucciones:
        buildPrescriptionSuggestionSnapshot(args.detail)
          .recetaSeguimientoInstrucciones,
      recetaSignosAlarma:
        buildPrescriptionSuggestionSnapshot(args.detail).recetaSignosAlarma as RecordFieldValue,
    },
    args.detail,
    {
      sessionUser: args.sessionUser,
      encounterMeta: args.encounterMeta ?? null,
    },
  );
}

function readMedicationArray(value: RecordFieldValue) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  );
}

function buildPrescriptionSafetyAlerts(
  detail: EncounterDetailResponse,
  formData: Record<string, RecordFieldValue>,
) {
  const allergyText = [
    detail.patient.allergiesSummary.join(', '),
    typeof formData.referenciaAlergiasCriticas === 'string'
      ? formData.referenciaAlergiasCriticas
      : '',
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();
  const medicationNames = readMedicationArray(formData.recetaMedicamentos).map((item) =>
    typeof item.medicamento === 'string' ? item.medicamento.toLowerCase().trim() : '',
  );
  const allergyAlerts =
    allergyText.includes('penic') &&
    medicationNames.some((name) =>
      ['penicilina', 'amoxicilina', 'ampicilina', 'dicloxacilina'].some((needle) =>
        name.includes(needle),
      ),
    )
      ? [
          'El paciente tiene antecedente compatible con alergia a penicilinas; revisa la receta antes de firmar.',
        ]
      : ['Sin alertas de alergias detectadas automáticamente.'];

  const duplicatedMedicationNames = medicationNames.filter(
    (name, index) => name && medicationNames.indexOf(name) !== index,
  );
  const duplicityAlerts =
    duplicatedMedicationNames.length > 0
      ? [
          `Se detectó posible duplicidad terapéutica en: ${[
            ...new Set(duplicatedMedicationNames),
          ].join(', ')}.`,
        ]
      : ['Sin duplicidad terapéutica identificada.'];

  const interactionAlerts =
    medicationNames.includes('warfarina') && medicationNames.includes('ibuprofeno')
      ? [
          'Warfarina con ibuprofeno incrementa el riesgo de sangrado; confirma la pertinencia del tratamiento.',
        ]
      : ['Sin interacciones medicamentosas críticas detectadas.'];

  return [
    { title: 'Validación de alergias', items: allergyAlerts },
    { title: 'Duplicidad terapéutica', items: duplicityAlerts },
    { title: 'Interacciones medicamentosas', items: interactionAlerts },
  ];
}

function buildPdfBlobUrl(contentBase64: string, mimeType: string) {
  const binaryContent = window.atob(contentBase64);
  const bytes = new Uint8Array(binaryContent.length);

  for (let index = 0; index < binaryContent.length; index += 1) {
    bytes[index] = binaryContent.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function calculateImcValue(
  weightValue: RecordFieldValue,
  heightValue: RecordFieldValue,
) {
  const parsedWeight =
    typeof weightValue === 'string' && weightValue.trim()
      ? Number(weightValue)
      : null;
  const parsedHeight =
    typeof heightValue === 'string' && heightValue.trim()
      ? Number(heightValue)
      : null;

  if (!parsedWeight || !parsedHeight) {
    return '';
  }

  const heightMeters = parsedHeight / 100;

  if (heightMeters <= 0) {
    return '';
  }

  return (parsedWeight / (heightMeters * heightMeters)).toFixed(1);
}

function buildFormState(detail: EncounterDetailResponse): FormState {
  return {
    facilityId: detail.facility?.id ?? '',
    serviceAreaId: detail.serviceArea?.id ?? '',
    specialtyId: detail.specialty?.id ?? '',
    attendingUserId: detail.attendingClinician?.id ?? '',
    encounterType: detail.encounterType,
    status: detail.status,
    admissionSource: detail.admissionSource ?? '',
    openedAt: detail.openedAt.slice(0, 16),
    closedAt: detail.closedAt ? detail.closedAt.slice(0, 16) : '',
    reasonForVisit: detail.reasonForVisit ?? '',
    notes: detail.notes ?? '',
  };
}

function normalizeStructuredSections(detail: EncounterDetailResponse) {
  const defaultSections = buildInitialStructuredSections(detail.encounterType);
  const rawSections =
    detail.profile.sections && typeof detail.profile.sections === 'object'
      ? (detail.profile.sections as Record<string, unknown>)
      : {};

  const normalizedSections: StructuredSectionsState = {};

  for (const [tabKey, tabValue] of Object.entries(defaultSections)) {
    const rawTabValue =
      rawSections[tabKey] && typeof rawSections[tabKey] === 'object'
        ? (rawSections[tabKey] as Record<string, unknown>)
        : {};

    normalizedSections[tabKey] = Object.fromEntries(
      Object.keys(tabValue).map((fieldKey) => [
        fieldKey,
        typeof rawTabValue[fieldKey] === 'string' ? rawTabValue[fieldKey] : '',
      ]),
    );
  }

  return normalizedSections;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold leading-none text-slate-900">{value}</p>
    </div>
  );
}

function SummaryDataCard({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SummaryList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return emptyText ? (
      <p className="text-sm text-muted-foreground">{emptyText}</p>
    ) : null;
  }

  return (
    <ul className="space-y-2 text-sm leading-relaxed text-slate-800">
      {items.slice(0, 6).map((item) => (
        <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" key={item}>
          {item}
        </li>
      ))}
      {items.length > 6 ? (
        <li className="text-xs font-medium text-slate-500">
          +{items.length - 6} elementos adicionales
        </li>
      ) : null}
    </ul>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium text-slate-900">{label}</span>
      <div className="flex min-h-10 items-center whitespace-pre-line rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
        {value || 'Sin dato disponible'}
      </div>
    </div>
  );
}

function hasPrintableDocumentValue(value: string) {
  const normalizedValue = value.trim();

  return (
    normalizedValue.length > 0 &&
    ![
      'N/A',
      'Sin dato disponible',
      'Sin profesional responsable',
      'Sin cédula',
      'Sin especialidad',
    ].includes(normalizedValue) &&
    !normalizedValue.startsWith('Se generará')
  );
}

type EncounterSectionRecordItem = EncounterDetailResponse['sectionRecords'][number];

function readRecordTextValue(
  formData: Record<string, unknown>,
  fieldKey: string,
) {
  const value = formData[fieldKey];
  return typeof value === 'string' ? value.trim() : '';
}

function formatEmergencyNursingMedicationSummary(formData: Record<string, unknown>) {
  const medications = Array.isArray(formData.medicacionAdministradaEnfUrg)
    ? formData.medicacionAdministradaEnfUrg
    : [];

  const summary = medications
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    )
    .map((medication) =>
      [
        readRecordTextValue(medication, 'medicamento'),
        readRecordTextValue(medication, 'horaAdministrada'),
        readRecordTextValue(medication, 'estado'),
      ]
        .filter(Boolean)
        .join(' · '),
    )
    .filter(Boolean);

  return summary.length > 0 ? summary.join('\n') : 'Sin registro';
}

function formatEmergencyNursingProcedureSummary(formData: Record<string, unknown>) {
  const procedures = Array.isArray(formData.procedimientosEnfermeriaEnfUrg)
    ? formData.procedimientosEnfermeriaEnfUrg
    : [];

  const summary = procedures
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    )
    .map((procedure) =>
      [
        readRecordTextValue(procedure, 'procedimiento'),
        readRecordTextValue(procedure, 'hora'),
      ]
        .filter(Boolean)
        .join(' · '),
    )
    .filter(Boolean);

  return summary.length > 0 ? summary.join('\n') : 'Sin registro';
}

type News2ParameterScoreCard = {
  key: string;
  label: string;
  value: string;
  score: number | null;
};

const news2RiskStyles = {
  unknown: {
    label: 'Sin cálculo',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  low: {
    label: 'Bajo riesgo',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  mild: {
    label: 'Riesgo leve',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  medium: {
    label: 'Riesgo medio',
    className: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  high: {
    label: 'Alto riesgo',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
} as const;

function getNews2RiskStyle(total: number | null) {
  if (total === null) return news2RiskStyles.unknown;
  if (total === 0) return news2RiskStyles.low;
  if (total <= 4) return news2RiskStyles.mild;
  if (total <= 6) return news2RiskStyles.medium;
  return news2RiskStyles.high;
}

function getNews2ScoreClass(score: number | null) {
  if (score === null) return 'border-slate-200 bg-slate-50 text-slate-600';
  if (score === 0) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score === 1) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (score === 2) return 'border-orange-200 bg-orange-50 text-orange-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function getNews2ParameterScoreCards(
  formData: Record<string, RecordFieldValue>,
): News2ParameterScoreCard[] {
  const respiratoryRate = readNumericFormValue(formData.fr);
  const oxygenSaturation = readNumericFormValue(formData.spo2);
  const systolicPressure = readNumericFormValue(formData.taSistolica);
  const heartRate = readNumericFormValue(formData.fc);
  const temperature = readNumericFormValue(formData.temp);
  const glasgowTotal = readNumericFormValue(formData.glasgowTotal);

  return [
    {
      key: 'fr',
      label: 'Frecuencia respiratoria (FR)',
      value: respiratoryRate === null ? 'Sin dato' : `${respiratoryRate} rpm`,
      score:
        respiratoryRate === null ? null : scoreNews2RespiratoryRate(respiratoryRate),
    },
    {
      key: 'spo2',
      label: 'Saturación de oxígeno (SpO₂)',
      value: oxygenSaturation === null ? 'Sin dato' : `${oxygenSaturation}%`,
      score:
        oxygenSaturation === null
          ? null
          : scoreNews2OxygenSaturation(oxygenSaturation),
    },
    {
      key: 'taSistolica',
      label: 'Presión arterial sistólica (TA sistólica)',
      value: systolicPressure === null ? 'Sin dato' : `${systolicPressure} mmHg`,
      score:
        systolicPressure === null
          ? null
          : scoreNews2SystolicPressure(systolicPressure),
    },
    {
      key: 'fc',
      label: 'Frecuencia cardiaca (FC)',
      value: heartRate === null ? 'Sin dato' : `${heartRate} lpm`,
      score: heartRate === null ? null : scoreNews2HeartRate(heartRate),
    },
    {
      key: 'temp',
      label: 'Temperatura',
      value: temperature === null ? 'Sin dato' : `${temperature} °C`,
      score: temperature === null ? null : scoreNews2Temperature(temperature),
    },
    {
      key: 'estadoConciencia',
      label: 'Estado de conciencia',
      value: glasgowTotal === null ? 'Sin dato' : `Glasgow ${glasgowTotal}`,
      score: 0,
    },
    {
      key: 'oxigenoSuplementario',
      label: 'Uso de oxígeno suplementario',
      value: 'No documentado',
      score: 0,
    },
  ];
}

function getPrioritizedTriageAlerts(formData: Record<string, RecordFieldValue>) {
  return buildTriageAutomaticAlerts(formData).slice(0, 5);
}

function News2StructuredPanel({
  formData,
}: {
  formData: Record<string, RecordFieldValue>;
}) {
  const total =
    readNumericFormValue(formData.news2Total) ??
    readNumericFormValue(calculateNews2(formData));
  const riskStyle = getNews2RiskStyle(total);
  const alerts = getPrioritizedTriageAlerts(formData);

  return (
    <div className="space-y-4 md:col-span-2">
      <div className={`rounded-2xl border px-4 py-3 ${riskStyle.className}`}>
        <p className="text-sm font-semibold">
          NEWS2: {total === null ? '—' : total} — {riskStyle.label}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {getNews2ParameterScoreCards(formData).map((item) => (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            key={item.key}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
              </div>
              <span
                className={`inline-flex min-w-10 justify-center rounded-md border px-2 py-1 text-sm font-semibold ${getNews2ScoreClass(item.score)}`}
              >
                {item.score === null ? '—' : item.score}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Alertas automáticas</p>
        {alerts.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {alerts.map((alert) => (
              <div
                className={`flex items-start gap-3 rounded-md border px-3 py-2 ${
                  alert.severity === 'CRITICAL'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
                key={alert.code}
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Sin alertas clínicas activas.
          </p>
        )}
      </div>
    </div>
  );
}

function normalizeRecordFormData(
  tabDefinition: EpisodeTabDefinition | undefined,
  rawFormData?: Record<string, unknown>,
) {
  const normalizedFormData: Record<string, RecordFieldValue> = {};

  if (!tabDefinition) {
    return normalizedFormData;
  }

  for (const section of tabDefinition.sections) {
    for (const field of section.fields) {
      if (isPresentationField(field)) {
        continue;
      }

      const rawFieldValue = rawFormData?.[field.key];

      if (field.type === 'checkbox') {
        normalizedFormData[field.key] = Boolean(rawFieldValue);
        continue;
      }

      if (field.type === 'string-array') {
        normalizedFormData[field.key] = Array.isArray(rawFieldValue)
          ? rawFieldValue.filter((value): value is string => typeof value === 'string')
          : [];
        continue;
      }

      if (field.type === 'object-array') {
        if (field.key === emergencyEvolutionDiagnosisFieldKey) {
          normalizedFormData[field.key] =
            normalizeEmergencyEvolutionDiagnoses(rawFieldValue);
          continue;
        }

        if (field.key === emergencyEvolutionDiagnosticResultsFieldKey) {
          normalizedFormData[field.key] =
            normalizeEmergencyEvolutionDiagnosticResults(
              rawFieldValue,
              rawFormData,
            );
          continue;
        }

        normalizedFormData[field.key] = Array.isArray(rawFieldValue)
          ? rawFieldValue
              .filter(
                (value): value is Record<string, unknown> =>
                  Boolean(value) && typeof value === 'object' && !Array.isArray(value),
              )
              .map((item) => ({ ...item }))
          : [];
        continue;
      }

      normalizedFormData[field.key] =
        typeof rawFieldValue === 'string'
          ? rawFieldValue
          : (buildDefaultFieldValue(field) as RecordFieldValue);
    }
  }

  for (const [fieldKey, rawFieldValue] of Object.entries(rawFormData ?? {})) {
    if (fieldKey in normalizedFormData) {
      continue;
    }

    if (
      typeof rawFieldValue === 'string' ||
      typeof rawFieldValue === 'number' ||
      typeof rawFieldValue === 'boolean' ||
      rawFieldValue === null
    ) {
      normalizedFormData[fieldKey] = rawFieldValue;
      continue;
    }

    if (Array.isArray(rawFieldValue)) {
      if (rawFieldValue.every((item) => typeof item === 'string')) {
        normalizedFormData[fieldKey] = rawFieldValue as string[];
        continue;
      }

      normalizedFormData[fieldKey] = rawFieldValue.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      );
    }
  }

  return normalizedFormData;
}

function buildRecordFormState(args: {
  tabDefinition: EpisodeTabDefinition | undefined;
  noteType: string;
  title: string;
  status: string;
  recordedAt: string;
  rawFormData?: Record<string, unknown>;
}): RecordFormState {
  return {
    noteType: args.noteType,
    title: args.title,
    status: args.status,
    recordedAt: args.recordedAt,
    formData: normalizeRecordFormData(args.tabDefinition, args.rawFormData),
  };
}

function buildConsultationVersionPrefill(args: {
  tabDefinition: EpisodeTabDefinition;
  previousConsultationFormData?: Record<string, unknown>;
  detail: EncounterDetailResponse;
  nextConsultationType: 'PRIMERA_VEZ' | 'SUBSECUENTE';
}) {
  const nextFormData = normalizeRecordFormData(
    args.tabDefinition,
    args.previousConsultationFormData,
  );

  for (const section of args.tabDefinition.sections) {
    for (const field of section.fields) {
      if (isPresentationField(field)) {
        continue;
      }

      const inheritanceMode = field.inheritanceMode ?? 'fresh_capture';

      if (field.key === 'tipoConsultaActual') {
        nextFormData[field.key] = args.nextConsultationType;
        continue;
      }

      if (inheritanceMode !== 'carry_forward') {
        nextFormData[field.key] = buildDefaultFieldValue(field) as RecordFieldValue;
      }
    }
  }

  return mergeConsultationSystemFields(nextFormData, args.detail);
}

function buildEvolutionVersionPrefill(args: {
  tabDefinition: EpisodeTabDefinition;
  previousEvolutionRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  latestConsultationRecord?: EncounterDetailResponse['sectionRecords'][number] | null;
  detail: EncounterDetailResponse;
}) {
  const nextFormData = normalizeRecordFormData(args.tabDefinition, undefined);

  nextFormData.evolucionDiagnosticos = buildEvolutionDiagnosesBaseline(
    args.previousEvolutionRecord,
    args.latestConsultationRecord,
  ) as RecordFieldValue;

  nextFormData.evolucionTratamiento =
    (args.previousEvolutionRecord?.formData.evolucionTratamiento as string | undefined) ?? '';

  return mergeEvolutionSystemFields(
    nextFormData,
    args.detail,
    args.previousEvolutionRecord,
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="mb-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export function EpisodeDetailPage() {
  const { episodeNumber = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('Resumen');
  const [form, setForm] = useState<FormState | null>(null);
  const [structuredSections, setStructuredSections] =
    useState<StructuredSectionsState>({});
  const [recordForm, setRecordForm] = useState<RecordFormState | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSigningRecord, setIsSigningRecord] = useState(false);
  const [signaturePassword, setSignaturePassword] = useState('');
  const [isOpeningEmergencyNursingSheet, setIsOpeningEmergencyNursingSheet] =
    useState(false);
  const pendingDiagnosisFocusIdRef = useRef<string | null>(null);

  useEffect(() => {
    const focusId = pendingDiagnosisFocusIdRef.current;
    if (!focusId) {
      return;
    }

    const input = document.querySelector<HTMLInputElement>(
      `[data-diagnosis-input-id="${focusId}"]`,
    );
    input?.focus();
    pendingDiagnosisFocusIdRef.current = null;
  }, [recordForm?.formData.diagnosticosEvolucionUrg]);

  const detailQuery = useQuery({
    queryKey: ['encounter-detail', episodeNumber],
    queryFn: () => fetchEncounterDetail(session!.accessToken, episodeNumber),
    enabled: Boolean(session && episodeNumber),
  });

  const metaQuery = useQuery({
    queryKey: ['encounters-meta'],
    queryFn: () => fetchEncounterMeta(session!.accessToken),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (detailQuery.data) {
      setForm(buildFormState(detailQuery.data));
      setStructuredSections(normalizeStructuredSections(detailQuery.data));
    }
  }, [detailQuery.data]);

  const detail = detailQuery.data;
  const tabs = useMemo(
    () => getEncounterTabs(detail?.encounterType ?? 'OUTPATIENT'),
    [detail?.encounterType],
  );

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, tabs]);

  const availableServiceAreas = useMemo(
    () =>
      (metaQuery.data?.serviceAreas ?? []).filter(
        (serviceArea) => serviceArea.facilityId === (form?.facilityId ?? ''),
      ),
    [form?.facilityId, metaQuery.data?.serviceAreas],
  );

  const updateFormField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            [field]: value,
          }
        : currentValue,
    );
  };

  const updateStructuredField = (
    tabKey: string,
    fieldKey: string,
    value: string,
  ) => {
    setStructuredSections((currentValue) => ({
      ...currentValue,
      [tabKey]: {
        ...(currentValue[tabKey] ?? {}),
        [fieldKey]: value,
      },
    }));
  };

  useEffect(() => {
    if (
      form?.serviceAreaId &&
      !availableServiceAreas.some((serviceArea) => serviceArea.id === form.serviceAreaId)
    ) {
      setForm((currentValue) =>
        currentValue
          ? {
              ...currentValue,
              serviceAreaId: '',
            }
          : currentValue,
      );
    }
  }, [availableServiceAreas, form?.serviceAreaId]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateEncounterRequest) =>
      updateEncounter(session!.accessToken, episodeNumber, payload),
    onSuccess: async (updatedEncounter) => {
      setFeedback('Cambios guardados correctamente.');
      setForm(buildFormState(updatedEncounter));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['encounter-detail', episodeNumber] }),
        queryClient.invalidateQueries({ queryKey: ['encounters'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      ]);
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const refreshEncounterData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['encounter-detail', episodeNumber] }),
      queryClient.invalidateQueries({ queryKey: ['encounters'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
    ]);
  };

  const createRecordMutation = useMutation({
    mutationFn: (payload: {
      tabKey: string;
      noteType: string;
      title?: string;
      status?: string;
      recordedAt?: string;
      formData: Record<string, unknown>;
    }) => createEncounterSectionRecord(session!.accessToken, episodeNumber, payload),
    onSuccess: async () => {
      setFeedback('Registro creado correctamente.');
      setIsCreatingRecord(false);
      setActiveRecordId(null);
      setRecordForm(null);
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: (payload: {
      recordId: string;
      tabKey: string;
      noteType: string;
      title?: string;
      status?: string;
      recordedAt?: string;
      formData: Record<string, unknown>;
    }) =>
      updateEncounterSectionRecord(session!.accessToken, episodeNumber, payload.recordId, {
        tabKey: payload.tabKey,
        noteType: payload.noteType,
        title: payload.title,
        status: payload.status,
        recordedAt: payload.recordedAt,
        formData: payload.formData,
      }),
    onSuccess: async () => {
      setFeedback('Registro actualizado correctamente.');
      setIsCreatingRecord(false);
      setActiveRecordId(null);
      setRecordForm(null);
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const signRecordMutation = useMutation({
    mutationFn: (payload: { recordId: string; password: string }) =>
      signEncounterSectionRecord(session!.accessToken, episodeNumber, payload.recordId, {
        password: payload.password,
      }),
    onSuccess: async () => {
      setFeedback('Registro firmado correctamente.');
      setIsSigningRecord(false);
      setSignaturePassword('');
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const correctInitialNoteMutation = useMutation({
    mutationFn: (payload: { recordId: string; reason?: string }) =>
      correctEmergencyInitialNote(
        session!.accessToken,
        episodeNumber,
        payload.recordId,
        { reason: payload.reason },
      ),
    onSuccess: async () => {
      setFeedback('Nota inicial habilitada para corrección. Se requerirá una nueva firma.');
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const previewPrescriptionPdfMutation = useMutation({
    mutationFn: (recordId: string) =>
      previewEncounterSectionRecordPdf(session!.accessToken, episodeNumber, recordId),
    onSuccess: (response) => {
      const blobUrl = buildPdfBlobUrl(response.contentBase64, response.mimeType);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const downloadPrescriptionPdfMutation = useMutation({
    mutationFn: (recordId: string) =>
      downloadEncounterSectionRecordPdf(session!.accessToken, episodeNumber, recordId),
    onSuccess: async (response) => {
      const blobUrl = buildPdfBlobUrl(response.contentBase64, response.mimeType);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = response.fileName;
      downloadAnchor.click();
      URL.revokeObjectURL(blobUrl);
      setFeedback('PDF oficial generado y descargado correctamente.');
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: (files: File[]) =>
      uploadEncounterAttachments(session!.accessToken, episodeNumber, files),
    onSuccess: async () => {
      setFeedback('Archivos cargados correctamente.');
      setPendingFiles([]);
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      deleteEncounterAttachment(session!.accessToken, episodeNumber, attachmentId),
    onSuccess: async () => {
      setFeedback('Adjunto eliminado correctamente.');
      await refreshEncounterData();
    },
    onError: (error: Error) => {
      setFeedback(error.message);
    },
  });

  useEffect(() => {
    setIsCreatingRecord(false);
    setActiveRecordId(null);
    setRecordForm(null);
    setPendingFiles([]);
    setIsSigningRecord(false);
    setSignaturePassword('');
  }, [activeTab, detail?.id]);

  useEffect(() => {
    if (!recordForm || !detail || !isConsultationCurrentTab(detail.encounterType, activeTab)) {
      return;
    }

    const calculatedImc = calculateImcValue(
      recordForm.formData.svPeso ?? '',
      recordForm.formData.svTalla ?? '',
    );

    if (recordForm.formData.svImc === calculatedImc) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            formData: {
              ...currentValue.formData,
              svImc: calculatedImc,
            },
          }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (!recordForm || !detail || !isConsultationPrescriptionTab(detail.encounterType, activeTab)) {
      return;
    }

    const synchronizedSystemFields = mergePrescriptionSystemFields(
      recordForm.formData,
      detail,
      {
        sessionUser: session?.user ?? null,
        encounterMeta: metaQuery.data ?? null,
      },
    );
    const systemFieldKeys = [
      'recetaInstitucionEmisora',
      'recetaRfcMedico',
      'recetaLicenciaSanitaria',
      'recetaNombreProfesional',
      'recetaCedulaProfesional',
      'recetaEspecialidadProfesional',
      'recetaLugarAtencion',
    ] as const;

    const hasChanges = systemFieldKeys.some(
      (fieldKey) => recordForm.formData[fieldKey] !== synchronizedSystemFields[fieldKey],
    );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            formData: synchronizedSystemFields,
          }
        : currentValue,
    );
  }, [activeTab, detail, metaQuery.data, recordForm, session?.user]);

  useEffect(() => {
    if (!recordForm || !detail || !isConsultationDocumentsTab(detail.encounterType, activeTab)) {
      return;
    }

    const synchronizedSystemFields = mergeDocumentSystemFields(
      recordForm.formData,
      detail,
      recordForm.noteType,
      {
        sessionUser: session?.user ?? null,
        encounterMeta: metaQuery.data ?? null,
      },
    );
    const systemFieldKeys = [
      'documentoPacienteNombre',
      'documentoPacienteCurp',
      'documentoExpediente',
      'documentoFolioEpisodio',
      'documentoTipoEpisodio',
      'documentoInstitucionEmisora',
      'documentoRfcMedico',
      'documentoLicenciaSanitaria',
      'documentoCodigoVerificacion',
      'documentoHash',
      'documentoSelloDigital',
      'documentoNombreProfesional',
      'documentoCedulaProfesional',
      'documentoEspecialidadProfesional',
      'documentoLugarAtencion',
    ] as const;

    const hasChanges = systemFieldKeys.some(
      (fieldKey) => recordForm.formData[fieldKey] !== synchronizedSystemFields[fieldKey],
    );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            formData: synchronizedSystemFields,
          }
        : currentValue,
    );
  }, [activeTab, detail, metaQuery.data, recordForm, session?.user]);

  useEffect(() => {
    if (!recordForm || !detail || !isEmergencyTriageTab(detail.encounterType, activeTab)) {
      return;
    }

    const nextFormData: Record<string, RecordFieldValue> = {
      ...mergeEmergencyTriageSystemFields(
        recordForm.formData,
        detail,
        session?.user ?? null,
        recordForm.recordedAt,
      ),
      tiempoObjetivoAtencion: calculateTriageTargetTime(
        recordForm.formData.nivelPrioridadTriage,
      ),
      tiempoEspera: calculateTriageWaitTime(
        recordForm.formData.horaLlegada,
        recordForm.formData.horaTriage,
      ),
      glasgowTotal: calculateGlasgowTotal(recordForm.formData),
      news2Total: calculateNews2(recordForm.formData),
    };
    const triageAlerts = buildTriageAutomaticAlerts(nextFormData);
    nextFormData.alertasAutomaticas = triageAlerts
      .map((alert) => alert.message)
      .join('\n');
    nextFormData.alertasAutomaticasSnapshot = triageAlerts;
    nextFormData.banderaRojaAutomatica = hasSelectedTriageClinicalDiscriminator(
      nextFormData,
    )
      ? 'Sí'
      : 'No';

    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Triage',
            title: currentValue.title,
            formData: nextFormData,
          }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isEmergencyInitialNoteTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const nextFormData: Record<string, RecordFieldValue> = {
      ...recordForm.formData,
      ...buildEmergencyInitialNoteSnapshot({
        detail,
        triageRecord: getLatestRecordByTab(detail.sectionRecords, 'Triage'),
        recordedAt: recordForm.recordedAt,
        currentFormData: recordForm.formData,
      }),
    };
    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === 'Nota inicial') {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Nota inicial',
            formData: nextFormData,
      }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isEmergencyEvolutionTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const currentRecordId = activeRecordId;
    const previousEvolutionRecord =
      [...detail.sectionRecords]
        .filter(
          (record) =>
            record.tabKey === 'Evolución' &&
            (!currentRecordId || record.id !== currentRecordId),
        )
        .sort((left, right) => {
          const leftVersion = left.metadata.versionNumber ?? 0;
          const rightVersion = right.metadata.versionNumber ?? 0;

          if (leftVersion !== rightVersion) {
            return rightVersion - leftVersion;
          }

          return right.recordedAt.localeCompare(left.recordedAt);
        })[0] ?? null;
    const nextFormData: Record<string, RecordFieldValue> = {
      ...recordForm.formData,
      ...buildEmergencyEvolutionSnapshot({
        detail,
        initialNoteRecord: getLatestRecordByTab(detail.sectionRecords, 'Nota inicial'),
        previousEvolutionRecord,
        recordedAt: recordForm.recordedAt,
        currentFormData: recordForm.formData,
      }),
    };
    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === 'Evolución en urgencias') {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Evolución en urgencias',
            formData: nextFormData,
      }
        : currentValue,
    );
  }, [activeRecordId, activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isEmergencyOrdersTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const documentType = resolveEmergencyOrdersDocumentType(
      recordForm.noteType,
      recordForm.formData,
    );
    const nextFormData: Record<string, RecordFieldValue> = {
      ...recordForm.formData,
      ...buildEmergencyOrdersSnapshot({
        detail,
        initialNoteRecord: getLatestRecordByTab(detail.sectionRecords, 'Nota inicial'),
        evolutionRecord: getLatestRecordByTab(detail.sectionRecords, 'Evolución'),
        documentType,
        currentFormData: recordForm.formData,
      }),
    };
    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === documentType) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: documentType,
            formData: nextFormData,
      }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isEmergencyConsultationTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const nextFormData: Record<string, RecordFieldValue> = {
      ...recordForm.formData,
      ...buildEmergencyConsultationSnapshot({
        detail,
        initialNoteRecord: getLatestRecordByTab(detail.sectionRecords, 'Nota inicial'),
        evolutionRecord: getLatestRecordByTab(detail.sectionRecords, 'Evolución'),
        ordersRecord: getLatestRecordByTab(
          detail.sectionRecords,
          'Órdenes / Indicaciones',
        ),
        recordedAt: recordForm.recordedAt,
        currentFormData: recordForm.formData,
      }),
    };
    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === 'Interconsultas') {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Interconsultas',
            formData: nextFormData,
          }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isEmergencyDischargeTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const nextFormData: Record<string, RecordFieldValue> = {
      ...recordForm.formData,
      ...buildEmergencyDischargeSnapshot({
        detail,
        triageRecord: getLatestRecordByTab(detail.sectionRecords, 'Triage'),
        initialNoteRecord: getLatestRecordByTab(detail.sectionRecords, 'Nota inicial'),
        evolutionRecord: getLatestRecordByTab(detail.sectionRecords, 'Evolución'),
        ordersRecord: getLatestRecordByTab(
          detail.sectionRecords,
          'Órdenes / Indicaciones',
        ),
        consultationRecord: getLatestRecordByTab(detail.sectionRecords, 'Interconsultas'),
        recordedAt: recordForm.recordedAt,
        currentFormData: recordForm.formData,
      }),
    };
    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === 'Egreso de urgencias') {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Egreso de urgencias',
            title: buildEmergencyDischargeTitle(),
            formData: nextFormData,
          }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isAmbulatoryPreprocedureTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const synchronizedSystemFields = buildAmbulatoryPreprocedureSnapshot({
      detail,
      recordedAt: recordForm.recordedAt,
      currentFormData: recordForm.formData,
    });
    const hasChanges = Object.entries(synchronizedSystemFields).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === 'Valoración preprocedimiento') {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Valoración preprocedimiento',
            formData: {
              ...currentValue.formData,
              ...synchronizedSystemFields,
            },
          }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isAmbulatoryProcedureTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const latestPreprocedureRecord =
      getLatestRecordByTab(detail.sectionRecords, 'Valoración preprocedimiento');
    const synchronizedSystemFields = buildAmbulatoryProcedureSnapshot({
      detail,
      recordedAt: recordForm.recordedAt,
      preprocedureRecord: latestPreprocedureRecord,
      currentFormData: recordForm.formData,
    });
    const nextTitle =
      recordForm.title && recordForm.title.startsWith('Procedimiento V')
        ? recordForm.title
        : buildAmbulatoryProcedureTitle(1);
    const hasChanges =
      recordForm.title !== nextTitle ||
      recordForm.noteType !== 'Procedimiento' ||
      Object.entries(synchronizedSystemFields).some(
        ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
      );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            title: nextTitle,
            noteType: 'Procedimiento',
            formData: {
              ...currentValue.formData,
              ...synchronizedSystemFields,
            },
          }
      : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isAmbulatoryRecoveryEvaluationTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const latestProcedureRecord = getLatestRecordByTab(
      detail.sectionRecords,
      'Procedimiento',
    );
    const synchronizedSystemFields = buildAmbulatoryRecoveryEvaluationSnapshot({
      detail,
      recordedAt: recordForm.recordedAt,
      procedureRecord: latestProcedureRecord,
      currentFormData: recordForm.formData,
    });
    const nextTitle =
      recordForm.title &&
      recordForm.title.startsWith('Recuperación / Evaluación V')
        ? recordForm.title
        : buildAmbulatoryRecoveryEvaluationTitle(1);
    const hasChanges =
      recordForm.title !== nextTitle ||
      recordForm.noteType !== 'Recuperación / Evaluación' ||
      Object.entries(synchronizedSystemFields).some(
        ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
      );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            title: nextTitle,
            noteType: 'Recuperación / Evaluación',
            formData: {
              ...currentValue.formData,
              ...synchronizedSystemFields,
            },
          }
      : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isAmbulatoryDischargePrescriptionTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const versionNumber =
      (typeof recordForm.formData.versionRecetaEgreso === 'number'
        ? recordForm.formData.versionRecetaEgreso
        : Number(recordForm.formData.versionRecetaEgreso)) ||
      1;
    const synchronizedSystemFields = buildAmbulatoryDischargePrescriptionSnapshot({
      detail,
      recordedAt: recordForm.recordedAt,
      currentFormData: recordForm.formData,
      versionNumber,
    });
    const nextTitle =
      recordForm.title &&
      recordForm.title.startsWith('Receta e indicaciones de egreso V')
        ? recordForm.title
        : buildAmbulatoryDischargePrescriptionTitle(versionNumber);
    const hasChanges =
      recordForm.title !== nextTitle ||
      recordForm.noteType !== 'Receta e indicaciones de egreso' ||
      Object.entries(synchronizedSystemFields).some(
        ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
      );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            title: nextTitle,
            noteType: 'Receta e indicaciones de egreso',
            formData: {
              ...currentValue.formData,
              ...synchronizedSystemFields,
            },
          }
        : currentValue,
    );
  }, [
    activeTab,
    detail,
    recordForm,
  ]);

  useEffect(() => {
    if (
      !recordForm ||
      !detail ||
      !isAmbulatoryDischargeTab(detail.encounterType, activeTab)
    ) {
      return;
    }

    const latestProcedure = getLatestRecordByTab(detail.sectionRecords, 'Procedimiento');
    const latestRecovery =
      getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evaluación') ??
      getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evolución');
    const latestPrescription =
      getLatestRecordByTab(detail.sectionRecords, 'Receta e indicaciones de egreso') ??
      getLatestRecordByTab(detail.sectionRecords, 'Indicaciones / Receta');
    const versionNumber =
      (typeof recordForm.formData.versionEgresoAmb === 'number'
        ? recordForm.formData.versionEgresoAmb
        : Number(recordForm.formData.versionEgresoAmb)) ||
      1;
    const synchronizedSystemFields = buildAmbulatoryDischargeSnapshot({
      detail,
      recordedAt: recordForm.recordedAt,
      currentFormData: recordForm.formData,
      procedureRecord: latestProcedure,
      recoveryRecord: latestRecovery,
      prescriptionRecord: latestPrescription,
      versionNumber,
    });
    const nextTitle =
      recordForm.title && recordForm.title.startsWith('Egreso V')
        ? recordForm.title
        : buildAmbulatoryDischargeTitle(versionNumber);
    const hasChanges =
      recordForm.title !== nextTitle ||
      recordForm.noteType !== 'Egreso' ||
      Object.entries(synchronizedSystemFields).some(
        ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
      );

    if (!hasChanges) {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            title: nextTitle,
            noteType: 'Egreso',
            formData: {
              ...currentValue.formData,
              ...synchronizedSystemFields,
            },
          }
        : currentValue,
    );
  }, [activeTab, detail, recordForm]);

  if (!detail || !form) {
    return (
      <AppLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cargando episodio...
          </div>
        </div>
      </AppLayout>
    );
  }

  const typeConfig = encounterTypeConfig[detail.encounterType];
  const statusConfig =
    encounterStatusConfig[detail.status] ?? encounterStatusConfig.CLOSED;
  const TypeIcon = typeConfig?.icon ?? Stethoscope;

  const saveChanges = () => {
    setFeedback(null);
    updateMutation.mutate({
      facilityId: form.facilityId || undefined,
      serviceAreaId: form.serviceAreaId || undefined,
      specialtyId: form.specialtyId || undefined,
      attendingUserId: form.attendingUserId || undefined,
      encounterType: form.encounterType,
      status: form.status,
      admissionSource: form.admissionSource || undefined,
      openedAt: new Date(form.openedAt).toISOString(),
      closedAt: form.closedAt ? new Date(form.closedAt).toISOString() : undefined,
      reasonForVisit: form.reasonForVisit.trim() || undefined,
      notes: form.notes.trim() || undefined,
      structuredSections,
    });
  };

  const activeTabDefinition = getEpisodeTabDefinition(detail.encounterType, activeTab);
  const activeTabPanelConfig = getEpisodeRecordPanelConfig(
    detail.encounterType,
    activeTab,
  );
  const activeRecordTabKey = isEmergencyEvolutionTab(
    detail.encounterType,
    activeTab,
  )
    ? 'Evolución'
    : isEmergencyOrdersTab(detail.encounterType, activeTab)
      ? 'Órdenes / Indicaciones'
      : isEmergencyDischargeTab(detail.encounterType, activeTab)
        ? 'Egreso'
        : isHospitalAdmissionTab(detail.encounterType, activeTab)
          ? 'Ingreso'
        : isHospitalEvolutionTab(detail.encounterType, activeTab)
          ? 'Evolución'
          : isHospitalMedicalOrdersTab(detail.encounterType, activeTab)
            ? 'Indicaciones médicas'
            : isHospitalConsultationTab(detail.encounterType, activeTab)
              ? 'Interconsultas'
              : isHospitalSurgicalTab(detail.encounterType, activeTab)
                ? 'Procedimientos / Cirugía'
                : isHospitalNursingTab(detail.encounterType, activeTab)
                  ? 'Enfermería'
                  : isHospitalDischargeTab(detail.encounterType, activeTab)
                    ? 'Egreso'
                    : isAmbulatoryPreprocedureTab(detail.encounterType, activeTab)
                      ? 'Valoración preprocedimiento'
                      : isAmbulatoryRecoveryEvaluationTab(
                            detail.encounterType,
                            activeTab,
                          )
                        ? 'Recuperación / Evaluación'
                        : isAmbulatoryDischargePrescriptionTab(
                              detail.encounterType,
                              activeTab,
                            )
                          ? 'Receta e indicaciones de egreso'
                          : isAmbulatoryDischargeTab(detail.encounterType, activeTab)
                            ? 'Egreso'
                      : activeTab;
  const activeTabRecords = detail.sectionRecords.filter(
    (record) =>
      record.tabKey === activeRecordTabKey ||
      (activeRecordTabKey === 'Recuperación / Evaluación' &&
        record.tabKey === 'Recuperación / Evolución') ||
      (activeRecordTabKey === 'Receta e indicaciones de egreso' &&
        record.tabKey === 'Indicaciones / Receta'),
  );
  const isConsultationHistorySection = isConsultationHistoryTab(
    detail.encounterType,
    activeTab,
  );
  const isConsultationCurrentSection = isConsultationCurrentTab(
    detail.encounterType,
    activeTab,
  );
  const isConsultationEvolutionSection = isConsultationEvolutionTab(
    detail.encounterType,
    activeTab,
  );
  const isConsultationPrescriptionSection = isConsultationPrescriptionTab(
    detail.encounterType,
    activeTab,
  );
  const isConsultationDocumentsSection = isConsultationDocumentsTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyTriageSection = isEmergencyTriageTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyInitialNoteSection = isEmergencyInitialNoteTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyNursingSheetSection = isEmergencyNursingSheetTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyEvolutionSection = isEmergencyEvolutionTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyOrdersSection = isEmergencyOrdersTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyConsultationSection = isEmergencyConsultationTab(
    detail.encounterType,
    activeTab,
  );
  const isEmergencyDischargeSection = isEmergencyDischargeTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalAdmissionSection = isHospitalAdmissionTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalEvolutionSection = isHospitalEvolutionTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalMedicalOrdersSection = isHospitalMedicalOrdersTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalConsultationSection = isHospitalConsultationTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalSurgicalSection = isHospitalSurgicalTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalNursingSection = isHospitalNursingTab(
    detail.encounterType,
    activeTab,
  );
  const isHospitalDischargeSection = isHospitalDischargeTab(
    detail.encounterType,
    activeTab,
  );
  const isAmbulatoryPreprocedureSection = isAmbulatoryPreprocedureTab(
    detail.encounterType,
    activeTab,
  );
  const isAmbulatoryProcedureSection = isAmbulatoryProcedureTab(
    detail.encounterType,
    activeTab,
  );
  const isAmbulatoryRecoveryEvaluationSection =
    isAmbulatoryRecoveryEvaluationTab(detail.encounterType, activeTab);
  const isAmbulatoryDischargePrescriptionSection =
    isAmbulatoryDischargePrescriptionTab(detail.encounterType, activeTab);
  const isAmbulatoryDischargeSection = isAmbulatoryDischargeTab(
    detail.encounterType,
    activeTab,
  );
  const isAmbulatoryClinicalSection =
    isAmbulatoryPreprocedureSection ||
    isAmbulatoryProcedureSection ||
    isAmbulatoryRecoveryEvaluationSection ||
    isAmbulatoryDischargePrescriptionSection ||
    isAmbulatoryDischargeSection;
  const latestHistoryRecord = isConsultationHistorySection
    ? getLatestHistoryRecord(activeTabRecords)
    : null;
  const latestConsultationRecord = isConsultationCurrentSection
    ? [...activeTabRecords].sort((left, right) => {
        const leftVersion = left.metadata.versionNumber ?? 0;
        const rightVersion = right.metadata.versionNumber ?? 0;

        if (leftVersion !== rightVersion) {
          return rightVersion - leftVersion;
        }

        return right.recordedAt.localeCompare(left.recordedAt);
      })[0] ?? null
    : null;
  const latestEvolutionRecord = isConsultationEvolutionSection
    ? [...activeTabRecords].sort((left, right) => {
        const leftVersion = left.metadata.versionNumber ?? 0;
        const rightVersion = right.metadata.versionNumber ?? 0;

        if (leftVersion !== rightVersion) {
          return rightVersion - leftVersion;
        }

        return right.recordedAt.localeCompare(left.recordedAt);
      })[0] ?? null
    : null;
  const latestPrescriptionRecord = isConsultationPrescriptionSection
    ? [...activeTabRecords].sort((left, right) => {
        const leftVersion = left.metadata.versionNumber ?? 0;
        const rightVersion = right.metadata.versionNumber ?? 0;

        if (leftVersion !== rightVersion) {
          return rightVersion - leftVersion;
        }

        return right.recordedAt.localeCompare(left.recordedAt);
      })[0] ?? null
    : null;
  const latestTriageRecord = isEmergencyTriageSection
    ? getLatestRecordByTab(activeTabRecords, 'Triage')
    : getLatestRecordByTab(detail.sectionRecords, 'Triage');
  const latestEmergencyInitialNoteRecord = isEmergencyInitialNoteSection
    ? getLatestRecordByTab(activeTabRecords, 'Nota inicial')
    : getLatestRecordByTab(detail.sectionRecords, 'Nota inicial');
  const latestEmergencyNursingSheetRecord = isEmergencyNursingSheetSection
    ? getLatestRecordByTab(activeTabRecords, 'Hoja de enfermería')
    : getLatestRecordByTab(detail.sectionRecords, 'Hoja de enfermería');
  const latestEmergencyEvolutionRecord = isEmergencyEvolutionSection
    ? getLatestRecordByTab(activeTabRecords, 'Evolución')
    : getLatestRecordByTab(detail.sectionRecords, 'Evolución');
  const latestEmergencyOrdersRecord = isEmergencyOrdersSection
    ? getLatestRecordByTab(activeTabRecords, 'Órdenes / Indicaciones')
    : getLatestRecordByTab(detail.sectionRecords, 'Órdenes / Indicaciones');
  const latestEmergencyConsultationRecord = isEmergencyConsultationSection
    ? getLatestRecordByTab(activeTabRecords, 'Interconsultas')
    : getLatestRecordByTab(detail.sectionRecords, 'Interconsultas');
  const latestEmergencyDischargeRecord = isEmergencyDischargeSection
    ? getLatestRecordByTab(activeTabRecords, 'Egreso')
    : getLatestRecordByTab(detail.sectionRecords, 'Egreso');
  const latestHospitalAdmissionRecord = isHospitalAdmissionSection
    ? getLatestRecordByTab(activeTabRecords, 'Ingreso')
    : getLatestRecordByTab(detail.sectionRecords, 'Ingreso');
  const latestHospitalEvolutionRecord = isHospitalEvolutionSection
    ? getLatestRecordByTabExcluding(activeTabRecords, 'Evolución', activeRecordId)
    : getLatestRecordByTab(detail.sectionRecords, 'Evolución');
  const selectedRecord =
    activeRecordId === null
      ? null
      : activeTabRecords.find((record) => record.id === activeRecordId) ?? null;
  const resolveHospitalEvolutionStayDay = (
    recordedAt: string,
    formData: Record<string, RecordFieldValue>,
  ) => {
    const admissionFormData = latestHospitalAdmissionRecord?.formData ?? {};
    const read = (value: unknown) => (typeof value === 'string' ? value : '');
    const admissionDate = read(admissionFormData.fechaIngresoHosp);
    const admissionTime = read(admissionFormData.horaIngresoHosp);
    const admittedAt =
      admissionDate && admissionTime
        ? `${admissionDate}T${admissionTime}`
        : detail.openedAt.slice(0, 16);

    return calculateHospitalStayDay(admittedAt, recordedAt) || read(formData.diaEstanciaHosp);
  };
  const selectedDocumentNoteType =
    selectedRecord?.noteType ??
    recordForm?.noteType ??
    activeTabPanelConfig?.noteTypes?.[0] ??
    getEpisodeDocumentTypes(detail.encounterType)[0];
  const currentEmergencyOrdersDocumentType = recordForm
    ? resolveEmergencyOrdersDocumentType(recordForm.noteType, recordForm.formData)
    : resolveEmergencyOrdersDocumentType(selectedRecord?.noteType, selectedRecord?.formData);
  const latestEmergencyOrdersRecordForCurrentType = isEmergencyOrdersSection
    ? [...activeTabRecords]
        .filter(
          (record) =>
            resolveEmergencyOrdersDocumentType(record.noteType, record.formData) ===
            currentEmergencyOrdersDocumentType,
        )
        .sort((left, right) => {
          const leftVersion = left.metadata.versionNumber ?? 0;
          const rightVersion = right.metadata.versionNumber ?? 0;

          if (leftVersion !== rightVersion) {
            return rightVersion - leftVersion;
          }

          return right.recordedAt.localeCompare(left.recordedAt);
        })[0] ?? null
    : null;
  const nextEmergencyOrdersVersionNumberForCurrentType =
    (latestEmergencyOrdersRecordForCurrentType?.metadata.versionNumber ?? 0) + 1;
  const documentWorkspaceDefinition = isConsultationDocumentsSection
    ? detail.encounterType === 'SURGERY'
      ? getAmbulatoryProcedureDocumentTabDefinition(selectedDocumentNoteType)
      : detail.encounterType === 'HOSPITALIZATION'
      ? getHospitalDocumentTabDefinition(selectedDocumentNoteType)
      : getConsultationDocumentTabDefinition(selectedDocumentNoteType)
    : undefined;
  const workspaceTabDefinition =
    isConsultationDocumentsSection && documentWorkspaceDefinition
      ? documentWorkspaceDefinition
      : activeTabDefinition;
  const latestDocumentRecord = isConsultationDocumentsSection
    ? [...activeTabRecords]
        .filter((record) => record.noteType === selectedDocumentNoteType)
        .sort((left, right) => {
          const leftVersion = left.metadata.versionNumber ?? 0;
          const rightVersion = right.metadata.versionNumber ?? 0;

          if (leftVersion !== rightVersion) {
            return rightVersion - leftVersion;
          }

          return right.recordedAt.localeCompare(left.recordedAt);
        })[0] ?? null
    : null;
  const nextHistoryVersionNumber =
    (latestHistoryRecord?.metadata.versionNumber ?? 0) + 1;
  const nextHistoryType =
    nextHistoryVersionNumber === 1 ? 'INICIAL' : 'SUBSECUENTE';
  const nextConsultationVersionNumber =
    (latestConsultationRecord?.metadata.versionNumber ?? 0) + 1;
  const nextConsultationType =
    nextConsultationVersionNumber === 1 ? 'PRIMERA_VEZ' : 'SUBSECUENTE';
  const nextEvolutionVersionNumber =
    (latestEvolutionRecord?.metadata.versionNumber ?? 0) + 1;
  const nextPrescriptionVersionNumber =
    (latestPrescriptionRecord?.metadata.versionNumber ?? 0) + 1;
  const nextDocumentVersionNumber =
    (latestDocumentRecord?.metadata.versionNumber ?? 0) + 1;
  const nextTriageVersionNumber =
    (latestTriageRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyNursingSheetVersionNumber =
    (latestEmergencyNursingSheetRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyEvolutionVersionNumber =
    (latestEmergencyEvolutionRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyOrdersVersionNumber =
    (latestEmergencyOrdersRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyConsultationVersionNumber =
    (latestEmergencyConsultationRecord?.metadata.versionNumber ?? 0) + 1;
  const nextHospitalAdmissionVersionNumber =
    (latestHospitalAdmissionRecord?.metadata.versionNumber ?? 0) + 1;
  const nextHospitalEvolutionVersionNumber =
    (latestHospitalEvolutionRecord?.metadata.versionNumber ?? 0) + 1;
  const latestHospitalMedicalOrdersRecord = isHospitalMedicalOrdersSection
    ? getLatestRecordByTab(activeTabRecords, 'Indicaciones médicas')
    : getLatestRecordByTab(detail.sectionRecords, 'Indicaciones médicas');
  const nextHospitalMedicalOrdersVersionNumber =
    (latestHospitalMedicalOrdersRecord?.metadata.versionNumber ?? 0) + 1;
  const latestHospitalConsultationRecord = isHospitalConsultationSection
    ? getLatestRecordByTab(activeTabRecords, 'Interconsultas')
    : getLatestRecordByTab(detail.sectionRecords, 'Interconsultas');
  const nextHospitalConsultationVersionNumber =
    (latestHospitalConsultationRecord?.metadata.versionNumber ?? 0) + 1;
  const latestHospitalSurgicalRecord = isHospitalSurgicalSection
    ? getLatestRecordByTab(activeTabRecords, 'Procedimientos / Cirugía')
    : getLatestRecordByTab(detail.sectionRecords, 'Procedimientos / Cirugía');
  const nextHospitalSurgicalVersionNumber =
    (latestHospitalSurgicalRecord?.metadata.versionNumber ?? 0) + 1;
  const latestHospitalNursingRecord = isHospitalNursingSection
    ? getLatestRecordByTab(activeTabRecords, 'Enfermería')
    : getLatestRecordByTab(detail.sectionRecords, 'Enfermería');
  const nextHospitalNursingVersionNumber =
    (latestHospitalNursingRecord?.metadata.versionNumber ?? 0) + 1;
  const latestHospitalDischargeRecord = isHospitalDischargeSection
    ? getLatestRecordByTab(activeTabRecords, 'Egreso')
    : getLatestRecordByTab(detail.sectionRecords, 'Egreso');
  const hospitalSummary =
    detail.encounterType === 'HOSPITALIZATION'
      ? buildHospitalClinicalSummary(detail)
      : null;
  const isHospitalSummaryTab =
    detail.encounterType === 'HOSPITALIZATION' && activeTab === 'Resumen';
  const latestAmbulatoryPreprocedureRecord = isAmbulatoryPreprocedureSection
    ? getLatestRecordByTab(activeTabRecords, 'Valoración preprocedimiento')
    : getLatestRecordByTab(detail.sectionRecords, 'Valoración preprocedimiento');
  const nextAmbulatoryPreprocedureVersionNumber =
    (latestAmbulatoryPreprocedureRecord?.metadata.versionNumber ?? 0) + 1;
  const latestAmbulatoryProcedureRecord = isAmbulatoryProcedureSection
    ? getLatestRecordByTab(activeTabRecords, 'Procedimiento')
    : getLatestRecordByTab(detail.sectionRecords, 'Procedimiento');
  const nextAmbulatoryProcedureVersionNumber =
    (latestAmbulatoryProcedureRecord?.metadata.versionNumber ?? 0) + 1;
  const latestAmbulatoryRecoveryEvaluationRecord =
    isAmbulatoryRecoveryEvaluationSection
      ? getLatestRecordByTab(activeTabRecords, 'Recuperación / Evaluación') ??
        getLatestRecordByTab(activeTabRecords, 'Recuperación / Evolución')
      : getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evaluación') ??
        getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evolución');
  const nextAmbulatoryRecoveryEvaluationVersionNumber =
    (latestAmbulatoryRecoveryEvaluationRecord?.metadata.versionNumber ?? 0) + 1;
  const latestAmbulatoryDischargePrescriptionRecord =
    isAmbulatoryDischargePrescriptionSection
      ? getLatestRecordByTab(activeTabRecords, 'Receta e indicaciones de egreso') ??
        getLatestRecordByTab(activeTabRecords, 'Indicaciones / Receta')
      : getLatestRecordByTab(detail.sectionRecords, 'Receta e indicaciones de egreso') ??
        getLatestRecordByTab(detail.sectionRecords, 'Indicaciones / Receta');
  const nextAmbulatoryDischargePrescriptionVersionNumber =
    (latestAmbulatoryDischargePrescriptionRecord?.metadata.versionNumber ?? 0) + 1;
  const latestAmbulatoryDischargeRecord = isAmbulatoryDischargeSection
    ? getLatestRecordByTab(activeTabRecords, 'Egreso')
    : getLatestRecordByTab(detail.sectionRecords, 'Egreso');
  const nextAmbulatoryDischargeVersionNumber =
    (latestAmbulatoryDischargeRecord?.metadata.versionNumber ?? 0) + 1;
  const isShowingRecordForm = isCreatingRecord || Boolean(selectedRecord);
  const isEpisodeClosed = detail.status === 'CLOSED';

  const startCreatingRecord = (noteType?: string) => {
    if (isEpisodeClosed) {
      setFeedback(
        'El episodio está cerrado y ya no permite nuevos registros ni documentos.',
      );
      return;
    }

    const nextRecordedAt = new Date().toISOString().slice(0, 16);

    if (isAmbulatoryProcedureSection) {
      if (!activeTabDefinition) {
        return;
      }

      const latestPreprocedureRecord = getLatestRecordByTab(
        detail.sectionRecords,
        'Valoración preprocedimiento',
      );
      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Procedimiento',
          title: buildAmbulatoryProcedureTitle(nextAmbulatoryProcedureVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildAmbulatoryProcedureSnapshot({
            detail,
            recordedAt: nextRecordedAt,
            preprocedureRecord: latestPreprocedureRecord,
            currentFormData: buildInitialStructuredSections(detail.encounterType)
              .Procedimiento as Record<string, RecordFieldValue>,
          }),
        }),
      );
      return;
    }

    if (isAmbulatoryRecoveryEvaluationSection) {
      if (!activeTabDefinition) {
        return;
      }

      const latestProcedureRecord = getLatestRecordByTab(
        detail.sectionRecords,
        'Procedimiento',
      );
      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Recuperación / Evaluación',
          title: buildAmbulatoryRecoveryEvaluationTitle(
            nextAmbulatoryRecoveryEvaluationVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildAmbulatoryRecoveryEvaluationSnapshot({
            detail,
            recordedAt: nextRecordedAt,
            procedureRecord: latestProcedureRecord,
            currentFormData: buildInitialStructuredSections(detail.encounterType)[
              'Recuperación / Evaluación'
            ] as Record<string, RecordFieldValue>,
          }),
        }),
      );
      return;
    }

    if (isAmbulatoryDischargePrescriptionSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Receta e indicaciones de egreso',
          title: buildAmbulatoryDischargePrescriptionTitle(
            nextAmbulatoryDischargePrescriptionVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildAmbulatoryDischargePrescriptionSnapshot({
            detail,
            recordedAt: nextRecordedAt,
            versionNumber: nextAmbulatoryDischargePrescriptionVersionNumber,
            currentFormData: buildInitialStructuredSections(detail.encounterType)[
              'Receta e indicaciones de egreso'
            ] as Record<string, RecordFieldValue>,
          }),
        }),
      );
      return;
    }

    if (isAmbulatoryDischargeSection) {
      if (!activeTabDefinition) {
        return;
      }

      const latestProcedure = getLatestRecordByTab(detail.sectionRecords, 'Procedimiento');
      const latestRecovery =
        getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evaluación') ??
        getLatestRecordByTab(detail.sectionRecords, 'Recuperación / Evolución');
      const latestPrescription =
        getLatestRecordByTab(detail.sectionRecords, 'Receta e indicaciones de egreso') ??
        getLatestRecordByTab(detail.sectionRecords, 'Indicaciones / Receta');
      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Egreso',
          title: buildAmbulatoryDischargeTitle(nextAmbulatoryDischargeVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildAmbulatoryDischargeSnapshot({
            detail,
            recordedAt: nextRecordedAt,
            procedureRecord: latestProcedure?.status === 'SIGNED' ? latestProcedure : null,
            recoveryRecord: latestRecovery?.status === 'SIGNED' ? latestRecovery : null,
            prescriptionRecord:
              latestPrescription?.status === 'SIGNED' ? latestPrescription : null,
            versionNumber: nextAmbulatoryDischargeVersionNumber,
            currentFormData: buildInitialStructuredSections(detail.encounterType)
              .Egreso as Record<string, RecordFieldValue>,
          }),
        }),
      );
      return;
    }

    if (isAmbulatoryPreprocedureSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Valoración preprocedimiento',
          title: buildAmbulatoryPreprocedureTitle(
            nextAmbulatoryPreprocedureVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildAmbulatoryPreprocedureSnapshot({
            detail,
            recordedAt: nextRecordedAt,
            currentFormData: buildInitialStructuredSections(detail.encounterType)[
              'Valoración preprocedimiento'
            ] as Record<string, RecordFieldValue>,
          }),
        }),
      );
      return;
    }

    if (isConsultationHistorySection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Historia clínica',
          title: `Historia clínica versión ${nextHistoryVersionNumber}`,
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: mergeHistoryReadOnlyFields(
            buildHistoryVersionPrefill(
              activeTabDefinition,
              latestHistoryRecord?.formData,
            ) as Record<string, RecordFieldValue>,
            detail,
          ),
        }),
      );
      return;
    }

    if (isConsultationCurrentSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Consulta actual',
          title: `Consulta versión ${nextConsultationVersionNumber}`,
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildConsultationVersionPrefill({
            tabDefinition: activeTabDefinition,
            previousConsultationFormData: latestConsultationRecord?.formData,
            detail,
            nextConsultationType,
          }),
        }),
      );
      return;
    }

    if (isConsultationEvolutionSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Evolución',
          title: `Evolución V${nextEvolutionVersionNumber}`,
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildEvolutionVersionPrefill({
            tabDefinition: activeTabDefinition,
            previousEvolutionRecord: latestEvolutionRecord,
            latestConsultationRecord: detail.sectionRecords.find(
              (record) => record.tabKey === 'Consulta actual',
            ),
            detail,
          }),
        }),
      );
      return;
    }

    if (isConsultationPrescriptionSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Receta médica',
          title: `Receta B${nextPrescriptionVersionNumber}`,
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildPrescriptionVersionPrefill({
            tabDefinition: activeTabDefinition,
            detail,
            encounterNumber: detail.encounterNumber,
            nextVersionNumber: nextPrescriptionVersionNumber,
            sessionUser: session?.user ?? null,
            encounterMeta: metaQuery.data ?? null,
          }),
        }),
      );
      return;
    }

    if (isConsultationDocumentsSection) {
      const nextNoteType =
        noteType ??
        activeTabPanelConfig?.noteTypes?.[0] ??
        getEpisodeDocumentTypes(detail.encounterType)[0];
      const nextTabDefinition =
        detail.encounterType === 'SURGERY'
          ? getAmbulatoryProcedureDocumentTabDefinition(nextNoteType)
          : detail.encounterType === 'HOSPITALIZATION'
          ? getHospitalDocumentTabDefinition(nextNoteType)
          : getConsultationDocumentTabDefinition(nextNoteType);

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: nextTabDefinition,
          noteType: nextNoteType,
          title: buildDocumentVersionTitle(nextNoteType, nextDocumentVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildDocumentVersionPrefill({
            noteType: nextNoteType,
            detail,
            nextVersionNumber: nextDocumentVersionNumber,
            sessionUser: session?.user ?? null,
            encounterMeta: metaQuery.data ?? null,
          }),
        }),
      );
      return;
    }

    if (isEmergencyTriageSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Triage',
          title: buildTriageTitle(nextTriageVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)['Triage'],
            tipoTriaje: emergencyInitialTriageType,
            fechaLlegada: nextRecordedAt,
            horaLlegada: nextRecordedAt,
            horaTriage: nextRecordedAt,
            ...buildTriageResponsibleSnapshot({
              sessionUser: session?.user ?? null,
              detail,
              recordedAt: nextRecordedAt,
            }),
            triageLegalMedico:
              session?.user.fullName ??
              detail.attendingClinician?.fullName ??
              'Sin profesional responsable',
            triageLegalCedula:
              session?.user.professionalLicense ??
              detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
          },
        }),
      );
      return;
    }

    if (isEmergencyInitialNoteSection) {
      if (latestEmergencyInitialNoteRecord) {
        openExistingRecord(latestEmergencyInitialNoteRecord.id);
        return;
      }
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Nota inicial',
          title: buildEmergencyInitialNoteTitle(),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)['Nota inicial'],
            ...buildEmergencyInitialNoteSnapshot({
              detail,
              triageRecord: latestTriageRecord,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isEmergencyNursingSheetSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Hoja de enfermería',
          title: buildEmergencyNursingSheetTitle(
            nextEmergencyNursingSheetVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: buildEmergencyNursingSheetSnapshot({
            detail,
            sessionUser: session?.user ?? null,
            currentFormData: buildInitialStructuredSections(detail.encounterType)[
              'Hoja de enfermería'
            ] as Record<string, RecordFieldValue>,
          }),
        }),
      );
      return;
    }

    if (isEmergencyEvolutionSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Evolución en urgencias',
          title: buildEmergencyEvolutionTitle(nextEmergencyEvolutionVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Evolución en urgencias'
            ],
            ...buildEmergencyEvolutionSnapshot({
              detail,
              initialNoteRecord: latestEmergencyInitialNoteRecord,
              previousEvolutionRecord: latestEmergencyEvolutionRecord,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isEmergencyOrdersSection) {
      if (!activeTabDefinition) {
        return;
      }
      const documentType = resolveEmergencyOrdersDocumentType(noteType);
      const latestDocumentRecord = [...activeTabRecords]
        .filter(
          (record) =>
            resolveEmergencyOrdersDocumentType(record.noteType, record.formData) ===
            documentType,
        )
        .sort((left, right) => {
          const leftVersion = left.metadata.versionNumber ?? 0;
          const rightVersion = right.metadata.versionNumber ?? 0;

          if (leftVersion !== rightVersion) {
            return rightVersion - leftVersion;
          }

          return right.recordedAt.localeCompare(left.recordedAt);
        })[0] ?? null;
      const nextDocumentVersionNumber =
        (latestDocumentRecord?.metadata.versionNumber ?? 0) + 1;

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: documentType,
          title: buildEmergencyOrdersTitle(nextDocumentVersionNumber, documentType),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Órdenes e indicaciones'
            ],
            ...buildEmergencyOrdersSnapshot({
              detail,
              initialNoteRecord: latestEmergencyInitialNoteRecord,
              evolutionRecord: latestEmergencyEvolutionRecord,
              documentType,
            }),
          },
        }),
      );
      return;
    }

    if (isEmergencyConsultationSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Interconsultas',
          title: buildEmergencyConsultationTitle(
            nextEmergencyConsultationVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType).Interconsultas,
            ...buildEmergencyConsultationSnapshot({
              detail,
              initialNoteRecord: latestEmergencyInitialNoteRecord,
              evolutionRecord: latestEmergencyEvolutionRecord,
              ordersRecord: latestEmergencyOrdersRecord,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isEmergencyDischargeSection) {
      if (!activeTabDefinition) {
        return;
      }

      if (latestEmergencyDischargeRecord) {
        setFeedback('Este episodio ya tiene un egreso de urgencias. Solo se permite uno.');
        setActiveRecordId(latestEmergencyDischargeRecord.id);
        setIsCreatingRecord(false);
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Egreso de urgencias',
          title: buildEmergencyDischargeTitle(),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Egreso de urgencias'
            ],
            ...buildEmergencyDischargeSnapshot({
              detail,
              triageRecord: latestTriageRecord,
              initialNoteRecord: latestEmergencyInitialNoteRecord,
              evolutionRecord: latestEmergencyEvolutionRecord,
              ordersRecord: latestEmergencyOrdersRecord,
              consultationRecord: latestEmergencyConsultationRecord,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalAdmissionSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Ingreso hospitalario',
          title: buildHospitalAdmissionTitle(nextHospitalAdmissionVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Ingreso hospitalario'
            ],
            ...buildHospitalAdmissionSnapshot({
              detail,
              emergencyDischargeRecord: latestEmergencyDischargeRecord,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalEvolutionSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Evolución hospitalaria',
          title: buildHospitalEvolutionTitle(nextHospitalEvolutionVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Evolución hospitalaria'
            ],
            ...buildHospitalEvolutionSnapshot({
              detail,
              admissionRecord: latestHospitalAdmissionRecord,
              previousEvolutionRecord: latestHospitalEvolutionRecord,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalMedicalOrdersSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Indicaciones médicas',
          title: buildHospitalMedicalOrdersTitle(
            nextHospitalMedicalOrdersVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Indicaciones médicas'
            ],
            ...buildHospitalMedicalOrdersSnapshot({
              detail,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalConsultationSection) {
      if (!activeTabDefinition) {
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Interconsultas',
          title: buildHospitalConsultationTitle(nextHospitalConsultationVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType).Interconsultas,
            ...buildHospitalConsultationSnapshot({
              detail,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalSurgicalSection) {
      if (!activeTabDefinition) {
        return;
      }

      const nextNoteType = noteType ?? 'Nota preoperatoria';
      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: nextNoteType,
          title: buildHospitalSurgicalTitle(nextHospitalSurgicalVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildHospitalSurgicalSnapshot({
              detail,
              recordedAt: nextRecordedAt,
              noteType: nextNoteType,
              nextVersion: nextHospitalSurgicalVersionNumber,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalNursingSection) {
      if (!activeTabDefinition) {
        return;
      }

      const nextNoteType = noteType ?? 'Turno Matutino';
      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: nextNoteType,
          title: buildHospitalNursingTitle(nextHospitalNursingVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildHospitalNursingSnapshot({
              detail,
              recordedAt: nextRecordedAt,
              noteType: nextNoteType,
            }),
          },
        }),
      );
      return;
    }

    if (isHospitalDischargeSection) {
      if (!activeTabDefinition) {
        return;
      }
      if (latestHospitalDischargeRecord) {
        setFeedback('Este episodio ya tiene un egreso hospitalario. Solo se permite uno por episodio.');
        return;
      }

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Egreso',
          title: buildHospitalDischargeTitle(),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildHospitalDischargeSnapshot({
              detail,
              recordedAt: nextRecordedAt,
            }),
          },
        }),
      );
      return;
    }

    const nextNoteType =
      noteType ??
      activeTabPanelConfig?.noteTypes?.[0] ??
      activeTabPanelConfig?.defaultActionLabel.replace(/^Nueva\s+/i, '') ??
      activeTab;

    setFeedback(null);
    setActiveRecordId(null);
    setIsCreatingRecord(true);
    setRecordForm(
      buildRecordFormState({
        tabDefinition: workspaceTabDefinition,
        noteType: nextNoteType,
        title: buildDefaultRecordTitle(nextNoteType),
        status: 'DRAFT',
        recordedAt: nextRecordedAt,
        rawFormData:
          structuredSections[activeTab] ??
          normalizeStructuredSections(detail)[activeTab] ??
          {},
      }),
    );
  };

  const openExistingRecord = (recordId: string) => {
    const record = activeTabRecords.find((item) => item.id === recordId);

    if (!record) {
      return;
    }

    setFeedback(null);
    setIsCreatingRecord(false);
    setActiveRecordId(record.id);
    setRecordForm(
      buildRecordFormState({
        tabDefinition:
          isConsultationDocumentsSection
            ? detail.encounterType === 'SURGERY'
              ? getAmbulatoryProcedureDocumentTabDefinition(record.noteType)
              : detail.encounterType === 'HOSPITALIZATION'
              ? getHospitalDocumentTabDefinition(record.noteType)
              : getConsultationDocumentTabDefinition(record.noteType)
            : workspaceTabDefinition,
        noteType: record.noteType,
        title: record.title,
        status: record.status,
        recordedAt: record.recordedAt.slice(0, 16),
        rawFormData: isConsultationHistorySection
          ? mergeHistoryReadOnlyFields(
              record.formData as Record<string, RecordFieldValue>,
              detail,
            )
          : isConsultationCurrentSection
            ? mergeConsultationSystemFields(
                record.formData as Record<string, RecordFieldValue>,
                detail,
              )
            : isConsultationEvolutionSection
              ? mergeEvolutionSystemFields(
                  record.formData as Record<string, RecordFieldValue>,
                  detail,
                  latestEvolutionRecord?.id === record.id
                    ? detail.sectionRecords
                        .filter(
                          (item) =>
                            item.tabKey === 'Evolución' && item.id !== record.id,
                        )
                        .sort((left, right) =>
                          right.recordedAt.localeCompare(left.recordedAt),
                        )[0] ?? null
                    : latestEvolutionRecord,
                )
              : isConsultationPrescriptionSection
                ? mergePrescriptionSystemFields(
                    record.formData as Record<string, RecordFieldValue>,
                    detail,
                    {
                      sessionUser: session?.user ?? null,
                      encounterMeta: metaQuery.data ?? null,
                    },
                  )
                : isConsultationDocumentsSection
                  ? mergeDocumentSystemFields(
                      record.formData as Record<string, RecordFieldValue>,
                      detail,
                      record.noteType,
                      {
                        sessionUser: session?.user ?? null,
                        encounterMeta: metaQuery.data ?? null,
                      },
                    )
                  : isEmergencyTriageSection
                    ? mergeEmergencyTriageSystemFields(
                        record.formData as Record<string, RecordFieldValue>,
                        detail,
                        session?.user ?? null,
                        record.recordedAt.slice(0, 16),
                      )
                    : isEmergencyInitialNoteSection
                      ? {
                          ...(record.formData as Record<string, RecordFieldValue>),
                          ...buildEmergencyInitialNoteSnapshot({
                            detail,
                            triageRecord: latestTriageRecord,
                            recordedAt: record.recordedAt.slice(0, 16),
                            currentFormData:
                              record.formData as Record<string, RecordFieldValue>,
                          }),
                        }
                      : isEmergencyEvolutionSection
                        ? {
                            ...(record.formData as Record<string, RecordFieldValue>),
                            ...buildEmergencyEvolutionSnapshot({
                              detail,
                              initialNoteRecord: latestEmergencyInitialNoteRecord,
                              previousEvolutionRecord:
                                detail.sectionRecords
                                  .filter(
                                    (item) =>
                                      item.tabKey === 'Evolución' &&
                                      item.id !== record.id,
                                  )
                                  .sort((left, right) =>
                                    right.recordedAt.localeCompare(left.recordedAt),
                                  )[0] ?? null,
                              recordedAt: record.recordedAt.slice(0, 16),
                              currentFormData:
                                record.formData as Record<string, RecordFieldValue>,
                            }),
                          }
                        : isEmergencyNursingSheetSection
                          ? (record.formData as Record<string, RecordFieldValue>)
                        : isEmergencyOrdersSection
                          ? {
                              ...(record.formData as Record<string, RecordFieldValue>),
                              ...buildEmergencyOrdersSnapshot({
                                detail,
                                initialNoteRecord: latestEmergencyInitialNoteRecord,
                                evolutionRecord: latestEmergencyEvolutionRecord,
                                documentType: resolveEmergencyOrdersDocumentType(
                                  record.noteType,
                                  record.formData,
                                ),
                                currentFormData:
                                  record.formData as Record<string, RecordFieldValue>,
                              }),
                            }
                          : isEmergencyConsultationSection
                            ? {
                                ...(record.formData as Record<string, RecordFieldValue>),
                                ...buildEmergencyConsultationSnapshot({
                                  detail,
                                  initialNoteRecord: latestEmergencyInitialNoteRecord,
                                  evolutionRecord: latestEmergencyEvolutionRecord,
                                  ordersRecord: latestEmergencyOrdersRecord,
                                  recordedAt: record.recordedAt.slice(0, 16),
                                  currentFormData:
                                    record.formData as Record<string, RecordFieldValue>,
                                }),
                              }
                            : isEmergencyDischargeSection
                              ? {
                                  ...(record.formData as Record<string, RecordFieldValue>),
                                  ...buildEmergencyDischargeSnapshot({
                                    detail,
                                    triageRecord: latestTriageRecord,
                                    initialNoteRecord: latestEmergencyInitialNoteRecord,
                                    evolutionRecord: latestEmergencyEvolutionRecord,
                                    ordersRecord: latestEmergencyOrdersRecord,
                                    consultationRecord: latestEmergencyConsultationRecord,
                                    recordedAt: record.recordedAt.slice(0, 16),
                                    currentFormData:
                                      record.formData as Record<string, RecordFieldValue>,
                                  }),
                                }
                              : isHospitalAdmissionSection
                                ? {
                                    ...(record.formData as Record<string, RecordFieldValue>),
                                    ...buildHospitalAdmissionSnapshot({
                                      detail,
                                      emergencyDischargeRecord: latestEmergencyDischargeRecord,
                                      recordedAt: record.recordedAt.slice(0, 16),
                                      currentFormData:
                                        record.formData as Record<string, RecordFieldValue>,
                                    }),
                                  }
                                : isHospitalEvolutionSection
                                  ? {
                                      ...(record.formData as Record<string, RecordFieldValue>),
                                      ...buildHospitalEvolutionSnapshot({
                                        detail,
                                        admissionRecord: latestHospitalAdmissionRecord,
                                        previousEvolutionRecord:
                                          detail.sectionRecords
                                            .filter(
                                              (item) =>
                                                item.tabKey === 'Evolución' &&
                                                item.id !== record.id,
                                            )
                                            .sort((left, right) =>
                                              right.recordedAt.localeCompare(
                                                left.recordedAt,
                                              ),
                                            )[0] ?? null,
                                        recordedAt: record.recordedAt.slice(0, 16),
                                        currentFormData:
                                          record.formData as Record<
                                            string,
                                            RecordFieldValue
                                          >,
                                      }),
                                    }
                                  : isHospitalMedicalOrdersSection
                                    ? {
                                        ...(record.formData as Record<
                                          string,
                                          RecordFieldValue
                                        >),
                                        ...buildHospitalMedicalOrdersSnapshot({
                                          detail,
                                          recordedAt: record.recordedAt.slice(0, 16),
                                          currentFormData:
                                            record.formData as Record<
                                              string,
                                              RecordFieldValue
                                          >,
                                        }),
                                      }
                                    : isHospitalConsultationSection
                                      ? {
                                          ...(record.formData as Record<
                                            string,
                                            RecordFieldValue
                                          >),
                                          ...buildHospitalConsultationSnapshot({
                                            detail,
                                            recordedAt: record.recordedAt.slice(0, 16),
                                            currentFormData:
                                              record.formData as Record<
                                                string,
                                                RecordFieldValue
                                              >,
                                          }),
                                        }
                                      : isHospitalSurgicalSection
                                        ? {
                                            ...(record.formData as Record<
                                              string,
                                              RecordFieldValue
                                            >),
                                            ...buildHospitalSurgicalSnapshot({
                                              detail,
                                              recordedAt: record.recordedAt.slice(0, 16),
                                              noteType: record.noteType,
                                              nextVersion:
                                                record.metadata.versionNumber ??
                                                nextHospitalSurgicalVersionNumber,
                                              currentFormData:
                                                record.formData as Record<
                                                  string,
                                                  RecordFieldValue
                                                >,
                                            }),
                                          }
                                        : isHospitalNursingSection
                                          ? {
                                              ...(record.formData as Record<
                                                string,
                                                RecordFieldValue
                                              >),
                                              ...buildHospitalNursingSnapshot({
                                                detail,
                                                recordedAt: record.recordedAt.slice(0, 16),
                                                noteType: record.noteType,
                                                currentFormData:
                                                  record.formData as Record<
                                                    string,
                                                    RecordFieldValue
                                                >,
                                              }),
                                            }
                                          : isHospitalDischargeSection
                                            ? {
                                                ...(record.formData as Record<
                                                  string,
                                                  RecordFieldValue
                                                >),
                                                ...buildHospitalDischargeSnapshot({
                                                  detail,
                                                  recordedAt: record.recordedAt.slice(0, 16),
                                                  currentFormData:
                                                    record.formData as Record<
                                                      string,
                                                      RecordFieldValue
                                                    >,
                                                }),
                                              }
                                            : isAmbulatoryPreprocedureSection
                                              ? {
                                                  ...(record.formData as Record<
                                                    string,
                                                    RecordFieldValue
                                                  >),
                                                  ...buildAmbulatoryPreprocedureSnapshot({
                                                    detail,
                                                    recordedAt: record.recordedAt.slice(0, 16),
                                                    currentFormData:
                                                      record.formData as Record<
                                                        string,
                                                        RecordFieldValue
                                                      >,
                                                  }),
                                                }
                                              : isAmbulatoryProcedureSection
                                                ? {
                                                    ...(record.formData as Record<
                                                      string,
                                                      RecordFieldValue
                                                    >),
                                                    ...buildAmbulatoryProcedureSnapshot({
                                                      detail,
                                                      recordedAt: record.recordedAt.slice(0, 16),
                                                      preprocedureRecord:
                                                        getLatestRecordByTab(
                                                          detail.sectionRecords,
                                                          'Valoración preprocedimiento',
                                                        )?.status === 'SIGNED'
                                                          ? getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Valoración preprocedimiento',
                                                            )
                                                          : null,
                                                      currentFormData:
                                                        record.formData as Record<
                                                          string,
                                                          RecordFieldValue
                                                      >,
                                                    }),
                                                  }
                                                : isAmbulatoryRecoveryEvaluationSection
                                                  ? {
                                                      ...(record.formData as Record<
                                                        string,
                                                        RecordFieldValue
                                                      >),
                                                      ...buildAmbulatoryRecoveryEvaluationSnapshot({
                                                        detail,
                                                        recordedAt: record.recordedAt.slice(0, 16),
                                                        procedureRecord:
                                                          getLatestRecordByTab(
                                                            detail.sectionRecords,
                                                            'Procedimiento',
                                                          )?.status === 'SIGNED'
                                                            ? getLatestRecordByTab(
                                                                detail.sectionRecords,
                                                                'Procedimiento',
                                                              )
                                                            : null,
                                                        currentFormData:
                                                          record.formData as Record<
                                                            string,
                                                            RecordFieldValue
                                                          >,
                                                      }),
                                                    }
                                                  : isAmbulatoryDischargePrescriptionSection
                                                    ? {
                                                        ...(record.formData as Record<
                                                          string,
                                                          RecordFieldValue
                                                        >),
                                                        ...buildAmbulatoryDischargePrescriptionSnapshot({
                                                          detail,
                                                          recordedAt: record.recordedAt.slice(0, 16),
                                                          currentFormData:
                                                            record.formData as Record<
                                                              string,
                                                              RecordFieldValue
                                                            >,
                                                          versionNumber:
                                                            record.metadata.versionNumber ??
                                                            1,
                                                        }),
                                                      }
                                                    : isAmbulatoryDischargeSection
                                                      ? {
                                                          ...(record.formData as Record<
                                                            string,
                                                            RecordFieldValue
                                                          >),
                                                          ...buildAmbulatoryDischargeSnapshot({
                                                            detail,
                                                            recordedAt: record.recordedAt.slice(0, 16),
                                                            currentFormData:
                                                              record.formData as Record<
                                                                string,
                                                                RecordFieldValue
                                                              >,
                                                            procedureRecord:
                                                              getLatestRecordByTab(
                                                                detail.sectionRecords,
                                                                'Procedimiento',
                                                              ),
                                                            recoveryRecord:
                                                              getLatestRecordByTab(
                                                                detail.sectionRecords,
                                                                'Recuperación / Evaluación',
                                                              ) ??
                                                              getLatestRecordByTab(
                                                                detail.sectionRecords,
                                                                'Recuperación / Evolución',
                                                              ),
                                                            prescriptionRecord:
                                                              getLatestRecordByTab(
                                                                detail.sectionRecords,
                                                                'Receta e indicaciones de egreso',
                                                              ) ??
                                                              getLatestRecordByTab(
                                                                detail.sectionRecords,
                                                                'Indicaciones / Receta',
                                                              ),
                                                            versionNumber:
                                                              record.metadata.versionNumber ??
                                                              1,
                                                          }),
                                                        }
                    : record.formData,
      }),
    );
  };

  const openHospitalSummaryRecord = (recordId: string) => {
    const record = detail.sectionRecords.find((item) => item.id === recordId);

    if (!record) {
      setFeedback('No se encontró el registro clínico seleccionado.');
      return;
    }

    const tabDefinition =
      record.tabKey === 'Documentos'
        ? getHospitalDocumentTabDefinition(record.noteType)
        : getEpisodeTabDefinition(detail.encounterType, record.tabKey);

    if (!tabDefinition) {
      setFeedback('No se encontró la configuración del tab de origen.');
      return;
    }

    setFeedback(null);
    setIsCreatingRecord(false);
    setActiveTab(record.tabKey);
    setActiveRecordId(record.id);
    setRecordForm(
      buildRecordFormState({
        tabDefinition,
        noteType: record.noteType,
        title: record.title,
        status: record.status,
        recordedAt: record.recordedAt.slice(0, 16),
        rawFormData: record.formData,
      }),
    );
  };

  const closeRecordWorkspace = () => {
    setIsCreatingRecord(false);
    setActiveRecordId(null);
    setRecordForm(null);
  };

  const openEmergencyNursingSheetRecord = (
    record: EncounterSectionRecordItem,
  ) => {
    const nursingSheetTabDefinition = getEpisodeTabDefinition(
      detail.encounterType,
      'Hoja de enfermería',
    );

    if (!nursingSheetTabDefinition) {
      setFeedback('No se encontró la configuración de Hoja de enfermería.');
      return;
    }

    setFeedback(null);
    setActiveTab('Hoja de enfermería');
    setIsCreatingRecord(false);
    setActiveRecordId(record.id);
    setRecordForm(
      buildRecordFormState({
        tabDefinition: nursingSheetTabDefinition,
        noteType: record.noteType,
        title: record.title,
        status: record.status,
        recordedAt: record.recordedAt.slice(0, 16),
        rawFormData: record.formData as Record<string, RecordFieldValue>,
      }),
    );
  };

  const openOrCreateEmergencyNursingSheet = async () => {
    if (latestEmergencyNursingSheetRecord) {
      openEmergencyNursingSheetRecord(latestEmergencyNursingSheetRecord);
      return;
    }

    const nursingSheetTabDefinition = getEpisodeTabDefinition(
      detail.encounterType,
      'Hoja de enfermería',
    );

    if (!nursingSheetTabDefinition || !session) {
      setFeedback('No se pudo abrir la Hoja de enfermería.');
      return;
    }

    const recordedAt = new Date().toISOString();
    const initialFormData = buildEmergencyNursingSheetSnapshot({
      detail,
      sessionUser: session.user ?? null,
      currentFormData: buildInitialStructuredSections(detail.encounterType)[
        'Hoja de enfermería'
      ] as Record<string, RecordFieldValue>,
    });

    setFeedback(null);
    setIsOpeningEmergencyNursingSheet(true);

    try {
      const updatedDetail = await createEncounterSectionRecord(
        session.accessToken,
        episodeNumber,
        {
          tabKey: 'Hoja de enfermería',
          noteType: 'Hoja de enfermería',
          title: buildEmergencyNursingSheetTitle(
            nextEmergencyNursingSheetVersionNumber,
          ),
          status: 'DRAFT',
          recordedAt,
          formData: initialFormData,
        },
      );
      const nursingSheetRecord = getLatestRecordByTab(
        updatedDetail.sectionRecords,
        'Hoja de enfermería',
      );

      queryClient.setQueryData(
        ['encounter-detail', episodeNumber],
        updatedDetail,
      );
      await refreshEncounterData();

      if (nursingSheetRecord) {
        openEmergencyNursingSheetRecord(nursingSheetRecord);
      } else {
        setFeedback('No se pudo cargar la Hoja de enfermería creada.');
      }
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la Hoja de enfermería.',
      );
    } finally {
      setIsOpeningEmergencyNursingSheet(false);
    }
  };

  const updateRecordFormField = <K extends keyof RecordFormState>(
    field: K,
    value: RecordFormState[K],
  ) => {
    setRecordForm((currentValue) =>
      currentValue
        ? (() => {
            if (field === 'recordedAt' && isHospitalEvolutionSection) {
              const recordedAt = value as string;

              return {
                ...currentValue,
                recordedAt,
                formData: {
                  ...currentValue.formData,
                  fechaHoraEvolucionHosp: recordedAt,
                  diaEstanciaHosp:
                    currentValue.formData.diaEstanciaHospManual === 'SI'
                      ? currentValue.formData.diaEstanciaHosp
                      : resolveHospitalEvolutionStayDay(
                          recordedAt,
                          currentValue.formData,
                        ),
                  turnoEvolHosp:
                    typeof currentValue.formData.turnoEvolHosp === 'string' &&
                    currentValue.formData.turnoEvolHosp.trim().length > 0
                      ? currentValue.formData.turnoEvolHosp
                      : resolveHospitalShiftValue(recordedAt),
                },
              };
            }

            return {
              ...currentValue,
              [field]: value,
            };
          })()
        : currentValue,
    );
  };

  const updateDocumentRecordType = (nextNoteType: string) => {
    if (!detail) {
      return;
    }

    const nextTabDefinition =
      detail.encounterType === 'SURGERY'
        ? getAmbulatoryProcedureDocumentTabDefinition(nextNoteType)
        : detail.encounterType === 'HOSPITALIZATION'
        ? getHospitalDocumentTabDefinition(nextNoteType)
        : getConsultationDocumentTabDefinition(nextNoteType);
    const nextVersionForType =
      [...activeTabRecords]
        .filter(
          (record) =>
            record.noteType === nextNoteType &&
            (!selectedRecord || record.id !== selectedRecord.id),
        )
        .sort((left, right) => {
          const leftVersion = left.metadata.versionNumber ?? 0;
          const rightVersion = right.metadata.versionNumber ?? 0;

          if (leftVersion !== rightVersion) {
            return rightVersion - leftVersion;
          }

          return right.recordedAt.localeCompare(left.recordedAt);
        })[0]?.metadata.versionNumber ?? 0;
    const nextVersionNumber = selectedRecord
      ? selectedRecord.metadata.versionNumber ?? 1
      : nextVersionForType + 1;

    setRecordForm((currentValue) =>
      currentValue
        ? buildRecordFormState({
            tabDefinition: nextTabDefinition,
            noteType: nextNoteType,
            title: buildDocumentVersionTitle(nextNoteType, nextVersionNumber),
            status: currentValue.status,
            recordedAt: currentValue.recordedAt,
            rawFormData: mergeDocumentSystemFields(
              currentValue.formData,
              detail,
              nextNoteType,
              {
                sessionUser: session?.user ?? null,
                encounterMeta: metaQuery.data ?? null,
              },
            ),
          })
        : currentValue,
    );
  };

  const updateRecordFormDataField = (fieldKey: string, value: RecordFieldValue) => {
    setRecordForm((currentValue) =>
      currentValue
        ? (() => {
            if (
              isHospitalEvolutionSection &&
              fieldKey === 'fechaHoraEvolucionHosp' &&
              typeof value === 'string'
            ) {
              return {
                ...currentValue,
                recordedAt: value,
                formData: {
                  ...currentValue.formData,
                  fechaHoraEvolucionHosp: value,
                  diaEstanciaHosp:
                    currentValue.formData.diaEstanciaHospManual === 'SI'
                      ? currentValue.formData.diaEstanciaHosp
                      : resolveHospitalEvolutionStayDay(value, currentValue.formData),
                  turnoEvolHosp:
                    typeof currentValue.formData.turnoEvolHosp === 'string' &&
                    currentValue.formData.turnoEvolHosp.trim().length > 0
                      ? currentValue.formData.turnoEvolHosp
                      : resolveHospitalShiftValue(value),
                },
              };
            }

            const nextFormData = {
              ...currentValue.formData,
              [fieldKey]: value,
            };
            if (
              isHospitalDischargeSection &&
              fieldKey === 'tipoEgresoHosp' &&
              typeof value === 'string'
            ) {
              if (
                hasHospitalDischargeIncompatibleCapture(
                  currentValue.formData,
                  value,
                ) &&
                !window.confirm(
                  'Cambiar el tipo de egreso limpiará datos condicionales que ya no correspondan. ¿Deseas continuar?',
                )
              ) {
                return currentValue;
              }

              Object.assign(
                nextFormData,
                buildHospitalDischargeConditionalCleanup(value),
              );
            }
            if (
              isHospitalDischargeSection &&
              fieldKey === 'fechaHoraEgresoHosp' &&
              typeof value === 'string'
            ) {
              const admittedAt =
                typeof nextFormData.fechaIngresoReadonlyHosp === 'string'
                  ? nextFormData.fechaIngresoReadonlyHosp
                  : detail.openedAt.slice(0, 16);

              nextFormData.diasEstanciaHosp = calculateHospitalStayDay(
                admittedAt,
                value,
              );
            }
            if (isHospitalEvolutionSection && fieldKey === 'diaEstanciaHosp') {
              nextFormData.diaEstanciaHospManual = 'SI';
            }
            if (
              isEmergencyTriageSection &&
              fieldKey === 'discOtro' &&
              value !== true
            ) {
              nextFormData[triageOtherClinicalDiscriminatorFieldKey] = '';
            }
            if (
              isEmergencyTriageSection &&
              fieldKey === 'requiereReevaluacion' &&
              value !== 'SI'
            ) {
              for (const reevaluationFieldKey of emergencyTriageConditionalReevaluationFields) {
                nextFormData[reevaluationFieldKey] = '';
              }
            }
            if (
              isEmergencyTriageSection &&
              fieldKey === 'ingresoPorReferencia' &&
              value !== 'SI'
            ) {
              for (const referenceFieldKey of emergencyTriageConditionalReferenceFields) {
                nextFormData[referenceFieldKey] = '';
              }
            }
            if (
              isEmergencyTriageSection &&
              fieldKey === 'parentescoAcompanante' &&
              value === 'NINGUNO'
            ) {
              nextFormData.telefonoAcompanante = '';
            }
            if (
              isHospitalNursingSection &&
              (fieldKey === 'ingresosMlEnfHosp' ||
                fieldKey === 'egresosMlEnfHosp')
            ) {
              const intake = readNumericFormValue(nextFormData.ingresosMlEnfHosp);
              const output = readNumericFormValue(nextFormData.egresosMlEnfHosp);
              nextFormData.balanceTotalEnfHosp =
                intake !== null || output !== null
                  ? String((intake ?? 0) - (output ?? 0))
                  : '';
            }
            if (
              isAmbulatoryProcedureSection &&
              (fieldKey === 'fechaProcedimientoProc' ||
                fieldKey === 'horaInicioRealProc' ||
                fieldKey === 'horaFinRealProc')
            ) {
              const nextDuration = calculateDurationMinutes(
                typeof nextFormData.fechaProcedimientoProc === 'string'
                  ? nextFormData.fechaProcedimientoProc
                  : '',
                typeof nextFormData.horaInicioRealProc === 'string'
                  ? nextFormData.horaInicioRealProc
                  : '',
                typeof nextFormData.horaFinRealProc === 'string'
                  ? nextFormData.horaFinRealProc
                  : '',
              );
              nextFormData.duracionMinutosProc = nextDuration;
            }
            return {
              ...currentValue,
              formData: nextFormData,
            };
          })()
        : currentValue,
    );
  };

  const saveRecord = (statusOverride?: string) => {
    if (!recordForm) {
      return;
    }

    setFeedback(null);

    if (isEmergencyTriageSection) {
      const missingClinicalQuickStateFields =
        emergencyTriageClinicalQuickStateFieldKeys.filter((fieldKey) => {
          const value = recordForm.formData[fieldKey];
          return typeof value !== 'string' || value.trim().length === 0;
        });

      if (missingClinicalQuickStateFields.length > 0) {
        setFeedback(
          `Completa Estado clínico rápido: ${missingClinicalQuickStateFields
            .map((fieldKey) => emergencyTriageClinicalQuickStateFieldLabels[fieldKey])
            .join(', ')}.`,
        );
        return;
      }

      const invalidClinicalQuickStateFields =
        emergencyTriageClinicalQuickStateFieldKeys.filter((fieldKey) => {
          const value = recordForm.formData[fieldKey];
          return (
            typeof value !== 'string' ||
            !emergencyTriageClinicalQuickStateAllowedValues[fieldKey].includes(value)
          );
        });

      if (invalidClinicalQuickStateFields.length > 0) {
        setFeedback(
          `Actualiza Estado clínico rápido: ${invalidClinicalQuickStateFields
            .map((fieldKey) => emergencyTriageClinicalQuickStateFieldLabels[fieldKey])
            .join(', ')}.`,
        );
        return;
      }

      const destinoInicial =
        typeof recordForm.formData.destinoInicial === 'string'
          ? recordForm.formData.destinoInicial
          : '';
      const requiereReevaluacion =
        typeof recordForm.formData.requiereReevaluacion === 'string'
          ? recordForm.formData.requiereReevaluacion
          : '';

      if (!emergencyTriageDestinationAllowedValues.includes(destinoInicial)) {
        setFeedback('Selecciona un destino inicial válido.');
        return;
      }

      if (!emergencyTriageReevaluationRequiredValues.includes(requiereReevaluacion)) {
        setFeedback('Indica si el paciente requiere reevaluación.');
        return;
      }

      if (requiereReevaluacion === 'SI') {
        const missingReevaluationFields =
          emergencyTriageConditionalReevaluationFields.filter((fieldKey) => {
            const value = recordForm.formData[fieldKey];
            return typeof value !== 'string' || value.trim().length === 0;
          });

        if (missingReevaluationFields.length > 0) {
          setFeedback(
            `Completa reevaluación: ${missingReevaluationFields
              .map((fieldKey) => emergencyTriageStructuredDestinationFieldLabels[fieldKey])
              .join(', ')}.`,
          );
          return;
        }

        const nuevaPrioridad =
          typeof recordForm.formData.nuevaPrioridadReevaluacion === 'string'
            ? recordForm.formData.nuevaPrioridadReevaluacion
            : '';
        const horaReevaluacion =
          typeof recordForm.formData.horaReevaluacion === 'string'
            ? recordForm.formData.horaReevaluacion
            : '';

        if (!emergencyTriageReevaluationTimePattern.test(horaReevaluacion)) {
          setFeedback('Captura una hora de reevaluación válida.');
          return;
        }

        if (!emergencyTriageReevaluationPriorityValues.includes(nuevaPrioridad)) {
          setFeedback('Selecciona una nueva prioridad válida.');
          return;
        }
      }

      const procedenciaIngreso =
        typeof recordForm.formData.procedenciaIngreso === 'string'
          ? recordForm.formData.procedenciaIngreso
          : '';
      const ingresoPorReferencia =
        typeof recordForm.formData.ingresoPorReferencia === 'string'
          ? recordForm.formData.ingresoPorReferencia
          : '';
      const parentescoAcompanante =
        typeof recordForm.formData.parentescoAcompanante === 'string'
          ? recordForm.formData.parentescoAcompanante
          : '';
      const telefonoAcompanante =
        typeof recordForm.formData.telefonoAcompanante === 'string'
          ? recordForm.formData.telefonoAcompanante.trim()
          : '';

      if (!emergencyTriageOriginAllowedValues.includes(procedenciaIngreso)) {
        setFeedback('Selecciona una procedencia válida.');
        return;
      }

      if (!emergencyTriageReferenceAdmissionValues.includes(ingresoPorReferencia)) {
        setFeedback('Indica si el ingreso es por referencia.');
        return;
      }

      if (
        ingresoPorReferencia === 'SI' &&
        (typeof recordForm.formData.unidadQueRefiere !== 'string' ||
          recordForm.formData.unidadQueRefiere.trim().length === 0)
      ) {
        setFeedback('Captura la unidad que refiere.');
        return;
      }

      if (
        parentescoAcompanante &&
        !emergencyTriageCompanionRelationshipValues.includes(parentescoAcompanante)
      ) {
        setFeedback('Selecciona un parentesco válido para el acompañante.');
        return;
      }

      if (
        telefonoAcompanante &&
        !emergencyTriagePhonePattern.test(telefonoAcompanante)
      ) {
        setFeedback('Captura un teléfono de acompañante válido.');
        return;
      }

      const missingInitialStateFields = Object.entries(
        emergencyTriageInitialStateFieldLabels,
      ).filter(([fieldKey]) => {
        const value = recordForm.formData[fieldKey];
        return typeof value !== 'string' || value.trim().length === 0;
      });

      if (missingInitialStateFields.length > 0) {
        setFeedback(
          `Completa Estado general y mental inicial: ${missingInitialStateFields
            .map(([, label]) => label)
            .join(', ')}.`,
        );
        return;
      }

      const invalidInitialStateFields = Object.entries(
        emergencyTriageInitialStateAllowedValues,
      ).filter(([fieldKey, allowedValues]) => {
        const value = recordForm.formData[fieldKey];
        return typeof value !== 'string' || !allowedValues.includes(value);
      });

      if (invalidInitialStateFields.length > 0) {
        setFeedback(
          `Estado general y mental inicial contiene valores no permitidos: ${invalidInitialStateFields
            .map(([fieldKey]) => emergencyTriageInitialStateFieldLabels[fieldKey])
            .join(', ')}.`,
        );
        return;
      }
    }

    const emergencyOrdersPayloadDocumentType = isEmergencyOrdersSection
      ? resolveEmergencyOrdersDocumentType(recordForm.noteType, recordForm.formData)
      : null;
    const payload = {
      tabKey: activeRecordTabKey,
      noteType: emergencyOrdersPayloadDocumentType ?? recordForm.noteType.trim(),
      title:
        emergencyOrdersPayloadDocumentType
          ? buildEmergencyOrdersTitle(
              selectedRecord?.metadata.versionNumber ??
                nextEmergencyOrdersVersionNumberForCurrentType,
              emergencyOrdersPayloadDocumentType,
            )
          : recordForm.title.trim() || undefined,
      status: (statusOverride ?? recordForm.status) || undefined,
      recordedAt: recordForm.recordedAt
        ? new Date(recordForm.recordedAt).toISOString()
        : undefined,
      formData: isConsultationHistorySection
        ? mergeHistoryReadOnlyFields(recordForm.formData, detail)
        : isConsultationCurrentSection
          ? mergeConsultationSystemFields(recordForm.formData, detail)
          : isConsultationEvolutionSection
            ? mergeEvolutionSystemFields(
                recordForm.formData,
                detail,
                latestEvolutionRecord,
              )
            : isConsultationPrescriptionSection
              ? mergePrescriptionSystemFields(recordForm.formData, detail, {
                  sessionUser: session?.user ?? null,
                  encounterMeta: metaQuery.data ?? null,
                })
              : isConsultationDocumentsSection
                ? mergeDocumentSystemFields(
                    recordForm.formData,
                    detail,
                    recordForm.noteType,
                    {
                      sessionUser: session?.user ?? null,
                      encounterMeta: metaQuery.data ?? null,
                    },
                  )
                : isEmergencyTriageSection
                  ? mergeEmergencyTriageSystemFields(
                      recordForm.formData,
                      detail,
                      session?.user ?? null,
                      recordForm.recordedAt,
                    )
                  : isEmergencyInitialNoteSection
                    ? {
                        ...recordForm.formData,
                        ...buildEmergencyInitialNoteSnapshot({
                          detail,
                          triageRecord: latestTriageRecord,
                          recordedAt: recordForm.recordedAt,
                          currentFormData: recordForm.formData,
                        }),
                      }
                    : isEmergencyNursingSheetSection
                      ? buildEmergencyNursingSheetSnapshot({
                          detail,
                          sessionUser: session?.user ?? null,
                          currentFormData: recordForm.formData,
                        })
                    : isEmergencyEvolutionSection
                      ? {
                          ...recordForm.formData,
                          ...buildEmergencyEvolutionSnapshot({
                            detail,
                            initialNoteRecord: latestEmergencyInitialNoteRecord,
                            previousEvolutionRecord: latestEmergencyEvolutionRecord,
                            recordedAt: recordForm.recordedAt,
                            currentFormData: recordForm.formData,
                          }),
                        }
                      : isEmergencyOrdersSection
                        ? {
                            ...recordForm.formData,
                            ...buildEmergencyOrdersSnapshot({
                              detail,
                              initialNoteRecord: latestEmergencyInitialNoteRecord,
                              evolutionRecord: latestEmergencyEvolutionRecord,
                              documentType: resolveEmergencyOrdersDocumentType(
                                recordForm.noteType,
                                recordForm.formData,
                              ),
                              currentFormData: recordForm.formData,
                            }),
                          }
                        : isEmergencyConsultationSection
                          ? {
                              ...recordForm.formData,
                              ...buildEmergencyConsultationSnapshot({
                                detail,
                                initialNoteRecord: latestEmergencyInitialNoteRecord,
                                evolutionRecord: latestEmergencyEvolutionRecord,
                                ordersRecord: latestEmergencyOrdersRecord,
                                recordedAt: recordForm.recordedAt,
                                currentFormData: recordForm.formData,
                              }),
                            }
                          : isEmergencyDischargeSection
                            ? {
                                ...recordForm.formData,
                                ...buildEmergencyDischargeSnapshot({
                                  detail,
                                  triageRecord: latestTriageRecord,
                                  initialNoteRecord: latestEmergencyInitialNoteRecord,
                                  evolutionRecord: latestEmergencyEvolutionRecord,
                                  ordersRecord: latestEmergencyOrdersRecord,
                                  consultationRecord: latestEmergencyConsultationRecord,
                                  recordedAt: recordForm.recordedAt,
                                  currentFormData: recordForm.formData,
                                }),
                              }
                            : isHospitalAdmissionSection
                              ? {
                                  ...recordForm.formData,
                                  ...buildHospitalAdmissionSnapshot({
                                    detail,
                                    emergencyDischargeRecord:
                                      latestEmergencyDischargeRecord,
                                    recordedAt: recordForm.recordedAt,
                                    currentFormData: recordForm.formData,
                                  }),
                                }
                              : isHospitalEvolutionSection
                                ? {
                                    ...recordForm.formData,
                                    ...buildHospitalEvolutionSnapshot({
                                      detail,
                                      admissionRecord: latestHospitalAdmissionRecord,
                                      previousEvolutionRecord:
                                        latestHospitalEvolutionRecord,
                                      recordedAt: recordForm.recordedAt,
                                      currentFormData: recordForm.formData,
                                    }),
                                  }
                                : isHospitalMedicalOrdersSection
                                  ? {
                                      ...recordForm.formData,
                                      ...buildHospitalMedicalOrdersSnapshot({
                                        detail,
                                        recordedAt: recordForm.recordedAt,
                                        currentFormData: recordForm.formData,
                                      }),
                                    }
                                  : isHospitalConsultationSection
                                    ? {
                                        ...recordForm.formData,
                                        ...buildHospitalConsultationSnapshot({
                                          detail,
                                          recordedAt: recordForm.recordedAt,
                                          currentFormData: recordForm.formData,
                                        }),
                                      }
                                    : isHospitalSurgicalSection
                                      ? {
                                          ...recordForm.formData,
                                          ...buildHospitalSurgicalSnapshot({
                                            detail,
                                            recordedAt: recordForm.recordedAt,
                                            noteType: recordForm.noteType,
                                            nextVersion:
                                              selectedRecord?.metadata.versionNumber ??
                                              nextHospitalSurgicalVersionNumber,
                                            currentFormData: recordForm.formData,
                                          }),
                                        }
                                      : isHospitalNursingSection
                                        ? {
                                            ...recordForm.formData,
                                            ...buildHospitalNursingSnapshot({
                                              detail,
                                              recordedAt: recordForm.recordedAt,
                                              noteType: recordForm.noteType,
                                            currentFormData: recordForm.formData,
                                          }),
                                        }
                                        : isHospitalDischargeSection
                                          ? {
                                              ...recordForm.formData,
                                              ...buildHospitalDischargeSnapshot({
                                                detail,
                                                recordedAt: recordForm.recordedAt,
                                                currentFormData: recordForm.formData,
                                              }),
                                            }
                                          : isAmbulatoryPreprocedureSection
                                            ? {
                                                ...recordForm.formData,
                                                ...buildAmbulatoryPreprocedureSnapshot({
                                                  detail,
                                                  recordedAt: recordForm.recordedAt,
                                                  currentFormData: recordForm.formData,
                                                }),
                                              }
                                            : isAmbulatoryProcedureSection
                                              ? {
                                                  ...recordForm.formData,
                                                  ...buildAmbulatoryProcedureSnapshot({
                                                    detail,
                                                    recordedAt: recordForm.recordedAt,
                                                    preprocedureRecord:
                                                      getLatestRecordByTab(
                                                        detail.sectionRecords,
                                                        'Valoración preprocedimiento',
                                                      )?.status === 'SIGNED'
                                                        ? getLatestRecordByTab(
                                                            detail.sectionRecords,
                                                            'Valoración preprocedimiento',
                                                          )
                                                        : null,
                                                    currentFormData: recordForm.formData,
                                                  }),
                                                }
                                              : isAmbulatoryRecoveryEvaluationSection
                                                ? {
                                                    ...recordForm.formData,
                                                    ...buildAmbulatoryRecoveryEvaluationSnapshot({
                                                      detail,
                                                      recordedAt: recordForm.recordedAt,
                                                      procedureRecord:
                                                        getLatestRecordByTab(
                                                          detail.sectionRecords,
                                                          'Procedimiento',
                                                        )?.status === 'SIGNED'
                                                          ? getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Procedimiento',
                                                            )
                                                          : null,
                                                      currentFormData:
                                                        recordForm.formData,
                                                    }),
                                                  }
                                                : isAmbulatoryDischargePrescriptionSection
                                                  ? {
                                                      ...recordForm.formData,
                                                      ...buildAmbulatoryDischargePrescriptionSnapshot({
                                                        detail,
                                                        recordedAt: recordForm.recordedAt,
                                                        currentFormData:
                                                          recordForm.formData,
                                                        versionNumber:
                                                          selectedRecord?.metadata
                                                            .versionNumber ??
                                                          nextAmbulatoryDischargePrescriptionVersionNumber,
                                                      }),
                                                    }
                                                  : isAmbulatoryDischargeSection
                                                    ? {
                                                        ...recordForm.formData,
                                                        ...buildAmbulatoryDischargeSnapshot({
                                                          detail,
                                                          recordedAt: recordForm.recordedAt,
                                                          currentFormData:
                                                            recordForm.formData,
                                                          procedureRecord:
                                                            getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Procedimiento',
                                                            ),
                                                          recoveryRecord:
                                                            getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Recuperación / Evaluación',
                                                            ) ??
                                                            getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Recuperación / Evolución',
                                                            ),
                                                          prescriptionRecord:
                                                            getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Receta e indicaciones de egreso',
                                                            ) ??
                                                            getLatestRecordByTab(
                                                              detail.sectionRecords,
                                                              'Indicaciones / Receta',
                                                            ),
                                                          versionNumber:
                                                            selectedRecord?.metadata
                                                              .versionNumber ??
                                                            nextAmbulatoryDischargeVersionNumber,
                                                        }),
                                                      }
                                          : recordForm.formData,
    };

    if (selectedRecord) {
      updateRecordMutation.mutate({
        recordId: selectedRecord.id,
        ...payload,
      });
      return;
    }

    createRecordMutation.mutate(payload);
  };

  const openSignModal = () => {
    setFeedback(null);
    setSignaturePassword('');
    setIsSigningRecord(true);
  };

  const confirmSignature = () => {
    if (!selectedRecord) {
      setFeedback('Guarda el registro antes de firmarlo.');
      return;
    }

    if (
      isEmergencyEvolutionSection &&
      !hasValidEmergencyEvolutionDiagnosis(recordForm?.formData.diagnosticosEvolucionUrg)
    ) {
      setFeedback('Debes agregar al menos un diagnóstico antes de firmar la nota.');
      return;
    }

    if (isEmergencyEvolutionSection) {
      const diagnosticResultValidationMessage =
        getEmergencyEvolutionDiagnosticResultValidationMessage(
          recordForm?.formData.resultadosAuxiliaresDiagnosticoUrg,
        );

      if (diagnosticResultValidationMessage) {
        setFeedback(diagnosticResultValidationMessage);
        return;
      }
    }

    if (!signaturePassword.trim()) {
      setFeedback('Captura tu contraseña para firmar el registro.');
      return;
    }

    setFeedback(null);
    signRecordMutation.mutate({
      recordId: selectedRecord.id,
      password: signaturePassword,
    });
  };

  const correctInitialNote = () => {
    if (!selectedRecord) {
      return;
    }

    const reason = window.prompt('Motivo de corrección (opcional)') ?? undefined;
    correctInitialNoteMutation.mutate({
      recordId: selectedRecord.id,
      reason,
    });
  };

  const historyVersionNumber =
    selectedRecord?.metadata.versionNumber ?? nextHistoryVersionNumber;
  const currentHistoryType =
    historyVersionNumber === 1 ? 'INICIAL' : nextHistoryType;
  const historyTypeLabel = getHistoryTypeLabel(
    currentHistoryType,
  );
  const inheritedFromLabel =
    isConsultationHistorySection && !selectedRecord && latestHistoryRecord
      ? `Precargada desde ${latestHistoryRecord.title}`
      : selectedRecord?.metadata.inheritedFromRecordId
        ? `Heredada de una versión previa`
        : null;
  const consultationVersionNumber =
    selectedRecord?.metadata.versionNumber ?? nextConsultationVersionNumber;
  const currentConsultationType =
    (selectedRecord?.metadata.consultationType as
      | 'PRIMERA_VEZ'
      | 'SUBSECUENTE'
      | null) ?? nextConsultationType;
  const consultationTypeLabel = getConsultationTypeLabel(currentConsultationType);
  const evolutionVersionNumber =
    selectedRecord?.metadata.versionNumber ?? nextEvolutionVersionNumber;
  const prescriptionVersionNumber =
    selectedRecord?.metadata.versionNumber ?? nextPrescriptionVersionNumber;
  const documentVersionNumber =
    selectedRecord?.metadata.versionNumber ?? nextDocumentVersionNumber;
  const isRecordLocked = recordForm?.status === 'SIGNED';
  const currentPrescriptionLegalSnapshot =
    isConsultationPrescriptionSection && detail
      ? buildPrescriptionLegalSnapshotWithFallback({
          detail,
          sessionUser: session?.user ?? null,
          encounterMeta: metaQuery.data ?? null,
        })
      : null;
  const prescriptionSafetyAlerts =
    isConsultationPrescriptionSection && recordForm
      ? buildPrescriptionSafetyAlerts(detail, recordForm.formData)
      : [];
  const currentDocumentLegalSnapshot =
    isConsultationDocumentsSection && detail
      ? buildDocumentLegalSnapshot(
          detail,
          session?.user ?? null,
          metaQuery.data ?? null,
        )
      : null;

  const submitPendingFiles = () => {
    if (isEpisodeClosed) {
      setFeedback(
        'El episodio está cerrado y ya no permite cargar ni modificar adjuntos.',
      );
      return;
    }

    if (!pendingFiles.length) {
      setFeedback('Selecciona al menos un archivo para cargar.');
      return;
    }

    setFeedback(null);
    uploadAttachmentsMutation.mutate(pendingFiles);
  };

  const selectDeathCertificateFiles = (files: File[]) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const validFiles = files.filter((file) => allowedMimeTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      setFeedback('El certificado solo permite archivos PDF, JPG o PNG.');
    }

    setPendingFiles(validFiles);

    if (validFiles.length > 0) {
      updateRecordFormDataField(
        'registroFechaHoraCertificadoDefuncionUrg',
        new Date().toISOString().slice(0, 16),
      );
    }
  };

  const getInitials = (name?: string) =>
    name
      ?.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  const isEmergencySummaryTab =
    detail.encounterType === 'EMERGENCY' && activeTab === 'Resumen';
  const emergencySummary = isEmergencySummaryTab ? detail.emergencySummary : null;
  const formatEmergencySummaryValue = (label: string, value: string) => {
    if (label.startsWith('Fecha')) {
      return formatDateTime(value);
    }

    if (label === 'Estado') {
      return encounterStatusConfig[value]?.label ?? value;
    }

    return value === value.toUpperCase() && value.includes('_')
      ? value
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/^\w/, (letter) => letter.toUpperCase())
      : value;
  };
  const openLinkedEmergencyNursingSheet = (recordId: string) => {
    const nursingSheetRecord = detail.sectionRecords.find(
      (record) => record.id === recordId && record.tabKey === 'Hoja de enfermería',
    );
    const nursingSheetTabDefinition = getEpisodeTabDefinition(
      detail.encounterType,
      'Hoja de enfermería',
    );

    if (!nursingSheetRecord || !nursingSheetTabDefinition) {
      setFeedback('No se encontró la Hoja de enfermería vinculada.');
      return;
    }

    setIsCreatingRecord(false);
    setFeedback(null);
    setActiveTab('Hoja de enfermería');
    setActiveRecordId(nursingSheetRecord.id);
    setRecordForm(
      buildRecordFormState({
        tabDefinition: nursingSheetTabDefinition,
        noteType: nursingSheetRecord.noteType,
        title: nursingSheetRecord.title,
        status: nursingSheetRecord.status,
        recordedAt: nursingSheetRecord.recordedAt.slice(0, 16),
        rawFormData: nursingSheetRecord.formData,
      }),
    );
  };
  const currentTreatmentGroups: Array<[string, string[]]> = emergencySummary
    ? [
        ['Medicamentos', emergencySummary.clinicalSummary.currentTreatment.medications],
        ['Soluciones IV', emergencySummary.clinicalSummary.currentTreatment.solutions],
        ['Estudios', emergencySummary.clinicalSummary.currentTreatment.studies],
        ['Cuidados e indicaciones', emergencySummary.clinicalSummary.currentTreatment.care],
      ]
    : [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <button
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/episodios')}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a episodios
        </button>

        <div className="clinical-card p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-primary font-semibold">
                  {getInitials(detail.patient?.fullName) || 'P'}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                    {detail.patient.fullName}
                  </h1>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                      typeConfig?.className ??
                      'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {detail.encounterType === 'HOSPITALIZATION'
                      ? 'Hospitalización'
                      : typeConfig?.label ?? detail.encounterType}
                  </div>
                  <Badge variant={statusConfig.badgeVariant}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="text-primary">
                    {detail.encounterNumber}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {[detail.patient.sexAtBirth, detail.patient.ageLabel]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {!isEmergencySummaryTab && !isHospitalSummaryTab ? (
                    <span className="text-xs text-muted-foreground/70">
                      {detail.patient.curp ?? 'Sin CURP'}
                    </span>
                  ) : null}
                  {!isHospitalSummaryTab ? (
                    <span className="text-xs text-muted-foreground/70">
                      Exp: {detail.medicalRecord.recordNumber}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {detail.facility?.name ? (
                    <span className="text-xs text-muted-foreground/70">
                      {detail.facility.name}
                    </span>
                  ) : null}
                  {!isEmergencySummaryTab && !isHospitalSummaryTab ? (
                    <span className="text-xs text-muted-foreground/70">
                      {detail.serviceArea?.name ??
                        detail.specialty?.name ??
                        'Sin area clinica'}
                    </span>
                  ) : detail.specialty?.name ? (
                    <span className="text-xs text-muted-foreground/70">
                      {detail.specialty.name}
                    </span>
                  ) : null}
                  {detail.attendingClinician?.fullName ? (
                    <span className="text-xs text-muted-foreground/70">
                      {detail.attendingClinician.fullName}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground/70">
                    Ingreso {formatDateTime(hospitalSummary?.admissionAt ?? detail.openedAt)}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    Actualizado {formatDateTime(detail.updatedAt)}
                  </span>
                </div>

                {detail.patient.allergiesSummary.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detail.patient.allergiesSummary.map((allergy) => (
                      <Badge key={allergy} variant="alert">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {!isEmergencySummaryTab && !isHospitalSummaryTab ? (
            <div className="flex gap-2">
              <Button
                className="gap-1.5"
                disabled={updateMutation.isPending || isEpisodeClosed}
                onClick={saveChanges}
                type="button"
              >
                {updateMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
            {isHospitalSummaryTab ? (
              <>
                {detail.facility?.name ? (
                  <InfoRow label="Hospital / sede" value={detail.facility.name} />
                ) : null}
                {detail.attendingClinician?.fullName ? (
                  <InfoRow
                    label="Responsable clínico"
                    value={detail.attendingClinician.fullName}
                  />
                ) : null}
                <InfoRow
                  label="Fecha de ingreso"
                  value={formatDateTime(hospitalSummary?.admissionAt ?? detail.openedAt)}
                />
                <InfoRow label="Última actualización" value={formatDateTime(detail.updatedAt)} />
              </>
            ) : isEmergencySummaryTab ? (
              detail.reasonForVisit ? (
                <InfoRow label="Motivo" value={detail.reasonForVisit} />
              ) : null
            ) : (
              <>
                <InfoRow label="Motivo" value={detail.reasonForVisit ?? 'Sin motivo'} />
                <InfoRow
                  label="Origen"
                  value={admissionSourceLabels[detail.admissionSource ?? ''] ?? 'Sin origen'}
                />
              </>
            )}
            {!isHospitalSummaryTab ? (
              <InfoRow label="Actualizado" value={formatDateTime(detail.updatedAt)} />
            ) : null}
            {!isHospitalSummaryTab && (detail.closedAt || !isEmergencySummaryTab) ? (
              <InfoRow label="Cierre" value={formatDateTime(detail.closedAt)} />
            ) : null}
          </div>
        </div>

        <div className="sticky top-[72px] z-20 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
            {tabs.map((tab) => (
              <button
                className={`rounded-xl flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-xs font-medium transition ${
                  tab === activeTab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`grid gap-6 ${
            isEmergencySummaryTab || isHospitalSummaryTab ? '' : 'xl:grid-cols-[1.55fr_0.95fr]'
          }`}
        >
          <div className="space-y-6">
            {activeTab === 'Resumen' ? (
              isEmergencySummaryTab ? (
                emergencySummary ? (
                  <>
                    <SectionCard
                      description="Datos operativos mínimos del episodio."
                      title="Datos base del episodio"
                      icon={LayoutDashboard}
                    >
                      {emergencySummary.baseData.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {emergencySummary.baseData.map((item) => (
                            <div
                              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                              key={item.label}
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-900">
                                {formatEmergencySummaryValue(item.label, item.value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin datos base disponibles
                        </p>
                      )}
                    </SectionCard>

                    <SectionCard
                      description="Vista clínica consolidada de las fuentes documentales del episodio."
                      title="Resumen clínico"
                      icon={Stethoscope}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Motivo de consulta
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-900">
                            {emergencySummary.clinicalSummary.chiefComplaint ??
                              'Sin motivo de consulta documentado'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Diagnóstico principal
                          </p>
                          {emergencySummary.clinicalSummary.primaryDiagnosis ? (
                            <div className="mt-2 space-y-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {emergencySummary.clinicalSummary.primaryDiagnosis.label}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {emergencySummary.clinicalSummary.primaryDiagnosis.code ? (
                                  <Badge variant="secondary">
                                    CIE-10{' '}
                                    {emergencySummary.clinicalSummary.primaryDiagnosis.code}
                                  </Badge>
                                ) : null}
                                <Badge variant="draft">
                                  {emergencySummary.clinicalSummary.primaryDiagnosis.source}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Sin diagnóstico principal documentado
                            </p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Destino actual
                          </p>
                          {emergencySummary.clinicalSummary.currentDestination ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {formatEmergencySummaryValue(
                                  'Destino',
                                  emergencySummary.clinicalSummary.currentDestination.label,
                                )}
                              </span>
                              <Badge variant="secondary">
                                {emergencySummary.clinicalSummary.currentDestination.source}
                              </Badge>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Sin destino actual documentado
                            </p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Última evolución registrada
                          </p>
                          {emergencySummary.clinicalSummary.latestEvolution ? (
                            <div className="mt-2 space-y-1 text-sm text-slate-700">
                              <p className="font-semibold text-slate-900">
                                {formatDateTime(
                                  emergencySummary.clinicalSummary.latestEvolution.recordedAt,
                                )}
                              </p>
                              <p>
                                {emergencySummary.clinicalSummary.latestEvolution.authorName ??
                                  'Profesional no especificado'}
                              </p>
                              <Badge variant="secondary">
                                {emergencySummary.clinicalSummary.latestEvolution.status}
                              </Badge>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Sin evoluciones registradas
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Problemas activos
                          </p>
                          {emergencySummary.clinicalSummary.activeProblems.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {emergencySummary.clinicalSummary.activeProblems.map((problem) => (
                                <Badge key={problem} variant="secondary">
                                  {problem}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Sin problemas activos documentados
                            </p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Tratamiento actual
                          </p>
                          {currentTreatmentGroups.some(([, items]) => items.length > 0) ? (
                            <div className="mt-3 space-y-3">
                              {currentTreatmentGroups.map(([label, items]) =>
                                items.length > 0 ? (
                                  <div key={label}>
                                    <p className="text-xs font-semibold text-slate-600">
                                      {label}
                                    </p>
                                    <ul className="mt-1 space-y-1 text-sm leading-relaxed text-slate-800">
                                      {items.map((item) => (
                                        <li key={item}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null,
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Sin tratamiento activo registrado
                            </p>
                          )}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      description="Último registro clínico disponible por fecha y hora clínica."
                      title="Signos vitales"
                      icon={HeartPulse}
                    >
                      {emergencySummary.vitalSigns ? (
                        <>
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {emergencySummary.vitalSigns.source}
                            </Badge>
                            <span>{formatDateTime(emergencySummary.vitalSigns.recordedAt)}</span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {emergencySummary.vitalSigns.values.map((item) => (
                              <div
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm"
                                key={item.label}
                              >
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  {item.label}
                                </p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin signos vitales registrados
                        </p>
                      )}
                    </SectionCard>

                    <SectionCard
                      description="Alertas vigentes derivadas de datos clínicos existentes."
                      title="Alertas clínicas activas"
                      icon={ShieldAlert}
                    >
                      {emergencySummary.activeAlerts.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {emergencySummary.activeAlerts.map((alert) => (
                            <div
                              className={`rounded-2xl border px-4 py-3 ${
                                alert.severity === 'CRITICAL'
                                  ? 'border-red-200 bg-red-50 text-red-900'
                                  : alert.severity === 'WARNING'
                                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                                    : 'border-slate-200 bg-slate-50 text-slate-800'
                              }`}
                              key={`${alert.source}-${alert.label}`}
                            >
                              <div className="flex items-start gap-3">
                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold">{alert.label}</p>
                                  <p className="mt-1 text-xs opacity-75">{alert.source}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin alertas clínicas activas
                        </p>
                      )}
                    </SectionCard>

                    <SectionCard
                      description="Resumen read-only del último documento vinculado."
                      title="Hoja de enfermería"
                      icon={HeartPulse}
                    >
                      {emergencySummary.nursingSheet ? (
                        <div className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <InfoRow
                              label="Última actualización"
                              value={formatDateTime(emergencySummary.nursingSheet.recordedAt)}
                            />
                            <InfoRow
                              label="Responsable"
                              value={
                                emergencySummary.nursingSheet.responsible ??
                                'No especificado'
                              }
                            />
                            <InfoRow
                              label="Riesgo de caídas"
                              value={
                                emergencySummary.nursingSheet.fallRisk ??
                                'No documentado'
                              }
                            />
                            <InfoRow
                              label="Dolor"
                              value={
                                emergencySummary.nursingSheet.painEva ??
                                'No documentado'
                              }
                            />
                          </div>
                          {emergencySummary.nursingSheet.observations ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Observaciones relevantes
                              </p>
                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-900">
                                {emergencySummary.nursingSheet.observations}
                              </p>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                emergencySummary.nursingSheet.signed
                                  ? 'success'
                                  : 'secondary'
                              }
                            >
                              {emergencySummary.nursingSheet.signed
                                ? 'Firmada'
                                : emergencySummary.nursingSheet.status}
                            </Badge>
                            <Button
                              className="gap-2"
                              onClick={() =>
                                openLinkedEmergencyNursingSheet(
                                  emergencySummary.nursingSheet!.recordId,
                                )
                              }
                              type="button"
                              variant="outline"
                            >
                              <Eye className="h-4 w-4" />
                              Ver hoja completa
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin hoja de enfermería vinculada
                        </p>
                      )}
                    </SectionCard>
                  </>
                ) : (
                  <SectionCard
                    description="El resumen clínico se genera desde las fuentes documentales del episodio."
                    title="Resumen clínico"
                    icon={Stethoscope}
                  >
                    <p className="text-sm text-muted-foreground">
                      Sin resumen clínico disponible
                    </p>
                  </SectionCard>
                )
              ) : hospitalSummary ? (
              <>
                <SectionCard
                  description="Datos clínicos mínimos para ubicar al paciente hospitalizado."
                  title="Datos base de hospitalización"
                  icon={BedDouble}
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {hospitalSummary.baseData.map((item) => (
                      <SummaryDataCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  description="Señales vigentes del estado clínico y ubicación hospitalaria."
                  title="Estado actual del paciente"
                  icon={Activity}
                >
                  <div className="flex flex-wrap gap-2">
                    {hospitalSummary.currentStatus ? (
                      <Badge
                        variant={
                          ['CRITICO', 'GRAVE'].includes(hospitalSummary.currentStatus)
                            ? 'alert'
                            : hospitalSummary.currentStatus === 'DELICADO'
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {formatSummaryEnum(hospitalSummary.currentStatus)}
                      </Badge>
                    ) : null}
                    {hospitalSummary.currentLocation ? (
                      <Badge variant="secondary">{hospitalSummary.currentLocation}</Badge>
                    ) : null}
                    {hospitalSummary.relevantBadges.map((badge) => (
                      <Badge
                        key={badge}
                        variant={
                          badge.toLocaleLowerCase('es-MX').includes('riesgo')
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  description="Consolidado read-only de ingreso, evolución, indicaciones y registros relacionados."
                  title="Resumen clínico"
                  icon={Stethoscope}
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Diagnóstico principal
                      </p>
                      {hospitalSummary.primaryDiagnosis.label ? (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {hospitalSummary.primaryDiagnosis.label}
                          </p>
                          {hospitalSummary.primaryDiagnosis.code ? (
                            <Badge variant="secondary">
                              CIE-10 {hospitalSummary.primaryDiagnosis.code}
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Sin diagnóstico principal documentado
                        </p>
                      )}
                    </div>
                    {hospitalSummary.currentStatus ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Estado clínico actual
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {formatSummaryEnum(hospitalSummary.currentStatus)}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Problemas activos
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {hospitalSummary.activeProblems.length > 0 ? (
                          hospitalSummary.activeProblems.slice(0, 8).map((problem) => (
                            <Badge key={problem} variant="secondary">
                              {problem}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Sin problemas activos documentados
                          </p>
                        )}
                        {hospitalSummary.activeProblems.length > 8 ? (
                          <Badge variant="default">
                            +{hospitalSummary.activeProblems.length - 8}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Último plan terapéutico
                      </p>
                      {hospitalSummary.treatmentPlan ? (
                        <>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-900">
                            {hospitalSummary.treatmentPlan}
                          </p>
                          {hospitalSummary.treatmentPlanDate ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Origen: {formatDateTime(hospitalSummary.treatmentPlanDate)}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Sin plan terapéutico vigente documentado
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Indicaciones activas
                      </p>
                      <div className="mt-3">
                        <SummaryList
                          items={hospitalSummary.activeIndications}
                          emptyText="Sin indicaciones activas documentadas"
                        />
                      </div>
                    </div>
                    {hospitalSummary.pendingProcedures.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Procedimientos pendientes
                        </p>
                        <div className="mt-3">
                          <SummaryList items={hospitalSummary.pendingProcedures} />
                        </div>
                      </div>
                    ) : null}
                    {hospitalSummary.activeConsultations.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Interconsultas activas
                        </p>
                        <div className="mt-3">
                          <SummaryList items={hospitalSummary.activeConsultations} />
                        </div>
                      </div>
                    ) : null}
                    {hospitalSummary.pendingStudies.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Estudios pendientes
                        </p>
                        <div className="mt-3">
                          <SummaryList items={hospitalSummary.pendingStudies} />
                        </div>
                      </div>
                    ) : null}
                    {hospitalSummary.probableDischargeDate ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Fecha probable de egreso
                        </p>
                        <p className="mt-2 text-sm font-semibold text-emerald-900">
                          {formatDate(hospitalSummary.probableDischargeDate)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </SectionCard>

                <SectionCard
                  description="Registro más reciente por fecha y hora clínica de toma."
                  title="Últimos signos vitales"
                  icon={HeartPulse}
                >
                  {hospitalSummary.latestVitals ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{hospitalSummary.latestVitals.source}</Badge>
                        <span>{formatDateTime(hospitalSummary.latestVitals.recordedAt)}</span>
                        {hospitalSummary.latestVitals.responsible ? (
                          <span>{hospitalSummary.latestVitals.responsible}</span>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          [
                            'TA (mmHg)',
                            hospitalSummary.latestVitals.formData.taSistolica &&
                            hospitalSummary.latestVitals.formData.taDiastolica
                              ? `${hospitalSummary.latestVitals.formData.taSistolica}/${hospitalSummary.latestVitals.formData.taDiastolica} mmHg`
                              : '',
                          ],
                          ['FC (lpm)', hospitalSummary.latestVitals.formData.fc],
                          ['FR (rpm)', hospitalSummary.latestVitals.formData.fr],
                          ['Temperatura (°C)', hospitalSummary.latestVitals.formData.temperatura],
                          ['SpO₂ (%)', hospitalSummary.latestVitals.formData.spo2],
                          ['Dolor EVA (0-10)', hospitalSummary.latestVitals.formData.dolorEva],
                          ['Glucosa capilar (mg/dL)', hospitalSummary.latestVitals.formData.glucosa],
                        ]
                          .filter(([, value]) => value)
                          .map(([label, value]) => (
                            <SummaryDataCard key={label} label={label} value={value} />
                          ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin signos vitales registrados
                    </p>
                  )}
                </SectionCard>

                <SectionCard
                  description="Alertas y riesgos activos del paciente."
                  title="Seguridad del paciente"
                  icon={ShieldAlert}
                >
                  {hospitalSummary.safetyAlerts.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {hospitalSummary.safetyAlerts.map((alert) => {
                        const lowerAlert = alert.toLocaleLowerCase('es-MX');
                        const severityClass =
                          lowerAlert.includes('alergia') ||
                          lowerAlert.includes('alto') ||
                          lowerAlert.includes('evento')
                            ? 'border-red-200 bg-red-50 text-red-900'
                            : lowerAlert.includes('riesgo') ||
                                lowerAlert.includes('ayuno') ||
                                lowerAlert.includes('aislamiento')
                              ? 'border-amber-200 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-slate-50 text-slate-800';

                        return (
                          <div className={`rounded-2xl border px-4 py-3 ${severityClass}`} key={alert}>
                            <p className="text-sm font-semibold">{alert}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin alertas activas de seguridad
                    </p>
                  )}
                </SectionCard>

                <SectionCard
                  description="Última nota o turno de enfermería con información clínica relevante."
                  title="Último registro de enfermería"
                  icon={HeartPulse}
                >
                  {hospitalSummary.nursingSummary ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryDataCard
                          label="Fecha y hora"
                          value={formatDateTime(hospitalSummary.nursingSummary.date)}
                        />
                        <SummaryDataCard
                          label="Responsable"
                          value={hospitalSummary.nursingSummary.responsible}
                        />
                        <SummaryDataCard
                          label="Última administración relevante"
                          value={hospitalSummary.nursingSummary.lastAdministration}
                        />
                        <SummaryDataCard
                          label="Balance hídrico resumido"
                          value={hospitalSummary.nursingSummary.balance}
                        />
                        <SummaryDataCard
                          label="Riesgo de caídas"
                          value={
                            hospitalSummary.nursingSummary.fallRisk
                              ? formatSummaryEnum(hospitalSummary.nursingSummary.fallRisk)
                              : ''
                          }
                        />
                        <SummaryDataCard
                          label="Dolor EVA"
                          value={hospitalSummary.nursingSummary.painEva}
                        />
                        <SummaryDataCard
                          label="Estado de la nota"
                          value={hospitalSummary.nursingSummary.status}
                        />
                      </div>
                      {hospitalSummary.nursingSummary.observations ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Observaciones relevantes
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-900">
                            {hospitalSummary.nursingSummary.observations}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin registro de enfermería disponible
                    </p>
                  )}
                </SectionCard>

                <SectionCard
                  description="Solo el registro más reciente por categoría clínica."
                  title="Última actividad clínica"
                  icon={History}
                >
                  {hospitalSummary.activityItems.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {hospitalSummary.activityItems.map((item) => (
                        <button
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-primary/30 hover:bg-white"
                          key={`${item.type}-${item.recordId}`}
                          onClick={() => openHospitalSummaryRecord(item.recordId)}
                          type="button"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {item.type}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(item.date)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.professional ? (
                              <Badge variant="secondary">{item.professional}</Badge>
                            ) : null}
                            {item.status ? (
                              <Badge variant="draft">{item.status}</Badge>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin actividad clínica reciente
                    </p>
                  )}
                </SectionCard>
              </>
              ) : (
              <>
                <SectionCard
                  description="Consulta y edita la información principal del episodio clínico."
                  title="Información general"
                  icon={LayoutDashboard}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">Sede</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('facilityId', event.target.value)
                        }
                        value={form.facilityId}
                      >
                        <option value="">Selecciona una sede</option>
                        {(metaQuery.data?.facilities ?? []).map((facility) => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">
                        Area de servicio
                      </span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('serviceAreaId', event.target.value)
                        }
                        value={form.serviceAreaId}
                      >
                        <option value="">Sin area especifica</option>
                        {availableServiceAreas.map((serviceArea) => (
                          <option key={serviceArea.id} value={serviceArea.id}>
                            {serviceArea.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">Especialidad</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('specialtyId', event.target.value)
                        }
                        value={form.specialtyId}
                      >
                        <option value="">Sin especialidad</option>
                        {(metaQuery.data?.specialties ?? []).map((specialty) => (
                          <option key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">
                        Responsable clinico
                      </span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('attendingUserId', event.target.value)
                        }
                        value={form.attendingUserId}
                      >
                        <option value="">Sin asignar</option>
                        {(metaQuery.data?.clinicians ?? []).map((clinician) => (
                          <option key={clinician.id} value={clinician.id}>
                            {clinician.fullName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">Tipo</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('encounterType', event.target.value)
                        }
                        value={form.encounterType}
                      >
                        {(metaQuery.data?.encounterTypes ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">Estado</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('status', event.target.value)
                        }
                        value={form.status}
                      >
                        {(metaQuery.data?.encounterStatuses ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">Origen</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(event) =>
                          updateFormField('admissionSource', event.target.value)
                        }
                        value={form.admissionSource}
                      >
                        <option value="">Sin origen</option>
                        {(metaQuery.data?.admissionSources ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-900">
                        Apertura del episodio
                      </span>
                      <Input
                        onChange={(event) =>
                          updateFormField('openedAt', event.target.value)
                        }
                        type="datetime-local"
                        value={form.openedAt}
                      />
                    </label>

                    <label className="space-y-2 text-sm md:col-span-2">
                      <span className="font-medium text-slate-900">
                        Fecha de cierre
                      </span>
                      <Input
                        onChange={(event) =>
                          updateFormField('closedAt', event.target.value)
                        }
                        type="datetime-local"
                        value={form.closedAt}
                      />
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium text-slate-900">Motivo de atencion</span>
                    <Textarea
                      onChange={(event) =>
                        updateFormField('reasonForVisit', event.target.value)
                      }
                      value={form.reasonForVisit}
                    />
                  </label>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium text-slate-900">Notas</span>
                    <Textarea
                      onChange={(event) =>
                        updateFormField('notes', event.target.value)
                      }
                      value={form.notes}
                    />
                  </label>
                </SectionCard>

                <SectionCard
                  description="Resumen clínico y operativo del episodio según el contexto actual."
                  title="Vista general"
                  icon={FolderOpen}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Paciente
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {detail.patient.fullName}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-500">
                          {detail.patient.phone ?? 'Sin teléfono'} ·{' '}
                          {detail.patient.email ?? 'Sin correo'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Episodio
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {typeConfig?.label ?? detail.encounterType}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-500">
                          {detail.facility?.name ?? 'Sin sede'} ·{' '}
                          {detail.serviceArea?.name ??
                            detail.specialty?.name ??
                            'Sin área'}
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  description="Contadores e indicadores vinculados al episodio clínico."
                  title="Actividad relacionada"
                  icon={Activity}
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ['Documentos', detail.metrics.documents],
                      ['Diagnósticos', detail.metrics.diagnoses],
                      ['Labs', detail.metrics.labs],
                      ['Imágenes', detail.metrics.imaging],
                    ].map(([label, value]) => (
                      <div
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 transition-colors hover:border-slate-300 hover:bg-white shadow-sm"
                        key={label}
                      >
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {label}
                          </p>

                          <p className="text-2xl font-bold tracking-tight text-slate-900">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  description="Información más reciente de monitoreo clínico del episodio."
                  title="Signos vitales"
                  icon={HeartPulse}
                >
                  {detail.latestVitalSigns.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {detail.latestVitalSigns.map((item) => (
                        <div
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm"
                          key={item.label}
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <div className="flex items-end gap-1.5">
                            <p className="mt-2 text-xl font-semibold text-slate-900">
                              {item.value}
                            </p>
                            <span className="pb-1 text-xs font-medium text-slate-500">
                              {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay signos vitales asociados a este episodio todavia.
                    </p>
                  )}
                </SectionCard>
              </>
              )
            ) : null}

            {activeTabDefinition ? (
              <>
                <SectionCard
                  description={activeTabDefinition.description}
                  title={activeTabDefinition.title}
                  icon={activeTabDefinition.icon}
                >
                  <div className="space-y-5">
                    {isEpisodeClosed ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-amber-100 p-2">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-900">
                              Episodio cerrado
                            </p>
                            <p className="text-sm leading-relaxed text-amber-700">
                              El episodio permanece disponible solo en modo consulta y ya no permite
                              nuevas capturas, firmas ni adjuntos.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {activeTabPanelConfig?.contextLabel ?? 'Registros de la sección'}
                        </p>
                        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                          Crea nuevos registros o continúa capturas existentes dentro de esta
                          sección clínica.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(isEmergencyInitialNoteSection &&
                        latestEmergencyInitialNoteRecord) ||
                        (isEmergencyNursingSheetSection &&
                          latestEmergencyNursingSheetRecord)
                          ? null
                          : (activeTabPanelConfig?.noteTypes?.length
                          ? activeTabPanelConfig.noteTypes
                          : [
                              activeTabPanelConfig?.defaultActionLabel.replace(
                                /^Nueva[s]?\s+/i,
                                '',
                              ) ?? activeTab,
                            ]
                        ).map((noteType) => (
                          <Button
                            className="gap-2 shadow-sm"
                            disabled={isEpisodeClosed}
                            key={noteType}
                            onClick={() => startCreatingRecord(noteType)}
                            type="button"
                            variant={
                              activeTabPanelConfig?.noteTypes?.length
                                ? 'outline'
                                : 'default'
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {activeTabPanelConfig?.noteTypes?.length
                              ? isEmergencyOrdersSection
                                ? buildEmergencyOrdersCreateLabel(noteType)
                                : noteType
                              : activeTabPanelConfig?.defaultActionLabel ??
                                'Nuevo registro'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {detail.encounterType === 'SURGERY' ? (
                      <p className="text-sm text-slate-500">
                        Los tabs pueden capturarse en borrador de forma independiente; la firma
                        valida cada documento sin bloquear otras secciones.
                      </p>
                    ) : null}

                    {!isShowingRecordForm ? (
                      activeTabRecords.length > 0 ? (
                        <div className="space-y-3">
                          {activeTabRecords.map((record) => {
                            const recordStatusConfig = getDisplayedRecordStatusConfig(
                              record.status,
                              isAmbulatoryClinicalSection,
                            );

                            return (
                              <button
                                className="group w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left transition-all hover:border-primary/30 hover:bg-slate-50/70 hover:shadow-sm"
                                key={record.id}
                                onClick={() => openExistingRecord(record.id)}
                                type="button"
                              >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {record.title}
                                      </p>
                                      <Badge variant="secondary">
                                        {record.noteType}
                                      </Badge>
                                      <Badge variant={recordStatusConfig.badgeVariant}>
                                        {recordStatusConfig.label}
                                      </Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                      <span>{record.authorName ?? 'Sin autor'}</span>
                                      <span className="text-slate-300">•</span>
                                      <span>{formatDateTime(record.recordedAt)}</span>
                                      <span className="text-slate-300">•</span>
                                      <span>
                                        Actualizado {formatDateTime(record.updatedAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                                    <PencilLine className="h-4 w-4" />
                                    <span>Continuar captura</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <FileText className="h-7 w-7 text-slate-400" />
                          </div>
                          <div className="mt-4 space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Aún no hay registros disponibles
                            </p>
                            <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
                              Usa la acción superior para crear el primer registro de{' '}
                              {activeTab.toLowerCase()}.
                            </p>
                          </div>
                        </div>
                      )
                    ) : recordForm ? (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedRecord ? 'Editar registro' : 'Nuevo registro'}
                            </p>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                              {selectedRecord
                                ? 'Continúa la captura y actualiza la información clínica del registro.'
                                : 'Completa la captura clínica correspondiente a esta sección del episodio.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={closeRecordWorkspace}
                              type="button"
                              variant="outline"
                            >
                              Cancelar
                            </Button>
                            <Button
                              className="gap-2 shadow-sm"
                              disabled={
                                createRecordMutation.isPending ||
                                updateRecordMutation.isPending ||
                                isRecordLocked ||
                                isEpisodeClosed
                              }
                              onClick={() => saveRecord('DRAFT')}
                              type="button"
                            >
                              <Save className="h-4 w-4" />
                              {createRecordMutation.isPending ||
                              updateRecordMutation.isPending
                                ? 'Guardando...'
                                : isAmbulatoryClinicalSection
                                  ? 'Guardar borrador'
                                  : 'Guardar registro'}
                            </Button>
                            {isAmbulatoryClinicalSection &&
                            recordForm.status !== 'SIGNED' ? (
                              <Button
                                className="gap-2 shadow-sm"
                                disabled={
                                  createRecordMutation.isPending ||
                                  updateRecordMutation.isPending ||
                                  isRecordLocked ||
                                  isEpisodeClosed
                                }
                                onClick={() => saveRecord('CLOSED')}
                                type="button"
                                variant="outline"
                              >
                                <FileCheck className="h-4 w-4" />
                                Marcar completo
                              </Button>
                            ) : null}
                            {isEmergencyInitialNoteSection &&
                            selectedRecord?.status === 'SIGNED' ? (
                              <Button
                                className="gap-2 shadow-sm"
                                disabled={correctInitialNoteMutation.isPending || isEpisodeClosed}
                                onClick={correctInitialNote}
                                type="button"
                                variant="outline"
                              >
                                <PencilLine className="h-4 w-4" />
                                {correctInitialNoteMutation.isPending
                                  ? 'Preparando corrección...'
                                  : 'Corregir nota'}
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {isConsultationHistorySection ? (
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-emerald-100 p-2">
                                      <FileCheck className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {`Historia clínica · versión ${historyVersionNumber}`}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-emerald-800">
                                    El registro conserva el versionado clínico del episodio y mantiene la
                                    trazabilidad histórica de la atención.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {historyTypeLabel}
                                  </Badge>
                                  {inheritedFromLabel ? (
                                    <Badge variant="success">
                                      {inheritedFromLabel}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : isConsultationCurrentSection ? (
                            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-sky-100 p-2">
                                      <Stethoscope className="h-4 w-4 text-sky-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {`Consulta · versión ${consultationVersionNumber}`}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-sky-800">
                                    La consulta conserva el seguimiento clínico y el histórico operativo
                                    asociado al episodio.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {consultationTypeLabel}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isConsultationEvolutionSection ? (
                            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-amber-100 p-2">
                                      <ClipboardPen className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {`Evolución · versión ${evolutionVersionNumber}`}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-amber-800">
                                    Cada evolución conserva el seguimiento clínico del episodio y mantiene
                                    el histórico progresivo de atención.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    SOAP
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isConsultationPrescriptionSection ? (
                            <div className="rounded-2xl border border-violet-200/80 bg-violet-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-violet-100 p-2">
                                      <Pill className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {`Receta · versión ${prescriptionVersionNumber}`}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-violet-800">
                                    La receta mantiene control independiente por versión y permanece en
                                    edición hasta completar la firma clínica correspondiente.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {typeof recordForm.formData.recetaFolio === 'string'
                                      ? recordForm.formData.recetaFolio
                                      : buildPrescriptionFolio(
                                          detail.encounterNumber,
                                          prescriptionVersionNumber,
                                        )}
                                  </Badge>
                                  <Badge variant="draft">
                                    Descargas:{' '}
                                    {selectedRecord?.metadata.pdfDownloadCount ?? 0}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isConsultationDocumentsSection ? (
                            <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-cyan-100 p-2">
                                      <FileSignature className="h-4 w-4 text-cyan-700" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {buildDocumentVersionTitle(
                                        recordForm.noteType,
                                        selectedRecord?.metadata.versionNumber ??
                                          nextDocumentVersionNumber,
                                      )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-cyan-800">
                                    El documento conserva control por versión y permanece editable hasta
                                    completar la firma clínica correspondiente.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {recordForm.noteType}
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                  {detail.encounterType !== 'EMERGENCY' &&
                                  recordForm.noteType === 'Nota de cierre' ? (
                                    <Badge variant="warning">
                                      El episodio se cerrará al firmar
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyTriageSection ? (
                            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-rose-100 p-2">
                                      <Siren className="h-4 w-4 text-rose-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildTriageTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildTriageTitle(nextTriageVersionNumber)}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-rose-800">
                                    El triage conserva el seguimiento inicial de urgencias y mantiene su
                                    registro independiente dentro del episodio clínico.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Triage</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyInitialNoteSection ? (
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-emerald-100 p-2">
                                      <Stethoscope className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {buildEmergencyInitialNoteTitle()}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-emerald-800">
                                    Nota médica inicial vinculada al último triage del episodio y basada
                                    en los signos vitales registrados durante la atención inicial.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Nota inicial</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyNursingSheetSection ? (
                            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-sky-100 p-2">
                                      <HeartPulse className="h-4 w-4 text-sky-700" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildEmergencyNursingSheetTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildEmergencyNursingSheetTitle(
                                            nextEmergencyNursingSheetVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-sky-800">
                                    Registro independiente de enfermería para valoración, medicación,
                                    procedimientos, observaciones y firma propia del personal responsable.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Hoja de enfermería
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyEvolutionSection ? (
                            <div className="rounded-2xl border border-orange-200/80 bg-orange-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-orange-100 p-2">
                                      <Activity className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildEmergencyEvolutionTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildEmergencyEvolutionTitle(
                                            nextEmergencyEvolutionVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-orange-800">
                                    Evolución clínica del episodio con actualización de signos vitales,
                                    valoración médica y seguimiento continuo durante la atención en
                                    urgencias.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Evolución en urgencias
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyOrdersSection ? (
                            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-indigo-100 p-2">
                                      <ClipboardList className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildEmergencyOrdersTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                            currentEmergencyOrdersDocumentType,
                                          )
                                        : buildEmergencyOrdersTitle(
                                            nextEmergencyOrdersVersionNumberForCurrentType,
                                            currentEmergencyOrdersDocumentType,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-indigo-800">
                                    Órdenes médicas e indicaciones clínicas asociadas al episodio, con
                                    seguimiento y control operativo durante la atención.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {currentEmergencyOrdersDocumentType}
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyConsultationSection ? (
                            <div className="rounded-2xl border border-teal-200/80 bg-teal-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-teal-100 p-2">
                                      <MessagesSquare className="h-4 w-4 text-teal-700" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildEmergencyConsultationTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildEmergencyConsultationTitle(
                                            nextEmergencyConsultationVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-teal-800">
                                    Solicitud de valoración entre servicios clínicos con seguimiento de
                                    atención y continuidad asistencial del episodio.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Interconsultas</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyDischargeSection ? (
                            <div className="rounded-2xl border border-slate-300/80 bg-slate-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-slate-200 p-2">
                                      <FileCheck className="h-4 w-4 text-slate-700" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {buildEmergencyDischargeTitle()}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                                    Documento final del episodio de urgencias. Una vez firmado, el episodio
                                    quedará cerrado y disponible únicamente en modo consulta.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Egreso de urgencias</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalAdmissionSection ? (
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-emerald-100 p-2">
                                      <BedDouble className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildHospitalAdmissionTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildHospitalAdmissionTitle(
                                            nextHospitalAdmissionVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-emerald-800">
                                    Registro de ingreso clínico y administrativo asociado al episodio de
                                    hospitalización y continuidad de atención intrahospitalaria.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Ingreso hospitalario
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalEvolutionSection ? (
                            <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-blue-100 p-2">
                                      <Activity className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildHospitalEvolutionTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildHospitalEvolutionTitle(
                                            nextHospitalEvolutionVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-blue-800">
                                    Evolución clínica intrahospitalaria con valoración médica continua,
                                    actualización de signos vitales y seguimiento del estado del paciente.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Evolución hospitalaria
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalMedicalOrdersSection ? (
                            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-indigo-100 p-2">
                                      <ClipboardList className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildHospitalMedicalOrdersTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildHospitalMedicalOrdersTitle(
                                            nextHospitalMedicalOrdersVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-indigo-800">
                                    Indicaciones médicas asociadas al episodio hospitalario para
                                    medicamentos, laboratorio, imagen, enfermería e interconsultas.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Indicaciones médicas
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalConsultationSection ? (
                            <div className="rounded-2xl border border-teal-200/80 bg-teal-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-teal-100 p-2">
                                      <MessagesSquare className="h-4 w-4 text-teal-700" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildHospitalConsultationTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildHospitalConsultationTitle(
                                            nextHospitalConsultationVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-teal-800">
                                    Solicitud de valoración entre servicios hospitalarios con seguimiento
                                    clínico, respuesta médica y continuidad asistencial del episodio.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Interconsultas</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                  <Badge variant="warning">
                                    {typeof recordForm.formData.estatusInterconsultaHosp === 'string'
                                      ? recordForm.formData.estatusInterconsultaHosp
                                      : 'BORRADOR'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalSurgicalSection ? (
                            <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-cyan-100 p-2">
                                      <Scissors className="h-4 w-4 text-cyan-700" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildHospitalSurgicalTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildHospitalSurgicalTitle(
                                            nextHospitalSurgicalVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-cyan-800">
                                    Registro clínico de procedimientos y cirugía asociado al episodio
                                    hospitalario, con control documental y validación de firma médica.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Procedimientos y cirugía
                                  </Badge>
                                  <Badge variant="secondary">
                                    {recordForm.noteType}
                                  </Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalNursingSection ? (
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-emerald-100 p-2">
                                      <HeartPulse className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {selectedRecord
                                        ? buildHospitalNursingTitle(
                                            selectedRecord.metadata.versionNumber ?? 1,
                                          )
                                        : buildHospitalNursingTitle(
                                            nextHospitalNursingVersionNumber,
                                          )}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-emerald-800">
                                    Registro de enfermería por turno con seguimiento clínico, signos
                                    vitales, administración de medicamentos, balance y eventos relevantes
                                    de atención.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Enfermería</Badge>
                                  <Badge variant="secondary">{recordForm.noteType}</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isHospitalDischargeSection ? (
                            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-5 md:col-span-2">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-rose-100 p-2">
                                      <FileCheck className="h-4 w-4 text-rose-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {buildHospitalDischargeTitle()}
                                    </p>
                                  </div>
                                  <p className="max-w-2xl text-sm leading-relaxed text-rose-800">
                                    Documento final de egreso hospitalario. Una vez firmado, el episodio
                                    quedará cerrado y disponible únicamente en modo consulta.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Egreso</Badge>
                                  <Badge
                                    variant={
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).badgeVariant
                                    }
                                  >
                                    {
                                      (encounterRecordStatusConfig[recordForm.status] ??
                                        encounterRecordStatusConfig.DRAFT).label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : isAmbulatoryPreprocedureSection ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {recordForm.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Tipo de registro: Valoración preprocedimiento
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).badgeVariant
                                  }
                                >
                                  {
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).label
                                  }
                                </Badge>
                              </div>
                            </div>
                          ) : isAmbulatoryProcedureSection ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {recordForm.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Tipo de registro: Procedimiento
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).badgeVariant
                                  }
                                >
                                  {
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).label
                                  }
                                </Badge>
                              </div>
                            </div>
                          ) : isAmbulatoryRecoveryEvaluationSection ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {recordForm.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Tipo de registro: Recuperación / Evaluación
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).badgeVariant
                                  }
                                >
                                  {
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).label
                                  }
                                </Badge>
                              </div>
                            </div>
                          ) : isAmbulatoryDischargePrescriptionSection ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {recordForm.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Tipo de registro: Receta e indicaciones de egreso
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).badgeVariant
                                  }
                                >
                                  {
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).label
                                  }
                                </Badge>
                              </div>
                            </div>
                          ) : isAmbulatoryDischargeSection ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {recordForm.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Tipo de registro: Egreso. Al firmar cerrará el episodio.
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).badgeVariant
                                  }
                                >
                                  {
                                    (encounterRecordStatusConfig[recordForm.status] ??
                                      encounterRecordStatusConfig.DRAFT).label
                                  }
                                </Badge>
                              </div>
                            </div>
                          ) : isConsultationDocumentsSection ? null : (
                            <label className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">Tipo de registro</span>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={isRecordLocked}
                                onChange={(event) =>
                                  isConsultationDocumentsSection
                                    ? updateDocumentRecordType(event.target.value)
                                    : updateRecordFormField('noteType', event.target.value)
                                }
                                value={recordForm.noteType}
                              >
                                {(
                                  activeTabPanelConfig?.noteTypes?.length
                                    ? activeTabPanelConfig.noteTypes
                                    : [recordForm.noteType]
                                ).map((noteType) => (
                                  <option key={noteType} value={noteType}>
                                    {noteType}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}

                          {isConsultationDocumentsSection &&
                          detail.encounterType === 'EMERGENCY' ? (
                            <div className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">
                                Tipo de documento
                              </span>
                              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-slate-700">
                                {recordForm.noteType}
                              </div>
                            </div>
                          ) : isConsultationDocumentsSection ? (
                            <label className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">Tipo de documento</span>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={isRecordLocked}
                                onChange={(event) =>
                                  updateDocumentRecordType(event.target.value)
                                }
                                value={recordForm.noteType}
                              >
                                {getEpisodeDocumentTypes(detail.encounterType).map((noteType) => (
                                  <option key={noteType} value={noteType}>
                                    {noteType}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}

                          {isConsultationDocumentsSection ? (
                            <div className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">
                                Título / versión
                              </span>
                              <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-slate-700">
                                {recordForm.title}
                              </div>
                            </div>
                          ) : null}

                          {isConsultationPrescriptionSection ||
                          isConsultationDocumentsSection ||
                          isEmergencyInitialNoteSection ||
                          isEmergencyNursingSheetSection ||
                          isAmbulatoryPreprocedureSection ||
                          isAmbulatoryProcedureSection ||
                          isAmbulatoryRecoveryEvaluationSection ||
                          isAmbulatoryDischargePrescriptionSection ||
                          isAmbulatoryDischargeSection ? (
                            <div className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">Estado</span>
                              <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-slate-700">
                                {getDisplayedRecordStatusConfig(
                                  recordForm.status,
                                  isAmbulatoryClinicalSection,
                                ).label}
                              </div>
                            </div>
                          ) : (
                            <label className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">Estado</span>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={isRecordLocked}
                                onChange={(event) =>
                                  updateRecordFormField('status', event.target.value)
                                }
                                value={recordForm.status}
                              >
                                {Object.entries(encounterRecordStatusConfig).map(
                                  ([value, config]) => (
                                    <option key={value} value={value}>
                                      {config.label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                          )}

                          {isConsultationHistorySection ||
                          isConsultationCurrentSection ||
                          isConsultationEvolutionSection ||
                          isConsultationPrescriptionSection ||
                          isConsultationDocumentsSection ||
                          isEmergencyTriageSection ||
                          isEmergencyInitialNoteSection ||
                          isEmergencyNursingSheetSection ||
                          isEmergencyEvolutionSection ||
                          isEmergencyOrdersSection ||
                          isEmergencyConsultationSection ||
                          isEmergencyDischargeSection ||
                          isHospitalAdmissionSection ||
                          isHospitalEvolutionSection ||
                          isHospitalMedicalOrdersSection ||
                          isHospitalConsultationSection ||
                          isHospitalSurgicalSection ||
                          isHospitalNursingSection ||
                          isHospitalDischargeSection ||
                          isAmbulatoryPreprocedureSection ||
                          isAmbulatoryProcedureSection ||
                          isAmbulatoryRecoveryEvaluationSection ||
                          isAmbulatoryDischargePrescriptionSection ||
                          isAmbulatoryDischargeSection ? null : (
                            <label className="space-y-2 text-sm md:col-span-2">
                              <span className="font-medium text-slate-900">Título</span>
                              <Input
                                disabled={isRecordLocked}
                                onChange={(event) =>
                                  updateRecordFormField('title', event.target.value)
                                }
                                value={recordForm.title}
                              />
                            </label>
                          )}

                          <label className="space-y-2 text-sm md:col-span-2">
                            <span className="font-medium text-slate-900">
                              Fecha clínica del registro
                            </span>
                            <Input
                              disabled={isRecordLocked}
                              onChange={(event) =>
                                updateRecordFormField('recordedAt', event.target.value)
                              }
                              type="datetime-local"
                              value={recordForm.recordedAt}
                            />
                          </label>
                        </div>

                        {isConsultationPrescriptionSection ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-slate-900">
                                Datos legales de la receta
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Estos datos se autocompletan con la configuración legal
                                y profesional disponible del episodio.
                              </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <ReadOnlyField
                                label="Institución emisora"
                                value={
                                  currentPrescriptionLegalSnapshot?.recetaInstitucionEmisora ??
                                  ''
                                }
                              />
                              <ReadOnlyField
                                label="RFC"
                                value={
                                  currentPrescriptionLegalSnapshot?.recetaRfcMedico ?? ''
                                }
                              />
                              <ReadOnlyField
                                label="Licencia sanitaria"
                                value={
                                  currentPrescriptionLegalSnapshot?.recetaLicenciaSanitaria ??
                                  ''
                                }
                              />
                              <ReadOnlyField
                                label="Profesional responsable"
                                value={
                                  currentPrescriptionLegalSnapshot?.recetaNombreProfesional ??
                                  ''
                                }
                              />
                              <ReadOnlyField
                                label="Cédula"
                                value={
                                  currentPrescriptionLegalSnapshot?.recetaCedulaProfesional ??
                                  ''
                                }
                              />
                              <ReadOnlyField
                                label="Especialidad"
                                value={
                                  currentPrescriptionLegalSnapshot?.recetaEspecialidadProfesional ??
                                  ''
                                }
                              />
                              <div className="md:col-span-2">
                                <ReadOnlyField
                                  label="Lugar de atención"
                                  value={
                                    currentPrescriptionLegalSnapshot?.recetaLugarAtencion ??
                                    ''
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {isConsultationDocumentsSection &&
                        detail.encounterType !== 'EMERGENCY' &&
                        detail.encounterType !== 'HOSPITALIZATION' &&
                        currentDocumentLegalSnapshot ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-slate-900">
                                Datos legales del documento
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Estos datos se autocompletan con la configuración legal
                                y profesional disponible del episodio.
                              </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <ReadOnlyField
                                label="Institución emisora"
                                value={
                                  currentDocumentLegalSnapshot.documentoInstitucionEmisora
                                }
                              />
                              <ReadOnlyField
                                label="RFC"
                                value={currentDocumentLegalSnapshot.documentoRfcMedico}
                              />
                              <ReadOnlyField
                                label="Licencia sanitaria"
                                value={
                                  currentDocumentLegalSnapshot.documentoLicenciaSanitaria
                                }
                              />
                              <ReadOnlyField
                                label="Código de verificación"
                                value={
                                  typeof recordForm.formData.documentoCodigoVerificacion ===
                                  'string'
                                    ? recordForm.formData.documentoCodigoVerificacion
                                    : currentDocumentLegalSnapshot.documentoCodigoVerificacion
                                }
                              />
                              <ReadOnlyField
                                label="Profesional responsable"
                                value={
                                  currentDocumentLegalSnapshot.documentoNombreProfesional
                                }
                              />
                              <ReadOnlyField
                                label="Cédula"
                                value={
                                  currentDocumentLegalSnapshot.documentoCedulaProfesional
                                }
                              />
                              <ReadOnlyField
                                label="Especialidad"
                                value={
                                  currentDocumentLegalSnapshot.documentoEspecialidadProfesional
                                }
                              />
                              <div className="md:col-span-2">
                                <ReadOnlyField
                                  label="Lugar de atención"
                                  value={currentDocumentLegalSnapshot.documentoLugarAtencion}
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {isConsultationPrescriptionSection ||
                        isConsultationDocumentsSection ||
                        isEmergencyTriageSection ||
                        isEmergencyInitialNoteSection ||
                        isEmergencyNursingSheetSection ||
                        isEmergencyEvolutionSection ||
                        isEmergencyOrdersSection ||
                        isEmergencyConsultationSection ||
                        isEmergencyDischargeSection ||
                        isHospitalAdmissionSection ||
                        isHospitalEvolutionSection ||
                        isHospitalMedicalOrdersSection ||
                        isHospitalConsultationSection ||
                        isHospitalSurgicalSection ||
                        isHospitalNursingSection ||
                        isHospitalDischargeSection ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {isConsultationPrescriptionSection
                                    ? 'Validaciones automáticas de seguridad'
                                    : isEmergencyTriageSection
                                      ? 'Documento de Triage'
                                      : isEmergencyInitialNoteSection
                                        ? 'Documento de Nota inicial'
                                        : isEmergencyNursingSheetSection
                                          ? 'Documento de Hoja de enfermería'
                                        : isEmergencyEvolutionSection
                                          ? 'Documento de Evolución'
                                          : isEmergencyOrdersSection
                                            ? 'Documento de Órdenes'
                                            : isEmergencyConsultationSection
                                              ? 'Documento de Interconsulta'
                                          : isEmergencyDischargeSection
                                            ? 'Documento de Egreso'
                                            : isHospitalAdmissionSection
                                              ? 'Documento de Ingreso hospitalario'
                                              : isHospitalEvolutionSection
                                                ? 'Documento de Evolución hospitalaria'
                                                : isHospitalMedicalOrdersSection
                                                  ? 'Documento de Indicaciones médicas'
                                                  : isHospitalConsultationSection
                                                    ? 'Documento de Interconsulta'
                                                    : isHospitalSurgicalSection
                                                      ? 'Subdocumento quirúrgico'
                                                      : isHospitalNursingSection
                                                      ? 'Corte de enfermería'
                                                      : isHospitalDischargeSection
                                                        ? 'Documento final de Egreso'
                                      : 'Documento oficial del episodio'}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {isConsultationPrescriptionSection
                                    ? 'Estas alertas se recalculan con los medicamentos capturados y se muestran antes de firmar la receta.'
                                    : isEmergencyTriageSection
                                      ? 'La vista previa y el PDF usan la información del registro y respetan su estado firmado o borrador.'
                                      : isEmergencyInitialNoteSection
                                        ? 'La vista previa y el PDF usan el snapshot clínico guardado de la nota inicial.'
                                        : isEmergencyNursingSheetSection
                                          ? 'La vista previa y el PDF pertenecen solo a esta hoja de enfermería.'
                                        : isEmergencyEvolutionSection
                                          ? 'La vista previa y el PDF usan la medición y el seguimiento guardados en esta evolución.'
                                          : isEmergencyOrdersSection
                                            ? 'La vista previa y el PDF usan las órdenes estructuradas y su trazabilidad.'
                                            : isEmergencyConsultationSection
                                              ? 'La vista previa y el PDF usan la solicitud, respuesta y auditoría de tiempos.'
                                              : isEmergencyDischargeSection
                                                ? 'La vista previa y el PDF usan el documento final de egreso y su estado de cierre.'
                                                : isHospitalAdmissionSection
                                                  ? 'La vista previa y el PDF usan el registro de admisión hospitalaria firmado o en borrador.'
                                                  : isHospitalEvolutionSection
                                                    ? 'La vista previa y el PDF usan el SOAP, signos, diagnósticos, resultados y plan de esta evolución.'
                                                    : isHospitalMedicalOrdersSection
                                                      ? 'La vista previa y el PDF usan medicamentos, soluciones, estudios, interconsultas, cuidados y trazabilidad.'
                                                      : isHospitalConsultationSection
                                                        ? 'La vista previa y el PDF usan solicitud, respuesta, estado y tiempos de auditoría.'
                                                        : isHospitalSurgicalSection
                                                          ? 'La vista previa y el PDF pertenecen solo a este subdocumento quirúrgico.'
                                                          : isHospitalNursingSection
                                                            ? 'La vista previa y el PDF pertenecen solo a este turno de enfermería.'
                                                            : isHospitalDischargeSection
                                                              ? 'La vista previa y el PDF final se generan desde el egreso hospitalario.'
                                      : 'La vista previa y la descarga del PDF se habilitan desde este bloque. La nota de cierre firmada bloqueará toda la edición del episodio.'}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  disabled={
                                    !selectedRecord ||
                                    previewPrescriptionPdfMutation.isPending
                                  }
                                  onClick={() =>
                                    selectedRecord
                                      ? previewPrescriptionPdfMutation.mutate(
                                          selectedRecord.id,
                                        )
                                      : null
                                  }
                                  type="button"
                                  variant="outline"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Vista previa PDF
                                </Button>
                                <Button
                                  disabled={
                                    !selectedRecord ||
                                    (selectedRecord.status !== 'SIGNED' &&
                                      !isEmergencyTriageSection &&
                                      !isEmergencyInitialNoteSection &&
                                      !isEmergencyNursingSheetSection &&
                                      !isEmergencyEvolutionSection &&
                                      !isEmergencyOrdersSection &&
                                      !isEmergencyConsultationSection &&
                                      !isEmergencyDischargeSection &&
                                      !isHospitalAdmissionSection &&
                                      !isHospitalEvolutionSection &&
                                      !isHospitalMedicalOrdersSection &&
                                      !isHospitalConsultationSection &&
                                      !isHospitalSurgicalSection &&
                                      !isHospitalNursingSection &&
                                      !isHospitalDischargeSection) ||
                                    (isConsultationPrescriptionSection &&
                                      (selectedRecord.metadata.pdfDownloadCount ?? 0) >= 1) ||
                                    downloadPrescriptionPdfMutation.isPending
                                  }
                                  onClick={() =>
                                    selectedRecord
                                      ? downloadPrescriptionPdfMutation.mutate(
                                          selectedRecord.id,
                                        )
                                      : null
                                  }
                                  type="button"
                                  variant="outline"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Descargar PDF oficial
                                </Button>
                              </div>
                            </div>
                            {isConsultationPrescriptionSection ? (
                              <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {prescriptionSafetyAlerts.map((alertGroup) => (
                                  <div
                                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                                    key={alertGroup.title}
                                  >
                                    <p className="text-sm font-semibold text-amber-800">
                                      {alertGroup.title}
                                    </p>
                                    <div className="mt-2 space-y-2">
                                      {alertGroup.items.map((item) => (
                                        <p
                                          className="text-xs text-amber-700"
                                          key={`${alertGroup.title}-${item}`}
                                        >
                                          {item}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {(workspaceTabDefinition?.sections ?? [])
                          .filter((section) => {
                            if (isConsultationHistorySection) {
                              if (section.historyVisibility === 'initial_only') {
                                return currentHistoryType === 'INICIAL';
                              }

                              if (section.historyVisibility === 'subsequent_only') {
                                return currentHistoryType === 'SUBSECUENTE';
                              }
                            }

                            if (isEmergencyDischargeSection) {
                              const dischargeType =
                                typeof recordForm.formData.tipoEgresoUrg === 'string'
                                  ? recordForm.formData.tipoEgresoUrg
                                  : '';

                              if (section.key === 'egreso_urg_traslado') {
                                return dischargeType === 'REFERENCIA_TRASLADO';
                              }

                              if (section.key === 'egreso_urg_certificado_defuncion') {
                                return dischargeType === 'DEFUNCION';
                              }
                            }

                            if (isEmergencyOrdersSection) {
                              const indicationSheetOnlySections = [
                                'ordenes_urg_cuidados',
                                'ordenes_urg_monitoreo',
                                'ordenes_urg_oxigeno',
                                'ordenes_urg_dieta',
                                'ordenes_urg_reposo',
                                'ordenes_urg_balance',
                                'ordenes_urg_indicaciones_generales',
                              ];
                              const medicalOrderOnlySections = [
                                'ordenes_urg_trazabilidad',
                                'ordenes_urg_transfusion',
                              ];

                              if (
                                currentEmergencyOrdersDocumentType ===
                                  'Hoja de indicaciones' &&
                                medicalOrderOnlySections.includes(section.key)
                              ) {
                                return false;
                              }

                              if (
                                currentEmergencyOrdersDocumentType === 'Orden médica' &&
                                indicationSheetOnlySections.includes(section.key)
                              ) {
                                return false;
                              }
                            }

                            if (isHospitalSurgicalSection) {
                              const surgicalType = recordForm.noteType;

                              if (section.key.startsWith('prequir_')) {
                                return surgicalType === 'Nota preoperatoria';
                              }

                              if (section.key.startsWith('prean_')) {
                                return surgicalType === 'Nota preanestésica';
                              }

                              if (section.key.startsWith('postop_')) {
                                return surgicalType === 'Nota postoperatoria';
                              }

                              if (section.key.startsWith('postanes_')) {
                                return surgicalType === 'Nota postanestésica';
                              }

                              return (
                                section.key === 'quir_common_header' ||
                                section.key === 'quir_legales_firma'
                              );
                            }

                            return true;
                          })
                          .map((section) => {
                            if (
                              isEmergencyEvolutionSection &&
                              section.key === 'evolucion_urg_enfermeria'
                            ) {
                              const nursingSheetRecord =
                                latestEmergencyNursingSheetRecord;
                              const nursingSheetFormData =
                                (nursingSheetRecord?.formData ?? {}) as Record<
                                  string,
                                  unknown
                                >;
                              const nursingSheetStatusConfig =
                                nursingSheetRecord
                                  ? getDisplayedRecordStatusConfig(
                                      nursingSheetRecord.status,
                                      false,
                                    )
                                  : null;

                              return (
                                <div
                                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                  key={section.key}
                                >
                                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {section.title}
                                      </p>
                                      {nursingSheetRecord ? (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                          <Badge
                                            variant={
                                              nursingSheetStatusConfig?.badgeVariant ??
                                              'secondary'
                                            }
                                          >
                                            {nursingSheetStatusConfig?.label ??
                                              nursingSheetRecord.status}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            Actualizado{' '}
                                            {formatDateTime(nursingSheetRecord.updatedAt)}
                                          </span>
                                        </div>
                                      ) : (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                          Sin hoja de enfermería vinculada
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {nursingSheetRecord ? (
                                        <Button
                                          className="gap-2"
                                          onClick={() =>
                                            openEmergencyNursingSheetRecord(
                                              nursingSheetRecord,
                                            )
                                          }
                                          type="button"
                                          variant="outline"
                                        >
                                          <Eye className="h-4 w-4" />
                                          Ver hoja completa
                                        </Button>
                                      ) : (
                                        <Button
                                          className="gap-2"
                                          disabled={
                                            isEpisodeClosed ||
                                            isOpeningEmergencyNursingSheet
                                          }
                                          onClick={openOrCreateEmergencyNursingSheet}
                                          type="button"
                                        >
                                          {isOpeningEmergencyNursingSheet ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Plus className="h-4 w-4" />
                                          )}
                                          Crear hoja de enfermería
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {nursingSheetRecord ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <ReadOnlyField
                                        label="Habitus exterior"
                                        value={readRecordTextValue(
                                          nursingSheetFormData,
                                          'habitusExteriorEnfUrg',
                                        )}
                                      />
                                      <ReadOnlyField
                                        label="Valoración del dolor"
                                        value={readRecordTextValue(
                                          nursingSheetFormData,
                                          'dolorEvaEnfUrg',
                                        )}
                                      />
                                      <ReadOnlyField
                                        label="Riesgo de caídas"
                                        value={readRecordTextValue(
                                          nursingSheetFormData,
                                          'riesgoCaidasEnfUrg',
                                        )}
                                      />
                                      <ReadOnlyField
                                        label="Elaboró"
                                        value={readRecordTextValue(
                                          nursingSheetFormData,
                                          'elaboroEnfUrg',
                                        )}
                                      />
                                      <ReadOnlyField
                                        label="Cédula"
                                        value={readRecordTextValue(
                                          nursingSheetFormData,
                                          'cedulaEnfUrg',
                                        )}
                                      />
                                      <ReadOnlyField
                                        label="Estado de la hoja"
                                        value={
                                          nursingSheetStatusConfig?.label ??
                                          nursingSheetRecord.status
                                        }
                                      />
                                      <ReadOnlyField
                                        label="Fecha y hora de última actualización"
                                        value={formatDateTime(
                                          nursingSheetRecord.updatedAt,
                                        )}
                                      />
                                      <div className="md:col-span-2">
                                        <ReadOnlyField
                                          label="Medicación administrada"
                                          value={formatEmergencyNursingMedicationSummary(
                                            nursingSheetFormData,
                                          )}
                                        />
                                      </div>
                                      <div className="md:col-span-2">
                                        <ReadOnlyField
                                          label="Procedimientos de enfermería realizados"
                                          value={formatEmergencyNursingProcedureSummary(
                                            nursingSheetFormData,
                                          )}
                                        />
                                      </div>
                                      <div className="md:col-span-2">
                                        <ReadOnlyField
                                          label="Observaciones de enfermería"
                                          value={readRecordTextValue(
                                            nursingSheetFormData,
                                            'observacionesEnfermeriaEnfUrg',
                                          )}
                                        />
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            }

                            return (
                          <div
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            key={section.key}
                          >
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {section.title}
                              </p>
                              {section.description ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {section.description}
                                </p>
                              ) : null}
                            </div>
                            {isEmergencyTriageSection &&
                            section.key === 'triage_news_alertas' ? (
                              <News2StructuredPanel formData={recordForm.formData} />
                            ) : isEmergencyOrdersSection &&
                            section.key === 'ordenes_urg_trazabilidad' ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                {buildEmergencyOrdersTraceCards(recordForm.formData).length > 0 ? (
                                  buildEmergencyOrdersTraceCards(recordForm.formData).map(
                                    (traceCard) => (
                                      <div
                                        className="rounded-2xl border border-slate-200 bg-white p-4"
                                        key={traceCard.id}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                              {traceCard.title}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                              {traceCard.service}
                                            </p>
                                          </div>
                                          <Badge variant="secondary">
                                            {traceCard.status}
                                          </Badge>
                                        </div>
                                        <div className="mt-3 grid gap-2 text-xs text-slate-600">
                                          <span>
                                            Responsable: {traceCard.responsible}
                                          </span>
                                          <span>
                                            Hora relevante: {traceCard.relevantTime}
                                          </span>
                                        </div>
                                      </div>
                                    ),
                                  )
                                ) : (
                                  <p className="text-xs text-muted-foreground md:col-span-2">
                                    Sin órdenes operativas capturadas.
                                  </p>
                                )}
                              </div>
                            ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                              {section.fields.map((field) => {
	                                if (
	                                  isEmergencyOrdersSection &&
	                                  section.key === 'ordenes_urg_transfusion' &&
	                                  field.key !== 'transfusionAplica'
	                                ) {
                                  if (recordForm.formData.transfusionAplica !== true) {
                                    return null;
                                  }

                                  if (
                                    field.key === 'transfusionOtroHemoderivado' &&
                                    recordForm.formData.transfusionTipoHemoderivado !== 'OTRO'
                                  ) {
                                    return null;
                                  }

                                  if (
                                    field.key === 'transfusionReacciones' &&
                                    recordForm.formData.transfusionReaccionAdversa !== 'SI'
                                  ) {
                                    return null;
	                                  }
	                                }

                                if (
                                  field.visibleWhen &&
                                  !field.visibleWhen.values.includes(
                                    typeof recordForm.formData[field.visibleWhen.fieldKey] ===
                                      'string'
                                      ? (recordForm.formData[
                                          field.visibleWhen.fieldKey
                                        ] as string)
                                      : '',
                                  )
                                ) {
                                  return null;
                                }

	                                if (field.inheritanceMode === 'system') {
                                  if (
                                    field.type !== 'readonly' &&
                                    field.type !== 'action'
                                  ) {
                                    return null;
                                  }

                                  if (field.type === 'readonly') {
                                    const readonlyValue =
                                      isConsultationPrescriptionSection &&
                                      currentPrescriptionLegalSnapshot &&
                                      field.key in currentPrescriptionLegalSnapshot
                                        ? (currentPrescriptionLegalSnapshot[
                                            field.key as keyof typeof currentPrescriptionLegalSnapshot
                                          ] as string)
                                        : typeof recordForm.formData[field.key] === 'string'
                                          ? (recordForm.formData[field.key] as string)
                                          : '';

                                    if (
                                      isConsultationDocumentsSection &&
                                      detail.encounterType === 'HOSPITALIZATION' &&
                                      !hasPrintableDocumentValue(readonlyValue)
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <ReadOnlyField
                                        key={field.key}
                                        label={field.label}
                                        value={readonlyValue}
                                      />
                                    );
                                  }

                                  if (field.type === 'action') {
                                    return (
                                      <div
                                        className="space-y-2 text-sm md:col-span-2"
                                        key={field.key}
                                      >
                                        <span className="font-medium text-slate-900">
                                          {field.label}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                          {recordForm.status === 'SIGNED' ? (
                                            <>
                                              <Badge variant="signed">Documento firmado</Badge>
                                              {selectedRecord?.signedAt ? (
                                                <span className="text-xs text-muted-foreground">
                                                  {formatDateTime(selectedRecord.signedAt)}
                                                </span>
                                              ) : null}
                                            </>
                                          ) : (
                                            <Button
                                              disabled={!selectedRecord || isEpisodeClosed}
                                              onClick={openSignModal}
                                              type="button"
                                              variant="outline"
                                            >
                                              {field.actionLabel ?? 'Firmar'}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  return null;
                                }

                                if (
                                  isEmergencyTriageSection &&
                                  section.key === 'triage_destino' &&
                                  emergencyTriageConditionalReevaluationFields.includes(
                                    field.key,
                                  ) &&
                                  recordForm.formData.requiereReevaluacion !== 'SI'
                                ) {
                                  return null;
                                }
                                if (
                                  isEmergencyTriageSection &&
                                  section.key === 'triage_procedencia_ingreso' &&
                                  emergencyTriageConditionalReferenceFields.includes(
                                    field.key,
                                  ) &&
                                  recordForm.formData.ingresoPorReferencia !== 'SI'
                                ) {
                                  return null;
                                }

                                if (field.type === 'subtitle') {
                                  return (
                                    <div
                                      className="pt-2 text-sm md:col-span-2"
                                      key={field.key}
                                    >
                                      <span className="font-medium text-slate-900">
                                        {field.label}
                                      </span>
                                    </div>
                                  );
                                }

                                const fieldValue = recordForm.formData[field.key];
                                const isHospitalEvolutionGeneralDataSection =
                                  isHospitalEvolutionSection &&
                                  section.key === 'datos_generales_evol_hosp';

                                if (
                                  isRecordLocked &&
                                  isHospitalEvolutionGeneralDataSection &&
                                  field.type !== 'readonly' &&
                                  field.type !== 'action'
                                ) {
                                  const readonlyValue =
                                    field.type === 'select'
                                      ? field.options?.find(
                                          (option) => option.value === fieldValue,
                                        )?.label ?? ''
                                      : field.type === 'datetime-local' &&
                                          typeof fieldValue === 'string' &&
                                          fieldValue
                                        ? formatDateTime(fieldValue)
                                        : typeof fieldValue === 'string' ||
                                            typeof fieldValue === 'number'
                                          ? String(fieldValue)
                                          : '';

                                  return (
                                    <ReadOnlyField
                                      key={field.key}
                                      label={field.label}
                                      value={readonlyValue}
                                    />
                                  );
                                }

                                if (field.type === 'action') {
                                  return (
                                    <div
                                      className="space-y-2 text-sm md:col-span-2"
                                      key={field.key}
                                    >
                                      <span className="font-medium text-slate-900">
                                        {field.label}
                                        {field.required ? (
                                          <span className="ml-1 text-red-600">*</span>
                                        ) : null}
                                      </span>
                                      <Button
                                        disabled={isRecordLocked}
                                        onClick={() => {
                                          if (field.key === 'generarResumenEgresoUrg') {
                                            setRecordForm((currentValue) =>
                                              currentValue
                                                ? {
                                                    ...currentValue,
                                                    formData: {
                                                      ...currentValue.formData,
                                                      ...buildEmergencyDischargeSnapshot({
                                                        detail,
                                                        triageRecord: latestTriageRecord,
                                                        initialNoteRecord:
                                                          latestEmergencyInitialNoteRecord,
                                                        evolutionRecord:
                                                          latestEmergencyEvolutionRecord,
                                                        ordersRecord:
                                                          latestEmergencyOrdersRecord,
                                                        consultationRecord:
                                                          latestEmergencyConsultationRecord,
                                                        recordedAt:
                                                          currentValue.recordedAt,
                                                        currentFormData:
                                                          currentValue.formData,
                                                      }),
                                                    },
                                                  }
                                                : currentValue,
                                            );
                                          }
                                          if (field.key === 'generarResumenEgresoHosp') {
                                            setRecordForm((currentValue) =>
                                              currentValue
                                                ? {
                                                    ...currentValue,
                                                    formData: {
                                                      ...currentValue.formData,
                                                      ...buildHospitalDischargeSnapshot({
                                                        detail,
                                                        recordedAt:
                                                          currentValue.recordedAt,
                                                        currentFormData:
                                                          currentValue.formData,
                                                      }),
                                                    },
                                                  }
                                                : currentValue,
                                            );
                                          }
                                        }}
                                        type="button"
                                        variant="outline"
                                      >
                                        {field.actionLabel ?? field.label}
                                      </Button>
                                    </div>
                                  );
                                }

                                if (field.type === 'readonly') {
                                  return (
                                    <ReadOnlyField
                                      key={field.key}
                                      label={field.label}
                                      value={
                                        typeof fieldValue === 'string' ||
                                        typeof fieldValue === 'number'
                                          ? String(fieldValue)
                                          : ''
                                      }
                                    />
                                  );
                                }

                                if (
                                  field.key === triageOtherClinicalDiscriminatorFieldKey &&
                                  recordForm.formData.discOtro !== true
                                ) {
                                  return null;
                                }

                                if (field.type === 'textarea') {
                                  return (
                                    <label
                                      className="space-y-2 text-sm md:col-span-2"
                                      key={field.key}
                                    >
                                      <span className="font-medium text-slate-900">
                                        {field.label}
                                      </span>
                                      <Textarea
                                        disabled={isRecordLocked}
                                        onChange={(event) =>
                                          updateRecordFormDataField(
                                            field.key,
                                            event.target.value,
                                          )
                                        }
                                        placeholder={field.placeholder}
                                        required={
                                          field.key ===
                                            triageOtherClinicalDiscriminatorFieldKey &&
                                          recordForm.formData.discOtro === true
                                        }
                                        value={typeof fieldValue === 'string' ? fieldValue : ''}
                                      />
                                    </label>
                                  );
                                }

                                if (field.type === 'select') {
                                  return (
                                    <label className="space-y-2 text-sm" key={field.key}>
                                      <span className="font-medium text-slate-900">
                                        {field.label}
                                        {field.required ? (
                                          <span className="ml-1 text-red-600">*</span>
                                        ) : null}
                                      </span>
                                      <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        disabled={isRecordLocked}
                                        onChange={(event) =>
                                          updateRecordFormDataField(
                                            field.key,
                                            event.target.value,
                                          )
                                        }
                                        required={field.required}
                                        value={typeof fieldValue === 'string' ? fieldValue : ''}
                                      >
                                        {(field.options ?? []).map((option) => (
                                          <option
                                            key={option.value || 'empty'}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  );
                                }

                                if (field.type === 'checkbox') {
                                  return (
                                    <label
                                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                                      key={field.key}
                                    >
                                      <input
                                        checked={Boolean(fieldValue)}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        disabled={isRecordLocked}
                                        onChange={(event) => {
                                          if (
                                            isEmergencyOrdersSection &&
                                            field.key === 'transfusionAplica' &&
                                            !event.target.checked
                                          ) {
                                            const hasTransfusionCapture = [
                                              'transfusionTipoHemoderivado',
                                              'transfusionOtroHemoderivado',
                                              'transfusionUnidades',
                                              'transfusionVolumen',
                                              'transfusionHoraInicio',
                                              'transfusionHoraFin',
                                              'transfusionReaccionAdversa',
                                              'transfusionReacciones',
                                              'transfusionPersonalAplica',
                                              'transfusionServicioAplica',
                                              'transfusionObservaciones',
                                            ].some((fieldKey) =>
                                              Boolean(recordForm.formData[fieldKey]),
                                            );

                                            if (
                                              hasTransfusionCapture &&
                                              !window.confirm(
                                                'Desactivar transfusión descartará los datos capturados de este bloque. ¿Deseas continuar?',
                                              )
                                            ) {
                                              return;
                                            }

                                            setRecordForm((currentValue) =>
                                              currentValue
                                                ? {
                                                    ...currentValue,
                                                    formData: {
                                                      ...currentValue.formData,
                                                      transfusionAplica: false,
                                                      transfusionTipoHemoderivado: '',
                                                      transfusionOtroHemoderivado: '',
                                                      transfusionUnidades: '',
                                                      transfusionVolumen: '',
                                                      transfusionHoraInicio: '',
                                                      transfusionHoraFin: '',
                                                      transfusionReaccionAdversa: 'NO',
                                                      transfusionReacciones: '',
                                                      transfusionPersonalAplica: '',
                                                      transfusionServicioAplica: '',
                                                      transfusionObservaciones: '',
                                                    },
                                                  }
                                                : currentValue,
                                            );
                                            return;
                                          }

                                          updateRecordFormDataField(
                                            field.key,
                                            event.target.checked,
                                          );
                                        }}
                                        type="checkbox"
                                      />
                                      <span className="font-medium text-slate-900">
                                        {field.label}
                                      </span>
                                    </label>
                                  );
                                }

                                if (field.type === 'string-array') {
                                  const items = Array.isArray(fieldValue)
                                    ? fieldValue.filter(
                                        (value): value is string => typeof value === 'string',
                                      )
                                    : [];

                                  return (
                                    <div
                                      className="space-y-3 text-sm md:col-span-2"
                                      key={field.key}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-900">
                                          {field.label}
                                        </span>
                                        <Button
                                          disabled={isRecordLocked}
                                          onClick={() =>
                                            updateRecordFormDataField(field.key, [...items, ''])
                                          }
                                          size="sm"
                                          type="button"
                                          variant="outline"
                                        >
                                          {field.itemAddLabel ?? 'Agregar'}
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {items.length > 0 ? (
                                          items.map((item, itemIndex) => (
                                            <div
                                              className="flex gap-2"
                                              key={`${field.key}-${itemIndex}`}
                                            >
                                              <Input
                                                disabled={isRecordLocked}
                                                onChange={(event) => {
                                                  const nextItems = [...items];
                                                  nextItems[itemIndex] = event.target.value;
                                                  updateRecordFormDataField(field.key, nextItems);
                                                }}
                                                value={item}
                                              />
                                              <Button
                                                disabled={isRecordLocked}
                                                onClick={() =>
                                                  updateRecordFormDataField(
                                                    field.key,
                                                    items.filter(
                                                      (_, currentIndex) =>
                                                        currentIndex !== itemIndex,
                                                    ),
                                                  )
                                                }
                                                size="icon"
                                                type="button"
                                                variant="outline"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground">
                                            Aún no hay elementos agregados.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }

                                if (field.type === 'object-array') {
                                  const isEmergencyEvolutionDiagnosisList =
                                    field.key === emergencyEvolutionDiagnosisFieldKey;
                                  const isEmergencyEvolutionDiagnosticResultsList =
                                    field.key === emergencyEvolutionDiagnosticResultsFieldKey;
                                  const items: Record<string, unknown>[] =
                                    isEmergencyEvolutionDiagnosisList
                                      ? normalizeEmergencyEvolutionDiagnoses(fieldValue)
                                      : isEmergencyEvolutionDiagnosticResultsList
                                        ? normalizeEmergencyEvolutionDiagnosticResults(
                                            fieldValue,
                                            recordForm.formData,
                                          )
                                      : Array.isArray(fieldValue)
                                        ? fieldValue.filter(
                                            (value): value is Record<string, unknown> =>
                                              Boolean(value) &&
                                              typeof value === 'object' &&
                                              !Array.isArray(value),
                                          )
                                        : [];

                                  if (isEmergencyEvolutionDiagnosticResultsList) {
                                    const updateDiagnosticResultItem = (
                                      itemIndex: number,
                                      fieldKey: string,
                                      value: string,
                                    ) => {
                                      const nextItems = [...items];
                                      nextItems[itemIndex] = {
                                        ...nextItems[itemIndex],
                                        [fieldKey]: value,
                                      };
                                      updateRecordFormDataField(field.key, nextItems);
                                    };
                                    const addDiagnosticResultItem = () => {
                                      updateRecordFormDataField(field.key, [
                                        ...items,
                                        normalizeEmergencyEvolutionDiagnosticResultItem({}),
                                      ]);
                                    };
                                    const removeDiagnosticResultItem = (
                                      item: Record<string, unknown>,
                                      itemIndex: number,
                                    ) => {
                                      if (
                                        hasEmergencyEvolutionDiagnosticResultValue(item) &&
                                        !window.confirm(
                                          'Eliminar resultado puede descartar información capturada. ¿Deseas continuar?',
                                        )
                                      ) {
                                        return;
                                      }

                                      updateRecordFormDataField(
                                        field.key,
                                        items.filter(
                                          (_, currentIndex) =>
                                            currentIndex !== itemIndex,
                                        ),
                                      );
                                    };

                                    return (
                                      <div
                                        className="space-y-3 text-sm md:col-span-2"
                                        key={field.key}
                                      >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                          <span className="font-medium text-slate-900">
                                            {field.label}
                                          </span>
                                          {!isRecordLocked ? (
                                            <Button
                                              onClick={addDiagnosticResultItem}
                                              size="sm"
                                              type="button"
                                              variant="outline"
                                            >
                                              {field.itemAddLabel ??
                                                'Agregar resultado de estudio'}
                                            </Button>
                                          ) : null}
                                        </div>
                                        <div className="space-y-3">
                                          {items.length > 0 ? (
                                            items.map((item, itemIndex) => {
                                              const studyType = readTextRecordValue(
                                                item,
                                                'tipoEstudio',
                                              );
                                              const studyLabel = [
                                                emergencyEvolutionDiagnosticStudyTypeLabels[
                                                  studyType
                                                ] ?? studyType,
                                                studyType === 'OTRO'
                                                  ? readTextRecordValue(
                                                      item,
                                                      'otroEstudio',
                                                    )
                                                  : '',
                                              ]
                                                .filter(Boolean)
                                                .join(' · ');

                                              return (
                                                <div
                                                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
                                                  key={`${field.key}-${
                                                    readTextRecordValue(item, 'id') ||
                                                    itemIndex
                                                  }`}
                                                >
                                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                      {`Resultado de estudio ${itemIndex + 1}`}
                                                    </p>
                                                    {!isRecordLocked ? (
                                                      <Button
                                                        onClick={() =>
                                                          removeDiagnosticResultItem(
                                                            item,
                                                            itemIndex,
                                                          )
                                                        }
                                                        size="sm"
                                                        type="button"
                                                        variant="outline"
                                                      >
                                                        {field.itemRemoveLabel ??
                                                          'Eliminar resultado'}
                                                      </Button>
                                                    ) : null}
                                                  </div>

                                                  {isRecordLocked ? (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                      <ReadOnlyField
                                                        label="Tipo de estudio"
                                                        value={studyLabel}
                                                      />
                                                      <ReadOnlyField
                                                        label="Fecha y hora"
                                                        value={
                                                          readTextRecordValue(
                                                            item,
                                                            'fechaHoraEstudio',
                                                          )
                                                            ? formatDateTime(
                                                                readTextRecordValue(
                                                                  item,
                                                                  'fechaHoraEstudio',
                                                                ),
                                                              )
                                                            : ''
                                                        }
                                                      />
                                                      <ReadOnlyField
                                                        label="Problema en estudio"
                                                        value={readTextRecordValue(
                                                          item,
                                                          'problemaEstudio',
                                                        )}
                                                      />
                                                      <div className="md:col-span-2">
                                                        <ReadOnlyField
                                                          label="Resultado"
                                                          value={readTextRecordValue(
                                                            item,
                                                            'resultado',
                                                          )}
                                                        />
                                                      </div>
                                                      <div className="md:col-span-2">
                                                        <ReadOnlyField
                                                          label="Interpretación clínica"
                                                          value={readTextRecordValue(
                                                            item,
                                                            'interpretacionClinica',
                                                          )}
                                                        />
                                                      </div>
                                                      {readTextRecordValue(
                                                        item,
                                                        'incidentes',
                                                      ) ? (
                                                        <div className="md:col-span-2">
                                                          <ReadOnlyField
                                                            label="Incidentes"
                                                            value={readTextRecordValue(
                                                              item,
                                                              'incidentes',
                                                            )}
                                                          />
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  ) : (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                      <label className="space-y-2 text-sm">
                                                        <span className="font-medium text-slate-900">
                                                          Tipo de estudio
                                                        </span>
                                                        <select
                                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                          onChange={(event) =>
                                                            updateDiagnosticResultItem(
                                                              itemIndex,
                                                              'tipoEstudio',
                                                              event.target.value,
                                                            )
                                                          }
                                                          value={studyType}
                                                        >
                                                          {(field.itemFields?.find(
                                                            (itemField) =>
                                                              itemField.key ===
                                                              'tipoEstudio',
                                                          )?.options ?? []).map(
                                                            (option) => (
                                                              <option
                                                                key={
                                                                  option.value ||
                                                                  'empty'
                                                                }
                                                                value={option.value}
                                                              >
                                                                {option.label}
                                                              </option>
                                                            ),
                                                          )}
                                                        </select>
                                                      </label>
                                                      {studyType === 'OTRO' ? (
                                                        <label className="space-y-2 text-sm">
                                                          <span className="font-medium text-slate-900">
                                                            Estudio realizado
                                                          </span>
                                                          <Input
                                                            onChange={(event) =>
                                                              updateDiagnosticResultItem(
                                                                itemIndex,
                                                                'otroEstudio',
                                                                event.target.value,
                                                              )
                                                            }
                                                            value={readTextRecordValue(
                                                              item,
                                                              'otroEstudio',
                                                            )}
                                                          />
                                                        </label>
                                                      ) : null}
                                                      <label className="space-y-2 text-sm">
                                                        <span className="font-medium text-slate-900">
                                                          Fecha y hora del estudio
                                                        </span>
                                                        <Input
                                                          onChange={(event) =>
                                                            updateDiagnosticResultItem(
                                                              itemIndex,
                                                              'fechaHoraEstudio',
                                                              event.target.value,
                                                            )
                                                          }
                                                          type="datetime-local"
                                                          value={readTextRecordValue(
                                                            item,
                                                            'fechaHoraEstudio',
                                                          )}
                                                        />
                                                      </label>
                                                      <label className="space-y-2 text-sm md:col-span-2">
                                                        <span className="font-medium text-slate-900">
                                                          Problema en estudio
                                                        </span>
                                                        <Textarea
                                                          onChange={(event) =>
                                                            updateDiagnosticResultItem(
                                                              itemIndex,
                                                              'problemaEstudio',
                                                              event.target.value,
                                                            )
                                                          }
                                                          value={readTextRecordValue(
                                                            item,
                                                            'problemaEstudio',
                                                          )}
                                                        />
                                                      </label>
                                                      <label className="space-y-2 text-sm md:col-span-2">
                                                        <span className="font-medium text-slate-900">
                                                          Resultado
                                                        </span>
                                                        <Textarea
                                                          onChange={(event) =>
                                                            updateDiagnosticResultItem(
                                                              itemIndex,
                                                              'resultado',
                                                              event.target.value,
                                                            )
                                                          }
                                                          value={readTextRecordValue(
                                                            item,
                                                            'resultado',
                                                          )}
                                                        />
                                                      </label>
                                                      <label className="space-y-2 text-sm md:col-span-2">
                                                        <span className="font-medium text-slate-900">
                                                          Interpretación clínica
                                                        </span>
                                                        <Textarea
                                                          onChange={(event) =>
                                                            updateDiagnosticResultItem(
                                                              itemIndex,
                                                              'interpretacionClinica',
                                                              event.target.value,
                                                            )
                                                          }
                                                          value={readTextRecordValue(
                                                            item,
                                                            'interpretacionClinica',
                                                          )}
                                                        />
                                                      </label>
                                                      <label className="space-y-2 text-sm md:col-span-2">
                                                        <span className="font-medium text-slate-900">
                                                          Incidentes
                                                        </span>
                                                        <Textarea
                                                          onChange={(event) =>
                                                            updateDiagnosticResultItem(
                                                              itemIndex,
                                                              'incidentes',
                                                              event.target.value,
                                                            )
                                                          }
                                                          value={readTextRecordValue(
                                                            item,
                                                            'incidentes',
                                                          )}
                                                        />
                                                      </label>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <p className="text-xs text-muted-foreground">
                                              Aún no hay resultados de estudios agregados
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  const addObjectArrayItem = () => {
                                    const nextItem = isEmergencyEvolutionDiagnosisList
                                      ? normalizeEmergencyEvolutionDiagnosisItem({})
                                      : Object.fromEntries(
                                          (field.itemFields ?? []).map((itemField) => [
                                            itemField.key,
                                            buildDefaultFieldValue(itemField),
                                          ]),
                                        );

                                    if (isEmergencyEvolutionDiagnosisList) {
                                      pendingDiagnosisFocusIdRef.current =
                                        nextItem.id as string;
                                    }

                                    updateRecordFormDataField(field.key, [
                                      ...items,
                                      nextItem,
                                    ]);
                                  };
                                  const removeObjectArrayItem = (
                                    item: Record<string, unknown>,
                                    itemIndex: number,
                                  ) => {
                                    const shouldConfirm =
                                      isEmergencyEvolutionDiagnosisList &&
                                      (hasEmergencyEvolutionDiagnosisValue(item) ||
                                        Boolean(selectedRecord));

                                    if (
                                      shouldConfirm &&
                                      !window.confirm(
                                        'Eliminar diagnóstico puede descartar información capturada. ¿Deseas continuar?',
                                      )
                                    ) {
                                      return;
                                    }

                                    updateRecordFormDataField(
                                      field.key,
                                      items.filter(
                                        (_, currentIndex) =>
                                          currentIndex !== itemIndex,
                                      ),
                                    );
                                  };

                                  return (
                                    <div
                                      className="space-y-3 text-sm md:col-span-2"
                                      key={field.key}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-900">
                                          {field.label}
                                        </span>
                                        <Button
                                          disabled={isRecordLocked}
                                          onClick={addObjectArrayItem}
                                          size="sm"
                                          type="button"
                                          variant="outline"
                                        >
                                          {field.itemAddLabel ?? 'Agregar'}
                                        </Button>
                                      </div>
                                      <div className="space-y-3">
                                        {items.length > 0 ? (
                                          items.map((item, itemIndex) => (
                                            <div
                                              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
                                              key={`${field.key}-${
                                                typeof item.id === 'string' && item.id
                                                  ? item.id
                                                  : itemIndex
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-900">
                                                  {`${field.label} ${itemIndex + 1}`}
                                                </p>
                                                <Button
                                                  disabled={isRecordLocked}
                                                  className={
                                                    field.disableItemRemoval
                                                      ? 'hidden'
                                                      : undefined
                                                  }
                                                  onClick={() =>
                                                    removeObjectArrayItem(
                                                      item,
                                                      itemIndex,
                                                    )
                                                  }
                                                  size="sm"
                                                  type="button"
                                                  variant="outline"
                                                >
                                                  {field.itemRemoveLabel ?? 'Eliminar'}
                                                </Button>
                                              </div>
                                              <div className="grid gap-3 md:grid-cols-2">
                                                {(field.itemFields ?? []).map((itemField) => {
                                                  const itemFieldValue = item[itemField.key];

                                                  if (itemField.type === 'select') {
                                                    return (
                                                      <label
                                                        className="space-y-2 text-sm"
                                                        key={`${field.key}-${itemIndex}-${itemField.key}`}
                                                      >
                                                        <span className="font-medium text-slate-900">
                                                          {itemField.label}
                                                        </span>
                                                        <select
                                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                          disabled={isRecordLocked}
                                                          onChange={(event) => {
                                                            const nextItems = [...items];
                                                            nextItems[itemIndex] = {
                                                              ...nextItems[itemIndex],
                                                              [itemField.key]: event.target.value,
                                                            };
                                                            updateRecordFormDataField(
                                                              field.key,
                                                              nextItems,
                                                            );
                                                          }}
                                                          value={
                                                            typeof itemFieldValue === 'string'
                                                              ? itemFieldValue
                                                              : ''
                                                          }
                                                        >
                                                          {(itemField.options ?? []).map((option) => (
                                                            <option
                                                              key={option.value || 'empty'}
                                                              value={option.value}
                                                            >
                                                              {option.label}
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </label>
                                                    );
                                                  }

                                                  return (
                                                    <label
                                                      className="space-y-2 text-sm"
                                                      key={`${field.key}-${itemIndex}-${itemField.key}`}
                                                    >
                                                      <span className="font-medium text-slate-900">
                                                        {itemField.label}
                                                      </span>
                                                      <Input
                                                        data-diagnosis-input-id={
                                                          isEmergencyEvolutionDiagnosisList &&
                                                          itemField.key === 'diagnostico' &&
                                                          typeof item.id === 'string'
                                                            ? item.id
                                                            : undefined
                                                        }
                                                        disabled={isRecordLocked}
                                                        onChange={(event) => {
                                                          const nextItems = [...items];
                                                          nextItems[itemIndex] = {
                                                            ...nextItems[itemIndex],
                                                            [itemField.key]: event.target.value,
                                                          };
                                                          updateRecordFormDataField(
                                                            field.key,
                                                            nextItems,
                                                          );
                                                        }}
                                                        type={
                                                          itemField.type === 'date'
                                                            ? 'date'
                                                            : itemField.type
                                                        }
                                                        value={
                                                          typeof itemFieldValue === 'string'
                                                            ? itemFieldValue
                                                            : ''
                                                        }
                                                      />
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground">
                                            {isEmergencyEvolutionDiagnosisList
                                              ? 'Aún no hay diagnósticos agregados'
                                              : 'Aún no hay elementos agregados.'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <label className="space-y-2 text-sm" key={field.key}>
                                    <span className="font-medium text-slate-900">
                                      {field.label}
                                      {field.required ? (
                                        <span className="ml-1 text-red-600">*</span>
                                      ) : null}
                                    </span>
                                    <Input
                                      disabled={isRecordLocked}
                                      min={field.key === 'diaEstanciaHosp' ? '1' : undefined}
                                      onChange={(event) => {
                                        const nextValue =
                                          field.key === 'diaEstanciaHosp'
                                            ? event.target.value.replace(/\D/g, '')
                                            : event.target.value;

                                        updateRecordFormDataField(field.key, nextValue);
                                      }}
                                      placeholder={field.placeholder}
                                      step={field.key === 'diaEstanciaHosp' ? '1' : undefined}
                                      type={field.type === 'date' ? 'date' : field.type}
                                      value={typeof fieldValue === 'string' ? fieldValue : ''}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                            )}
                            {isEmergencyDischargeSection &&
                            section.key === 'egreso_urg_certificado_defuncion' ? (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Archivo digital
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Adjunta la copia digitalizada del certificado oficial externo.
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                      <Paperclip className="h-4 w-4" />
                                      Seleccionar PDF/JPG/PNG
                                      <input
                                        accept="application/pdf,image/jpeg,image/png"
                                        className="hidden"
                                        disabled={isRecordLocked || isEpisodeClosed}
                                        multiple
                                        onChange={(event) =>
                                          selectDeathCertificateFiles(
                                            Array.from(event.target.files ?? []),
                                          )
                                        }
                                        type="file"
                                      />
                                    </label>
                                    <Button
                                      className="gap-2"
                                      disabled={
                                        uploadAttachmentsMutation.isPending ||
                                        isRecordLocked ||
                                        isEpisodeClosed
                                      }
                                      onClick={submitPendingFiles}
                                      type="button"
                                      variant="outline"
                                    >
                                      <FileUp className="h-4 w-4" />
                                      {uploadAttachmentsMutation.isPending
                                        ? 'Cargando...'
                                        : 'Subir copia'}
                                    </Button>
                                  </div>
                                </div>
                                {pendingFiles.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {pendingFiles.map((file) => (
                                      <Badge key={file.name} variant="secondary">
                                        {file.name}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                            );
                          })}
                      </div>
                    ) : null}

                    {activeTab === 'Documentos' &&
                    detail.encounterType !== 'EMERGENCY' &&
                    detail.encounterType !== 'HOSPITALIZATION' ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Archivos del episodio
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              Adjunta documentos, estudios y archivos relacionados con el episodio clínico.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                              <Paperclip className="h-4 w-4" />
                              Seleccionar archivos

                              <input
                                className="hidden"
                                disabled={isEpisodeClosed}
                                multiple
                                onChange={(event) =>
                                  setPendingFiles(Array.from(event.target.files ?? []))
                                }
                                type="file"
                              />
                            </label>
                            <Button
                              className="gap-2"
                              disabled={uploadAttachmentsMutation.isPending || isEpisodeClosed}
                              onClick={submitPendingFiles}
                              type="button"
                            >
                              <FileUp className="h-4 w-4" />
                              {uploadAttachmentsMutation.isPending
                                ? 'Cargando...'
                                : 'Subir archivos'}
                            </Button>
                          </div>
                        </div>

                        {pendingFiles.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {pendingFiles.map((file) => (
                              <Badge key={file.name} variant="secondary">
                                {file.name}
                              </Badge>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-3">
                          {detail.attachments.length > 0 ? (
                            detail.attachments.map((attachment) => (
                              <div
                                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                                key={attachment.id}
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {attachment.fileName}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {attachment.mimeType} ·{' '}
                                    {Number(attachment.fileSizeBytes).toLocaleString('es-MX')}{' '}
                                    bytes · {formatDateTime(attachment.uploadedAt)}
                                  </p>
                                </div>
                                <Button
                                  className="gap-2"
                                  disabled={deleteAttachmentMutation.isPending || isEpisodeClosed}
                                  onClick={() =>
                                    deleteAttachmentMutation.mutate(attachment.id)
                                  }
                                  type="button"
                                  variant="outline"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Quitar
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
                              <p className="text-sm font-medium text-slate-900">
                                No hay archivos cargados todavía
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Cuando agregues documentos del episodio aquí se
                                listarán para consulta posterior.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </SectionCard>

                {feedback ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      feedback.toLowerCase().includes('correctamente')
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {feedback}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {!isEmergencySummaryTab && !isHospitalSummaryTab ? (
          <div className="space-y-6">
            <SectionCard
              description="Resumen rápido e información clave para el seguimiento del episodio."
              title="Panel lateral"
              icon={PanelRight}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2">
                      <HeartPulse className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Alergias activas
                      </p>
                      <p className="text-xs text-slate-500">
                        Registros clínicos asociados
                      </p>
                    </div>
                  </div>
                  <Badge variant="alert">
                    {detail.metrics.allergies}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 transition-colors hover:border-violet-200 hover:bg-violet-50/40">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-100 p-2">
                      <ClipboardList className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Problemas
                      </p>
                      <p className="text-xs text-slate-500">
                        Seguimiento y condiciones registradas
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {detail.metrics.problems}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 transition-colors hover:border-sky-200 hover:bg-sky-50/40">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-sky-100 p-2">
                      <CalendarDays className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Labs e imágenes
                      </p>
                      <p className="text-xs text-slate-500">
                        Estudios asociados al episodio
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {detail.metrics.labs + detail.metrics.imaging}
                  </Badge>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              description="Actividad reciente relacionada con la atención y evolución del episodio."
              title="Timeline"
              icon={History}
            >
              <div className="space-y-5">
                {detail.timeline.map((event, index) => {
                  const eventConfig = timelineKindConfig[event.kind];
                  const EventIcon = eventConfig.icon;

                  return (
                    <div className="relative flex gap-4" key={event.id}>
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${eventConfig.className}`}
                        >
                          <EventIcon className="h-4 w-4" />
                        </div>
                        {index !== detail.timeline.length - 1 && (
                          <div className="mt-2 h-full w-px bg-slate-200" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {event.label}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${eventConfig.className}`}
                          >
                            {eventConfig.label}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                          {event.detail}
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              description="Información clave para validación administrativa y clínica."
              title="Contexto rapido"
              icon={Info}
            >
              <div className="space-y-3">
                <InfoRow
                  label="Nacimiento"
                  value={formatDate(detail.patient.birthDate)}
                />
                <InfoRow
                  label="Unidad"
                  value={detail.facility?.name ?? 'Sin sede'}
                />
                <InfoRow
                  label="Registro"
                  value={detail.medicalRecord.recordNumber}
                />
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-100 p-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900">
                        Contexto clínico del episodio
                      </p>
                      <p className="text-sm leading-relaxed text-amber-700">
                        El episodio mantiene relaciones clínicas y administrativas vinculadas
                        para asegurar continuidad y trazabilidad de atención.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
          ) : null}
        </div>

        {isSigningRecord ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
            role="dialog"
          >
            <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Confirmar firma clínica
                </h3>
                <p className="text-sm text-muted-foreground">
                  Esta acción valida clínicamente el documento y lo dejará bloqueado
                  para edición. Ingresa tu contraseña para continuar.
                </p>
                {isHospitalDischargeSection ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                    Al firmar esta nota de egreso, el episodio se cerrará y el
                    expediente quedará en modo solo lectura.
                  </p>
                ) : null}
              </div>

              <label className="mt-5 block space-y-2 text-sm">
                <span className="font-medium text-slate-900">Contraseña</span>
                <Input
                  autoFocus
                  onChange={(event) => setSignaturePassword(event.target.value)}
                  type="password"
                  value={signaturePassword}
                />
              </label>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setIsSigningRecord(false);
                    setSignaturePassword('');
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  className="gap-2"
                  disabled={signRecordMutation.isPending}
                  onClick={confirmSignature}
                  type="button"
                >
                  {signRecordMutation.isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Firmar documento'
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
