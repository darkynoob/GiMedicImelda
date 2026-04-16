export type EpisodeFieldOption = {
  value: string;
  label: string;
};

export type EpisodeFieldDefinition = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'datetime-local' | 'number';
  placeholder?: string;
  options?: EpisodeFieldOption[];
};

export type EpisodeSectionDefinition = {
  key: string;
  title: string;
  description?: string;
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
            },
          ],
        },
        {
          key: 'antecedentes',
          title: 'Antecedentes y contexto',
          fields: [
            {
              key: 'antecedentesHeredofamiliares',
              label: 'Antecedentes heredofamiliares',
              type: 'textarea',
            },
            {
              key: 'antecedentesPatologicos',
              label: 'Antecedentes personales patológicos',
              type: 'textarea',
            },
            {
              key: 'antecedentesNoPatologicos',
              label: 'Antecedentes personales no patológicos',
              type: 'textarea',
            },
            {
              key: 'antecedentesGinecoObstetricos',
              label: 'Antecedentes gineco-obstétricos',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'clinica_base',
          title: 'Clínica base',
          fields: [
            {
              key: 'padecimientoActual',
              label: 'Padecimiento actual',
              type: 'textarea',
            },
            {
              key: 'interrogatorioSistemas',
              label: 'Interrogatorio por aparatos y sistemas',
              type: 'textarea',
            },
            {
              key: 'exploracionFisica',
              label: 'Exploración física',
              type: 'textarea',
            },
            {
              key: 'resultadosPreviosEstudios',
              label: 'Resultados previos de estudios',
              type: 'textarea',
            },
          ],
        },
        {
          key: 'juicio_clinico',
          title: 'Juicio clínico',
          fields: [
            {
              key: 'diagnosticosProblemas',
              label: 'Diagnósticos o problemas clínicos',
              type: 'textarea',
            },
            {
              key: 'planTerapeutico',
              label: 'Plan terapéutico',
              type: 'textarea',
            },
            {
              key: 'pronostico',
              label: 'Pronóstico',
              type: 'textarea',
            },
            {
              key: 'medicacionCronica',
              label: 'Medicación crónica actual',
              type: 'textarea',
            },
            {
              key: 'apegoTerapeutico',
              label: 'Apego terapéutico',
              type: 'textarea',
            },
            {
              key: 'factoresRiesgo',
              label: 'Factores de riesgo',
              type: 'textarea',
            },
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
  const sections: Record<string, Record<string, string>> = {};

  for (const tab of
    episodeProfileSchemas[encounterType] ?? episodeProfileSchemas.OUTPATIENT ?? []) {
    sections[tab.title] = {};

    for (const section of tab.sections) {
      for (const field of section.fields) {
        sections[tab.title][field.key] = '';
      }
    }
  }

  return sections;
}
