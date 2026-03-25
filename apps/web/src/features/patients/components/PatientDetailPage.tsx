import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Calendar, Edit, FileText, FolderOpen, Heart, Mail, MapPin, Phone, Pill, Users } from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../auth/hooks/auth-context';
import { fetchPatientDetail } from '../api/patients.service';
import { formatDateTime, formatDate } from '../../../shared/lib/formatters';

export function PatientDetailPage() {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  const patientQuery = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: () => fetchPatientDetail(session!.accessToken, patientId),
    enabled: Boolean(session && patientId),
  });

  const patient = patientQuery.data;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <button
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/pacientes')}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a pacientes
          </button>

          <div className="clinical-card p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold">{patient?.fullName ?? 'Paciente'}</h1>
                    <Badge variant="success">Activo</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {patient?.sexAtBirth ?? 'Sin sexo'} · {formatDate(patient?.birthDate ?? null)}
                    </span>
                    <span className="font-mono text-xs">{patient?.curp ?? 'Sin CURP'}</span>
                    <span>Tipo: {patient?.bloodType ?? 'Sin dato'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="gap-1.5" size="sm" type="button" variant="outline">
                  <FolderOpen className="h-3.5 w-3.5" /> Expediente
                </Button>
                <Button className="gap-1.5" size="sm" type="button">
                  <Edit className="h-3.5 w-3.5" /> Editar
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient?.phone ?? 'Sin telefono'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{patient?.email ?? 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {[patient?.addressLine1, patient?.addressLine2, patient?.city, patient?.state]
                    .filter(Boolean)
                    .join(', ') || 'Sin direccion'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-md border border-clinical-alert/20 bg-clinical-alert/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-clinical-alert" />
              <div>
                <p className="text-sm font-medium text-clinical-alert">Alergias conocidas</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="alert">Sin datos</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Problemas activos</h2>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground">Sin problemas registrados.</div>
            </div>

            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Episodios de atencion</h2>
              </div>
              <div className="divide-y">
                {patient?.recentEncounters.length ? patient.recentEncounters.map((encounter) => (
                  <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/20" key={encounter.id}>
                    <div>
                      <p className="text-sm font-medium">{encounter.encounterType}</p>
                      <p className="text-xs text-muted-foreground">
                        {encounter.encounterNumber} · {formatDateTime(encounter.openedAt)} · {encounter.facilityName ?? 'Sin sede'}
                      </p>
                    </div>
                    <Badge variant={encounter.status === 'OPEN' ? 'success' : 'secondary'}>{encounter.status}</Badge>
                  </div>
                )) : <div className="px-4 py-6 text-sm text-muted-foreground">Sin episodios registrados.</div>}
              </div>
            </div>

            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Documentos recientes</h2>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground">Sin documentos conectados todavia.</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Medicamentos</h2>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground">Sin medicamentos registrados.</div>
            </div>

            <div className="clinical-card">
              <div className="border-b p-4">
                <h2 className="text-sm font-semibold">Informacion del expediente</h2>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Expediente</span>
                  <span className="font-mono text-xs font-medium">
                    {patient?.medicalRecords[0]?.recordNumber ?? 'Sin expediente'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Sede</span>
                  <span className="font-medium">
                    {patient?.medicalRecords[0]?.facility?.name ?? 'Sin sede'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Contacto emergencia</span>
                  <span className="text-right text-xs font-medium">
                    {patient?.emergencyContactName ?? 'Sin contacto'} {patient?.emergencyContactPhone ? `· ${patient.emergencyContactPhone}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
