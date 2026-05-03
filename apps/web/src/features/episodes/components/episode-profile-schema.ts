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
    | 'action';
  placeholder?: string;
  options?: EpisodeFieldOption[];
  inheritanceMode?: 'carry_forward' | 'fresh_capture' | 'system';
  itemFields?: EpisodeFieldDefinition[];
  itemAddLabel?: string;
  disableItemRemoval?: boolean;
  actionLabel?: string;
};

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
  description: string;
  sections: EpisodeSectionDefinition[];
};

const yesNoUnknownOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'SI', label: 'Si' },
  { value: 'NO', label: 'No' },
  { value: 'PARCIAL', label: 'Parcial' },
];

const priorityOptions: EpisodeFieldOption[] = [
  { value: '', label: 'Sin especificar' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
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
  { value: 'CHOQUE', label: 'Área de choque' },
  { value: 'CONSULTORIO_URGENCIAS', label: 'Consultorio de urgencias' },
  { value: 'OBSERVACION', label: 'Observación' },
  { value: 'CAMA_URGENCIAS', label: 'Cama de urgencias' },
  { value: 'REFERENCIA', label: 'Referencia / traslado' },
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
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'RESULTADO', label: 'Resultado' },
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
  { value: 'CE', label: 'Concentrado eritrocitario' },
  { value: 'PFC', label: 'Plasma fresco congelado' },
  { value: 'PLAQUETAS', label: 'Plaquetas' },
  { value: 'CRIOPRECIPITADO', label: 'Crioprecipitado' },
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

export const episodeProfileSchemas: Record<string, EpisodeTabDefinition[]> = {
  OUTPATIENT: [
    {
      key: 'Historia clínica',
      title: 'Historia clínica',
      description: 'Campos estructurados inspirados en la historia clínica de Nexus.',
      sections: [
        {
          key: 'tipo_historia',
          title: 'Tipo de historia clínica',
          fields: [
            {
              key: 'tipoHistoriaClinica',
              label: 'Tipo de historia',
              type: 'select',
              inheritanceMode: 'system',
              options: [
                { value: '', label: 'Selecciona una opcion' },
                { value: 'INICIAL', label: 'Inicial' },
                { value: 'SUBSECUENTE', label: 'Subsecuente' },
                { value: 'INTERCONSULTA', label: 'Interconsulta' },
              ],
            },
            {
              key: 'fechaHistoria',
              label: 'Fecha clínica',
              type: 'datetime-local',
              inheritanceMode: 'fresh_capture',
            },
          ],
        },
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
            { key: 'consentimientoComprension', label: 'Comprensión', type: 'select', options: [{ value: '', label: 'Sin especificar' }, { value: 'COMPLETA', label: 'Completa' }, { value: 'PARCIAL', label: 'Parcial' }, { value: 'INSUFICIENTE', label: 'Insuficiente' }], inheritanceMode: 'fresh_capture' },
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
      key: 'Receta / Indicaciones',
      title: 'Receta e indicaciones',
      description: 'Prescripción, seguridad y seguimiento.',
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
              options: comprehensionOptions,
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
      sections: [
        {
          key: 'triage_tipo',
          title: 'Tipo de registro',
          fields: [
            { key: 'tipoTriage', label: 'Tipo de triage', type: 'readonly' },
            { key: 'tipoRegistro', label: 'Tipo de registro', type: 'readonly' },
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
            { key: 'discDolorToracico', label: 'Dolor torácico', type: 'checkbox' },
            { key: 'discDisneaSevera', label: 'Disnea severa', type: 'checkbox' },
            { key: 'discSangradoActivo', label: 'Sangrado activo', type: 'checkbox' },
            { key: 'discAlteracionConciencia', label: 'Alteración de conciencia', type: 'checkbox' },
            { key: 'discSepsis', label: 'Sospecha de sepsis', type: 'checkbox' },
            { key: 'discTraumaMayor', label: 'Trauma mayor', type: 'checkbox' },
            { key: 'banderaRojaAutomatica', label: 'Bandera roja automática', type: 'readonly' },
          ],
        },
        {
          key: 'triage_signos_vitales',
          title: 'Signos vitales',
          fields: [
            { key: 'taSistolica', label: 'TA sistólica', type: 'number' },
            { key: 'taDiastolica', label: 'TA diastólica', type: 'number' },
            { key: 'fc', label: 'FC', type: 'number' },
            { key: 'fr', label: 'FR', type: 'number' },
            { key: 'temp', label: 'Temp', type: 'number' },
            { key: 'spo2', label: 'SpO2', type: 'number' },
            { key: 'peso', label: 'Peso', type: 'number' },
            { key: 'glucosa', label: 'Glucosa', type: 'number' },
            { key: 'eva', label: 'EVA', type: 'number' },
            { key: 'llenadoCapilar', label: 'Llenado capilar', type: 'text' },
          ],
        },
        {
          key: 'triage_estado_rapido',
          title: 'Estado clínico rápido',
          fields: [
            { key: 'viaAerea', label: 'Vía aérea', type: 'select', options: normalAlteredOptions },
            { key: 'estadoHemodinamico', label: 'Estado hemodinámico', type: 'select', options: clinicalStateOptions },
            { key: 'estadoNeurologico', label: 'Estado neurológico', type: 'select', options: normalAlteredOptions },
          ],
        },
        {
          key: 'triage_glasgow',
          title: 'Glasgow',
          fields: [
            { key: 'glasgowE', label: 'E', type: 'select', options: glasgowEyeOptions },
            { key: 'glasgowV', label: 'V', type: 'select', options: glasgowVerbalOptions },
            { key: 'glasgowM', label: 'M', type: 'select', options: glasgowMotorOptions },
            { key: 'glasgowTotal', label: 'Total', type: 'readonly' },
          ],
        },
        {
          key: 'triage_news_alertas',
          title: 'NEWS2 y alertas automáticas',
          fields: [
            { key: 'news2Total', label: 'NEWS2', type: 'readonly' },
            { key: 'alertasAutomaticas', label: 'Alertas automáticas', type: 'readonly' },
          ],
        },
        {
          key: 'triage_destino',
          title: 'Destino y reevaluación',
          fields: [
            { key: 'destinoInicial', label: 'Destino inicial', type: 'select', options: triageDestinationOptions },
            { key: 'reevaluacion', label: 'Reevaluación', type: 'textarea' },
          ],
        },
        {
          key: 'triage_responsable_procedencia',
          title: 'Responsable y procedencia',
          fields: [
            { key: 'responsableTriage', label: 'Responsable', type: 'readonly' },
            { key: 'procedenciaAdministrativa', label: 'Procedencia', type: 'textarea' },
          ],
        },
        {
          key: 'triage_estado_inicial',
          title: 'Estado inicial',
          fields: [
            { key: 'estadoGeneral', label: 'Estado general', type: 'textarea' },
            { key: 'estadoMental', label: 'Estado mental', type: 'select', options: normalAlteredOptions },
            { key: 'riesgoVital', label: 'Riesgo vital', type: 'select', options: riskClassificationOptions },
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
          title: 'O - Objetivo',
          fields: [
            {
              key: 'exploracionFisicaNota',
              label: 'Exploración física',
              type: 'textarea',
            },
            { key: 'taSistolicaNota', label: 'TA sistólica', type: 'number' },
            { key: 'taDiastolicaNota', label: 'TA diastólica', type: 'number' },
            { key: 'fcNota', label: 'FC', type: 'number' },
            { key: 'frNota', label: 'FR', type: 'number' },
            { key: 'tempNota', label: 'Temp', type: 'number' },
            { key: 'spo2Nota', label: 'SpO2', type: 'number' },
            { key: 'evaNota', label: 'EVA', type: 'number' },
            { key: 'glucosaNota', label: 'Glucosa', type: 'number' },
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
          title: 'Consentimiento',
          fields: [
            { key: 'consentimientoInicial', label: 'Consentimiento informado', type: 'textarea' },
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
            { key: 'pronosticoNota', label: 'Pronóstico', type: 'textarea' },
            { key: 'estadoMentalNota', label: 'Estado mental', type: 'select', options: normalAlteredOptions },
            { key: 'resumenPronostico', label: 'Resumen', type: 'textarea' },
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
      key: 'Evolución',
      title: 'Evolución en urgencias',
      description: 'Seguimiento clínico, órdenes, estudios y eventos.',
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
            { key: 'taSistolicaEvolUrg', label: 'TA sistólica', type: 'number' },
            { key: 'taDiastolicaEvolUrg', label: 'TA diastólica', type: 'number' },
            { key: 'fcEvolUrg', label: 'FC', type: 'number' },
            { key: 'frEvolUrg', label: 'FR', type: 'number' },
            { key: 'tempEvolUrg', label: 'Temp', type: 'number' },
            { key: 'spo2EvolUrg', label: 'SpO2', type: 'number' },
            { key: 'evaEvolUrg', label: 'EVA', type: 'number' },
            { key: 'glucosaEvolUrg', label: 'Glucosa', type: 'number' },
            { key: 'glasgowEvolUrg', label: 'Glasgow', type: 'number' },
            { key: 'exploracionDirigidaUrg', label: 'Exploración dirigida', type: 'textarea' },
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
              disableItemRemoval: true,
              itemFields: [
                { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
                { key: 'cie10', label: 'CIE-10', type: 'text' },
                { key: 'estado', label: 'Estado', type: 'select', options: diagnosisStatusOptions },
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
          fields: [
            { key: 'enfermeriaHabitusUrg', label: 'Hábitus', type: 'readonly' },
            { key: 'enfermeriaDolorUrg', label: 'Dolor', type: 'readonly' },
            { key: 'enfermeriaRiesgoCaidasUrg', label: 'Riesgo de caídas', type: 'readonly' },
            { key: 'enfermeriaMedicacionUrg', label: 'Medicación administrada', type: 'readonly' },
            { key: 'enfermeriaProcedimientosUrg', label: 'Procedimientos', type: 'readonly' },
            { key: 'enfermeriaObservacionesUrg', label: 'Observaciones', type: 'readonly' },
            { key: 'enfermeriaResponsableUrg', label: 'Responsable + cédula', type: 'readonly' },
          ],
        },
        {
          key: 'evolucion_urg_auxiliares',
          title: 'Servicios auxiliares',
          fields: [
            { key: 'auxEcgUrg', label: 'ECG', type: 'readonly' },
            { key: 'auxLaboratoriosUrg', label: 'Laboratorios', type: 'readonly' },
            { key: 'auxInterpretacionUrg', label: 'Interpretación', type: 'readonly' },
            { key: 'auxIncidentesUrg', label: 'Incidentes', type: 'readonly' },
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
            { key: 'monitoreoOrdenes', label: 'Monitoreo', type: 'textarea' },
            { key: 'oxigenoTipoOrdenes', label: 'Oxígeno - tipo', type: 'select', options: oxygenTypeOptions },
            { key: 'oxigenoFlujoOrdenes', label: 'Oxígeno - flujo', type: 'text' },
            { key: 'oxigenoMetaOrdenes', label: 'Oxígeno - meta', type: 'text' },
            { key: 'dietaOrdenes', label: 'Dieta', type: 'select', options: dietOptions },
            { key: 'reposoOrdenes', label: 'Reposo', type: 'select', options: restOptions },
            { key: 'controlLiquidosOrdenes', label: 'Control de líquidos', type: 'select', options: fluidControlOptions },
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
            { key: 'transfusionVolumen', label: 'Volumen', type: 'number' },
            { key: 'transfusionHoraInicio', label: 'Hora inicio', type: 'datetime-local' },
            { key: 'transfusionHoraFin', label: 'Hora fin', type: 'datetime-local' },
            { key: 'transfusionReacciones', label: 'Reacciones adversas', type: 'textarea' },
            { key: 'transfusionResponsable', label: 'Responsable', type: 'text' },
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
          title: 'Referencia / Traslado',
          fields: [
            { key: 'unidadOrigenTrasladoUrg', label: 'Unidad origen', type: 'text' },
            { key: 'unidadDestinoTrasladoUrg', label: 'Unidad destino', type: 'text' },
            { key: 'signosVitalesTrasladoUrg', label: 'Signos vitales', type: 'textarea' },
            { key: 'resumenTrasladoUrg', label: 'Resumen clínico', type: 'textarea' },
            { key: 'diagnosticoTrasladoUrg', label: 'Diagnóstico', type: 'text' },
            { key: 'tratamientoPrevioTrasladoUrg', label: 'Tratamiento previo', type: 'textarea' },
            { key: 'condicionesTrasladoUrg', label: 'Condiciones de traslado', type: 'textarea' },
            { key: 'medicoReceptorTrasladoUrg', label: 'Médico receptor', type: 'text' },
          ],
        },
        {
          key: 'egreso_urg_consentimiento',
          title: 'Consentimiento informado',
          fields: [
            { key: 'procedimientoConsentimientoUrg', label: 'Procedimiento', type: 'text' },
            { key: 'riesgosConsentimientoUrg', label: 'Riesgos', type: 'textarea' },
            { key: 'beneficiosConsentimientoUrg', label: 'Beneficios', type: 'textarea' },
            { key: 'autorizacionConsentimientoUrg', label: 'Autorización', type: 'textarea' },
            { key: 'firmasConsentimientoUrg', label: 'Firmas', type: 'textarea' },
          ],
        },
        {
          key: 'egreso_urg_legales_condicionales',
          title: 'Aviso MP / Defunción',
          fields: [
            { key: 'avisoMinisterioPublico', label: 'Aviso al Ministerio Público', type: 'textarea' },
            { key: 'certificadoDefuncion', label: 'Certificado de defunción', type: 'textarea' },
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
            { key: 'turnoIngresoHosp', label: 'Turno de ingreso', type: 'select', options: [
              { value: '', label: 'Sin especificar' },
              { value: 'MATUTINO', label: 'Matutino' },
              { value: 'VESPERTINO', label: 'Vespertino' },
              { value: 'NOCTURNO', label: 'Nocturno' },
            ] },
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
            { key: 'taSistolicaHosp', label: 'TA sistólica', type: 'number' },
            { key: 'taDiastolicaHosp', label: 'TA diastólica', type: 'number' },
            { key: 'fcHosp', label: 'FC', type: 'number' },
            { key: 'frHosp', label: 'FR', type: 'number' },
            { key: 'temperaturaHosp', label: 'Temperatura', type: 'number' },
            { key: 'spo2Hosp', label: 'SpO₂', type: 'number' },
            { key: 'dolorEvaHosp', label: 'Dolor EVA', type: 'number' },
            { key: 'pesoHosp', label: 'Peso', type: 'number' },
            { key: 'tallaHosp', label: 'Talla', type: 'number' },
            { key: 'glucosaHosp', label: 'Glucosa', type: 'number' },
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
      sections: [
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
      sections: [
        {
          key: 'indicaciones_hosp',
          title: 'Órdenes e indicaciones',
          fields: [
            { key: 'medicamentosHosp', label: 'Medicamentos', type: 'textarea' },
            { key: 'solucionesIvHosp', label: 'Soluciones IV', type: 'textarea' },
            {
              key: 'dietaReposoCuidadosGenerales',
              label: 'Dieta, reposo y cuidados generales',
              type: 'textarea',
            },
            {
              key: 'estudiosSolicitadosHosp',
              label: 'Estudios solicitados',
              type: 'textarea',
            },
            {
              key: 'interconsultasSolicitadasHosp',
              label: 'Interconsultas solicitadas',
              type: 'textarea',
            },
            {
              key: 'cuidadosEnfermeriaHosp',
              label: 'Cuidados de enfermería',
              type: 'textarea',
            },
            {
              key: 'trazabilidadOrdenesHosp',
              label: 'Trazabilidad de órdenes',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Interconsultas',
      title: 'Interconsultas',
      description: 'Solicitud, respuesta y trazabilidad.',
      sections: [
        {
          key: 'interconsultas_hosp',
          title: 'Interconsultas hospitalarias',
          fields: [
            {
              key: 'datosSolicitudInterconsultaHosp',
              label: 'Datos de solicitud',
              type: 'textarea',
            },
            {
              key: 'solicitudInterconsultaHosp',
              label: 'Solicitud de interconsulta',
              type: 'textarea',
            },
            {
              key: 'relacionClinicaInterconsultaHosp',
              label: 'Relación clínica',
              type: 'textarea',
            },
            {
              key: 'respuestaInterconsultaHosp',
              label: 'Respuesta de interconsulta',
              type: 'textarea',
            },
            {
              key: 'tiemposAuditoriaInterconsultaHosp',
              label: 'Tiempos de auditoría',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Procedimientos / Cirugía',
      title: 'Procedimientos y cirugía',
      description: 'Preoperatorio, postoperatorio y recuperación.',
      sections: [
        {
          key: 'preoperatorio_hosp',
          title: 'Preoperatorio',
          fields: [
            {
              key: 'datosPreoperatorios',
              label: 'Datos preoperatorios',
              type: 'textarea',
            },
            { key: 'equipoQuirurgicoHosp', label: 'Equipo quirúrgico', type: 'textarea' },
            { key: 'riesgoAnestesiaHosp', label: 'Riesgo y anestesia', type: 'textarea' },
            {
              key: 'consentimientoPreoperatorioHosp',
              label: 'Consentimiento informado',
              type: 'textarea',
            },
            {
              key: 'estudiosPreoperatoriosHosp',
              label: 'Estudios preoperatorios',
              type: 'textarea',
            },
            {
              key: 'evaluacionPreanestesicaHosp',
              label: 'Evaluación preanestésica',
              type: 'textarea',
            },
            {
              key: 'antecedentesAnestesiaHosp',
              label: 'Antecedentes relevantes para anestesia',
              type: 'textarea',
            },
            {
              key: 'riesgoAnestesicoPlanHosp',
              label: 'Riesgo anestésico y plan',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'postoperatorio_hosp',
          title: 'Postoperatorio',
          fields: [
            {
              key: 'trazabilidadActoQuirurgico',
              label: 'Trazabilidad del acto quirúrgico',
              type: 'textarea',
            },
            { key: 'diagnosticosPostop', label: 'Diagnósticos', type: 'textarea' },
            {
              key: 'procedimientoRealizadoPostop',
              label: 'Procedimiento realizado',
              type: 'textarea',
            },
            {
              key: 'datosTransoperatoriosHosp',
              label: 'Datos transoperatorios',
              type: 'textarea',
            },
            {
              key: 'materialDispositivosHosp',
              label: 'Material y dispositivos',
              type: 'textarea',
            },
            { key: 'complicacionesHosp', label: 'Complicaciones', type: 'textarea' },
            {
              key: 'estadoPostquirurgicoHosp',
              label: 'Estado postquirúrgico',
              type: 'textarea',
            },
            {
              key: 'indicacionesPostoperatoriasHosp',
              label: 'Indicaciones postoperatorias',
              type: 'textarea',
            },
            {
              key: 'recuperacionAnestesicaHosp',
              label: 'Recuperación anestésica',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Enfermería',
      title: 'Enfermería',
      description: 'Registros seriados, balance y cuidados.',
      sections: [
        {
          key: 'enfermeria_hosp',
          title: 'Hoja de enfermería',
          fields: [
            { key: 'responsableEnfermeria', label: 'Responsable', type: 'textarea' },
            { key: 'habitusExteriorHosp', label: 'Hábitus exterior', type: 'textarea' },
            {
              key: 'signosVitalesSeriadosHosp',
              label: 'Signos vitales - registro seriado',
              type: 'textarea',
            },
            {
              key: 'ministracionMedicamentosHosp',
              label: 'Ministración de medicamentos',
              type: 'textarea',
            },
            {
              key: 'procedimientosEnfermeriaHosp',
              label: 'Procedimientos de enfermería',
              type: 'textarea',
            },
            { key: 'balanceHidricoHosp', label: 'Balance hídrico', type: 'textarea' },
            {
              key: 'cuidadosEnfermeriaDetalleHosp',
              label: 'Cuidados de enfermería',
              type: 'textarea',
            },
            {
              key: 'escalasEnfermeriaHosp',
              label: 'Escalas de enfermería',
              type: 'textarea',
            },
            {
              key: 'eventosAdversosEnfermeriaHosp',
              label: 'Eventos adversos',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Egreso',
      title: 'Egreso hospitalario',
      description: 'Cierre de estancia y plan posterior.',
      sections: [
        {
          key: 'egreso_hosp',
          title: 'Egreso',
          fields: [
            {
              key: 'tipoDestinoEgresoHosp',
              label: 'Tipo y destino de egreso',
              type: 'textarea',
            },
            {
              key: 'resumenClinicoEstanciaHosp',
              label: 'Resumen clínico de estancia',
              type: 'textarea',
            },
            {
              key: 'planEgresoHosp',
              label: 'Plan de egreso estructurado',
              type: 'textarea',
            },
            {
              key: 'signosAlarmaEducacionHosp',
              label: 'Signos de alarma y educación',
              type: 'textarea',
            },
            {
              key: 'recetaIncapacidadHosp',
              label: 'Receta e incapacidad',
              type: 'textarea',
            },
            {
              key: 'pronosticoResponsableHosp',
              label: 'Pronóstico y responsable',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description: 'Resumen y observaciones documentales.',
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
      sections: [
        {
          key: 'valoracion_preproc',
          title: 'Valoración preprocedimiento',
          fields: [
            {
              key: 'motivoAntecedentesPreproc',
              label: 'Subjetivo / motivo y antecedentes',
              type: 'textarea',
            },
            {
              key: 'exploracionEstudiosPreproc',
              label: 'Objetivo / exploración física y estudios',
              type: 'textarea',
            },
            {
              key: 'evaluacionRiesgoPreproc',
              label: 'Análisis / evaluación de riesgo',
              type: 'textarea',
            },
            {
              key: 'notaPreanestesicaPreproc',
              label: 'Nota preanestésica',
              type: 'textarea',
            },
            {
              key: 'preparacionConsentimientoPreproc',
              label: 'Plan / preparación y consentimiento',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Procedimiento',
      title: 'Procedimiento',
      description: 'Acto quirúrgico o procedimiento ambulatorio.',
      sections: [
        {
          key: 'procedimiento_central',
          title: 'Procedimiento',
          fields: [
            { key: 'equipoQuirurgicoPreproc', label: 'Equipo quirúrgico', type: 'textarea' },
            {
              key: 'checklistSeguridadTimeOut',
              label: 'Checklist de seguridad quirúrgica',
              type: 'textarea',
            },
            {
              key: 'descripcionProcedimiento',
              label: 'Descripción del procedimiento',
              type: 'textarea',
            },
            {
              key: 'datosTransoperatoriosPreproc',
              label: 'Datos transoperatorios',
              type: 'textarea',
            },
            { key: 'complicacionesPreproc', label: 'Complicaciones', type: 'textarea' },
            {
              key: 'destinoIndicacionesInmediatasPreproc',
              label: 'Destino e indicaciones inmediatas',
              type: 'textarea',
            },
            {
              key: 'notaPostanestesicaPreproc',
              label: 'Nota postanestésica',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Recuperación / Evolución',
      title: 'Recuperación y evolución',
      description: 'Recuperación, criterios de alta intermedia y vigilancia.',
      sections: [
        {
          key: 'recuperacion_preproc',
          title: 'Recuperación',
          fields: [
            {
              key: 'sintomatologiaPostprocedimiento',
              label: 'Sintomatología postprocedimiento',
              type: 'textarea',
            },
            {
              key: 'signosExploracionPostproc',
              label: 'Signos vitales y exploración',
              type: 'textarea',
            },
            {
              key: 'aldreteCriteriosAlta',
              label: 'Escala de Aldrete y criterios de alta',
              type: 'textarea',
            },
            {
              key: 'vigilanciaDestinoPostproc',
              label: 'Vigilancia y destino',
              type: 'textarea',
            },
            {
              key: 'registroEnfermeriaPostproc',
              label: 'Registro de enfermería',
              type: 'textarea',
            },
            {
              key: 'serviciosAuxiliaresPostproc',
              label: 'Servicios auxiliares de diagnóstico y tratamiento',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Indicaciones / Receta',
      title: 'Indicaciones y receta',
      description: 'Receta electrónica, medicamentos y educación.',
      sections: [
        {
          key: 'indicaciones_preproc',
          title: 'Indicaciones',
          fields: [
            {
              key: 'datosRecetaElectronicaPreproc',
              label: 'Datos de la receta electrónica',
              type: 'textarea',
            },
            { key: 'medicamentosPreproc', label: 'Medicamentos', type: 'textarea' },
            {
              key: 'indicacionesGeneralesPreproc',
              label: 'Plan de egreso / indicaciones generales',
              type: 'textarea',
            },
            {
              key: 'seguimientoEducacionPreproc',
              label: 'Seguimiento y educación al paciente',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Egreso',
      title: 'Egreso',
      description: 'Alta ambulatoria, criterios y responsable.',
      sections: [
        {
          key: 'egreso_preproc',
          title: 'Egreso del procedimiento',
          fields: [
            { key: 'datosEgresoPreproc', label: 'Datos de egreso', type: 'textarea' },
            {
              key: 'signosVitalesEgresoPreproc',
              label: 'Signos vitales al egreso',
              type: 'textarea',
            },
            {
              key: 'criteriosAltaPreproc',
              label: 'Criterios de alta',
              type: 'textarea',
            },
            {
              key: 'resumenClinicoPreproc',
              label: 'Resumen clínico',
              type: 'textarea',
            },
            {
              key: 'planEgresoIncapacidadEducacionPreproc',
              label: 'Plan de egreso, incapacidad y educación',
              type: 'textarea',
            },
            {
              key: 'referenciaTrasladoPreproc',
              label: 'Referencia / traslado',
              type: 'textarea',
            },
            {
              key: 'responsableEgresoPreproc',
              label: 'Responsable de egreso',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description: 'Resumen documental y pendientes.',
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
  nextHistoryType: 'INICIAL' | 'SUBSECUENTE',
  nextRecordedAt: string,
) {
  const nextFormData: Record<string, unknown> = {};

  for (const section of tabDefinition.sections) {
    for (const field of section.fields) {
      const inheritanceMode = field.inheritanceMode ?? 'fresh_capture';

      if (field.key === 'tipoHistoriaClinica') {
        nextFormData[field.key] = nextHistoryType;
        continue;
      }

      if (field.key === 'fechaHistoria') {
        nextFormData[field.key] = nextRecordedAt;
        continue;
      }

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
        label: 'Nombre del profesional',
        type: 'readonly',
        inheritanceMode: 'system',
      },
      {
        key: 'documentoCedulaProfesional',
        label: 'Cédula',
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
        label: 'Firma',
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

  return getConsultationDocumentTypes();
}

export function getConsultationDocumentTabDefinition(
  noteType: string,
): EpisodeTabDefinition {
  return {
    key: 'Documentos',
    title: 'Documentos',
    description: 'Documentos clínicos del episodio con captura independiente.',
    sections: [
      ...(consultationDocumentSectionDefinitions[noteType] ??
        consultationDocumentSectionDefinitions['Solicitud de laboratorio']),
      ...consultationDocumentSharedSections,
    ],
  };
}
