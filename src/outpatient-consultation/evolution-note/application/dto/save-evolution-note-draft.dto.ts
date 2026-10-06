import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MedicationOrderItemDto } from '../../../shared/dto/clinical-item.dto';

const diagnosisStatusOptions = [
  '',
  'SIN_ESPECIFICAR',
  'ACTIVO',
  'EN_SEGUIMIENTO',
  'MEJORANDO',
  'CONTROLADO',
  'RESUELTO',
  'AGRAVADO',
];

/// Diagnóstico de Evolución: catálogo CIE-10 + estado evolutivo + vínculo opcional a un
/// problema clínico longitudinal ya existente (spec 3.11/3.12), para no crear duplicados.
export class EvolutionDiagnosisItemDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(diagnosisStatusOptions) status?: string;
  @IsOptional() @IsString() linkedProblemId?: string;
}

/// Entrada de guardado de Borrador para una versión de Evolución. Todos los campos opcionales
/// (regla 0.4); los campos mínimos de finalización se validan en el servicio (spec 3.23).
export class SaveEvolutionNoteDraftDto {
  @IsOptional() @IsDateString() recordedAt?: string;

  // 6. Estado general
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'ESTABLE', 'MEJORIA', 'SIN_CAMBIOS', 'DETERIORO', 'CRITICO'])
  clinicalStatus?: string;
  @IsOptional() @IsString() complications?: string;

  // 7. S — Subjetivo
  @IsOptional() @IsString() subjective?: string;

  // 8. O — Objetivo
  @IsOptional() @IsInt() vitalSystolicBp?: number;
  @IsOptional() @IsInt() vitalDiastolicBp?: number;
  @IsOptional() @IsInt() vitalHeartRate?: number;
  @IsOptional() @IsInt() vitalRespiratoryRate?: number;
  @IsOptional() @IsNumber() vitalTemperatureC?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) vitalOxygenSaturation?: number;
  @IsOptional() @IsNumber() vitalWeightKg?: number;
  @IsOptional() @IsNumber() vitalHeightCm?: number;
  @IsOptional() @IsNumber() vitalCapillaryGlucose?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) vitalEva?: number;

  // 9. Hallazgos objetivos
  @IsOptional() @IsString() objectiveFindings?: string;

  // 10. Resultados recientes
  @IsOptional() @IsString() recentResults?: string;

  // 11. A — Análisis/Diagnóstico
  @IsOptional() @IsString() primaryDiagnosisCode?: string;
  @IsOptional() @IsString() primaryDiagnosisDescription?: string;
  @IsOptional() @IsIn(diagnosisStatusOptions) primaryDiagnosisStatus?: string;
  @IsOptional() @IsString() primaryDiagnosisLinkedProblemId?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvolutionDiagnosisItemDto)
  secondaryDiagnoses?: EvolutionDiagnosisItemDto[];

  // 13. P — Plan
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'BUENO', 'RESERVADO', 'MALO'])
  prognosisStatus?: string;
  @IsOptional() @IsString() prognosisDetail?: string;
  @IsOptional()
  @IsIn(['', 'SIN_CAMBIOS', 'MODIFICADO', 'SUSPENDIDO', 'NUEVO_TRATAMIENTO'])
  treatmentChangeType?: string;
  @IsOptional() @IsString() treatmentNotes?: string;
  @IsOptional() @IsString() plannedStudies?: string;
  @IsOptional() @IsString() plannedConsultations?: string;
  @IsOptional() @IsString() followUpNotes?: string;
  @IsOptional() @IsDateString() nextAssessmentDate?: string;

  // 14. Consentimiento e información
  @IsOptional() @IsBoolean() consentCurrent?: boolean;
  @IsOptional() @IsString() informationProvided?: string;

  // 15. Comparación con evolución previa (captura manual del profesional)
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'MEJORIA', 'ESTABLE_SIN_CAMBIOS', 'DETERIORO', 'FLUCTUANTE'])
  trend?: string;
  @IsOptional() @IsString() comparativeAnalysis?: string;

  // 16. Respuesta al tratamiento
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'FAVORABLE', 'PARCIAL', 'SIN_RESPUESTA', 'DESFAVORABLE', 'NO_EVALUABLE', 'NO_APLICA'])
  pharmacologicalResponse?: string;
  @IsOptional() @IsString() adverseEvents?: string;
  @IsOptional() @IsString() clinicalJustification?: string;

  // 17. Escalas clínicas
  @IsOptional() @IsInt() @Min(1) @Max(4) glasgowOcular?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) glasgowVerbal?: number;
  @IsOptional() @IsInt() @Min(1) @Max(6) glasgowMotor?: number;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO'])
  cardiovascularRisk?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) karnofskyScore?: number;
  @IsOptional() @IsString() otherScaleName?: string;
  @IsOptional() @IsString() otherScaleResult?: string;

  /// Conducta terapéutica estructurada opcional para preparar el envío a Receta e indicaciones
  /// (spec 3.13); no sustituye la prescripción formal del tab Receta.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationOrderItemDto)
  proposedMedications?: MedicationOrderItemDto[];
}
