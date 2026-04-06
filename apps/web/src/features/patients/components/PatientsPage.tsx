import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Filter, Phone, Plus, Search, Users } from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useAuth } from '../../auth/hooks/auth-context';
import { fetchPatients } from '../api/patients.service';
import { formatDate } from '../../../shared/lib/formatters';

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { session } = useAuth();

  const patientsQuery = useQuery({
    queryKey: ['patients', search],
    queryFn: () => fetchPatients(session!.accessToken, { page: 1, pageSize: 20, search }),
    enabled: Boolean(session),
  });

  const patients = patientsQuery.data?.items ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Pacientes</h1>
            <p className="mt-1 text-sm text-gray-500">
              {patientsQuery.data?.total ?? 0} pacientes registrados
            </p>
          </div>
          <Button
            className="gap-1.5 shadow-sm"
            onClick={() => navigate('/pacientes/nuevo')}
            size="sm"
            type="button"
          >
            <Plus className="h-4 w-4" /> Nuevo paciente
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-gray-400" />
            <Input
              className="h-9 pl-9 pr-3 text-sm"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o CURP..."
              value={search}
            />
          </div>
          <Button className="gap-1.5  bg-white" size="sm" type="button" variant="outline">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </Button>
        </div>

        <div className="clinical-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Paciente</th>
                <th className="hidden p-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide md:table-cell">CURP</th>
                <th className="hidden p-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide lg:table-cell">Sexo</th>
                <th className="hidden p-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide md:table-cell">Contacto</th>
                <th className="p-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Expediente</th>
                <th className="p-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Identificador</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.length ? patients.map((patient) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  key={patient.id}
                  onClick={() => navigate(`/pacientes/${patient.id}`)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.fullName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(patient.birthDate)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-3 font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded md:table-cell">
                    {patient.curp ?? 'Sin CURP'}
                  </td>
                  <td className="hidden p-3 lg:table-cell">{patient.sexAtBirth}</td>
                  <td className="hidden p-3 md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {patient.phone ?? 'Sin telefono'}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{patient.medicalRecordNumber ?? 'Sin expediente'}</Badge>
                  </td>
                  <td className="p-3">
                    {patient.primaryIdentifier ? (
                      <Badge variant="secondary">{patient.primaryIdentifier}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin identificador</span>
                    )}
                  </td>
                  <td className="p-3">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="p-6 text-sm text-muted-foreground" colSpan={7}>
                    {patientsQuery.isLoading ? 'Cargando pacientes...' : 
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-sm text-gray-500">No hay pacientes registrados</p>
                        <Button
                          size="sm"
                          className="mt-3 gap-1.5"
                          onClick={() => navigate('/pacientes/nuevo')}
                        >
                          <Plus className="h-4 w-4" /> Crear primer paciente
                        </Button>
                      </div>
                    }
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
