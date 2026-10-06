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
import {
  DiagnosisItemDto,
  MedicationOrderItemDto,
} from '../../../shared/dto/clinical-item.dto';

const stateOptions = ['', 'SIN_ESPECIFICAR', 'NORMAL', 'ALTERADO'];
const evolutionTimeUnits = ['HORAS', 'DIAS', 'SEMANAS', 'MESES', 'ANIOS'];
const adherenceOptions = [
  '',
  'SIN_ESPECIFICAR',
  'ADECUADA',
  'PARCIAL',
  'INADECUADA',
  'NO_APLICA',
];

/// Entrada de guardado de Borrador para Consulta actual. Todos los campos opcionales (regla 0.4).
export class SaveConsultationNoteDraftDto {
  @IsOptional() @IsDateString() recordedAt?: string;

  // 4. Contexto de la consulta
  @IsOptional() @IsString() chiefComplaint?: string;
  @IsOptional() @IsString() secondaryComplaint?: string;
  @IsOptional() @IsInt() @Min(0) evolutionTimeValue?: number;
  @IsOptional() @IsIn(evolutionTimeUnits) evolutionTimeUnit?: string;

  // 5. Padecimiento actual
  @IsOptional() @IsDateString() currentIllnessOnsetDate?: string;
  @IsOptional()
  @IsIn([
    '',
    'SIN_ESPECIFICAR',
    'AGUDO',
    'SUBAGUDO',
    'CRONICO',
    'INTERMITENTE',
    'RECURRENTE',
    'PROGRESIVO',
    'SUBITO',
  ])
  currentIllnessEvolutionType?: string;
  @IsOptional() @IsString() currentIllnessDescription?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10) currentIllnessEvaIntensity?: number;
  @IsOptional() @IsString() currentIllnessLocation?: string;
  @IsOptional() @IsString() currentIllnessIrradiation?: string;
  @IsOptional() @IsString() currentIllnessAssociatedSymptoms?: string;
  @IsOptional() @IsString() currentIllnessAggravatingFactors?: string;
  @IsOptional() @IsString() currentIllnessRelievingFactors?: string;
  @IsOptional() @IsString() currentIllnessPriorTreatments?: string;

  // 7. Signos vitales
  @IsOptional() @IsInt() vitalSystolicBp?: number;
  @IsOptional() @IsInt() vitalDiastolicBp?: number;
  @IsOptional() @IsInt() vitalHeartRate?: number;
  @IsOptional() @IsInt() vitalRespiratoryRate?: number;
  @IsOptional() @IsNumber() vitalTemperatureC?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) vitalOxygenSaturation?: number;
  @IsOptional() @IsNumber() vitalWeightKg?: number;
  @IsOptional() @IsNumber() vitalHeightCm?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) vitalEva?: number;
  @IsOptional() @IsNumber() vitalGlucose?: number;
  @IsOptional() @IsBoolean() vitalIrregularRhythm?: boolean;

  // 8. Exploración física por aparatos
  @IsOptional() @IsString() examGeneralState?: string;
  @IsOptional() @IsIn(stateOptions) examHeadStatus?: string;
  @IsOptional() @IsString() examHeadDetail?: string;
  @IsOptional() @IsIn(stateOptions) examNeckStatus?: string;
  @IsOptional() @IsString() examNeckDetail?: string;
  @IsOptional() @IsIn(stateOptions) examCardiovascularStatus?: string;
  @IsOptional() @IsString() examCardiovascularDetail?: string;
  @IsOptional() @IsIn(stateOptions) examRespiratoryStatus?: string;
  @IsOptional() @IsString() examRespiratoryDetail?: string;
  @IsOptional() @IsIn(stateOptions) examAbdomenStatus?: string;
  @IsOptional() @IsString() examAbdomenDetail?: string;
  @IsOptional() @IsIn(stateOptions) examGenitourinaryStatus?: string;
  @IsOptional() @IsString() examGenitourinaryDetail?: string;
  @IsOptional() @IsIn(stateOptions) examExtremitiesStatus?: string;
  @IsOptional() @IsString() examExtremitiesDetail?: string;
  @IsOptional() @IsIn(stateOptions) examNeurologicalStatus?: string;
  @IsOptional() @IsString() examNeurologicalDetail?: string;
  @IsOptional() @IsIn(stateOptions) examSkinStatus?: string;
  @IsOptional() @IsString() examSkinDetail?: string;
  @IsOptional() @IsIn(stateOptions) examLymphaticStatus?: string;
  @IsOptional() @IsString() examLymphaticDetail?: string;

  // 9. Resultados previos
  @IsOptional() @IsString() priorResultsSummary?: string;

  // 10. Impresión diagnóstica actual
  @IsOptional() @IsString() primaryDiagnosisCode?: string;
  @IsOptional() @IsString() primaryDiagnosisDescription?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'PRESUNTIVO', 'DEFINITIVO', 'SINDROMATICO', 'NOSOLOGICO'])
  primaryDiagnosisType?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'ACTIVO', 'CONTROLADO', 'RESUELTO', 'EN_SEGUIMIENTO'])
  primaryDiagnosisStatus?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisItemDto)
  secondaryDiagnoses?: DiagnosisItemDto[];

  // 11. Plan terapéutico
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationOrderItemDto)
  pharmacologicalTreatment?: MedicationOrderItemDto[];
  @IsOptional() @IsString() nonPharmacologicalTreatment?: string;
  @IsOptional() @IsString() plannedStudies?: string;
  @IsOptional() @IsString() plannedReferrals?: string;
  @IsOptional() @IsString() plannedConsultations?: string;
  @IsOptional() @IsInt() @Min(0) disabilityDays?: number;
  @IsOptional() @IsDateString() disabilityFrom?: string;
  @IsOptional() @IsDateString() disabilityTo?: string;
  @IsOptional() @IsString() disabilityReason?: string;
  @IsOptional() @IsString() prognosis?: string;
  @IsOptional() @IsDateString() followUpDate?: string;

  // 12. Información y aceptación durante la consulta
  @IsOptional() @IsBoolean() consentCurrent?: boolean;
  @IsOptional() @IsString() consentExplanation?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'COMPRENDE_Y_ACEPTA', 'COMPRENDE_PARCIALMENTE', 'NO_COMPRENDE', 'RECHAZA'])
  consentComprehension?: string;

  // 13. Hallazgos de riesgo
  @IsOptional() @IsBoolean() riskSuddenSevereHeadache?: boolean;
  @IsOptional() @IsBoolean() riskFocalNeuroDeficit?: boolean;
  @IsOptional() @IsBoolean() riskVisionLoss?: boolean;
  @IsOptional() @IsBoolean() riskChestPain?: boolean;
  @IsOptional() @IsBoolean() riskDyspnea?: boolean;
  @IsOptional() @IsBoolean() riskHighFever?: boolean;
  @IsOptional() @IsBoolean() riskUnexplainedWeightLoss?: boolean;
  @IsOptional() @IsBoolean() riskActiveBleeding?: boolean;
  @IsOptional() @IsBoolean() riskAlteredConsciousness?: boolean;
  @IsOptional() @IsString() riskFindingsNotes?: string;

  // 14. Impacto funcional
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'CONSERVADA', 'LIMITACION_LEVE', 'LIMITACION_MODERADA', 'LIMITACION_SEVERA', 'DEPENDENCIA'])
  functionalCapacity?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'LEVE', 'MODERADO', 'SEVERO'])
  functionalImpact?: string;
  @IsOptional() @IsString() functionalDescription?: string;

  // 15. Adherencia
  @IsOptional() @IsIn(adherenceOptions) pharmacologicalAdherence?: string;
  @IsOptional() @IsIn(adherenceOptions) nonPharmacologicalAdherence?: string;
  @IsOptional() @IsString() adherenceNotes?: string;
}
