import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Filter,
  Phone,
  Plus,
  Search,
  Users,
  Eye
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useAuth } from '../../auth/hooks/auth-context';
import { fetchPatients } from '../api/patients.service';
import { formatDate } from '../../../shared/lib/formatters';

const sexOptions = [
  { value: '', label: 'Todos los sexos' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'INTERSEX', label: 'Intersexual' },
  { value: 'UNKNOWN', label: 'No especificado' },
] as const;

const statusOptions = [
  { value: '', label: 'Todos los estatus' },
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
  { value: 'Fallecido', label: 'Fallecido' },
  { value: 'Bloqueado', label: 'Bloqueado' },
] as const;

const allergiesOptions = [
  { value: '', label: 'Todas las condiciones' },
  { value: 'with_allergies', label: 'Con alergias' },
  { value: 'without_allergies', label: 'Sin alergias' },
] as const;

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
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

export function PatientsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [patientStatus, setPatientStatus] = useState('');
  const [sexAtBirth, setSexAtBirth] = useState('');
  const [allergiesFilter, setAllergiesFilter] = useState('');

  const patientsQuery = useQuery({
    queryKey: ['patients', search, patientStatus, sexAtBirth, allergiesFilter],
    queryFn: () =>
      fetchPatients(session!.accessToken, {
        page: 1,
        pageSize: 20,
        search,
        patientStatus,
        sexAtBirth,
        allergiesFilter,
      }),
    enabled: Boolean(session),
  });

  const patients = patientsQuery.data?.items ?? [];
  const activeFilterCount = [patientStatus, sexAtBirth, allergiesFilter].filter(
    Boolean,
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Pacientes
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {patientsQuery.data?.total ?? 0} pacientes registrados
            </p>
          </div>
          <Button
            className="gap-1.5 self-start shadow-sm sm:self-auto"
            onClick={() => navigate('/pacientes/nuevo')}
            size="sm"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo paciente
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9 pr-3 text-sm"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, CURP o identificador..."
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
                label="Estatus"
                onChange={setPatientStatus}
                options={statusOptions}
                value={patientStatus}
              />
              <SelectFilter
                label="Sexo"
                onChange={setSexAtBirth}
                options={sexOptions}
                value={sexAtBirth}
              />
              <SelectFilter
                label="Alergias"
                onChange={setAllergiesFilter}
                options={allergiesOptions}
                value={allergiesFilter}
              />
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => {
                    setPatientStatus('');
                    setSexAtBirth('');
                    setAllergiesFilter('');
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
                  Paciente
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground md:table-cell">
                  CURP
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Sexo
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Edad
                </th>
                <th className="hidden p-3 text-left font-medium text-muted-foreground md:table-cell">
                  Contacto
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Episodios
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Alergias
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Estatus
                </th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr
                    className="cursor-pointer transition-colors hover:bg-muted/20 transition-all hover:shadow-sm hover:translate-x-[2px]"
                    key={patient.id}
                    onClick={() => navigate(`/pacientes/${patient.id}`)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Users className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(patient.birthDate)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-3 font-mono text-xs text-muted-foreground md:table-cell">
                      {patient.curp ?? 'Sin CURP'}
                    </td>
                    <td className="hidden p-3 lg:table-cell">
                      {patient.sexAtBirth}
                    </td>
                    <td className="hidden p-3 lg:table-cell">
                      {patient.ageLabel ?? 'Sin dato'}
                    </td>
                    <td className="hidden p-3 md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {patient.phone ?? 'Sin telefono'}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{patient.encounterCount}</Badge>
                    </td>
                    <td className="p-3">
                      {patient.allergiesSummary.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.allergiesSummary.slice(0, 2).map((allergy) => (
                            <Badge key={`${patient.id}-${allergy}`} variant="alert">
                              {allergy}
                            </Badge>
                          ))}
                          {patient.allergiesSummary.length > 2 ? (
                            <Badge variant="secondary">
                              +{patient.allergiesSummary.length - 2}
                            </Badge>
                          ) : null}
                        </div>
                      ) : patient.hasKnownAllergies === false ? (
                        <span className="text-xs text-muted-foreground">
                          Sin alergias
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin detallar
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          patient.patientStatus.toLowerCase() === 'activo'
                            ? 'success'
                            : 'secondary'
                        }
                      >
                        {patient.patientStatus}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/pacientes/${patient.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-sm text-muted-foreground" colSpan={9}>
                    {patientsQuery.isLoading ? (
                      'Cargando pacientes...'
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-sm text-gray-500">
                          No hay pacientes que coincidan con los filtros actuales
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={() => {
                              setSearch('');
                              setPatientStatus('');
                              setSexAtBirth('');
                              setAllergiesFilter('');
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Limpiar busqueda
                          </Button>
                          <Button
                            className="gap-1.5"
                            onClick={() => navigate('/pacientes/nuevo')}
                            size="sm"
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                            Nuevo paciente
                          </Button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
