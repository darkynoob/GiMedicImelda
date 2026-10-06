import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  createConsultationNoteNewVersion,
  fetchConsultationNote,
  finalizeConsultationNote,
  saveConsultationNoteDraft,
  type MedicationOrderItem,
} from '../api/consultation-note.service';
import { ClinicalDocumentStatusBar } from './ClinicalDocumentStatusBar';
import { DiagnosisSelector } from './DiagnosisSelector';
import { MedicationOrderInput } from './MedicationOrderInput';
import { VitalSignsInput } from './VitalSignsInput';

type ConsultaActualTabProps = {
  encounterNumber: string;
};

type DraftState = {
  chiefComplaint: string;
  secondaryComplaint: string;
  evolutionTimeValue?: number;
  evolutionTimeUnit: string;

  currentIllnessOnsetDate: string;
  currentIllnessEvolutionType: string;
  currentIllnessDescription: string;
  currentIllnessEvaIntensity?: number;
  currentIllnessLocation: string;
  currentIllnessIrradiation: string;
  currentIllnessAssociatedSymptoms: string;
  currentIllnessAggravatingFactors: string;
  currentIllnessRelievingFactors: string;
  currentIllnessPriorTreatments: string;

  vitalSystolicBp?: number;
  vitalDiastolicBp?: number;
  vitalHeartRate?: number;
  vitalRespiratoryRate?: number;
  vitalTemperatureC?: number;
  vitalOxygenSaturation?: number;
  vitalWeightKg?: number;
  vitalHeightCm?: number;
  vitalEva?: number;
  vitalGlucose?: number;
  vitalIrregularRhythm: boolean;

  examGeneralState: string;
  examHeadStatus: string;
  examHeadDetail: string;
  examNeckStatus: string;
  examNeckDetail: string;
  examCardiovascularStatus: string;
  examCardiovascularDetail: string;
  examRespiratoryStatus: string;
  examRespiratoryDetail: string;
  examAbdomenStatus: string;
  examAbdomenDetail: string;
  examGenitourinaryStatus: string;
  examGenitourinaryDetail: string;
  examExtremitiesStatus: string;
  examExtremitiesDetail: string;
  examNeurologicalStatus: string;
  examNeurologicalDetail: string;
  examSkinStatus: string;
  examSkinDetail: string;
  examLymphaticStatus: string;
  examLymphaticDetail: string;

  priorResultsSummary: string;

  primaryDiagnosisCode: string;
  primaryDiagnosisDescription: string;
  primaryDiagnosisType: string;
  primaryDiagnosisStatus: string;

  pharmacologicalTreatment: MedicationOrderItem[];
  nonPharmacologicalTreatment: string;
  plannedStudies: string;
  plannedReferrals: string;
  plannedConsultations: string;
  disabilityDays?: number;
  disabilityFrom: string;
  disabilityTo: string;
  disabilityReason: string;
  prognosis: string;
  followUpDate: string;

  consentCurrent: boolean;
  consentExplanation: string;
  consentComprehension: string;

  riskSuddenSevereHeadache: boolean;
  riskFocalNeuroDeficit: boolean;
  riskVisionLoss: boolean;
  riskChestPain: boolean;
  riskDyspnea: boolean;
  riskHighFever: boolean;
  riskUnexplainedWeightLoss: boolean;
  riskActiveBleeding: boolean;
  riskAlteredConsciousness: boolean;
  riskFindingsNotes: string;

  functionalCapacity: string;
  functionalImpact: string;
  functionalDescription: string;

  pharmacologicalAdherence: string;
  nonPharmacologicalAdherence: string;
  adherenceNotes: string;
};

const emptyDraft: DraftState = {
  chiefComplaint: '',
  secondaryComplaint: '',
  evolutionTimeUnit: '',
  currentIllnessOnsetDate: '',
  currentIllnessEvolutionType: '',
  currentIllnessDescription: '',
  currentIllnessLocation: '',
  currentIllnessIrradiation: '',
  currentIllnessAssociatedSymptoms: '',
  currentIllnessAggravatingFactors: '',
  currentIllnessRelievingFactors: '',
  currentIllnessPriorTreatments: '',
  vitalIrregularRhythm: false,
  examGeneralState: '',
  examHeadStatus: '',
  examHeadDetail: '',
  examNeckStatus: '',
  examNeckDetail: '',
  examCardiovascularStatus: '',
  examCardiovascularDetail: '',
  examRespiratoryStatus: '',
  examRespiratoryDetail: '',
  examAbdomenStatus: '',
  examAbdomenDetail: '',
  examGenitourinaryStatus: '',
  examGenitourinaryDetail: '',
  examExtremitiesStatus: '',
  examExtremitiesDetail: '',
  examNeurologicalStatus: '',
  examNeurologicalDetail: '',
  examSkinStatus: '',
  examSkinDetail: '',
  examLymphaticStatus: '',
  examLymphaticDetail: '',
  priorResultsSummary: '',
  primaryDiagnosisCode: '',
  primaryDiagnosisDescription: '',
  primaryDiagnosisType: '',
  primaryDiagnosisStatus: '',
  pharmacologicalTreatment: [],
  nonPharmacologicalTreatment: '',
  plannedStudies: '',
  plannedReferrals: '',
  plannedConsultations: '',
  disabilityFrom: '',
  disabilityTo: '',
  disabilityReason: '',
  prognosis: '',
  followUpDate: '',
  consentCurrent: false,
  consentExplanation: '',
  consentComprehension: '',
  riskSuddenSevereHeadache: false,
  riskFocalNeuroDeficit: false,
  riskVisionLoss: false,
  riskChestPain: false,
  riskDyspnea: false,
  riskHighFever: false,
  riskUnexplainedWeightLoss: false,
  riskActiveBleeding: false,
  riskAlteredConsciousness: false,
  riskFindingsNotes: '',
  functionalCapacity: '',
  functionalImpact: '',
  functionalDescription: '',
  pharmacologicalAdherence: '',
  nonPharmacologicalAdherence: '',
  adherenceNotes: '',
};

const vitalFields = [
  { key: 'vitalSystolicBp', label: 'TA sistólica', unit: 'mmHg' },
  { key: 'vitalDiastolicBp', label: 'TA diastólica', unit: 'mmHg' },
  { key: 'vitalHeartRate', label: 'FC', unit: 'lpm' },
  { key: 'vitalRespiratoryRate', label: 'FR', unit: 'rpm' },
  { key: 'vitalTemperatureC', label: 'Temperatura', unit: '°C' },
  { key: 'vitalOxygenSaturation', label: 'SpO2', unit: '%' },
  { key: 'vitalGlucose', label: 'Glucosa', unit: 'mg/dL' },
  { key: 'vitalEva', label: 'EVA dolor', unit: '0-10' },
  { key: 'vitalWeightKg', label: 'Peso', unit: 'kg' },
  { key: 'vitalHeightCm', label: 'Talla', unit: 'cm' },
];

const evolutionTimeUnits = [
  ['', 'Unidad'],
  ['HORAS', 'Horas'],
  ['DIAS', 'Días'],
  ['SEMANAS', 'Semanas'],
  ['MESES', 'Meses'],
  ['ANIOS', 'Años'],
] as const;

const evolutionTypes = [
  ['', 'Sin especificar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['AGUDO', 'Agudo'],
  ['SUBAGUDO', 'Subagudo'],
  ['CRONICO', 'Crónico'],
  ['INTERMITENTE', 'Intermitente'],
  ['RECURRENTE', 'Recurrente'],
  ['PROGRESIVO', 'Progresivo'],
  ['SUBITO', 'Súbito'],
] as const;

const examStateOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['NORMAL', 'Normal'],
  ['ALTERADO', 'Alterado'],
] as const;

const diagnosisTypeOptions = [
  ['', 'Sin especificar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['PRESUNTIVO', 'Presuntivo'],
  ['DEFINITIVO', 'Definitivo'],
  ['SINDROMATICO', 'Sindromático'],
  ['NOSOLOGICO', 'Nosológico'],
] as const;

const diagnosisStatusOptions = [
  ['', 'Sin especificar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['ACTIVO', 'Activo'],
  ['CONTROLADO', 'Controlado'],
  ['RESUELTO', 'Resuelto'],
  ['EN_SEGUIMIENTO', 'En seguimiento'],
] as const;

const consentComprehensionOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['COMPRENDE_Y_ACEPTA', 'Comprende y acepta'],
  ['COMPRENDE_PARCIALMENTE', 'Comprende parcialmente'],
  ['NO_COMPRENDE', 'No comprende'],
  ['RECHAZA', 'Rechaza'],
] as const;

const functionalCapacityOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['CONSERVADA', 'Conservada'],
  ['LIMITACION_LEVE', 'Limitación leve'],
  ['LIMITACION_MODERADA', 'Limitación moderada'],
  ['LIMITACION_SEVERA', 'Limitación severa'],
  ['DEPENDENCIA', 'Dependencia'],
] as const;

const functionalImpactOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['LEVE', 'Leve'],
  ['MODERADO', 'Moderado'],
  ['SEVERO', 'Severo'],
] as const;

const adherenceOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['ADECUADA', 'Adecuada'],
  ['PARCIAL', 'Parcial'],
  ['INADECUADA', 'Inadecuada'],
  ['NO_APLICA', 'No aplica'],
] as const;

const riskFindings: Array<{ key: keyof DraftState; label: string }> = [
  { key: 'riskSuddenSevereHeadache', label: 'Cefalea súbita e intensa' },
  { key: 'riskFocalNeuroDeficit', label: 'Déficit neurológico focal' },
  { key: 'riskVisionLoss', label: 'Pérdida visual' },
  { key: 'riskChestPain', label: 'Dolor torácico' },
  { key: 'riskDyspnea', label: 'Disnea' },
  { key: 'riskHighFever', label: 'Fiebre alta' },
  { key: 'riskUnexplainedWeightLoss', label: 'Pérdida de peso inexplicada' },
  { key: 'riskActiveBleeding', label: 'Sangrado activo' },
  { key: 'riskAlteredConsciousness', label: 'Alteración del estado de conciencia' },
];

const examRegions: Array<{ statusKey: keyof DraftState; detailKey: keyof DraftState; label: string }> = [
  { statusKey: 'examHeadStatus', detailKey: 'examHeadDetail', label: 'Cabeza' },
  { statusKey: 'examNeckStatus', detailKey: 'examNeckDetail', label: 'Cuello' },
  { statusKey: 'examCardiovascularStatus', detailKey: 'examCardiovascularDetail', label: 'Cardiovascular' },
  { statusKey: 'examRespiratoryStatus', detailKey: 'examRespiratoryDetail', label: 'Respiratorio' },
  { statusKey: 'examAbdomenStatus', detailKey: 'examAbdomenDetail', label: 'Abdomen' },
  { statusKey: 'examGenitourinaryStatus', detailKey: 'examGenitourinaryDetail', label: 'Genitourinario' },
  { statusKey: 'examExtremitiesStatus', detailKey: 'examExtremitiesDetail', label: 'Extremidades' },
  { statusKey: 'examNeurologicalStatus', detailKey: 'examNeurologicalDetail', label: 'Neurológico' },
  { statusKey: 'examSkinStatus', detailKey: 'examSkinDetail', label: 'Piel y tegumentos' },
  { statusKey: 'examLymphaticStatus', detailKey: 'examLymphaticDetail', label: 'Ganglios linfáticos' },
];

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

/// Tab "Consulta actual" (Fase 2). Componente autocontenido que consume los endpoints nuevos
/// de `/encounters/:encounterNumber/consultation-note`. Mismo patrón que `HistoriaClinicaTab`.
export function ConsultaActualTab({ encounterNumber }: ConsultaActualTabProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session!.accessToken;
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  const detailQuery = useQuery({
    queryKey: ['consultation-note', encounterNumber],
    queryFn: () => fetchConsultationNote(token, encounterNumber),
  });

  const currentVersion = detailQuery.data?.versions?.[0] ?? null;
  const referenceContext = detailQuery.data?.referenceContext;

  useEffect(() => {
    if (!currentVersion) return;
    setDraft({
      chiefComplaint: currentVersion.chiefComplaint ?? '',
      secondaryComplaint: currentVersion.secondaryComplaint ?? '',
      evolutionTimeValue: currentVersion.evolutionTimeValue ?? undefined,
      evolutionTimeUnit: currentVersion.evolutionTimeUnit ?? '',
      currentIllnessOnsetDate: currentVersion.currentIllnessOnsetDate?.slice(0, 10) ?? '',
      currentIllnessEvolutionType: currentVersion.currentIllnessEvolutionType ?? '',
      currentIllnessDescription: currentVersion.currentIllnessDescription ?? '',
      currentIllnessEvaIntensity: currentVersion.currentIllnessEvaIntensity ?? undefined,
      currentIllnessLocation: currentVersion.currentIllnessLocation ?? '',
      currentIllnessIrradiation: currentVersion.currentIllnessIrradiation ?? '',
      currentIllnessAssociatedSymptoms: currentVersion.currentIllnessAssociatedSymptoms ?? '',
      currentIllnessAggravatingFactors: currentVersion.currentIllnessAggravatingFactors ?? '',
      currentIllnessRelievingFactors: currentVersion.currentIllnessRelievingFactors ?? '',
      currentIllnessPriorTreatments: currentVersion.currentIllnessPriorTreatments ?? '',
      vitalSystolicBp: currentVersion.vitalSystolicBp ?? undefined,
      vitalDiastolicBp: currentVersion.vitalDiastolicBp ?? undefined,
      vitalHeartRate: currentVersion.vitalHeartRate ?? undefined,
      vitalRespiratoryRate: currentVersion.vitalRespiratoryRate ?? undefined,
      vitalTemperatureC: currentVersion.vitalTemperatureC ?? undefined,
      vitalOxygenSaturation: currentVersion.vitalOxygenSaturation ?? undefined,
      vitalWeightKg: currentVersion.vitalWeightKg ?? undefined,
      vitalHeightCm: currentVersion.vitalHeightCm ?? undefined,
      vitalEva: currentVersion.vitalEva ?? undefined,
      vitalGlucose: currentVersion.vitalGlucose ?? undefined,
      vitalIrregularRhythm: currentVersion.vitalIrregularRhythm,
      examGeneralState: currentVersion.examGeneralState ?? '',
      examHeadStatus: currentVersion.examHeadStatus ?? '',
      examHeadDetail: currentVersion.examHeadDetail ?? '',
      examNeckStatus: currentVersion.examNeckStatus ?? '',
      examNeckDetail: currentVersion.examNeckDetail ?? '',
      examCardiovascularStatus: currentVersion.examCardiovascularStatus ?? '',
      examCardiovascularDetail: currentVersion.examCardiovascularDetail ?? '',
      examRespiratoryStatus: currentVersion.examRespiratoryStatus ?? '',
      examRespiratoryDetail: currentVersion.examRespiratoryDetail ?? '',
      examAbdomenStatus: currentVersion.examAbdomenStatus ?? '',
      examAbdomenDetail: currentVersion.examAbdomenDetail ?? '',
      examGenitourinaryStatus: currentVersion.examGenitourinaryStatus ?? '',
      examGenitourinaryDetail: currentVersion.examGenitourinaryDetail ?? '',
      examExtremitiesStatus: currentVersion.examExtremitiesStatus ?? '',
      examExtremitiesDetail: currentVersion.examExtremitiesDetail ?? '',
      examNeurologicalStatus: currentVersion.examNeurologicalStatus ?? '',
      examNeurologicalDetail: currentVersion.examNeurologicalDetail ?? '',
      examSkinStatus: currentVersion.examSkinStatus ?? '',
      examSkinDetail: currentVersion.examSkinDetail ?? '',
      examLymphaticStatus: currentVersion.examLymphaticStatus ?? '',
      examLymphaticDetail: currentVersion.examLymphaticDetail ?? '',
      priorResultsSummary: currentVersion.priorResultsSummary ?? '',
      primaryDiagnosisCode: currentVersion.primaryDiagnosisCode ?? '',
      primaryDiagnosisDescription: currentVersion.primaryDiagnosisDescription ?? '',
      primaryDiagnosisType: currentVersion.primaryDiagnosisType ?? '',
      primaryDiagnosisStatus: currentVersion.primaryDiagnosisStatus ?? '',
      pharmacologicalTreatment: currentVersion.pharmacologicalTreatmentJson ?? [],
      nonPharmacologicalTreatment: currentVersion.nonPharmacologicalTreatment ?? '',
      plannedStudies: currentVersion.plannedStudies ?? '',
      plannedReferrals: currentVersion.plannedReferrals ?? '',
      plannedConsultations: currentVersion.plannedConsultations ?? '',
      disabilityDays: currentVersion.disabilityDays ?? undefined,
      disabilityFrom: currentVersion.disabilityFrom?.slice(0, 10) ?? '',
      disabilityTo: currentVersion.disabilityTo?.slice(0, 10) ?? '',
      disabilityReason: currentVersion.disabilityReason ?? '',
      prognosis: currentVersion.prognosis ?? '',
      followUpDate: currentVersion.followUpDate?.slice(0, 10) ?? '',
      consentCurrent: currentVersion.consentCurrent,
      consentExplanation: currentVersion.consentExplanation ?? '',
      consentComprehension: currentVersion.consentComprehension ?? '',
      riskSuddenSevereHeadache: currentVersion.riskSuddenSevereHeadache,
      riskFocalNeuroDeficit: currentVersion.riskFocalNeuroDeficit,
      riskVisionLoss: currentVersion.riskVisionLoss,
      riskChestPain: currentVersion.riskChestPain,
      riskDyspnea: currentVersion.riskDyspnea,
      riskHighFever: currentVersion.riskHighFever,
      riskUnexplainedWeightLoss: currentVersion.riskUnexplainedWeightLoss,
      riskActiveBleeding: currentVersion.riskActiveBleeding,
      riskAlteredConsciousness: currentVersion.riskAlteredConsciousness,
      riskFindingsNotes: currentVersion.riskFindingsNotes ?? '',
      functionalCapacity: currentVersion.functionalCapacity ?? '',
      functionalImpact: currentVersion.functionalImpact ?? '',
      functionalDescription: currentVersion.functionalDescription ?? '',
      pharmacologicalAdherence: currentVersion.pharmacologicalAdherence ?? '',
      nonPharmacologicalAdherence: currentVersion.nonPharmacologicalAdherence ?? '',
      adherenceNotes: currentVersion.adherenceNotes ?? '',
    });
  }, [currentVersion?.id]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['consultation-note', encounterNumber] });

  const saveMutation = useMutation({
    mutationFn: () => saveConsultationNoteDraft(token, encounterNumber, draft),
    onSuccess: invalidate,
  });
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeConsultationNote(token, encounterNumber),
    onSuccess: invalidate,
  });
  const newVersionMutation = useMutation({
    mutationFn: () => createConsultationNoteNewVersion(token, encounterNumber, draft),
    onSuccess: invalidate,
  });

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando consulta actual...</p>;
  }

  const isDraft = !currentVersion || currentVersion.status === 'DRAFT';

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <ClinicalDocumentStatusBar
        finalizedAt={currentVersion?.finalizedAt}
        isSaving={saveMutation.isPending || finalizeMutation.isPending}
        onCreateNewVersion={!isDraft ? () => newVersionMutation.mutate() : undefined}
        onFinalize={isDraft ? () => finalizeMutation.mutate() : undefined}
        onSave={isDraft ? () => saveMutation.mutate() : undefined}
        recordedAt={currentVersion?.recordedAt}
        status={currentVersion?.status ?? 'DRAFT'}
        versionNumber={currentVersion?.versionNumber ?? 1}
      />

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Antecedentes de referencia (perfil del paciente)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Alergias</p>
            {referenceContext?.allergies.length ? (
              <ul className="flex flex-wrap gap-2">
                {referenceContext.allergies.map((allergy) => (
                  <li
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800"
                    key={allergy.id}
                  >
                    {allergy.substance}
                    {allergy.severity ? ` · ${allergy.severity}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin alergias registradas.</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Medicación crónica</p>
            {referenceContext?.chronicMedications.length ? (
              <ul className="flex flex-wrap gap-2">
                {referenceContext.chronicMedications.map((medication) => (
                  <li
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    key={medication.id}
                  >
                    {medication.medicationName}
                    {medication.dose ? ` · ${medication.dose}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin medicación crónica registrada.</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Contexto de la consulta</h3>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('chiefComplaint', event.target.value)}
          placeholder="Motivo principal de la consulta"
          value={draft.chiefComplaint}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('secondaryComplaint', event.target.value)}
          placeholder="Motivo(s) secundario(s)"
          value={draft.secondaryComplaint}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Tiempo de evolución</span>
            <Input
              disabled={!isDraft}
              onChange={(event) =>
                set('evolutionTimeValue', event.target.value === '' ? undefined : Number(event.target.value))
              }
              type="number"
              value={draft.evolutionTimeValue ?? ''}
            />
          </label>
          <SelectField
            disabled={!isDraft}
            label="Unidad"
            onChange={(value) => set('evolutionTimeUnit', value)}
            options={evolutionTimeUnits}
            value={draft.evolutionTimeUnit}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Padecimiento actual</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Fecha de inicio</span>
            <Input
              disabled={!isDraft}
              onChange={(event) => set('currentIllnessOnsetDate', event.target.value)}
              type="date"
              value={draft.currentIllnessOnsetDate}
            />
          </label>
          <SelectField
            disabled={!isDraft}
            label="Tipo de evolución"
            onChange={(value) => set('currentIllnessEvolutionType', value)}
            options={evolutionTypes}
            value={draft.currentIllnessEvolutionType}
          />
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">EVA (0-10)</span>
            <Input
              disabled={!isDraft}
              max={10}
              min={0}
              onChange={(event) =>
                set('currentIllnessEvaIntensity', event.target.value === '' ? undefined : Number(event.target.value))
              }
              type="number"
              value={draft.currentIllnessEvaIntensity ?? ''}
            />
          </label>
        </div>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('currentIllnessDescription', event.target.value)}
          placeholder="Descripción del padecimiento actual"
          value={draft.currentIllnessDescription}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            disabled={!isDraft}
            onChange={(event) => set('currentIllnessLocation', event.target.value)}
            placeholder="Localización"
            value={draft.currentIllnessLocation}
          />
          <Input
            disabled={!isDraft}
            onChange={(event) => set('currentIllnessIrradiation', event.target.value)}
            placeholder="Irradiación"
            value={draft.currentIllnessIrradiation}
          />
        </div>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('currentIllnessAssociatedSymptoms', event.target.value)}
          placeholder="Síntomas acompañantes"
          value={draft.currentIllnessAssociatedSymptoms}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Textarea
            disabled={!isDraft}
            onChange={(event) => set('currentIllnessAggravatingFactors', event.target.value)}
            placeholder="Factores agravantes"
            value={draft.currentIllnessAggravatingFactors}
          />
          <Textarea
            disabled={!isDraft}
            onChange={(event) => set('currentIllnessRelievingFactors', event.target.value)}
            placeholder="Factores atenuantes"
            value={draft.currentIllnessRelievingFactors}
          />
        </div>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('currentIllnessPriorTreatments', event.target.value)}
          placeholder="Tratamientos previos para este padecimiento"
          value={draft.currentIllnessPriorTreatments}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Signos vitales</h3>
        <VitalSignsInput
          fields={vitalFields}
          heightKey="vitalHeightCm"
          onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
          values={{
            vitalSystolicBp: draft.vitalSystolicBp,
            vitalDiastolicBp: draft.vitalDiastolicBp,
            vitalHeartRate: draft.vitalHeartRate,
            vitalRespiratoryRate: draft.vitalRespiratoryRate,
            vitalTemperatureC: draft.vitalTemperatureC,
            vitalOxygenSaturation: draft.vitalOxygenSaturation,
            vitalGlucose: draft.vitalGlucose,
            vitalEva: draft.vitalEva,
            vitalWeightKg: draft.vitalWeightKg,
            vitalHeightCm: draft.vitalHeightCm,
          }}
          weightKey="vitalWeightKg"
        />
        <CheckboxField
          checked={draft.vitalIrregularRhythm}
          disabled={!isDraft}
          label="Ritmo irregular"
          onChange={(checked) => set('vitalIrregularRhythm', checked)}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Exploración física por aparatos y sistemas</h3>
        <Input
          disabled={!isDraft}
          onChange={(event) => set('examGeneralState', event.target.value)}
          placeholder="Estado general"
          value={draft.examGeneralState}
        />
        <div className="space-y-3">
          {examRegions.map((region) => (
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3" key={region.statusKey}>
              <span className="self-center text-sm font-medium text-slate-700">{region.label}</span>
              <SelectField
                disabled={!isDraft}
                label="Estado"
                onChange={(value) => set(region.statusKey, value as never)}
                options={examStateOptions}
                value={draft[region.statusKey] as string}
              />
              <Input
                disabled={!isDraft}
                onChange={(event) => set(region.detailKey, event.target.value as never)}
                placeholder="Detalle"
                value={draft[region.detailKey] as string}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Resultados previos relevantes</h3>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('priorResultsSummary', event.target.value)}
          value={draft.priorResultsSummary}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Impresión diagnóstica actual</h3>
        <DiagnosisSelector
          label="Diagnóstico principal"
          onChange={(value) => {
            setDraft((prev) => ({
              ...prev,
              primaryDiagnosisCode: value.code ?? '',
              primaryDiagnosisDescription: value.description ?? '',
            }));
          }}
          value={{ code: draft.primaryDiagnosisCode, description: draft.primaryDiagnosisDescription }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            disabled={!isDraft}
            label="Tipo"
            onChange={(value) => set('primaryDiagnosisType', value)}
            options={diagnosisTypeOptions}
            value={draft.primaryDiagnosisType}
          />
          <SelectField
            disabled={!isDraft}
            label="Estado"
            onChange={(value) => set('primaryDiagnosisStatus', value)}
            options={diagnosisStatusOptions}
            value={draft.primaryDiagnosisStatus}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Plan terapéutico</h3>
        <MedicationOrderInput
          items={draft.pharmacologicalTreatment}
          onChange={(items) => set('pharmacologicalTreatment', items)}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('nonPharmacologicalTreatment', event.target.value)}
          placeholder="Tratamiento no farmacológico"
          value={draft.nonPharmacologicalTreatment}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('plannedStudies', event.target.value)}
          placeholder="Estudios planeados"
          value={draft.plannedStudies}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('plannedReferrals', event.target.value)}
          placeholder="Referencias planeadas"
          value={draft.plannedReferrals}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('plannedConsultations', event.target.value)}
          placeholder="Interconsultas planeadas"
          value={draft.plannedConsultations}
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Días de incapacidad</span>
            <Input
              disabled={!isDraft}
              min={0}
              onChange={(event) =>
                set('disabilityDays', event.target.value === '' ? undefined : Number(event.target.value))
              }
              type="number"
              value={draft.disabilityDays ?? ''}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Desde</span>
            <Input
              disabled={!isDraft}
              onChange={(event) => set('disabilityFrom', event.target.value)}
              type="date"
              value={draft.disabilityFrom}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Hasta</span>
            <Input
              disabled={!isDraft}
              onChange={(event) => set('disabilityTo', event.target.value)}
              type="date"
              value={draft.disabilityTo}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Fecha de seguimiento</span>
            <Input
              disabled={!isDraft}
              onChange={(event) => set('followUpDate', event.target.value)}
              type="date"
              value={draft.followUpDate}
            />
          </label>
        </div>
        <Input
          disabled={!isDraft}
          onChange={(event) => set('disabilityReason', event.target.value)}
          placeholder="Motivo de incapacidad"
          value={draft.disabilityReason}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('prognosis', event.target.value)}
          placeholder="Pronóstico"
          value={draft.prognosis}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Información y aceptación durante la consulta</h3>
        <CheckboxField
          checked={draft.consentCurrent}
          disabled={!isDraft}
          label="Se brindó información y se obtuvo aceptación en esta consulta"
          onChange={(checked) => set('consentCurrent', checked)}
        />
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('consentExplanation', event.target.value)}
          placeholder="Explicación brindada al paciente"
          value={draft.consentExplanation}
        />
        <SelectField
          disabled={!isDraft}
          label="Comprensión del paciente"
          onChange={(value) => set('consentComprehension', value)}
          options={consentComprehensionOptions}
          value={draft.consentComprehension}
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Hallazgos de riesgo</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {riskFindings.map((finding) => (
            <CheckboxField
              checked={Boolean(draft[finding.key])}
              disabled={!isDraft}
              key={finding.key}
              label={finding.label}
              onChange={(checked) => set(finding.key, checked as never)}
            />
          ))}
        </div>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('riskFindingsNotes', event.target.value)}
          placeholder="Notas sobre hallazgos de riesgo"
          value={draft.riskFindingsNotes}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Impacto funcional</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            disabled={!isDraft}
            label="Capacidad funcional"
            onChange={(value) => set('functionalCapacity', value)}
            options={functionalCapacityOptions}
            value={draft.functionalCapacity}
          />
          <SelectField
            disabled={!isDraft}
            label="Impacto"
            onChange={(value) => set('functionalImpact', value)}
            options={functionalImpactOptions}
            value={draft.functionalImpact}
          />
        </div>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('functionalDescription', event.target.value)}
          placeholder="Descripción del impacto funcional"
          value={draft.functionalDescription}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Adherencia</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            disabled={!isDraft}
            label="Adherencia farmacológica"
            onChange={(value) => set('pharmacologicalAdherence', value)}
            options={adherenceOptions}
            value={draft.pharmacologicalAdherence}
          />
          <SelectField
            disabled={!isDraft}
            label="Adherencia no farmacológica"
            onChange={(value) => set('nonPharmacologicalAdherence', value)}
            options={adherenceOptions}
            value={draft.nonPharmacologicalAdherence}
          />
        </div>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => set('adherenceNotes', event.target.value)}
          placeholder="Notas de adherencia"
          value={draft.adherenceNotes}
        />
      </section>
    </div>
  );
}
