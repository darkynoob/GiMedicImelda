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
          key: 'receta_base',
          title: 'Receta',
          fields: [
            {
              key: 'encabezadoReceta',
              label: 'Encabezado de receta',
              type: 'textarea',
            },
            {
              key: 'diagnosticoAsociado',
              label: 'Diagnóstico asociado',
              type: 'textarea',
            },
            {
              key: 'prescripcion',
              label: 'Prescripción',
              type: 'textarea',
            },
            {
              key: 'validacionesSeguridad',
              label: 'Validaciones de seguridad',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'indicaciones_consulta',
          title: 'Indicaciones y seguimiento',
          fields: [
            {
              key: 'indicacionesSignosAlarma',
              label: 'Indicaciones y signos de alarma',
              type: 'textarea',
            },
            {
              key: 'datosLegalesReceta',
              label: 'Datos legales',
              type: 'textarea',
            },
            {
              key: 'educacionPaciente',
              label: 'Educación al paciente',
              type: 'textarea',
            },
            {
              key: 'planSeguimiento',
              label: 'Plan de seguimiento',
              type: 'textarea',
            },
            {
              key: 'estudiosSolicitados',
              label: 'Estudios solicitados',
              type: 'textarea',
            },
            {
              key: 'informacionClinicaAdicional',
              label: 'Información clínica adicional',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      key: 'Documentos',
      title: 'Documentos',
      description: 'Notas o documentos complementarios del episodio.',
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
              key: 'prioridadTriage',
              label: 'Prioridad',
              type: 'select',
              options: priorityOptions,
            },
            {
              key: 'datosLlegadaTiempos',
              label: 'Datos de llegada y tiempos',
              type: 'textarea',
            },
            {
              key: 'motivoUrgencia',
              label: 'Motivo de urgencia estructurado',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'triage_clinico',
          title: 'Estado clínico inicial',
          fields: [
            {
              key: 'discriminadoresClinicos',
              label: 'Discriminadores clínicos',
              type: 'textarea',
            },
            {
              key: 'signosVitalesTriage',
              label: 'Signos vitales en triage',
              type: 'textarea',
            },
            {
              key: 'soporteClinicoEstado',
              label: 'Soporte clínico y estado',
              type: 'textarea',
            },
            {
              key: 'escalasEvaluacion',
              label: 'Escalas de evaluación / NEWS2',
              type: 'textarea',
            },
            {
              key: 'alertasAutomaticas',
              label: 'Alertas automáticas',
              type: 'textarea',
            },
            {
              key: 'destinoReevaluacion',
              label: 'Destino y reevaluación',
              type: 'textarea',
            },
            {
              key: 'responsableTriage',
              label: 'Responsable de triage',
              type: 'textarea',
            },
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
