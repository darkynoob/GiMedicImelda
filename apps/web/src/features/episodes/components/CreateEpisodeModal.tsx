import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LoaderCircle,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  X,
  IdCard,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import type {
  CreateEncounterRequest,
  EncounterMetaResponse,
} from '../../../shared/types/contracts';
import { useAuth } from '../../auth/hooks/auth-context';
import { createEncounter } from '../api/encounters.service';
import { encounterTypeConfig, supportedEncounterTypes } from './episode-helpers';

type CreateEpisodeModalProps = {
  isOpen: boolean;
  meta: EncounterMetaResponse | undefined;
  onClose: () => void;
};

type FormState = {
  patientId: string;
  facilityId: string;
  specialtyId: string;
  attendingUserId: string;
  encounterType: string;
  openedAt: string;
  reasonForVisit: string;
  notes: string;
};

const initialState = (): FormState => ({
  patientId: '',
  facilityId: '',
  specialtyId: '',
  attendingUserId: '',
  encounterType: 'OUTPATIENT',
  openedAt: new Date().toISOString().slice(0, 16),
  reasonForVisit: '',
  notes: '',
});

const hiddenSpecialtyNamesForEpisodeCreation = new Set([
  'Medicina general',
  'Medicina familiar',
  'Medicina preventiva',
  'Salud pública',
  'Odontología / Estomatología',
  'Psicología clínica',
  'Terapia física',
  'Terapia respiratoria',
  'Trabajo social',
]);

export function CreateEpisodeModal({
  isOpen,
  meta,
  onClose,
}: CreateEpisodeModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [form, setForm] = useState<FormState>(initialState);
  const [patientSearch, setPatientSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialState);
      setPatientSearch('');
      setErrorMessage(null);
      return;
    }

    if (meta && !form.facilityId) {
      setForm((currentValue) => ({
        ...currentValue,
        facilityId: meta.facilities[0]?.id ?? '',
      }));
    }
  }, [form.facilityId, isOpen, meta]);

  const visiblePatients = useMemo(() => {
    const searchValue = patientSearch.trim().toLowerCase();

    if (!meta) return [];
    if (!searchValue) return meta.patients.slice(0, 8);

    return meta.patients
      .filter(
        (patient) =>
          patient.fullName.toLowerCase().includes(searchValue) ||
          (patient.curp ?? '').toLowerCase().includes(searchValue),
      )
      .slice(0, 8);
  }, [meta, patientSearch]);

  const selectedPatient = meta?.patients.find(
    (patient) => patient.id === form.patientId,
  );

  const availableSpecialties = useMemo(
    () =>
      (meta?.specialties ?? [])
        .filter((specialty) => {
          if (hiddenSpecialtyNamesForEpisodeCreation.has(specialty.name)) {
            return false;
          }

          return specialty.category !== 'COMPLEMENTARY' && specialty.category !== 'BASIC';
        })
        .sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [meta],
  );

  useEffect(() => {
    if (
      form.specialtyId &&
      !availableSpecialties.some((specialty) => specialty.id === form.specialtyId)
    ) {
      setForm((currentValue) => ({
        ...currentValue,
        specialtyId: '',
      }));
    }
  }, [availableSpecialties, form.specialtyId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateEncounterRequest) =>
      createEncounter(session!.accessToken, payload),
    onSuccess: async (encounter) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['encounters'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      ]);
      onClose();
      navigate(`/episodios/${encounter.encounterNumber}`);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  if (!isOpen) return null;

  const submitForm = () => {
    if (!form.patientId || !form.facilityId || !form.encounterType) {
      setErrorMessage('Selecciona paciente, sede y tipo de episodio.');
      return;
    }

    setErrorMessage(null);
    createMutation.mutate({
      patientId: form.patientId,
      facilityId: form.facilityId,
      specialtyId: form.specialtyId || undefined,
      attendingUserId: form.attendingUserId || undefined,
      encounterType: form.encounterType,
      openedAt: form.openedAt ? new Date(form.openedAt).toISOString() : undefined,
      reasonForVisit: form.reasonForVisit.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/55 p-4 md:p-6"
      role="dialog"
    >
      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border-slate-200 bg-slate-100 shadow-2xl">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                <UserRound className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  Nuevo episodio
                </p>
                <h2 className="truncate text-lg font-semibold text-white">
                  Apertura de episodio clinico
                </h2>
                <p className="text-xs text-white/60 truncate">
                  Selecciona al paciente e ingresa los datos iniciales del episodio clínico.
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
        </div>

        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
            <section className="space-y-7">
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Paciente
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Busca por nombre o CURP y deja listo el episodio para
                      continuar la captura.
                    </p>
                  </div>
                </div>

                {!selectedPatient ? (
                  <div className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-primary/20"
                        onChange={(event) => setPatientSearch(event.target.value)}
                        placeholder="Buscar paciente por nombre o CURP..."
                        value={patientSearch}
                      />
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {visiblePatients.map((patient) => (
                        <button
                          className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm transition-all duration-200"
                          key={patient.id}
                          onClick={() =>
                            setForm((currentValue) => ({
                              ...currentValue,
                              patientId: patient.id,
                            }))
                          }
                          type="button"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {patient.fullName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {patient.curp ?? 'Sin CURP'} · {patient.patientStatus}
                          </p>
                        </button>
                      ))}
                      {visiblePatients.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-muted-foreground">
                          No encontramos pacientes con esa busqueda.
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-primary/[0.01] p-4 ">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedPatient.fullName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {selectedPatient.curp ?? 'Sin CURP'} ·{' '}
                          {selectedPatient.medicalUnit ?? 'Sin unidad medica'}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600">
                          Paciente seleccionado
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          setForm((currentValue) => ({
                            ...currentValue,
                            patientId: '',
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Tipo de episodio
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Selecciona el tipo de atención clínica que deseas registrar.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {supportedEncounterTypes.map((value) => {
                    const config = encounterTypeConfig[value];
                    const Icon = config.icon;
                    const isSelected = form.encounterType === value;

                    return (
                      <button
                        className={`rounded-2xl border px-4 py-4 text-left transition border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md ${
                          isSelected
                            ? 'border-primary/30 bg-primary/[0.04] shadow-[0_8px_24px_rgba(59,130,246,0.12)]'
                            : 'border-slate-200 bg-slate-50 hover:border-primary/30 hover:bg-primary/[0.03]'
                        }`}
                        key={value}
                        onClick={() =>
                          setForm((currentValue) => ({
                            ...currentValue,
                            encounterType: value,
                          }))
                        }
                        type="button"
                      >
                        <div
                          className={`inline-flex rounded-xl border px-2 py-2 ${config.className}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {config.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-slate-900">
                      Datos de apertura
                    </h3>
                  </div>
                </div>
               
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-900">Sede</span>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(event) =>
                        setForm((currentValue) => ({
                          ...currentValue,
                          facilityId: event.target.value,
                        }))
                      }
                      value={form.facilityId}
                    >
                      <option value="">Selecciona una sede</option>
                      {(meta?.facilities ?? []).map((facility) => (
                        <option key={facility.id} value={facility.id}>
                          {facility.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-900">Especialidad</span>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(event) =>
                        setForm((currentValue) => ({
                          ...currentValue,
                          specialtyId: event.target.value,
                        }))
                      }
                      value={form.specialtyId}
                    >
                      <option value="">Sin especialidad especifica</option>
                      {availableSpecialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-900">
                      Profesional responsable
                    </span>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(event) =>
                        setForm((currentValue) => ({
                          ...currentValue,
                          attendingUserId: event.target.value,
                        }))
                      }
                      value={form.attendingUserId}
                    >
                      <option value="">Sin asignar</option>
                      {(meta?.clinicians ?? []).map((clinician) => (
                        <option key={clinician.id} value={clinician.id}>
                          {clinician.fullName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-900">Estado inicial</span>
                    <Input
                      disabled
                      readOnly
                      value="Abierto"
                      className="cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 opacity-100"
                    />
                  </label>
                </div>

                <label className="mt-4 block space-y-2 text-sm">
                  <span className="font-medium text-slate-900">Fecha y hora de apertura</span>
                  <Input
                    onChange={(event) =>
                      setForm((currentValue) => ({
                        ...currentValue,
                        openedAt: event.target.value,
                      }))
                    }
                    type="datetime-local"
                    value={form.openedAt}
                  />
                </label>

                <label className="mt-4 block space-y-2 text-sm">
                  <span className="font-medium text-slate-900">Motivo de atencion</span>
                  <Textarea
                    onChange={(event) =>
                      setForm((currentValue) => ({
                        ...currentValue,
                        reasonForVisit: event.target.value,
                      }))
                    }
                    placeholder="Describe el motivo principal del episodio..."
                    value={form.reasonForVisit}
                  />
                </label>

                <label className="mt-4 block space-y-2 text-sm">
                  <span className="font-medium text-slate-900">Notas operativas</span>
                  <Textarea
                    onChange={(event) =>
                      setForm((currentValue) => ({
                        ...currentValue,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Observaciones iniciales, contexto o notas de continuidad..."
                    value={form.notes}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-7">
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <IdCard className="h-4 w-4" />
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-slate-900">
                      Resumen
                    </h3>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-lg bg-muted/30 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Paciente
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {selectedPatient?.fullName ?? 'Sin seleccionar'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span>Tipo:</span>{' '}
                      {encounterTypeConfig[form.encounterType]?.label ?? 'Sin definir'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span>Sede:</span>{' '}
                      {meta?.facilities.find((facility) => facility.id === form.facilityId)
                      ?.name ?? 'Sin definir'}
                    </p>
                  </div>
                </div>
                {errorMessage ? (
                  <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {errorMessage}
                  </div>
                ) : null}
                
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-5 py-3">
          <div className="flex items-center justify-end gap-3">
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
                    className="text-sm"
                    disabled={createMutation.isPending}
                    onClick={submitForm}
                    type="button"
              >
                    {createMutation.isPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        Crear episodio
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
