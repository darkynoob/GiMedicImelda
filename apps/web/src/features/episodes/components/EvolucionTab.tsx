import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatDateTime } from '../../../shared/lib/formatters';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  createEvolutionNote,
  createEvolutionNoteNewVersion,
  fetchEvolutionNoteDetail,
  fetchEvolutionNotes,
  finalizeEvolutionNote,
  saveEvolutionNoteDraft,
  type MedicationOrderItem,
} from '../api/evolution-note.service';
import { ClinicalDocumentStatusBar } from './ClinicalDocumentStatusBar';
import { DiagnosisSelector } from './DiagnosisSelector';
import { MedicationOrderInput } from './MedicationOrderInput';
import { VitalSignsInput } from './VitalSignsInput';

type EvolucionTabProps = {
  encounterNumber: string;
};

type DraftState = {
  clinicalStatus: string;
  complications: string;
  subjective: string;
  vitalSystolicBp?: number;
  vitalDiastolicBp?: number;
  vitalHeartRate?: number;
  vitalRespiratoryRate?: number;
  vitalTemperatureC?: number;
  vitalOxygenSaturation?: number;
  vitalWeightKg?: number;
  vitalHeightCm?: number;
  vitalCapillaryGlucose?: number;
  vitalEva?: number;
  objectiveFindings: string;
  recentResults: string;
  primaryDiagnosisCode: string;
  primaryDiagnosisDescription: string;
  primaryDiagnosisStatus: string;
  prognosisStatus: string;
  prognosisDetail: string;
  treatmentChangeType: string;
  treatmentNotes: string;
  proposedMedications: MedicationOrderItem[];
  plannedStudies: string;
  plannedConsultations: string;
  followUpNotes: string;
  nextAssessmentDate: string;
  consentCurrent: boolean;
  informationProvided: string;
  trend: string;
  comparativeAnalysis: string;
  pharmacologicalResponse: string;
  adverseEvents: string;
  clinicalJustification: string;
  glasgowOcular?: number;
  glasgowVerbal?: number;
  glasgowMotor?: number;
  cardiovascularRisk: string;
  karnofskyScore?: number;
  otherScaleName: string;
  otherScaleResult: string;
};

const emptyDraft: DraftState = {
  clinicalStatus: '',
  complications: '',
  subjective: '',
  objectiveFindings: '',
  recentResults: '',
  primaryDiagnosisCode: '',
  primaryDiagnosisDescription: '',
  primaryDiagnosisStatus: '',
  prognosisStatus: '',
  prognosisDetail: '',
  treatmentChangeType: '',
  treatmentNotes: '',
  proposedMedications: [],
  plannedStudies: '',
  plannedConsultations: '',
  followUpNotes: '',
  nextAssessmentDate: '',
  consentCurrent: false,
  informationProvided: '',
  trend: '',
  comparativeAnalysis: '',
  pharmacologicalResponse: '',
  adverseEvents: '',
  clinicalJustification: '',
  cardiovascularRisk: '',
  otherScaleName: '',
  otherScaleResult: '',
};

const vitalFields = [
  { key: 'vitalSystolicBp', label: 'TA sistólica', unit: 'mmHg' },
  { key: 'vitalDiastolicBp', label: 'TA diastólica', unit: 'mmHg' },
  { key: 'vitalHeartRate', label: 'FC', unit: 'lpm' },
  { key: 'vitalRespiratoryRate', label: 'FR', unit: 'rpm' },
  { key: 'vitalTemperatureC', label: 'Temperatura', unit: '°C' },
  { key: 'vitalOxygenSaturation', label: 'SpO2', unit: '%' },
  { key: 'vitalCapillaryGlucose', label: 'Glucosa capilar', unit: 'mg/dL' },
  { key: 'vitalEva', label: 'EVA dolor', unit: '0-10' },
  { key: 'vitalWeightKg', label: 'Peso', unit: 'kg' },
  { key: 'vitalHeightCm', label: 'Talla', unit: 'cm' },
];

const clinicalStatusOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['ESTABLE', 'Estable'],
  ['MEJORIA', 'Mejoría'],
  ['SIN_CAMBIOS', 'Sin cambios'],
  ['DETERIORO', 'Deterioro'],
  ['CRITICO', 'Crítico'],
] as const;

const diagnosisStatusOptions = [
  ['', 'Sin especificar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['ACTIVO', 'Activo'],
  ['EN_SEGUIMIENTO', 'En seguimiento'],
  ['MEJORANDO', 'Mejorando'],
  ['CONTROLADO', 'Controlado'],
  ['RESUELTO', 'Resuelto'],
  ['AGRAVADO', 'Agravado'],
] as const;

const prognosisStatusOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['BUENO', 'Bueno'],
  ['RESERVADO', 'Reservado'],
  ['MALO', 'Malo'],
] as const;

const treatmentChangeOptions = [
  ['', 'Sin registrar'],
  ['SIN_CAMBIOS', 'Sin cambios'],
  ['MODIFICADO', 'Modificado'],
  ['SUSPENDIDO', 'Suspendido'],
  ['NUEVO_TRATAMIENTO', 'Nuevo tratamiento'],
] as const;

const trendOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['MEJORIA', 'Mejoría'],
  ['ESTABLE_SIN_CAMBIOS', 'Estable sin cambios'],
  ['DETERIORO', 'Deterioro'],
  ['FLUCTUANTE', 'Fluctuante'],
] as const;

const pharmacologicalResponseOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['FAVORABLE', 'Favorable'],
  ['PARCIAL', 'Parcial'],
  ['SIN_RESPUESTA', 'Sin respuesta'],
  ['DESFAVORABLE', 'Desfavorable'],
  ['NO_EVALUABLE', 'No evaluable'],
  ['NO_APLICA', 'No aplica'],
] as const;

const cardiovascularRiskOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['BAJO', 'Bajo'],
  ['MODERADO', 'Moderado'],
  ['ALTO', 'Alto'],
  ['MUY_ALTO', 'Muy alto'],
] as const;

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

/// Tab "Evolución" (Fase 3). A diferencia de los demás tabs, maneja una *lista* de notas
/// cronológicas independientes (Evolución #1, #2...), cada una con su propio versionamiento
/// (spec 3.3: "nota vs versión").
export function EvolucionTab({ encounterNumber }: EvolucionTabProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session!.accessToken;
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  const listQuery = useQuery({
    queryKey: ['evolution-notes', encounterNumber],
    queryFn: () => fetchEvolutionNotes(token, encounterNumber),
  });

  const notes = useMemo(
    () => [...(listQuery.data?.notes ?? [])].sort((a, b) => b.noteNumber - a.noteNumber),
    [listQuery.data],
  );

  useEffect(() => {
    if (selectedNoteId || notes.length === 0) return;
    setSelectedNoteId(notes[0].id);
  }, [notes, selectedNoteId]);

  const detailQuery = useQuery({
    queryKey: ['evolution-note', encounterNumber, selectedNoteId],
    queryFn: () => fetchEvolutionNoteDetail(token, encounterNumber, selectedNoteId as string),
    enabled: Boolean(selectedNoteId),
  });

  const currentVersion = detailQuery.data?.versions?.[0] ?? null;
  const previousEvolution = detailQuery.data?.previousEvolution ?? null;

  useEffect(() => {
    if (!currentVersion) {
      setDraft(emptyDraft);
      return;
    }
    setDraft({
      clinicalStatus: currentVersion.clinicalStatus ?? '',
      complications: currentVersion.complications ?? '',
      subjective: currentVersion.subjective ?? '',
      vitalSystolicBp: currentVersion.vitalSystolicBp ?? undefined,
      vitalDiastolicBp: currentVersion.vitalDiastolicBp ?? undefined,
      vitalHeartRate: currentVersion.vitalHeartRate ?? undefined,
      vitalRespiratoryRate: currentVersion.vitalRespiratoryRate ?? undefined,
      vitalTemperatureC: currentVersion.vitalTemperatureC ?? undefined,
      vitalOxygenSaturation: currentVersion.vitalOxygenSaturation ?? undefined,
      vitalWeightKg: currentVersion.vitalWeightKg ?? undefined,
      vitalHeightCm: currentVersion.vitalHeightCm ?? undefined,
      vitalCapillaryGlucose: currentVersion.vitalCapillaryGlucose ?? undefined,
      vitalEva: currentVersion.vitalEva ?? undefined,
      objectiveFindings: currentVersion.objectiveFindings ?? '',
      recentResults: currentVersion.recentResults ?? '',
      primaryDiagnosisCode: currentVersion.primaryDiagnosisCode ?? '',
      primaryDiagnosisDescription: currentVersion.primaryDiagnosisDescription ?? '',
      primaryDiagnosisStatus: currentVersion.primaryDiagnosisStatus ?? '',
      prognosisStatus: currentVersion.prognosisStatus ?? '',
      prognosisDetail: currentVersion.prognosisDetail ?? '',
      treatmentChangeType: currentVersion.treatmentChangeType ?? '',
      treatmentNotes: currentVersion.treatmentNotes ?? '',
      proposedMedications: currentVersion.proposedMedicationsJson ?? [],
      plannedStudies: currentVersion.plannedStudies ?? '',
      plannedConsultations: currentVersion.plannedConsultations ?? '',
      followUpNotes: currentVersion.followUpNotes ?? '',
      nextAssessmentDate: currentVersion.nextAssessmentDate?.slice(0, 10) ?? '',
      consentCurrent: currentVersion.consentCurrent,
      informationProvided: currentVersion.informationProvided ?? '',
      trend: currentVersion.trend ?? '',
      comparativeAnalysis: currentVersion.comparativeAnalysis ?? '',
      pharmacologicalResponse: currentVersion.pharmacologicalResponse ?? '',
      adverseEvents: currentVersion.adverseEvents ?? '',
      clinicalJustification: currentVersion.clinicalJustification ?? '',
      glasgowOcular: currentVersion.glasgowOcular ?? undefined,
      glasgowVerbal: currentVersion.glasgowVerbal ?? undefined,
      glasgowMotor: currentVersion.glasgowMotor ?? undefined,
      cardiovascularRisk: currentVersion.cardiovascularRisk ?? '',
      karnofskyScore: currentVersion.karnofskyScore ?? undefined,
      otherScaleName: currentVersion.otherScaleName ?? '',
      otherScaleResult: currentVersion.otherScaleResult ?? '',
    });
  }, [currentVersion?.id]);

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['evolution-notes', encounterNumber] });
  const invalidateDetail = () =>
    queryClient.invalidateQueries({
      queryKey: ['evolution-note', encounterNumber, selectedNoteId],
    });

  const createNoteMutation = useMutation({
    mutationFn: () => createEvolutionNote(token, encounterNumber, {}),
    onSuccess: async () => {
      await invalidateList();
      const refreshed = await queryClient.fetchQuery({
        queryKey: ['evolution-notes', encounterNumber],
        queryFn: () => fetchEvolutionNotes(token, encounterNumber),
      });
      const newest = [...refreshed.notes].sort((a, b) => b.noteNumber - a.noteNumber)[0];
      if (newest) setSelectedNoteId(newest.id);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveEvolutionNoteDraft(token, encounterNumber, selectedNoteId as string, draft),
    onSuccess: async () => {
      await invalidateDetail();
      await invalidateList();
    },
  });
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeEvolutionNote(token, encounterNumber, selectedNoteId as string),
    onSuccess: async () => {
      await invalidateDetail();
      await invalidateList();
    },
  });
  const newVersionMutation = useMutation({
    mutationFn: () =>
      createEvolutionNoteNewVersion(token, encounterNumber, selectedNoteId as string, draft),
    onSuccess: async () => {
      await invalidateDetail();
      await invalidateList();
    },
  });

  const isDraft = !currentVersion || currentVersion.status === 'DRAFT';

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <Button
          className="w-full"
          disabled={createNoteMutation.isPending}
          onClick={() => createNoteMutation.mutate()}
          size="sm"
          type="button"
        >
          + Nueva evolución
        </Button>
        <ul className="space-y-1">
          {notes.map((note) => {
            const latest = note.versions[0];
            const isSelected = note.id === selectedNoteId;
            return (
              <li key={note.id}>
                <button
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  onClick={() => setSelectedNoteId(note.id)}
                  type="button"
                >
                  <span>Evolución #{note.noteNumber}</span>
                  {latest ? (
                    <Badge variant={latest.status === 'DRAFT' ? 'draft' : 'success'}>
                      {latest.status === 'DRAFT' ? 'Borrador' : 'Final'}
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        {notes.length === 0 && !listQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Sin notas de evolución todavía.</p>
        ) : null}
      </aside>

      <div className="space-y-5">
        {!selectedNoteId ? (
          <p className="text-sm text-muted-foreground">
            Selecciona una evolución o crea la primera con "+ Nueva evolución".
          </p>
        ) : detailQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando evolución...</p>
        ) : (
          <>
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

            {previousEvolution ? (
              <section className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Comparación con Evolución #{previousEvolution.noteNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registrada: {formatDateTime(previousEvolution.recordedAt)} · Estado clínico:{' '}
                  {previousEvolution.clinicalStatus ?? 'sin registrar'}
                </p>
              </section>
            ) : null}

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Estado general</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  disabled={!isDraft}
                  label="Estado clínico"
                  onChange={(value) => set('clinicalStatus', value)}
                  options={clinicalStatusOptions}
                  value={draft.clinicalStatus}
                />
              </div>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('complications', event.target.value)}
                placeholder="Complicaciones"
                value={draft.complications}
              />
            </section>

            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">S — Subjetivo</h3>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('subjective', event.target.value)}
                value={draft.subjective}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">O — Objetivo: signos vitales</h3>
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
                  vitalCapillaryGlucose: draft.vitalCapillaryGlucose,
                  vitalEva: draft.vitalEva,
                  vitalWeightKg: draft.vitalWeightKg,
                  vitalHeightCm: draft.vitalHeightCm,
                }}
                weightKey="vitalWeightKg"
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('objectiveFindings', event.target.value)}
                placeholder="Hallazgos objetivos focales"
                value={draft.objectiveFindings}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('recentResults', event.target.value)}
                placeholder="Resultados recientes relevantes"
                value={draft.recentResults}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">A — Análisis / Diagnóstico</h3>
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
              <SelectField
                disabled={!isDraft}
                label="Estado del diagnóstico"
                onChange={(value) => set('primaryDiagnosisStatus', value)}
                options={diagnosisStatusOptions}
                value={draft.primaryDiagnosisStatus}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">P — Plan</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  disabled={!isDraft}
                  label="Pronóstico"
                  onChange={(value) => set('prognosisStatus', value)}
                  options={prognosisStatusOptions}
                  value={draft.prognosisStatus}
                />
                <SelectField
                  disabled={!isDraft}
                  label="Cambio de tratamiento"
                  onChange={(value) => set('treatmentChangeType', value)}
                  options={treatmentChangeOptions}
                  value={draft.treatmentChangeType}
                />
              </div>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('prognosisDetail', event.target.value)}
                placeholder="Detalle del pronóstico"
                value={draft.prognosisDetail}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('treatmentNotes', event.target.value)}
                placeholder="Notas de tratamiento"
                value={draft.treatmentNotes}
              />
              <p className="text-xs font-medium text-muted-foreground">
                Conducta terapéutica propuesta (no sustituye la Receta formal)
              </p>
              <MedicationOrderInput
                items={draft.proposedMedications}
                onChange={(items) => set('proposedMedications', items)}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('plannedStudies', event.target.value)}
                placeholder="Estudios planeados"
                value={draft.plannedStudies}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('plannedConsultations', event.target.value)}
                placeholder="Interconsultas planeadas"
                value={draft.plannedConsultations}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('followUpNotes', event.target.value)}
                placeholder="Notas de seguimiento"
                value={draft.followUpNotes}
              />
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Próxima valoración</span>
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('nextAssessmentDate', event.target.value)}
                  type="date"
                  value={draft.nextAssessmentDate}
                />
              </label>
            </section>

            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Consentimiento e información</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={draft.consentCurrent}
                  disabled={!isDraft}
                  onChange={(event) => set('consentCurrent', event.target.checked)}
                  type="checkbox"
                />
                Se brindó información en esta evolución
              </label>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('informationProvided', event.target.value)}
                placeholder="Información proporcionada"
                value={draft.informationProvided}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Comparación y respuesta al tratamiento</h3>
              <SelectField
                disabled={!isDraft}
                label="Tendencia"
                onChange={(value) => set('trend', value)}
                options={trendOptions}
                value={draft.trend}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('comparativeAnalysis', event.target.value)}
                placeholder="Análisis comparativo"
                value={draft.comparativeAnalysis}
              />
              <SelectField
                disabled={!isDraft}
                label="Respuesta farmacológica"
                onChange={(value) => set('pharmacologicalResponse', value)}
                options={pharmacologicalResponseOptions}
                value={draft.pharmacologicalResponse}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('adverseEvents', event.target.value)}
                placeholder="Eventos adversos"
                value={draft.adverseEvents}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('clinicalJustification', event.target.value)}
                placeholder="Justificación clínica"
                value={draft.clinicalJustification}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Escalas clínicas</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Glasgow ocular (1-4)</span>
                  <Input
                    disabled={!isDraft}
                    max={4}
                    min={1}
                    onChange={(event) =>
                      set('glasgowOcular', event.target.value === '' ? undefined : Number(event.target.value))
                    }
                    type="number"
                    value={draft.glasgowOcular ?? ''}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Glasgow verbal (1-5)</span>
                  <Input
                    disabled={!isDraft}
                    max={5}
                    min={1}
                    onChange={(event) =>
                      set('glasgowVerbal', event.target.value === '' ? undefined : Number(event.target.value))
                    }
                    type="number"
                    value={draft.glasgowVerbal ?? ''}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Glasgow motor (1-6)</span>
                  <Input
                    disabled={!isDraft}
                    max={6}
                    min={1}
                    onChange={(event) =>
                      set('glasgowMotor', event.target.value === '' ? undefined : Number(event.target.value))
                    }
                    type="number"
                    value={draft.glasgowMotor ?? ''}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  disabled={!isDraft}
                  label="Riesgo cardiovascular"
                  onChange={(value) => set('cardiovascularRisk', value)}
                  options={cardiovascularRiskOptions}
                  value={draft.cardiovascularRisk}
                />
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Karnofsky (0-100)</span>
                  <Input
                    disabled={!isDraft}
                    max={100}
                    min={0}
                    onChange={(event) =>
                      set('karnofskyScore', event.target.value === '' ? undefined : Number(event.target.value))
                    }
                    type="number"
                    value={draft.karnofskyScore ?? ''}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('otherScaleName', event.target.value)}
                  placeholder="Otra escala (nombre)"
                  value={draft.otherScaleName}
                />
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('otherScaleResult', event.target.value)}
                  placeholder="Resultado"
                  value={draft.otherScaleResult}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
