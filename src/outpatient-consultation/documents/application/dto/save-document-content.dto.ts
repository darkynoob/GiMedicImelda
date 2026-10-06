import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DiagnosisItemDto } from '../../../shared/dto/clinical-item.dto';

export const OUTPATIENT_DOCUMENT_TYPES = [
  'LAB_REQUEST',
  'IMAGING_REQUEST',
  'REFERRAL',
  'INFORMED_CONSENT',
  'CERTIFICATE',
  'CLOSURE_NOTE',
] as const;
export type OutpatientDocumentTypeCode = (typeof OUTPATIENT_DOCUMENT_TYPES)[number];

const priorityOptions = ['', 'SIN_ESPECIFICAR', 'RUTINA', 'PRIORITARIA', 'URGENTE'];

export class LabStudyItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() specialNotes?: string;
}

export class WitnessItemDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() relationship?: string;
}

export class EducationalAttachmentItemDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() attachmentId?: string;
}

/// Contenido estructurado de un documento del tab Documentos. Todos los campos son opcionales
/// a nivel DTO (regla 0.4: Borrador editable incremental); los mínimos por tipo se validan en
/// el servicio al finalizar (spec 5.14), según `documentTypeCode`.
export class SaveDocumentContentDto {
  @IsOptional() @IsDateString() recordedAt?: string;

  // Solicitud de laboratorio
  @IsOptional() @IsString() labReasonForRequest?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabStudyItemDto)
  labStudies?: LabStudyItemDto[];
  @IsOptional() @IsString() labDiagnosisCode?: string;
  @IsOptional() @IsString() labDiagnosisDescription?: string;
  @IsOptional() @IsString() labObservations?: string;
  @IsOptional() @IsIn(priorityOptions) labPriority?: string;

  // Solicitud de imagenología
  @IsOptional() @IsString() imagingReasonForStudy?: string;
  @IsOptional()
  @IsIn(['', 'RADIOGRAFIA', 'ULTRASONIDO', 'TOMOGRAFIA', 'RESONANCIA_MAGNETICA', 'MASTOGRAFIA', 'MEDICINA_NUCLEAR', 'OTRO'])
  imagingModality?: string;
  @IsOptional() @IsString() imagingModalityOtherDetail?: string;
  @IsOptional() @IsString() imagingStudyRequested?: string;
  @IsOptional() @IsString() imagingAnatomicalRegion?: string;
  @IsOptional() @IsString() imagingPresumptiveDiagnosisCode?: string;
  @IsOptional() @IsString() imagingPresumptiveDiagnosisDescription?: string;
  @IsOptional() @IsString() imagingSpecialInstructions?: string;
  @IsOptional() @IsIn(priorityOptions) imagingPriority?: string;

  // Referencia / contrarreferencia
  @IsOptional() @IsIn(['', 'REFERENCIA', 'CONTRARREFERENCIA']) referralType?: string;
  @IsOptional() @IsString() referralDestinationUnit?: string;
  @IsOptional() @IsString() referralOriginUnit?: string;
  @IsOptional() @IsString() referralReason?: string;
  @IsOptional() @IsString() referralClinicalSummary?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisItemDto)
  referralDiagnoses?: DiagnosisItemDto[];
  @IsOptional() @IsString() referralCurrentTreatmentSummary?: string;
  @IsOptional() @IsString() referralStudiesPerformed?: string;
  @IsOptional() @IsString() referralRecommendations?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'ORDINARIA', 'PREFERENTE', 'URGENTE'])
  referralPriority?: string;
  @IsOptional() @IsString() referralDestinationSpecialty?: string;

  // Consentimiento informado
  @IsOptional() @IsString() consentProcedureType?: string;
  @IsOptional() @IsString() consentProcedureDescription?: string;
  @IsOptional() @IsString() consentRisks?: string;
  @IsOptional() @IsString() consentBenefits?: string;
  @IsOptional() @IsString() consentAlternatives?: string;
  @IsOptional() @IsString() consentPrognosisWithoutTreatment?: string;
  @IsOptional() @IsString() consentPatientOrGuardianName?: string;
  @IsOptional()
  @IsIn(['', 'PACIENTE', 'MADRE', 'PADRE', 'TUTOR', 'REPRESENTANTE_LEGAL', 'CONYUGE', 'FAMILIAR', 'OTRO'])
  consentRelationship?: string;
  @IsOptional() @IsString() consentRelationshipDetail?: string;
  @IsOptional() @IsBoolean() consentContingencyAuthorization?: boolean;
  @IsOptional() @IsString() consentContingencyNotes?: string;
  @IsOptional() @ValidateNested() @Type(() => WitnessItemDto) consentWitness1?: WitnessItemDto;
  @IsOptional() @ValidateNested() @Type(() => WitnessItemDto) consentWitness2?: WitnessItemDto;
  @IsOptional() @IsDateString() consentDateTime?: string;

  // Certificado / constancia
  @IsOptional()
  @IsIn(['', 'CONSTANCIA_DE_ATENCION', 'CERTIFICADO_MEDICO', 'CONSTANCIA_DE_REPOSO', 'CONSTANCIA_DE_INCAPACIDAD', 'OTRO'])
  certificateType?: string;
  @IsOptional() @IsString() certificateTypeOtherDetail?: string;
  @IsOptional() @IsString() certificateDocumentUse?: string;
  @IsOptional() @IsString() certificateReason?: string;
  @IsOptional() @IsString() certificateDiagnosisCode?: string;
  @IsOptional() @IsString() certificateDiagnosisDescription?: string;
  @IsOptional() @IsDateString() certificateRestStartDate?: string;
  @IsOptional() @IsDateString() certificateRestEndDate?: string;
  @IsOptional() @IsString() certificateObservations?: string;
  @IsOptional() @IsBoolean() certificateHideDiagnosisInPdf?: boolean;

  // Nota de cierre (episodio ambulatorio)
  @IsOptional() @IsString() closureReason?: string;
  @IsOptional() @IsString() closureFinalClinicalSummary?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisItemDto)
  closureFinalDiagnoses?: DiagnosisItemDto[];
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'MEJORADO', 'ESTABLE', 'RESUELTO', 'REFERIDO', 'HOSPITALIZADO_TRASLADADO', 'ABANDONO', 'DEFUNCION', 'OTRO'])
  closureFinalStatus?: string;
  @IsOptional() @IsString() closureDischargeInstructions?: string;
  @IsOptional() @IsString() closureFollowUpPlan?: string;
  @IsOptional() @IsDateString() closureNextAppointmentDate?: string;
  @IsOptional()
  @IsIn(['', 'DOMICILIO', 'REFERENCIA', 'HOSPITALIZACION', 'TRASLADO', 'OTRO'])
  closureDestination?: string;
}
