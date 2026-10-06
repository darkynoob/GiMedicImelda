import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useAuth } from '../../auth/hooks/auth-context';
import {
  OUTPATIENT_DOCUMENT_TYPES,
  createDocument,
  createDocumentNewVersion,
  documentTypeLabels,
  fetchDocumentDetail,
  fetchDocuments,
  finalizeDocument,
  registerDocumentDownload,
  saveDocumentDraft,
  type DocumentContent,
  type OutpatientDocumentTypeCode,
} from '../api/document.service';
import { ClinicalDocumentStatusBar } from './ClinicalDocumentStatusBar';
import { DiagnosisSelector } from './DiagnosisSelector';

type DocumentosTabProps = {
  encounterNumber: string;
};

const priorityOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['RUTINA', 'Rutina'],
  ['PRIORITARIA', 'Prioritaria'],
  ['URGENTE', 'Urgente'],
] as const;

const imagingModalityOptions = [
  ['', 'Sin registrar'],
  ['RADIOGRAFIA', 'Radiografía'],
  ['ULTRASONIDO', 'Ultrasonido'],
  ['TOMOGRAFIA', 'Tomografía'],
  ['RESONANCIA_MAGNETICA', 'Resonancia magnética'],
  ['MASTOGRAFIA', 'Mastografía'],
  ['MEDICINA_NUCLEAR', 'Medicina nuclear'],
  ['OTRO', 'Otro'],
] as const;

const referralTypeOptions = [
  ['', 'Sin registrar'],
  ['REFERENCIA', 'Referencia'],
  ['CONTRARREFERENCIA', 'Contrarreferencia'],
] as const;

const referralPriorityOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['ORDINARIA', 'Ordinaria'],
  ['PREFERENTE', 'Preferente'],
  ['URGENTE', 'Urgente'],
] as const;

const relationshipOptions = [
  ['', 'Sin registrar'],
  ['PACIENTE', 'Paciente'],
  ['MADRE', 'Madre'],
  ['PADRE', 'Padre'],
  ['TUTOR', 'Tutor'],
  ['REPRESENTANTE_LEGAL', 'Representante legal'],
  ['CONYUGE', 'Cónyuge'],
  ['FAMILIAR', 'Familiar'],
  ['OTRO', 'Otro'],
] as const;

const certificateTypeOptions = [
  ['', 'Sin registrar'],
  ['CONSTANCIA_DE_ATENCION', 'Constancia de atención'],
  ['CERTIFICADO_MEDICO', 'Certificado médico'],
  ['CONSTANCIA_DE_REPOSO', 'Constancia de reposo'],
  ['CONSTANCIA_DE_INCAPACIDAD', 'Constancia de incapacidad'],
  ['OTRO', 'Otro'],
] as const;

const closureFinalStatusOptions = [
  ['', 'Sin registrar'],
  ['SIN_ESPECIFICAR', 'Sin especificar'],
  ['MEJORADO', 'Mejorado'],
  ['ESTABLE', 'Estable'],
  ['RESUELTO', 'Resuelto'],
  ['REFERIDO', 'Referido'],
  ['HOSPITALIZADO_TRASLADADO', 'Hospitalizado / trasladado'],
  ['ABANDONO', 'Abandono'],
  ['DEFUNCION', 'Defunción'],
  ['OTRO', 'Otro'],
] as const;

const closureDestinationOptions = [
  ['', 'Sin registrar'],
  ['DOMICILIO', 'Domicilio'],
  ['REFERENCIA', 'Referencia'],
  ['HOSPITALIZACION', 'Hospitalización'],
  ['TRASLADO', 'Traslado'],
  ['OTRO', 'Otro'],
] as const;

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

/// Tab "Documentos" (Fase 5). Lista de documentos de 6 subtipos posibles, cada uno con su
/// propio versionamiento (reutiliza `ClinicalDocument`/`DocumentVersion`). Finalizar una Nota
/// de cierre cierra formalmente el episodio (spec 5.3), por lo que pide confirmación explícita.
export function DocumentosTab({ encounterNumber }: DocumentosTabProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session!.accessToken;
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [newDocumentType, setNewDocumentType] = useState<OutpatientDocumentTypeCode>('LAB_REQUEST');
  const [draft, setDraft] = useState<DocumentContent>({});

  const listQuery = useQuery({
    queryKey: ['documents', encounterNumber],
    queryFn: () => fetchDocuments(token, encounterNumber),
  });

  const documents = listQuery.data?.documents ?? [];

  const detailQuery = useQuery({
    queryKey: ['document', encounterNumber, selectedDocumentId],
    queryFn: () => fetchDocumentDetail(token, encounterNumber, selectedDocumentId as string),
    enabled: Boolean(selectedDocumentId),
  });

  const document = detailQuery.data?.document ?? null;
  const typeCode = detailQuery.data?.typeCode ?? null;

  useEffect(() => {
    setDraft(detailQuery.data?.content ?? {});
  }, [detailQuery.data?.document.id, detailQuery.data?.content]);

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['documents', encounterNumber] });
  const invalidateDetail = () =>
    queryClient.invalidateQueries({
      queryKey: ['document', encounterNumber, selectedDocumentId],
    });

  const createMutation = useMutation({
    mutationFn: () => createDocument(token, encounterNumber, newDocumentType, {}),
    onSuccess: async (created) => {
      await invalidateList();
      setSelectedDocumentId(created.id);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => saveDocumentDraft(token, encounterNumber, selectedDocumentId as string, draft),
    onSuccess: async () => {
      await invalidateDetail();
      await invalidateList();
    },
  });
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeDocument(token, encounterNumber, selectedDocumentId as string),
    onSuccess: async () => {
      await invalidateDetail();
      await invalidateList();
    },
  });
  const newVersionMutation = useMutation({
    mutationFn: () =>
      createDocumentNewVersion(token, encounterNumber, selectedDocumentId as string, draft),
    onSuccess: async () => {
      await invalidateDetail();
      await invalidateList();
    },
  });
  const downloadMutation = useMutation({
    mutationFn: () => registerDocumentDownload(token, encounterNumber, selectedDocumentId as string),
    onSuccess: invalidateList,
  });

  const isDraft = !document || document.status === 'DRAFT';

  const set = <K extends keyof DocumentContent>(key: K, value: DocumentContent[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleFinalize = () => {
    if (typeCode === 'CLOSURE_NOTE') {
      const confirmed = window.confirm(
        'Finalizar esta Nota de cierre cerrará formalmente el episodio y ya no podrá editarse. ¿Continuar?',
      );
      if (!confirmed) return;
    }
    finalizeMutation.mutate();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <SelectField
            label="Nuevo documento"
            onChange={(value) => setNewDocumentType(value as OutpatientDocumentTypeCode)}
            options={OUTPATIENT_DOCUMENT_TYPES.map((code) => [code, documentTypeLabels[code]] as const)}
            value={newDocumentType}
          />
          <Button
            className="w-full"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            size="sm"
            type="button"
          >
            + Crear
          </Button>
        </div>
        <ul className="space-y-1">
          {documents.map((doc) => {
            const code = (doc.metadataJson?.documentTypeCode ?? '') as OutpatientDocumentTypeCode;
            const isSelected = doc.id === selectedDocumentId;
            return (
              <li key={doc.id}>
                <button
                  className={`flex w-full flex-col items-start rounded-lg border px-3 py-2 text-left text-sm ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  type="button"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{doc.title}</span>
                    <Badge variant={doc.status === 'DRAFT' ? 'draft' : 'success'}>
                      {doc.status === 'DRAFT' ? 'Borrador' : 'Final'}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {documentTypeLabels[code] ?? code}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {documents.length === 0 && !listQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Sin documentos todavía.</p>
        ) : null}
      </aside>

      <div className="space-y-5">
        {!selectedDocumentId ? (
          <p className="text-sm text-muted-foreground">
            Selecciona un documento o crea uno nuevo eligiendo su tipo.
          </p>
        ) : detailQuery.isLoading || !document ? (
          <p className="text-sm text-muted-foreground">Cargando documento...</p>
        ) : (
          <>
            <ClinicalDocumentStatusBar
              finalizedAt={document.status === 'FINALIZED' ? document.lockedAt : null}
              isSaving={saveMutation.isPending || finalizeMutation.isPending}
              onCreateNewVersion={
                document.status === 'FINALIZED' ? () => newVersionMutation.mutate() : undefined
              }
              onFinalize={isDraft ? handleFinalize : undefined}
              onSave={isDraft ? () => saveMutation.mutate() : undefined}
              recordedAt={document.documentDate}
              status={document.status}
              versionNumber={detailQuery.data?.versions?.[0]?.versionNumber ?? 1}
            />

            {document.status === 'FINALIZED' ? (
              <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-muted-foreground">
                <Button
                  disabled={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Registrar descarga oficial ({document.downloadCount})
                </Button>
                <span>El PDF binario real no está implementado todavía.</span>
              </section>
            ) : null}

            {typeCode === 'LAB_REQUEST' ? (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Solicitud de laboratorio</h3>
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('labReasonForRequest', event.target.value)}
                  placeholder="Motivo de la solicitud"
                  value={draft.labReasonForRequest ?? ''}
                />
                <div className="space-y-2">
                  {(draft.labStudies ?? []).map((study, index) => (
                    <div className="grid gap-2 sm:grid-cols-3" key={index}>
                      <Input
                        disabled={!isDraft}
                        onChange={(event) => {
                          const studies = [...(draft.labStudies ?? [])];
                          studies[index] = { ...studies[index], name: event.target.value };
                          set('labStudies', studies);
                        }}
                        placeholder="Estudio"
                        value={study.name ?? ''}
                      />
                      <Input
                        disabled={!isDraft}
                        onChange={(event) => {
                          const studies = [...(draft.labStudies ?? [])];
                          studies[index] = { ...studies[index], type: event.target.value };
                          set('labStudies', studies);
                        }}
                        placeholder="Tipo"
                        value={study.type ?? ''}
                      />
                      {isDraft ? (
                        <Button
                          onClick={() =>
                            set(
                              'labStudies',
                              (draft.labStudies ?? []).filter((_, i) => i !== index),
                            )
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Quitar
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  {isDraft ? (
                    <Button
                      onClick={() => set('labStudies', [...(draft.labStudies ?? []), {}])}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      + Agregar estudio
                    </Button>
                  ) : null}
                </div>
                <DiagnosisSelector
                  label="Diagnóstico"
                  onChange={(value) => {
                    set('labDiagnosisCode', value.code ?? '');
                    set('labDiagnosisDescription', value.description ?? '');
                  }}
                  value={{ code: draft.labDiagnosisCode, description: draft.labDiagnosisDescription }}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('labObservations', event.target.value)}
                  placeholder="Observaciones"
                  value={draft.labObservations ?? ''}
                />
                <SelectField
                  disabled={!isDraft}
                  label="Prioridad"
                  onChange={(value) => set('labPriority', value)}
                  options={priorityOptions}
                  value={draft.labPriority ?? ''}
                />
              </section>
            ) : null}

            {typeCode === 'IMAGING_REQUEST' ? (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Solicitud de imagenología</h3>
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('imagingReasonForStudy', event.target.value)}
                  placeholder="Motivo del estudio"
                  value={draft.imagingReasonForStudy ?? ''}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    disabled={!isDraft}
                    label="Modalidad"
                    onChange={(value) => set('imagingModality', value)}
                    options={imagingModalityOptions}
                    value={draft.imagingModality ?? ''}
                  />
                  <Input
                    disabled={!isDraft}
                    onChange={(event) => set('imagingModalityOtherDetail', event.target.value)}
                    placeholder="Detalle si 'Otro'"
                    value={draft.imagingModalityOtherDetail ?? ''}
                  />
                </div>
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('imagingStudyRequested', event.target.value)}
                  placeholder="Estudio solicitado"
                  value={draft.imagingStudyRequested ?? ''}
                />
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('imagingAnatomicalRegion', event.target.value)}
                  placeholder="Región anatómica"
                  value={draft.imagingAnatomicalRegion ?? ''}
                />
                <DiagnosisSelector
                  label="Diagnóstico presuntivo"
                  onChange={(value) => {
                    set('imagingPresumptiveDiagnosisCode', value.code ?? '');
                    set('imagingPresumptiveDiagnosisDescription', value.description ?? '');
                  }}
                  value={{
                    code: draft.imagingPresumptiveDiagnosisCode,
                    description: draft.imagingPresumptiveDiagnosisDescription,
                  }}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('imagingSpecialInstructions', event.target.value)}
                  placeholder="Instrucciones especiales"
                  value={draft.imagingSpecialInstructions ?? ''}
                />
                <SelectField
                  disabled={!isDraft}
                  label="Prioridad"
                  onChange={(value) => set('imagingPriority', value)}
                  options={priorityOptions}
                  value={draft.imagingPriority ?? ''}
                />
              </section>
            ) : null}

            {typeCode === 'REFERRAL' ? (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Referencia / contrarreferencia</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    disabled={!isDraft}
                    label="Tipo"
                    onChange={(value) => set('referralType', value)}
                    options={referralTypeOptions}
                    value={draft.referralType ?? ''}
                  />
                  <SelectField
                    disabled={!isDraft}
                    label="Prioridad"
                    onChange={(value) => set('referralPriority', value)}
                    options={referralPriorityOptions}
                    value={draft.referralPriority ?? ''}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    disabled={!isDraft}
                    onChange={(event) => set('referralOriginUnit', event.target.value)}
                    placeholder="Unidad de origen"
                    value={draft.referralOriginUnit ?? ''}
                  />
                  <Input
                    disabled={!isDraft}
                    onChange={(event) => set('referralDestinationUnit', event.target.value)}
                    placeholder="Unidad de destino"
                    value={draft.referralDestinationUnit ?? ''}
                  />
                </div>
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('referralDestinationSpecialty', event.target.value)}
                  placeholder="Especialidad de destino"
                  value={draft.referralDestinationSpecialty ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('referralReason', event.target.value)}
                  placeholder="Motivo de la referencia"
                  value={draft.referralReason ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('referralClinicalSummary', event.target.value)}
                  placeholder="Resumen clínico"
                  value={draft.referralClinicalSummary ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('referralCurrentTreatmentSummary', event.target.value)}
                  placeholder="Tratamiento actual"
                  value={draft.referralCurrentTreatmentSummary ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('referralStudiesPerformed', event.target.value)}
                  placeholder="Estudios realizados"
                  value={draft.referralStudiesPerformed ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('referralRecommendations', event.target.value)}
                  placeholder="Recomendaciones"
                  value={draft.referralRecommendations ?? ''}
                />
              </section>
            ) : null}

            {typeCode === 'INFORMED_CONSENT' ? (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Consentimiento informado</h3>
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('consentProcedureType', event.target.value)}
                  placeholder="Tipo de procedimiento"
                  value={draft.consentProcedureType ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('consentProcedureDescription', event.target.value)}
                  placeholder="Descripción del procedimiento"
                  value={draft.consentProcedureDescription ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('consentRisks', event.target.value)}
                  placeholder="Riesgos"
                  value={draft.consentRisks ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('consentBenefits', event.target.value)}
                  placeholder="Beneficios"
                  value={draft.consentBenefits ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('consentAlternatives', event.target.value)}
                  placeholder="Alternativas"
                  value={draft.consentAlternatives ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('consentPrognosisWithoutTreatment', event.target.value)}
                  placeholder="Pronóstico sin tratamiento"
                  value={draft.consentPrognosisWithoutTreatment ?? ''}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    disabled={!isDraft}
                    onChange={(event) => set('consentPatientOrGuardianName', event.target.value)}
                    placeholder="Nombre de quien otorga el consentimiento"
                    value={draft.consentPatientOrGuardianName ?? ''}
                  />
                  <SelectField
                    disabled={!isDraft}
                    label="Relación con el paciente"
                    onChange={(value) => set('consentRelationship', value)}
                    options={relationshipOptions}
                    value={draft.consentRelationship ?? ''}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={Boolean(draft.consentContingencyAuthorization)}
                    disabled={!isDraft}
                    onChange={(event) => set('consentContingencyAuthorization', event.target.checked)}
                    type="checkbox"
                  />
                  Autoriza procedimientos de contingencia no previstos
                </label>
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('consentContingencyNotes', event.target.value)}
                  placeholder="Notas de contingencia"
                  value={draft.consentContingencyNotes ?? ''}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    disabled={!isDraft}
                    onChange={(event) =>
                      set('consentWitness1', { ...draft.consentWitness1, fullName: event.target.value })
                    }
                    placeholder="Testigo 1: nombre"
                    value={draft.consentWitness1?.fullName ?? ''}
                  />
                  <Input
                    disabled={!isDraft}
                    onChange={(event) =>
                      set('consentWitness2', { ...draft.consentWitness2, fullName: event.target.value })
                    }
                    placeholder="Testigo 2: nombre"
                    value={draft.consentWitness2?.fullName ?? ''}
                  />
                </div>
              </section>
            ) : null}

            {typeCode === 'CERTIFICATE' ? (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Certificado / constancia</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    disabled={!isDraft}
                    label="Tipo"
                    onChange={(value) => set('certificateType', value)}
                    options={certificateTypeOptions}
                    value={draft.certificateType ?? ''}
                  />
                  <Input
                    disabled={!isDraft}
                    onChange={(event) => set('certificateTypeOtherDetail', event.target.value)}
                    placeholder="Detalle si 'Otro'"
                    value={draft.certificateTypeOtherDetail ?? ''}
                  />
                </div>
                <Input
                  disabled={!isDraft}
                  onChange={(event) => set('certificateDocumentUse', event.target.value)}
                  placeholder="Uso del documento"
                  value={draft.certificateDocumentUse ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('certificateReason', event.target.value)}
                  placeholder="Motivo"
                  value={draft.certificateReason ?? ''}
                />
                <DiagnosisSelector
                  label="Diagnóstico"
                  onChange={(value) => {
                    set('certificateDiagnosisCode', value.code ?? '');
                    set('certificateDiagnosisDescription', value.description ?? '');
                  }}
                  value={{
                    code: draft.certificateDiagnosisCode,
                    description: draft.certificateDiagnosisDescription,
                  }}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={Boolean(draft.certificateHideDiagnosisInPdf)}
                    disabled={!isDraft}
                    onChange={(event) => set('certificateHideDiagnosisInPdf', event.target.checked)}
                    type="checkbox"
                  />
                  Ocultar diagnóstico en el PDF
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Reposo desde</span>
                    <Input
                      disabled={!isDraft}
                      onChange={(event) => set('certificateRestStartDate', event.target.value)}
                      type="date"
                      value={draft.certificateRestStartDate ?? ''}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Reposo hasta</span>
                    <Input
                      disabled={!isDraft}
                      onChange={(event) => set('certificateRestEndDate', event.target.value)}
                      type="date"
                      value={draft.certificateRestEndDate ?? ''}
                    />
                  </label>
                </div>
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('certificateObservations', event.target.value)}
                  placeholder="Observaciones"
                  value={draft.certificateObservations ?? ''}
                />
              </section>
            ) : null}

            {typeCode === 'CLOSURE_NOTE' ? (
              <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">
                  Nota de cierre — finalizarla cerrará el episodio
                </h3>
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('closureReason', event.target.value)}
                  placeholder="Motivo del cierre"
                  value={draft.closureReason ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('closureFinalClinicalSummary', event.target.value)}
                  placeholder="Resumen clínico final"
                  value={draft.closureFinalClinicalSummary ?? ''}
                />
                <SelectField
                  disabled={!isDraft}
                  label="Estado final"
                  onChange={(value) => set('closureFinalStatus', value)}
                  options={closureFinalStatusOptions}
                  value={draft.closureFinalStatus ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('closureDischargeInstructions', event.target.value)}
                  placeholder="Indicaciones de egreso"
                  value={draft.closureDischargeInstructions ?? ''}
                />
                <Textarea
                  disabled={!isDraft}
                  onChange={(event) => set('closureFollowUpPlan', event.target.value)}
                  placeholder="Plan de seguimiento"
                  value={draft.closureFollowUpPlan ?? ''}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Próxima cita</span>
                    <Input
                      disabled={!isDraft}
                      onChange={(event) => set('closureNextAppointmentDate', event.target.value)}
                      type="date"
                      value={draft.closureNextAppointmentDate ?? ''}
                    />
                  </label>
                  <SelectField
                    disabled={!isDraft}
                    label="Destino"
                    onChange={(value) => set('closureDestination', value)}
                    options={closureDestinationOptions}
                    value={draft.closureDestination ?? ''}
                  />
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
