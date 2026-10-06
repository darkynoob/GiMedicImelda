import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '../../../components/ui/textarea';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  createClinicalHistoryNewVersion,
  fetchClinicalHistory,
  finalizeClinicalHistory,
  saveClinicalHistoryDraft,
  type DiagnosisItem,
  type MedicationOrderItem,
  type PriorStudyItem,
} from '../api/clinical-history.service';
import { ClinicalDocumentStatusBar } from './ClinicalDocumentStatusBar';
import { DiagnosisSelector } from './DiagnosisSelector';
import { MedicationOrderInput } from './MedicationOrderInput';
import { VitalSignsInput } from './VitalSignsInput';

type HistoriaClinicaTabProps = {
  encounterNumber: string;
};

type DraftState = {
  currentIllness: string;
  familyHistoryDiabetes: boolean;
  familyHistoryHypertension: boolean;
  familyHistoryCancer: boolean;
  familyHistoryHeartDisease: boolean;
  familyHistoryStroke: boolean;
  familyHistoryKidneyDisease: boolean;
  familyHistoryAutoimmune: boolean;
  familyHistoryPsychiatric: boolean;
  vitalTemperatureC?: number;
  vitalSystolicBp?: number;
  vitalDiastolicBp?: number;
  vitalHeartRate?: number;
  vitalRespiratoryRate?: number;
  vitalWeightKg?: number;
  vitalHeightCm?: number;
  primaryDiagnosisCode: string;
  primaryDiagnosisDescription: string;
  priorStudies: PriorStudyItem[];
  priorStudiesSummary: string;
  currentTreatmentMedications: MedicationOrderItem[];
  secondaryDiagnoses: DiagnosisItem[];
  nonPharmacologicalTreatment: string;
  prognosis: string;
};

const emptyDraft: DraftState = {
  currentIllness: '',
  familyHistoryDiabetes: false,
  familyHistoryHypertension: false,
  familyHistoryCancer: false,
  familyHistoryHeartDisease: false,
  familyHistoryStroke: false,
  familyHistoryKidneyDisease: false,
  familyHistoryAutoimmune: false,
  familyHistoryPsychiatric: false,
  primaryDiagnosisCode: '',
  primaryDiagnosisDescription: '',
  priorStudies: [],
  priorStudiesSummary: '',
  currentTreatmentMedications: [],
  secondaryDiagnoses: [],
  nonPharmacologicalTreatment: '',
  prognosis: '',
};

const familyHistoryToggles: Array<{ key: keyof DraftState; label: string }> = [
  { key: 'familyHistoryDiabetes', label: 'Diabetes' },
  { key: 'familyHistoryHypertension', label: 'Hipertensión' },
  { key: 'familyHistoryCancer', label: 'Cáncer' },
  { key: 'familyHistoryHeartDisease', label: 'Cardiopatías' },
  { key: 'familyHistoryStroke', label: 'Enfermedad vascular cerebral' },
  { key: 'familyHistoryKidneyDisease', label: 'Enfermedad renal' },
  { key: 'familyHistoryAutoimmune', label: 'Enfermedad autoinmune' },
  { key: 'familyHistoryPsychiatric', label: 'Enfermedad psiquiátrica' },
];

const vitalFields = [
  { key: 'vitalTemperatureC', label: 'Temperatura', unit: '°C' },
  { key: 'vitalSystolicBp', label: 'TA sistólica', unit: 'mmHg' },
  { key: 'vitalDiastolicBp', label: 'TA diastólica', unit: 'mmHg' },
  { key: 'vitalHeartRate', label: 'FC', unit: 'lpm' },
  { key: 'vitalRespiratoryRate', label: 'FR', unit: 'rpm' },
  { key: 'vitalWeightKg', label: 'Peso', unit: 'kg' },
  { key: 'vitalHeightCm', label: 'Talla', unit: 'cm' },
];

/// Tab "Historia clínica" (Fase 1). Componente autocontenido que consume los endpoints nuevos
/// de `/encounters/:encounterNumber/clinical-history`. Reemplaza, solo para episodios
/// OUTPATIENT, el formulario genérico data-driven legado de esta sección.
export function HistoriaClinicaTab({ encounterNumber }: HistoriaClinicaTabProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session!.accessToken;
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  const detailQuery = useQuery({
    queryKey: ['clinical-history', encounterNumber],
    queryFn: () => fetchClinicalHistory(token, encounterNumber),
  });

  const currentVersion = detailQuery.data?.versions?.[0] ?? null;

  useEffect(() => {
    if (!currentVersion) return;
    setDraft({
      currentIllness: currentVersion.currentIllness ?? '',
      familyHistoryDiabetes: currentVersion.familyHistoryDiabetes,
      familyHistoryHypertension: currentVersion.familyHistoryHypertension,
      familyHistoryCancer: currentVersion.familyHistoryCancer,
      familyHistoryHeartDisease: currentVersion.familyHistoryHeartDisease,
      familyHistoryStroke: currentVersion.familyHistoryStroke,
      familyHistoryKidneyDisease: currentVersion.familyHistoryKidneyDisease,
      familyHistoryAutoimmune: currentVersion.familyHistoryAutoimmune,
      familyHistoryPsychiatric: currentVersion.familyHistoryPsychiatric,
      vitalTemperatureC: currentVersion.vitalTemperatureC ?? undefined,
      vitalSystolicBp: currentVersion.vitalSystolicBp ?? undefined,
      vitalDiastolicBp: currentVersion.vitalDiastolicBp ?? undefined,
      vitalHeartRate: currentVersion.vitalHeartRate ?? undefined,
      vitalRespiratoryRate: currentVersion.vitalRespiratoryRate ?? undefined,
      vitalWeightKg: currentVersion.vitalWeightKg ?? undefined,
      vitalHeightCm: currentVersion.vitalHeightCm ?? undefined,
      primaryDiagnosisCode: currentVersion.primaryDiagnosisCode ?? '',
      primaryDiagnosisDescription: currentVersion.primaryDiagnosisDescription ?? '',
      priorStudies: currentVersion.priorStudiesJson ?? [],
      priorStudiesSummary: currentVersion.priorStudiesSummary ?? '',
      currentTreatmentMedications: currentVersion.currentTreatmentMedicationsJson ?? [],
      secondaryDiagnoses: currentVersion.secondaryDiagnosesJson ?? [],
      nonPharmacologicalTreatment: currentVersion.nonPharmacologicalTreatment ?? '',
      prognosis: currentVersion.prognosis ?? '',
    });
  }, [currentVersion?.id]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['clinical-history', encounterNumber] });

  const saveMutation = useMutation({
    mutationFn: () => saveClinicalHistoryDraft(token, encounterNumber, draft),
    onSuccess: invalidate,
  });
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeClinicalHistory(token, encounterNumber),
    onSuccess: invalidate,
  });
  const newVersionMutation = useMutation({
    mutationFn: () => createClinicalHistoryNewVersion(token, encounterNumber, draft),
    onSuccess: invalidate,
  });

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando historia clínica...</p>;
  }

  const isDraft = !currentVersion || currentVersion.status === 'DRAFT';
  const allergies = currentVersion?.allergiesSnapshotJson ?? [];

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

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Padecimiento actual</h3>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => setDraft((prev) => ({ ...prev, currentIllness: event.target.value }))}
          placeholder="Padecimiento actual al momento de levantar esta versión"
          value={draft.currentIllness}
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Antecedentes heredofamiliares</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {familyHistoryToggles.map((toggle) => (
            <label className="flex items-center gap-2 text-sm" key={toggle.key}>
              <input
                checked={Boolean(draft[toggle.key])}
                disabled={!isDraft}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [toggle.key]: event.target.checked }))
                }
                type="checkbox"
              />
              {toggle.label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Alergias (perfil clínico del paciente)</h3>
        {allergies.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {allergies.map((allergy, index) => (
              <li
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800"
                key={index}
              >
                {allergy.substance}
                {allergy.severity ? ` · ${allergy.severity}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {currentVersion ? 'Sin alergias registradas en el perfil del paciente.' : 'Se tomará un snapshot al crear la versión.'}
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Exploración física — signos vitales</h3>
        <VitalSignsInput
          fields={vitalFields}
          heightKey="vitalHeightCm"
          onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
          values={{
            vitalTemperatureC: draft.vitalTemperatureC,
            vitalSystolicBp: draft.vitalSystolicBp,
            vitalDiastolicBp: draft.vitalDiastolicBp,
            vitalHeartRate: draft.vitalHeartRate,
            vitalRespiratoryRate: draft.vitalRespiratoryRate,
            vitalWeightKg: draft.vitalWeightKg,
            vitalHeightCm: draft.vitalHeightCm,
          }}
          weightKey="vitalWeightKg"
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Diagnósticos iniciales</h3>
        <DiagnosisSelector
          label="Diagnóstico principal"
          onChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              primaryDiagnosisCode: value.code ?? '',
              primaryDiagnosisDescription: value.description ?? '',
            }))
          }
          value={{ code: draft.primaryDiagnosisCode, description: draft.primaryDiagnosisDescription }}
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Resumen de estudios previos relevantes</h3>
        <Textarea
          disabled={!isDraft}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, priorStudiesSummary: event.target.value }))
          }
          value={draft.priorStudiesSummary}
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Tratamiento farmacológico</h3>
        <MedicationOrderInput
          items={draft.currentTreatmentMedications}
          onChange={(items) => setDraft((prev) => ({ ...prev, currentTreatmentMedications: items }))}
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Pronóstico</h3>
        <Textarea
          disabled={!isDraft}
          onChange={(event) => setDraft((prev) => ({ ...prev, prognosis: event.target.value }))}
          value={draft.prognosis}
        />
      </section>
    </div>
  );
}
