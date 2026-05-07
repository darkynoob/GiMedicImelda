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
                <span
                  className="cursor-pointer text-xs text-muted-foreground"
                  onClick={() => navigator.clipboard.writeText(patient?.id ?? '')}
                  title="Copiar ID completo"
                >
                  ID: {patient?.id?.slice(0, 8)}
                </span>
                <span>•</span>
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

              <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <p>No hay problemas activos registrados</p>
                <Button size="sm" variant="outline">
                  Agregar problema
                </Button>
              </div>
              <div className="py-3 px-5 flex items-center justify-between gap-4">
                <div className="py-3 flex items-start justify-between gap-4 border-l-4 border-red-300 pl-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Hipertensión arterial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Detectado: 12 Mar 2023
                    </p>
                  </div>
                </div>

                <Badge variant="alert">
                  Activo
                </Badge>
              </div>

              <div className="py-3 px-5 flex items-center justify-between gap-4">
                <div className="py-3 flex items-start justify-between gap-4 border-l-4 border-amber-400 pl-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Hipertensión arterial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Detectado: 12 Mar 2023
                    </p>
                  </div>
                </div>

                <Badge variant="warning">
                  En seguimiento
                </Badge>
              </div>

              <div className="py-3 px-5 flex items-center justify-between gap-4">
                <div className="py-3 flex items-start justify-between gap-4 border-l-4 border-emerald-400 pl-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Hipertensión arterial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Detectado: 12 Mar 2023
                    </p>
                  </div>
                </div>

                <Badge variant="success">
                  Controlado
                </Badge>
              </div>

              <div className="py-3 px-5 flex items-center justify-between gap-4">
                <div className="py-3 flex items-start justify-between gap-4 border-l-4 border-gray-300 pl-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Hipertensión arterial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Detectado: 12 Mar 2023
                    </p>
                  </div>
                </div>

                <Badge variant="secondary">
                  Resuelto
                </Badge>
              </div>
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
                          {encounter.status}
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
              <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <p>No hay documentos disponibles</p>
                <Button size="sm" variant="outline">
                  Crear documento
                </Button>
              </div>
              <div className="px-4 py-6 text-sm text-muted-foreground px-4 py-2 text-sm gap-2">
                <div className="divide-y">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Resultado laboratorio.pdf
                      </p>
                      <p className="text-xs text-muted-foreground">
                        12 Mar 2026 · PDF
                      </p>
                    </div>

                    <Button size="icon" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Resultado laboratorio.pdf
                      </p>
                      <p className="text-xs text-muted-foreground">
                        12 Mar 2026 · PDF
                      </p>
                    </div>

                    <Button size="icon" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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

              <div className="px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <p>No hay medicamentos activos registrados</p>
                <Button size="sm" variant="outline">
                  Agregar medicamento
                </Button>
              </div>
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
