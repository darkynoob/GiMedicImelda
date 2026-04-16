import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  FileText,
  Filter,
  Plus,
  Search,
  Stethoscope,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatDateTime } from '../../../shared/lib/formatters';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  fetchEncounterMeta,
  fetchEncounters,
} from '../api/encounters.service';
import { CreateEpisodeModal } from './CreateEpisodeModal';
import {
  admissionSourceLabels,
  encounterStatusConfig,
  encounterTypeConfig,
} from './episode-helpers';

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || 'all'}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EpisodesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [encounterType, setEncounterType] = useState('');
  const [status, setStatus] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const metaQuery = useQuery({
    queryKey: ['encounters-meta'],
    queryFn: () => fetchEncounterMeta(session!.accessToken),
    enabled: Boolean(session),
  });

  const encountersQuery = useQuery({
    queryKey: ['encounters', search, encounterType, status, facilityId],
    queryFn: () =>
      fetchEncounters(session!.accessToken, {
        page: 1,
        pageSize: 25,
        search,
        encounterType,
        status,
        facilityId,
      }),
    enabled: Boolean(session),
  });

  const activeFilterCount = [encounterType, status, facilityId].filter(Boolean)
    .length;

  const summaryCards = useMemo(() => {
    const items = encountersQuery.data?.items ?? [];
    const openEpisodes = items.filter((item) => item.status === 'OPEN').length;
    const alerts = items.filter((item) => item.activeAlerts.length > 0).length;
    const documents = items.reduce(
      (total, item) => total + item.documentCount,
      0,
    );

    return [
      {
        label: 'Episodios visibles',
        value: String(items.length),
        icon: Stethoscope,
        className: 'bg-sky-50 text-sky-700',
      },
      {
        label: 'Abiertos',
        value: String(openEpisodes),
        icon: Users,
        className: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Con alertas',
        value: String(alerts),
        icon: TriangleAlert,
        className: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Documentos ligados',
        value: String(documents),
        icon: FileText,
        className: 'bg-violet-50 text-violet-700',
      },
    ];
  }, [encountersQuery.data?.items]);

  const encounterTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...((metaQuery.data?.encounterTypes ?? []).map((option) => ({
      value: option.value,
      label: option.label,
    })) as Array<{ value: string; label: string }>),
  ];
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...((metaQuery.data?.encounterStatuses ?? []).map((option) => ({
      value: option.value,
      label: option.label,
    })) as Array<{ value: string; label: string }>),
  ];
  const facilityOptions = [
    { value: '', label: 'Todas las sedes' },
    ...((metaQuery.data?.facilities ?? []).map((facility) => ({
      value: facility.id,
      label: facility.name,
    })) as Array<{ value: string; label: string }>),
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
              Episodios
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Operacion de episodios clinicos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Listado operativo, filtros y acceso rapido a consulta, urgencia,
              hospitalizacion, procedimiento y seguimiento.
            </p>
          </div>
          <Button
            className="gap-1.5 self-start shadow-sm lg:self-auto"
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo episodio
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div className="metric-card flex items-start justify-between p-5" key={card.label}>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-xl p-2 ${card.className}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative max-w-lg flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por folio, paciente, CURP o motivo de atencion..."
                value={search}
              />
            </div>
            <Button
              className="gap-1.5 bg-white"
              onClick={() => setShowFilters((currentValue) => !currentValue)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {activeFilterCount > 0 ? (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              ) : null}
            </Button>
          </div>

          {showFilters ? (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
              <SelectFilter
                label="Tipo"
                onChange={setEncounterType}
                options={encounterTypeOptions}
                value={encounterType}
              />
              <SelectFilter
                label="Estado"
                onChange={setStatus}
                options={statusOptions}
                value={status}
              />
              <SelectFilter
                label="Sede"
                onChange={setFacilityId}
                options={facilityOptions}
                value={facilityId}
              />
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => {
                    setEncounterType('');
                    setStatus('');
                    setFacilityId('');
                  }}
                  type="button"
                  variant="outline"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="clinical-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Folio
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Paciente
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Sede / area
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground xl:table-cell">
                  Responsable
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Apertura
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Alertas
                </th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {encountersQuery.data?.items.length ? (
                encountersQuery.data.items.map((encounter) => {
                  const typeConfig = encounterTypeConfig[encounter.encounterType];
                  const statusConfig =
                    encounterStatusConfig[encounter.status] ??
                    encounterStatusConfig.CLOSED;
                  const TypeIcon = typeConfig?.icon ?? Stethoscope;

                  return (
                    <tr
                      className="cursor-pointer transition-colors hover:bg-muted/20"
                      key={encounter.id}
                      onClick={() =>
                        navigate(`/episodios/${encounter.encounterNumber}`)
                      }
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-mono text-xs font-semibold text-primary">
                            {encounter.encounterNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {admissionSourceLabels[encounter.admissionSource ?? ''] ??
                              'Sin origen'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {encounter.patient.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {encounter.patient.curp ?? 'Sin CURP'} ·{' '}
                              {encounter.patient.ageLabel ?? 'Edad no disponible'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                            typeConfig?.className ??
                            'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <TypeIcon className="h-3.5 w-3.5" />
                          {typeConfig?.label ?? encounter.encounterType}
                        </div>
                      </td>
                      <td className="hidden p-3 lg:table-cell">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {encounter.facility?.name ?? 'Sin sede'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {encounter.serviceArea?.name ??
                              encounter.specialty?.name ??
                              'Sin area clinica'}
                          </p>
                        </div>
                      </td>
                      <td className="hidden p-3 xl:table-cell">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {encounter.attendingClinician?.fullName ??
                              'Sin asignar'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {encounter.diagnosisCount} diagnosticos ·{' '}
                            {encounter.documentCount} documentos
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusConfig.badgeVariant}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="hidden p-3 text-xs text-muted-foreground lg:table-cell">
                        {formatDateTime(encounter.openedAt)}
                      </td>
                      <td className="p-3">
                        {encounter.activeAlerts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {encounter.activeAlerts.slice(0, 2).map((alert) => (
                              <Badge key={`${encounter.id}-${alert}`} variant="alert">
                                {alert}
                              </Badge>
                            ))}
                            {encounter.activeAlerts.length > 2 ? (
                              <Badge variant="secondary">
                                +{encounter.activeAlerts.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sin alertas
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-8 text-center text-sm text-muted-foreground" colSpan={9}>
                    {encountersQuery.isLoading
                      ? 'Cargando episodios...'
                      : 'No se encontraron episodios con los filtros actuales.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateEpisodeModal
        isOpen={isCreateOpen}
        meta={metaQuery.data}
        onClose={() => setIsCreateOpen(false)}
      />
    </AppLayout>
  );
}
