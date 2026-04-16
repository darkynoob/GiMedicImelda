import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BadgePlus,
  Building2,
  CheckCircle2,
  FilePlus2,
  HeartHandshake,
  IdCard,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import type { CreatePatientRequest } from '../../../shared/types/contracts';
import { useAuth } from '../../auth/hooks/auth-context';
import { createPatient, fetchPatients } from '../api/patients.service';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const PHONE_REGEX = /^[\d\s\-+()]{7,20}$/;

const MEXICAN_STATES = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de Mexico',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de Mexico',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacan',
  'Morelos',
  'Nayarit',
  'Nuevo Leon',
  'Oaxaca',
  'Puebla',
  'Queretaro',
  'Quintana Roo',
  'San Luis Potosi',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatan',
  'Zacatecas',
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  sexAtBirth: string;
  birthDate: string;
  ageSnapshot: string;
  curp: string;
  patientStatus: string;
  patientType: string;
  medicalUnit: string;
  phone: string;
  alternatePhone: string;
  email: string;
  city: string;
  state: string;
  municipality: string;
  country: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  maritalStatus: string;
  bloodType: string;
  externalCode: string;
  identifierType: string;
  identifierValue: string;
  recordNumber: string;
  allergiesSelection: string;
  allergiesNotes: string;
  occupation: string;
  educationLevel: string;
  religion: string;
  primaryLanguage: string;
  requiresTranslatorSelection: string;
  registrationSource: string;
  administrativeNotes: string;
};

type FormErrors = Partial<Record<keyof FormState | 'birthDateOrAge', string>>;

const sexOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'INTERSEX', label: 'Intersexual' },
  { value: 'UNKNOWN', label: 'No especificado' },
] as const;

const patientStatusOptions = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
  { value: 'Fallecido', label: 'Fallecido' },
  { value: 'Bloqueado', label: 'Bloqueado' },
] as const;

const patientTypeOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'Ambulatorio', label: 'Ambulatorio' },
  { value: 'Hospitalizado', label: 'Hospitalizado' },
  { value: 'Urgencias', label: 'Urgencias' },
  { value: 'Externo', label: 'Externo' },
] as const;

const maritalStatusOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'SOLTERO', label: 'Soltero(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'UNION_LIBRE', label: 'Union libre' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUDO', label: 'Viudo(a)' },
] as const;

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
] as const;

const allergyOptions = [
  { value: '', label: 'Selecciona una opcion' },
  { value: 'yes', label: 'Si' },
  { value: 'no', label: 'No, sin alergias conocidas' },
] as const;

const booleanOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Si' },
] as const;

const educationOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'Ninguna', label: 'Ninguna' },
  { value: 'Primaria', label: 'Primaria' },
  { value: 'Secundaria', label: 'Secundaria' },
  { value: 'Preparatoria', label: 'Preparatoria' },
  { value: 'Licenciatura', label: 'Licenciatura' },
  { value: 'Posgrado', label: 'Posgrado' },
] as const;

const registrationSourceOptions = [
  { value: '', label: 'Sin especificar' },
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Telemedicina', label: 'Telemedicina' },
  { value: 'Referido', label: 'Referido' },
  { value: 'Urgencias', label: 'Urgencias' },
] as const;

const identifierTypeOptions = [
  { value: '', label: 'Sin identificador' },
  { value: 'NSS', label: 'NSS' },
  { value: 'POLIZA', label: 'Poliza' },
  { value: 'INE', label: 'INE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'LEGADO', label: 'Codigo legado' },
] as const;

const initialFormState: FormState = {
  firstName: '',
  lastName: '',
  middleName: '',
  sexAtBirth: '',
  birthDate: '',
  ageSnapshot: '',
  curp: '',
  patientStatus: 'Activo',
  patientType: '',
  medicalUnit: '',
  phone: '',
  alternatePhone: '',
  email: '',
  city: '',
  state: '',
  municipality: '',
  country: 'Mexico',
  street: '',
  exteriorNumber: '',
  interiorNumber: '',
  neighborhood: '',
  postalCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  maritalStatus: '',
  bloodType: '',
  externalCode: '',
  identifierType: '',
  identifierValue: '',
  recordNumber: '',
  allergiesSelection: '',
  allergiesNotes: '',
  occupation: '',
  educationLevel: '',
  religion: '',
  primaryLanguage: 'Español',
  requiresTranslatorSelection: '',
  registrationSource: '',
  administrativeNotes: '',
};

function trimToUndefined(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function normalizeComparableValue(value: string) {
  return value.replace(/\s/g, '').toLowerCase();
}

function parseBooleanSelection(value: string) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function calculateAge(birthDate: string) {
  if (!birthDate) {
    return null;
  }

  const birthMoment = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthMoment.getFullYear();
  const monthDifference = today.getMonth() - birthMoment.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthMoment.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

/**
 * Normalizes the richer intake form into the backend create contract so the
 * screen can grow without leaking UI-only field names into the API layer.
 */
function buildPayload(
  form: FormState,
  calculatedAge: number | null,
  facilityId: string | undefined,
): CreatePatientRequest {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    middleName: trimToUndefined(form.middleName),
    sexAtBirth: form.sexAtBirth,
    birthDate: trimToUndefined(form.birthDate),
    ageSnapshot: form.birthDate
      ? (calculatedAge ?? undefined)
      : trimToUndefined(form.ageSnapshot)
        ? Number(form.ageSnapshot)
        : undefined,
    maritalStatus: trimToUndefined(form.maritalStatus),
    bloodType: trimToUndefined(form.bloodType),
    curp: trimToUndefined(form.curp)?.toUpperCase(),
    phone: trimToUndefined(form.phone),
    alternatePhone: trimToUndefined(form.alternatePhone),
    email: trimToUndefined(form.email),
    city: trimToUndefined(form.city),
    state: trimToUndefined(form.state),
    municipality: trimToUndefined(form.municipality),
    country: trimToUndefined(form.country),
    street: trimToUndefined(form.street),
    exteriorNumber: trimToUndefined(form.exteriorNumber),
    interiorNumber: trimToUndefined(form.interiorNumber),
    neighborhood: trimToUndefined(form.neighborhood),
    postalCode: trimToUndefined(form.postalCode),
    emergencyContactName: trimToUndefined(form.emergencyContactName),
    emergencyContactPhone: trimToUndefined(form.emergencyContactPhone),
    emergencyContactRelation: trimToUndefined(form.emergencyContactRelation),
    patientStatus: form.patientStatus.trim(),
    patientType: form.patientType.trim(),
    medicalUnit: form.medicalUnit.trim(),
    hasKnownAllergies: form.allergiesSelection === 'yes',
    allergiesNotes:
      form.allergiesSelection === 'yes'
        ? trimToUndefined(form.allergiesNotes)
        : undefined,
    occupation: trimToUndefined(form.occupation),
    educationLevel: trimToUndefined(form.educationLevel),
    religion: trimToUndefined(form.religion),
    primaryLanguage: trimToUndefined(form.primaryLanguage),
    requiresTranslator: parseBooleanSelection(form.requiresTranslatorSelection),
    registrationSource: trimToUndefined(form.registrationSource),
    administrativeNotes: trimToUndefined(form.administrativeNotes),
    externalCode: trimToUndefined(form.externalCode),
    identifierType: trimToUndefined(form.identifierType),
    identifierValue: trimToUndefined(form.identifierValue),
    recordNumber: trimToUndefined(form.recordNumber),
    facilityId,
  };
}

/**
 * Mirrors the critical capture rules from Nexus locally to keep the checklist,
 * inline errors and save state aligned before the request reaches Nest.
 */
function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const hasBirthDateOrAge =
    form.birthDate.trim().length > 0 || form.ageSnapshot.trim().length > 0;

  if (!form.firstName.trim()) errors.firstName = 'Obligatorio';
  if (!form.lastName.trim()) errors.lastName = 'Obligatorio';
  if (!form.sexAtBirth) errors.sexAtBirth = 'Obligatorio';
  if (!hasBirthDateOrAge) {
    errors.birthDateOrAge = 'Captura fecha de nacimiento o edad referida';
  }
  if (!form.patientStatus.trim()) errors.patientStatus = 'Obligatorio';
  if (!form.patientType.trim()) errors.patientType = 'Obligatorio';
  if (!form.medicalUnit.trim()) errors.medicalUnit = 'Obligatorio';

  if (!form.phone.trim()) {
    errors.phone = 'Obligatorio';
  } else if (!PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = 'Formato invalido';
  }

  if (
    form.alternatePhone.trim() &&
    !PHONE_REGEX.test(form.alternatePhone.trim())
  ) {
    errors.alternatePhone = 'Formato invalido';
  }

  if (!form.city.trim()) errors.city = 'Obligatorio';
  if (!form.state.trim()) errors.state = 'Obligatorio';
  if (!form.allergiesSelection) errors.allergiesSelection = 'Obligatorio';

  if (form.allergiesSelection === 'yes' && !form.allergiesNotes.trim()) {
    errors.allergiesNotes = 'Especifica las alergias conocidas';
  }

  if (form.curp.trim() && !CURP_REGEX.test(form.curp.trim().toUpperCase())) {
    errors.curp = 'Formato CURP invalido';
  }

  if (
    form.emergencyContactPhone.trim() &&
    !PHONE_REGEX.test(form.emergencyContactPhone.trim())
  ) {
    errors.emergencyContactPhone = 'Formato invalido';
  }

  if (
    Boolean(form.identifierType.trim()) !== Boolean(form.identifierValue.trim())
  ) {
    errors.identifierValue = 'Captura tipo y valor del identificador';
  }

  return errors;
}

function formatPatientName(form: FormState) {
  return [form.firstName, form.lastName, form.middleName]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function buildAddressPreview(form: FormState) {
  return [
    [form.street, form.exteriorNumber].filter(Boolean).join(' ').trim(),
    form.neighborhood,
    form.municipality,
    form.city,
    form.state,
  ]
    .filter(Boolean)
    .join(', ');
}

function getCompletionPercentage(form: FormState) {
  const optionalFields = [
    form.middleName,
    form.curp,
    form.email,
    form.alternatePhone,
    form.emergencyContactName,
    form.emergencyContactPhone,
    form.emergencyContactRelation,
    form.maritalStatus,
    form.bloodType,
    form.street,
    form.exteriorNumber,
    form.interiorNumber,
    form.neighborhood,
    form.postalCode,
    form.municipality,
    form.externalCode,
    form.identifierType,
    form.identifierValue,
    form.recordNumber,
    form.occupation,
    form.educationLevel,
    form.religion,
    form.primaryLanguage,
    form.requiresTranslatorSelection,
    form.registrationSource,
    form.administrativeNotes,
  ];

  const filledCount = optionalFields.filter(
    (value) => value.trim().length > 0,
  ).length;

  return Math.round((filledCount / optionalFields.length) * 100);
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  helper?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-clinical-alert-foreground"> *</span> : null}
      </span>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option
            key={`${label}-${option.value || 'empty'}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-clinical-alert-foreground">{error}</p> : null}
      {!error && helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
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
  error,
  maxLength,
  onBlur,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  helper?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-clinical-alert-foreground"> *</span> : null}
      </span>
      <Input
        disabled={disabled}
        maxLength={maxLength}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <p className="text-xs text-clinical-alert-foreground">{error}</p> : null}
      {!error && helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-clinical-alert-foreground"> *</span> : null}
      </span>
      <Textarea
        className="min-h-[88px]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? <p className="text-xs text-clinical-alert-foreground">{error}</p> : null}
      {!error && helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </label>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  contentClassName = 'grid grid-cols-1 gap-4 p-5 md:grid-cols-2',
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
  contentClassName?: string;
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
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function ChecklistItem({
  label,
  description,
  ready,
}: {
  label: string;
  description: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        {ready ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <div className="h-4 w-4 rounded-full border border-muted-foreground/40" />
        )}
        <p className="font-medium">{label}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function NewPatientPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const activeFacility = session?.user.facility ?? null;
  const calculatedAge = useMemo(
    () => calculateAge(form.birthDate),
    [form.birthDate],
  );
  const formErrors = useMemo(() => validateForm(form), [form]);
  const isValid = Object.keys(formErrors).length === 0;
  const completionPercentage = useMemo(
    () => getCompletionPercentage(form),
    [form],
  );
  const patientNamePreview = useMemo(() => formatPatientName(form), [form]);
  const addressPreview = useMemo(() => buildAddressPreview(form), [form]);

  useEffect(() => {
    if (!form.medicalUnit.trim() && activeFacility?.name) {
      setForm((currentForm) => ({
        ...currentForm,
        medicalUnit: activeFacility.name,
      }));
    }
  }, [activeFacility?.name, form.medicalUnit]);

  const createPatientMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('La sesion no esta disponible');
      }

      if (!activeFacility?.id) {
        throw new Error(
          'Tu usuario no tiene una sede asignada para abrir el expediente',
        );
      }

      if (!isValid) {
        throw new Error('Completa los campos obligatorios antes de guardar');
      }

      return createPatient(
        session.accessToken,
        buildPayload(form, calculatedAge, activeFacility.id),
      );
    },
    onSuccess: async (patient) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({
          queryKey: ['patient-detail', patient.id],
        }),
      ]);
      navigate(`/pacientes/${patient.id}`);
    },
    onError: (error) => {
      setClientError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear el paciente',
      );
    },
  });

  const isSubmitting = createPatientMutation.isPending;

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));

    if (clientError) {
      setClientError(null);
    }
  };

  /**
   * Duplicate detection reuses the real patients search so admission staff gets
   * a warning based on persisted data instead of static mocks.
   */
  const checkDuplicate = async (field: 'curp' | 'phone', value: string) => {
    const trimmedValue = value.trim();

    if (!session || !trimmedValue) {
      setDuplicateWarning(null);
      return;
    }

    setIsCheckingDuplicate(true);

    try {
      const searchValue =
        field === 'phone'
          ? trimmedValue.replace(/[^\d]/g, '') || trimmedValue
          : trimmedValue;

      const result = await fetchPatients(session.accessToken, {
        page: 1,
        pageSize: 5,
        search: searchValue,
      });

      const normalizedValue = normalizeComparableValue(trimmedValue);
      const match = result.items.find((patient) => {
        const comparableValue =
          field === 'curp' ? (patient.curp ?? '') : (patient.phone ?? '');

        return normalizeComparableValue(comparableValue) === normalizedValue;
      });

      setDuplicateWarning(
        match
          ? `Posible duplicado: ${match.fullName} (${match.curp ?? 'sin CURP'})`
          : null,
      );
    } catch {
      setDuplicateWarning(null);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const checklistItems = [
    {
      label: 'Nombre completo',
      description: 'Nombre(s) y primer apellido deben quedar capturados.',
      ready: Boolean(form.firstName.trim() && form.lastName.trim()),
    },
    {
      label: 'Sexo biologico',
      description: 'Se requiere para expediente y seguridad clinica.',
      ready: Boolean(form.sexAtBirth),
    },
    {
      label: 'Nacimiento o edad',
      description:
        'Acepta fecha exacta o edad referida cuando no se conoce la fecha.',
      ready: Boolean(form.birthDate.trim() || form.ageSnapshot.trim()),
    },
    {
      label: 'Estatus y tipo',
      description: 'Alta administrativa alineada al flujo de Nexus.',
      ready: Boolean(form.patientStatus.trim() && form.patientType.trim()),
    },
    {
      label: 'Unidad medica',
      description: 'Se prellena desde la sede activa, pero puedes ajustarla.',
      ready: Boolean(form.medicalUnit.trim()),
    },
    {
      label: 'Telefono principal',
      description: 'Debe ser valido y utilizable para contacto operativo.',
      ready: Boolean(form.phone.trim() && !formErrors.phone),
    },
    {
      label: 'Domicilio minimo',
      description:
        'Ciudad y estado son lo minimo para una admision consistente.',
      ready: Boolean(form.city.trim() && form.state.trim()),
    },
    {
      label: 'Alergias',
      description: 'Explicitas si existen o si se niegan al ingreso.',
      ready: Boolean(
        form.allergiesSelection &&
        (form.allergiesSelection === 'no' || form.allergiesNotes.trim()),
      ),
    },
    {
      label: 'Identificador principal',
      description: 'Opcional, pero si lo capturas debe quedar completo.',
      ready:
        !form.identifierType.trim() && !form.identifierValue.trim()
          ? true
          : Boolean(
              form.identifierType.trim() &&
              form.identifierValue.trim() &&
              !formErrors.identifierValue,
            ),
    },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
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
                    <h1 className="text-2xl font-semibold">
                      Nuevo paciente - alta enriquecida
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-primary-foreground/80">
                      Conserva el diseno actual de gi medic, pero ahora captura
                      la estructura operativa de Nexus: identidad, contacto,
                      domicilio, seguridad clinica y datos administrativos en
                      una sola vista.
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
                      Perfil opcional
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {completionPercentage}% completo
                    </p>
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setClientError(null);
              createPatientMutation.mutate();
            }}
          >
            <SectionCard
              description="Replica la estructura de identidad del alta rapida de Nexus, pero usando el shell actual de gi medic."
              icon={UserRound}
              title="Identidad del paciente"
            >
              <TextField
                error={formErrors.firstName}
                label="Nombre(s)"
                onChange={(value) => updateField('firstName', value)}
                placeholder="Ana Maria"
                required
                value={form.firstName}
              />
              <TextField
                error={formErrors.lastName}
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
                error={formErrors.sexAtBirth}
                label="Sexo biologico al nacer"
                onChange={(value) => updateField('sexAtBirth', value)}
                options={sexOptions}
                required
                value={form.sexAtBirth}
              />
              <TextField
                helper={
                  calculatedAge !== null
                    ? `Edad calculada: ${calculatedAge} anos`
                    : 'Captura la fecha si se conoce con precision.'
                }
                label="Fecha de nacimiento"
                onChange={(value) => updateField('birthDate', value)}
                type="date"
                value={form.birthDate}
              />
              <TextField
                disabled={Boolean(form.birthDate.trim())}
                error={formErrors.birthDateOrAge}
                helper={
                  form.birthDate.trim()
                    ? 'Se calcula automaticamente cuando ya hay fecha.'
                    : 'Usala cuando no se conoce la fecha exacta.'
                }
                label="Edad referida"
                onChange={(value) => updateField('ageSnapshot', value)}
                placeholder="35"
                type="number"
                value={
                  form.birthDate.trim()
                    ? String(calculatedAge ?? '')
                    : form.ageSnapshot
                }
              />
              <SelectField
                error={formErrors.patientStatus}
                label="Estatus del paciente"
                onChange={(value) => updateField('patientStatus', value)}
                options={patientStatusOptions}
                required
                value={form.patientStatus}
              />
              <SelectField
                error={formErrors.patientType}
                label="Tipo de paciente"
                onChange={(value) => updateField('patientType', value)}
                options={patientTypeOptions}
                required
                value={form.patientType}
              />
              <TextField
                error={formErrors.medicalUnit}
                helper="La apertura del expediente sigue usando tu sede activa."
                label="Unidad medica"
                onChange={(value) => updateField('medicalUnit', value)}
                placeholder="Hospital Nova"
                required
                value={form.medicalUnit}
              />
              <TextField
                error={formErrors.curp}
                helper="Se valida formato y se consulta posible duplicado al salir del campo."
                label="CURP"
                maxLength={18}
                onBlur={() => void checkDuplicate('curp', form.curp)}
                onChange={(value) => updateField('curp', value.toUpperCase())}
                placeholder="LOHA890312MDFPRN01"
                value={form.curp}
              />
              <TextField
                helper="Codigo legado o referencia externa del sistema previo."
                label="Codigo externo"
                onChange={(value) => updateField('externalCode', value)}
                placeholder="LEG-004218"
                value={form.externalCode}
              />
            </SectionCard>

            <SectionCard
              description="Canales para comunicacion y acompanamiento inmediato del paciente."
              icon={HeartHandshake}
              title="Contacto y acompanamiento"
            >
              <TextField
                error={formErrors.phone}
                label="Telefono principal"
                onBlur={() => void checkDuplicate('phone', form.phone)}
                onChange={(value) => updateField('phone', value)}
                placeholder="55 1234 5678"
                required
                value={form.phone}
              />
              <TextField
                error={formErrors.alternatePhone}
                label="Telefono alterno"
                onChange={(value) => updateField('alternatePhone', value)}
                placeholder="55 8765 4321"
                value={form.alternatePhone}
              />
              <TextField
                label="Correo electronico"
                onChange={(value) => updateField('email', value)}
                placeholder="paciente@correo.com"
                type="email"
                value={form.email}
              />
              <div className="hidden md:block" />
              <TextField
                label="Contacto de emergencia"
                onChange={(value) => updateField('emergencyContactName', value)}
                placeholder="Laura Lopez"
                value={form.emergencyContactName}
              />
              <TextField
                label="Parentesco"
                onChange={(value) =>
                  updateField('emergencyContactRelation', value)
                }
                placeholder="Madre, esposo, hermano"
                value={form.emergencyContactRelation}
              />
              <TextField
                error={formErrors.emergencyContactPhone}
                label="Telefono de emergencia"
                onChange={(value) =>
                  updateField('emergencyContactPhone', value)
                }
                placeholder="55 9876 5432"
                value={form.emergencyContactPhone}
              />
            </SectionCard>

            <SectionCard
              description="Domicilio minimo y direccion estructurada para admision y seguimiento."
              icon={MapPin}
              title="Domicilio"
            >
              <TextField
                error={formErrors.city}
                label="Ciudad / localidad"
                onChange={(value) => updateField('city', value)}
                placeholder="Ciudad de Mexico"
                required
                value={form.city}
              />
              <SelectField
                error={formErrors.state}
                label="Estado"
                onChange={(value) => updateField('state', value)}
                options={[
                  { value: '', label: 'Selecciona un estado' },
                  ...MEXICAN_STATES.map((state) => ({
                    value: state,
                    label: state,
                  })),
                ]}
                required
                value={form.state}
              />
              <TextField
                label="Pais"
                onChange={(value) => updateField('country', value)}
                placeholder="Mexico"
                value={form.country}
              />
              <TextField
                label="Municipio / alcaldia"
                onChange={(value) => updateField('municipality', value)}
                placeholder="Benito Juarez"
                value={form.municipality}
              />
              <TextField
                label="Colonia"
                onChange={(value) => updateField('neighborhood', value)}
                placeholder="Del Valle"
                value={form.neighborhood}
              />
              <TextField
                label="Codigo postal"
                onChange={(value) => updateField('postalCode', value)}
                placeholder="03100"
                value={form.postalCode}
              />
              <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_140px_140px]">
                <TextField
                  label="Calle"
                  onChange={(value) => updateField('street', value)}
                  placeholder="Insurgentes Sur"
                  value={form.street}
                />
                <TextField
                  label="No. exterior"
                  onChange={(value) => updateField('exteriorNumber', value)}
                  placeholder="123"
                  value={form.exteriorNumber}
                />
                <TextField
                  label="No. interior"
                  onChange={(value) => updateField('interiorNumber', value)}
                  placeholder="5B"
                  value={form.interiorNumber}
                />
              </div>
            </SectionCard>
            <SectionCard
              description="El flujo de Nexus exige dejar claro si existen alergias al momento del alta."
              icon={ShieldAlert}
              title="Seguridad clinica"
            >
              <SelectField
                error={formErrors.allergiesSelection}
                label="Tiene alergias conocidas"
                onChange={(value) => updateField('allergiesSelection', value)}
                options={allergyOptions}
                required
                value={form.allergiesSelection}
              />
              {form.allergiesSelection === 'yes' ? (
                <TextAreaField
                  error={formErrors.allergiesNotes}
                  label="Alergias conocidas"
                  onChange={(value) => updateField('allergiesNotes', value)}
                  placeholder="Ej: Penicilina (anafilaxia), ibuprofeno (urticaria)"
                  required
                  value={form.allergiesNotes}
                />
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {form.allergiesSelection === 'no'
                    ? 'Se guardara de forma explicita que el paciente no reporta alergias conocidas.'
                    : 'Selecciona si existen alergias para completar el checklist.'}
                </div>
              )}
            </SectionCard>

            <SectionCard
              description="Datos administrativos y sociales que Nexus deja listos desde el registro inicial."
              icon={Building2}
              title="Datos adicionales"
            >
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
                label="Ocupacion"
                onChange={(value) => updateField('occupation', value)}
                placeholder="Contadora"
                value={form.occupation}
              />
              <SelectField
                label="Escolaridad"
                onChange={(value) => updateField('educationLevel', value)}
                options={educationOptions}
                value={form.educationLevel}
              />
              <TextField
                label="Religion"
                onChange={(value) => updateField('religion', value)}
                placeholder="Sin especificar"
                value={form.religion}
              />
              <TextField
                label="Lengua principal"
                onChange={(value) => updateField('primaryLanguage', value)}
                placeholder="Español"
                value={form.primaryLanguage}
              />
              <SelectField
                label="Requiere traductor"
                onChange={(value) =>
                  updateField('requiresTranslatorSelection', value)
                }
                options={booleanOptions}
                value={form.requiresTranslatorSelection}
              />
              <SelectField
                label="Fuente de registro"
                onChange={(value) => updateField('registrationSource', value)}
                options={registrationSourceOptions}
                value={form.registrationSource}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Observaciones administrativas"
                  onChange={(value) =>
                    updateField('administrativeNotes', value)
                  }
                  placeholder="Notas internas de recepcion o admision..."
                  value={form.administrativeNotes}
                />
              </div>
            </SectionCard>

            <SectionCard
              description="Se conserva el flujo actual de expediente e identificador principal de gi medic."
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
                <span className="text-sm font-medium text-foreground">
                  Sede de apertura
                </span>
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
                error={formErrors.identifierValue}
                helper="Ejemplo: NSS, folio de poliza o identificador legado."
                label="Valor del identificador"
                onChange={(value) => updateField('identifierValue', value)}
                placeholder="NSS-5544-9988"
                value={form.identifierValue}
              />
            </SectionCard>

            <div className="clinical-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isValid
                    ? 'Listo para guardar'
                    : 'Completa los campos obligatorios'}
                </p>
                <p className="text-xs text-muted-foreground">
                  El expediente maestro se abrira en la sede activa y luego te
                  llevaremos al detalle del paciente.
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
                <Button disabled={isSubmitting || !isValid} type="submit">
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
                      Conserva el checklist actual, ahora con la estructura
                      completa de alta.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-5 text-sm">
                {checklistItems.map((item) => (
                  <ChecklistItem
                    description={item.description}
                    key={item.label}
                    label={item.label}
                    ready={item.ready}
                  />
                ))}
              </div>
            </div>

            <div className="clinical-card overflow-hidden">
              <div className="border-b bg-muted/20 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <IdCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">
                      Resumen de captura
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vista previa del alta antes de persistirla.
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
                    {patientNamePreview || 'Sin nombre capturado'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.patientStatus || 'Sin estatus'}{' '}
                    {form.patientType ? `· ${form.patientType}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.curp || 'Sin CURP'}{' '}
                    {form.birthDate ? `· ${form.birthDate}` : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Contacto</p>
                      <p className="text-xs text-muted-foreground">
                        {form.phone || 'Sin telefono'}
                        {form.alternatePhone
                          ? ` · Alt. ${form.alternatePhone}`
                          : ''}
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
                      <p className="font-medium">Domicilio</p>
                      <p className="text-xs text-muted-foreground">
                        {addressPreview || 'Sin domicilio estructurado'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border bg-background px-3 py-3">
                  <p className="font-medium">Seguridad clinica</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.allergiesSelection === 'yes'
                      ? form.allergiesNotes || 'Alergias pendientes de detalle'
                      : form.allergiesSelection === 'no'
                        ? 'Sin alergias conocidas'
                        : 'Sin definir'}
                  </p>
                </div>

                <div className="rounded-md border bg-background px-3 py-3">
                  <p className="font-medium">Expediente</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.recordNumber ||
                      'Se generara automaticamente al guardar'}
                  </p>
                </div>
              </div>
            </div>

            {completionPercentage < 100 ? (
              <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Perfil {completionPercentage}% completo. Puedes terminar los
                  datos opcionales mas adelante desde el perfil del paciente.
                </span>
              </div>
            ) : null}

            {duplicateWarning ? (
              <div className="flex items-start gap-2 rounded-md border border-clinical-alert/20 bg-clinical-alert/5 p-3 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clinical-alert" />
                <div>
                  <p className="font-medium text-clinical-alert">
                    Posible duplicado
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {duplicateWarning}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Revisa si se trata del mismo paciente antes de continuar.
                  </p>
                </div>
              </div>
            ) : null}

            {isCheckingDuplicate ? (
              <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                Buscando posibles duplicados...
              </div>
            ) : null}

            <div className="rounded-md border bg-background px-4 py-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  La unidad medica de captura puede diferir de la sede donde se
                  abre el expediente. El alta sigue usando la sede activa del
                  usuario autenticado.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
