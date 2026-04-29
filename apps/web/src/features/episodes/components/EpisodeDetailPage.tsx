import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
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
  UserRound,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatDate, formatDateTime } from '../../../shared/lib/formatters';
import type {
  EncounterDetailResponse,
  UpdateEncounterRequest,
} from '../../../shared/types/contracts';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  createEncounterSectionRecord,
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
  getConsultationDocumentTabDefinition,
  getConsultationDocumentTypes,
  buildHistoryVersionPrefill,
  buildInitialStructuredSections,
  getEpisodeTabDefinition,
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
  return encounterType === 'OUTPATIENT' && tabTitle === 'Documentos';
}

function isEmergencyTriageTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Triage';
}

function isEmergencyInitialNoteTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Nota inicial';
}

function isEmergencyEvolutionTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Evolución';
}

function isEmergencyOrdersTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Órdenes / Indicaciones';
}

function isEmergencyConsultationTab(encounterType: string, tabTitle: string) {
  return encounterType === 'EMERGENCY' && tabTitle === 'Interconsultas';
}

function buildTriageTitle(versionNumber: number) {
  return `Triage V${versionNumber}`;
}

function buildEmergencyInitialNoteTitle(versionNumber: number) {
  return `Nota inicial V${versionNumber}`;
}

function buildEmergencyEvolutionTitle(versionNumber: number) {
  return `Evolución en urgencias V${versionNumber}`;
}

function buildEmergencyOrdersTitle(versionNumber: number) {
  return `Órdenes e indicaciones V${versionNumber}`;
}

function buildEmergencyConsultationTitle(versionNumber: number) {
  return `Interconsultas V${versionNumber}`;
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

  const scoreFr = fr <= 8 ? 3 : fr <= 11 ? 1 : fr <= 20 ? 0 : fr <= 24 ? 2 : 3;
  const scoreSpo2 = spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0;
  const scoreTemp = temp <= 35 ? 3 : temp <= 36 ? 1 : temp <= 38 ? 0 : temp <= 39 ? 1 : 2;
  const scoreTa =
    taSistolica <= 90
      ? 3
      : taSistolica <= 100
        ? 2
        : taSistolica <= 110
          ? 1
          : taSistolica <= 219
            ? 0
            : 3;
  const scoreFc = fc <= 40 ? 3 : fc <= 50 ? 1 : fc <= 90 ? 0 : fc <= 110 ? 1 : fc <= 130 ? 2 : 3;

  return String(scoreFr + scoreSpo2 + scoreTemp + scoreTa + scoreFc);
}

function buildTriageAutomaticAlerts(formData: Record<string, RecordFieldValue>) {
  const alerts: string[] = [];
  const discriminators = [
    ['discDolorToracico', 'Dolor torácico'],
    ['discDisneaSevera', 'Disnea severa'],
    ['discSangradoActivo', 'Sangrado activo'],
    ['discAlteracionConciencia', 'Alteración del estado de conciencia'],
    ['discSepsis', 'Sospecha de sepsis'],
    ['discTraumaMayor', 'Trauma mayor'],
  ] as const;

  discriminators.forEach(([key, label]) => {
    if (formData[key] === true) {
      alerts.push(label);
    }
  });

  const spo2 = readNumericFormValue(formData.spo2);
  const taSistolica = readNumericFormValue(formData.taSistolica);
  const fc = readNumericFormValue(formData.fc);
  const temp = readNumericFormValue(formData.temp);
  const glasgowTotal = readNumericFormValue(formData.glasgowTotal);
  const news2Total = readNumericFormValue(formData.news2Total);

  if (spo2 !== null && spo2 < 92) alerts.push('SpO2 menor a 92%');
  if (taSistolica !== null && taSistolica < 90) alerts.push('TA sistólica menor a 90 mmHg');
  if (fc !== null && (fc < 40 || fc > 130)) alerts.push('Frecuencia cardiaca crítica');
  if (temp !== null && temp >= 39) alerts.push('Fiebre alta');
  if (glasgowTotal !== null && glasgowTotal < 13) alerts.push('Glasgow menor a 13');
  if (news2Total !== null && news2Total >= 5) alerts.push('NEWS2 alto');

  return [...new Set(alerts)].join('\n');
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
    estadoMentalNota: readCurrentOrTriage('estadoMentalNota', 'estadoMental'),
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
    ? [{ diagnostico, cie10, estado: 'ACTIVO' }]
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
    diagnosticosEvolucionUrg:
      Array.isArray(currentFormData.diagnosticosEvolucionUrg) &&
      currentFormData.diagnosticosEvolucionUrg.length > 0
        ? currentFormData.diagnosticosEvolucionUrg
        : Array.isArray(previousFormData.diagnosticosEvolucionUrg) &&
            previousFormData.diagnosticosEvolucionUrg.length > 0
          ? previousFormData.diagnosticosEvolucionUrg
          : buildEmergencyEvolutionDiagnoses(initialFormData),
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
      'consentimientoInicial',
    )
      ? readString(currentFormData.consentimientoVigenteUrg) ||
        readString(previousFormData.consentimientoVigenteUrg) ||
        'VIGENTE'
      : '',
    informacionBrindadaUrg: readCurrentOrSource(
      'informacionBrindadaUrg',
      'informacionBrindadaUrg',
      'consentimientoInicial',
    ),
    resultadosEstudiosIntegrados:
      args.detail.metrics.labs || args.detail.metrics.imaging
        ? `Laboratorio: ${args.detail.metrics.labs} · Imagenología: ${args.detail.metrics.imaging}`
        : 'Sin resultados externos vinculados al episodio.',
    enfermeriaHabitusUrg: 'Sin hoja de enfermería vinculada',
    enfermeriaDolorUrg: 'Sin hoja de enfermería vinculada',
    enfermeriaRiesgoCaidasUrg: 'Sin hoja de enfermería vinculada',
    enfermeriaMedicacionUrg: 'Sin hoja de enfermería vinculada',
    enfermeriaProcedimientosUrg: 'Sin hoja de enfermería vinculada',
    enfermeriaObservacionesUrg: 'Sin hoja de enfermería vinculada',
    enfermeriaResponsableUrg: 'Sin hoja de enfermería vinculada',
    auxEcgUrg: 'Sin ECG vinculado al episodio',
    auxLaboratoriosUrg:
      args.detail.metrics.labs > 0
        ? `${args.detail.metrics.labs} resultado(s) o solicitud(es) de laboratorio`
        : 'Sin laboratorios vinculados',
    auxInterpretacionUrg: 'Sin interpretación externa vinculada',
    auxIncidentesUrg: 'Sin incidentes registrados en servicios auxiliares',
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

function buildEmergencyOrdersSnapshot(args: {
  detail: EncounterDetailResponse;
  initialNoteRecord: EncounterDetailResponse['sectionRecords'][number] | null;
  evolutionRecord: EncounterDetailResponse['sectionRecords'][number] | null;
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
    tipoRegistro: 'Órdenes e indicaciones',
    medicamentosOrdenesUrg: medications,
    estudiosSolicitadosOrdenes: studies,
    monitoreoOrdenes:
      readString(currentFormData.monitoreoOrdenes) || interventionSuggestion,
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
    documentoInstitucionEmisora:
      detail.legalContext.facilityInstitutionName ??
      detail.legalContext.facilityLegalName ??
      detail.legalContext.tenantLegalName ??
      detail.legalContext.tenantName ??
      detail.facility?.name ??
      sessionUser?.facility?.name ??
      sessionUser?.tenant.name ??
      'Sin dato disponible',
    documentoRfcMedico: detail.legalContext.tenantTaxId ?? 'Sin dato disponible',
    documentoLicenciaSanitaria:
      detail.legalContext.facilityLegalName ??
      facilityMeta?.code ??
      'Sin dato disponible',
    documentoCodigoVerificacion: 'Se generará al guardar',
    documentoNombreProfesional:
      detail.attendingClinician?.fullName ??
      clinicalFallback.professionalName ??
      responsibleClinician?.fullName ??
      sessionUser?.fullName ??
      'Sin dato disponible',
    documentoCedulaProfesional:
      detail.attendingClinician?.professionalLicense ??
      clinicalFallback.professionalLicense ??
      responsibleClinician?.professionalLicense ??
      sessionUser?.professionalLicense ??
      'Sin dato disponible',
    documentoEspecialidadProfesional:
      detail.specialty?.name ??
      clinicalFallback.specialty ??
      'Sin dato disponible',
    documentoLugarAtencion:
      [detail.facility?.name, detail.serviceArea?.name].filter(Boolean).join(' · ') ||
      clinicalFallback.place ||
      sessionUser?.facility?.name ||
      'Sin dato disponible',
  };
}

function buildDocumentSuggestionSnapshot(
  detail: EncounterDetailResponse,
  noteType: string,
): Record<string, RecordFieldValue> {
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
  const tabDefinition = getConsultationDocumentTabDefinition(args.noteType);
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
      estado: typeof item.estado === 'string' ? item.estado : '',
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
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
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
      <div className="flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
        {value || 'Sin dato disponible'}
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
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
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
      'documentoInstitucionEmisora',
      'documentoRfcMedico',
      'documentoLicenciaSanitaria',
      'documentoCodigoVerificacion',
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
      ...recordForm.formData,
      tipoTriage: 'Triage',
      tipoRegistro: 'Triage',
      tiempoObjetivoAtencion: calculateTriageTargetTime(
        recordForm.formData.nivelPrioridadTriage,
      ),
      tiempoEspera: calculateTriageWaitTime(
        recordForm.formData.horaLlegada,
        recordForm.formData.horaTriage,
      ),
      glasgowTotal: calculateGlasgowTotal(recordForm.formData),
      news2Total: calculateNews2(recordForm.formData),
      responsableTriage:
        detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
      triageLegalMedico:
        detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
      triageLegalCedula:
        detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
    };
    nextFormData.alertasAutomaticas = buildTriageAutomaticAlerts(nextFormData);
    nextFormData.banderaRojaAutomatica = nextFormData.alertasAutomaticas ? 'SI' : 'NO';

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

    const nextFormData: Record<string, RecordFieldValue> = {
      ...recordForm.formData,
      ...buildEmergencyOrdersSnapshot({
        detail,
        initialNoteRecord: getLatestRecordByTab(detail.sectionRecords, 'Nota inicial'),
        evolutionRecord: getLatestRecordByTab(detail.sectionRecords, 'Evolución'),
        currentFormData: recordForm.formData,
      }),
    };
    const hasChanges = Object.entries(nextFormData).some(
      ([fieldKey, value]) => recordForm.formData[fieldKey] !== value,
    );

    if (!hasChanges && recordForm.noteType === 'Órdenes e indicaciones') {
      return;
    }

    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            noteType: 'Órdenes e indicaciones',
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
  const activeTabRecords = detail.sectionRecords.filter(
    (record) => record.tabKey === activeTab,
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
  const latestEmergencyEvolutionRecord = isEmergencyEvolutionSection
    ? getLatestRecordByTab(activeTabRecords, 'Evolución')
    : getLatestRecordByTab(detail.sectionRecords, 'Evolución');
  const latestEmergencyOrdersRecord = isEmergencyOrdersSection
    ? getLatestRecordByTab(activeTabRecords, 'Órdenes / Indicaciones')
    : getLatestRecordByTab(detail.sectionRecords, 'Órdenes / Indicaciones');
  const latestEmergencyConsultationRecord = isEmergencyConsultationSection
    ? getLatestRecordByTab(activeTabRecords, 'Interconsultas')
    : null;
  const selectedRecord =
    activeRecordId === null
      ? null
      : activeTabRecords.find((record) => record.id === activeRecordId) ?? null;
  const selectedDocumentNoteType =
    selectedRecord?.noteType ??
    recordForm?.noteType ??
    activeTabPanelConfig?.noteTypes?.[0] ??
    getConsultationDocumentTypes()[0];
  const documentWorkspaceDefinition = isConsultationDocumentsSection
    ? getConsultationDocumentTabDefinition(selectedDocumentNoteType)
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
  const nextEmergencyInitialNoteVersionNumber =
    (latestEmergencyInitialNoteRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyEvolutionVersionNumber =
    (latestEmergencyEvolutionRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyOrdersVersionNumber =
    (latestEmergencyOrdersRecord?.metadata.versionNumber ?? 0) + 1;
  const nextEmergencyConsultationVersionNumber =
    (latestEmergencyConsultationRecord?.metadata.versionNumber ?? 0) + 1;
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
              nextHistoryType,
              nextRecordedAt,
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
        getConsultationDocumentTypes()[0];
      const nextTabDefinition = getConsultationDocumentTabDefinition(nextNoteType);

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
            tipoTriage: 'Triage',
            tipoRegistro: 'Triage',
            fechaLlegada: nextRecordedAt,
            horaLlegada: nextRecordedAt,
            horaTriage: nextRecordedAt,
            responsableTriage:
              detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
            triageLegalMedico:
              detail.attendingClinician?.fullName ?? 'Sin profesional responsable',
            triageLegalCedula:
              detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
          },
        }),
      );
      return;
    }

    if (isEmergencyInitialNoteSection) {
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
          title: buildEmergencyInitialNoteTitle(
            nextEmergencyInitialNoteVersionNumber,
          ),
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
            ...buildInitialStructuredSections(detail.encounterType)['Evolución'],
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

      setFeedback(null);
      setActiveRecordId(null);
      setIsCreatingRecord(true);
      setRecordForm(
        buildRecordFormState({
          tabDefinition: activeTabDefinition,
          noteType: 'Órdenes e indicaciones',
          title: buildEmergencyOrdersTitle(nextEmergencyOrdersVersionNumber),
          status: 'DRAFT',
          recordedAt: nextRecordedAt,
          rawFormData: {
            ...buildInitialStructuredSections(detail.encounterType)[
              'Órdenes / Indicaciones'
            ],
            ...buildEmergencyOrdersSnapshot({
              detail,
              initialNoteRecord: latestEmergencyInitialNoteRecord,
              evolutionRecord: latestEmergencyEvolutionRecord,
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
            ? getConsultationDocumentTabDefinition(record.noteType)
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
                    ? {
                        ...(record.formData as Record<string, RecordFieldValue>),
                        tipoTriage: 'Triage',
                        tipoRegistro: 'Triage',
                        responsableTriage:
                          detail.attendingClinician?.fullName ??
                          'Sin profesional responsable',
                        triageLegalMedico:
                          detail.attendingClinician?.fullName ??
                          'Sin profesional responsable',
                        triageLegalCedula:
                          detail.attendingClinician?.professionalLicense ??
                          'Sin cédula',
                      }
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
                        : isEmergencyOrdersSection
                          ? {
                              ...(record.formData as Record<string, RecordFieldValue>),
                              ...buildEmergencyOrdersSnapshot({
                                detail,
                                initialNoteRecord: latestEmergencyInitialNoteRecord,
                                evolutionRecord: latestEmergencyEvolutionRecord,
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
                    : record.formData,
      }),
    );
  };

  const closeRecordWorkspace = () => {
    setIsCreatingRecord(false);
    setActiveRecordId(null);
    setRecordForm(null);
  };

  const updateRecordFormField = <K extends keyof RecordFormState>(
    field: K,
    value: RecordFormState[K],
  ) => {
    setRecordForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            [field]: value,
          }
        : currentValue,
    );
  };

  const updateDocumentRecordType = (nextNoteType: string) => {
    if (!detail) {
      return;
    }

    const nextTabDefinition = getConsultationDocumentTabDefinition(nextNoteType);
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
        ? {
            ...currentValue,
            formData: {
              ...currentValue.formData,
              [fieldKey]: value,
            },
          }
        : currentValue,
    );
  };

  const saveRecord = () => {
    if (!recordForm) {
      return;
    }

    setFeedback(null);

    const payload = {
      tabKey: activeTab,
      noteType: recordForm.noteType.trim(),
      title: recordForm.title.trim() || undefined,
      status: recordForm.status || undefined,
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
                  ? {
                      ...recordForm.formData,
                      tipoTriage: 'Triage',
                      tipoRegistro: 'Triage',
                      responsableTriage:
                        detail.attendingClinician?.fullName ??
                        'Sin profesional responsable',
                      triageLegalMedico:
                        detail.attendingClinician?.fullName ??
                        'Sin profesional responsable',
                      triageLegalCedula:
                        detail.attendingClinician?.professionalLicense ?? 'Sin cédula',
                    }
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

  const historyVersionNumber =
    selectedRecord?.metadata.versionNumber ?? nextHistoryVersionNumber;
  const currentHistoryType =
    (selectedRecord?.metadata.historyType as 'INICIAL' | 'SUBSECUENTE' | null) ??
    nextHistoryType;
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

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          onClick={() => navigate('/episodios')}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a episodios
        </button>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {detail.patient.fullName}
                  </h1>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                      typeConfig?.className ??
                      'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {typeConfig?.label ?? detail.encounterType}
                  </div>
                  <Badge variant={statusConfig.badgeVariant}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="font-mono text-xs text-primary">
                    {detail.encounterNumber}
                  </span>
                  <span>
                    {detail.patient.sexAtBirth} ·{' '}
                    {detail.patient.ageLabel ?? 'Edad no disponible'}
                  </span>
                  <span>{detail.patient.curp ?? 'Sin CURP'}</span>
                  <span>Exp: {detail.medicalRecord.recordNumber}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>{detail.facility?.name ?? 'Sin sede'}</span>
                  <span>
                    {detail.serviceArea?.name ??
                      detail.specialty?.name ??
                      'Sin area clinica'}
                  </span>
                  <span>
                    {detail.attendingClinician?.fullName ?? 'Sin responsable'}
                  </span>
                  <span>{formatDateTime(detail.openedAt)}</span>
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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="gap-2"
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
                    <Save className="h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
            <InfoRow label="Motivo" value={detail.reasonForVisit ?? 'Sin motivo'} />
            <InfoRow
              label="Origen"
              value={admissionSourceLabels[detail.admissionSource ?? ''] ?? 'Sin origen'}
            />
            <InfoRow label="Actualizado" value={formatDateTime(detail.updatedAt)} />
            <InfoRow label="Cierre" value={formatDateTime(detail.closedAt)} />
          </div>
        </div>

        <div className="sticky top-0 z-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === activeTab
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-6">
            {activeTab === 'Resumen' ? (
              <>
                <SectionCard
                  description="Datos base del episodio editables sin salir del resumen."
                  title="Datos base del episodio"
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
                  description="Resumen operativo y clinico del episodio alineado con el dominio actual."
                  title="Vista general"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Paciente
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {detail.patient.fullName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {detail.patient.phone ?? 'Sin telefono'} ·{' '}
                        {detail.patient.email ?? 'Sin correo'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Episodio
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {typeConfig?.label ?? detail.encounterType}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {detail.facility?.name ?? 'Sin sede'} ·{' '}
                        {detail.serviceArea?.name ??
                          detail.specialty?.name ??
                          'Sin area'}
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  description="Indicadores existentes del episodio y sus relaciones clinicas."
                  title="Actividad ligada"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ['Documentos', detail.metrics.documents],
                      ['Diagnosticos', detail.metrics.diagnoses],
                      ['Labs', detail.metrics.labs],
                      ['Imagen', detail.metrics.imaging],
                    ].map(([label, value]) => (
                      <div
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                        key={label}
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  description="Ultimo bloque de signos vitales asociado al episodio."
                  title="Signos vitales"
                >
                  {detail.latestVitalSigns.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {detail.latestVitalSigns.map((item) => (
                        <div
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                          key={item.label}
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">
                            {item.value}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
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
            ) : null}

            {activeTabDefinition ? (
              <>
                <SectionCard
                  description={activeTabDefinition.description}
                  title={activeTabDefinition.title}
                >
                  <div className="space-y-5">
                    {isEpisodeClosed ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Este episodio ya está cerrado. Todo el contenido queda en modo
                        consulta y no permite nuevas capturas, firmas ni adjuntos.
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {activeTabPanelConfig?.contextLabel ?? 'Registros de la sección'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Antes de capturar se muestra el estado vacío; cuando ya
                          existen registros puedes retomarlos o crear uno nuevo,
                          como en Nexus.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(activeTabPanelConfig?.noteTypes?.length
                          ? activeTabPanelConfig.noteTypes
                          : [
                              activeTabPanelConfig?.defaultActionLabel.replace(
                                /^Nueva[s]?\s+/i,
                                '',
                              ) ?? activeTab,
                            ]
                        ).map((noteType) => (
                          <Button
                            className="gap-2"
                            disabled={isEpisodeClosed}
                            key={noteType}
                            onClick={() => startCreatingRecord(noteType)}
                            type="button"
                            variant={
                              activeTabPanelConfig?.noteTypes?.length ? 'outline' : 'default'
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {activeTabPanelConfig?.noteTypes?.length
                              ? noteType
                              : activeTabPanelConfig?.defaultActionLabel ?? 'Nuevo registro'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {!isShowingRecordForm ? (
                      activeTabRecords.length > 0 ? (
                        <div className="space-y-3">
                          {activeTabRecords.map((record) => {
                            const recordStatusConfig =
                              encounterRecordStatusConfig[record.status] ??
                              encounterRecordStatusConfig.DRAFT;

                            return (
                              <button
                                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-primary/30 hover:bg-slate-50"
                                key={record.id}
                                onClick={() => openExistingRecord(record.id)}
                                type="button"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="min-w-0">
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
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {record.authorName ?? 'Sin autor'} ·{' '}
                                      {formatDateTime(record.recordedAt)} · última
                                      actualización {formatDateTime(record.updatedAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-primary">
                                    <PencilLine className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                      Ver o continuar captura
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
                          <FileText className="mx-auto h-8 w-8 text-slate-400" />
                          <p className="mt-3 text-sm font-medium text-slate-900">
                            Esta subsección todavía no tiene registros
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Usa el botón superior para crear la primera captura de{' '}
                            {activeTab.toLowerCase()}.
                          </p>
                        </div>
                      )
                    ) : recordForm ? (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedRecord ? 'Editar registro' : 'Nuevo registro'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {selectedRecord
                                ? 'Puedes continuar la captura, ajustar campos y guardar la nueva versión operativa del registro.'
                                : 'Se abrió la captura contextual de la subsección siguiendo el flujo esperado por tipo de episodio.'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={closeRecordWorkspace}
                              type="button"
                              variant="outline"
                            >
                              Cancelar
                            </Button>
                            <Button
                              className="gap-2"
                              disabled={
                                createRecordMutation.isPending ||
                                updateRecordMutation.isPending ||
                                isRecordLocked ||
                                isEpisodeClosed
                              }
                              onClick={saveRecord}
                              type="button"
                            >
                              <Save className="h-4 w-4" />
                              {createRecordMutation.isPending ||
                              updateRecordMutation.isPending
                                ? 'Guardando...'
                                : 'Guardar registro'}
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {isConsultationHistorySection ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {`Historia clínica versión ${historyVersionNumber}`}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    El título y el tipo se generan automáticamente para
                                    conservar el histórico clínico del episodio.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">{historyTypeLabel}</Badge>
                                  {inheritedFromLabel ? (
                                    <Badge variant="success">{inheritedFromLabel}</Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : isConsultationCurrentSection ? (
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {`Consulta versión ${consultationVersionNumber}`}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    La consulta actual registra el evento clínico del día y
                                    mantiene su propio histórico por episodio.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">{consultationTypeLabel}</Badge>
                                </div>
                              </div>
                            </div>
                          ) : isConsultationEvolutionSection ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {`Evolución V${evolutionVersionNumber}`}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Cada evolución documenta el seguimiento clínico del
                                    episodio sin sobrescribir evoluciones previas.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">SOAP</Badge>
                                </div>
                              </div>
                            </div>
                          ) : isConsultationPrescriptionSection ? (
                            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {`Receta B${prescriptionVersionNumber}`}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Cada receta es independiente, se guarda como borrador
                                    y solo se bloquea cuando se firma con validación de
                                    contraseña.
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
                            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {buildDocumentVersionTitle(
                                      recordForm.noteType,
                                      selectedRecord?.metadata.versionNumber ??
                                        nextDocumentVersionNumber,
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Cada documento se guarda como borrador, se firma con
                                    contraseña y queda bloqueado después de firmarse.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                  {recordForm.noteType === 'Nota de cierre' ? (
                                    <Badge variant="warning">
                                      Al firmarla se cerrará el episodio
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : isEmergencyTriageSection ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedRecord
                                      ? buildTriageTitle(
                                          selectedRecord.metadata.versionNumber ?? 1,
                                        )
                                      : buildTriageTitle(nextTriageVersionNumber)}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    El título se calcula por episodio y este registro solo
                                    pertenece al tab Triage de Urgencias.
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
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedRecord
                                      ? buildEmergencyInitialNoteTitle(
                                          selectedRecord.metadata.versionNumber ?? 1,
                                        )
                                      : buildEmergencyInitialNoteTitle(
                                          nextEmergencyInitialNoteVersionNumber,
                                        )}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Nota médica inicial basada en el último Triage del
                                    episodio, con snapshot editable de signos vitales.
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
                          ) : isEmergencyEvolutionSection ? (
                            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedRecord
                                      ? buildEmergencyEvolutionTitle(
                                          selectedRecord.metadata.versionNumber ?? 1,
                                        )
                                      : buildEmergencyEvolutionTitle(
                                          nextEmergencyEvolutionVersionNumber,
                                        )}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Seguimiento dinámico del mismo episodio con nueva toma
                                    de signos vitales y diagnósticos longitudinales.
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
                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedRecord
                                      ? buildEmergencyOrdersTitle(
                                          selectedRecord.metadata.versionNumber ?? 1,
                                        )
                                      : buildEmergencyOrdersTitle(
                                          nextEmergencyOrdersVersionNumber,
                                        )}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Órdenes operativas del episodio con validaciones y
                                    trazabilidad automática.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    Órdenes e indicaciones
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
                            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 md:col-span-2">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedRecord
                                      ? buildEmergencyConsultationTitle(
                                          selectedRecord.metadata.versionNumber ?? 1,
                                        )
                                      : buildEmergencyConsultationTitle(
                                          nextEmergencyConsultationVersionNumber,
                                        )}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Solicitud formal entre servicios con auditoría de
                                    tiempos y respuesta trazable.
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
                          ) : (
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

                          {isConsultationDocumentsSection ? (
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
                                {getConsultationDocumentTypes().map((noteType) => (
                                  <option key={noteType} value={noteType}>
                                    {noteType}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}

                          {isConsultationPrescriptionSection || isConsultationDocumentsSection ? (
                            <div className="space-y-2 text-sm">
                              <span className="font-medium text-slate-900">Estado</span>
                              <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-slate-700">
                                {
                                  (encounterRecordStatusConfig[recordForm.status] ??
                                    encounterRecordStatusConfig.DRAFT).label
                                }
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
                          isEmergencyEvolutionSection ||
                          isEmergencyOrdersSection ||
                          isEmergencyConsultationSection ? null : (
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

                        {isConsultationDocumentsSection && currentDocumentLegalSnapshot ? (
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
                        isEmergencyEvolutionSection ||
                        isEmergencyOrdersSection ||
                        isEmergencyConsultationSection ? (
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
                                        : isEmergencyEvolutionSection
                                          ? 'Documento de Evolución'
                                          : isEmergencyOrdersSection
                                            ? 'Documento de Órdenes'
                                            : isEmergencyConsultationSection
                                              ? 'Documento de Interconsulta'
                                      : 'Documento oficial del episodio'}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {isConsultationPrescriptionSection
                                    ? 'Estas alertas se recalculan con los medicamentos capturados y se muestran antes de firmar la receta.'
                                    : isEmergencyTriageSection
                                      ? 'La vista previa y el PDF usan la información del registro y respetan su estado firmado o borrador.'
                                      : isEmergencyInitialNoteSection
                                        ? 'La vista previa y el PDF usan el snapshot clínico guardado de la nota inicial.'
                                        : isEmergencyEvolutionSection
                                          ? 'La vista previa y el PDF usan la medición y el seguimiento guardados en esta evolución.'
                                          : isEmergencyOrdersSection
                                            ? 'La vista previa y el PDF usan las órdenes estructuradas y su trazabilidad.'
                                            : isEmergencyConsultationSection
                                              ? 'La vista previa y el PDF usan la solicitud, respuesta y auditoría de tiempos.'
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
                                      !isEmergencyEvolutionSection &&
                                      !isEmergencyOrdersSection &&
                                      !isEmergencyConsultationSection) ||
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

                            return true;
                          })
                          .map((section) => (
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
                            <div className="grid gap-4 md:grid-cols-2">
                              {section.fields.map((field) => {
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

                                const fieldValue = recordForm.formData[field.key];

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
                                        onChange={(event) =>
                                          updateRecordFormDataField(
                                            field.key,
                                            event.target.checked,
                                          )
                                        }
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
                                  const items = Array.isArray(fieldValue)
                                    ? fieldValue.filter(
                                        (value): value is Record<string, unknown> =>
                                          Boolean(value) &&
                                          typeof value === 'object' &&
                                          !Array.isArray(value),
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
                                            updateRecordFormDataField(field.key, [
                                              ...items,
                                              Object.fromEntries(
                                                (field.itemFields ?? []).map((itemField) => [
                                                  itemField.key,
                                                  buildDefaultFieldValue(itemField),
                                                ]),
                                              ),
                                            ])
                                          }
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
                                              key={`${field.key}-${itemIndex}`}
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
                                                    updateRecordFormDataField(
                                                      field.key,
                                                      items.filter(
                                                        (_, currentIndex) =>
                                                          currentIndex !== itemIndex,
                                                      ),
                                                    )
                                                  }
                                                  size="sm"
                                                  type="button"
                                                  variant="outline"
                                                >
                                                  Eliminar
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
                                            Aún no hay elementos agregados.
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
                                    </span>
                                    <Input
                                      disabled={isRecordLocked}
                                      onChange={(event) =>
                                        updateRecordFormDataField(
                                          field.key,
                                          event.target.value,
                                        )
                                      }
                                      placeholder={field.placeholder}
                                      type={field.type === 'date' ? 'date' : field.type}
                                      value={typeof fieldValue === 'string' ? fieldValue : ''}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {activeTab === 'Documentos' ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Archivos del episodio
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Esta sección ya soporta el flujo vacío, carga de archivos y
                              listado persistente por episodio.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              disabled={isEpisodeClosed}
                              multiple
                              onChange={(event) =>
                                setPendingFiles(Array.from(event.target.files ?? []))
                              }
                              type="file"
                            />
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

          <div className="space-y-6">
            <SectionCard
              description="Indicadores y contexto rapido para continuidad de atencion."
              title="Panel lateral"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-900">
                      Alergias activas
                    </span>
                  </div>
                  <Badge variant="alert">{detail.metrics.allergies}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-violet-600" />
                    <span className="text-sm font-medium text-slate-900">
                      Problemas
                    </span>
                  </div>
                  <Badge variant="secondary">{detail.metrics.problems}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-medium text-slate-900">
                      Labs e imagen
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {detail.metrics.labs + detail.metrics.imaging}
                  </Badge>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              description="Secuencia reciente de actividad derivada del episodio y sus relaciones."
              title="Timeline"
            >
              <div className="space-y-4">
                {detail.timeline.map((event) => {
                  const eventConfig = timelineKindConfig[event.kind];
                  const EventIcon = eventConfig.icon;

                  return (
                    <div className="flex gap-3" key={event.id}>
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${eventConfig.className}`}
                      >
                        <EventIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {event.label}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${eventConfig.className}`}
                          >
                            {eventConfig.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.detail}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              description="Datos utiles para validacion administrativa y clinica."
              title="Contexto rapido"
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
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-700">
                      Este detalle edita el nucleo del episodio y muestra las
                      relaciones clinicas existentes. La base ya soporta crecimiento
                      hacia notas, ordenes y documentos sin rehacer el modelo.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
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
