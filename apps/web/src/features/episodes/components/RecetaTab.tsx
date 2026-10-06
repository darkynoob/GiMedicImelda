import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatDateTime } from '../../../shared/lib/formatters';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  createPrescription,
  createPrescriptionNewVersion,
  fetchPrescriptions,
  finalizePrescription,
  registerPrescriptionDownload,
  savePrescriptionDraft,
  type EducationalMaterialItem,
  type PrescriptionMedicationItem,
  type WarningSignItem,
} from '../api/prescription.service';
import { ClinicalDocumentStatusBar } from './ClinicalDocumentStatusBar';
import { DiagnosisSelector } from './DiagnosisSelector';

type RecetaTabProps = {
  encounterNumber: string;
};

type DraftState = {
  prescriptionType: string;
  validityOption: string;
  validityExpiresAt: string;
  primaryDiagnosisCode: string;
  primaryDiagnosisDescription: string;
  generalInstructions: string;
  medications: PrescriptionMedicationItem[];
  criticalAlertAcknowledged: boolean;
  criticalAlertJustification: string;
  warningSigns: WarningSignItem[];
  nextAppointmentDate: string;
  educationInfoProvided: string;
  educationNonPharmacological: string;
  patientComprehension: string;
  educationalMaterials: EducationalMaterialItem[];
  followUpType: string;
  followUpInstructions: string;
};

const emptyDraft: DraftState = {
  prescriptionType: 'ORDINARIA',
  validityOption: '',
  validityExpiresAt: '',
  primaryDiagnosisCode: '',
  primaryDiagnosisDescription: '',
  generalInstructions: '',
  medications: [],
  criticalAlertAcknowledged: false,
  criticalAlertJustification: '',
  warningSigns: [],
  nextAppointmentDate: '',
  educationInfoProvided: '',
  educationNonPharmacological: '',
  patientComprehension: '',
  educationalMaterials: [],
  followUpType: '',
  followUpInstructions: '',
};

const prescriptionTypeOptions = [
  ['ORDINARIA', 'Ordinaria'],
  ['OTRA', 'Otra'],
] as const;

const routeOptions = [
  '',
  'ORAL',
  'INTRAVENOSA',
  'INTRAMUSCULAR',
  'SUBCUTANEA',
  'TOPICA',
  'INHALADA',
  'OFTALMICA',
  'OTICA',
  'RECTAL',
  'VAGINAL',
  'SUBLINGUAL',
  'OTRA',
] as const;

const frequencyPresetOptions = [
  '',
  'CADA_4_HORAS',
  'CADA_6_HORAS',
  'CADA_8_HORAS',
  'CADA_12_HORAS',
  'CADA_24_HORAS',
  'UNA_VEZ_AL_DIA',
  'DOS_VECES_AL_DIA',
  'TRES_VECES_AL_DIA',
  'PRN',
  'OTRA',
] as const;

const durationUnitOptions = ['', 'DIAS', 'SEMANAS', 'MESES'] as const;

const medicationTypeOptions = [
  '',
  'AGUDO',
  'CRONICO',
  'RESCATE',
  'PRN',
  'PROFILACTICO',
  'OTRO',
] as const;

const warningSeverityOptions = [
  ['', 'Sin especificar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['LEVE', 'Leve'],
  ['MODERADA', 'Moderada'],
  ['GRAVE', 'Grave'],
  ['URGENTE', 'Urgente'],
] as const;

const comprehensionOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['COMPRENDE_Y_ACEPTA', 'Comprende y acepta'],
  ['COMPRENDE_PARCIALMENTE', 'Comprende parcialmente'],
  ['NO_COMPRENDE', 'No comprende'],
  ['RECHAZA', 'Rechaza'],
] as const;

const followUpTypeOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['CONSULTA_PRESENCIAL', 'Consulta presencial'],
  ['TELECONSULTA', 'Teleconsulta'],
  ['LLAMADA', 'Llamada'],
  ['SEGUIMIENTO_RESULTADOS', 'Seguimiento de resultados'],
  ['REFERENCIA_INTERCONSULTA', 'Referencia / interconsulta'],
  ['URGENCIAS_SI_EMPEORA', 'Urgencias si empeora'],
  ['OTRO', 'Otro'],
] as const;

const allergyStatusLabels: Record<string, { label: string; variant: 'success' | 'alert' | 'warning' }> = {
  NONE_KNOWN_CONFIRMED: { label: 'Sin alergias conocidas (confirmado)', variant: 'success' },
  NO_MATCHES_DETECTED: { label: 'Sin coincidencias detectadas', variant: 'success' },
  ALLERGY_INFO_UNAVAILABLE: { label: 'Sin información de alergias en el perfil', variant: 'warning' },
  MATCH_DETECTED: { label: 'Coincidencia con alergia detectada', variant: 'alert' },
};

const duplicateStatusLabels: Record<string, { label: string; variant: 'success' | 'alert' | 'warning' }> = {
  NONE_DETECTED: { label: 'Sin duplicidad detectada', variant: 'success' },
  DUPLICATES_DETECTED: { label: 'Posible terapia duplicada', variant: 'alert' },
  LIMITED_ENGINE: { label: 'Validación limitada (catálogo incompleto)', variant: 'warning' },
};

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

function MedicationRows({
  items,
  disabled,
  onChange,
}: {
  items: PrescriptionMedicationItem[];
  disabled: boolean;
  onChange: (items: PrescriptionMedicationItem[]) => void;
}) {
  const update = (index: number, patch: Partial<PrescriptionMedicationItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, {}]);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3" key={item.id ?? index}>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              disabled={disabled}
              onChange={(event) => update(index, { medication: event.target.value })}
              placeholder="Medicamento"
              value={item.medication ?? ''}
            />
            <Input
              disabled={disabled}
              onChange={(event) => update(index, { activeIngredient: event.target.value })}
              placeholder="Principio activo"
              value={item.activeIngredient ?? ''}
            />
            <Input
              disabled={disabled}
              onChange={(event) => update(index, { presentation: event.target.value })}
              placeholder="Presentación"
              value={item.presentation ?? ''}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-6">
            <Input
              disabled={disabled}
              onChange={(event) =>
                update(index, { doseQuantity: event.target.value === '' ? undefined : Number(event.target.value) })
              }
              placeholder="Cantidad"
              type="number"
              value={item.doseQuantity ?? ''}
            />
            <Input
              disabled={disabled}
              onChange={(event) => update(index, { doseUnit: event.target.value })}
              placeholder="Unidad"
              value={item.doseUnit ?? ''}
            />
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              disabled={disabled}
              onChange={(event) => update(index, { route: event.target.value })}
              value={item.route ?? ''}
            >
              <option value="">Vía</option>
              {routeOptions.filter(Boolean).map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              disabled={disabled}
              onChange={(event) => update(index, { frequencyPreset: event.target.value })}
              value={item.frequencyPreset ?? ''}
            >
              <option value="">Frecuencia</option>
              {frequencyPresetOptions.filter(Boolean).map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
            <Input
              disabled={disabled}
              onChange={(event) =>
                update(index, { intervalHours: event.target.value === '' ? undefined : Number(event.target.value) })
              }
              placeholder="Intervalo (h)"
              type="number"
              value={item.intervalHours ?? ''}
            />
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              disabled={disabled}
              onChange={(event) => update(index, { medicationType: event.target.value })}
              value={item.medicationType ?? ''}
            >
              <option value="">Tipo</option>
              {medicationTypeOptions.filter(Boolean).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              disabled={disabled}
              onChange={(event) =>
                update(index, { durationValue: event.target.value === '' ? undefined : Number(event.target.value) })
              }
              placeholder="Duración"
              type="number"
              value={item.durationValue ?? ''}
            />
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              disabled={disabled}
              onChange={(event) => update(index, { durationUnit: event.target.value })}
              value={item.durationUnit ?? ''}
            >
              <option value="">Unidad duración</option>
              {durationUnitOptions.filter(Boolean).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <Input
              disabled={disabled}
              onChange={(event) => update(index, { routeDetail: event.target.value })}
              placeholder="Detalle de vía (si 'Otra')"
              value={item.routeDetail ?? ''}
            />
          </div>
          <Textarea
            disabled={disabled}
            onChange={(event) => update(index, { instructions: event.target.value })}
            placeholder="Instrucciones"
            value={item.instructions ?? ''}
          />
          <Textarea
            disabled={disabled}
            onChange={(event) => update(index, { warnings: event.target.value })}
            placeholder="Advertencias"
            value={item.warnings ?? ''}
          />
          {!disabled ? (
            <Button onClick={() => remove(index)} size="sm" type="button" variant="outline">
              Quitar medicamento
            </Button>
          ) : null}
        </div>
      ))}
      {!disabled ? (
        <Button onClick={add} size="sm" type="button" variant="outline">
          + Agregar medicamento
        </Button>
      ) : null}
    </div>
  );
}

function WarningSignRows({
  items,
  disabled,
  onChange,
}: {
  items: WarningSignItem[];
  disabled: boolean;
  onChange: (items: WarningSignItem[]) => void;
}) {
  const update = (index: number, patch: Partial<WarningSignItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, {}]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]" key={index}>
          <Input
            disabled={disabled}
            onChange={(event) => update(index, { sign: event.target.value })}
            placeholder="Signo de alarma"
            value={item.sign ?? ''}
          />
          <SelectField
            disabled={disabled}
            label=""
            onChange={(value) => update(index, { severity: value })}
            options={warningSeverityOptions}
            value={item.severity ?? ''}
          />
          {!disabled ? (
            <Button onClick={() => remove(index)} size="sm" type="button" variant="outline">
              Quitar
            </Button>
          ) : null}
        </div>
      ))}
      {!disabled ? (
        <Button onClick={add} size="sm" type="button" variant="outline">
          + Agregar signo de alarma
        </Button>
      ) : null}
    </div>
  );
}

function EducationalMaterialRows({
  items,
  disabled,
  onChange,
}: {
  items: EducationalMaterialItem[];
  disabled: boolean;
  onChange: (items: EducationalMaterialItem[]) => void;
}) {
  const update = (index: number, patch: Partial<EducationalMaterialItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, {}]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]" key={index}>
          <Input
            disabled={disabled}
            onChange={(event) => update(index, { title: event.target.value })}
            placeholder="Título del material"
            value={item.title ?? ''}
          />
          <Input
            disabled={disabled}
            onChange={(event) => update(index, { type: event.target.value })}
            placeholder="Tipo"
            value={item.type ?? ''}
          />
          {!disabled ? (
            <Button onClick={() => remove(index)} size="sm" type="button" variant="outline">
              Quitar
            </Button>
          ) : null}
        </div>
      ))}
      {!disabled ? (
        <Button onClick={add} size="sm" type="button" variant="outline">
          + Agregar material educativo
        </Button>
      ) : null}
    </div>
  );
}

/// Tab "Receta e indicaciones" (Fase 4). Lista de recetas (folio por receta), cada una
/// versionada. El PDF binario real no está implementado todavía (biblioteca pendiente de
/// decidir); "Registrar descarga oficial" solo incrementa el contador real en una versión
/// Finalizada, sin generar ni simular un archivo.
export function RecetaTab({ encounterNumber }: RecetaTabProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session!.accessToken;
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  const listQuery = useQuery({
    queryKey: ['prescriptions', encounterNumber],
    queryFn: () => fetchPrescriptions(token, encounterNumber),
  });

  const prescriptions = useMemo(
    () =>
      [...(listQuery.data?.prescriptions ?? [])].sort(
        (a, b) => b.prescriptionNumber - a.prescriptionNumber,
      ),
    [listQuery.data],
  );

  useEffect(() => {
    if (selectedPrescriptionId || prescriptions.length === 0) return;
    setSelectedPrescriptionId(prescriptions[0].id);
  }, [prescriptions, selectedPrescriptionId]);

  const selectedPrescription = prescriptions.find((p) => p.id === selectedPrescriptionId) ?? null;
  const currentVersion = selectedPrescription?.versions?.[0] ?? null;

  useEffect(() => {
    if (!currentVersion) {
      setDraft(emptyDraft);
      return;
    }
    setDraft({
      prescriptionType: currentVersion.prescriptionType ?? 'ORDINARIA',
      validityOption: currentVersion.validityOption ?? '',
      validityExpiresAt: currentVersion.validityExpiresAt?.slice(0, 10) ?? '',
      primaryDiagnosisCode: currentVersion.primaryDiagnosisCode ?? '',
      primaryDiagnosisDescription: currentVersion.primaryDiagnosisDescription ?? '',
      generalInstructions: currentVersion.generalInstructions ?? '',
      medications: currentVersion.medicationsJson ?? [],
      criticalAlertAcknowledged: currentVersion.criticalAlertAcknowledged,
      criticalAlertJustification: currentVersion.criticalAlertJustification ?? '',
      warningSigns: currentVersion.warningSignsJson ?? [],
      nextAppointmentDate: currentVersion.nextAppointmentDate?.slice(0, 10) ?? '',
      educationInfoProvided: currentVersion.educationInfoProvided ?? '',
      educationNonPharmacological: currentVersion.educationNonPharmacological ?? '',
      patientComprehension: currentVersion.patientComprehension ?? '',
      educationalMaterials: currentVersion.educationalMaterialsJson ?? [],
      followUpType: currentVersion.followUpType ?? '',
      followUpInstructions: currentVersion.followUpInstructions ?? '',
    });
  }, [currentVersion?.id]);

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['prescriptions', encounterNumber] });

  const createMutation = useMutation({
    mutationFn: () => createPrescription(token, encounterNumber, {}),
    onSuccess: async () => {
      await invalidateList();
      const refreshed = await queryClient.fetchQuery({
        queryKey: ['prescriptions', encounterNumber],
        queryFn: () => fetchPrescriptions(token, encounterNumber),
      });
      const newest = [...refreshed.prescriptions].sort(
        (a, b) => b.prescriptionNumber - a.prescriptionNumber,
      )[0];
      if (newest) setSelectedPrescriptionId(newest.id);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      savePrescriptionDraft(token, encounterNumber, selectedPrescriptionId as string, draft),
    onSuccess: invalidateList,
  });
  const finalizeMutation = useMutation({
    mutationFn: () => finalizePrescription(token, encounterNumber, selectedPrescriptionId as string),
    onSuccess: invalidateList,
  });
  const newVersionMutation = useMutation({
    mutationFn: () =>
      createPrescriptionNewVersion(token, encounterNumber, selectedPrescriptionId as string, draft),
    onSuccess: invalidateList,
  });
  const downloadMutation = useMutation({
    mutationFn: () =>
      registerPrescriptionDownload(
        token,
        encounterNumber,
        selectedPrescriptionId as string,
        currentVersion!.id,
      ),
    onSuccess: invalidateList,
  });

  const isDraft = !currentVersion || currentVersion.status === 'DRAFT';

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const allergyInfo = currentVersion?.allergyValidationStatus
    ? allergyStatusLabels[currentVersion.allergyValidationStatus]
    : null;
  const duplicateInfo = currentVersion?.duplicateTherapyValidationStatus
    ? duplicateStatusLabels[currentVersion.duplicateTherapyValidationStatus]
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <Button
          className="w-full"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
          size="sm"
          type="button"
        >
          + Nueva receta
        </Button>
        <ul className="space-y-1">
          {prescriptions.map((prescription) => {
            const latest = prescription.versions[0];
            const isSelected = prescription.id === selectedPrescriptionId;
            return (
              <li key={prescription.id}>
                <button
                  className={`flex w-full flex-col items-start rounded-lg border px-3 py-2 text-left text-sm ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  onClick={() => setSelectedPrescriptionId(prescription.id)}
                  type="button"
                >
                  <span className="flex w-full items-center justify-between">
                    Receta #{prescription.prescriptionNumber}
                    {latest ? (
                      <Badge variant={latest.status === 'DRAFT' ? 'draft' : 'success'}>
                        {latest.status === 'DRAFT' ? 'Borrador' : 'Final'}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{prescription.folio}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {prescriptions.length === 0 && !listQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Sin recetas todavía.</p>
        ) : null}
      </aside>

      <div className="space-y-5">
        {!selectedPrescriptionId ? (
          <p className="text-sm text-muted-foreground">
            Selecciona una receta o crea la primera con "+ Nueva receta".
          </p>
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

            <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-muted-foreground">
              <span>Folio: {selectedPrescription?.folio}</span>
              {currentVersion?.verificationCode ? (
                <span>Código de verificación: {currentVersion.verificationCode}</span>
              ) : null}
              {!isDraft ? (
                <Button
                  disabled={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Registrar descarga oficial ({currentVersion?.downloadCount ?? 0})
                </Button>
              ) : null}
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Encabezado de receta</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectField
                  disabled={!isDraft}
                  label="Tipo"
                  onChange={(value) => set('prescriptionType', value)}
                  options={prescriptionTypeOptions}
                  value={draft.prescriptionType}
                />
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('validityOption', event.target.value)}
                  placeholder="Vigencia"
                  value={draft.validityOption}
                />
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Expira</span>
                  <Input
                    disabled={!isDraft}
                    onChange={(event) => set('validityExpiresAt', event.target.value)}
                    type="date"
                    value={draft.validityExpiresAt}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Diagnóstico asociado</h3>
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
              <h3 className="text-sm font-semibold text-slate-900">Indicaciones generales</h3>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('generalInstructions', event.target.value)}
                value={draft.generalInstructions}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Prescripción farmacológica</h3>
              <MedicationRows
                disabled={!isDraft}
                items={draft.medications}
                onChange={(items) => set('medications', items)}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Validaciones automáticas de seguridad</h3>
              <p className="text-xs text-muted-foreground">
                Se recalculan en cada guardado a partir del perfil real del paciente; nunca se
                inventa una validación sin una fuente detrás.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {allergyInfo ? (
                  <Badge variant={allergyInfo.variant}>{allergyInfo.label}</Badge>
                ) : (
                  <Badge variant="default">Alergias: pendiente de guardar</Badge>
                )}
                {duplicateInfo ? (
                  <Badge variant={duplicateInfo.variant}>{duplicateInfo.label}</Badge>
                ) : (
                  <Badge variant="default">Duplicidad: pendiente de guardar</Badge>
                )}
                <Badge variant="warning">Interacciones: no configurado (sin motor real)</Badge>
              </div>
              {currentVersion?.allergyValidationDetailJson?.length ? (
                <ul className="list-inside list-disc text-xs text-red-700">
                  {currentVersion.allergyValidationDetailJson.map((match, index) => (
                    <li key={index}>
                      {match.medication} ↔ alergia a {match.substance}
                    </li>
                  ))}
                </ul>
              ) : null}
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={draft.criticalAlertAcknowledged}
                  disabled={!isDraft}
                  onChange={(event) => set('criticalAlertAcknowledged', event.target.checked)}
                  type="checkbox"
                />
                Alerta crítica revisada y se decide continuar de todas formas
              </label>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('criticalAlertJustification', event.target.value)}
                placeholder="Justificación clínica de continuar pese a la alerta"
                value={draft.criticalAlertJustification}
              />
            </section>

            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Signos de alarma</h3>
              <WarningSignRows
                disabled={!isDraft}
                items={draft.warningSigns}
                onChange={(items) => set('warningSigns', items)}
              />
            </section>

            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Próxima cita</h3>
              <Input
                disabled={!isDraft}
                onChange={(event) => set('nextAppointmentDate', event.target.value)}
                type="date"
                value={draft.nextAppointmentDate}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Educación al paciente</h3>
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('educationInfoProvided', event.target.value)}
                placeholder="Información proporcionada"
                value={draft.educationInfoProvided}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('educationNonPharmacological', event.target.value)}
                placeholder="Indicaciones no farmacológicas"
                value={draft.educationNonPharmacological}
              />
              <SelectField
                disabled={!isDraft}
                label="Comprensión del paciente"
                onChange={(value) => set('patientComprehension', value)}
                options={comprehensionOptions}
                value={draft.patientComprehension}
              />
              <EducationalMaterialRows
                disabled={!isDraft}
                items={draft.educationalMaterials}
                onChange={(items) => set('educationalMaterials', items)}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Plan de seguimiento</h3>
              <SelectField
                disabled={!isDraft}
                label="Tipo"
                onChange={(value) => set('followUpType', value)}
                options={followUpTypeOptions}
                value={draft.followUpType}
              />
              <Textarea
                disabled={!isDraft}
                onChange={(event) => set('followUpInstructions', event.target.value)}
                placeholder="Instrucciones de seguimiento"
                value={draft.followUpInstructions}
              />
            </section>

            {currentVersion?.finalizedAt ? (
              <p className="text-xs text-muted-foreground">
                Finalizada: {formatDateTime(currentVersion.finalizedAt)}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
