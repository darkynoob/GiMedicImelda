import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Stethoscope,
  Activity,
  Pill,
  Siren,
  FilePlus,
  ClipboardList,
  MessagesSquare,
  FileCheck,
  Hospital,
  Scissors,
  HeartPulse,
  ClipboardCheck
} from 'lucide-react';

export type EpisodeFieldOption = {
  value: string;
  label: string;
};

export type EpisodeFieldDefinition = {
  key: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'datetime-local'
    | 'time'
    | 'number'
    | 'checkbox'
    | 'date'
    | 'string-array'
    | 'object-array'
    | 'readonly'
    | 'action'
    | 'subtitle';
  placeholder?: string;
  options?: EpisodeFieldOption[];
  inheritanceMode?: 'carry_forward' | 'fresh_capture' | 'system';
  itemFields?: EpisodeFieldDefinition[];
  itemAddLabel?: string;
  itemRemoveLabel?: string;
  disableItemRemoval?: boolean;
  actionLabel?: string;
  required?: boolean;
  visibleWhen?: {
    fieldKey: string;
    values: string[];
  };
};

export function isPresentationField(field: EpisodeFieldDefinition) {
  return field.type === 'subtitle';
}

export type EpisodeSectionDefinition = {
  key: string;
  title: string;
  description?: string;
  historyVisibility?: 'all' | 'initial_only' | 'subsequent_only';
  fields: EpisodeFieldDefinition[];
};

export type EpisodeTabDefinition = {
  key: string;
  title: string;
  icon: LucideIcon;
  description: string;
  sections: EpisodeSectionDefinition[];
};

type ClinicalMeasurementPresentation = {
  label: string;
  unit?: string;
};

const buildClinicalMeasurementLabel = (
  presentation: ClinicalMeasurementPresentation,
) =>
  presentation.unit
    ? `${presentation.label} (${presentation.unit})`
    : presentation.label;

const emergencyEvolutionObjectiveVitalSignPresentation = {
  taSistolicaEvolUrg: { label: 'TA sistólica', unit: 'mmHg' },
  taDiastolicaEvolUrg: { label: 'TA diastólica', unit: 'mmHg' },
  fcEvolUrg: { label: 'FC', unit: 'lpm' },
  frEvolUrg: { label: 'FR', unit: 'rpm' },
  spo2EvolUrg: { label: 'SpO₂', unit: '%' },
  tempEvolUrg: { label: 'Temperatura', unit: '°C' },
  evaEvolUrg: { label: 'EVA dolor', unit: '0–10' },
  glucosaEvolUrg: { label: 'Glucosa', unit: 'mg/dL' },
  glasgowEvolUrg: { label: 'Glasgow' },
} satisfies Record<string, ClinicalMeasurementPresentation>;

type EmergencyEvolutionObjectiveVitalSignKey =
  keyof typeof emergencyEvolutionObjectiveVitalSignPresentation;

const buildEmergencyEvolutionObjectiveVitalSignField = (
  key: EmergencyEvolutionObjectiveVitalSignKey,
): EpisodeFieldDefinition => ({
  key,
  label: buildClinicalMeasurementLabel(
    emergencyEvolutionObjectiveVitalSignPresentation[key],
  ),
  type: 'number',
});

export function getConsultationHistoryNoteTypeLabel(
  versionNumber: number | null | undefined,
) {
  return versionNumber === 1
    ? 'Historia clínica inicial'
    : 'Nota subsecuente de consulta';
}

const yesNoUnknownOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'SI', label: 'Si' },
  { value: 'NO', label: 'No' },
  { value: 'PARCIAL', label: 'Parcial' },
];

const yesNoOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
];

const priorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const hospitalShiftOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'MATUTINO', label: 'Matutino' },
  { value: 'VESPERTINO', label: 'Vespertino' },
  { value: 'NOCTURNO', label: 'Nocturno' },
];

const hospitalEvolutionClinicalStatusOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'MEJORANDO', label: 'Mejorando' },
  { value: 'SIN_CAMBIOS', label: 'Sin cambios' },
  { value: 'EMPEORANDO', label: 'Empeorando' },
  { value: 'CRITICO', label: 'Crítico' },
  { value: 'ESTABLE', label: 'Estable' },
];

const hospitalDischargeTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ALTA_MEDICA', label: 'Alta médica' },
  { value: 'ALTA_VOLUNTARIA', label: 'Alta voluntaria' },
  { value: 'TRASLADO', label: 'Traslado' },
  { value: 'REFERENCIA', label: 'Referencia' },
  { value: 'DEFUNCION', label: 'Defunción' },
  { value: 'FUGA_ABANDONO', label: 'Fuga / abandono' },
];

const hospitalDischargeTransferTypeValues = ['TRASLADO', 'REFERENCIA'];
const hospitalDischargeDestinationVisibleValues = [
  'ALTA_MEDICA',
  'ALTA_VOLUNTARIA',
  ...hospitalDischargeTransferTypeValues,
];
const hospitalDischargeVoluntaryVisible = {
  fieldKey: 'tipoEgresoHosp',
  values: ['ALTA_VOLUNTARIA'],
};
const hospitalDischargeTransferVisible = {
  fieldKey: 'tipoEgresoHosp',
  values: hospitalDischargeTransferTypeValues,
};
const hospitalDischargeDeathVisible = {
  fieldKey: 'tipoEgresoHosp',
  values: ['DEFUNCION'],
};
const hospitalDischargeAbandonmentVisible = {
  fieldKey: 'tipoEgresoHosp',
  values: ['FUGA_ABANDONO'],
};
const hospitalTransportMethodOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'AMBULANCIA_BASICA', label: 'Ambulancia básica' },
  { value: 'AMBULANCIA_AVANZADA', label: 'Ambulancia avanzada' },
  { value: 'TRANSPORTE_INSTITUCIONAL', label: 'Transporte institucional' },
  { value: 'TRANSPORTE_PARTICULAR', label: 'Transporte particular' },
  { value: 'OTRO', label: 'Otro' },
];
const hospitalConformitySignerOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'PACIENTE', label: 'Paciente' },
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'TUTOR_LEGAL', label: 'Tutor legal' },
];
const hospitalConformityConfirmationOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'FIRMADA', label: 'Firmada / confirmada' },
  { value: 'NO_FIRMA', label: 'No firma, se deja constancia' },
];

const triagePriorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: '1', label: '1 - Reanimación' },
  { value: '2', label: '2 - Emergente' },
  { value: '3', label: '3 - Urgente' },
  { value: '4', label: '4 - Menos urgente' },
  { value: '5', label: '5 - No urgente' },
];

const triageCategoryOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'TRAUMA', label: 'Trauma' },
  { value: 'CARDIORESPIRATORIO', label: 'Cardiorrespiratorio' },
  { value: 'NEUROLOGICO', label: 'Neurológico' },
  { value: 'GASTROINTESTINAL', label: 'Gastrointestinal' },
  { value: 'INFECCIOSO', label: 'Infeccioso' },
  { value: 'GINECO_OBSTETRICO', label: 'Gineco-obstétrico' },
  { value: 'PEDIATRICO', label: 'Pediátrico' },
  { value: 'OTRO', label: 'Otro' },
];

export const triageClinicalDiscriminatorFields = [
  { key: 'discDolorToracico', label: 'Dolor torácico' },
  { key: 'discDisneaSevera', label: 'Disnea severa' },
  { key: 'discEstadoMentalAlterado', label: 'Estado mental alterado' },
  { key: 'discSangradoActivo', label: 'Sangrado activo' },
  { key: 'discFiebreMayor385', label: 'Fiebre mayor a 38.5 °C' },
  {
    key: 'discHipotensionSistolicaMenor90',
    label: 'Hipotensión sistólica menor a 90 mmHg',
  },
  { key: 'discConvulsiones', label: 'Convulsiones' },
  { key: 'discDeficitNeurologicoFocal', label: 'Déficit neurológico focal' },
  { key: 'discDolorAbdominalSevero', label: 'Dolor abdominal severo' },
  { key: 'discSepsis', label: 'Sospecha de sepsis' },
  { key: 'discTraumaMayor', label: 'Trauma mayor' },
  { key: 'discOtro', label: 'Otro' },
] as const;

export const triageOtherClinicalDiscriminatorFieldKey =
  'discOtroEspecificacion';

const triageArrivalModeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'AMBULANCIA', label: 'Ambulancia' },
  { value: 'PROPIO_PIE', label: 'Por propio pie' },
  { value: 'TRASLADO', label: 'Traslado' },
  { value: 'POLICIA_PROTECCION_CIVIL', label: 'Policía / protección civil' },
  { value: 'OTRO', label: 'Otro' },
];

const triageDestinationOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'SALA_ESPERA', label: 'Sala de espera' },
  { value: 'OBSERVACION', label: 'Observación' },
  { value: 'SALA_CHOQUE', label: 'Sala de choque' },
  { value: 'CONSULTA_MEDICA', label: 'Consulta médica' },
  { value: 'UCI', label: 'UCI' },
  { value: 'HOSPITALIZACION', label: 'Hospitalización' },
];

const triageOriginOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'DOMICILIO', label: 'Domicilio' },
  { value: 'VIA_PUBLICA', label: 'Vía pública' },
  { value: 'TRABAJO', label: 'Trabajo' },
  { value: 'ESCUELA', label: 'Escuela' },
  { value: 'OTRA_UNIDAD_MEDICA', label: 'Otra unidad médica' },
  { value: 'OTRO', label: 'Otro' },
];

const triageReferenceAdmissionOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'NO', label: 'No' },
  { value: 'SI', label: 'Sí' },
];

const triageCompanionRelationshipOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ESPOSO_A', label: 'Esposo(a)' },
  { value: 'HIJO_A', label: 'Hijo(a)' },
  { value: 'PADRE_MADRE', label: 'Padre/Madre' },
  { value: 'HERMANO_A', label: 'Hermano(a)' },
  { value: 'OTRO', label: 'Otro' },
  { value: 'NINGUNO', label: 'Ninguno' },
];

const triageReevaluationRequiredOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'NO', label: 'No' },
  { value: 'SI', label: 'Sí' },
];

const triageReevaluationPriorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'SIN_CAMBIO', label: 'Sin cambio' },
  { value: 'REANIMACION', label: 'Reanimación' },
  { value: 'EMERGENCIA', label: 'Emergencia' },
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'MENOR_URGENCIA', label: 'Menor urgencia' },
  { value: 'NO_URGENTE', label: 'No urgente' },
];

const triageInitialGeneralConditionOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'BUENO', label: 'Bueno' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'GRAVE', label: 'Grave' },
];

const triageInitialMentalStatusOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ORIENTADO_COOPERADOR', label: 'Orientado y cooperador' },
  { value: 'CONFUSO', label: 'Confuso' },
  { value: 'AGITADO', label: 'Agitado' },
  { value: 'SOMNOLIENTO', label: 'Somnoliento' },
  { value: 'ESTUPOROSO', label: 'Estuporoso' },
  { value: 'COMATOSO', label: 'Comatoso' },
];

const triageApparentLifeRiskOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'NO', label: 'No' },
  { value: 'SI', label: 'Sí' },
  { value: 'INDETERMINADO', label: 'Indeterminado' },
];

const triageRequiredIsolationOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'NO', label: 'No' },
  { value: 'CONTACTO', label: 'Contacto' },
  { value: 'GOTAS', label: 'Gotas' },
  { value: 'AEROSOLES', label: 'Aerosoles' },
];

const emergencyInitialNoteConsentOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'PACIENTE', label: 'Otorgado por paciente' },
  { value: 'FAMILIAR', label: 'Otorgado por familiar' },
  { value: 'TUTOR_LEGAL', label: 'Otorgado por tutor legal' },
  { value: 'URGENCIA_VITAL', label: 'Urgencia vital (sin consentimiento)' },
  { value: 'PRIVILEGIO_TERAPEUTICO', label: 'Privilegio terapéutico' },
];

const emergencyInitialNoteConsentTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'GENERAL_ATENCION', label: 'General de atención' },
  { value: 'PROCEDIMIENTO_ESPECIFICO', label: 'Procedimiento específico' },
  { value: 'ANESTESIA', label: 'Anestesia' },
  { value: 'TRANSFUSION', label: 'Transfusión' },
];

const emergencyInitialNotePrognosisOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'BUENO', label: 'Bueno' },
  { value: 'RESERVADO', label: 'Reservado' },
  { value: 'MALO', label: 'Malo' },
  { value: 'MUY_GRAVE', label: 'Muy grave' },
];

const nursingFallRiskOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'ALTO', label: 'Alto' },
];

const emergencyEventTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'MEDICO', label: 'Médico' },
  { value: 'TRAUMA', label: 'Trauma' },
  { value: 'QUIRURGICO', label: 'Quirúrgico' },
  { value: 'GINECO_OBSTETRICO', label: 'Gineco-obstétrico' },
  { value: 'TOXICOLOGICO', label: 'Toxicológico' },
  { value: 'OTRO', label: 'Otro' },
];

const killipOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'I', label: 'I - Sin insuficiencia cardiaca' },
  { value: 'II', label: 'II - Estertores / S3' },
  { value: 'III', label: 'III - Edema pulmonar' },
  { value: 'IV', label: 'IV - Choque cardiogénico' },
];

const scoreRiskOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'BAJO', label: 'Bajo' },
  { value: 'INTERMEDIO', label: 'Intermedio' },
  { value: 'ALTO', label: 'Alto' },
];

const clinicalStatusOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ESTABLE', label: 'Estable' },
  { value: 'OBSERVACION', label: 'En observación' },
  { value: 'DELICADO', label: 'Delicado' },
  { value: 'GRAVE', label: 'Grave' },
  { value: 'CRITICO', label: 'Crítico' },
];

const treatmentResponseOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'FAVORABLE', label: 'Favorable' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'SIN_CAMBIOS', label: 'Sin cambios' },
  { value: 'DESFAVORABLE', label: 'Desfavorable' },
];

const consentStatusOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'NO_VIGENTE', label: 'No vigente' },
  { value: 'NO_APLICA', label: 'No aplica' },
];

const fallRiskOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'ALTO', label: 'Alto' },
];

const orderPriorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'STAT', label: 'STAT' },
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'NORMAL', label: 'Normal' },
];

const orderFrequencyOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'DOSIS_UNICA', label: 'Dosis única' },
  { value: 'CADA_4_H', label: 'Cada 4 horas' },
  { value: 'CADA_6_H', label: 'Cada 6 horas' },
  { value: 'CADA_8_H', label: 'Cada 8 horas' },
  { value: 'CADA_12_H', label: 'Cada 12 horas' },
  { value: 'CADA_24_H', label: 'Cada 24 horas' },
  { value: 'PRN', label: 'PRN' },
];

const orderDurationOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'DOSIS_UNICA', label: 'Dosis única' },
  { value: '24_HORAS', label: '24 horas' },
  { value: '48_HORAS', label: '48 horas' },
  { value: '72_HORAS', label: '72 horas' },
  { value: 'HASTA_REVALORACION', label: 'Hasta revaloración' },
];

const studyTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'LABORATORIO', label: 'Laboratorio' },
  { value: 'GABINETE', label: 'Gabinete' },
  { value: 'IMAGEN', label: 'Imagen' },
];

const orderStatusOptions: EpisodeFieldOption[] = [
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'EJECUTADA', label: 'Ejecutada' },
  { value: 'PENDIENTE_RESULTADO', label: 'Pendiente de resultado' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const oxygenTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'PUNTAS_NASALES', label: 'Puntas nasales' },
  { value: 'MASCARILLA_SIMPLE', label: 'Mascarilla simple' },
  { value: 'MASCARILLA_RESERVORIO', label: 'Mascarilla con reservorio' },
  { value: 'VENTURI', label: 'Venturi' },
  { value: 'ALTO_FLUJO', label: 'Alto flujo' },
];

const dietOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'AYUNO', label: 'Ayuno' },
  { value: 'LIQUIDA', label: 'Líquida' },
  { value: 'BLANDA', label: 'Blanda' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ESPECIAL', label: 'Especial' },
];

const restOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'ABSOLUTO', label: 'Absoluto' },
  { value: 'RELATIVO', label: 'Relativo' },
  { value: 'AMBULACION_ASISTIDA', label: 'Ambulación asistida' },
];

const fluidControlOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'NO', label: 'No' },
  { value: 'BALANCE_HIDRICO', label: 'Balance hídrico' },
  { value: 'INGRESOS_EGRESOS', label: 'Ingresos / egresos' },
  { value: 'RESTRICCION', label: 'Restricción hídrica' },
];

const transfusionProductOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'CONCENTRADO_ERITROCITARIO', label: 'Concentrado eritrocitario' },
  { value: 'PLASMA_FRESCO_CONGELADO', label: 'Plasma fresco congelado' },
  { value: 'PLAQUETAS', label: 'Plaquetas' },
  { value: 'CRIOPRECIPITADO', label: 'Crioprecipitado' },
  { value: 'SANGRE_TOTAL', label: 'Sangre total' },
  { value: 'OTRO', label: 'Otro' },
];

const adverseReactionOptions: EpisodeFieldOption[] = [
  { value: 'NO', label: 'No' },
  { value: 'SI', label: 'Sí' },
];

const notificationMediumOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'SISTEMA', label: 'Sistema' },
  { value: 'TELEFONO', label: 'Teléfono' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'RADIO', label: 'Radio' },
];

const emergencyConsultationServiceOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'MEDICINA_INTERNA', label: 'Medicina interna' },
  { value: 'CIRUGIA_GENERAL', label: 'Cirugía general' },
  { value: 'TRAUMATOLOGIA', label: 'Traumatología' },
  { value: 'GINECO_OBSTETRICIA', label: 'Gineco-obstetricia' },
  { value: 'PEDIATRIA', label: 'Pediatría' },
  { value: 'TERAPIA_INTENSIVA', label: 'Terapia intensiva' },
  { value: 'CARDIOLOGIA', label: 'Cardiología' },
  { value: 'NEUROLOGIA', label: 'Neurología' },
  { value: 'OTRO', label: 'Otro' },
];

const consultationPriorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'INMEDIATA', label: 'Inmediata (≤30 min)' },
  { value: 'URGENTE', label: 'Urgente (<1 h)' },
  { value: 'PREFERENTE', label: 'Preferente (<4 h)' },
  { value: 'DIFERIDA', label: 'Diferida' },
];

const consultationStatusOptions: EpisodeFieldOption[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'RECIBIDA', label: 'Recibida' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'RESPONDIDA', label: 'Respondida' },
  { value: 'CERRADA', label: 'Cerrada' },
];

const consultationDecisionOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin decisión' },
  { value: 'ACEPTADA', label: 'Aceptada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'DIFERIDA', label: 'Diferida' },
];

const emergencyDischargeTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ALTA_DOMICILIO', label: 'Alta a domicilio' },
  { value: 'HOSPITALIZACION', label: 'Hospitalización' },
  { value: 'REFERENCIA_TRASLADO', label: 'Referencia / traslado' },
  { value: 'DEFUNCION', label: 'Defunción' },
];

const emergencyDischargeDestinationOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'DOMICILIO', label: 'Domicilio' },
  { value: 'HOSPITALIZACION', label: 'Hospitalización' },
  { value: 'UNIDAD_REFERENCIA', label: 'Unidad de referencia' },
  { value: 'MORTUORIO', label: 'Mortuorio' },
];

const emergencyDischargeConditionOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ESTABLE', label: 'Estable' },
  { value: 'GRAVE', label: 'Grave' },
  { value: 'CRITICO', label: 'Crítico' },
  { value: 'FALLECIDO', label: 'Fallecido' },
];

const emergencyDischargeTransferMediumOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'AMBULANCIA_BASICA', label: 'Ambulancia básica' },
  { value: 'AMBULANCIA_AVANZADA', label: 'Ambulancia avanzada' },
  { value: 'VEHICULO_PARTICULAR', label: 'Vehículo particular' },
  { value: 'AEREO', label: 'Aéreo' },
  { value: 'OTRO', label: 'Otro' },
];

const emergencyDischargeConsentRelationshipOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'PACIENTE', label: 'Paciente' },
  { value: 'ESPOSO_A', label: 'Esposo(a)' },
  { value: 'HIJO_A', label: 'Hijo(a)' },
  { value: 'MADRE_PADRE', label: 'Madre/Padre' },
  { value: 'TUTOR_LEGAL', label: 'Tutor legal' },
  { value: 'FAMILIAR_RESPONSABLE', label: 'Familiar responsable' },
  { value: 'OTRO', label: 'Otro' },
];

const emergencyDischargePublicMinistryNoticeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'LESIONES', label: 'Reporte de lesiones' },
  { value: 'VIOLENCIA', label: 'Reporte de violencia' },
  { value: 'MUERTE_INVESTIGACION', label: 'Muerte sujeta a investigación' },
  { value: 'VIGILANCIA_EPIDEMIOLOGICA', label: 'Vigilancia epidemiológica' },
  { value: 'OTRO', label: 'Otro' },
];

const emergencyDischargeDeathCertificateTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'CERTIFICADO_DEFUNCION', label: 'Certificado de defunción' },
  { value: 'MUERTE_FETAL', label: 'Muerte fetal' },
];

const incapacityTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'INICIAL', label: 'Inicial' },
  { value: 'SUBSECUENTE', label: 'Subsecuente' },
  { value: 'RIESGO_TRABAJO', label: 'Riesgo de trabajo' },
];

const glasgowEyeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: '4', label: '4 - Espontánea' },
  { value: '3', label: '3 - A la voz' },
  { value: '2', label: '2 - Al dolor' },
  { value: '1', label: '1 - Ninguna' },
];

const glasgowVerbalOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: '5', label: '5 - Orientada' },
  { value: '4', label: '4 - Confusa' },
  { value: '3', label: '3 - Palabras inapropiadas' },
  { value: '2', label: '2 - Sonidos incomprensibles' },
  { value: '1', label: '1 - Ninguna' },
];

const glasgowMotorOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: '6', label: '6 - Obedece órdenes' },
  { value: '5', label: '5 - Localiza dolor' },
  { value: '4', label: '4 - Retira al dolor' },
  { value: '3', label: '3 - Flexión anormal' },
  { value: '2', label: '2 - Extensión anormal' },
  { value: '1', label: '1 - Ninguna' },
];

const clinicalStateOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'ESTABLE', label: 'Estable' },
  { value: 'INestable', label: 'Inestable' },
  { value: 'GRAVE_ESTABLE', label: 'Grave, estable' },
  { value: 'GRAVE_INESTABLE', label: 'Grave, inestable' },
];

const normalAlteredOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ALTERADO', label: 'Alterado' },
];

const emergencyTriageAirwayOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'PERMEABLE', label: 'Permeable' },
  { value: 'COMPROMETIDA', label: 'Comprometida' },
  { value: 'INTUBADA', label: 'Intubada' },
];

const emergencyTriageHemodynamicOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ESTABLE', label: 'Estable' },
  { value: 'INESTABLE', label: 'Inestable' },
  { value: 'CHOQUE', label: 'Choque' },
];

const emergencyTriageNeurologicalOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ALERTA', label: 'Alerta' },
  { value: 'RESPONDE_VOZ', label: 'Responde a voz' },
  { value: 'RESPONDE_DOLOR', label: 'Responde a dolor' },
  { value: 'INCONSCIENTE', label: 'Inconsciente' },
];

export const emergencyTriageClinicalQuickStateFields: EpisodeFieldDefinition[] = [
  { key: 'viaAerea', label: 'Vía aérea', type: 'select', options: emergencyTriageAirwayOptions, required: true },
  { key: 'estadoHemodinamico', label: 'Estado hemodinámico', type: 'select', options: emergencyTriageHemodynamicOptions, required: true },
  { key: 'estadoNeurologico', label: 'Estado neurológico', type: 'select', options: emergencyTriageNeurologicalOptions, required: true },
];

const currentUseOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'NO', label: 'No' },
  { value: 'OCASIONAL', label: 'Ocasional' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PREVIO', label: 'Previo' },
];

const adherenceOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'ADECUADO', label: 'Adecuado' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'INADECUADO', label: 'Inadecuado' },
];

const riskClassificationOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'MUY_ALTO', label: 'Muy alto' },
];

const diagnosisTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'PRESUNTIVO', label: 'Presuntivo' },
  { value: 'DEFINITIVO', label: 'Definitivo' },
  { value: 'SINDROMATICO', label: 'Sindromático' },
  { value: 'NOSOLOGICO', label: 'Nosológico' },
];

const administrationRouteOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'VO', label: 'Vía oral' },
  { value: 'IV', label: 'Intravenosa' },
  { value: 'IM', label: 'Intramuscular' },
  { value: 'SC', label: 'Subcutánea' },
  { value: 'TOPICA', label: 'Tópica' },
  { value: 'INHALADA', label: 'Inhalada' },
  { value: 'OTRA', label: 'Otra' },
];

const prescriptionTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'SIMPLE', label: 'Receta simple' },
  { value: 'CONTROLADA', label: 'Receta controlada' },
  { value: 'ANTIBIOTICO', label: 'Antibiótico' },
  { value: 'CRONICA', label: 'Tratamiento crónico' },
];

const prescriptionValidityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: '24_HORAS', label: '24 horas' },
  { value: '72_HORAS', label: '72 horas' },
  { value: '7_DIAS', label: '7 días' },
  { value: '14_DIAS', label: '14 días' },
  { value: '30_DIAS', label: '30 días' },
];

const diagnosisStatusOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'CONTROLADO', label: 'Controlado' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'DESCARTADO', label: 'Descartado' },
];

const emergencyEvolutionDiagnosisTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'PRESUNTIVO', label: 'Presuntivo' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'DIFERENCIAL', label: 'Diferencial' },
];

const emergencyEvolutionDiagnosticStudyTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'ECG', label: 'ECG' },
  { value: 'TROPONINA', label: 'Troponina' },
  { value: 'BIOMETRIA_HEMATICA', label: 'Biometría hemática' },
  { value: 'GASOMETRIA', label: 'Gasometría' },
  { value: 'RX_TORAX', label: 'RX tórax' },
  { value: 'TAC', label: 'TAC' },
  { value: 'ULTRASONIDO', label: 'Ultrasonido' },
  { value: 'OTRO', label: 'Otro' },
];

const prescriptionMedicationTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'FARMACOLOGICO', label: 'Farmacológico' },
  { value: 'ANTIBIOTICO', label: 'Antibiótico' },
  { value: 'ANALGESICO', label: 'Analgésico' },
  { value: 'CONTROLADO', label: 'Controlado' },
  { value: 'SUPLEMENTO', label: 'Suplemento' },
  { value: 'OTRO', label: 'Otro' },
];

const comprehensionOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'COMPLETA', label: 'Completa' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'LIMITADA', label: 'Limitada' },
];

const alarmSeverityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
];

const followUpTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'CONSULTA', label: 'Consulta' },
  { value: 'TELECONSULTA', label: 'Teleconsulta' },
  { value: 'URGENCIAS', label: 'Urgencias' },
  { value: 'INTERCONSULTA', label: 'Interconsulta' },
];

const documentPriorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'RUTINARIA', label: 'Rutinaria' },
  { value: 'PREFERENTE', label: 'Preferente' },
  { value: 'URGENTE', label: 'Urgente' },
];

const referralTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'REFERENCIA', label: 'Referencia' },
  { value: 'CONTRARREFERENCIA', label: 'Contrarreferencia' },
];

const certificateTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'MEDICO', label: 'Certificado médico' },
  { value: 'ESCOLAR', label: 'Constancia escolar' },
  { value: 'LABORAL', label: 'Constancia laboral' },
  { value: 'REPOSO', label: 'Constancia de reposo' },
];

const finalStateOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'CONTROLADO', label: 'Controlado' },
  { value: 'EN_SEGUIMIENTO', label: 'En seguimiento' },
  { value: 'REFERIDO', label: 'Referido' },
  { value: 'ALTA_MEDICA', label: 'Alta médica' },
  { value: 'NO_RESUELTO', label: 'No resuelto' },
];

const priorStudyTypeOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Selecciona una opción' },
  { value: 'LABORATORY', label: 'Laboratorio' },
  { value: 'IMAGING', label: 'Imagen' },
  { value: 'CABINET', label: 'Gabinete' },
  { value: 'OTHER', label: 'Otro' },
];

const consultationConsentComprehensionOptions: EpisodeFieldOption[] = [
  { value: 'Comprende y acepta', label: 'Comprende y acepta' },
  { value: 'Comprensión parcial', label: 'Comprensión parcial' },
  { value: 'No comprende', label: 'No comprende' },
  {
    value: 'Requiere apoyo o acompañante',
    label: 'Requiere apoyo o acompañante',
  },
];

const consultationPrescriptionPatientComprehensionOptions =
  consultationConsentComprehensionOptions;

export const episodeProfileSchemas: Record<string, EpisodeTabDefinition[]> = {
  OUTPATIENT: [
    {
      key: 'Historia clínica',
      title: 'Historia clínica',
      description: 'Campos estructurados inspirados en la historia clínica de Nexus.',
      icon: FileText,
      sections: [
        {
          key: 'antecedentes_heredofamiliares',
          title: 'Antecedentes heredofamiliares',
          description: 'Información heredable y actualizable entre versiones.',
          fields: [
            { key: 'ahfDiabetes', label: 'Diabetes', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfHipertension', label: 'Hipertensión', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfCancer', label: 'Cáncer', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfCardiopatias', label: 'Cardiopatías', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfEvc', label: 'EVC', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfEnfermedadRenal', label: 'Enfermedad renal', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfEnfermedadAutoinmune', label: 'Enfermedad autoinmune', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfEnfermedadPsiquiatrica', label: 'Enfermedad psiquiátrica', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'ahfDetalle', label: 'Detalle', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'antecedentes_patologicos',
          title: 'Antecedentes personales patológicos',
          fields: [
            { key: 'appEnfermedadesCronicas', label: 'Enfermedades crónicas', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'appAlergias', label: 'Alergias', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'appQuirurgicos', label: 'Quirúrgicos', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'appHospitalizaciones', label: 'Hospitalizaciones', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'appTraumaticos', label: 'Traumáticos', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'appTransfusionales', label: 'Transfusionales', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'appInfecciosos', label: 'Infecciosos', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'antecedentes_no_patologicos',
          title: 'Antecedentes personales no patológicos',
          fields: [
            { key: 'apnpAlimentacion', label: 'Alimentación', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'apnpActividadFisica', label: 'Actividad física', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'apnpTabaquismo', label: 'Tabaquismo', type: 'select', options: currentUseOptions, inheritanceMode: 'carry_forward' },
            { key: 'apnpAlcoholismo', label: 'Alcoholismo', type: 'select', options: currentUseOptions, inheritanceMode: 'carry_forward' },
            { key: 'apnpToxicomanias', label: 'Toxicomanías', type: 'select', options: currentUseOptions, inheritanceMode: 'carry_forward' },
            { key: 'apnpVivienda', label: 'Vivienda', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'apnpHigiene', label: 'Higiene', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'apnpInmunizaciones', label: 'Inmunizaciones', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'gineco_obstetricos',
          title: 'Antecedentes gineco-obstétricos',
          fields: [
            { key: 'agoMenarca', label: 'Menarca', type: 'text', inheritanceMode: 'carry_forward' },
            { key: 'agoRitmoMenstrual', label: 'Ritmo menstrual', type: 'text', inheritanceMode: 'carry_forward' },
            { key: 'agoFum', label: 'FUM', type: 'date', inheritanceMode: 'fresh_capture' },
            { key: 'agoIvsa', label: 'IVSA', type: 'text', inheritanceMode: 'carry_forward' },
            { key: 'agoGestas', label: 'Gestas', type: 'number', inheritanceMode: 'carry_forward' },
            { key: 'agoPartos', label: 'Partos', type: 'number', inheritanceMode: 'carry_forward' },
            { key: 'agoAbortos', label: 'Abortos', type: 'number', inheritanceMode: 'carry_forward' },
            { key: 'agoCesareas', label: 'Cesáreas', type: 'number', inheritanceMode: 'carry_forward' },
            { key: 'agoMpf', label: 'MPF', type: 'text', inheritanceMode: 'carry_forward' },
            { key: 'agoDoc', label: 'DOC', type: 'text', inheritanceMode: 'carry_forward' },
            { key: 'agoMastografia', label: 'Mastografía', type: 'text', inheritanceMode: 'carry_forward' },
            { key: 'agoMenopausia', label: 'Menopausia', type: 'text', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'interrogatorio_sistemas',
          title: 'Interrogatorio por sistemas',
          description: 'Se captura solo en la historia clínica inicial.',
          historyVisibility: 'initial_only',
          fields: [
            { key: 'isCardiovascularEstado', label: 'Cardiovascular', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isCardiovascularDetalle', label: 'Detalle cardiovascular', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isRespiratorioEstado', label: 'Respiratorio', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isRespiratorioDetalle', label: 'Detalle respiratorio', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isDigestivoEstado', label: 'Digestivo', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isDigestivoDetalle', label: 'Detalle digestivo', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isGenitourinarioEstado', label: 'Genitourinario', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isGenitourinarioDetalle', label: 'Detalle genitourinario', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isMusculoesqueleticoEstado', label: 'Musculoesquelético', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isMusculoesqueleticoDetalle', label: 'Detalle musculoesquelético', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isNerviosoEstado', label: 'Nervioso', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isNerviosoDetalle', label: 'Detalle nervioso', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isEndocrinoEstado', label: 'Endocrino', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isEndocrinoDetalle', label: 'Detalle endocrino', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isPielEstado', label: 'Piel', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isPielDetalle', label: 'Detalle piel', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isHematologicoEstado', label: 'Hematológico', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isHematologicoDetalle', label: 'Detalle hematológico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isOftalmicoEstado', label: 'Oftálmico', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isOftalmicoDetalle', label: 'Detalle oftálmico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isOrlEstado', label: 'ORL', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isOrlDetalle', label: 'Detalle ORL', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'isPsiquiatricoEstado', label: 'Psiquiátrico', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'isPsiquiatricoDetalle', label: 'Detalle psiquiátrico', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'exploracion_baseline',
          title: 'Exploración física baseline',
          historyVisibility: 'initial_only',
          fields: [
            { key: 'efbSignosVitales', label: 'Signos vitales', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efbExploracionRegion', label: 'Exploración por región', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'diagnosticos_baseline',
          title: 'Diagnósticos baseline inicial',
          historyVisibility: 'initial_only',
          fields: [
            { key: 'dbiDiagnosticoPrincipal', label: 'Diagnóstico principal', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'dbiCie10', label: 'CIE-10', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'dbiTipo', label: 'Tipo', type: 'select', options: diagnosisTypeOptions, inheritanceMode: 'fresh_capture' },
            { key: 'dbiSecundarios', label: 'Secundarios', type: 'string-array', itemAddLabel: 'Agregar diagnóstico secundario', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'resultados_previos',
          title: 'Resultados previos de estudios',
          fields: [
            {
              key: 'estudiosPreviosRegistrados',
              label: 'Estudios previos registrados',
              type: 'object-array',
              itemAddLabel: '+ Agregar estudio',
              itemRemoveLabel: 'Eliminar estudio',
              inheritanceMode: 'carry_forward',
              itemFields: [
                {
                  key: 'tipoEstudio',
                  label: 'Tipo de estudio',
                  type: 'select',
                  options: priorStudyTypeOptions,
                },
                {
                  key: 'nombreEstudio',
                  label: 'Nombre del estudio',
                  type: 'text',
                },
                {
                  key: 'fechaEstudio',
                  label: 'Fecha del estudio',
                  type: 'date',
                },
                {
                  key: 'resultado',
                  label: 'Resultado',
                  type: 'textarea',
                },
                {
                  key: 'interpretacionHallazgo',
                  label: 'Interpretación / hallazgo relevante',
                  type: 'textarea',
                },
              ],
            },
            { key: 'resultadosPreviosResumen', label: 'Resumen de estudios relevantes', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'plan_terapeutico_inicial',
          title: 'Plan terapéutico inicial',
          historyVisibility: 'initial_only',
          fields: [
            { key: 'ptiTratamientoFarmacologico', label: 'Tratamiento farmacológico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'ptiTratamientoNoFarmacologico', label: 'Tratamiento no farmacológico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'ptiEstudios', label: 'Estudios', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'ptiSeguimiento', label: 'Seguimiento', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'pronostico',
          title: 'Pronóstico',
          fields: [
            { key: 'pronosticoHistoriaClinica', label: 'Pronóstico', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'medicacion_cronica',
          title: 'Medicación crónica actual',
          fields: [
            {
              key: 'medicacionCronicaActual',
              label: 'Medicaciones',
              type: 'object-array',
              inheritanceMode: 'carry_forward',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'via', label: 'Vía', type: 'select', options: administrationRouteOptions },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
                { key: 'desde', label: 'Desde', type: 'date' },
                { key: 'indicacion', label: 'Indicación', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'apego_terapeutico',
          title: 'Apego terapéutico',
          fields: [
            { key: 'apegoFarmacologico', label: 'Apego farmacológico', type: 'select', options: adherenceOptions, inheritanceMode: 'carry_forward' },
            { key: 'apegoNoFarmacologico', label: 'Apego no farmacológico', type: 'select', options: adherenceOptions, inheritanceMode: 'carry_forward' },
            { key: 'apegoObservaciones', label: 'Observaciones', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'factores_riesgo',
          title: 'Factores de riesgo',
          fields: [
            { key: 'frTabaquismo', label: 'Tabaquismo', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frAlcoholismo', label: 'Alcoholismo', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frSedentarismo', label: 'Sedentarismo', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frObesidad', label: 'Obesidad', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frDieta', label: 'Dieta', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frEstres', label: 'Estrés', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frAntecedentesCv', label: 'Antecedentes CV', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frSustancias', label: 'Sustancias', type: 'checkbox', inheritanceMode: 'carry_forward' },
            { key: 'frClasificacion', label: 'Clasificación', type: 'select', options: riskClassificationOptions, inheritanceMode: 'carry_forward' },
            { key: 'frObservaciones', label: 'Observaciones', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'datos_legales',
          title: 'Datos legales',
          description: 'Datos documentales calculados desde el profesional responsable.',
          fields: [
            { key: 'legalMedico', label: 'Médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'legalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'legalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarHistoriaClinica', label: 'Firma', type: 'action', actionLabel: 'Firmar historia clínica', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Consulta actual',
      title: 'Consulta actual',
      description: 'Captura estructurada del evento clínico del día.',
      icon: Stethoscope,
      sections: [
        {
          key: 'tipo_consulta',
          title: 'Contexto de la consulta',
          fields: [
            {
              key: 'tipoConsultaActual',
              label: 'Tipo de consulta',
              type: 'select',
              inheritanceMode: 'system',
              options: [
                { value: '', label: 'Selecciona una opcion' },
                { value: 'PRIMERA_VEZ', label: 'Primera vez' },
                { value: 'SUBSECUENTE', label: 'Subsecuente' },
              ],
            },
            {
              key: 'motivoConsultaPrincipal',
              label: 'Motivo principal',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'motivoConsultaSecundario',
              label: 'Motivo secundario',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'motivoConsultaTiempoEvolucion',
              label: 'Tiempo evolución',
              type: 'text',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'padecimiento_actual',
          title: 'Padecimiento actual',
          fields: [
            { key: 'pcFechaInicio', label: 'Fecha inicio', type: 'date', inheritanceMode: 'fresh_capture' },
            {
              key: 'pcTipoEvolucion',
              label: 'Tipo evolución',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: [
                { value: '', label: 'Selecciona una opcion' },
                { value: 'AGUDO', label: 'Agudo' },
                { value: 'SUBAGUDO', label: 'Subagudo' },
                { value: 'CRONICO', label: 'Crónico' },
                { value: 'RECURRENTE', label: 'Recurrente' },
              ],
            },
            { key: 'pcDescripcion', label: 'Descripción', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'pcIntensidadEva', label: 'Intensidad EVA', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'pcLocalizacion', label: 'Localización', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'pcIrradiacion', label: 'Irradiación', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'pcSintomasAsociados', label: 'Síntomas asociados', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'pcFactoresAgravantes', label: 'Factores agravantes', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'pcFactoresAtenuantes', label: 'Factores atenuantes', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'pcTratamientosPrevios', label: 'Tratamientos previos', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'antecedentes_referencia',
          title: 'Antecedentes de referencia',
          description: 'Referencia clínica derivada de Historia clínica; no editable aquí.',
          fields: [
            { key: 'referenciaAlergiasCriticas', label: 'Alergias críticas', type: 'readonly', inheritanceMode: 'system' },
            { key: 'referenciaCronicos', label: 'Crónicos', type: 'readonly', inheritanceMode: 'system' },
            { key: 'referenciaMedicacionCronica', label: 'Medicación crónica', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'signos_vitales',
          title: 'Signos vitales',
          fields: [
            { key: 'svTaSistolica', label: 'TA sistólica', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svTaDiastolica', label: 'TA diastólica', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svFc', label: 'FC', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svFr', label: 'FR', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svTemp', label: 'Temp', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svSpo2', label: 'SpO2', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svPeso', label: 'Peso', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svTalla', label: 'Talla', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svEva', label: 'EVA', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svGlucosa', label: 'Glucosa', type: 'number', inheritanceMode: 'fresh_capture' },
            { key: 'svRitmoIrregular', label: 'Ritmo irregular', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'svImc', label: 'IMC', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'exploracion_fisica',
          title: 'Exploración física',
          fields: [
            { key: 'efEstadoGeneral', label: 'Estado general', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efCabezaEstado', label: 'Cabeza', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efCabezaDetalle', label: 'Detalle cabeza', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efCuelloEstado', label: 'Cuello', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efCuelloDetalle', label: 'Detalle cuello', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efCardiovascularEstado', label: 'Cardiovascular', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efCardiovascularDetalle', label: 'Detalle cardiovascular', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efRespiratorioEstado', label: 'Respiratorio', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efRespiratorioDetalle', label: 'Detalle respiratorio', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efAbdomenEstado', label: 'Abdomen', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efAbdomenDetalle', label: 'Detalle abdomen', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efGenitourinarioEstado', label: 'Genitourinario', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efGenitourinarioDetalle', label: 'Detalle genitourinario', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efExtremidadesEstado', label: 'Extremidades', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efExtremidadesDetalle', label: 'Detalle extremidades', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efNeurologicoEstado', label: 'Neurológico', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efNeurologicoDetalle', label: 'Detalle neurológico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efPielEstado', label: 'Piel', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efPielDetalle', label: 'Detalle piel', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'efLinfaticoEstado', label: 'Linfático', type: 'select', options: normalAlteredOptions, inheritanceMode: 'fresh_capture' },
            { key: 'efLinfaticoDetalle', label: 'Detalle linfático', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'resultados_previos',
          title: 'Resultados previos de estudios',
          fields: [
            { key: 'consultaResultadosPreviosResumen', label: 'Resumen de estudios relevantes', type: 'textarea', inheritanceMode: 'carry_forward' },
          ],
        },
        {
          key: 'impresion_diagnostica',
          title: 'Impresión diagnóstica actual',
          fields: [
            { key: 'idDiagnosticoPrincipal', label: 'Diagnóstico principal', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'idCie10', label: 'CIE-10', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'idTipo', label: 'Tipo', type: 'select', options: diagnosisTypeOptions, inheritanceMode: 'fresh_capture' },
            { key: 'idEstado', label: 'Estado', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'ACTIVO', label: 'Activo' }, { value: 'RESUELTO', label: 'Resuelto' }], inheritanceMode: 'fresh_capture' },
            { key: 'idSecundarios', label: 'Secundarios', type: 'object-array', itemAddLabel: 'Agregar diagnóstico secundario', inheritanceMode: 'fresh_capture', itemFields: [
              { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
              { key: 'cie10', label: 'CIE-10', type: 'text' },
              { key: 'tipo', label: 'Tipo', type: 'select', options: diagnosisTypeOptions },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'ACTIVO', label: 'Activo' }, { value: 'RESUELTO', label: 'Resuelto' }] },
            ] },
          ],
        },
        {
          key: 'plan_terapeutico',
          title: 'Plan terapéutico',
          fields: [
            { key: 'planTratamientoFarmacologico', label: 'Tratamiento farmacológico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'planTratamientoNoFarmacologico', label: 'Tratamiento no farmacológico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'planEstudios', label: 'Estudios', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'planInterconsultas', label: 'Interconsultas', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'planReferencias', label: 'Referencias', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'planIncapacidad', label: 'Incapacidad', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'planPronostico', label: 'Pronóstico', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'planSeguimiento', label: 'Seguimiento', type: 'date', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'consentimiento_informado',
          title: 'Consentimiento informado',
          fields: [
            { key: 'consentimientoVigente', label: 'Vigente', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'consentimientoExplicacion', label: 'Explicación', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'consentimientoComprension', label: 'Comprensión', type: 'select', options: consultationConsentComprehensionOptions, inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'red_flags',
          title: 'Red flags',
          fields: [
            { key: 'rfCefaleaIntensaSubita', label: 'Cefalea intensa súbita', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfDeficitNeurologicoFocal', label: 'Déficit neurológico focal', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfPerdidaVisual', label: 'Pérdida visual', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfDolorToracico', label: 'Dolor torácico', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfDisnea', label: 'Disnea', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfFiebreAlta', label: 'Fiebre >38.5°C', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfPerdidaPeso', label: 'Pérdida de peso inexplicable', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfSangradoActivo', label: 'Sangrado activo', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfAlteracionConciencia', label: 'Alteración del estado de conciencia', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'rfObservaciones', label: 'Observaciones', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'impacto_funcional',
          title: 'Impacto funcional',
          fields: [
            { key: 'impactoCapacidad', label: 'Capacidad', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'INDEPENDIENTE', label: 'Independiente' }, { value: 'PARCIAL', label: 'Parcialmente dependiente' }, { value: 'DEPENDIENTE', label: 'Dependiente' }], inheritanceMode: 'fresh_capture' },
            { key: 'impactoNivel', label: 'Impacto', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'NINGUNO', label: 'Ninguno' }, { value: 'LEVE', label: 'Leve' }, { value: 'MODERADO', label: 'Moderado' }, { value: 'SEVERO', label: 'Severo' }], inheritanceMode: 'fresh_capture' },
            { key: 'impactoDescripcion', label: 'Descripción', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'adherencia',
          title: 'Adherencia',
          fields: [
            { key: 'adherenciaFarmacologicaConsulta', label: 'Farmacológica', type: 'select', options: adherenceOptions, inheritanceMode: 'fresh_capture' },
            { key: 'adherenciaNoFarmacologicaConsulta', label: 'No farmacológica', type: 'select', options: adherenceOptions, inheritanceMode: 'fresh_capture' },
            { key: 'adherenciaObservacionesConsulta', label: 'Observaciones', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'datos_legales_consulta',
          title: 'Datos legales',
          fields: [
            { key: 'consultaLegalMedico', label: 'Médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'consultaLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'consultaLegalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarConsultaActual', label: 'Firma', type: 'action', actionLabel: 'Firmar consulta', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Evolución',
      title: 'Evolución',
      description: 'SOAP y continuidad terapéutica del episodio ambulatorio.',
      icon: Activity,
      sections: [
        {
          key: 'estado_general',
          title: 'Estado general',
          fields: [
            {
              key: 'evolucionFecha',
              label: 'Fecha de evolución',
              type: 'date',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'evolucionEstadoClinicoGeneral',
              label: 'Estado clínico general',
              type: 'select',
              options: clinicalStateOptions,
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'evolucionComplicaciones',
              label: 'Complicaciones',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'soap_subjetivo',
          title: 'S — Subjetivo',
          fields: [
            {
              key: 'evolucionSubjetivo',
              label: 'Subjetivo, lo que refiere el paciente',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'soap_objetivo',
          title: 'O — Objetivo',
          fields: [
            { key: 'evolucionTa', label: 'TA', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionFc', label: 'FC', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionFr', label: 'FR', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionTemp', label: 'Temp', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionSpo2', label: 'SpO₂', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionPeso', label: 'Peso', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionGlucosaCapilar', label: 'Glucosa capilar', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionEvaDolor', label: 'EVA dolor', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionHallazgosObjetivos', label: 'Hallazgos objetivos', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionResultadosRecientes', label: 'Resultados recientes', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'soap_analisis',
          title: 'A — Análisis / Diagnóstico',
          fields: [
            {
              key: 'evolucionDiagnosticos',
              label: 'Diagnósticos',
              type: 'object-array',
              itemAddLabel: 'Agregar diagnóstico',
              inheritanceMode: 'carry_forward',
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                {
                  key: 'estado',
                  label: 'Estado',
                  type: 'select',
                  options: [
                    { value: '', label: 'Sin especificar' },
                    { value: 'ACTIVO', label: 'Activo' },
                    { value: 'RESUELTO', label: 'Resuelto' },
                  ],
                },
              ],
            },
          ],
        },
        {
          key: 'soap_plan',
          title: 'P — Plan',
          fields: [
            { key: 'evolucionTratamiento', label: 'Tratamiento', type: 'textarea', inheritanceMode: 'carry_forward' },
            { key: 'evolucionEstudios', label: 'Estudios', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionInterconsultas', label: 'Interconsultas', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionSeguimiento', label: 'Seguimiento', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'consentimiento_info',
          title: 'Consentimiento e información',
          fields: [
            { key: 'evolucionConsentimientoVigente', label: 'Consentimiento vigente', type: 'checkbox', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionInformacionBrindada', label: 'Información brindada', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'comparacion_previa',
          title: 'Comparación con evolución previa',
          fields: [
            { key: 'evolucionPreviaTitulo', label: 'Evolución previa', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionPreviaEstado', label: 'Estado previo', type: 'readonly', inheritanceMode: 'system' },
            {
              key: 'evolucionTendencia',
              label: 'Tendencia',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: [
                { value: '', label: 'Sin especificar' },
                { value: 'MEJORIA', label: 'Mejoría' },
                { value: 'ESTABLE', label: 'Estable' },
                { value: 'DETERIORO', label: 'Deterioro' },
              ],
            },
            { key: 'evolucionAnalisisComparativo', label: 'Análisis comparativo', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'respuesta_tratamiento',
          title: 'Respuesta al tratamiento',
          fields: [
            {
              key: 'evolucionRespuestaFarmacologica',
              label: 'Respuesta farmacológica',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: [
                { value: '', label: 'Sin especificar' },
                { value: 'FAVORABLE', label: 'Favorable' },
                { value: 'PARCIAL', label: 'Parcial' },
                { value: 'SIN_CAMBIOS', label: 'Sin cambios' },
                { value: 'DESFAVORABLE', label: 'Desfavorable' },
              ],
            },
            { key: 'evolucionEventosAdversos', label: 'Eventos adversos', type: 'textarea', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionJustificacionClinica', label: 'Justificación clínica', type: 'textarea', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'escalas_clinicas',
          title: 'Escalas clínicas',
          fields: [
            { key: 'evolucionGlasgow', label: 'Glasgow', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionEscalaEva', label: 'EVA', type: 'text', inheritanceMode: 'fresh_capture' },
            {
              key: 'evolucionRiesgoCardiovascular',
              label: 'Riesgo cardiovascular',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: riskClassificationOptions,
            },
            { key: 'evolucionKarnofsky', label: 'Karnofsky', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionOtraEscala', label: 'Otra escala', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'evolucionResultadoOtraEscala', label: 'Resultado de otra escala', type: 'text', inheritanceMode: 'fresh_capture' },
          ],
        },
        {
          key: 'datos_legales_evolucion',
          title: 'Datos legales',
          fields: [
            { key: 'evolucionLegalMedico', label: 'Médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionLegalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionLugar', label: 'Lugar', type: 'text', inheritanceMode: 'fresh_capture' },
            { key: 'firmarEvolucion', label: 'Firma', type: 'action', actionLabel: 'Firmar evolución', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Receta e indicaciones',
      title: 'Receta e indicaciones',
      description: 'Prescripción, seguridad y seguimiento.',
      icon: Pill,
      sections: [
        {
          key: 'encabezado_receta',
          title: 'Encabezado de receta',
          fields: [
            {
              key: 'recetaFolio',
              label: 'Folio de receta',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaTipo',
              label: 'Tipo de receta',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: prescriptionTypeOptions,
            },
            {
              key: 'recetaVigencia',
              label: 'Vigencia de receta',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: prescriptionValidityOptions,
            },
            {
              key: 'recetaCodigoVerificacion',
              label: 'Código de verificación',
              type: 'readonly',
              inheritanceMode: 'system',
            },
          ],
        },
        {
          key: 'diagnostico_asociado',
          title: 'Diagnóstico asociado',
          fields: [
            {
              key: 'recetaDiagnosticoPrincipal',
              label: 'Diagnóstico principal',
              type: 'text',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'recetaDiagnosticoCie10',
              label: 'CIE-10',
              type: 'text',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'recetaDiagnosticoSecundarios',
              label: 'Diagnósticos secundarios',
              type: 'object-array',
              inheritanceMode: 'fresh_capture',
              itemAddLabel: 'Agregar diagnóstico secundario',
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                {
                  key: 'estado',
                  label: 'Estado',
                  type: 'select',
                  options: diagnosisStatusOptions,
                },
              ],
            },
            {
              key: 'recetaIndicacionesDiagnosticas',
              label: 'Indicaciones generales',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'prescripcion_core',
          title: 'Prescripción',
          fields: [
            {
              key: 'recetaMedicamentos',
              label: 'Medicamentos',
              type: 'object-array',
              inheritanceMode: 'fresh_capture',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'presentacion', label: 'Presentación', type: 'text' },
                { key: 'dosis', label: 'Dosis', type: 'text' },
                {
                  key: 'via',
                  label: 'Vía',
                  type: 'select',
                  options: administrationRouteOptions,
                },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
                { key: 'duracion', label: 'Duración', type: 'text' },
                {
                  key: 'tipoMedicamento',
                  label: 'Tipo de medicamento',
                  type: 'select',
                  options: prescriptionMedicationTypeOptions,
                },
                { key: 'intervaloHoras', label: 'Intervalo (horas)', type: 'number' },
                { key: 'duracionDias', label: 'Duración (días)', type: 'number' },
                {
                  key: 'indicaciones',
                  label: 'Indicaciones por medicamento',
                  type: 'text',
                },
                { key: 'advertencias', label: 'Advertencias', type: 'text' },
              ],
            },
            {
              key: 'recetaIndicacionesGenerales',
              label: 'Indicaciones generales',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'indicaciones_alarmas',
          title: 'Indicaciones y signos de alarma',
          fields: [
            {
              key: 'recetaSignosAlarma',
              label: 'Signos de alarma',
              type: 'string-array',
              itemAddLabel: 'Agregar signo de alarma',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'recetaSeveridadAlarma',
              label: 'Severidad',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: alarmSeverityOptions,
            },
            {
              key: 'recetaProximaCita',
              label: 'Próxima cita',
              type: 'date',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'educacion_paciente',
          title: 'Educación al paciente',
          fields: [
            {
              key: 'recetaInformacionProporcionada',
              label: 'Información proporcionada',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'recetaIndicacionesNoFarmacologicas',
              label: 'Indicaciones no farmacológicas',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'recetaComprensionPaciente',
              label: 'Comprensión del paciente',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: consultationPrescriptionPatientComprehensionOptions,
            },
            {
              key: 'recetaMaterialEducativo',
              label: 'Material educativo entregado',
              type: 'string-array',
              inheritanceMode: 'fresh_capture',
              itemAddLabel: 'Agregar material',
            },
          ],
        },
        {
          key: 'plan_seguimiento',
          title: 'Plan de seguimiento',
          fields: [
            {
              key: 'recetaSeguimientoFecha',
              label: 'Fecha próxima cita',
              type: 'date',
              inheritanceMode: 'fresh_capture',
            },
            {
              key: 'recetaSeguimientoTipo',
              label: 'Tipo de seguimiento',
              type: 'select',
              inheritanceMode: 'fresh_capture',
              options: followUpTypeOptions,
            },
            {
              key: 'recetaSeguimientoInstrucciones',
              label: 'Instrucciones',
              type: 'textarea',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
        {
          key: 'datos_legales_receta',
          title: 'Datos legales y firma',
          fields: [
            {
              key: 'recetaInstitucionEmisora',
              label: 'Institución emisora',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaRfcMedico',
              label: 'RFC médico',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaLicenciaSanitaria',
              label: 'Licencia sanitaria',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaNombreProfesional',
              label: 'Nombre del profesional',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaCedulaProfesional',
              label: 'Cédula',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaEspecialidadProfesional',
              label: 'Especialidad',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'recetaLugarAtencion',
              label: 'Lugar de atención',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'firmarReceta',
              label: 'Firma',
              type: 'action',
              actionLabel: 'Firmar receta',
              inheritanceMode: 'system',
            },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description:
        'Documentos clínicos del episodio con firma, PDF y control documental.',
      icon: FileText,
      sections: [
        {
          key: 'resumen_documental',
          title: 'Resumen documental',
          fields: [
            { key: 'resumenDocumental', label: 'Resumen', type: 'textarea' },
            {
              key: 'pendientesFirma',
              label: 'Pendientes de firma',
              type: 'textarea',
            },
            {
              key: 'observacionesDocumentales',
              label: 'Observaciones documentales',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
  EMERGENCY: [
    {
      key: 'Triage',
      title: 'Triage',
      description: 'Ingreso, prioridad, tiempos y estado inicial.',
      icon: Siren,
      sections: [
        {
          key: 'triage_tipo',
          title: 'Encabezado',
          fields: [
            { key: 'tipoTriaje', label: 'Tipo de triaje', type: 'readonly' },
          ],
        },
        {
          key: 'triage_prioridad',
          title: 'Sistema de triage y prioridad',
          fields: [
            {
              key: 'sistemaTriage',
              label: 'Sistema de triage',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opcion' },
                { value: 'MANCHESTER', label: 'Manchester' },
                { value: 'ESI', label: 'ESI' },
                { value: 'LOCAL', label: 'Escala local' },
              ],
            },
            {
              key: 'nivelPrioridadTriage',
              label: 'Nivel de prioridad 1-5',
              type: 'select',
              options: triagePriorityOptions,
            },
            { key: 'tiempoObjetivoAtencion', label: 'Tiempo objetivo de atención', type: 'readonly' },
          ],
        },
        {
          key: 'triage_llegada',
          title: 'Datos de llegada y tiempos',
          fields: [
            { key: 'fechaLlegada', label: 'Fecha de llegada', type: 'datetime-local' },
            { key: 'horaLlegada', label: 'Hora de llegada', type: 'datetime-local' },
            { key: 'horaTriage', label: 'Hora de triage', type: 'datetime-local' },
            { key: 'horaPrimerContactoMedico', label: 'Hora primer contacto médico', type: 'datetime-local' },
            { key: 'tiempoEspera', label: 'Tiempo de espera', type: 'readonly' },
            {
              key: 'modoLlegada',
              label: 'Modo de llegada',
              type: 'select',
              options: triageArrivalModeOptions,
            },
            { key: 'acompanante', label: 'Acompañante', type: 'text' },
          ],
        },
        {
          key: 'triage_motivo',
          title: 'Motivo de urgencia',
          fields: [
            { key: 'motivoPrincipal', label: 'Motivo principal', type: 'text' },
            {
              key: 'categoriaMotivo',
              label: 'Categoría',
              type: 'select',
              options: triageCategoryOptions,
            },
            {
              key: 'descripcionMotivo',
              label: 'Descripción',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'triage_discriminadores',
          title: 'Discriminadores clínicos',
          fields: [
            ...triageClinicalDiscriminatorFields.map((field) => ({
              ...field,
              type: 'checkbox' as const,
            })),
            {
              key: triageOtherClinicalDiscriminatorFieldKey,
              label: 'Especificar otro discriminador clínico',
              type: 'textarea',
            },
            { key: 'banderaRojaAutomatica', label: 'Bandera roja automática', type: 'readonly' },
          ],
        },
        {
          key: 'triage_signos_vitales',
          title: 'Signos vitales',
          fields: [
            { key: 'taSistolica', label: 'TA sistólica (mmHg)', type: 'number' },
            { key: 'taDiastolica', label: 'TA diastólica (mmHg)', type: 'number' },
            { key: 'fc', label: 'FC (lpm)', type: 'number' },
            { key: 'fr', label: 'FR (rpm)', type: 'number' },
            { key: 'temp', label: 'Temperatura (°C)', type: 'number' },
            { key: 'spo2', label: 'SpO₂ (%)', type: 'number' },
            { key: 'peso', label: 'Peso (kg)', type: 'number' },
            { key: 'glucosa', label: 'Glucosa capilar (mg/dL)', type: 'number' },
            { key: 'eva', label: 'EVA dolor (0-10)', type: 'number' },
            { key: 'llenadoCapilar', label: 'Llenado capilar (segundos)', type: 'text' },
          ],
        },
        {
          key: 'triage_estado_rapido',
          title: 'Estado clínico rápido',
          fields: emergencyTriageClinicalQuickStateFields,
        },
        {
          key: 'triage_glasgow',
          title: 'Glasgow',
          fields: [
            { key: 'glasgowE', label: 'Ocular (E)', type: 'select', options: glasgowEyeOptions },
            { key: 'glasgowV', label: 'Verbal (V)', type: 'select', options: glasgowVerbalOptions },
            { key: 'glasgowM', label: 'Motora (M)', type: 'select', options: glasgowMotorOptions },
            { key: 'glasgowTotal', label: 'Total Glasgow', type: 'readonly' },
          ],
        },
        {
          key: 'triage_news_alertas',
          title: 'NEWS2 y alertas automáticas',
          fields: [
            { key: 'news2Total', label: 'NEWS2', type: 'readonly' },
          ],
        },
        {
          key: 'triage_destino',
          title: 'Destino y reevaluación',
          fields: [
            { key: 'destinoInicial', label: 'Destino inicial', type: 'select', options: triageDestinationOptions, required: true },
            { key: 'requiereReevaluacion', label: 'Requiere reevaluación', type: 'select', options: triageReevaluationRequiredOptions, required: true },
            { key: 'horaReevaluacion', label: 'Hora de reevaluación', type: 'time', required: true },
            { key: 'nuevaPrioridadReevaluacion', label: 'Nueva prioridad', type: 'select', options: triageReevaluationPriorityOptions, required: true },
            { key: 'motivoCambioReevaluacion', label: 'Motivo del cambio', type: 'textarea', required: true },
          ],
        },
        {
          key: 'triage_responsable',
          title: 'Responsable de triaje',
          fields: [
            { key: 'triageResponsableNombre', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'triageResponsableCedula', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'triageResponsableTipo', label: 'Tipo de responsable', type: 'readonly', inheritanceMode: 'system' },
            { key: 'triageResponsableTurno', label: 'Turno', type: 'readonly', inheritanceMode: 'system' },
            { key: 'triageResponsableArea', label: 'Área', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'triage_procedencia_ingreso',
          title: 'Procedencia e ingreso',
          fields: [
            { key: 'procedenciaIngreso', label: 'Procedencia', type: 'select', options: triageOriginOptions, required: true },
            { key: 'ingresoPorReferencia', label: 'Ingreso por referencia', type: 'select', options: triageReferenceAdmissionOptions, required: true },
            { key: 'unidadQueRefiere', label: 'Unidad que refiere', type: 'text', required: true },
            { key: 'parentescoAcompanante', label: 'Parentesco', type: 'select', options: triageCompanionRelationshipOptions },
            { key: 'telefonoAcompanante', label: 'Teléfono del acompañante', type: 'text' },
            { key: 'documentoReferencia', label: 'Folio o descripción breve', type: 'text' },
          ],
        },
        {
          key: 'triage_estado_inicial',
          title: 'Estado general y mental inicial',
          fields: [
            { key: 'estadoGeneralInicial', label: 'Estado general inicial', type: 'select', options: triageInitialGeneralConditionOptions, required: true },
            { key: 'estadoMentalInicial', label: 'Estado mental inicial', type: 'select', options: triageInitialMentalStatusOptions, required: true },
            { key: 'riesgoVitalAparente', label: 'Riesgo vital aparente', type: 'select', options: triageApparentLifeRiskOptions, required: true },
            { key: 'aislamientoRequerido', label: 'Aislamiento requerido', type: 'select', options: triageRequiredIsolationOptions, required: true },
          ],
        },
        {
          key: 'triage_legal',
          title: 'Datos legales',
          fields: [
            { key: 'triageLegalMedico', label: 'Médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'triageLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarTriage', label: 'Firma', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Nota inicial',
      title: 'Nota inicial',
      description: 'Subjetivo, objetivo, análisis, plan y resolución inicial.',
      icon: FilePlus,
      sections: [
        {
          key: 'nota_inicial_tipo',
          title: 'Tipo de registro',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly' },
          ],
        },
        {
          key: 'nota_inicial_subjetivo',
          title: 'S - Subjetivo',
          fields: [
            { key: 'motivoAtencion', label: 'Motivo de atención', type: 'textarea' },
            { key: 'horaInicioSintomas', label: 'Hora inicio síntomas', type: 'datetime-local' },
            { key: 'tipoEvento', label: 'Tipo evento', type: 'select', options: emergencyEventTypeOptions },
            { key: 'modoLlegadaNota', label: 'Modo de llegada', type: 'select', options: triageArrivalModeOptions },
            { key: 'evolucionSubjetiva', label: 'Evolución', type: 'textarea' },
            { key: 'factoresSubjetivos', label: 'Factores', type: 'textarea' },
            { key: 'eventosPrevios', label: 'Eventos previos', type: 'textarea' },
            { key: 'antecedentesNota', label: 'Antecedentes', type: 'textarea' },
          ],
        },
        {
          key: 'nota_inicial_objetivo',
          title: 'O - Objetivo / Exploración física',
          fields: [
            { key: 'habitusExteriorNota', label: 'Habitus exterior', type: 'textarea', required: true },
            { key: 'exploracionCardiovascularNota', label: 'Cardiovascular', type: 'textarea', required: true },
            { key: 'exploracionRespiratoriaNota', label: 'Respiratorio', type: 'textarea', required: true },
            { key: 'exploracionNeurologicaNota', label: 'Neurológico', type: 'textarea', required: true },
            { key: 'exploracionAbdomenNota', label: 'Abdomen', type: 'textarea' },
            { key: 'exploracionExtremidadesNota', label: 'Extremidades', type: 'textarea' },
            { key: 'taSistolicaNota', label: 'TA sistólica (mmHg)', type: 'number' },
            { key: 'taDiastolicaNota', label: 'TA diastólica (mmHg)', type: 'number' },
            { key: 'fcNota', label: 'FC (lpm)', type: 'number' },
            { key: 'frNota', label: 'FR (rpm)', type: 'number' },
            { key: 'spo2Nota', label: 'SpO₂ (%)', type: 'number' },
            { key: 'tempNota', label: 'Temperatura (°C)', type: 'number' },
            { key: 'evaNota', label: 'EVA dolor (0-10)', type: 'number' },
            { key: 'glucosaNota', label: 'Glucosa (mg/dL)', type: 'number' },
            { key: 'glasgowNota', label: 'Glasgow', type: 'number' },
          ],
        },
        {
          key: 'nota_inicial_analisis',
          title: 'A - Análisis',
          fields: [
            { key: 'killipNota', label: 'Killip', type: 'select', options: killipOptions },
            { key: 'timiNota', label: 'TIMI', type: 'select', options: scoreRiskOptions },
            { key: 'heartNota', label: 'HEART', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoVitalNota', label: 'Riesgo vital', type: 'select', options: riskClassificationOptions },
            {
              key: 'estudiosAnalisis',
              label: 'Estudios',
              type: 'textarea',
            },
            { key: 'diagnosticoNota', label: 'Diagnóstico', type: 'text' },
            { key: 'cie10Nota', label: 'CIE-10', type: 'text' },
            { key: 'estadoClinicoNota', label: 'Estado clínico', type: 'select', options: clinicalStatusOptions },
          ],
        },
        {
          key: 'nota_inicial_plan',
          title: 'P - Plan',
          fields: [
            { key: 'medicamentosPlan', label: 'Medicamentos', type: 'textarea' },
            { key: 'estudiosPlan', label: 'Estudios', type: 'textarea' },
            { key: 'intervencionesPlan', label: 'Intervenciones', type: 'textarea' },
            { key: 'interconsultasPlan', label: 'Interconsultas', type: 'textarea' },
            { key: 'destinoPlan', label: 'Destino', type: 'select', options: triageDestinationOptions },
            { key: 'horaDecision', label: 'Hora decisión', type: 'datetime-local' },
          ],
        },
        {
          key: 'nota_inicial_consentimiento',
          title: 'Consentimiento informado',
          fields: [
            { key: 'consentimientoUrgenciasNota', label: 'Consentimiento de urgencias', type: 'select', options: emergencyInitialNoteConsentOptions, required: true },
            { key: 'tipoConsentimientoNota', label: 'Tipo de consentimiento', type: 'select', options: emergencyInitialNoteConsentTypeOptions, required: true },
            { key: 'observacionesConsentimientoNota', label: 'Observaciones de consentimiento', type: 'textarea' },
          ],
        },
        {
          key: 'nota_inicial_tiempos',
          title: 'Tiempos',
          fields: [
            { key: 'llegadaVisual', label: 'Llegada', type: 'readonly' },
            { key: 'triageVisual', label: 'Triage', type: 'readonly' },
            { key: 'inicioAtencionVisual', label: 'Inicio atención', type: 'readonly' },
            { key: 'decisionVisual', label: 'Decisión', type: 'readonly' },
          ],
        },
        {
          key: 'nota_inicial_alertas',
          title: 'Alertas',
          fields: [
            { key: 'alertasTriage', label: 'Alertas de triage', type: 'readonly' },
          ],
        },
        {
          key: 'nota_inicial_pronostico',
          title: 'Pronóstico',
          fields: [
            { key: 'pronosticoNota', label: 'Pronóstico', type: 'select', options: emergencyInitialNotePrognosisOptions, required: true },
            { key: 'estadoMentalNota', label: 'Estado mental del paciente', type: 'select', options: triageInitialMentalStatusOptions },
            { key: 'resumenPronostico', label: 'Resumen del interrogatorio', type: 'textarea', required: true },
          ],
        },
        {
          key: 'nota_inicial_procedimientos',
          title: 'Procedimientos',
          fields: [
            {
              key: 'procedimientosUrgencias',
              label: 'Procedimientos',
              type: 'object-array',
              itemAddLabel: 'Agregar procedimiento',
              itemFields: [
                { key: 'procedimiento', label: 'Procedimiento', type: 'text' },
                { key: 'hora', label: 'Hora', type: 'datetime-local' },
                { key: 'responsable', label: 'Responsable', type: 'text' },
                { key: 'observaciones', label: 'Observaciones', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'nota_inicial_destino',
          title: 'Destino',
          fields: [
            { key: 'servicioDestino', label: 'Servicio destino', type: 'text' },
            { key: 'unidadDestino', label: 'Unidad', type: 'text' },
            { key: 'medicoReceptor', label: 'Médico receptor', type: 'text' },
          ],
        },
        {
          key: 'nota_inicial_firma',
          title: 'Firma',
          fields: [
            { key: 'notaInicialLegalMedico', label: 'Médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'notaInicialLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarNotaInicial', label: 'Firma', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Hoja de enfermería',
      title: 'Hoja de enfermería',
      description: 'Registro independiente de enfermería en urgencias.',
      icon: HeartPulse,
      sections: [
        {
          key: 'enfermeria_urg_valoracion',
          title: 'Valoración de enfermería',
          fields: [
            { key: 'habitusExteriorEnfUrg', label: 'Habitus exterior', type: 'textarea', required: true },
            { key: 'dolorEvaEnfUrg', label: 'Valoración del dolor (EVA 0-10)', type: 'number', required: true },
            { key: 'riesgoCaidasEnfUrg', label: 'Riesgo de caídas', type: 'select', options: nursingFallRiskOptions, required: true },
          ],
        },
        {
          key: 'enfermeria_urg_intervenciones',
          title: 'Intervenciones',
          fields: [
            {
              key: 'medicacionAdministradaEnfUrg',
              label: 'Medicación administrada',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'horaAdministrada', label: 'Hora administrada', type: 'time' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                  { value: '', label: 'Selecciona una opción' },
                  { value: 'ADMINISTRADO', label: 'Administrado' },
                  { value: 'NO_ADMINISTRADO', label: 'No administrado' },
                  { value: 'DIFERIDO', label: 'Diferido' },
                ] },
                { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
                { key: 'responsable', label: 'Responsable', type: 'readonly', inheritanceMode: 'system' },
              ],
            },
            {
              key: 'procedimientosEnfermeriaEnfUrg',
              label: 'Procedimientos de enfermería realizados',
              type: 'object-array',
              itemAddLabel: 'Agregar procedimiento',
              itemFields: [
                { key: 'procedimiento', label: 'Procedimiento', type: 'text' },
                { key: 'hora', label: 'Hora', type: 'time' },
                { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
                { key: 'responsable', label: 'Responsable', type: 'readonly', inheritanceMode: 'system' },
              ],
            },
            { key: 'observacionesEnfermeriaEnfUrg', label: 'Observaciones de enfermería', type: 'textarea' },
          ],
        },
        {
          key: 'enfermeria_urg_firma',
          title: 'Firma',
          fields: [
            { key: 'elaboroEnfUrg', label: 'Elaboró', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaEnfUrg', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarEnfermeriaUrg', label: 'Firma', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Evolución',
      title: 'Evolución en urgencias',
      description: 'Seguimiento clínico, órdenes, estudios y eventos.',
      icon: Activity,
      sections: [
        {
          key: 'evolucion_urg_tipo',
          title: 'Tipo de registro',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly' },
          ],
        },
        {
          key: 'evolucion_urg_datos',
          title: 'Datos de la nota',
          fields: [
            { key: 'fechaEvolucionUrg', label: 'Fecha', type: 'date' },
            { key: 'horaEvolucionUrg', label: 'Hora', type: 'time' },
            { key: 'diaEvolucionUrg', label: 'Día de evolución', type: 'readonly' },
            { key: 'estadoClinicoEvolucionUrg', label: 'Estado clínico', type: 'select', options: clinicalStatusOptions },
          ],
        },
        {
          key: 'evolucion_urg_subjetivo',
          title: 'S - Subjetivo',
          fields: [
            { key: 'referenciaPacienteUrg', label: 'Referencia del paciente', type: 'textarea' },
          ],
        },
        {
          key: 'evolucion_urg_objetivo',
          title: 'O - Objetivo',
          fields: [
            buildEmergencyEvolutionObjectiveVitalSignField('taSistolicaEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('taDiastolicaEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('fcEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('frEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('tempEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('spo2EvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('evaEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('glucosaEvolUrg'),
            buildEmergencyEvolutionObjectiveVitalSignField('glasgowEvolUrg'),
            { key: 'exploracionDirigidaUrg', label: 'Exploración física dirigida', type: 'textarea' },
          ],
        },
        {
          key: 'evolucion_urg_resultados',
          title: 'Resultados de estudios',
          fields: [
            { key: 'resultadosEstudiosIntegrados', label: 'Resultados integrados', type: 'readonly' },
          ],
        },
        {
          key: 'evolucion_urg_analisis',
          title: 'A - Análisis',
          fields: [
            {
              key: 'diagnosticosEvolucionUrg',
              label: 'Diagnósticos',
              type: 'object-array',
              itemAddLabel: 'Agregar diagnóstico',
              itemRemoveLabel: 'Eliminar diagnóstico',
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                { key: 'tipo', label: 'Tipo de diagnóstico', type: 'select', options: emergencyEvolutionDiagnosisTypeOptions },
              ],
            },
          ],
        },
        {
          key: 'evolucion_urg_eventos',
          title: 'Eventos adversos / complicaciones',
          fields: [
            { key: 'eventosAdversosUrg', label: 'Eventos adversos', type: 'textarea' },
            { key: 'complicacionesUrg', label: 'Complicaciones', type: 'textarea' },
          ],
        },
        {
          key: 'evolucion_urg_plan',
          title: 'P - Plan',
          fields: [
            { key: 'tratamientoEvolUrg', label: 'Tratamiento', type: 'textarea' },
            { key: 'estudiosPendientesUrg', label: 'Estudios pendientes', type: 'textarea' },
            { key: 'interconsultasEvolUrg', label: 'Interconsultas', type: 'textarea' },
            { key: 'seguimientoEvolUrg', label: 'Seguimiento', type: 'textarea' },
          ],
        },
        {
          key: 'evolucion_urg_legales',
          title: 'Campos legales',
          fields: [
            { key: 'consentimientoVigenteUrg', label: 'Consentimiento vigente', type: 'select', options: consentStatusOptions },
            { key: 'informacionBrindadaUrg', label: 'Información brindada', type: 'textarea' },
          ],
        },
        {
          key: 'evolucion_urg_justificacion',
          title: 'Justificación clínica (NOM-004)',
          fields: [
            { key: 'justificacionClinicaNom004', label: 'Justificación clínica', type: 'textarea' },
            { key: 'respuestaTratamientoUrg', label: 'Respuesta al tratamiento', type: 'select', options: treatmentResponseOptions },
          ],
        },
        {
          key: 'evolucion_urg_enfermeria',
          title: 'Hoja de enfermería',
          fields: [],
        },
        {
          key: 'evolucion_urg_auxiliares',
          title: 'Servicios auxiliares de diagnóstico',
          fields: [
            {
              key: 'resultadosAuxiliaresDiagnosticoUrg',
              label: 'Resultados de estudios',
              type: 'object-array',
              itemAddLabel: 'Agregar resultado de estudio',
              itemRemoveLabel: 'Eliminar resultado',
              itemFields: [
                { key: 'tipoEstudio', label: 'Tipo de estudio', type: 'select', options: emergencyEvolutionDiagnosticStudyTypeOptions },
                { key: 'otroEstudio', label: 'Estudio realizado', type: 'text' },
                { key: 'problemaEstudio', label: 'Problema en estudio', type: 'textarea' },
                { key: 'resultado', label: 'Resultado', type: 'textarea' },
                { key: 'interpretacionClinica', label: 'Interpretación clínica', type: 'textarea' },
                { key: 'incidentes', label: 'Incidentes', type: 'textarea' },
                { key: 'fechaHoraEstudio', label: 'Fecha y hora del estudio', type: 'datetime-local' },
              ],
            },
          ],
        },
        {
          key: 'evolucion_urg_firma',
          title: 'Datos legales y firma',
          fields: [
            { key: 'evolucionUrgLegalNombre', label: 'Nombre', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionUrgLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionUrgLegalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'evolucionUrgLegalLugar', label: 'Lugar', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarEvolucionUrg', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Órdenes / Indicaciones',
      title: 'Órdenes e indicaciones',
      description: 'Tratamiento, medicamentos, estudios y trazabilidad.',
      icon: ClipboardList,
      sections: [
        {
          key: 'ordenes_urg_tipo',
          title: 'Tipo de registro',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly' },
          ],
        },
        {
          key: 'ordenes_urg_medicamentos',
          title: 'Medicamentos',
          fields: [
            {
              key: 'medicamentosOrdenesUrg',
              label: 'Medicamentos',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'dosis', label: 'Dosis', type: 'text' },
                { key: 'via', label: 'Vía', type: 'select', options: administrationRouteOptions },
                { key: 'frecuencia', label: 'Frecuencia', type: 'select', options: orderFrequencyOptions },
                { key: 'duracion', label: 'Duración', type: 'select', options: orderDurationOptions },
                { key: 'indicacion', label: 'Indicación', type: 'text' },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: orderPriorityOptions },
              ],
            },
            { key: 'alertaAlergiasOrdenes', label: 'Alergias', type: 'readonly' },
            { key: 'alertaDuplicidadOrdenes', label: 'Duplicidad terapéutica', type: 'readonly' },
            { key: 'alertaDosisOrdenes', label: 'Dosis segura', type: 'readonly' },
          ],
        },
        {
          key: 'ordenes_urg_soluciones',
          title: 'Soluciones intravenosas',
          fields: [
            {
              key: 'solucionesIntravenosasOrdenes',
              label: 'Soluciones intravenosas',
              type: 'object-array',
              itemAddLabel: 'Agregar solución',
              itemFields: [
                { key: 'tipoSolucion', label: 'Tipo de solución', type: 'text' },
                { key: 'volumen', label: 'Volumen', type: 'number' },
                { key: 'velocidad', label: 'Velocidad', type: 'text' },
                { key: 'duracion', label: 'Duración', type: 'select', options: orderDurationOptions },
                { key: 'medicamentoAnadido', label: 'Medicamento añadido', type: 'text' },
                { key: 'indicaciones', label: 'Indicaciones', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'ordenes_urg_estudios',
          title: 'Estudios solicitados',
          fields: [
            {
              key: 'estudiosSolicitadosOrdenes',
              label: 'Estudios solicitados',
              type: 'object-array',
              itemAddLabel: 'Agregar estudio',
              itemFields: [
                { key: 'tipo', label: 'Tipo', type: 'select', options: studyTypeOptions },
                { key: 'estudio', label: 'Estudio', type: 'text' },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: orderPriorityOptions },
                { key: 'justificacion', label: 'Justificación', type: 'text' },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
                { key: 'estado', label: 'Estado', type: 'select', options: orderStatusOptions },
              ],
            },
          ],
        },
        {
          key: 'ordenes_urg_cuidados',
          title: 'Cuidados especiales',
          fields: [
            { key: 'cuidadosEspecialesOrdenes', label: 'Cuidados especiales', type: 'textarea' },
          ],
        },
        {
          key: 'ordenes_urg_monitoreo',
          title: 'Monitoreo',
          fields: [
            { key: 'monitoreoOrdenes', label: 'Monitoreo', type: 'textarea' },
          ],
        },
        {
          key: 'ordenes_urg_oxigeno',
          title: 'Oxígeno',
          fields: [
            { key: 'oxigenoTipoOrdenes', label: 'Oxígeno - tipo', type: 'select', options: oxygenTypeOptions },
            { key: 'oxigenoFlujoOrdenes', label: 'Oxígeno - flujo', type: 'text' },
            { key: 'oxigenoMetaOrdenes', label: 'Oxígeno - meta', type: 'text' },
          ],
        },
        {
          key: 'ordenes_urg_dieta',
          title: 'Dieta',
          fields: [
            { key: 'dietaOrdenes', label: 'Dieta', type: 'select', options: dietOptions },
          ],
        },
        {
          key: 'ordenes_urg_reposo',
          title: 'Reposo',
          fields: [
            { key: 'reposoOrdenes', label: 'Reposo', type: 'select', options: restOptions },
          ],
        },
        {
          key: 'ordenes_urg_balance',
          title: 'Balance hídrico',
          fields: [
            { key: 'controlLiquidosOrdenes', label: 'Control de líquidos', type: 'select', options: fluidControlOptions },
          ],
        },
        {
          key: 'ordenes_urg_indicaciones_generales',
          title: 'Indicaciones generales',
          fields: [
            { key: 'indicacionesGeneralesOrdenes', label: 'Indicaciones generales', type: 'textarea' },
          ],
        },
        {
          key: 'ordenes_urg_trazabilidad',
          title: 'Estado de órdenes y trazabilidad',
          fields: [
            { key: 'estadoOrdenesTrazabilidad', label: 'Trazabilidad', type: 'readonly' },
          ],
        },
        {
          key: 'ordenes_urg_transfusion',
          title: 'Registro de transfusión',
          fields: [
            { key: 'transfusionAplica', label: 'Aplica transfusión', type: 'checkbox' },
            { key: 'transfusionTipoHemoderivado', label: 'Tipo de hemoderivado', type: 'select', options: transfusionProductOptions },
            { key: 'transfusionOtroHemoderivado', label: 'Otro hemoderivado', type: 'text' },
            { key: 'transfusionUnidades', label: 'Unidades', type: 'number' },
            { key: 'transfusionVolumen', label: 'Volumen (mL)', type: 'number' },
            { key: 'transfusionHoraInicio', label: 'Fecha y hora de inicio', type: 'datetime-local' },
            { key: 'transfusionHoraFin', label: 'Fecha y hora de término', type: 'datetime-local' },
            { key: 'transfusionReaccionAdversa', label: 'Reacción adversa', type: 'select', options: adverseReactionOptions },
            { key: 'transfusionReacciones', label: 'Descripción de reacción adversa', type: 'textarea' },
            { key: 'transfusionMedicoIndica', label: 'Médico que indica', type: 'readonly', inheritanceMode: 'system' },
            { key: 'transfusionPersonalAplica', label: 'Personal que aplica', type: 'text' },
            { key: 'transfusionServicioAplica', label: 'Servicio que aplica', type: 'text' },
            { key: 'transfusionObservaciones', label: 'Observaciones', type: 'textarea' },
          ],
        },
        {
          key: 'ordenes_urg_legal',
          title: 'Datos legales y firma',
          fields: [
            { key: 'ordenesLegalMedico', label: 'Nombre del médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'ordenesLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'ordenesLegalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'ordenesLegalLugar', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarOrdenesUrg', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Interconsultas',
      title: 'Interconsultas',
      description: 'Solicitud, respuesta y auditoría de tiempos.',
      icon: MessagesSquare,
      sections: [
        {
          key: 'interconsulta_tipo',
          title: 'Tipo de registro',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly' },
          ],
        },
        {
          key: 'interconsulta_solicitud',
          title: 'Solicitud de interconsulta',
          fields: [
            { key: 'fechaInterconsulta', label: 'Fecha', type: 'date' },
            { key: 'horaInterconsulta', label: 'Hora', type: 'time' },
            { key: 'medioNotificacionInterconsulta', label: 'Medio de notificación', type: 'select', options: notificationMediumOptions },
            { key: 'medicoSolicitanteInterconsulta', label: 'Médico solicitante', type: 'readonly' },
            { key: 'cedulaSolicitanteInterconsulta', label: 'Cédula profesional', type: 'readonly' },
            { key: 'servicioSolicitanteInterconsulta', label: 'Servicio solicitante', type: 'readonly' },
            { key: 'servicioInterconsultado', label: 'Servicio interconsultado', type: 'select', options: emergencyConsultationServiceOptions },
          ],
        },
        {
          key: 'interconsulta_prioridad',
          title: 'Prioridad y tiempos',
          fields: [
            { key: 'prioridadInterconsulta', label: 'Prioridad', type: 'select', options: consultationPriorityOptions },
            { key: 'tiempoObjetivoInterconsulta', label: 'Tiempo objetivo', type: 'readonly' },
            { key: 'estatusInterconsulta', label: 'Estatus', type: 'select', options: consultationStatusOptions },
          ],
        },
        {
          key: 'interconsulta_motivo',
          title: 'Motivo y resumen clínico',
          fields: [
            { key: 'motivoInterconsulta', label: 'Motivo de interconsulta', type: 'textarea' },
            { key: 'resumenClinicoInterconsulta', label: 'Resumen clínico relevante', type: 'textarea' },
            { key: 'diagnosticoRelacionadoInterconsulta', label: 'Diagnóstico relacionado', type: 'text' },
            { key: 'cie10Interconsulta', label: 'CIE-10', type: 'readonly' },
          ],
        },
        {
          key: 'interconsulta_respuesta',
          title: 'Respuesta del interconsultante',
          fields: [
            { key: 'medicoInterconsultante', label: 'Médico interconsultante', type: 'text' },
            { key: 'cedulaInterconsultante', label: 'Cédula', type: 'text' },
            { key: 'diagnosticoInterconsultante', label: 'Diagnóstico del interconsultante', type: 'textarea' },
            { key: 'conductaSugerida', label: 'Conducta sugerida', type: 'textarea' },
            { key: 'seguimientoRecomendado', label: 'Seguimiento recomendado', type: 'textarea' },
          ],
        },
        {
          key: 'interconsulta_decision',
          title: 'Decisión y cierre',
          fields: [
            { key: 'decisionInterconsulta', label: 'Decisión', type: 'select', options: consultationDecisionOptions },
            { key: 'ordenesAsociadasInterconsulta', label: 'Estudios / órdenes asociados', type: 'textarea' },
          ],
        },
        {
          key: 'interconsulta_auditoria',
          title: 'Auditoría de tiempos',
          fields: [
            { key: 'horaSolicitudInterconsulta', label: 'Hora solicitud', type: 'readonly' },
            { key: 'horaRecepcionInterconsulta', label: 'Hora recepción', type: 'datetime-local' },
            { key: 'horaRespuestaInterconsulta', label: 'Hora respuesta', type: 'datetime-local' },
            { key: 'tiempoRespuestaInterconsulta', label: 'Tiempo de respuesta', type: 'readonly' },
          ],
        },
        {
          key: 'interconsulta_legal',
          title: 'Datos legales y firma',
          fields: [
            { key: 'interconsultaLegalNombre', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'interconsultaLegalCedula', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'interconsultaLegalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'interconsultaLegalLugar', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarInterconsulta', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Egreso',
      title: 'Egreso de urgencias',
      description: 'Resumen clínico, indicaciones, educación y eventos legales si aplican.',
      icon: FileCheck,
      sections: [
        {
          key: 'egreso_urg_tipo',
          title: 'Tipo de registro',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly' },
          ],
        },
        {
          key: 'egreso_urg_destino',
          title: 'Tipo y destino de egreso',
          fields: [
            { key: 'tipoEgresoUrg', label: 'Tipo de egreso', type: 'select', options: emergencyDischargeTypeOptions },
            { key: 'destinoEgresoUrg', label: 'Destino', type: 'select', options: emergencyDischargeDestinationOptions },
            { key: 'servicioReceptorUrg', label: 'Servicio receptor', type: 'select', options: emergencyConsultationServiceOptions },
            { key: 'medicoReceptorUrg', label: 'Médico receptor', type: 'text' },
            { key: 'fechaHoraEgresoUrg', label: 'Fecha y hora de egreso', type: 'datetime-local' },
          ],
        },
        {
          key: 'egreso_urg_resumen',
          title: 'Resumen clínico estructurado',
          fields: [
            { key: 'generarResumenEgresoUrg', label: 'Resumen automático', type: 'action', actionLabel: 'Generar resumen automático' },
            { key: 'motivoIngresoEgresoUrg', label: 'Motivo de ingreso', type: 'textarea' },
            { key: 'diagnosticoEgresoUrg', label: 'Diagnóstico de egreso', type: 'text' },
            { key: 'cie10EgresoUrg', label: 'CIE-10', type: 'text' },
            { key: 'manejoUrgenciasEgresoUrg', label: 'Manejo realizado en urgencias', type: 'textarea' },
            { key: 'procedimientosRealizadosEgresoUrg', label: 'Procedimientos realizados', type: 'textarea' },
            { key: 'evolucionEstanciaEgresoUrg', label: 'Evolución durante estancia', type: 'textarea' },
            { key: 'estadoAlEgresoUrg', label: 'Estado al egreso', type: 'select', options: emergencyDischargeConditionOptions },
          ],
        },
        {
          key: 'egreso_urg_indicaciones',
          title: 'Indicaciones de egreso',
          fields: [
            { key: 'medicamentosEgresoUrg', label: 'Medicamentos al egreso', type: 'textarea' },
            { key: 'cuidadosGeneralesEgresoUrg', label: 'Cuidados generales', type: 'textarea' },
            { key: 'cuidadosEspecificosEgresoUrg', label: 'Cuidados específicos', type: 'textarea' },
            { key: 'dietaEgresoUrg', label: 'Dieta', type: 'text' },
            { key: 'actividadFisicaEgresoUrg', label: 'Actividad física', type: 'textarea' },
            { key: 'seguimientoEgresoUrg', label: 'Seguimiento', type: 'textarea' },
          ],
        },
        {
          key: 'egreso_urg_alarma',
          title: 'Signos de alarma',
          fields: [
            { key: 'signosAlarmaEgresoUrg', label: 'Signos de alarma', type: 'textarea' },
          ],
        },
        {
          key: 'egreso_urg_receta_incapacidad',
          title: 'Receta e incapacidad',
          fields: [
            { key: 'recetaAsociadaEgresoUrg', label: 'Receta médica asociada', type: 'readonly' },
            { key: 'justificacionSinRecetaEgresoUrg', label: 'Justificación si no hay receta', type: 'textarea' },
            { key: 'incapacidadOtorgadaUrg', label: 'Incapacidad otorgada', type: 'select', options: yesNoUnknownOptions },
            { key: 'diasIncapacidadUrg', label: 'Días de incapacidad', type: 'number' },
            { key: 'tipoIncapacidadUrg', label: 'Tipo de incapacidad', type: 'select', options: incapacityTypeOptions },
          ],
        },
        {
          key: 'egreso_urg_educacion',
          title: 'Educación al paciente',
          fields: [
            { key: 'educacionOtorgadaEgresoUrg', label: 'Educación otorgada', type: 'textarea' },
            { key: 'comprensionPacienteEgresoUrg', label: 'Comprensión del paciente', type: 'select', options: comprehensionOptions },
          ],
        },
        {
          key: 'egreso_urg_responsable',
          title: 'Responsable del egreso',
          fields: [
            { key: 'medicoResponsableEgresoUrg', label: 'Médico responsable', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaResponsableEgresoUrg', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadResponsableEgresoUrg', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionEgresoUrg', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'fechaHoraFirmaEgresoUrg', label: 'Fecha y hora de firma', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'egreso_urg_traslado',
          title: 'Referencia y traslado',
          fields: [
            { key: 'fechaHoraReferenciaTrasladoUrg', label: 'Fecha y hora de referencia', type: 'datetime-local' },
            { key: 'unidadOrigenTrasladoUrg', label: 'Establecimiento que envía', type: 'text' },
            { key: 'unidadDestinoTrasladoUrg', label: 'Establecimiento receptor', type: 'text' },
            { key: 'taTrasladoUrg', label: 'TA (mmHg)', type: 'text' },
            { key: 'fcTrasladoUrg', label: 'FC (lpm)', type: 'number' },
            { key: 'frTrasladoUrg', label: 'FR (rpm)', type: 'number' },
            { key: 'temperaturaTrasladoUrg', label: 'Temperatura (°C)', type: 'number' },
            { key: 'spo2TrasladoUrg', label: 'SpO₂ (%)', type: 'number' },
            { key: 'diagnosticoTrasladoUrg', label: 'Diagnóstico(s) o problemas clínicos', type: 'textarea' },
            { key: 'resultadosRelevantesTrasladoUrg', label: 'Resultados relevantes de estudios', type: 'textarea' },
            { key: 'tratamientoPrevioTrasladoUrg', label: 'Plan y tratamiento previo', type: 'textarea' },
            { key: 'pronosticoTrasladoUrg', label: 'Pronóstico', type: 'textarea' },
            { key: 'motivoTrasladoUrg', label: 'Motivo del traslado/referencia', type: 'textarea' },
            { key: 'resumenTrasladoUrg', label: 'Resumen clínico para referencia', type: 'textarea' },
            { key: 'medioTrasladoUrg', label: 'Medio de traslado', type: 'select', options: emergencyDischargeTransferMediumOptions },
            { key: 'condicionesTrasladoUrg', label: 'Condiciones de traslado', type: 'textarea' },
            { key: 'medicoReceptorTrasladoUrg', label: 'Médico responsable receptor', type: 'text' },
          ],
        },
        {
          key: 'egreso_urg_consentimiento',
          title: 'Consentimiento informado',
          fields: [
            { key: 'institucionConsentimientoUrg', label: 'Nombre de la institución', type: 'text' },
            { key: 'razonSocialConsentimientoUrg', label: 'Razón social del establecimiento', type: 'text' },
            { key: 'tituloConsentimientoUrg', label: 'Título del documento', type: 'text' },
            { key: 'lugarFechaConsentimientoUrg', label: 'Lugar y fecha', type: 'text' },
            { key: 'actoAutorizadoConsentimientoUrg', label: 'Acto autorizado', type: 'textarea' },
            { key: 'riesgosConsentimientoUrg', label: 'Riesgos esperados', type: 'textarea' },
            { key: 'beneficiosConsentimientoUrg', label: 'Beneficios esperados', type: 'textarea' },
            { key: 'autorizacionContingenciasConsentimientoUrg', label: 'Autorización para contingencias', type: 'textarea' },
            { key: 'nombreAutorizaConsentimientoUrg', label: 'Nombre de quien autoriza', type: 'text' },
            { key: 'relacionAutorizaConsentimientoUrg', label: 'Relación con el paciente', type: 'select', options: emergencyDischargeConsentRelationshipOptions },
            { key: 'testigo1ConsentimientoUrg', label: 'Testigo 1', type: 'text' },
            { key: 'testigo2ConsentimientoUrg', label: 'Testigo 2', type: 'text' },
            { key: 'profesionalActoConsentimientoUrg', label: 'Nombre de quien realiza el acto', type: 'text' },
            { key: 'cedulaProfesionalActoConsentimientoUrg', label: 'Cédula profesional', type: 'text' },
          ],
        },
        {
          key: 'egreso_urg_aviso_ministerio_publico',
          title: 'Aviso al Ministerio Público',
          fields: [
            { key: 'establecimientoAvisoMpUrg', label: 'Nombre/Razón social del establecimiento', type: 'text' },
            { key: 'fechaAvisoMpUrg', label: 'Fecha de elaboración', type: 'date' },
            { key: 'actoNotificadoAvisoMpUrg', label: 'Acto notificado', type: 'select', options: emergencyDischargePublicMinistryNoticeOptions },
            { key: 'agenciaMinisterioPublicoUrg', label: 'Agencia del Ministerio Público', type: 'text' },
            { key: 'descripcionClinicaLegalAvisoMpUrg', label: 'Descripción clínica/legal del evento', type: 'textarea' },
            { key: 'medicoNotificaAvisoMpUrg', label: 'Nombre del médico que notifica', type: 'text' },
            { key: 'cedulaNotificaAvisoMpUrg', label: 'Cédula profesional', type: 'text' },
          ],
        },
        {
          key: 'egreso_urg_certificado_defuncion',
          title: 'Certificado de defunción / muerte fetal',
          fields: [
            { key: 'tipoCertificadoDefuncionUrg', label: 'Tipo de documento', type: 'select', options: emergencyDischargeDeathCertificateTypeOptions },
            { key: 'fechaCertificadoDefuncionUrg', label: 'Fecha de elaboración', type: 'date' },
            { key: 'horaCertificadoDefuncionUrg', label: 'Hora de elaboración', type: 'time' },
            { key: 'copiaExistenteCertificadoDefuncionUrg', label: '¿Se integra copia existente?', type: 'select', options: yesNoOptions },
            { key: 'elaboraCertificadoDefuncionUrg', label: 'Nombre completo de quien elabora', type: 'text' },
            { key: 'cedulaCertificadoDefuncionUrg', label: 'Cédula profesional', type: 'text' },
            { key: 'registroFechaHoraCertificadoDefuncionUrg', label: 'Fecha/hora de registro', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'egreso_urg_firma',
          title: 'Datos legales y firma',
          fields: [
            { key: 'egresoLegalNombre', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'egresoLegalCedula', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'egresoLegalEspecialidad', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'egresoLegalLugar', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarEgresoUrg', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description: 'Resumen y control documental.',
      icon: FileText,
      sections: [
        {
          key: 'documentos_urg',
          title: 'Control documental',
          fields: [
            { key: 'resumenDocumentosUrg', label: 'Resumen', type: 'textarea' },
            {
              key: 'pendientesDocumentalesUrg',
              label: 'Pendientes documentales',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
  HOSPITALIZATION: [
    {
      key: 'Ingreso',
      title: 'Ingreso hospitalario',
      description: 'Admisión, datos administrativos, historia y plan inicial.',
      icon: Hospital,
      sections: [
        {
          key: 'datos_ingreso',
          title: 'Datos de ingreso',
          fields: [
            {
              key: 'tipoRegistro',
              label: 'Tipo de registro',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'tipoIngresoHosp',
              label: 'Tipo de ingreso',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'PROGRAMADO', label: 'Programado' },
                { value: 'URGENTE', label: 'Urgente' },
              ],
            },
            {
              key: 'origenIngresoHosp',
              label: 'Origen del ingreso',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'URGENCIAS', label: 'Urgencias' },
                { value: 'MANUAL', label: 'Manual' },
              ],
            },
            {
              key: 'estadoClinicoIngresoHosp',
              label: 'Estado clínico al ingreso',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'ESTABLE', label: 'Estable' },
                { value: 'GRAVE', label: 'Grave' },
                { value: 'CRITICO', label: 'Crítico' },
              ],
            },
            { key: 'servicioIngresoHosp', label: 'Servicio', type: 'text' },
            { key: 'pisoIngresoHosp', label: 'Piso', type: 'text' },
            { key: 'habitacionIngresoHosp', label: 'Habitación', type: 'text' },
            { key: 'camaIngresoHosp', label: 'Cama', type: 'text' },
            { key: 'fechaIngresoHosp', label: 'Fecha de ingreso', type: 'date' },
            { key: 'horaIngresoHosp', label: 'Hora de ingreso', type: 'time' },
            {
              key: 'tiempoValoracionInicialHosp',
              label: 'Tiempo valoración inicial',
              type: 'text',
            },
            { key: 'referenciaUrgenciasHosp', label: 'Referencia desde Urgencias', type: 'readonly' },
          ],
        },
        {
          key: 'administrativos_ingreso',
          title: 'Datos administrativos de ingreso',
          fields: [
            { key: 'motivoAdministrativoHosp', label: 'Motivo administrativo', type: 'select', options: priorityOptions },
            { key: 'tipoHospitalizacionHosp', label: 'Tipo de hospitalización', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'MEDICA', label: 'Médica' },
              { value: 'QUIRURGICA', label: 'Quirúrgica' },
              { value: 'OBSTETRICA', label: 'Obstétrica' },
              { value: 'PEDIATRICA', label: 'Pediátrica' },
            ] },
            { key: 'prioridadIngresoHosp', label: 'Prioridad de ingreso', type: 'select', options: priorityOptions },
            { key: 'regimenEstanciaHosp', label: 'Régimen de estancia', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'CORTA_ESTANCIA', label: 'Corta estancia' },
              { value: 'HOSPITALIZACION', label: 'Hospitalización' },
              { value: 'TERAPIA_INTERMEDIA', label: 'Terapia intermedia' },
              { value: 'TERAPIA_INTENSIVA', label: 'Terapia intensiva' },
            ] },
            { key: 'medicoAdscritoHosp', label: 'Médico adscrito', type: 'text' },
            { key: 'turnoIngresoHosp', label: 'Turno de ingreso', type: 'select', options: hospitalShiftOptions },
            { key: 'enfermeriaAsignadaHosp', label: 'Enfermería asignada', type: 'text' },
            { key: 'responsableAdmisionHosp', label: 'Responsable de admisión', type: 'text' },
            { key: 'episodioOrigenHosp', label: 'Episodio origen', type: 'readonly' },
            { key: 'observacionesAdministrativasHosp', label: 'Observaciones administrativas', type: 'textarea' },
          ],
        },
        {
          key: 'cobertura_cuenta',
          title: 'Cobertura y responsable de cuenta',
          fields: [
            { key: 'tipoCoberturaHosp', label: 'Tipo de cobertura', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'PARTICULAR', label: 'Particular' },
              { value: 'ASEGURADORA', label: 'Aseguradora' },
              { value: 'CONVENIO', label: 'Convenio' },
              { value: 'INSTITUCIONAL', label: 'Institucional' },
            ] },
            { key: 'aseguradoraConvenioHosp', label: 'Aseguradora / convenio', type: 'text' },
            { key: 'numeroAutorizacionHosp', label: 'Número de autorización', type: 'text' },
            { key: 'responsableCuentaHosp', label: 'Responsable de cuenta', type: 'text' },
            { key: 'requiereEstimadoHosp', label: 'Requiere estimado', type: 'select', options: yesNoUnknownOptions },
            { key: 'requiereAutorizacionHosp', label: 'Requiere autorización', type: 'select', options: yesNoUnknownOptions },
          ],
        },
        {
          key: 'subjetivo_ingreso',
          title: 'Subjetivo: motivo e historia',
          fields: [
            { key: 'motivoIngresoClinicoHosp', label: 'Motivo de ingreso', type: 'textarea' },
            { key: 'historiaPadecimientoActualHosp', label: 'Historia del padecimiento actual', type: 'textarea' },
            {
              key: 'resumenInterrogatorioHosp',
              label: 'Resumen del interrogatorio',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'objetivo_ingreso',
          title: 'Objetivo: signos vitales y exploración',
          fields: [
            { key: 'taSistolicaHosp', label: 'TA sistólica (mmHg)', type: 'number' },
            { key: 'taDiastolicaHosp', label: 'TA diastólica (mmHg)', type: 'number' },
            { key: 'fcHosp', label: 'FC (lpm)', type: 'number' },
            { key: 'frHosp', label: 'FR (rpm)', type: 'number' },
            { key: 'temperaturaHosp', label: 'Temperatura (°C)', type: 'number' },
            { key: 'spo2Hosp', label: 'SpO₂ (%)', type: 'number' },
            { key: 'dolorEvaHosp', label: 'Dolor EVA (0–10)', type: 'number' },
            { key: 'pesoHosp', label: 'Peso (kg)', type: 'number' },
            { key: 'tallaHosp', label: 'Talla (cm)', type: 'number' },
            { key: 'glucosaHosp', label: 'Glucosa capilar (mg/dL)', type: 'number' },
            { key: 'exploracionFisicaHosp', label: 'Exploración física', type: 'textarea' },
            { key: 'estadoMentalHosp', label: 'Estado mental', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'ALERTA', label: 'Alerta' },
              { value: 'SOMNOLIENTO', label: 'Somnoliento' },
              { value: 'CONFUSO', label: 'Confuso' },
              { value: 'ESTUPOROSO', label: 'Estuporoso' },
              { value: 'COMA', label: 'Coma' },
            ] },
            {
              key: 'resultadosEstudiosHosp',
              label: 'Resultados de estudios',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'analisis_diagnostico_ingreso',
          title: 'Análisis: diagnóstico',
          fields: [
            {
              key: 'interpretacionClinicaHosp',
              label: 'Interpretación clínica',
              type: 'textarea',
            },
            { key: 'diagnosticoPrincipalHosp', label: 'Diagnóstico principal', type: 'text' },
            { key: 'cie10Hosp', label: 'CIE-10', type: 'text' },
            {
              key: 'diagnosticosSecundariosHosp',
              label: 'Diagnósticos secundarios',
              type: 'object-array',
              itemAddLabel: 'Agregar diagnóstico',
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                  { value: '', label: 'Sin especificar' },
                  { value: 'ACTIVO', label: 'Activo' },
                  { value: 'RESUELTO', label: 'Resuelto' },
                ] },
              ],
            },
            { key: 'pronosticoIngresoHosp', label: 'Pronóstico al ingreso', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'BUENO', label: 'Bueno' },
              { value: 'RESERVADO', label: 'Reservado' },
              { value: 'MALO', label: 'Malo' },
            ] },
          ],
        },
        {
          key: 'comorbilidades_ingreso',
          title: 'Comorbilidades y problemas activos',
          fields: [
            {
              key: 'comorbilidadesHosp',
              label: 'Lista de comorbilidades',
              type: 'object-array',
              itemAddLabel: 'Agregar comorbilidad',
              itemFields: [
                { key: 'comorbilidad', label: 'Comorbilidad', type: 'text' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                  { value: 'ACTIVO', label: 'Activo' },
                  { value: 'INACTIVO', label: 'Inactivo' },
                ] },
              ],
            },
          ],
        },
        {
          key: 'condiciones_iniciales',
          title: 'Condiciones iniciales',
          fields: [
            { key: 'dietaInicialHosp', label: 'Dieta inicial', type: 'select', options: dietOptions },
            { key: 'reposoMovilidadHosp', label: 'Reposo / movilidad', type: 'select', options: restOptions },
            { key: 'dispositivosIngresoHosp', label: 'Dispositivos al ingreso', type: 'textarea' },
            { key: 'aislamientoRequeridoHosp', label: 'Aislamiento requerido', type: 'select', options: yesNoUnknownOptions },
            { key: 'grupoSanguineoRhHosp', label: 'Grupo sanguíneo y RH', type: 'text' },
          ],
        },
        {
          key: 'plan_terapeutico_ingreso',
          title: 'Plan terapéutico',
          fields: [
            {
              key: 'medicamentosHosp',
              label: 'Medicamentos',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'dosis', label: 'Dosis', type: 'text' },
                { key: 'via', label: 'Vía', type: 'text' },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
                { key: 'duracion', label: 'Duración', type: 'text' },
              ],
            },
            { key: 'estudiosPlanHosp', label: 'Estudios', type: 'textarea' },
            { key: 'procedimientosPlanHosp', label: 'Procedimientos', type: 'textarea' },
            { key: 'interconsultasPlanHosp', label: 'Interconsultas', type: 'textarea' },
            { key: 'planAdicionalHosp', label: 'Plan adicional', type: 'textarea' },
          ],
        },
        {
          key: 'riesgo_ingreso',
          title: 'Evaluación de riesgo',
          fields: [
            { key: 'riesgoQuirurgicoHosp', label: 'Riesgo quirúrgico', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoTromboticoHosp', label: 'Riesgo trombótico', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoInfecciosoHosp', label: 'Riesgo infeccioso', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoCaidasMorseHosp', label: 'Riesgo caídas (Morse)', type: 'select', options: fallRiskOptions },
            { key: 'riesgoNutricionalHosp', label: 'Riesgo nutricional', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoClinicoInicialHosp', label: 'Riesgo clínico inicial', type: 'select', options: scoreRiskOptions },
          ],
        },
        {
          key: 'consentimiento_ingreso',
          title: 'Consentimiento',
          fields: [
            { key: 'consentimientoHospitalizacionHosp', label: 'Consentimiento hospitalización', type: 'select', options: consentStatusOptions },
            { key: 'consentimientoProcedimientosHosp', label: 'Consentimiento procedimientos', type: 'select', options: consentStatusOptions },
            {
              key: 'riesgosIdentificadosHosp',
              label: 'Riesgos identificados',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'legales_firma_ingreso',
          title: 'Datos legales y firma',
          fields: [
            { key: 'medicoIngresoLegal', label: 'Nombre del médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaIngresoLegal', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadIngresoLegal', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionIngresoLegal', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmaIngresoHosp', label: 'Firma electrónica', type: 'action', inheritanceMode: 'system', actionLabel: 'Firmar electrónicamente' },
          ],
        },
      ],
    },
    {
      key: 'Evolución',
      title: 'Evolución hospitalaria',
      description: 'Seguimiento clínico intrahospitalario.',
      icon: Activity,
      sections: [
        {
          key: 'datos_generales_evol_hosp',
          title: 'Datos generales de evolución',
          fields: [
            { key: 'fechaHoraEvolucionHosp', label: 'Fecha y hora de evolución', type: 'datetime-local' },
            { key: 'diaEstanciaHosp', label: 'Día de estancia hospitalaria', type: 'number' },
            { key: 'turnoEvolHosp', label: 'Turno', type: 'select', options: hospitalShiftOptions },
            { key: 'estadoClinicoEvolHosp', label: 'Estado clínico', type: 'select', options: hospitalEvolutionClinicalStatusOptions },
            { key: 'especialidadGuardiaEvolHosp', label: 'Especialidad / guardia responsable', type: 'readonly' },
            { key: 'referenciaEvolucionPreviaHosp', label: 'Referencia de evolución previa', type: 'readonly' },
          ],
        },
        {
          key: 'subjetivo_evol_hosp',
          title: 'Subjetivo',
          fields: [
            {
              key: 'tipoRegistro',
              label: 'Tipo de registro',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'referenciaIngresoHosp',
              label: 'Referencia de ingreso',
              type: 'readonly',
            },
            {
              key: 'subjetivoEvolHosp',
              label: 'Síntomas actuales / percepción del paciente',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'objetivo_evol_hosp',
          title: 'Objetivo: signos vitales y exploración',
          fields: [
            { key: 'taSistolicaEvolHosp', label: 'TA sistólica', type: 'number' },
            { key: 'taDiastolicaEvolHosp', label: 'TA diastólica', type: 'number' },
            { key: 'fcEvolHosp', label: 'FC', type: 'number' },
            { key: 'frEvolHosp', label: 'FR', type: 'number' },
            { key: 'temperaturaEvolHosp', label: 'Temperatura', type: 'number' },
            { key: 'spo2EvolHosp', label: 'SpO₂', type: 'number' },
            { key: 'dolorEvaEvolHosp', label: 'Dolor EVA', type: 'number' },
            { key: 'glucosaCapilarEvolHosp', label: 'Glucosa capilar', type: 'number' },
            { key: 'exploracionFisicaEvolHosp', label: 'Exploración física', type: 'textarea' },
          ],
        },
        {
          key: 'resultados_evol_hosp',
          title: 'Resultados de estudios',
          fields: [
            {
              key: 'resultadosEstudiosEvolHosp',
              label: 'Lista de resultados',
              type: 'object-array',
              itemAddLabel: 'Agregar resultado',
              itemFields: [
                { key: 'estudio', label: 'Estudio', type: 'text' },
                { key: 'resultado', label: 'Resultado', type: 'text' },
                { key: 'fecha', label: 'Fecha', type: 'date' },
              ],
            },
          ],
        },
        {
          key: 'analisis_evol_hosp',
          title: 'Análisis: interpretación clínica',
          fields: [
            { key: 'interpretacionClinicaEvolHosp', label: 'Interpretación clínica', type: 'textarea' },
            {
              key: 'cambiosClinicosEvolHosp',
              label: 'Cambios clínicos respecto a evolución previa',
              type: 'textarea',
            },
            {
              key: 'justificacionNom004EvolHosp',
              label: 'Justificación clínica NOM-004',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'diagnosticos_evol_hosp',
          title: 'Diagnósticos activos',
          fields: [
            {
              key: 'diagnosticosActivosEvolHosp',
              label: 'Diagnósticos activos',
              type: 'object-array',
              itemAddLabel: 'Agregar diagnóstico',
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                  { value: 'ACTIVO', label: 'Activo' },
                  { value: 'INACTIVO', label: 'Inactivo' },
                  { value: 'RESUELTO', label: 'Resuelto' },
                ] },
              ],
            },
          ],
        },
        {
          key: 'eventos_evol_hosp',
          title: 'Eventos adversos y complicaciones',
          fields: [
            { key: 'eventosAdversosEvolHosp', label: 'Eventos adversos', type: 'textarea' },
            { key: 'complicacionesEvolHosp', label: 'Complicaciones', type: 'textarea' },
          ],
        },
        {
          key: 'plan_evol_hosp',
          title: 'Plan estructurado',
          fields: [
            { key: 'tratamientoEvolHosp', label: 'Tratamiento', type: 'textarea' },
            { key: 'estudiosEvolHosp', label: 'Estudios', type: 'textarea' },
            { key: 'interconsultasEvolHosp', label: 'Interconsultas', type: 'textarea' },
            { key: 'seguimientoEvolHosp', label: 'Seguimiento', type: 'textarea' },
            { key: 'pronosticoEvolHosp', label: 'Pronóstico', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'BUENO', label: 'Bueno' },
              { value: 'RESERVADO', label: 'Reservado' },
              { value: 'MALO', label: 'Malo' },
            ] },
          ],
        },
        {
          key: 'medico_legal_evol_hosp',
          title: 'Campos médico-legales',
          fields: [
            { key: 'consentimientoVigenteEvolHosp', label: 'Consentimiento vigente', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'SI_VIGENTE', label: 'Sí vigente' },
              { value: 'NO', label: 'No' },
              { value: 'NO_APLICA', label: 'No aplica' },
            ] },
            {
              key: 'informacionPacienteFamiliarEvolHosp',
              label: 'Información brindada al paciente / familiar',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'legales_firma_evol_hosp',
          title: 'Datos legales y firma NOM-004',
          fields: [
            { key: 'medicoEvolHospLegal', label: 'Nombre completo del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaEvolHospLegal', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadEvolHospLegal', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionEvolHospLegal', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmaEvolHosp', label: 'Firma electrónica', type: 'action', inheritanceMode: 'system', actionLabel: 'Firmar electrónicamente' },
          ],
        },
      ],
    },
    {
      key: 'Indicaciones médicas',
      title: 'Indicaciones médicas',
      description: 'Medicamentos, cuidados, estudios e interconsultas.',
      icon: ClipboardList,
      sections: [
        {
          key: 'medicamentos_indicaciones_hosp',
          title: 'Medicamentos',
          fields: [
            {
              key: 'tipoRegistro',
              label: 'Tipo de registro',
              type: 'readonly',
              inheritanceMode: 'system',
            },
            {
              key: 'medicamentosIndicacionesHosp',
              label: 'Medicamentos',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'dosis', label: 'Dosis', type: 'text' },
                { key: 'via', label: 'Vía', type: 'select', options: [
                  { value: '', label: 'Selecciona una opción' },
                  { value: 'IV', label: 'IV' },
                  { value: 'VO', label: 'VO' },
                  { value: 'IM', label: 'IM' },
                  { value: 'SC', label: 'SC' },
                ] },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: [
                  { value: '', label: 'Sin especificar' },
                  { value: 'RUTINARIO', label: 'Rutinario' },
                  { value: 'URGENTE', label: 'Urgente' },
                  { value: 'STAT', label: 'STAT' },
                ] },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
                { key: 'duracion', label: 'Duración', type: 'text' },
                { key: 'indicacion', label: 'Indicación', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'soluciones_iv_indicaciones_hosp',
          title: 'Soluciones IV',
          fields: [
            {
              key: 'solucionesIvIndicacionesHosp',
              label: 'Soluciones IV',
              type: 'object-array',
              itemAddLabel: 'Agregar solución',
              itemFields: [
                { key: 'tipoSolucion', label: 'Tipo de solución', type: 'text' },
                { key: 'volumenMl', label: 'Volumen en ml', type: 'number' },
                { key: 'velocidadMlHora', label: 'Velocidad en ml/h', type: 'number' },
                { key: 'duracion', label: 'Duración', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'cuidados_generales_indicaciones_hosp',
          title: 'Dieta, reposo y cuidados generales',
          fields: [
            { key: 'dietaIndicacionesHosp', label: 'Dieta', type: 'select', options: dietOptions },
            { key: 'reposoActividadIndicacionesHosp', label: 'Reposo / actividad', type: 'select', options: restOptions },
            { key: 'posicionIndicacionesHosp', label: 'Posición', type: 'text' },
            { key: 'cuidadosGeneralesIndicacionesHosp', label: 'Cuidados generales', type: 'textarea' },
          ],
        },
        {
          key: 'estudios_indicaciones_hosp',
          title: 'Estudios solicitados',
          fields: [
            {
              key: 'estudiosSolicitadosIndicacionesHosp',
              label: 'Estudios solicitados',
              type: 'object-array',
              itemAddLabel: 'Agregar estudio',
              itemFields: [
                { key: 'tipoEstudio', label: 'Tipo de estudio', type: 'text' },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: orderPriorityOptions },
                { key: 'indicacion', label: 'Indicación', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'interconsultas_indicaciones_hosp',
          title: 'Interconsultas solicitadas',
          fields: [
            {
              key: 'interconsultasSolicitadasIndicacionesHosp',
              label: 'Interconsultas solicitadas',
              type: 'object-array',
              itemAddLabel: 'Agregar interconsulta',
              itemFields: [
                { key: 'servicio', label: 'Servicio', type: 'text' },
                { key: 'motivo', label: 'Motivo', type: 'text' },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: consultationPriorityOptions },
              ],
            },
          ],
        },
        {
          key: 'enfermeria_indicaciones_hosp',
          title: 'Cuidados de enfermería',
          fields: [
            { key: 'monitoreoEnfermeriaIndicacionesHosp', label: 'Monitoreo', type: 'textarea' },
            { key: 'oxigenoIndicacionesHosp', label: 'Oxígeno', type: 'select', options: oxygenTypeOptions },
            { key: 'controlLiquidosIndicacionesHosp', label: 'Control de líquidos', type: 'textarea' },
          ],
        },
        {
          key: 'trazabilidad_indicaciones_hosp',
          title: 'Trazabilidad de órdenes',
          fields: [
            { key: 'horaInicioIndicacionesHosp', label: 'Hora inicio indicaciones', type: 'time' },
            { key: 'programacionSiguienteTurnoHosp', label: 'Programación siguiente turno', type: 'readonly' },
            { key: 'usuarioEjecutorHosp', label: 'Usuario ejecutor', type: 'readonly' },
          ],
        },
        {
          key: 'legales_firma_indicaciones_hosp',
          title: 'Datos legales y firma',
          fields: [
            { key: 'medicoIndicacionesLegal', label: 'Nombre del médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaIndicacionesLegal', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadIndicacionesLegal', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionIndicacionesLegal', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmaIndicacionesHosp', label: 'Firma electrónica', type: 'action', inheritanceMode: 'system', actionLabel: 'Firmar electrónicamente' },
          ],
        },
      ],
    },
    {
      key: 'Interconsultas',
      title: 'Interconsultas',
      description: 'Solicitud, respuesta y trazabilidad.',
      icon: MessagesSquare,
      sections: [
        {
          key: 'datos_solicitud_inter_hosp',
          title: 'Datos de solicitud',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'fechaSolicitudInterHosp', label: 'Fecha de solicitud', type: 'date' },
            { key: 'horaSolicitudInterHosp', label: 'Hora de solicitud', type: 'time' },
            { key: 'medicoSolicitanteInterHosp', label: 'Médico solicitante', type: 'readonly' },
            { key: 'cedulaSolicitanteInterHosp', label: 'Cédula profesional', type: 'readonly' },
            { key: 'especialidadSolicitanteInterHosp', label: 'Especialidad solicitante', type: 'readonly' },
            {
              key: 'medioNotificacionInterHosp',
              label: 'Medio de notificación',
              type: 'select',
              options: notificationMediumOptions,
            },
          ],
        },
        {
          key: 'solicitud_inter_hosp',
          title: 'Solicitud de interconsulta',
          fields: [
            { key: 'servicioSolicitanteInterHosp', label: 'Servicio solicitante', type: 'text' },
            { key: 'servicioInterconsultadoHosp', label: 'Servicio interconsultado', type: 'text' },
            { key: 'prioridadInterHosp', label: 'Prioridad', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'URGENTE', label: 'Urgente' },
              { value: 'PREFERENTE', label: 'Preferente' },
              { value: 'RUTINARIO', label: 'Rutinario' },
            ] },
            { key: 'tiempoObjetivoRespuestaInterHosp', label: 'Tiempo objetivo de respuesta (min)', type: 'number' },
            { key: 'motivoInterconsultaHosp', label: 'Motivo', type: 'textarea' },
            { key: 'criterioDiagnosticoInterHosp', label: 'Criterio diagnóstico', type: 'textarea' },
            { key: 'estatusInterconsultaHosp', label: 'Estatus interconsulta', type: 'readonly' },
          ],
        },
        {
          key: 'relacion_clinica_inter_hosp',
          title: 'Relación clínica',
          fields: [
            { key: 'diagnosticoRelacionadoInterHosp', label: 'Diagnóstico relacionado', type: 'text' },
            { key: 'cie10RelacionadoInterHosp', label: 'CIE-10 relacionado', type: 'text' },
            {
              key: 'estudiosRelacionadosInterHosp',
              label: 'Estudios relacionados',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'respuesta_inter_hosp',
          title: 'Respuesta de interconsulta',
          fields: [
            { key: 'fechaRespuestaInterHosp', label: 'Fecha de respuesta', type: 'date' },
            { key: 'horaRespuestaInterHosp', label: 'Hora de respuesta', type: 'time' },
            { key: 'medicoInterconsultanteHosp', label: 'Médico interconsultante', type: 'text' },
            { key: 'cedulaInterconsultanteHosp', label: 'Cédula interconsultante', type: 'text' },
            { key: 'impresionDiagnosticaInterHosp', label: 'Valoración / impresión diagnóstica', type: 'textarea' },
            { key: 'sugerenciasDiagnosticasInterHosp', label: 'Sugerencias diagnósticas', type: 'textarea' },
            { key: 'sugerenciasTerapeuticasInterHosp', label: 'Sugerencias terapéuticas', type: 'textarea' },
            { key: 'requiereSeguimientoInterHosp', label: 'Requiere seguimiento', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'SI', label: 'Sí' },
              { value: 'NO', label: 'No' },
            ] },
            { key: 'resultadoInterconsultaHosp', label: 'Resultado de interconsulta', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'CONTINUA_MANEJO', label: 'Continúa manejo' },
              { value: 'CAMBIO_TRATAMIENTO', label: 'Cambio de tratamiento' },
              { value: 'SEGUIMIENTO_ESPECIALIDAD', label: 'Seguimiento por especialidad' },
              { value: 'SIN_CAMBIOS', label: 'Sin cambios' },
            ] },
          ],
        },
        {
          key: 'tiempos_inter_hosp',
          title: 'Tiempos de auditoría',
          fields: [
            { key: 'tiempoRespuestaRealInterHosp', label: 'Tiempo de respuesta real', type: 'readonly' },
            { key: 'tiempoCierreInterHosp', label: 'Tiempo de cierre', type: 'readonly' },
            { key: 'requestSignedAtInterHosp', label: 'Firma de solicitud', type: 'readonly' },
            { key: 'responseSignedAtInterHosp', label: 'Firma de respuesta', type: 'readonly' },
          ],
        },
        {
          key: 'legales_firma_inter_hosp',
          title: 'Datos legales y firma',
          fields: [
            { key: 'medicoInterLegal', label: 'Nombre del médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaInterLegal', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadInterLegal', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionInterLegal', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            {
              key: 'firmaInterHosp',
              label: 'Firma electrónica',
              type: 'action',
              inheritanceMode: 'system',
              actionLabel: 'Firmar electrónicamente',
            },
          ],
        },
      ],
    },
    {
      key: 'Procedimientos / Cirugía',
      title: 'Procedimientos y cirugía',
      description: 'Contenedor de subdocumentos quirúrgicos independientes.',
      icon: Scissors,
      sections: [
        {
          key: 'quir_common_header',
          title: 'Encabezado documental',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'tipoSubdocumentoQuirurgico', label: 'Tipo de documento quirúrgico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'folioDocumentoQuirurgico', label: 'Folio único', type: 'readonly', inheritanceMode: 'system' },
            { key: 'versionDocumentoQuirurgico', label: 'Versión', type: 'readonly', inheritanceMode: 'system' },
            { key: 'estadoDocumentoQuirurgico', label: 'Estatus', type: 'readonly', inheritanceMode: 'system' },
            { key: 'progresoQuirurgicoGlobal', label: 'Progreso global calculado', type: 'readonly', inheritanceMode: 'system' },
            { key: 'hashDocumentoQuirurgico', label: 'Hash', type: 'readonly', inheritanceMode: 'system' },
            { key: 'selloDigitalQuirurgico', label: 'Sello digital', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'prequir_datos',
          title: 'Datos preoperatorios',
          fields: [
            { key: 'diagnosticoPreoperatorioQuirHosp', label: 'Diagnóstico preoperatorio', type: 'text' },
            { key: 'cie10PreoperatorioQuirHosp', label: 'CIE-10', type: 'text' },
            { key: 'cirugiaPropuestaQuirHosp', label: 'Cirugía propuesta', type: 'text' },
            { key: 'tipoCirugiaQuirHosp', label: 'Tipo de cirugía', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'ELECTIVA', label: 'Electiva' },
              { value: 'URGENCIA', label: 'Urgencia' },
              { value: 'EMERGENCIA', label: 'Emergencia' },
            ] },
            { key: 'codigoProcedimientoQuirHosp', label: 'Código de procedimiento', type: 'text' },
            { key: 'catalogoProcedimientoQuirHosp', label: 'Catálogo de procedimiento', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'CIE9MC', label: 'CIE-9-MC' },
              { value: 'CPT', label: 'CPT' },
              { value: 'LOCAL', label: 'Catálogo local' },
            ] },
          ],
        },
        {
          key: 'prequir_equipo',
          title: 'Equipo quirúrgico',
          fields: [
            { key: 'cirujanoPrincipalQuirHosp', label: 'Cirujano principal', type: 'text' },
            { key: 'primerAyudanteQuirHosp', label: 'Primer ayudante', type: 'text' },
            { key: 'anestesiologoQuirHosp', label: 'Anestesiólogo', type: 'text' },
            { key: 'instrumentistaQuirHosp', label: 'Instrumentista', type: 'text' },
            { key: 'enfermeriaCirculanteQuirHosp', label: 'Enfermería circulante', type: 'text' },
          ],
        },
        {
          key: 'prequir_riesgo',
          title: 'Riesgo, anestesia y consentimiento',
          fields: [
            { key: 'riesgosQuirurgicosQuirHosp', label: 'Riesgos quirúrgicos', type: 'textarea' },
            { key: 'clasificacionAsaQuirHosp', label: 'Clasificación ASA', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'ASA_I', label: 'ASA I' },
              { value: 'ASA_II', label: 'ASA II' },
              { value: 'ASA_III', label: 'ASA III' },
              { value: 'ASA_IV', label: 'ASA IV' },
              { value: 'ASA_V', label: 'ASA V' },
            ] },
            { key: 'tipoAnestesiaQuirHosp', label: 'Tipo de anestesia', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'GENERAL', label: 'General' },
              { value: 'REGIONAL', label: 'Regional' },
              { value: 'LOCAL', label: 'Local' },
              { value: 'SEDACION', label: 'Sedación' },
            ] },
            { key: 'valoracionViaAereaQuirHosp', label: 'Valoración vía aérea', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'DIFICIL', label: 'Difícil' },
              { value: 'NO_VALORADA', label: 'No valorada' },
            ] },
            { key: 'riesgoAnestesicoQuirHosp', label: 'Riesgo anestésico', type: 'textarea' },
            { key: 'consentimientoInformadoQuirHosp', label: 'Consentimiento informado', type: 'select', options: consentStatusOptions },
            { key: 'fechaFirmaConsentimientoQuirHosp', label: 'Fecha de firma', type: 'date' },
            { key: 'responsableExplicaQuirHosp', label: 'Responsable que explica', type: 'text' },
            { key: 'estudiosPreoperatoriosQuirHosp', label: 'Estudios preoperatorios / referencias', type: 'textarea' },
          ],
        },
        {
          key: 'prean_header',
          title: 'Encabezado preanestésico',
          fields: [
            { key: 'pacienteDocumentoQuirurgico', label: 'Paciente', type: 'readonly', inheritanceMode: 'system' },
            { key: 'curpDocumentoQuirurgico', label: 'CURP', type: 'readonly', inheritanceMode: 'system' },
            { key: 'expedienteDocumentoQuirurgico', label: 'Expediente', type: 'readonly', inheritanceMode: 'system' },
            { key: 'folioEpisodioDocumentoQuirurgico', label: 'Folio de episodio', type: 'readonly', inheritanceMode: 'system' },
            { key: 'tipoEpisodioDocumentoQuirurgico', label: 'Tipo de episodio', type: 'readonly', inheritanceMode: 'system' },
            { key: 'servicioDocumentoQuirurgico', label: 'Servicio', type: 'readonly', inheritanceMode: 'system' },
            { key: 'medicoResponsableDocumentoQuirurgico', label: 'Médico responsable', type: 'readonly', inheritanceMode: 'system' },
            { key: 'fechaHoraDocumentoQuirurgico', label: 'Fecha y hora', type: 'readonly', inheritanceMode: 'system' },
            { key: 'idDocumentoQuirurgico', label: 'ID documento', type: 'readonly', inheritanceMode: 'system' },
            { key: 'usuarioCreadorDocumentoQuirurgico', label: 'Usuario creador', type: 'readonly', inheritanceMode: 'system' },
            { key: 'ipDocumentoQuirurgico', label: 'IP', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'prean_evaluacion',
          title: 'Evaluación preanestésica',
          fields: [
            { key: 'fechaValoracionPreanHosp', label: 'Fecha de valoración', type: 'date' },
            { key: 'horaValoracionPreanHosp', label: 'Hora', type: 'time' },
            { key: 'procedimientoProgramadoPreanHosp', label: 'Procedimiento programado', type: 'text' },
            { key: 'clasificacionAsaPreanHosp', label: 'Clasificación ASA', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'ASA_I', label: 'ASA I' },
              { value: 'ASA_II', label: 'ASA II' },
              { value: 'ASA_III', label: 'ASA III' },
              { value: 'ASA_IV', label: 'ASA IV' },
              { value: 'ASA_V', label: 'ASA V' },
            ] },
            { key: 'mallampatiPreanHosp', label: 'Mallampati', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'I', label: 'I' },
              { value: 'II', label: 'II' },
              { value: 'III', label: 'III' },
              { value: 'IV', label: 'IV' },
            ] },
            { key: 'planAnestesicoPreanHosp', label: 'Plan anestésico', type: 'textarea' },
          ],
        },
        {
          key: 'prean_antecedentes',
          title: 'Antecedentes, riesgo y plan',
          fields: [
            { key: 'antecedentesAnestesicosPreanHosp', label: 'Antecedentes anestésicos', type: 'textarea' },
            { key: 'alergiasPreanHosp', label: 'Alergias', type: 'textarea' },
            { key: 'ayunoConfirmadoPreanHosp', label: 'Ayuno confirmado', type: 'select', options: yesNoUnknownOptions },
            { key: 'ultimaIngestaPreanHosp', label: 'Última ingesta', type: 'text' },
            { key: 'evaluacionViaAereaPreanHosp', label: 'Evaluación vía aérea', type: 'textarea' },
            { key: 'riesgoAnestesicoPreanHosp', label: 'Riesgo anestésico', type: 'textarea' },
            { key: 'planAnestesicoDetalladoPreanHosp', label: 'Plan anestésico detallado', type: 'textarea' },
            { key: 'anestesiologoPreanHosp', label: 'Anestesiólogo', type: 'text' },
            { key: 'cedulaAnestesiologoPreanHosp', label: 'Cédula profesional', type: 'text' },
          ],
        },
        {
          key: 'postop_trazabilidad',
          title: 'Trazabilidad del acto quirúrgico',
          fields: [
            { key: 'fechaCirugiaPostop', label: 'Fecha de cirugía', type: 'date' },
            { key: 'horaInicioCirugiaPostop', label: 'Hora inicio', type: 'time' },
            { key: 'horaFinCirugiaPostop', label: 'Hora fin', type: 'time' },
            { key: 'quirofanoPostop', label: 'Quirófano', type: 'text' },
            { key: 'cirujanoPrincipalPostop', label: 'Cirujano principal', type: 'text' },
            { key: 'anestesiologoPostop', label: 'Anestesiólogo', type: 'text' },
          ],
        },
        {
          key: 'postop_procedimiento',
          title: 'Diagnósticos y procedimiento',
          fields: [
            { key: 'diagnosticoPreoperatorioPostop', label: 'Diagnóstico preoperatorio', type: 'text' },
            { key: 'diagnosticoPostoperatorioPostop', label: 'Diagnóstico postoperatorio', type: 'text' },
            { key: 'procedimientoRealizadoPostopHosp', label: 'Procedimiento realizado', type: 'text' },
            { key: 'duracionCirugiaPostop', label: 'Duración calculada (min)', type: 'readonly', inheritanceMode: 'system' },
            { key: 'tecnicaQuirurgicaPostop', label: 'Técnica quirúrgica', type: 'textarea' },
            { key: 'hallazgosTransoperatoriosPostop', label: 'Hallazgos transoperatorios', type: 'textarea' },
          ],
        },
        {
          key: 'postop_transoperatorio',
          title: 'Datos transoperatorios, material y complicaciones',
          fields: [
            { key: 'sangradoEstimadoPostop', label: 'Sangrado estimado', type: 'text' },
            { key: 'liquidosAdministradosPostop', label: 'Líquidos administrados', type: 'text' },
            { key: 'transfusionesPostop', label: 'Transfusiones', type: 'textarea' },
            { key: 'drenajesPostop', label: 'Drenajes', type: 'text' },
            { key: 'diuresisPostop', label: 'Diuresis', type: 'text' },
            { key: 'conteoTextilPostop', label: 'Conteo textil', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'COMPLETO', label: 'Completo' },
              { value: 'INCOMPLETO', label: 'Incompleto' },
              { value: 'NO_APLICA', label: 'No aplica' },
            ] },
            { key: 'incidentesPostop', label: 'Incidentes', type: 'textarea' },
            { key: 'materialUtilizadoPostop', label: 'Material utilizado', type: 'textarea' },
            { key: 'implantesProtesisPostop', label: 'Implantes / prótesis', type: 'textarea' },
            { key: 'lotesSeriesPostop', label: 'Lotes / series', type: 'textarea' },
            { key: 'huboComplicacionesPostop', label: '¿Hubo complicaciones?', type: 'select', options: yesNoUnknownOptions },
            { key: 'tipoComplicacionPostop', label: 'Tipo de complicación', type: 'text' },
            { key: 'manejoComplicacionPostop', label: 'Manejo de complicación', type: 'textarea' },
          ],
        },
        {
          key: 'postop_estado',
          title: 'Estado e indicaciones postoperatorias',
          fields: [
            { key: 'estadoHemodinamicoPostop', label: 'Estado hemodinámico', type: 'text' },
            { key: 'nivelConcienciaPostop', label: 'Nivel de conciencia', type: 'text' },
            { key: 'dolorPostop', label: 'Dolor', type: 'number' },
            { key: 'destinoPostop', label: 'Destino', type: 'text' },
            { key: 'estadoInmediatoPostop', label: 'Estado inmediato', type: 'textarea' },
            { key: 'pronosticoPostop', label: 'Pronóstico', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'BUENO', label: 'Bueno' },
              { value: 'RESERVADO', label: 'Reservado' },
              { value: 'MALO', label: 'Malo' },
            ] },
            { key: 'medicamentosPostoperatoriosPostop', label: 'Medicamentos', type: 'textarea' },
            { key: 'vigilanciaPostoperatoriaPostop', label: 'Vigilancia', type: 'textarea' },
            { key: 'estudiosPostoperatoriosPostop', label: 'Estudios', type: 'textarea' },
            { key: 'cuidadosHeridaPostop', label: 'Cuidados de herida', type: 'textarea' },
            { key: 'movilidadPostop', label: 'Movilización', type: 'textarea' },
            { key: 'dietaPostop', label: 'Dieta', type: 'textarea' },
            { key: 'indicacionesAdicionalesPostop', label: 'Indicaciones adicionales', type: 'textarea' },
          ],
        },
        {
          key: 'postanes_recuperacion',
          title: 'Recuperación postanestésica',
          fields: [
            { key: 'tipoAnestesiaPostanesHosp', label: 'Tipo de anestesia', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'GENERAL', label: 'General' },
              { value: 'REGIONAL', label: 'Regional' },
              { value: 'LOCAL', label: 'Local' },
              { value: 'SEDACION', label: 'Sedación' },
            ] },
            { key: 'horaIngresoPostanesHosp', label: 'Hora ingreso', type: 'time' },
            { key: 'horaEgresoPostanesHosp', label: 'Hora egreso', type: 'time' },
            { key: 'taPostanesHosp', label: 'TA', type: 'text' },
            { key: 'fcPostanesHosp', label: 'FC', type: 'number' },
            { key: 'frPostanesHosp', label: 'FR', type: 'number' },
            { key: 'spo2PostanesHosp', label: 'SpO₂', type: 'number' },
          ],
        },
        {
          key: 'postanes_evaluacion',
          title: 'Evaluación y responsable',
          fields: [
            { key: 'aldretePostanesHosp', label: 'Escala de Aldrete', type: 'number' },
            { key: 'nivelConcienciaPostanesHosp', label: 'Nivel de conciencia', type: 'text' },
            { key: 'dolorEvaPostanesHosp', label: 'Dolor EVA', type: 'number' },
            { key: 'complicacionesAnestesicasPostanesHosp', label: 'Complicaciones anestésicas', type: 'textarea' },
            { key: 'bloqueoMotorPostanesHosp', label: 'Bloqueo motor', type: 'text' },
            { key: 'observacionesPostanesHosp', label: 'Observaciones', type: 'textarea' },
            { key: 'anestesiologoPostanesHosp', label: 'Anestesiólogo', type: 'text' },
            { key: 'cedulaPostanesHosp', label: 'Cédula', type: 'text' },
          ],
        },
        {
          key: 'quir_legales_firma',
          title: 'Datos legales y firma',
          fields: [
            { key: 'medicoQuirLegal', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaQuirLegal', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadQuirLegal', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionQuirLegal', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            {
              key: 'firmarProcedimientoQuirurgico',
              label: 'Firma electrónica por subdocumento',
              type: 'action',
              inheritanceMode: 'system',
              actionLabel: 'Firmar electrónicamente',
            },
          ],
        },
      ],
    },
    {
      key: 'Enfermería',
      title: 'Enfermería',
      description: 'Registros de enfermería por turno.',
      icon: HeartPulse,
      sections: [
        {
          key: 'enf_encabezado',
          title: 'Encabezado de turno',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'turnoEnfermeriaHosp', label: 'Turno', type: 'readonly', inheritanceMode: 'system' },
            { key: 'estadoTurnoEnfermeriaHosp', label: 'Estatus del turno', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'enf_tiempo_real',
          title: 'Registro en tiempo real',
          fields: [
            { key: 'habitusExteriorEnfHosp', label: 'Hábitus exterior', type: 'textarea' },
            {
              key: 'signosVitalesSeriadosEnfHosp',
              label: 'Signos vitales seriados',
              type: 'object-array',
              itemAddLabel: 'Agregar toma',
              itemFields: [
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'hora', label: 'Hora', type: 'time' },
                { key: 'taSistolica', label: 'TA sistólica (mmHg)', type: 'number' },
                { key: 'taDiastolica', label: 'TA diastólica (mmHg)', type: 'number' },
                { key: 'fc', label: 'FC (lpm)', type: 'number' },
                { key: 'fr', label: 'FR (rpm)', type: 'number' },
                { key: 'temperatura', label: 'Temperatura (°C)', type: 'number' },
                { key: 'spo2', label: 'SpO₂ (%)', type: 'number' },
                { key: 'glucosaCapilar', label: 'Glucosa capilar (mg/dL)', type: 'number' },
                { key: 'dolorEva', label: 'Dolor EVA (0–10)', type: 'number' },
              ],
            },
            {
              key: 'medicamentosMinistradosEnfHosp',
              label: 'Ministración de medicamentos',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento (desde indicaciones)', type: 'text' },
                { key: 'horaProgramada', label: 'Hora programada', type: 'time' },
                { key: 'horaAdministrada', label: 'Hora administrada', type: 'time' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                  { value: '', label: 'Selecciona una opción' },
                  { value: 'ADMINISTRADO', label: 'Administrado' },
                  { value: 'NO_ADMINISTRADO', label: 'No administrado' },
                  { value: 'DIFERIDO', label: 'Diferido' },
                ] },
                { key: 'motivoNoAdministracion', label: 'Motivo no administración', type: 'textarea' },
                { key: 'enfermeria', label: 'Enfermería responsable', type: 'text' },
                { key: 'sourceMedicalOrderId', label: 'ID indicación médica', type: 'readonly', inheritanceMode: 'system' },
                { key: 'sourceMedicationId', label: 'ID medicamento indicado', type: 'readonly', inheritanceMode: 'system' },
              ],
            },
            {
              key: 'procedimientosEnfermeriaTurnoHosp',
              label: 'Procedimientos de enfermería',
              type: 'object-array',
              itemAddLabel: 'Agregar procedimiento',
              itemFields: [
                { key: 'procedimiento', label: 'Procedimiento', type: 'text' },
                { key: 'hora', label: 'Hora', type: 'time' },
                { key: 'realizadoPor', label: 'Realizado por', type: 'text' },
                { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
              ],
            },
          ],
        },
        {
          key: 'enf_resumen_turno',
          title: 'Resumen de turno',
          fields: [
            { key: 'ingresosMlEnfHosp', label: 'Ingresos en ml', type: 'number' },
            { key: 'egresosMlEnfHosp', label: 'Egresos en ml', type: 'number' },
            { key: 'balanceTotalEnfHosp', label: 'Balance total', type: 'readonly', inheritanceMode: 'system' },
            { key: 'curacionesEnfHosp', label: 'Curaciones', type: 'textarea' },
            { key: 'movilizacionEnfHosp', label: 'Movilización', type: 'textarea' },
            { key: 'higieneEnfHosp', label: 'Higiene', type: 'text' },
            { key: 'vigilanciaEnfHosp', label: 'Vigilancia', type: 'textarea' },
            { key: 'dispositivosEnfHosp', label: 'Dispositivos', type: 'textarea' },
            { key: 'riesgoCaidaMorseEnfHosp', label: 'Riesgo de caída Morse', type: 'select', options: fallRiskOptions },
            { key: 'riesgoUppBradenEnfHosp', label: 'Riesgo UPP Braden', type: 'select', options: fallRiskOptions },
            { key: 'eventoAdversoEnfHosp', label: '¿Evento adverso?', type: 'select', options: yesNoUnknownOptions },
            { key: 'tipoEventoAdversoEnfHosp', label: 'Tipo de evento', type: 'text' },
            { key: 'descripcionAccionEventoEnfHosp', label: 'Descripción y acción', type: 'textarea' },
            { key: 'observacionesGeneralesEnfHosp', label: 'Observaciones generales', type: 'textarea' },
          ],
        },
        {
          key: 'enf_legales_firma',
          title: 'Datos legales y firma',
          fields: [
            { key: 'profesionalEnfermeriaLegal', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaEnfermeriaLegal', label: 'Cédula', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadEnfermeriaLegal', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionEnfermeriaLegal', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cerrarTurnoFirmarEnfHosp', label: 'Cerrar turno y firmar', type: 'action', inheritanceMode: 'system', actionLabel: 'Cerrar turno y firmar' },
          ],
        },
      ],
    },
    {
      key: 'Egreso',
      title: 'Egreso hospitalario',
      description: 'Documento final de cierre de hospitalización.',
      icon: FileCheck,
      sections: [
        {
          key: 'egreso_hosp_tipo_destino',
          title: 'Tipo y destino de egreso',
          fields: [
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'tipoEgresoHosp', label: 'Tipo de egreso', type: 'select', options: hospitalDischargeTypeOptions },
            { key: 'destinoPacienteEgresoHosp', label: 'Destino del paciente', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'DOMICILIO', label: 'Domicilio' },
              { value: 'OTRA_UNIDAD', label: 'Otra unidad' },
              { value: 'REHABILITACION', label: 'Rehabilitación' },
              { value: 'MORTUORIO', label: 'Mortuorio' },
            ], visibleWhen: { fieldKey: 'tipoEgresoHosp', values: hospitalDischargeDestinationVisibleValues } },
            { key: 'unidadReceptoraEgresoHosp', label: 'Unidad receptora', type: 'text', visibleWhen: hospitalDischargeTransferVisible },
            { key: 'fechaHoraEgresoHosp', label: 'Fecha y hora de egreso', type: 'datetime-local' },
            { key: 'fechaIngresoReadonlyHosp', label: 'Fecha de ingreso', type: 'readonly', inheritanceMode: 'system' },
            { key: 'diasEstanciaHosp', label: 'Días de estancia', type: 'readonly', inheritanceMode: 'system' },
            { key: 'estadoAlEgresoHosp', label: 'Estado al egreso', type: 'select', options: [
              { value: '', label: 'Selecciona una opción' },
              { value: 'MEJORADO', label: 'Mejorado' },
              { value: 'IGUAL', label: 'Igual' },
              { value: 'DETERIORADO', label: 'Deteriorado' },
              { value: 'FALLECIDO', label: 'Fallecido' },
            ] },
            { key: 'motivoAltaVoluntariaEgresoHosp', label: 'Motivo de alta voluntaria', type: 'textarea', visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'riesgosExplicadosAltaVoluntariaEgresoHosp', label: 'Riesgos explicados al paciente', type: 'textarea', visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'profesionalResponsableAltaVoluntariaEgresoHosp', label: 'Profesional responsable', type: 'readonly', inheritanceMode: 'system', visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'firmanteConformidadNombreEgresoHosp', label: 'Nombre de quien firma conformidad', type: 'text', visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'firmanteConformidadCalidadEgresoHosp', label: 'Calidad con la que firma', type: 'select', options: hospitalConformitySignerOptions, visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'firmanteConformidadRelacionEgresoHosp', label: 'Relación con el paciente', type: 'text', visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'fechaHoraConformidadEgresoHosp', label: 'Fecha y hora de conformidad', type: 'datetime-local', visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'confirmacionConformidadEgresoHosp', label: 'Confirmación / firma de conformidad', type: 'select', options: hospitalConformityConfirmationOptions, visibleWhen: hospitalDischargeVoluntaryVisible },
            { key: 'medicoReceptorEgresoHosp', label: 'Médico receptor', type: 'text', visibleWhen: hospitalDischargeTransferVisible },
            { key: 'cedulaMedicoReceptorEgresoHosp', label: 'Identificación profesional receptor', type: 'text', visibleWhen: hospitalDischargeTransferVisible },
            { key: 'servicioReceptorEgresoHosp', label: 'Servicio receptor', type: 'text', visibleWhen: hospitalDischargeTransferVisible },
            { key: 'medioTrasladoEgresoHosp', label: 'Medio de traslado', type: 'select', options: hospitalTransportMethodOptions, visibleWhen: hospitalDischargeTransferVisible },
            { key: 'horaDefuncionEgresoHosp', label: 'Hora de defunción', type: 'datetime-local', visibleWhen: hospitalDischargeDeathVisible },
            { key: 'causaDefuncionEgresoHosp', label: 'Causa de defunción', type: 'textarea', visibleWhen: hospitalDischargeDeathVisible },
            { key: 'certificadoDefuncionRelacionadoEgresoHosp', label: 'Certificado de defunción relacionado', type: 'text', visibleWhen: hospitalDischargeDeathVisible },
            { key: 'horaUltimoContactoEgresoHosp', label: 'Hora de último contacto', type: 'datetime-local', visibleWhen: hospitalDischargeAbandonmentVisible },
            { key: 'circunstanciasAbandonoEgresoHosp', label: 'Circunstancias registradas', type: 'textarea', visibleWhen: hospitalDischargeAbandonmentVisible },
            { key: 'profesionalDocumentaAbandonoEgresoHosp', label: 'Profesional que documenta', type: 'readonly', inheritanceMode: 'system', visibleWhen: hospitalDischargeAbandonmentVisible },
            { key: 'fechaHoraDocumentacionAbandonoEgresoHosp', label: 'Fecha y hora de documentación', type: 'readonly', inheritanceMode: 'system', visibleWhen: hospitalDischargeAbandonmentVisible },
          ],
        },
        {
          key: 'egreso_hosp_resumen',
          title: 'Resumen clínico de estancia',
          fields: [
            { key: 'generarResumenEgresoHosp', label: 'Resumen automático', type: 'action', actionLabel: 'Generar egreso automático' },
            { key: 'motivoIngresoEgresoHosp', label: 'Motivo de ingreso', type: 'textarea' },
            { key: 'diagnosticoIngresoEgresoHosp', label: 'Diagnóstico de ingreso', type: 'text' },
            { key: 'diagnosticoFinalEgresoHosp', label: 'Diagnóstico final', type: 'text' },
            { key: 'cie10EgresoHosp', label: 'CIE-10', type: 'text' },
            { key: 'procedimientosRealizadosEstanciaHosp', label: 'Procedimientos realizados durante estancia', type: 'textarea' },
            { key: 'manejoRealizadoEgresoHosp', label: 'Manejo realizado', type: 'textarea' },
            { key: 'evolucionEstanciaEgresoHosp', label: 'Evolución durante estancia', type: 'textarea' },
            { key: 'problemasPendientesEgresoHosp', label: 'Problemas clínicos pendientes', type: 'textarea' },
            { key: 'resumenNarrativoEgresoHosp', label: 'Resumen narrativo adicional', type: 'textarea' },
          ],
        },
        {
          key: 'egreso_hosp_plan',
          title: 'Plan de egreso estructurado',
          fields: [
            { key: 'medicamentosEgresoHosp', label: 'Medicamentos al egreso', type: 'textarea' },
            { key: 'justificacionSinRecetaEgresoHosp', label: 'Justificación si no hay receta vinculada', type: 'textarea' },
            { key: 'cuidadosDomicilioEgresoHosp', label: 'Cuidados en domicilio', type: 'textarea' },
            { key: 'dietaEgresoHosp', label: 'Dieta', type: 'textarea' },
            { key: 'actividadRestriccionesEgresoHosp', label: 'Actividad / restricciones', type: 'textarea' },
            { key: 'seguimientoEgresoHosp', label: 'Seguimiento', type: 'textarea' },
            { key: 'fechaProximaCitaEgresoHosp', label: 'Fecha próxima cita', type: 'date' },
          ],
        },
        {
          key: 'egreso_hosp_educacion',
          title: 'Signos de alarma y educación',
          fields: [
            { key: 'signosAlarmaEgresoHosp', label: 'Signos de alarma', type: 'textarea' },
            { key: 'educacionOtorgadaEgresoHosp', label: 'Educación otorgada', type: 'textarea' },
            { key: 'comprensionPacienteEgresoHosp', label: 'Comprensión del paciente', type: 'select', options: comprehensionOptions },
          ],
        },
        {
          key: 'egreso_hosp_receta_incapacidad',
          title: 'Receta e incapacidad',
          fields: [
            { key: 'recetaGeneradaEgresoHosp', label: 'Receta generada', type: 'select', options: yesNoUnknownOptions },
            { key: 'idRecetaRelacionadaEgresoHosp', label: 'ID receta relacionada', type: 'text' },
            { key: 'diasIncapacidadEgresoHosp', label: 'Días de incapacidad', type: 'number' },
            { key: 'tipoIncapacidadEgresoHosp', label: 'Tipo de incapacidad', type: 'select', options: [
              { value: '', label: 'Sin incapacidad' },
              { value: 'ENFERMEDAD_GENERAL', label: 'Enfermedad general' },
              { value: 'RIESGO_TRABAJO', label: 'Riesgo de trabajo' },
              { value: 'MATERNIDAD', label: 'Maternidad' },
            ] },
          ],
        },
        {
          key: 'egreso_hosp_responsable',
          title: 'Pronóstico, cierre y firma',
          fields: [
            { key: 'pronosticoEgresoHosp', label: 'Pronóstico', type: 'textarea' },
            { key: 'medicoResponsableEgresoHosp', label: 'Médico responsable de egreso', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaResponsableEgresoHosp', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'alertaCierreEgresoHosp', label: 'Alerta de cierre', type: 'readonly', inheritanceMode: 'system' },
            { key: 'medicoLegalEgresoHosp', label: 'Nombre completo del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaLegalEgresoHosp', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'especialidadLegalEgresoHosp', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionEgresoHosp', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarEgresoHosp', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description: 'Resumen y observaciones documentales.',
      icon: FileText,
      sections: [
        {
          key: 'documentos_hosp',
          title: 'Control documental',
          fields: [
            { key: 'resumenDocumentosHosp', label: 'Resumen', type: 'textarea' },
            {
              key: 'pendientesDocumentalesHosp',
              label: 'Pendientes documentales',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
  SURGERY: [
    {
      key: 'Valoración preprocedimiento',
      title: 'Valoración preprocedimiento',
      description: 'Motivo, antecedentes, evaluación de riesgo y preparación.',
      icon: ClipboardCheck,
      sections: [
        {
          key: 'preproc_subjetivo',
          title: 'Subjetivo: motivo y antecedentes',
          description: 'Indicación clínica, diagnóstico, antecedentes y medicación relevante.',
          fields: [
            { key: 'tipoRegistroPreproc', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'diagnosticoPreoperatorioPreproc', label: 'Diagnóstico preoperatorio', type: 'text' },
            { key: 'cie10Preproc', label: 'CIE-10', type: 'text', placeholder: 'Buscar o capturar código CIE-10' },
            { key: 'procedimientoIndicadoPreproc', label: 'Procedimiento indicado', type: 'text' },
            { key: 'codigoProcedimientoPreproc', label: 'Código de procedimiento', type: 'text', placeholder: 'CIE-9-MC / CIE-10-PCS' },
            { key: 'indicacionClinicaPreproc', label: 'Indicación clínica', type: 'textarea' },
            {
              key: 'tipoProcedimientoPreproc',
              label: 'Tipo de procedimiento',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'ELECTIVO', label: 'Electivo' },
                { value: 'URGENTE', label: 'Urgente' },
              ],
            },
            { key: 'sintomasActualesPreproc', label: 'Síntomas actuales', type: 'textarea' },
            { key: 'evolucionPadecimientoPreproc', label: 'Evolución del padecimiento', type: 'textarea' },
            {
              key: 'antecedentesRelevantesPreprocSubtitle',
              label: 'Antecedentes relevantes para el procedimiento',
              type: 'subtitle',
            },
            { key: 'antDiabetesPreproc', label: 'Diabetes', type: 'checkbox' },
            { key: 'antHipertensionPreproc', label: 'Hipertensión', type: 'checkbox' },
            { key: 'antCardiopatiaPreproc', label: 'Cardiopatía', type: 'checkbox' },
            { key: 'antCoagulopatiaPreproc', label: 'Coagulopatía', type: 'checkbox' },
            { key: 'antHepatopatiaPreproc', label: 'Hepatopatía', type: 'checkbox' },
            { key: 'antEnfermedadRenalPreproc', label: 'Enfermedad renal', type: 'checkbox' },
            { key: 'antAlergiasMedicamentosasPreproc', label: 'Alergias medicamentosas', type: 'checkbox' },
            { key: 'antCirugiasPreviasPreproc', label: 'Cirugías previas', type: 'checkbox' },
            { key: 'antTabaquismoPreproc', label: 'Tabaquismo', type: 'checkbox' },
            { key: 'detalleAntecedentesPreproc', label: 'Detalle de antecedentes relevantes', type: 'textarea' },
            {
              key: 'comorbilidadesPreproc',
              label: 'Comorbilidades',
              type: 'object-array',
              itemAddLabel: 'Agregar comorbilidad',
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                {
                  key: 'estado',
                  label: 'Estado',
                  type: 'select',
                  options: [
                    { value: '', label: 'Sin especificar' },
                    { value: 'CONTROLADO', label: 'Controlado' },
                    { value: 'DESCONTROLADO', label: 'Descontrolado' },
                  ],
                },
              ],
            },
            {
              key: 'alergiasPreproc',
              label: 'Alergias',
              type: 'object-array',
              itemAddLabel: 'Agregar alergia',
              itemFields: [
                { key: 'sustancia', label: 'Sustancia', type: 'text' },
                { key: 'reaccion', label: 'Reacción', type: 'text' },
                { key: 'severidad', label: 'Severidad', type: 'text' },
              ],
            },
            {
              key: 'medicacionActualPreproc',
              label: 'Medicación actual',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'farmaco', label: 'Fármaco', type: 'text' },
                { key: 'dosis', label: 'Dosis', type: 'text' },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'preproc_objetivo',
          title: 'Objetivo: exploración física y estudios',
          fields: [
            { key: 'pesoKgPreproc', label: 'Peso kg', type: 'number' },
            { key: 'tallaCmPreproc', label: 'Talla cm', type: 'number' },
            { key: 'imcPreproc', label: 'IMC', type: 'readonly', inheritanceMode: 'system' },
            { key: 'taPreproc', label: 'TA', type: 'text' },
            { key: 'fcPreproc', label: 'FC', type: 'number' },
            { key: 'frPreproc', label: 'FR', type: 'number' },
            { key: 'spo2Preproc', label: 'SpO2', type: 'number' },
            { key: 'temperaturaPreproc', label: 'Temperatura', type: 'number' },
            { key: 'glucosaCapilarPreproc', label: 'Glucosa capilar', type: 'number' },
            { key: 'exploracionFisicaPreproc', label: 'Exploración física relevante', type: 'textarea' },
            { key: 'estudiosPreoperatoriosPreproc', label: 'Estudios preoperatorios', type: 'textarea' },
          ],
        },
        {
          key: 'preproc_preanestesica_basica',
          title: 'Evaluación preanestésica y vía aérea',
          fields: [
            {
              key: 'tipoAnestesiaPrevistaPreproc',
              label: 'Tipo anestesia prevista',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'NO_APLICA', label: 'No aplica' },
                { value: 'LOCAL', label: 'Local' },
                { value: 'SEDACION', label: 'Sedación' },
                { value: 'REGIONAL', label: 'Regional' },
                { value: 'GENERAL', label: 'General' },
              ],
            },
            { key: 'mallampatiPreproc', label: 'Mallampati', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'I', label: 'I' }, { value: 'II', label: 'II' }, { value: 'III', label: 'III' }, { value: 'IV', label: 'IV' }] },
            { key: 'aperturaBucalPreproc', label: 'Apertura bucal', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'NORMAL', label: 'Normal' }, { value: 'LIMITADA', label: 'Limitada' }] },
            { key: 'movilidadCervicalPreproc', label: 'Movilidad cervical', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'NORMAL', label: 'Normal' }, { value: 'LIMITADA', label: 'Limitada' }] },
            { key: 'distanciaTiromentonianaPreproc', label: 'Distancia tiromentoniana', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'ADECUADA', label: 'Adecuada' }, { value: 'CORTA', label: 'Corta' }] },
            { key: 'riesgoAnestesicoPreproc', label: 'Riesgo anestésico', type: 'select', options: scoreRiskOptions },
            { key: 'capacidadFuncionalMetsPreproc', label: 'Capacidad funcional METs', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'MENOR_4', label: '< 4 METs' }, { value: '4_A_10', label: '4-10 METs' }, { value: 'MAYOR_10', label: '> 10 METs' }] },
            { key: 'limitacionFuncionalPreproc', label: 'Limitación funcional', type: 'text' },
          ],
        },
        {
          key: 'preproc_analisis',
          title: 'Análisis: evaluación de riesgo',
          fields: [
            { key: 'clasificacionAsaPreproc', label: 'Clasificación ASA', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'ASA_I', label: 'ASA I' }, { value: 'ASA_II', label: 'ASA II' }, { value: 'ASA_III', label: 'ASA III' }, { value: 'ASA_IV', label: 'ASA IV' }, { value: 'ASA_V', label: 'ASA V' }] },
            { key: 'riesgoQuirurgicoPreproc', label: 'Riesgo quirúrgico', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoCardiovascularPreproc', label: 'Riesgo cardiovascular', type: 'select', options: scoreRiskOptions },
            { key: 'riesgoTromboembolicoCapriniPreproc', label: 'Riesgo tromboembólico Caprini', type: 'select', options: scoreRiskOptions },
            { key: 'riesgosInformadosPreproc', label: 'Riesgos del procedimiento informados al paciente', type: 'textarea' },
            { key: 'pronosticoPreproc', label: 'Pronóstico', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'BUENO', label: 'Bueno' }, { value: 'RESERVADO', label: 'Reservado' }, { value: 'MALO', label: 'Malo' }] },
            { key: 'profilaxisIndicadaPreproc', label: 'Profilaxis indicada', type: 'textarea' },
            { key: 'alertasClinicasPreproc', label: 'Alertas clínicas', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'preproc_nom006',
          title: 'Nota preanestésica NOM-006',
          description: 'Obligatoria solo cuando la anestesia prevista sea distinta de No aplica.',
          fields: [
            { key: 'evaluacionClinicaAnestesiaPreproc', label: 'Evaluación clínica del paciente', type: 'textarea' },
            { key: 'antecedentesAnestesicosPreproc', label: 'Antecedentes anestésicos relevantes', type: 'textarea' },
            { key: 'tipoAnestesiaPlaneadaPreproc', label: 'Tipo de anestesia planeada', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'LOCAL', label: 'Local' }, { value: 'SEDACION', label: 'Sedación' }, { value: 'REGIONAL', label: 'Regional' }, { value: 'GENERAL', label: 'General' }] },
            { key: 'riesgoAnestesicoNom006Preproc', label: 'Riesgo anestésico', type: 'select', options: scoreRiskOptions },
            { key: 'alergiasAnestesiaPreproc', label: 'Alergias relevantes para anestesia', type: 'text' },
            { key: 'planAnestesicoPreproc', label: 'Plan anestésico', type: 'textarea' },
            { key: 'nombreAnestesiologoPreproc', label: 'Nombre del anestesiólogo', type: 'text' },
            { key: 'cedulaAnestesiologoPreproc', label: 'Cédula profesional', type: 'number' },
          ],
        },
        {
          key: 'preproc_plan',
          title: 'Plan: preparación y consentimiento',
          fields: [
            { key: 'preparacionPreoperatoriaPreproc', label: 'Preparación preoperatoria', type: 'textarea' },
            { key: 'horasAyunoPreproc', label: 'Horas de ayuno', type: 'number' },
            { key: 'ayunoConfirmadoPreproc', label: 'Ayuno confirmado', type: 'select', options: yesNoUnknownOptions },
            { key: 'suspensionMedicamentosPreproc', label: 'Suspensión de medicamentos', type: 'text' },
            { key: 'atbProfilacticoPreproc', label: 'ATB profiláctico', type: 'text' },
            { key: 'preparacionEspecialPreproc', label: 'Preparación especial', type: 'text' },
            {
              key: 'checklistSeguridadQuirurgicaOmsPreprocSubtitle',
              label: 'Checklist de seguridad quirúrgica (OMS)',
              type: 'subtitle',
            },
            { key: 'omsPacienteIdentificadoPreproc', label: 'Paciente identificado', type: 'checkbox' },
            { key: 'omsProcedimientoConfirmadoPreproc', label: 'Procedimiento confirmado', type: 'checkbox' },
            { key: 'omsSitioQuirurgicoMarcadoPreproc', label: 'Sitio quirúrgico marcado', type: 'checkbox' },
            { key: 'omsConsentimientoFirmadoPreproc', label: 'Consentimiento firmado', type: 'checkbox' },
            { key: 'omsAlergiasVerificadasPreproc', label: 'Alergias verificadas', type: 'checkbox' },
            { key: 'omsEstudiosDisponiblesPreproc', label: 'Estudios disponibles', type: 'checkbox' },
            { key: 'omsAyunoVerificadoPreproc', label: 'Ayuno verificado', type: 'checkbox' },
            { key: 'omsProfilaxisAntibioticaIndicadaPreproc', label: 'Profilaxis antibiótica indicada', type: 'checkbox' },
          ],
        },
        {
          key: 'preproc_consentimiento',
          title: 'Consentimiento informado NOM-004',
          fields: [
            { key: 'institucionConsentimientoPreproc', label: 'Nombre de la institución', type: 'text' },
            { key: 'razonSocialConsentimientoPreproc', label: 'Razón social', type: 'text' },
            { key: 'tituloDocumentoConsentimientoPreproc', label: 'Título del documento', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarFechaConsentimientoPreproc', label: 'Lugar y fecha', type: 'text' },
            { key: 'consentimientoQuirurgicoPreproc', label: 'Consentimiento quirúrgico', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'FIRMADO', label: 'Firmado' }, { value: 'NO_FIRMADO', label: 'No firmado' }] },
            { key: 'consentimientoAnestesicoPreproc', label: 'Consentimiento anestésico', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'FIRMADO', label: 'Firmado' }, { value: 'NO_FIRMADO', label: 'No firmado' }, { value: 'NO_APLICA', label: 'No aplica' }] },
            { key: 'fechaFirmaConsentimientoPreproc', label: 'Fecha firma consentimiento', type: 'date' },
            { key: 'medicoExplicaPreproc', label: 'Médico que explica', type: 'text' },
            { key: 'actoAutorizadoPreproc', label: 'Acto autorizado', type: 'text' },
            { key: 'riesgosEsperadosPreproc', label: 'Riesgos esperados', type: 'textarea' },
            { key: 'beneficiosEsperadosPreproc', label: 'Beneficios esperados', type: 'textarea' },
            { key: 'autorizacionContingenciasPreproc', label: 'Autorización para contingencias', type: 'textarea' },
            { key: 'explicacionPacientePreproc', label: 'Explicación otorgada al paciente', type: 'textarea' },
            { key: 'nombreAutorizaPreproc', label: 'Nombre de quien autoriza', type: 'text' },
            { key: 'relacionPacientePreproc', label: 'Relación con el paciente', type: 'text' },
            { key: 'nombreTestigo1Preproc', label: 'Nombre testigo 1', type: 'text' },
            { key: 'nombreTestigo2Preproc', label: 'Nombre testigo 2', type: 'text' },
            { key: 'nombreRealizaActoPreproc', label: 'Nombre de quien realiza el acto', type: 'text' },
            { key: 'pacienteComprendePreproc', label: 'Paciente comprende información', type: 'checkbox' },
            { key: 'responsableInformadoPreproc', label: 'Responsable informado', type: 'checkbox' },
          ],
        },
        {
          key: 'preproc_legales_firma',
          title: 'Datos legales y firma electrónica',
          fields: [
            { key: 'profesionalNombrePreproc', label: 'Nombre completo del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalCedulaPreproc', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalEspecialidadPreproc', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionPreproc', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'hashPreproc', label: 'Hash / sello documental', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarPreproc', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Procedimiento',
      title: 'Procedimiento',
      description: 'Acto quirúrgico o procedimiento ambulatorio.',
      icon: Scissors,
      sections: [
        {
          key: 'proc_equipo',
          title: 'Equipo quirúrgico',
          fields: [
            { key: 'tipoRegistroProcedimiento', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cirujanoPrincipalProc', label: 'Cirujano principal', type: 'text' },
            { key: 'cedulaCirujanoProc', label: 'Cédula cirujano', type: 'text' },
            { key: 'primerAyudanteProc', label: 'Primer ayudante', type: 'text' },
            { key: 'segundoAyudanteProc', label: 'Segundo ayudante', type: 'text' },
            { key: 'anestesiologoProc', label: 'Anestesiólogo', type: 'text' },
            { key: 'cedulaAnestesiologoProc', label: 'Cédula anestesiólogo', type: 'text' },
            { key: 'instrumentistaProc', label: 'Instrumentista', type: 'text' },
            { key: 'enfermeriaCirculanteProc', label: 'Enfermería circulante', type: 'text' },
          ],
        },
        {
          key: 'proc_timeout',
          title: 'Checklist de seguridad quirúrgica / Time-Out',
          fields: [
            { key: 'toPacienteVerificadoProc', label: 'Paciente verificado: nombre, pulsera, expediente', type: 'checkbox' },
            { key: 'toProcedimientoConfirmadoProc', label: 'Procedimiento confirmado por todo el equipo', type: 'checkbox' },
            { key: 'toSitioConfirmadoProc', label: 'Sitio quirúrgico confirmado y marcado', type: 'checkbox' },
            { key: 'toRealizadoAntesIncisionProc', label: 'Time-Out realizado antes de incisión', type: 'checkbox' },
            { key: 'toProfilaxisAntibioticaProc', label: 'Profilaxis antibiótica administrada', type: 'checkbox' },
            { key: 'toEquipoInstrumentalProc', label: 'Equipo e instrumental verificado', type: 'checkbox' },
            { key: 'toConsentimientoVerificadoProc', label: 'Consentimiento informado verificado', type: 'checkbox' },
            { key: 'toImagenesDisponiblesProc', label: 'Estudios de imagen disponibles en sala', type: 'checkbox' },
          ],
        },
        {
          key: 'proc_descripcion',
          title: 'Descripción del procedimiento',
          fields: [
            { key: 'fechaProcedimientoProc', label: 'Fecha', type: 'date' },
            { key: 'horaInicioRealProc', label: 'Hora inicio real', type: 'time' },
            { key: 'horaFinRealProc', label: 'Hora fin real', type: 'time' },
            { key: 'duracionMinutosProc', label: 'Duración en minutos', type: 'number' },
            { key: 'salaQuirofanoProc', label: 'Quirófano / Sala', type: 'text' },
            { key: 'codigoProcedimientoProc', label: 'Código procedimiento', type: 'text' },
            { key: 'diagnosticoPreoperatorioProc', label: 'Diagnóstico preoperatorio', type: 'text' },
            { key: 'ciePreoperatorioProc', label: 'CIE preoperatorio', type: 'text' },
            { key: 'diagnosticoPostoperatorioProc', label: 'Diagnóstico postoperatorio', type: 'text' },
            { key: 'ciePostoperatorioProc', label: 'CIE postoperatorio', type: 'text' },
            { key: 'procedimientoRealizadoProc', label: 'Procedimiento realizado', type: 'textarea' },
          ],
        },
        {
          key: 'proc_anestesia',
          title: 'Anestesia',
          fields: [
            {
              key: 'tipoAnestesiaProc',
              label: 'Tipo de anestesia',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'NO_APLICA', label: 'No aplica' },
                { value: 'LOCAL', label: 'Local' },
                { value: 'SEDACION', label: 'Sedación' },
                { value: 'REGIONAL', label: 'Regional' },
                { value: 'GENERAL', label: 'General' },
              ],
            },
            { key: 'medicamentosAnestesicosProc', label: 'Medicamentos anestésicos', type: 'textarea' },
            { key: 'eventosAnestesicosProc', label: 'Eventos anestésicos', type: 'textarea' },
            { key: 'alertasAnestesiaProc', label: 'Alertas anestesia', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'proc_tecnica',
          title: 'Técnica quirúrgica y hallazgos',
          fields: [
            { key: 'tecnicaQuirurgicaProc', label: 'Técnica quirúrgica', type: 'textarea' },
            { key: 'hallazgosTransoperatoriosProc', label: 'Hallazgos transoperatorios', type: 'textarea' },
            {
              key: 'clasificacionHeridaProc',
              label: 'Clasificación de herida quirúrgica',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opción' },
                { value: 'LIMPIA', label: 'Limpia' },
                { value: 'LIMPIA_CONTAMINADA', label: 'Limpia-contaminada' },
                { value: 'CONTAMINADA', label: 'Contaminada' },
                { value: 'SUCIA', label: 'Sucia' },
              ],
            },
          ],
        },
        {
          key: 'proc_transoperatorio',
          title: 'Datos transoperatorios',
          fields: [
            { key: 'sangradoEstimadoMlProc', label: 'Sangrado estimado en ml', type: 'number' },
            { key: 'liquidosIvProc', label: 'Líquidos IV', type: 'text' },
            { key: 'transfusionesProc', label: 'Transfusiones', type: 'select', options: yesNoUnknownOptions },
            { key: 'drenajesColocadosProc', label: 'Drenajes colocados', type: 'text' },
            {
              key: 'materialesProc',
              label: 'Material utilizado',
              type: 'object-array',
              itemAddLabel: 'Agregar material',
              itemFields: [
                { key: 'nombre', label: 'Material', type: 'text' },
                { key: 'cantidad', label: 'Cantidad', type: 'text' },
                { key: 'loteSerie', label: 'Lote / serie', type: 'text' },
              ],
            },
            { key: 'implantesDispositivosProc', label: 'Implantes / Prótesis / Dispositivos', type: 'text' },
            { key: 'lotesSeriesProc', label: 'Lotes / Series', type: 'text' },
            { key: 'cuentaGasasInstrumentalProc', label: 'Cuenta de gasas e instrumental', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'COMPLETA', label: 'Completa' }, { value: 'INCOMPLETA', label: 'Incompleta' }] },
          ],
        },
        {
          key: 'proc_patologia',
          title: 'Pieza quirúrgica / Patología',
          fields: [
            { key: 'descripcionPiezaProc', label: 'Descripción de pieza quirúrgica', type: 'textarea' },
            { key: 'envioPatologiaProc', label: 'Envío a patología', type: 'select', options: yesNoUnknownOptions },
            { key: 'folioPatologiaProc', label: 'Folio de patología', type: 'text' },
          ],
        },
        {
          key: 'proc_complicaciones',
          title: 'Complicaciones',
          fields: [
            { key: 'huboComplicacionesProc', label: '¿Hubo complicaciones?', type: 'select', options: yesNoUnknownOptions },
            { key: 'conversionAbiertaProc', label: 'Conversión a abierta', type: 'select', options: yesNoUnknownOptions },
            { key: 'tipoComplicacionProc', label: 'Tipo de complicación', type: 'textarea' },
            { key: 'manejoComplicacionProc', label: 'Manejo de complicación', type: 'textarea' },
          ],
        },
        {
          key: 'proc_destino',
          title: 'Destino e indicaciones inmediatas',
          fields: [
            { key: 'destinoPostprocedimientoProc', label: 'Destino postprocedimiento', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'RECUPERACION_AMBULATORIA', label: 'Recuperación ambulatoria' }, { value: 'OBSERVACION', label: 'Observación' }, { value: 'HOSPITALIZACION', label: 'Hospitalización' }] },
            { key: 'requiereMonitorizacionProc', label: 'Requiere monitorización', type: 'select', options: yesNoUnknownOptions },
            { key: 'indicacionesInmediatasProc', label: 'Indicaciones inmediatas postprocedimiento', type: 'textarea' },
            { key: 'alertaDestinoProc', label: 'Alerta de destino', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'proc_postanestesica',
          title: 'Nota postanestésica',
          description: 'Obligatoria cuando la anestesia sea distinta de No aplica.',
          fields: [
            { key: 'postMedicamentosAnestesicosProc', label: 'Medicamentos anestésicos utilizados', type: 'textarea' },
            { key: 'postDuracionAnestesiaProc', label: 'Duración de la anestesia', type: 'text' },
            { key: 'postSangreAplicadaProc', label: 'Cantidad de sangre aplicada', type: 'text' },
            { key: 'postSolucionesAplicadasProc', label: 'Cantidad de soluciones aplicadas', type: 'text' },
            { key: 'postIncidentesAnestesiaProc', label: 'Incidentes atribuibles a la anestesia', type: 'textarea' },
            { key: 'postEstadoClinicoEgresoSalaProc', label: 'Estado clínico al egreso de sala', type: 'textarea' },
            { key: 'postPlanManejoProc', label: 'Plan de manejo postanestésico', type: 'textarea' },
            { key: 'postNombreAnestesiologoProc', label: 'Nombre del anestesiólogo', type: 'text' },
            { key: 'postCedulaAnestesiologoProc', label: 'Cédula profesional', type: 'text' },
          ],
        },
        {
          key: 'proc_legales_firma',
          title: 'Datos legales y firma electrónica NOM-004',
          fields: [
            { key: 'profesionalNombreProc', label: 'Nombre completo del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalCedulaProc', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalEspecialidadProc', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionProc', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'hashProc', label: 'Hash / sello documental', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarProc', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Recuperación / Evaluación',
      title: 'Recuperación / Evaluación',
      description: 'Vigilancia postprocedimiento, Aldrete, criterios de alta y continuidad hacia egreso.',
      icon: Activity,
      sections: [
        {
          key: 'rec_eval_subjetivo',
          title: 'Subjetivo: sintomatología postprocedimiento',
          fields: [
            { key: 'tipoRegistroRecEval', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'fechaRecEval', label: 'Fecha', type: 'date' },
            { key: 'horaValoracionRecEval', label: 'Hora de valoración', type: 'time' },
            { key: 'tiempoPostprocedimientoRecEval', label: 'Tiempo postprocedimiento', type: 'readonly', inheritanceMode: 'system' },
            { key: 'frecuenciaMonitoreoRecEval', label: 'Frecuencia de monitoreo', type: 'text' },
            { key: 'sintomasPacienteRecEval', label: 'Síntomas referidos por el paciente', type: 'textarea' },
            { key: 'toleranciaViaOralRecEval', label: 'Tolerancia vía oral', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'NO_TOLERA', label: 'No tolera' }, { value: 'LIQUIDOS_CLAROS', label: 'Líquidos claros' }, { value: 'DIETA_BLANDA', label: 'Dieta blanda' }, { value: 'NORMAL', label: 'Normal' }] },
            { key: 'deambulacionRecEval', label: 'Deambulación', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'NO_DEAMBULA', label: 'No deambula' }, { value: 'CON_ASISTENCIA', label: 'Con asistencia' }, { value: 'INDEPENDIENTE', label: 'Independiente' }] },
            { key: 'miccionRecEval', label: 'Micción', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'AUSENTE', label: 'Ausente' }, { value: 'PRESENTE', label: 'Presente' }, { value: 'RETENCION_URINARIA', label: 'Retención urinaria' }] },
          ],
        },
        {
          key: 'rec_eval_objetivo',
          title: 'Objetivo: signos vitales y exploración',
          fields: [
            { key: 'taSistolicaRecEval', label: 'TA sistólica', type: 'number' },
            { key: 'taDiastolicaRecEval', label: 'TA diastólica', type: 'number' },
            { key: 'fcRecEval', label: 'FC', type: 'number' },
            { key: 'frRecEval', label: 'FR', type: 'number' },
            { key: 'spo2RecEval', label: 'SpO2', type: 'number' },
            { key: 'temperaturaRecEval', label: 'Temperatura', type: 'number' },
            { key: 'dolorEvaRecEval', label: 'Dolor EVA 0-10', type: 'number' },
            { key: 'glasgowRecEval', label: 'Glasgow 3-15', type: 'number' },
            { key: 'glucosaCapilarRecEval', label: 'Glucosa capilar', type: 'number' },
            { key: 'estadoConcienciaRecEval', label: 'Estado de conciencia', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'ALERTA', label: 'Alerta' }, { value: 'SOMNOLIENTO', label: 'Somnoliento' }, { value: 'ESTUPOR', label: 'Estupor' }, { value: 'COMA', label: 'Coma' }] },
            { key: 'estadoGeneralRecEval', label: 'Estado general', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'ESTABLE', label: 'Estable' }, { value: 'INESTABLE', label: 'Inestable' }, { value: 'CRITICO', label: 'Crítico' }] },
            { key: 'exploracionPostprocedimientoRecEval', label: 'Exploración postprocedimiento', type: 'textarea' },
            { key: 'complicacionesPostprocedimientoRecEval', label: 'Complicaciones postprocedimiento', type: 'select', options: yesNoUnknownOptions },
            { key: 'manejoComplicacionRecEval', label: 'Manejo de complicación', type: 'textarea' },
          ],
        },
        {
          key: 'rec_eval_aldrete',
          title: 'Análisis: escala de Aldrete y criterios de alta',
          fields: [
            { key: 'aldreteActividadRecEval', label: 'Actividad motora', type: 'select', options: [{ value: '', label: 'Sin calcular' }, { value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
            { key: 'aldreteRespiracionRecEval', label: 'Respiración', type: 'select', options: [{ value: '', label: 'Sin calcular' }, { value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
            { key: 'aldreteCirculacionRecEval', label: 'Circulación', type: 'select', options: [{ value: '', label: 'Sin calcular' }, { value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
            { key: 'aldreteConcienciaRecEval', label: 'Conciencia', type: 'select', options: [{ value: '', label: 'Sin calcular' }, { value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
            { key: 'aldreteSpo2RecEval', label: 'SpO2', type: 'select', options: [{ value: '', label: 'Sin calcular' }, { value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
            { key: 'aldreteTotalRecEval', label: 'Aldrete total', type: 'readonly', inheritanceMode: 'system' },
            { key: 'aldreteInterpretacionRecEval', label: 'Interpretación Aldrete', type: 'readonly', inheritanceMode: 'system' },
            {
              key: 'criteriosAltaAmbulatoriaRecEvalSubtitle',
              label: 'Criterios de alta ambulatoria',
              type: 'subtitle',
            },
            { key: 'altaToleraViaOralRecEval', label: 'Tolera vía oral sin náusea ni vómito', type: 'checkbox' },
            { key: 'altaDeambulacionIndependienteRecEval', label: 'Deambulación independiente', type: 'checkbox' },
            { key: 'altaMiccionEspontaneaRecEval', label: 'Micción espontánea', type: 'checkbox' },
            { key: 'altaDolorControladoRecEval', label: 'Dolor controlado EVA ≤ 4', type: 'checkbox' },
            { key: 'altaSinNauseaVomitoRecEval', label: 'Sin náusea ni vómito', type: 'checkbox' },
            { key: 'altaSignosVitalesEstablesRecEval', label: 'Signos vitales estables ≥ 1h', type: 'checkbox' },
            { key: 'altaHeridasSinSangradoRecEval', label: 'Heridas quirúrgicas sin sangrado', type: 'checkbox' },
            { key: 'altaAldreteMayorIgual9RecEval', label: 'Aldrete ≥ 9', type: 'checkbox' },
            { key: 'altaAcompananteResponsableRecEval', label: 'Acompañante responsable presente', type: 'checkbox' },
            { key: 'altaInstruccionesEntregadasRecEval', label: 'Instrucciones de egreso entregadas', type: 'checkbox' },
          ],
        },
        {
          key: 'rec_eval_eventos',
          title: 'Eventos adversos',
          fields: [
            { key: 'eventoAdversoRecEval', label: '¿Evento adverso?', type: 'select', options: yesNoUnknownOptions },
            { key: 'descripcionAccionEventoRecEval', label: 'Descripción / acción realizada', type: 'textarea' },
          ],
        },
        {
          key: 'rec_eval_plan',
          title: 'Plan: vigilancia y destino',
          fields: [
            { key: 'planVigilanciaRecEval', label: 'Plan de vigilancia', type: 'textarea' },
            { key: 'tiempoEnRecuperacionMinRecEval', label: 'Tiempo en recuperación (minutos)', type: 'number' },
            { key: 'destinoPostRecuperacionRecEval', label: 'Destino post-recuperación', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'ALTA_AMBULATORIA', label: 'Alta ambulatoria' }, { value: 'OBSERVACION_PROLONGADA', label: 'Observación prolongada' }, { value: 'HOSPITALIZACION', label: 'Hospitalización' }] },
            { key: 'cambiosValoracionInmediataRecEval', label: 'Cambios respecto a valoración inmediata', type: 'textarea' },
          ],
        },
        {
          key: 'rec_eval_alertas',
          title: 'Alertas automáticas',
          description: 'Indicadores calculados de estabilidad clínica y riesgo antes del egreso.',
          fields: [
            { key: 'semaforoRecEval', label: 'Semáforo clínico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'alertasAutomaticasRecEval', label: 'Alertas automáticas', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'rec_eval_enfermeria',
          title: 'Registro de enfermería',
          fields: [
            {
              key: 'registrosEnfermeriaRecEval',
              label: 'Registros por turno',
              type: 'object-array',
              itemAddLabel: 'Agregar registro de enfermería',
              itemFields: [
                { key: 'fecha', label: 'Fecha', type: 'date' },
                { key: 'hora', label: 'Hora', type: 'time' },
                { key: 'turno', label: 'Turno', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'MATUTINO', label: 'Matutino' }, { value: 'VESPERTINO', label: 'Vespertino' }, { value: 'NOCTURNO', label: 'Nocturno' }] },
                { key: 'nombreElabora', label: 'Nombre de quien elabora', type: 'text' },
                { key: 'habitusExterior', label: 'Hábitus exterior', type: 'textarea' },
                { key: 'ministracionMedicamentos', label: 'Ministración de medicamentos', type: 'textarea' },
                { key: 'procedimientosEnfermeria', label: 'Procedimientos realizados por enfermería', type: 'textarea' },
                { key: 'dolorEva', label: 'Valoración del dolor EVA', type: 'number' },
                { key: 'riesgoCaidas', label: 'Riesgo de caídas', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'BAJO', label: 'Bajo' }, { value: 'MEDIO', label: 'Medio' }, { value: 'ALTO', label: 'Alto' }] },
                { key: 'observaciones', label: 'Observaciones de enfermería', type: 'textarea' },
              ],
            },
          ],
        },
        {
          key: 'rec_eval_auxiliares',
          title: 'Servicios auxiliares de diagnóstico y tratamiento',
          fields: [
            {
              key: 'serviciosAuxiliaresRecEval',
              label: 'Servicios auxiliares vinculables',
              type: 'object-array',
              itemAddLabel: 'Agregar servicio auxiliar',
              itemFields: [
                { key: 'fechaHoraEstudio', label: 'Fecha y hora del estudio', type: 'datetime-local' },
                { key: 'estudioSolicitado', label: 'Estudio solicitado', type: 'text' },
                { key: 'problemaClinico', label: 'Problema clínico en estudio', type: 'text' },
                { key: 'incidentesAccidentes', label: 'Incidentes o accidentes', type: 'text' },
                { key: 'descripcionResultados', label: 'Descripción de resultados', type: 'textarea' },
                { key: 'interpretacionMedico', label: 'Interpretación por el médico tratante', type: 'textarea' },
                { key: 'nombreMedico', label: 'Nombre del médico', type: 'text' },
                { key: 'folioEstudio', label: 'Folio del estudio', type: 'text' },
              ],
            },
          ],
        },
        {
          key: 'rec_eval_legales_firma',
          title: 'Datos legales y firma electrónica NOM-004',
          fields: [
            { key: 'profesionalNombreRecEval', label: 'Nombre completo del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalCedulaRecEval', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalEspecialidadRecEval', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionRecEval', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'hashRecEval', label: 'Hash / sello documental', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarRecEval', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Receta e indicaciones de egreso',
      title: 'Receta e indicaciones de egreso',
      description: 'Documento dual de receta médica electrónica e indicaciones de egreso.',
      icon: Pill,
      sections: [
        {
          key: 'receta_egreso_datos',
          title: 'Receta electrónica: datos de la receta',
          fields: [
            { key: 'tipoRegistroRecetaEgreso', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'folioRecetaEgreso', label: 'Folio receta', type: 'readonly', inheritanceMode: 'system' },
            { key: 'tipoRecetaEgreso', label: 'Tipo de receta', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'SIMPLE', label: 'Simple' }, { value: 'ANTIBIOTICO', label: 'Con antibiótico' }, { value: 'CONTROLADA', label: 'Controlada' }] },
            { key: 'fechaEmisionRecetaEgreso', label: 'Fecha de emisión', type: 'date' },
            { key: 'vigenciaRecetaEgreso', label: 'Vigencia', type: 'text' },
            { key: 'institucionEmisoraRecetaEgreso', label: 'Institución emisora', type: 'readonly', inheritanceMode: 'system' },
            { key: 'rfcMedicoRecetaEgreso', label: 'RFC médico', type: 'readonly', inheritanceMode: 'system' },
            { key: 'licenciaSanitariaRecetaEgreso', label: 'Licencia sanitaria', type: 'readonly', inheritanceMode: 'system' },
            { key: 'qrVerificacionRecetaEgreso', label: 'QR de verificación', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'receta_egreso_medicamentos',
          title: 'Receta electrónica: medicamentos',
          fields: [
            { key: 'alertasAlergiasRecetaEgreso', label: 'Alerta de alergias', type: 'readonly', inheritanceMode: 'system' },
            {
              key: 'medicamentosRecetaEgreso',
              label: 'Lista de medicamentos',
              type: 'object-array',
              itemAddLabel: 'Agregar medicamento',
              itemFields: [
                { key: 'medicamento', label: 'Medicamento', type: 'text' },
                { key: 'dosis', label: 'Dosis', type: 'text' },
                { key: 'via', label: 'Vía', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'VO', label: 'VO' }, { value: 'IV', label: 'IV' }, { value: 'IM', label: 'IM' }, { value: 'SC', label: 'SC' }, { value: 'SL', label: 'SL' }] },
                { key: 'frecuencia', label: 'Frecuencia', type: 'text' },
                { key: 'duracion', label: 'Duración', type: 'text' },
                { key: 'tipo', label: 'Tipo', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'LIBRE', label: 'Libre' }, { value: 'ANTIBIOTICO', label: 'Antibiótico' }, { value: 'CONTROLADO', label: 'Controlado' }] },
                { key: 'indicacion', label: 'Indicación', type: 'text' },
              ],
            },
            { key: 'validacionesMedicamentosRecetaEgreso', label: 'Validaciones automáticas', type: 'readonly', inheritanceMode: 'system' },
            { key: 'semaforoMedicamentosRecetaEgreso', label: 'Semáforo medicamentos', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'indicaciones_egreso_plan',
          title: 'Indicaciones de egreso: plan e instrucciones',
          fields: [
            { key: 'dietaIndicacionesEgreso', label: 'Dieta', type: 'textarea' },
            { key: 'actividadFisicaNivelEgreso', label: 'Actividad física', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'REPOSO', label: 'Reposo' }, { value: 'MODERADO', label: 'Moderado' }, { value: 'LIBRE', label: 'Libre' }] },
            { key: 'actividadFisicaDetalleEgreso', label: 'Detalle de actividad física', type: 'text' },
            { key: 'cuidadosHeridaEgreso', label: 'Cuidados de herida', type: 'textarea' },
            { key: 'vigilanciaDomiciliariaEgreso', label: 'Vigilancia domiciliaria', type: 'textarea' },
            { key: 'signosAlarmaEgreso', label: 'Signos de alarma', type: 'textarea' },
          ],
        },
        {
          key: 'indicaciones_egreso_seguimiento',
          title: 'Seguimiento y educación al paciente',
          fields: [
            { key: 'fechaCitaSeguimientoEgreso', label: 'Fecha de cita de seguimiento', type: 'date' },
            { key: 'tipoCitaSeguimientoEgreso', label: 'Tipo de cita', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'CONTROL_POSTOPERATORIO', label: 'Control postoperatorio' }, { value: 'REVISION', label: 'Revisión' }, { value: 'ESPECIALIDAD', label: 'Especialidad' }] },
            { key: 'motivoCitaSeguimientoEgreso', label: 'Motivo de la cita', type: 'text' },
            { key: 'educacionOtorgadaEgreso', label: 'Educación otorgada', type: 'textarea' },
            { key: 'pacienteComprendeIndicacionesEgreso', label: 'Paciente comprende indicaciones', type: 'checkbox' },
            { key: 'familiarInformadoEgreso', label: 'Familiar / acompañante informado', type: 'checkbox' },
          ],
        },
        {
          key: 'receta_egreso_legales_firma',
          title: 'Datos legales y firma NOM-004',
          fields: [
            { key: 'profesionalNombreRecetaEgreso', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalCedulaRecetaEgreso', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalEspecialidadRecetaEgreso', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionRecetaEgreso', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'hashRecetaEgreso', label: 'Hash / sello documental', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarRecetaEgreso', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Egreso',
      title: 'Egreso',
      description: 'Cierre clínico del procedimiento ambulatorio.',
      icon: FileCheck,
      sections: [
        {
          key: 'egreso_amb_datos',
          title: 'Datos de egreso',
          fields: [
            { key: 'tipoRegistroEgresoAmb', label: 'Tipo de registro', type: 'readonly', inheritanceMode: 'system' },
            { key: 'tipoEgresoAmb', label: 'Tipo de egreso', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'ALTA_MEDICA', label: 'Alta médica' }, { value: 'TRASLADO', label: 'Traslado' }, { value: 'REFERENCIA', label: 'Referencia' }] },
            { key: 'destinoEgresoAmb', label: 'Destino', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'DOMICILIO', label: 'Domicilio' }, { value: 'UNIDAD_RECEPTORA', label: 'Unidad receptora' }, { value: 'HOSPITALIZACION', label: 'Hospitalización' }] },
            { key: 'fechaEgresoAmb', label: 'Fecha de egreso', type: 'date' },
            { key: 'horaEgresoAmb', label: 'Hora de egreso', type: 'time' },
            { key: 'diagnosticoFinalEgresoAmb', label: 'Diagnóstico final', type: 'text' },
            { key: 'cie10EgresoAmb', label: 'CIE-10', type: 'text' },
            { key: 'condicionesEgresoAmb', label: 'Condiciones de egreso', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'MEJORIA', label: 'Mejoría' }, { value: 'IGUAL', label: 'Igual' }, { value: 'DETERIORO', label: 'Deterioro' }] },
            { key: 'estadoClinicoEgresoAmb', label: 'Estado clínico al egreso', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'ESTABLE', label: 'Estable' }, { value: 'INESTABLE', label: 'Inestable' }] },
          ],
        },
        {
          key: 'egreso_amb_signos',
          title: 'Signos vitales al egreso',
          fields: [
            { key: 'taEgresoAmb', label: 'TA', type: 'text' },
            { key: 'fcEgresoAmb', label: 'FC', type: 'number' },
            { key: 'frEgresoAmb', label: 'FR', type: 'number' },
            { key: 'temperaturaEgresoAmb', label: 'Temperatura', type: 'number' },
            { key: 'spo2EgresoAmb', label: 'SpO2', type: 'number' },
            { key: 'glucosaCapilarEgresoAmb', label: 'Glucosa capilar', type: 'number' },
            { key: 'evaDolorEgresoAmb', label: 'EVA dolor', type: 'number' },
            { key: 'aldreteEgresoAmb', label: 'Escala Aldrete', type: 'number' },
            { key: 'pronosticoEgresoAmb', label: 'Pronóstico', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'BUENO', label: 'Bueno' }, { value: 'RESERVADO', label: 'Reservado' }, { value: 'MALO', label: 'Malo' }] },
          ],
        },
        {
          key: 'egreso_amb_criterios',
          title: 'Criterios de alta',
          fields: [
            { key: 'altaSignosEstablesEgresoAmb', label: 'Signos vitales estables > 1 hora', type: 'checkbox' },
            { key: 'altaDolorControladoEgresoAmb', label: 'Dolor controlado EVA ≤ 4', type: 'checkbox' },
            { key: 'altaToleraViaOralEgresoAmb', label: 'Tolera vía oral sin náusea/vómito', type: 'checkbox' },
            { key: 'altaDeambulacionEgresoAmb', label: 'Deambulación independiente', type: 'checkbox' },
            { key: 'altaMiccionEgresoAmb', label: 'Micción espontánea', type: 'checkbox' },
            { key: 'altaHeridasSinSangradoEgresoAmb', label: 'Heridas sin sangrado', type: 'checkbox' },
            { key: 'altaAldreteMayor9EgresoAmb', label: 'Aldrete ≥ 9', type: 'checkbox' },
            { key: 'altaAcompananteEgresoAmb', label: 'Acompañante responsable presente', type: 'checkbox' },
            { key: 'altaIndicacionesEntregadasEgresoAmb', label: 'Indicaciones escritas entregadas', type: 'checkbox' },
            { key: 'altaRecetaEntregadaEgresoAmb', label: 'Receta médica entregada', type: 'checkbox' },
            { key: 'cumpleCriteriosAltaEgresoAmb', label: '¿Cumple criterios de alta?', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'SI', label: 'Sí — Cumple todos' }, { value: 'NO', label: 'No — No cumple' }] },
            { key: 'aldreteFinalEgresoAmb', label: 'Escala Aldrete final', type: 'number' },
          ],
        },
        {
          key: 'egreso_amb_resumen',
          title: 'Resumen clínico',
          fields: [
            { key: 'motivoProcedimientoEgresoAmb', label: 'Motivo del procedimiento', type: 'textarea' },
            { key: 'procedimientoRealizadoEgresoAmb', label: 'Procedimiento realizado', type: 'textarea' },
            { key: 'evolucionRecuperacionEgresoAmb', label: 'Evolución en recuperación', type: 'textarea' },
            { key: 'estadoAlEgresoResumenAmb', label: 'Estado al egreso', type: 'textarea' },
          ],
        },
        {
          key: 'egreso_amb_plan',
          title: 'Plan de egreso, incapacidad y educación',
          fields: [
            { key: 'planVinculadoRecetaEgresoAmb', label: 'Plan vinculado a receta', type: 'readonly', inheritanceMode: 'system' },
            { key: 'medicamentosRecetaEgresoAmb', label: 'Medicamentos', type: 'readonly', inheritanceMode: 'system' },
            { key: 'recetaIdEgresoAmb', label: 'Receta ID', type: 'readonly', inheritanceMode: 'system' },
            { key: 'seguimientoEgresoAmb', label: 'Seguimiento', type: 'readonly', inheritanceMode: 'system' },
            { key: 'diasIncapacidadEgresoAmb', label: 'Días de incapacidad', type: 'number' },
            { key: 'tipoIncapacidadEgresoAmb', label: 'Tipo de incapacidad', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'LABORAL', label: 'Laboral' }, { value: 'ESCOLAR', label: 'Escolar' }, { value: 'NINGUNA', label: 'Ninguna' }] },
            { key: 'educacionPacienteEgresoAmb', label: 'Educación otorgada al paciente', type: 'textarea' },
            { key: 'pacienteComprendeEgresoAmb', label: 'Paciente comprende indicaciones', type: 'checkbox' },
            { key: 'familiarInformadoEgresoAmb', label: 'Familiar / acompañante informado', type: 'checkbox' },
            { key: 'recetaRelacionadaEgresoAmb', label: 'Receta relacionada', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'egreso_amb_referencia',
          title: 'Referencia / Traslado',
          description: 'Completar cuando el tipo de egreso sea Referencia o Traslado.',
          fields: [
            { key: 'referenciaFechaHoraEgresoAmb', label: 'Fecha y hora', type: 'datetime-local' },
            { key: 'referenciaMotivoEnvioEgresoAmb', label: 'Motivo de envío', type: 'textarea' },
            { key: 'referenciaResumenClinicoEgresoAmb', label: 'Resumen clínico', type: 'textarea' },
            { key: 'referenciaExploracionFisicaEgresoAmb', label: 'Exploración física', type: 'textarea' },
            { key: 'referenciaResultadosEstudiosEgresoAmb', label: 'Resultados de estudios', type: 'textarea' },
            { key: 'referenciaDiagnosticosEgresoAmb', label: 'Diagnóstico(s)', type: 'text' },
            { key: 'referenciaPlanTratamientoEgresoAmb', label: 'Plan / tratamiento previo', type: 'textarea' },
            { key: 'referenciaPronosticoEgresoAmb', label: 'Pronóstico', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'BUENO', label: 'Bueno' }, { value: 'RESERVADO', label: 'Reservado' }, { value: 'MALO', label: 'Malo' }] },
            { key: 'referenciaEstablecimientoEnviaEgresoAmb', label: 'Establecimiento que envía', type: 'readonly', inheritanceMode: 'system' },
            { key: 'referenciaEstablecimientoReceptorEgresoAmb', label: 'Establecimiento receptor', type: 'text' },
            { key: 'referenciaMedicoReceptorEgresoAmb', label: 'Médico responsable receptor', type: 'text' },
            { key: 'referenciaMedioTrasladoEgresoAmb', label: 'Medio de traslado', type: 'select', options: [{ value: '', label: 'Selecciona una opción' }, { value: 'PROPIO', label: 'Propio' }, { value: 'AMBULANCIA', label: 'Ambulancia' }, { value: 'OTRO', label: 'Otro' }] },
            { key: 'referenciaCondicionesTrasladoEgresoAmb', label: 'Condiciones de traslado', type: 'textarea' },
            { key: 'referenciaSignosVitalesEgresoAmb', label: 'Signos vitales al traslado', type: 'text' },
            { key: 'referenciaMedicoEmisorEgresoAmb', label: 'Médico emisor', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'egreso_amb_responsable',
          title: 'Responsable de egreso',
          fields: [
            { key: 'medicoAutorizaEgresoAmb', label: 'Médico que autoriza egreso', type: 'readonly', inheritanceMode: 'system' },
            { key: 'cedulaAutorizaEgresoAmb', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'alertaCierreEgresoAmb', label: 'Alerta de cierre', type: 'readonly', inheritanceMode: 'system' },
          ],
        },
        {
          key: 'egreso_amb_legales',
          title: 'Datos legales y firma',
          fields: [
            { key: 'profesionalNombreEgresoAmb', label: 'Nombre del profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalCedulaEgresoAmb', label: 'Cédula profesional', type: 'readonly', inheritanceMode: 'system' },
            { key: 'profesionalEspecialidadEgresoAmb', label: 'Especialidad', type: 'readonly', inheritanceMode: 'system' },
            { key: 'lugarAtencionEgresoAmb', label: 'Lugar de atención', type: 'readonly', inheritanceMode: 'system' },
            { key: 'hashEgresoAmb', label: 'Hash / sello documental', type: 'readonly', inheritanceMode: 'system' },
            { key: 'firmarEgresoAmb', label: 'Firma electrónica', type: 'action', actionLabel: 'Firmar electrónicamente', inheritanceMode: 'system' },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description: 'Resumen documental y pendientes.',
      icon: FileText,
      sections: [
        {
          key: 'documentos_preproc',
          title: 'Control documental',
          fields: [
            { key: 'resumenDocumentosPreproc', label: 'Resumen', type: 'textarea' },
            {
              key: 'pendientesDocumentalesPreproc',
              label: 'Pendientes documentales',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
  FOLLOW_UP: [],
};

export function getEpisodeTabsForType(encounterType: string) {
  const definitions =
    episodeProfileSchemas[encounterType] ?? episodeProfileSchemas.OUTPATIENT ?? [];
  return ['Resumen', ...definitions.map((definition) => definition.title)];
}

export function getEpisodeTabDefinition(encounterType: string, tabTitle: string) {
  return (
    episodeProfileSchemas[encounterType] ?? episodeProfileSchemas.OUTPATIENT ?? []
  ).find(
    (definition) => definition.title === tabTitle,
  );
}

export function buildInitialStructuredSections(encounterType: string) {
  const sections: Record<string, Record<string, unknown>> = {};

  for (const tab of
    episodeProfileSchemas[encounterType] ?? episodeProfileSchemas.OUTPATIENT ?? []) {
    sections[tab.title] = {};

    for (const section of tab.sections) {
      for (const field of section.fields) {
        if (isPresentationField(field)) {
          continue;
        }

        sections[tab.title][field.key] = buildDefaultFieldValue(field);
      }
    }
  }

  return sections;
}

export function buildDefaultFieldValue(field: EpisodeFieldDefinition): unknown {
  if (field.type === 'checkbox') {
    return false;
  }

  if (field.type === 'string-array' || field.type === 'object-array') {
    return [];
  }

  return '';
}

function cloneFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item && typeof item === 'object' ? { ...(item as Record<string, unknown>) } : item,
    );
  }

  if (value && typeof value === 'object') {
    return { ...(value as Record<string, unknown>) };
  }

  return value;
}

export function isConsultationHistoryTab(
  encounterType: string,
  tabTitle: string,
) {
  return encounterType === 'OUTPATIENT' && tabTitle === 'Historia clínica';
}

export function buildHistoryVersionPrefill(
  tabDefinition: EpisodeTabDefinition,
  previousFormData: Record<string, unknown> | undefined,
) {
  const nextFormData: Record<string, unknown> = {};

  for (const section of tabDefinition.sections) {
    for (const field of section.fields) {
      if (isPresentationField(field)) {
        continue;
      }

      const inheritanceMode = field.inheritanceMode ?? 'fresh_capture';

      if (inheritanceMode === 'carry_forward') {
        nextFormData[field.key] = cloneFieldValue(previousFormData?.[field.key]) ?? buildDefaultFieldValue(field);
        continue;
      }

      nextFormData[field.key] = buildDefaultFieldValue(field);
    }
  }

  return nextFormData;
}

const consultationDocumentSectionDefinitions: Record<string, EpisodeSectionDefinition[]> = {
  'Solicitud de laboratorio': [
    {
      key: 'laboratorio_contexto',
      title: 'Solicitud de laboratorio',
      fields: [
        {
          key: 'documentoMotivoSolicitud',
          label: 'Motivo de solicitud',
          type: 'textarea',
        },
        {
          key: 'documentoEstudiosSolicitados',
          label: 'Estudios solicitados',
          type: 'textarea',
        },
        {
          key: 'documentoDiagnosticoPrincipal',
          label: 'Diagnóstico asociado',
          type: 'text',
        },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        { key: 'documentoObservaciones', label: 'Observaciones', type: 'textarea' },
        {
          key: 'documentoPrioridad',
          label: 'Prioridad',
          type: 'select',
          options: documentPriorityOptions,
        },
      ],
    },
  ],
  'Solicitud de imagenología': [
    {
      key: 'imagenologia_contexto',
      title: 'Solicitud de imagenología',
      fields: [
        {
          key: 'documentoMotivoSolicitud',
          label: 'Motivo de estudio',
          type: 'textarea',
        },
        {
          key: 'documentoEstudiosSolicitados',
          label: 'Estudio solicitado',
          type: 'textarea',
        },
        {
          key: 'documentoRegionAnatomica',
          label: 'Región anatómica',
          type: 'text',
        },
        {
          key: 'documentoDiagnosticoPrincipal',
          label: 'Diagnóstico presuntivo',
          type: 'text',
        },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        {
          key: 'documentoIndicacionesEspeciales',
          label: 'Indicaciones especiales',
          type: 'textarea',
        },
        {
          key: 'documentoPrioridad',
          label: 'Prioridad',
          type: 'select',
          options: documentPriorityOptions,
        },
      ],
    },
  ],
  'Referencia / contrarreferencia': [
    {
      key: 'referencia_contexto',
      title: 'Referencia / contrarreferencia',
      fields: [
        {
          key: 'documentoTipoReferencia',
          label: 'Tipo',
          type: 'select',
          options: referralTypeOptions,
        },
        {
          key: 'documentoUnidadDestino',
          label: 'Unidad destino',
          type: 'text',
        },
        {
          key: 'documentoMotivoEnvio',
          label: 'Motivo de envío',
          type: 'textarea',
        },
        {
          key: 'documentoResumenClinico',
          label: 'Resumen clínico',
          type: 'textarea',
        },
        {
          key: 'documentoDiagnosticos',
          label: 'Diagnósticos',
          type: 'object-array',
          itemAddLabel: 'Agregar diagnóstico',
          itemFields: [
            { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
            { key: 'cie10', label: 'CIE-10', type: 'text' },
          ],
        },
        {
          key: 'documentoTratamientoActual',
          label: 'Tratamiento actual',
          type: 'textarea',
        },
        {
          key: 'documentoEstudiosRealizados',
          label: 'Estudios realizados',
          type: 'textarea',
        },
        {
          key: 'documentoRecomendaciones',
          label: 'Recomendaciones',
          type: 'textarea',
        },
      ],
    },
  ],
  'Consentimiento informado': [
    {
      key: 'consentimiento_contexto',
      title: 'Consentimiento informado',
      fields: [
        {
          key: 'documentoProcedimientoTipo',
          label: 'Tipo de procedimiento',
          type: 'text',
        },
        {
          key: 'documentoProcedimientoDescripcion',
          label: 'Descripción del procedimiento',
          type: 'textarea',
        },
        { key: 'documentoRiesgos', label: 'Riesgos', type: 'textarea' },
        { key: 'documentoBeneficios', label: 'Beneficios', type: 'textarea' },
        { key: 'documentoAlternativas', label: 'Alternativas', type: 'textarea' },
        {
          key: 'documentoPronosticoSinTratamiento',
          label: 'Pronóstico sin tratamiento',
          type: 'textarea',
        },
        {
          key: 'documentoNombreTutor',
          label: 'Nombre paciente / tutor',
          type: 'text',
        },
        { key: 'documentoRelacionTutor', label: 'Relación', type: 'text' },
        {
          key: 'documentoFirmaPaciente',
          label: 'Firma paciente / tutor',
          type: 'text',
        },
      ],
    },
  ],
  'Certificado / constancia': [
    {
      key: 'certificado_contexto',
      title: 'Certificado / constancia',
      fields: [
        {
          key: 'documentoTipoCertificado',
          label: 'Tipo',
          type: 'select',
          options: certificateTypeOptions,
        },
        {
          key: 'documentoUsoDocumento',
          label: 'Uso del documento',
          type: 'text',
        },
        { key: 'documentoMotivo', label: 'Motivo', type: 'textarea' },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico', type: 'text' },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        {
          key: 'documentoReposoInicio',
          label: 'Inicio de reposo',
          type: 'date',
        },
        {
          key: 'documentoReposoFin',
          label: 'Fin de reposo',
          type: 'date',
        },
        {
          key: 'documentoObservaciones',
          label: 'Observaciones',
          type: 'textarea',
        },
      ],
    },
  ],
  'Nota de cierre': [
    {
      key: 'cierre_contexto',
      title: 'Nota de cierre',
      fields: [
        {
          key: 'documentoMotivoCierre',
          label: 'Motivo de cierre',
          type: 'textarea',
        },
        {
          key: 'documentoResumenClinicoFinal',
          label: 'Resumen clínico final',
          type: 'textarea',
        },
        {
          key: 'documentoDiagnosticos',
          label: 'Diagnósticos finales',
          type: 'object-array',
          itemAddLabel: 'Agregar diagnóstico final',
          itemFields: [
            { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
            { key: 'cie10', label: 'CIE-10', type: 'text' },
            { key: 'estado', label: 'Estado', type: 'select', options: diagnosisStatusOptions },
          ],
        },
        {
          key: 'documentoEstadoFinal',
          label: 'Estado final',
          type: 'select',
          options: finalStateOptions,
        },
        {
          key: 'documentoIndicacionesEgreso',
          label: 'Indicaciones al egreso',
          type: 'textarea',
        },
        {
          key: 'documentoPlanSeguimiento',
          label: 'Plan de seguimiento',
          type: 'textarea',
        },
      ],
    },
  ],
};

const emergencyDocumentTypeNames = [
  'Solicitud de laboratorio',
  'Solicitud de imagenología',
  'Referencia / contrarreferencia',
  'Consentimiento informado',
  'Certificado / constancia',
];

const hospitalDocumentTypeNames = [
  'Solicitud de laboratorio',
  'Solicitud de imagenología',
  'Consentimiento informado',
  'Resumen clínico',
  'Referencia / traslado',
  'Defunción',
];

const ambulatoryProcedureDocumentTypeNames = [
  'Solicitud de laboratorio',
  'Solicitud de imagenología',
  'Referencia / contrarreferencia',
  'Consentimiento informado',
  'Certificado / constancia',
];

const hospitalDocumentHeaderSection: EpisodeSectionDefinition = {
  key: 'documento_hospitalario_header',
  title: 'Header institucional',
  description:
    'Datos automáticos del paciente, episodio y documento hospitalario.',
  fields: [
    { key: 'documentoPacienteNombre', label: 'Paciente', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoPacienteCurp', label: 'CURP', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoExpediente', label: 'Expediente', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoFolioEpisodio', label: 'Folio episodio', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoTipoEpisodio', label: 'Tipo de episodio', type: 'readonly', inheritanceMode: 'system' },
  ],
};

const ambulatoryProcedureDocumentHeaderSection: EpisodeSectionDefinition = {
  key: 'documento_ambulatorio_header',
  title: 'Documento complementario ambulatorio',
  description:
    'Documentos independientes: no cierran el episodio y no sustituyen recuperación, egreso ni receta.',
  fields: [
    { key: 'documentoTipoEpisodio', label: 'Tipo de episodio', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoPacienteNombre', label: 'Paciente', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoExpediente', label: 'Expediente', type: 'readonly', inheritanceMode: 'system' },
    { key: 'documentoFolioEpisodio', label: 'Folio episodio', type: 'readonly', inheritanceMode: 'system' },
  ],
};

const ambulatoryProcedureDocumentSectionDefinitions: Record<string, EpisodeSectionDefinition[]> = {
  'Solicitud de laboratorio': [
    {
      key: 'documento_lab_ambulatorio',
      title: 'Solicitud de laboratorio',
      fields: [
        { key: 'documentoFecha', label: 'Fecha de solicitud', type: 'date' },
        { key: 'documentoHora', label: 'Hora de solicitud', type: 'time' },
        { key: 'documentoTipoSolicitud', label: 'Tipo de solicitud', type: 'select', options: [
          { value: 'Preoperatoria', label: 'Preoperatoria' },
          { value: 'Control', label: 'Control' },
        ] },
        { key: 'documentoPrioridad', label: 'Prioridad', type: 'select', options: [
          { value: 'Rutina', label: 'Rutina' },
          { value: 'Urgente', label: 'Urgente' },
        ] },
        {
          key: 'documentoEstudiosLaboratorio',
          label: 'Estudios solicitados',
          type: 'object-array',
          itemAddLabel: 'Agregar estudio',
          itemFields: [
            { key: 'tipoEstudio', label: 'Estudio', type: 'select', options: [
              { value: 'BH', label: 'BH' },
              { value: 'QS', label: 'QS' },
              { value: 'TP/TTP', label: 'TP/TTP' },
              { value: 'PFH', label: 'PFH' },
              { value: 'Otro', label: 'Otro' },
            ] },
            { key: 'indicacionClinica', label: 'Indicación', type: 'text' },
          ],
        },
        { key: 'documentoEstudiosSolicitados', label: 'Campo libre adicional', type: 'textarea' },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico relacionado', type: 'text' },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        { key: 'documentoMotivoSolicitud', label: 'Motivo clínico', type: 'textarea' },
        { key: 'documentoAyuno', label: 'Ayuno', type: 'text' },
        { key: 'documentoPreparacionEspecifica', label: 'Preparación específica', type: 'textarea' },
      ],
    },
  ],
  'Solicitud de imagenología': [
    {
      key: 'documento_imagen_ambulatorio',
      title: 'Solicitud de imagenología',
      fields: [
        { key: 'documentoFecha', label: 'Fecha', type: 'date' },
        { key: 'documentoTipoImagen', label: 'Tipo', type: 'select', options: [
          { value: 'USG', label: 'USG' },
          { value: 'Rx', label: 'Rx' },
          { value: 'TAC', label: 'TAC' },
          { value: 'RM', label: 'RM' },
        ] },
        { key: 'documentoRegionAnatomica', label: 'Región anatómica', type: 'text' },
        { key: 'documentoMotivoSolicitud', label: 'Motivo del estudio', type: 'textarea' },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico probable', type: 'text' },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        { key: 'documentoConContraste', label: 'Contraste', type: 'select', options: [
          { value: 'Sin contraste', label: 'Sin contraste' },
          { value: 'Con contraste', label: 'Con contraste' },
        ] },
        { key: 'documentoPreparacionEspecifica', label: 'Preparación', type: 'textarea' },
        { key: 'documentoAlertaContraste', label: 'Alerta por contraste', type: 'readonly', inheritanceMode: 'system' },
      ],
    },
  ],
  'Referencia / contrarreferencia': [
    {
      key: 'documento_referencia_ambulatorio',
      title: 'Referencia / contrarreferencia',
      fields: [
        { key: 'documentoTipoReferencia', label: 'Tipo', type: 'select', options: referralTypeOptions },
        { key: 'documentoHospitalDestino', label: 'Hospital destino', type: 'text' },
        { key: 'documentoClinicaDestino', label: 'Clínica destino', type: 'text' },
        { key: 'documentoMedicoDestino', label: 'Médico destino', type: 'text' },
        { key: 'documentoMotivoEnvio', label: 'Motivo', type: 'textarea' },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico', type: 'text' },
        { key: 'documentoProcedimientoRealizado', label: 'Procedimiento realizado', type: 'textarea' },
        { key: 'documentoEvolucionBreve', label: 'Evolución breve', type: 'textarea' },
        { key: 'documentoTratamientoActual', label: 'Tratamiento actual', type: 'textarea' },
        { key: 'documentoMedicacion', label: 'Medicación', type: 'textarea' },
        { key: 'documentoPlanRecomendaciones', label: 'Plan y recomendaciones', type: 'textarea' },
      ],
    },
  ],
  'Consentimiento informado': [
    {
      key: 'documento_consentimiento_ambulatorio',
      title: 'Consentimiento informado',
      fields: [
        { key: 'documentoInstitucionNombre', label: 'Nombre institución', type: 'readonly', inheritanceMode: 'system' },
        { key: 'documentoRazonSocial', label: 'Razón social', type: 'readonly', inheritanceMode: 'system' },
        { key: 'documentoProcedimientoNombre', label: 'Nombre del procedimiento', type: 'text' },
        { key: 'documentoTipoAnestesia', label: 'Tipo de anestesia', type: 'text' },
        { key: 'documentoRiesgos', label: 'Riesgos', type: 'textarea' },
        { key: 'documentoBeneficios', label: 'Beneficios', type: 'textarea' },
        { key: 'documentoAlternativas', label: 'Alternativas', type: 'textarea' },
        { key: 'documentoAutorizacionLegal', label: 'Texto legal de autorización', type: 'textarea' },
        { key: 'documentoFirmaPaciente', label: 'Firma paciente', type: 'text' },
        { key: 'documentoFirmaTestigo1', label: 'Firma testigo 1', type: 'text' },
        { key: 'documentoFirmaTestigo2', label: 'Firma testigo 2', type: 'text' },
        { key: 'documentoFirmaMedico', label: 'Firma médico', type: 'readonly', inheritanceMode: 'system' },
      ],
    },
  ],
  'Certificado / constancia': [
    {
      key: 'documento_certificado_ambulatorio',
      title: 'Certificado / constancia',
      fields: [
        { key: 'documentoTipoCertificado', label: 'Tipo', type: 'select', options: [
          { value: 'Incapacidad', label: 'Incapacidad' },
          { value: 'Constancia médica', label: 'Constancia médica' },
        ] },
        { key: 'documentoDiasIncapacidad', label: 'Días de incapacidad', type: 'number' },
        { key: 'documentoTipoIncapacidad', label: 'Tipo de incapacidad', type: 'select', options: [
          { value: 'Laboral', label: 'Laboral' },
          { value: 'General', label: 'General' },
        ] },
        { key: 'documentoTextoConstancia', label: 'Texto de constancia', type: 'textarea' },
        { key: 'documentoReposoInicio', label: 'Inicio', type: 'date' },
        { key: 'documentoReposoFin', label: 'Fin', type: 'date' },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico', type: 'text' },
        { key: 'documentoObservaciones', label: 'Observaciones', type: 'textarea' },
      ],
    },
  ],
};

const hospitalDocumentSectionDefinitions: Record<string, EpisodeSectionDefinition[]> = {
  'Solicitud de laboratorio': [
    {
      key: 'documento_lab_hosp',
      title: 'Solicitud de laboratorio',
      fields: [
        { key: 'documentoServicioSolicitud', label: 'Servicio', type: 'text' },
        {
          key: 'documentoEstudiosLaboratorio',
          label: 'Estudios solicitados',
          type: 'object-array',
          itemAddLabel: 'Agregar estudio',
          itemFields: [
            { key: 'tipoEstudio', label: 'Tipo de estudio', type: 'text' },
            { key: 'prioridad', label: 'Prioridad', type: 'select', options: [
              { value: 'Rutina', label: 'Rutina' },
              { value: 'Urgente', label: 'Urgente' },
            ] },
            { key: 'indicacionClinica', label: 'Indicación clínica', type: 'textarea' },
          ],
        },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico relacionado', type: 'text' },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        { key: 'documentoObservaciones', label: 'Observaciones', type: 'textarea' },
      ],
    },
  ],
  'Solicitud de imagenología': [
    {
      key: 'documento_imagen_hosp',
      title: 'Solicitud de imagenología',
      fields: [
        { key: 'documentoServicioSolicitud', label: 'Servicio', type: 'text' },
        { key: 'documentoEstudioImagen', label: 'Estudio solicitado', type: 'text' },
        { key: 'documentoTipoImagen', label: 'Tipo', type: 'select', options: [
          { value: 'Rx', label: 'Rx' },
          { value: 'TAC', label: 'TAC' },
          { value: 'RM', label: 'RM' },
          { value: 'USG', label: 'USG' },
        ] },
        { key: 'documentoRegionAnatomica', label: 'Región anatómica', type: 'text' },
        { key: 'documentoProyeccion', label: 'Proyección', type: 'text' },
        { key: 'documentoPrioridadImagen', label: 'Prioridad', type: 'select', options: [
          { value: 'Rutina', label: 'Rutina' },
          { value: 'Urgente', label: 'Urgente' },
        ] },
        { key: 'documentoIndicacionClinicaImagen', label: 'Indicación clínica', type: 'textarea' },
        { key: 'documentoDiagnosticoPrincipal', label: 'Diagnóstico', type: 'text' },
        { key: 'documentoDiagnosticoCie10', label: 'CIE-10', type: 'text' },
        { key: 'documentoAlergiaContraste', label: 'Alergia a contraste', type: 'select', options: yesNoUnknownOptions },
        { key: 'documentoEmbarazo', label: 'Embarazo', type: 'select', options: yesNoUnknownOptions },
        { key: 'documentoFuncionRenal', label: 'Función renal', type: 'text' },
      ],
    },
  ],
  'Consentimiento informado': [
    {
      key: 'documento_consentimiento_hosp',
      title: 'Consentimiento informado',
      fields: [
        { key: 'documentoProcedimientoNombre', label: 'Nombre del procedimiento', type: 'text' },
        { key: 'documentoProcedimientoDescripcion', label: 'Descripción', type: 'textarea' },
        { key: 'documentoRiesgosGenerales', label: 'Riesgos generales', type: 'textarea' },
        { key: 'documentoRiesgosEspecificos', label: 'Riesgos específicos', type: 'textarea' },
        { key: 'documentoBeneficios', label: 'Beneficios', type: 'textarea' },
        { key: 'documentoAlternativas', label: 'Alternativas', type: 'textarea' },
        { key: 'documentoRiesgosNoTratamiento', label: 'Riesgos de no tratamiento', type: 'textarea' },
        { key: 'documentoNombrePacienteConsentimiento', label: 'Nombre del paciente', type: 'text' },
        {
          key: 'documentoTestigosConsentimiento',
          label: 'Testigos',
          type: 'object-array',
          itemAddLabel: 'Agregar testigo',
          itemFields: [
            { key: 'nombre', label: 'Nombre', type: 'text' },
          ],
        },
      ],
    },
  ],
  'Resumen clínico': [
    {
      key: 'documento_resumen_hosp',
      title: 'Resumen clínico',
      fields: [
        { key: 'documentoMotivoAtencion', label: 'Motivo de atención', type: 'textarea' },
        { key: 'documentoDiagnosticosIniciales', label: 'Diagnósticos iniciales', type: 'textarea' },
        { key: 'documentoDiagnosticosFinales', label: 'Diagnósticos finales', type: 'textarea' },
        { key: 'documentoEvolucion', label: 'Evolución', type: 'textarea' },
        { key: 'documentoEstudiosRelevantes', label: 'Estudios relevantes', type: 'textarea' },
        { key: 'documentoTratamientos', label: 'Tratamientos', type: 'textarea' },
        { key: 'documentoEstadoActual', label: 'Estado actual', type: 'textarea' },
        { key: 'documentoPlan', label: 'Plan', type: 'textarea' },
      ],
    },
  ],
  'Referencia / traslado': [
    {
      key: 'documento_traslado_hosp',
      title: 'Referencia / traslado',
      fields: [
        { key: 'documentoUnidadOrigen', label: 'Unidad origen', type: 'text' },
        { key: 'documentoUnidadReceptora', label: 'Unidad receptora', type: 'text' },
        { key: 'documentoHospitalDestino', label: 'Hospital destino', type: 'text' },
        { key: 'documentoServicioDestino', label: 'Servicio', type: 'text' },
        { key: 'documentoMotivoTraslado', label: 'Motivo de traslado', type: 'textarea' },
        { key: 'documentoResumenClinicoBreve', label: 'Resumen clínico breve', type: 'textarea' },
        { key: 'documentoSignosVitalesTraslado', label: 'Signos vitales', type: 'textarea' },
        { key: 'documentoEstabilidadPaciente', label: 'Estabilidad', type: 'select', options: [
          { value: 'Estable', label: 'Estable' },
          { value: 'Inestable', label: 'Inestable' },
          { value: 'Crítico', label: 'Crítico' },
        ] },
        { key: 'documentoManejoPrevio', label: 'Manejo previo', type: 'textarea' },
        { key: 'documentoTratamientoTraslado', label: 'Tratamiento durante traslado', type: 'textarea' },
        { key: 'documentoAmbulanciaTraslado', label: 'Ambulancia', type: 'select', options: yesNoUnknownOptions },
        { key: 'documentoTipoAmbulancia', label: 'Tipo de ambulancia', type: 'text' },
      ],
    },
  ],
  Defunción: [
    {
      key: 'documento_defuncion_hosp',
      title: 'Defunción',
      fields: [
        { key: 'documentoDatosPacienteDefuncion', label: 'Datos del paciente', type: 'textarea' },
        { key: 'documentoFechaMuerte', label: 'Fecha de muerte', type: 'date' },
        { key: 'documentoHoraMuerte', label: 'Hora de muerte', type: 'time' },
        { key: 'documentoLugarMuerte', label: 'Lugar', type: 'text' },
        { key: 'documentoCausaInmediata', label: 'Causa inmediata', type: 'textarea' },
        { key: 'documentoCausaIntermedia', label: 'Causa intermedia', type: 'textarea' },
        { key: 'documentoCausaBasica', label: 'Causa básica', type: 'textarea' },
        { key: 'documentoOtrosEstadosDefuncion', label: 'Otros estados', type: 'textarea' },
        { key: 'documentoComorbilidadesDefuncion', label: 'Comorbilidades', type: 'textarea' },
        { key: 'documentoTipoMuerte', label: 'Tipo de muerte', type: 'select', options: [
          { value: 'NATURAL', label: 'Natural' },
          { value: 'ACCIDENTAL', label: 'Accidental' },
          { value: 'VIOLENTA', label: 'Violenta' },
        ] },
        { key: 'documentoAvisoInstitucionalDefuncion', label: 'Aviso institucional', type: 'text' },
      ],
    },
  ],
};

const consultationDocumentSharedSections: EpisodeSectionDefinition[] = [
  {
    key: 'documento_legales',
    title: 'Datos legales y firma',
    description:
      'Los datos legales se completan desde el profesional responsable del episodio.',
    fields: [
      {
        key: 'tipoRegistro',
        label: 'Tipo de registro',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoFecha',
        label: 'Fecha',
        type: 'date',
      },
      {
        key: 'documentoHora',
        label: 'Hora',
        type: 'time',
      },
      {
        key: 'documentoFolio',
        label: 'Folio del documento',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoVersion',
        label: 'Versión',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoEstado',
        label: 'Estado',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoInstitucionEmisora',
        label: 'Institución emisora',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoRfcMedico',
        label: 'RFC médico',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoLicenciaSanitaria',
        label: 'Licencia sanitaria',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoCodigoVerificacion',
        label: 'Código de verificación',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoNombreProfesional',
        label: 'Profesional responsable',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoCedulaProfesional',
        label: 'Cédula profesional',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoEspecialidadProfesional',
        label: 'Especialidad',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoLugarAtencion',
        label: 'Lugar de atención',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'firmarDocumentoClinico',
        label: 'Firma electrónica',
        type: 'action',
        actionLabel: 'Firmar documento',
        inheritanceMode: 'system',
      },
    ],
  },
];

export function getConsultationDocumentTypes() {
  return Object.keys(consultationDocumentSectionDefinitions);
}

export function getEpisodeDocumentTypes(encounterType: string) {
  if (encounterType === 'EMERGENCY') {
    return emergencyDocumentTypeNames;
  }

  if (encounterType === 'HOSPITALIZATION') {
    return hospitalDocumentTypeNames;
  }

  if (encounterType === 'SURGERY') {
    return ambulatoryProcedureDocumentTypeNames;
  }

  return getConsultationDocumentTypes();
}

export function getConsultationDocumentTabDefinition(
  noteType: string,
): EpisodeTabDefinition {
  return {
    key: 'Documentos',
    title: 'Documentos',
    icon: FileText,
    description: 'Documentos clínicos del episodio con captura independiente.',
    sections: [
      ...(consultationDocumentSectionDefinitions[noteType] ??
        consultationDocumentSectionDefinitions['Solicitud de laboratorio']),
      ...consultationDocumentSharedSections,
    ],
  };
}

export function getHospitalDocumentTabDefinition(
  noteType: string,
): EpisodeTabDefinition {
  return {
    key: 'Documentos',
    title: 'Documentos',
    icon: FileText,
    description:
      'Documentos hospitalarios complementarios con firma, PDF, hash y trazabilidad.',
    sections: [
      hospitalDocumentHeaderSection,
      ...(hospitalDocumentSectionDefinitions[noteType] ??
        hospitalDocumentSectionDefinitions['Solicitud de laboratorio']),
      ...consultationDocumentSharedSections,
    ],
  };
}

export function getAmbulatoryProcedureDocumentTabDefinition(
  noteType: string,
): EpisodeTabDefinition {
  return {
    key: 'Documentos',
    title: 'Documentos',
    description:
      'Documentos complementarios independientes del procedimiento ambulatorio.',
    icon: FileText,
    sections: [
      ambulatoryProcedureDocumentHeaderSection,
      ...(ambulatoryProcedureDocumentSectionDefinitions[noteType] ??
        ambulatoryProcedureDocumentSectionDefinitions['Solicitud de laboratorio']),
      ...consultationDocumentSharedSections,
    ],
  };
}
