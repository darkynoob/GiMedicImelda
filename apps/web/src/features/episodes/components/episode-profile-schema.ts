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
      description: 'Captura estructurada de la nota de consulta.',
      sections: [
        {
          key: 'tipo_consulta',
          title: 'Contexto de la consulta',
          fields: [
            {
              key: 'tipoConsulta',
              label: 'Tipo de consulta',
              type: 'select',
              options: [
                { value: '', label: 'Selecciona una opcion' },
                { value: 'PRIMERA_VEZ', label: 'Primera vez' },
                { value: 'SUBSECUENTE', label: 'Subsecuente' },
                { value: 'CONTROL', label: 'Control' },
              ],
            },
            {
              key: 'motivoConsulta',
              label: 'Motivo de consulta',
              type: 'textarea',
            },
            {
              key: 'padecimientoActualConsulta',
              label: 'Padecimiento actual',
              type: 'textarea',
            },
            {
              key: 'antecedentesReferencia',
              label: 'Antecedentes de referencia',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'exploracion_consulta',
          title: 'Exploración y diagnóstico',
          fields: [
            {
              key: 'signosVitalesConsulta',
              label: 'Signos vitales',
              type: 'textarea',
            },
            {
              key: 'exploracionFisicaConsulta',
              label: 'Exploración física',
              type: 'textarea',
            },
            {
              key: 'impresionDiagnostica',
              label: 'Impresión diagnóstica',
              type: 'textarea',
            },
            {
              key: 'planTerapeuticoConsulta',
              label: 'Plan terapéutico',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'seguridad_consulta',
          title: 'Seguridad y continuidad',
          fields: [
            {
              key: 'consentimientoInformado',
              label: 'Consentimiento informado',
              type: 'textarea',
            },
            {
              key: 'redFlags',
              label: 'Síntomas de alarma',
              type: 'textarea',
            },
            {
              key: 'impactoFuncional',
              label: 'Impacto funcional',
              type: 'textarea',
            },
            {
              key: 'adherenciaTratamiento',
              label: 'Adherencia al tratamiento actual',
              type: 'textarea',
            },
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
              key: 'fechaEvolucion',
              label: 'Fecha de evolución',
              type: 'datetime-local',
            },
            {
              key: 'estadoClinicoGeneral',
              label: 'Estado clínico general',
              type: 'select',
              options: clinicalStateOptions,
            },
            {
              key: 'subjetivo',
              label: 'S - Subjetivo',
              type: 'textarea',
            },
            {
              key: 'objetivo',
              label: 'O - Objetivo',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'analisis_plan',
          title: 'Análisis y plan',
          fields: [
            {
              key: 'analisisDiagnostico',
              label: 'A - Análisis / Diagnóstico',
              type: 'textarea',
            },
            {
              key: 'planEvolucion',
              label: 'P - Plan',
              type: 'textarea',
            },
            {
              key: 'comparacionEvolucionPrevia',
              label: 'Comparación con evolución previa',
              type: 'textarea',
            },
            {
              key: 'respuestaTratamiento',
              label: 'Evaluación de respuesta al tratamiento',
              type: 'textarea',
            },
            {
              key: 'escalasClinicas',
              label: 'Escalas clínicas aplicadas',
              type: 'textarea',
            },
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
