export type EpisodeRecordPanelConfig = {
  contextLabel: string;
  defaultActionLabel: string;
  noteTypes?: string[];
};

const outpatientConfig: Record<string, EpisodeRecordPanelConfig> = {
  'Historia clínica': {
    contextLabel: 'Historia clínica',
    defaultActionLabel: 'Nueva historia clínica',
  },
  'Consulta actual': {
    contextLabel: 'Notas de consulta',
    defaultActionLabel: 'Nueva nota de consulta',
  },
  Evolución: {
    contextLabel: 'Evoluciones hospitalarias',
    defaultActionLabel: 'Nueva evolución hospitalaria',
  },
  'Evolución hospitalaria': {
    contextLabel: 'Evoluciones hospitalarias',
    defaultActionLabel: 'Nueva evolución hospitalaria',
  },
  'Receta / Indicaciones': {
    contextLabel: 'Recetas e indicaciones',
    defaultActionLabel: 'Nueva receta',
  },
  Documentos: {
    contextLabel: 'Documentos del episodio',
    defaultActionLabel: 'Nuevo documento',
    noteTypes: [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Referencia / contrarreferencia',
      'Consentimiento informado',
      'Certificado / constancia',
      'Nota de cierre',
    ],
  },
};

const emergencyConfig: Record<string, EpisodeRecordPanelConfig> = {
  Triage: {
    contextLabel: 'Registros de triage',
    defaultActionLabel: 'Nuevo triage',
  },
  'Nota inicial': {
    contextLabel: 'Notas iniciales',
    defaultActionLabel: 'Nueva nota inicial',
  },
  Evolución: {
    contextLabel: 'Notas de evolución',
    defaultActionLabel: 'Nueva nota de evolución',
  },
  'Evolución en urgencias': {
    contextLabel: 'Notas de evolución',
    defaultActionLabel: 'Nueva nota de evolución',
  },
  'Órdenes / Indicaciones': {
    contextLabel: 'Órdenes e indicaciones',
    defaultActionLabel: 'Nueva orden',
    noteTypes: ['Orden médica', 'Hoja de indicaciones'],
  },
  'Órdenes e indicaciones': {
    contextLabel: 'Órdenes e indicaciones',
    defaultActionLabel: 'Nueva orden',
    noteTypes: ['Orden médica', 'Hoja de indicaciones'],
  },
  Interconsultas: {
    contextLabel: 'Interconsultas',
    defaultActionLabel: 'Nueva interconsulta',
  },
  Egreso: {
    contextLabel: 'Egreso de urgencias',
    defaultActionLabel: 'Nuevo egreso',
  },
  'Egreso de urgencias': {
    contextLabel: 'Egreso de urgencias',
    defaultActionLabel: 'Nuevo egreso',
  },
  Documentos: {
    contextLabel: 'Documentos del episodio',
    defaultActionLabel: 'Nuevo documento',
    noteTypes: [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Referencia / contrarreferencia',
      'Consentimiento informado',
      'Certificado / constancia',
    ],
  },
};

const hospitalizationConfig: Record<string, EpisodeRecordPanelConfig> = {
  Ingreso: {
    contextLabel: 'Ingreso hospitalario',
    defaultActionLabel: 'Nuevo ingreso hospitalario',
  },
  'Ingreso hospitalario': {
    contextLabel: 'Ingreso hospitalario',
    defaultActionLabel: 'Nuevo ingreso hospitalario',
  },
  Evolución: {
    contextLabel: 'Notas de evolución',
    defaultActionLabel: 'Nueva nota de evolución',
  },
  'Indicaciones médicas': {
    contextLabel: 'Indicaciones médicas',
    defaultActionLabel: 'Nuevas indicaciones',
  },
  Interconsultas: {
    contextLabel: 'Interconsultas',
    defaultActionLabel: 'Nueva interconsulta',
  },
  'Procedimientos / Cirugía': {
    contextLabel: 'Notas quirúrgicas',
    defaultActionLabel: 'Nueva nota',
    noteTypes: [
      'Nota preoperatoria',
      'Nota preanestésica',
      'Nota postoperatoria',
      'Nota postanestésica',
    ],
  },
  'Procedimientos y cirugía': {
    contextLabel: 'Subdocumentos quirúrgicos',
    defaultActionLabel: 'Nuevo subdocumento',
    noteTypes: [
      'Nota preoperatoria',
      'Nota preanestésica',
      'Nota postoperatoria',
      'Nota postanestésica',
    ],
  },
  Enfermería: {
    contextLabel: 'Registros de enfermería',
    defaultActionLabel: 'Nuevo registro',
  },
  Egreso: {
    contextLabel: 'Notas de egreso',
    defaultActionLabel: 'Nueva nota de egreso',
  },
  Documentos: {
    contextLabel: 'Documentos del episodio',
    defaultActionLabel: 'Nuevo documento',
    noteTypes: [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Consentimiento informado',
      'Resumen clínico',
      'Referencia / traslado',
      'Defunción',
    ],
  },
};

const surgeryConfig: Record<string, EpisodeRecordPanelConfig> = {
  'Valoración preprocedimiento': {
    contextLabel: 'Notas de valoración',
    defaultActionLabel: 'Nueva valoración',
  },
  Procedimiento: {
    contextLabel: 'Notas del procedimiento',
    defaultActionLabel: 'Nueva nota del procedimiento',
  },
  'Recuperación / Evolución': {
    contextLabel: 'Notas de recuperación',
    defaultActionLabel: 'Nueva nota postprocedimiento',
  },
  'Indicaciones / Receta': {
    contextLabel: 'Indicaciones y recetas',
    defaultActionLabel: 'Nueva indicación',
    noteTypes: [
      'Indicaciones de egreso',
      'Receta médica',
      'Solicitud de estudios',
    ],
  },
  Egreso: {
    contextLabel: 'Notas de egreso',
    defaultActionLabel: 'Nueva nota de egreso',
  },
  Documentos: {
    contextLabel: 'Documentos del episodio',
    defaultActionLabel: 'Nuevo documento',
    noteTypes: [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Consentimiento informado',
      'Nota de complicaciones',
      'Nota de alta ambulatoria',
    ],
  },
};

const recordConfigByEncounterType: Record<string, Record<string, EpisodeRecordPanelConfig>> =
  {
    OUTPATIENT: outpatientConfig,
    EMERGENCY: emergencyConfig,
    HOSPITALIZATION: hospitalizationConfig,
    SURGERY: surgeryConfig,
  };

export const encounterRecordStatusConfig: Record<
  string,
  { label: string; badgeVariant: 'draft' | 'signed' | 'warning' | 'success' | 'secondary' }
> = {
  DRAFT: { label: 'Borrador', badgeVariant: 'draft' },
  OPEN: { label: 'Abierto', badgeVariant: 'warning' },
  CLOSED: { label: 'Cerrado', badgeVariant: 'secondary' },
  SIGNED: { label: 'Firmado', badgeVariant: 'signed' },
};

export function getEpisodeRecordPanelConfig(
  encounterType: string,
  tabKey: string,
) {
  return recordConfigByEncounterType[encounterType]?.[tabKey] ?? null;
}

export function buildDefaultRecordTitle(noteType: string) {
  return `${noteType} — borrador`;
}
