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
          key: 'soap_inicial',
          title: 'Nota inicial de urgencias',
          fields: [
            { key: 'subjetivoInicial', label: 'S - Subjetivo', type: 'textarea' },
            {
              key: 'objetivoInicial',
              label: 'O - Objetivo / exploración física',
              type: 'textarea',
            },
            {
              key: 'analisisInicial',
              label: 'A - Análisis / escalas / diagnóstico',
              type: 'textarea',
            },
            { key: 'planInicial', label: 'P - Plan', type: 'textarea' },
          ],
        },
        {
          key: 'complementos_iniciales',
          title: 'Complementos',
          fields: [
            {
              key: 'consentimientoInicial',
              label: 'Consentimiento informado',
              type: 'textarea',
            },
            {
              key: 'tiemposAtencion',
              label: 'Tiempos de atención',
              type: 'textarea',
            },
            {
              key: 'pronosticoEstado',
              label: 'Pronóstico y estado',
              type: 'textarea',
            },
            {
              key: 'procedimientosUrgencias',
              label: 'Procedimientos realizados en urgencias',
              type: 'textarea',
            },
            {
              key: 'destinoResolucionInicial',
              label: 'Destino y resolución',
              type: 'textarea',
            },
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
          key: 'evolucion_urgencias',
          title: 'Evolución clínica',
          fields: [
            { key: 'datosNota', label: 'Datos de la nota', type: 'textarea' },
            { key: 'subjetivoEvolucion', label: 'S - Subjetivo', type: 'textarea' },
            {
              key: 'objetivoEvolucion',
              label: 'O - Objetivo / signos y exploración',
              type: 'textarea',
            },
            {
              key: 'resultadosEstudios',
              label: 'Resultados de estudios',
              type: 'textarea',
            },
            {
              key: 'analisisEvolucion',
              label: 'A - Análisis / diagnósticos',
              type: 'textarea',
            },
            {
              key: 'eventosAdversosComplicaciones',
              label: 'Eventos adversos y complicaciones',
              type: 'textarea',
            },
            { key: 'planEvolucionUrg', label: 'P - Plan', type: 'textarea' },
            {
              key: 'justificacionClinicaNom004',
              label: 'Justificación clínica (NOM-004)',
              type: 'textarea',
            },
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
          key: 'ordenes_urgencias',
          title: 'Órdenes médicas',
          fields: [
            { key: 'hojaEnfermeria', label: 'Hoja de enfermería', type: 'textarea' },
            {
              key: 'serviciosAuxiliaresDiagnostico',
              label: 'Servicios auxiliares de diagnóstico',
              type: 'textarea',
            },
            { key: 'medicamentosUrg', label: 'Medicamentos', type: 'textarea' },
            {
              key: 'solucionesIntravenosas',
              label: 'Soluciones intravenosas',
              type: 'textarea',
            },
            {
              key: 'estudiosSolicitadosUrg',
              label: 'Estudios solicitados',
              type: 'textarea',
            },
            {
              key: 'cuidadosEspeciales',
              label: 'Cuidados especiales',
              type: 'textarea',
            },
            {
              key: 'estadoOrdenesTrazabilidad',
              label: 'Estado de órdenes y trazabilidad',
              type: 'textarea',
            },
            {
              key: 'registroTransfusion',
              label: 'Registro de transfusión',
              type: 'textarea',
            },
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
          key: 'interconsulta_urg',
          title: 'Interconsulta',
          fields: [
            {
              key: 'solicitudInterconsulta',
              label: 'Solicitud de interconsulta',
              type: 'textarea',
            },
            {
              key: 'prioridadTiemposInterconsulta',
              label: 'Prioridad y tiempos',
              type: 'textarea',
            },
            {
              key: 'motivoResumenClinicoInterconsulta',
              label: 'Motivo y resumen clínico',
              type: 'textarea',
            },
            {
              key: 'respuestaInterconsultante',
              label: 'Respuesta del interconsultante',
              type: 'textarea',
            },
            {
              key: 'decisionCierreInterconsulta',
              label: 'Decisión y cierre',
              type: 'textarea',
            },
            {
              key: 'auditoriaTiemposInterconsulta',
              label: 'Auditoría de tiempos',
              type: 'textarea',
            },
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
          key: 'egreso_urgencias',
          title: 'Egreso',
          fields: [
            {
              key: 'tipoDestinoEgreso',
              label: 'Tipo y destino de egreso',
              type: 'textarea',
            },
            {
              key: 'resumenClinicoEgreso',
              label: 'Resumen clínico estructurado',
              type: 'textarea',
            },
            {
              key: 'indicacionesEgresoUrg',
              label: 'Indicaciones de egreso',
              type: 'textarea',
            },
            {
              key: 'signosAlarmaUrg',
              label: 'Signos de alarma',
              type: 'textarea',
            },
            {
              key: 'recetaIncapacidadUrg',
              label: 'Receta e incapacidad',
              type: 'textarea',
            },
            {
              key: 'educacionPacienteUrg',
              label: 'Educación al paciente',
              type: 'textarea',
            },
            {
              key: 'responsableEgresoUrg',
              label: 'Responsable del egreso',
              type: 'textarea',
            },
            {
              key: 'referenciaTrasladoUrg',
              label: 'Referencia / traslado',
              type: 'textarea',
            },
            {
              key: 'consentimientoEgresoUrg',
              label: 'Consentimiento informado',
              type: 'textarea',
            },
            {
              key: 'avisoMinisterioPublico',
              label: 'Aviso al Ministerio Público',
              type: 'textarea',
            },
            {
              key: 'certificadoDefuncion',
              label: 'Certificado de defunción / muerte fetal',
              type: 'textarea',
            },
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
          title: 'Ingreso',
          fields: [
            { key: 'datosIngreso', label: 'Datos de ingreso', type: 'textarea' },
            {
              key: 'datosAdministrativosIngreso',
              label: 'Datos administrativos de ingreso',
              type: 'textarea',
            },
            {
              key: 'coberturaResponsableCuenta',
              label: 'Cobertura y responsable de cuenta',
              type: 'textarea',
            },
            {
              key: 'motivoIngresoHistoria',
              label: 'Subjetivo / motivo de ingreso e historia',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'evaluacion_ingreso',
          title: 'Evaluación inicial',
          fields: [
            {
              key: 'signosExploracionIngreso',
              label: 'Signos vitales y exploración',
              type: 'textarea',
            },
            {
              key: 'analisisDiagnosticoIngreso',
              label: 'Diagnóstico e interpretación',
              type: 'textarea',
            },
            {
              key: 'comorbilidadesProblemasActivos',
              label: 'Comorbilidades y problemas activos',
              type: 'textarea',
            },
            {
              key: 'condicionesInicialesHospitalizacion',
              label: 'Condiciones iniciales de hospitalización',
              type: 'textarea',
            },
            {
              key: 'planTerapeuticoIngreso',
              label: 'Plan terapéutico estructurado',
              type: 'textarea',
            },
            {
              key: 'evaluacionRiesgoClinico',
              label: 'Evaluación de riesgo clínico',
              type: 'textarea',
            },
            {
              key: 'consentimientoIngreso',
              label: 'Consentimiento informado',
              type: 'textarea',
            },
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
          key: 'evolucion_hosp',
          title: 'Nota de evolución',
          fields: [
            { key: 'datosGeneralesEvolucion', label: 'Datos generales', type: 'textarea' },
            { key: 'subjetivoHosp', label: 'Subjetivo', type: 'textarea' },
            {
              key: 'objetivoHosp',
              label: 'Objetivo / signos y exploración',
              type: 'textarea',
            },
            {
              key: 'resultadosEstudiosHosp',
              label: 'Resultados de estudios',
              type: 'textarea',
            },
            {
              key: 'analisisClinicoHosp',
              label: 'Análisis e interpretación',
              type: 'textarea',
            },
            {
              key: 'diagnosticosActivosHosp',
              label: 'Diagnósticos activos',
              type: 'textarea',
            },
            {
              key: 'eventosAdversosHosp',
              label: 'Eventos adversos y complicaciones',
              type: 'textarea',
            },
            {
              key: 'planEstructuradoHosp',
              label: 'Plan estructurado',
              type: 'textarea',
            },
            {
              key: 'camposMedicoLegalesHosp',
              label: 'Campos médico-legales',
              type: 'textarea',
            },
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

const consultationDocumentSharedSections: EpisodeSectionDefinition[] = [
  {
    key: 'documento_legales',
    title: 'Datos legales y firma',
    description:
      'Los datos legales se completan desde el profesional responsable del episodio.',
    fields: [
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
