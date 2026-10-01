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
  Activity,
  Eye
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../auth/hooks/auth-context';
import { fetchPatientDetail } from '../api/patients.service';
import { formatDateTime, formatDate } from '../../../shared/lib/formatters';
import { PatientEditModal } from './PatientEditModal';

export const SEX_LABELS: Record<string, string> = {
  F: 'Femenino',
  FEMALE: 'Femenino',
  M: 'Masculino',
  MALE: 'Masculino',
}

const calculateAge = (birthDate?: string | Date | null) => {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--
  }

  return age
}

const statusLabels: Record<string, string> = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  PENDING: 'Pendiente',
};

type BadgeVariant = 'alert' | 'warning' | 'success' | 'secondary';

const problemStatusMeta: Record<string, { label: string; badgeVariant: BadgeVariant; borderClass: string }> = {
  ACTIVO: { label: 'Activo', badgeVariant: 'alert', borderClass: 'border-red-300' },
  CONTROLADO: { label: 'Controlado', badgeVariant: 'success', borderClass: 'border-emerald-400' },
  RESUELTO: { label: 'Resuelto', badgeVariant: 'secondary', borderClass: 'border-gray-300' },
};

const getProblemStatusMeta = (status: string | null) =>
  (status ? problemStatusMeta[status] : undefined) ?? {
    label: status ?? 'Sin estado',
    badgeVariant: 'warning' as BadgeVariant,
    borderClass: 'border-amber-400',
  };

const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'Archivo';
};

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
  const age = calculateAge(patient?.birthDate)
  const record = patient?.medicalRecords?.[0]
  const recentAttachments = patient?.attachments.slice(0, 5) ?? []

  const getInitials = (name?: string) =>
                                      name
                                        ?.split(' ')
                                        .map(n => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-primary font-semibold">
                    {getInitials(patient?.fullName) || 'P'}
                  </div>
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
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {SEX_LABELS[patient?.sexAtBirth ?? ''] ?? 'No especificado'} · {' '}
                    {age !== null ? `${age} años` : 'Edad no disponible'}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    Sangre: {patient?.bloodType ?? 'Sin dato'}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    Tipo: {patient?.patientType ?? 'Sin dato'}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    CURP: {patient?.curp ?? 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>
                Actualizado:{' '}
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
                <FolderOpen className="h-3.5 w-3.5" /> Ver expediente
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
              <Phone className="h-4 w-4 text-muted-foreground/80" />
              <div>
                <p className="text-xs">Teléfono: {patient?.phone ?? 'No registrado'}</p>
                {patient?.alternatePhone && (
                  <p className="text-xs text-muted-foreground">
                    Alterno: {patient.alternatePhone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground/80" />
              <span>{patient?.email ?? 'Sin correo'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground/80" />
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
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500 bg-red-50 p-4">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="clinical-card">

              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500/80" />
                  <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                    Problemas activos
                  </h2>
                </div>

                <Button size="sm" variant="ghost">
                  + Agregar
                </Button>
              </div>

              {patient?.problems.length ? (
                <div className="divide-y">
                  {patient.problems.map((problem) => {
                    const meta = getProblemStatusMeta(problem.status);

                    return (
                      <div
                        className="py-3 px-5 flex items-center justify-between gap-4"
                        key={problem.id}
                      >
                        <div
                          className={`py-3 flex items-start justify-between gap-4 border-l-4 ${meta.borderClass} pl-3`}
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {problem.description}
                          </p>
                        </div>

                        <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <p>No hay problemas activos registrados</p>
                  <Button size="sm" variant="outline">
                    Agregar problema
                  </Button>
                </div>
              )}
            </div>

            <div className="clinical-card">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary/80" />
                  <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                    Episodios de atención
                  </h2>
                </div>

                <Button size="sm" variant="ghost">
                  + Nuevo
                </Button>
              </div>
              <div className="divide-y">
                {patient?.recentEncounters.length ? (
                  patient.recentEncounters.map((encounter) => (
                    <div
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
                      key={encounter.id}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {encounter.encounterType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(encounter.openedAt)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {encounter.encounterNumber} · {encounter.facilityName ?? 'Sin sede'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            encounter.status === 'OPEN' ? 'success' : 'secondary'
                          }
                        >
                          {statusLabels[encounter.status] ?? encounter.status}
                        </Badge>

                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <p>No hay episodios de atención</p>
                    <Button size="sm" variant="outline">
                      Crear episodio
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="clinical-card">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground/80" />
                  <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                    Documentos
                  </h2>
                </div>

                <Button size="sm" variant="ghost">
                  + Crear
                </Button>
              </div>
              {recentAttachments.length ? (
                <div className="divide-y">
                  {recentAttachments.map((attachment) => (
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      key={attachment.id}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(attachment.uploadedAt)} ·{' '}
                          {getFileExtension(attachment.fileName)}
                        </p>
                      </div>

                      <Button size="icon" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <p>No hay documentos disponibles</p>
                  <Button size="sm" variant="outline">
                    Crear documento
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="clinical-card">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary/80" />
                  <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                    Medicamentos
                  </h2>
                </div>

                <Button size="sm" variant="ghost">
                  + Agregar
                </Button>
              </div>

              {patient?.clinicalProfile?.currentMedicationsNotes ? (
                <div className="px-4 py-4 text-sm text-gray-700 whitespace-pre-line">
                  {patient.clinicalProfile.currentMedicationsNotes}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <p>No hay medicamentos activos registrados</p>
                  <Button size="sm" variant="outline">
                    Agregar medicamento
                  </Button>
                </div>
              )}
            </div>

            <div className="clinical-card">
              <div className="flex items-center gap-2 border-b p-4">
                <FolderOpen className="h-4 w-4 text-muted-foreground" /> 
                <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                  Expediente clínico
                </h2>
              </div>
              <div className="space-y-5 p-5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Expediente</p>
                  <p className="text-sm font-medium">
                    {record?.recordNumber ?? 'No disponible'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Clínica</p>
                  <p className="text-sm font-medium">
                    {record?.facility?.name ?? 'No asignada'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Unidad médica</p>
                  <p className="text-sm font-medium">
                    {patient?.medicalUnit ?? 'No especificada'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Contacto de emergencia</p>
                  <p className="text-sm font-medium">
                    {patient?.emergencyContactName ?? 'No registrado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient?.emergencyContactRelation ?? 'Sin relación'}
                    {patient?.emergencyContactPhone
                      ? ` · ${patient.emergencyContactPhone}`
                      : ''}
                  </p>
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
