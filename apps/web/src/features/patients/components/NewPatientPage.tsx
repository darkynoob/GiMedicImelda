import { useState, type ComponentType, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgePlus,
  Building2,
  FilePlus2,
  HeartHandshake,
  IdCard,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { CreatePatientRequest } from '../../../shared/types/contracts';
import { useAuth } from '../../auth/hooks/auth-context';
import { createPatient } from '../api/patients.service';

type FormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  sexAtBirth: string;
  birthDate: string;
  ageSnapshot: string;
  maritalStatus: string;
  bloodType: string;
  curp: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  externalCode: string;
  identifierType: string;
  identifierValue: string;
  recordNumber: string;
};

const sexOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'INTERSEX', label: 'Intersexual' },
  { value: 'UNKNOWN', label: 'No especificado' },
];

const maritalStatusOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'SOLTERO', label: 'Soltero(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'UNION_LIBRE', label: 'Union libre' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUDO', label: 'Viudo(a)' },
];

const bloodTypeOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const identifierTypeOptions = [
  { value: '', label: 'Sin identificador' },
  { value: 'NSS', label: 'NSS' },
  { value: 'POLIZA', label: 'Poliza' },
  { value: 'INE', label: 'INE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'LEGADO', label: 'Codigo legado' },
];

const initialFormState: FormState = {
  firstName: '',
  lastName: '',
  middleName: '',
  sexAtBirth: '',
  birthDate: '',
  ageSnapshot: '',
  maritalStatus: '',
  bloodType: '',
  curp: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MX',
  emergencyContactName: '',
  emergencyContactPhone: '',
  externalCode: '',
  identifierType: '',
  identifierValue: '',
  recordNumber: '',
};

function trimToUndefined(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function buildPayload(
  state: FormState,
  facilityId: string | undefined,
): CreatePatientRequest {
  return {
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    middleName: trimToUndefined(state.middleName),
    sexAtBirth: state.sexAtBirth,
    birthDate: trimToUndefined(state.birthDate),
    ageSnapshot: trimToUndefined(state.ageSnapshot)
      ? Number(state.ageSnapshot)
      : undefined,
    maritalStatus: trimToUndefined(state.maritalStatus),
    bloodType: trimToUndefined(state.bloodType),
    curp: trimToUndefined(state.curp),
    phone: trimToUndefined(state.phone),
    email: trimToUndefined(state.email),
    addressLine1: trimToUndefined(state.addressLine1),
    addressLine2: trimToUndefined(state.addressLine2),
    city: trimToUndefined(state.city),
    state: trimToUndefined(state.state),
    postalCode: trimToUndefined(state.postalCode),
    country: trimToUndefined(state.country),
    emergencyContactName: trimToUndefined(state.emergencyContactName),
    emergencyContactPhone: trimToUndefined(state.emergencyContactPhone),
    externalCode: trimToUndefined(state.externalCode),
    identifierType: trimToUndefined(state.identifierType),
    identifierValue: trimToUndefined(state.identifierValue),
    recordNumber: trimToUndefined(state.recordNumber),
    facilityId,
  };
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  helper?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || 'empty'}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  helper,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-clinical-alert"> *</span> : null}
      </span>
      <Input
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </label>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="clinical-card overflow-hidden">
      <div className="border-b bg-muted/20 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function NewPatientPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [clientError, setClientError] = useState<string | null>(null);

  const activeFacility = session?.user.facility ?? null;

  const createPatientMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('La sesion no esta disponible');
      }

      if (!form.firstName.trim() || !form.lastName.trim() || !form.sexAtBirth) {
        throw new Error('Nombre, apellidos y sexo son obligatorios');
      }

      if (!activeFacility?.id) {
        throw new Error('Tu usuario no tiene una sede asignada para abrir el expediente');
      }

      if (Boolean(form.identifierType.trim()) !== Boolean(form.identifierValue.trim())) {
        throw new Error('Captura tipo y valor del identificador principal');
      }

      return createPatient(
        session.accessToken,
        buildPayload(form, activeFacility.id),
      );
    },
    onSuccess: async (patient) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({ queryKey: ['patient-detail', patient.id] }),
      ]);
      navigate(`/pacientes/${patient.id}`);
    },
    onError: (error) => {
      setClientError(error instanceof Error ? error.message : 'No fue posible crear el paciente');
    },
  });

  const isSubmitting = createPatientMutation.isPending;

  const updateField = <K extends keyof FormState,>(field: K, value: FormState[K]) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (clientError) {
      setClientError(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3">
          <button
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/pacientes')}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a pacientes
          </button>

          <div className="clinical-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-slate-700 px-6 py-6 text-primary-foreground">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <Badge className="w-fit gap-1 border-white/20 bg-white/10 text-primary-foreground hover:bg-white/10">
                    <BadgePlus className="h-3.5 w-3.5" />
                    Alta de paciente
                  </Badge>
                  <div>
                    <h1 className="text-2xl font-semibold">Nuevo paciente</h1>
                    <p className="mt-1 max-w-2xl text-sm text-primary-foreground/80">
                      Captura identidad, contacto y datos de expediente en una sola vista.
                      El expediente maestro se abre automaticamente al guardar.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                      Sede activa
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {activeFacility?.name ?? 'Sin sede asignada'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                      Expediente
                    </p>
                    <p className="mt-1 text-sm font-medium">Se genera si no capturas numero</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {clientError ? (
          <div className="rounded-md border border-clinical-alert/20 bg-clinical-alert/5 px-4 py-3 text-sm text-clinical-alert">
            {clientError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setClientError(null);
              createPatientMutation.mutate();
            }}
          >
            <SectionCard
              description="Datos demograficos y de identificacion primaria del paciente."
              icon={UserRound}
              title="Identidad del paciente"
            >
              <TextField
                label="Nombre(s)"
                onChange={(value) => updateField('firstName', value)}
                placeholder="Ana Maria"
                required
                value={form.firstName}
              />
              <TextField
                label="Primer apellido"
                onChange={(value) => updateField('lastName', value)}
                placeholder="Lopez"
                required
                value={form.lastName}
              />
              <TextField
                label="Segundo apellido"
                onChange={(value) => updateField('middleName', value)}
                placeholder="Hernandez"
                value={form.middleName}
              />
              <SelectField
                label="Sexo biologico al nacer"
                onChange={(value) => updateField('sexAtBirth', value)}
                options={sexOptions}
                value={form.sexAtBirth}
              />
              <TextField
                label="Fecha de nacimiento"
                onChange={(value) => updateField('birthDate', value)}
                type="date"
                value={form.birthDate}
              />
              <TextField
                helper="Util cuando no se tiene fecha exacta de nacimiento."
                label="Edad referida"
                onChange={(value) => updateField('ageSnapshot', value)}
                placeholder="35"
                type="number"
                value={form.ageSnapshot}
              />
              <SelectField
                label="Estado civil"
                onChange={(value) => updateField('maritalStatus', value)}
                options={maritalStatusOptions}
                value={form.maritalStatus}
              />
              <SelectField
                label="Tipo sanguineo"
                onChange={(value) => updateField('bloodType', value)}
                options={bloodTypeOptions}
                value={form.bloodType}
              />
              <TextField
                helper="Se normaliza en mayusculas al guardar."
                label="CURP"
                onChange={(value) => updateField('curp', value)}
                placeholder="LOHA890312MDFPRN01"
                value={form.curp}
              />
              <TextField
                helper="Codigo externo o legado del sistema anterior."
                label="Codigo externo"
                onChange={(value) => updateField('externalCode', value)}
                placeholder="LEG-004218"
                value={form.externalCode}
              />
            </SectionCard>

            <SectionCard
              description="Canales para contacto clinico y red de apoyo del paciente."
              icon={HeartHandshake}
              title="Contacto y acompanamiento"
            >
              <TextField
                label="Telefono"
                onChange={(value) => updateField('phone', value)}
                placeholder="5512345678"
                value={form.phone}
              />
              <TextField
                label="Correo electronico"
                onChange={(value) => updateField('email', value)}
                placeholder="paciente@correo.com"
                type="email"
                value={form.email}
              />
              <TextField
                label="Contacto de emergencia"
                onChange={(value) => updateField('emergencyContactName', value)}
                placeholder="Laura Lopez"
                value={form.emergencyContactName}
              />
              <TextField
                label="Telefono de emergencia"
                onChange={(value) => updateField('emergencyContactPhone', value)}
                placeholder="5598765432"
                value={form.emergencyContactPhone}
              />
            </SectionCard>

            <SectionCard
              description="Direccion de referencia para admision, seguimiento o contacto."
              icon={MapPin}
              title="Domicilio"
            >
              <TextField
                label="Direccion principal"
                onChange={(value) => updateField('addressLine1', value)}
                placeholder="Av. Insurgentes Sur 123"
                value={form.addressLine1}
              />
              <TextField
                label="Complemento"
                onChange={(value) => updateField('addressLine2', value)}
                placeholder="Interior 5, Col. Roma"
                value={form.addressLine2}
              />
              <TextField
                label="Ciudad"
                onChange={(value) => updateField('city', value)}
                placeholder="Ciudad de Mexico"
                value={form.city}
              />
              <TextField
                label="Estado"
                onChange={(value) => updateField('state', value)}
                placeholder="CDMX"
                value={form.state}
              />
              <TextField
                label="Codigo postal"
                onChange={(value) => updateField('postalCode', value)}
                placeholder="06700"
                value={form.postalCode}
              />
              <TextField
                label="Pais"
                onChange={(value) => updateField('country', value)}
                placeholder="MX"
                value={form.country}
              />
            </SectionCard>

            <SectionCard
              description="Datos administrativos del expediente e identificador principal."
              icon={FilePlus2}
              title="Expediente e identificadores"
            >
              <TextField
                helper="Si lo dejas vacio, el backend genera uno unico automaticamente."
                label="Numero de expediente"
                onChange={(value) => updateField('recordNumber', value)}
                placeholder="EXP-NOVA-000245"
                value={form.recordNumber}
              />
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Sede de apertura</span>
                <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm">
                  {activeFacility ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{activeFacility.name}</span>
                      <Badge variant="secondary">{activeFacility.code}</Badge>
                    </div>
                  ) : (
                    <span className="text-clinical-alert">
                      Tu usuario no tiene sede asignada.
                    </span>
                  )}
                </div>
              </div>
              <SelectField
                helper="Opcional. Se guarda como identificador principal del paciente."
                label="Tipo de identificador"
                onChange={(value) => updateField('identifierType', value)}
                options={identifierTypeOptions}
                value={form.identifierType}
              />
              <TextField
                helper="Ejemplo: NSS, folio de poliza o identificador legado."
                label="Valor del identificador"
                onChange={(value) => updateField('identifierValue', value)}
                placeholder="NSS-5544-9988"
                value={form.identifierValue}
              />
            </SectionCard>

            <div className="clinical-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Listo para crear el paciente</p>
                <p className="text-xs text-muted-foreground">
                  Se abrira el expediente maestro y te llevaremos al detalle al terminar.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/pacientes')}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar paciente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="clinical-card overflow-hidden">
              <div className="border-b bg-muted/20 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Checklist rapido</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lo minimo para un alta operativa sin retrabajo.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="font-medium">1. Identidad completa</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nombre(s), apellido(s) y sexo son obligatorios.
                  </p>
                </div>
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="font-medium">2. Sede activa</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    El expediente se abre en la sede asociada al usuario actual.
                  </p>
                </div>
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="font-medium">3. Identificador principal</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Es opcional, pero si capturas uno debes llenar tipo y valor.
                  </p>
                </div>
              </div>
            </div>

            <div className="clinical-card overflow-hidden">
              <div className="border-b bg-muted/20 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <IdCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Resumen de captura</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vista previa de los datos mas sensibles del alta.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Paciente
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {[form.firstName, form.lastName, form.middleName]
                      .filter(Boolean)
                      .join(' ') || 'Sin nombre capturado'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.curp || 'Sin CURP'} {form.birthDate ? ` - ${form.birthDate}` : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Contacto</p>
                      <p className="text-xs text-muted-foreground">
                        {form.phone || 'Sin telefono'} {form.emergencyContactPhone ? ` - Emergencia ${form.emergencyContactPhone}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Correo</p>
                      <p className="text-xs text-muted-foreground">
                        {form.email || 'Sin correo electronico'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Ubicacion</p>
                      <p className="text-xs text-muted-foreground">
                        {[form.addressLine1, form.city, form.state]
                          .filter(Boolean)
                          .join(', ') || 'Sin domicilio capturado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
