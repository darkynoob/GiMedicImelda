import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  LoaderCircle,
  Save,
  ShieldAlert,
  Stethoscope,
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
  fetchEncounterDetail,
  fetchEncounterMeta,
  updateEncounter,
} from '../api/encounters.service';
import {
  admissionSourceLabels,
  encounterStatusConfig,
  encounterTypeConfig,
  getEncounterTabs,
  timelineKindConfig,
} from './episode-helpers';
import {
  buildInitialStructuredSections,
  getEpisodeTabDefinition,
} from './episode-profile-schema';

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
  const [feedback, setFeedback] = useState<string | null>(null);

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
                disabled={updateMutation.isPending}
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
                    {activeTabDefinition.sections.map((section) => (
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
                            const fieldValue =
                              structuredSections[activeTab]?.[field.key] ?? '';

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
                                    onChange={(event) =>
                                      updateStructuredField(
                                        activeTab,
                                        field.key,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={field.placeholder}
                                    value={fieldValue}
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
                                    onChange={(event) =>
                                      updateStructuredField(
                                        activeTab,
                                        field.key,
                                        event.target.value,
                                      )
                                    }
                                    value={fieldValue}
                                  >
                                    {(field.options ?? []).map((option) => (
                                      <option key={option.value || 'empty'} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              );
                            }

                            return (
                              <label className="space-y-2 text-sm" key={field.key}>
                                <span className="font-medium text-slate-900">
                                  {field.label}
                                </span>
                                <Input
                                  onChange={(event) =>
                                    updateStructuredField(
                                      activeTab,
                                      field.key,
                                      event.target.value,
                                    )
                                  }
                                  placeholder={field.placeholder}
                                  type={field.type}
                                  value={fieldValue}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
      </div>
    </AppLayout>
  );
}
