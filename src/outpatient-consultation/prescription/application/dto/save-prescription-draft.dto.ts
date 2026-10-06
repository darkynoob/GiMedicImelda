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
import { DiagnosisItemDto } from '../../../shared/dto/clinical-item.dto';

const routeOptions = [
  '',
  'ORAL',
  'INTRAVENOSA',
  'INTRAMUSCULAR',
  'SUBCUTANEA',
  'TOPICA',
  'INHALADA',
  'OFTALMICA',
  'OTICA',
  'RECTAL',
  'VAGINAL',
  'SUBLINGUAL',
  'OTRA',
];

const frequencyPresetOptions = [
  '',
  'CADA_4_HORAS',
  'CADA_6_HORAS',
  'CADA_8_HORAS',
  'CADA_12_HORAS',
  'CADA_24_HORAS',
  'UNA_VEZ_AL_DIA',
  'DOS_VECES_AL_DIA',
  'TRES_VECES_AL_DIA',
  'PRN',
  'OTRA',
];

/// Medicamento estructurado de receta: dosis separada en cantidad+unidad, frecuencia
/// predefinida + intervalo en horas, duración consolidada (spec 4.9 — sin campos duplicados).
export class PrescriptionMedicationItemDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() medication?: string;
  @IsOptional() @IsString() activeIngredient?: string;
  @IsOptional() @IsString() presentation?: string;
  @IsOptional() @IsNumber() doseQuantity?: number;
  @IsOptional() @IsString() doseUnit?: string;
  @IsOptional() @IsIn(routeOptions) route?: string;
  @IsOptional() @IsString() routeDetail?: string;
  @IsOptional() @IsIn(frequencyPresetOptions) frequencyPreset?: string;
  @IsOptional() @IsInt() @Min(1) intervalHours?: number;
  @IsOptional() @IsNumber() @Min(0) durationValue?: number;
  @IsOptional() @IsIn(['', 'DIAS', 'SEMANAS', 'MESES']) durationUnit?: string;
  @IsOptional()
  @IsIn(['', 'AGUDO', 'CRONICO', 'RESCATE', 'PRN', 'PROFILACTICO', 'OTRO'])
  medicationType?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() warnings?: string;
}

export class WarningSignItemDto {
  @IsOptional() @IsString() sign?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'LEVE', 'MODERADA', 'GRAVE', 'URGENTE'])
  severity?: string;
}

export class EducationalMaterialItemDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() attachmentId?: string;
}

/// Entrada de guardado de Borrador para Receta e indicaciones (regla 0.4: todo opcional).
export class SavePrescriptionDraftDto {
  @IsOptional() @IsDateString() recordedAt?: string;

  // 6. Encabezado de receta — V1: solo ORDINARIA/OTRA habilitados (spec 4.6).
  @IsOptional() @IsIn(['ORDINARIA', 'OTRA']) prescriptionType?: string;
  @IsOptional() @IsString() validityOption?: string;
  @IsOptional() @IsDateString() validityExpiresAt?: string;

  // 7. Diagnóstico asociado
  @IsOptional() @IsString() primaryDiagnosisCode?: string;
  @IsOptional() @IsString() primaryDiagnosisDescription?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisItemDto)
  secondaryDiagnoses?: DiagnosisItemDto[];

  // 8. Indicaciones generales (campo único consolidado)
  @IsOptional() @IsString() generalInstructions?: string;

  // 9. Prescripción farmacológica
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionMedicationItemDto)
  medications?: PrescriptionMedicationItemDto[];

  // 10. Confirmación/justificación de alertas críticas ignoradas
  @IsOptional() @IsBoolean() criticalAlertAcknowledged?: boolean;
  @IsOptional() @IsString() criticalAlertJustification?: string;

  // 11. Signos de alarma
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WarningSignItemDto)
  warningSigns?: WarningSignItemDto[];

  // 12/14. Próxima cita (fuente única de verdad)
  @IsOptional() @IsDateString() nextAppointmentDate?: string;

  // 13. Educación al paciente
  @IsOptional() @IsString() educationInfoProvided?: string;
  @IsOptional() @IsString() educationNonPharmacological?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'COMPRENDE_Y_ACEPTA', 'COMPRENDE_PARCIALMENTE', 'NO_COMPRENDE', 'RECHAZA'])
  patientComprehension?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationalMaterialItemDto)
  educationalMaterials?: EducationalMaterialItemDto[];

  // 14. Plan de seguimiento
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'CONSULTA_PRESENCIAL', 'TELECONSULTA', 'LLAMADA', 'SEGUIMIENTO_RESULTADOS', 'REFERENCIA_INTERCONSULTA', 'URGENCIAS_SI_EMPEORA', 'OTRO'])
  followUpType?: string;
  @IsOptional() @IsString() followUpInstructions?: string;
}
