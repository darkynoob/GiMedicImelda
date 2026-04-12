import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Edit,
  FileText,
  FolderOpen,
  Heart,
  Mail,
  MapPin,
  Phone,
  Pill,
  Users,
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../auth/hooks/auth-context';
import { fetchPatientDetail } from '../api/patients.service';
import { formatDateTime, formatDate } from '../../../shared/lib/formatters';
import { PatientEditModal } from './PatientEditModal';

export function PatientDetailPage() {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                      {patient?.fullName ?? 'Paciente'}
                    </h1>
                    <Badge
                      variant={
                        (patient?.patientStatus ?? 'Activo') === 'Activo'
                          ? 'success'
                          : 'secondary'
                      }
                    >
                      {patient?.patientStatus ?? 'Activo'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {patient?.sexAtBirth ?? 'Sin sexo'} ·{' '}
                      {formatDate(patient?.birthDate ?? null)}
                    </span>
                    <span className="text-xs">
                      {patient?.curp ?? 'Sin CURP'}
                    </span>
                    <span>Tipo: {patient?.patientType ?? 'Sin dato'}</span>
                    <span>Sangre: {patient?.bloodType ?? 'Sin dato'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>ID: {patient?.id}</span>
                <span>•</span>
                <span>
                  Ultima actualizacion:{' '}
                  {patient?.updatedAt
                    ? formatDateTime(patient.updatedAt)
                    : 'Sin dato'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="gap-1.5"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <FolderOpen className="h-3.5 w-3.5" /> Expediente
                </Button>
                <Button
                  className="gap-1.5"
                  onClick={() => setIsEditModalOpen(true)}
                  size="sm"
                  type="button"
                >
                  <Edit className="h-3.5 w-3.5" /> Editar
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>
                  {patient?.phone ?? 'Sin telefono'}
                  {patient?.alternatePhone
                    ? ` · Alt. ${patient.alternatePhone}`
                    : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{patient?.email ?? 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {[
                    [patient?.street, patient?.exteriorNumber]
                      .filter(Boolean)
                      .join(' '),
                    patient?.interiorNumber
                      ? `Int. ${patient.interiorNumber}`
                      : null,
                    patient?.neighborhood,
                    patient?.municipality,
                    patient?.city,
                    patient?.state,
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                    [
                      patient?.addressLine1,
                      patient?.addressLine2,
                      patient?.city,
                      patient?.state,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                    'Sin direccion'}
                </span>
              </div>
            </div>

            {patient?.hasKnownAllergies === true ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Alergias conocidas
                  </p>
                  <p className="mt-1 text-sm text-red-700/80">
                    {patient.allergiesNotes ?? 'Sin detalle capturado'}
                  </p>
                </div>
              </div>
            ) : patient?.hasKnownAllergies === false ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Sin alergias conocidas
                  </p>
                  <p className="mt-1 text-sm text-emerald-700/80">
                    El paciente no reporta alergias.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    Alergias no registradas
                  </p>
                  <p className="mt-1 text-sm text-amber-700/80">
                    No hay informacion sobre alergias del paciente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                  Problemas activos
                </h2>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Sin problemas registrados.
              </div>
            </div>

            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                  Episodios de atencion
                </h2>
              </div>
              <div className="divide-y">
                {patient?.recentEncounters.length ? (
                  patient.recentEncounters.map((encounter) => (
                    <div
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
                      key={encounter.id}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {encounter.encounterType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {encounter.encounterNumber} ·{' '}
                          {formatDateTime(encounter.openedAt)} ·{' '}
                          {encounter.facilityName ?? 'Sin sede'}
                        </p>
                      </div>
                      <Badge
                        variant={
                          encounter.status === 'OPEN' ? 'success' : 'secondary'
                        }
                      >
                        {encounter.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground">
                    Sin episodios registrados.
                  </div>
                )}
              </div>
            </div>

            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                  Documentos recientes
                </h2>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Sin documentos conectados todavia.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                  Medicamentos
                </h2>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Sin medicamentos registrados.
              </div>
            </div>

            <div className="clinical-card">
              <div className="border-b p-4">
                <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                  Informacion del expediente
                </h2>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Expediente</span>
                  <span className="text-xs font-medium">
                    {patient?.medicalRecords[0]?.recordNumber ??
                      'Sin expediente'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Sede</span>
                  <span className="font-medium">
                    {patient?.medicalRecords[0]?.facility?.name ?? 'Sin sede'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    Contacto emergencia
                  </span>
                  <span className="text-right text-xs font-medium">
                    {patient?.emergencyContactName ?? 'Sin contacto'}{' '}
                    {patient?.emergencyContactRelation
                      ? `· ${patient.emergencyContactRelation}`
                      : ''}{' '}
                    {patient?.emergencyContactPhone
                      ? `· ${patient.emergencyContactPhone}`
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Unidad medica</span>
                  <span className="text-right text-xs font-medium">
                    {patient?.medicalUnit ?? 'Sin unidad capturada'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {patient ? (
        <PatientEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          patient={patient}
        />
      ) : null}
    </AppLayout>
  );
}
