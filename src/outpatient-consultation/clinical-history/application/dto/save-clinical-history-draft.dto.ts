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
  PriorStudyItemDto,
  SecondaryDiagnosisItemDto,
  TreatmentMedicationItemDto,
} from './clinical-history-items.dto';

const stateOptions = ['', 'SIN_ESPECIFICAR', 'NORMAL', 'ALTERADO'];
const consumptionOptions = ['', 'SIN_ESPECIFICAR', 'NO', 'ACTUAL', 'PREVIO', 'OCASIONAL'];

/// Entrada de guardado de Borrador para Historia clínica. Todos los campos son opcionales
/// porque un Borrador puede guardarse de forma incremental (regla 0.4).
export class SaveClinicalHistoryDraftDto {
  @IsOptional() @IsDateString() recordedAt?: string;

  // 5. Padecimiento actual
  @IsOptional() @IsString() currentIllness?: string;

  // 6. Antecedentes heredofamiliares
  @IsOptional() @IsBoolean() familyHistoryDiabetes?: boolean;
  @IsOptional() @IsBoolean() familyHistoryHypertension?: boolean;
  @IsOptional() @IsBoolean() familyHistoryCancer?: boolean;
  @IsOptional() @IsBoolean() familyHistoryHeartDisease?: boolean;
  @IsOptional() @IsBoolean() familyHistoryStroke?: boolean;
  @IsOptional() @IsBoolean() familyHistoryKidneyDisease?: boolean;
  @IsOptional() @IsBoolean() familyHistoryAutoimmune?: boolean;
  @IsOptional() @IsBoolean() familyHistoryPsychiatric?: boolean;
  @IsOptional() @IsBoolean() familyHistoryOther?: boolean;
  @IsOptional() @IsString() familyHistoryOtherDetail?: string;
  @IsOptional() @IsString() familyHistoryNotes?: string;

  // 7. Antecedentes personales patológicos
  @IsOptional() @IsString() personalPathologicalChronicDiseases?: string;
  @IsOptional() @IsString() personalPathologicalSurgical?: string;
  @IsOptional() @IsString() personalPathologicalHospitalizations?: string;
  @IsOptional() @IsString() personalPathologicalTraumatic?: string;
  @IsOptional() @IsString() personalPathologicalTransfusional?: string;
  @IsOptional() @IsString() personalPathologicalInfectious?: string;

  // 9. Antecedentes personales no patológicos
  @IsOptional() @IsString() nonPathologicalDiet?: string;
  @IsOptional() @IsString() nonPathologicalPhysicalActivity?: string;
  @IsOptional() @IsIn(consumptionOptions) nonPathologicalSmoking?: string;
  @IsOptional() @IsString() nonPathologicalSmokingDetail?: string;
  @IsOptional() @IsIn(consumptionOptions) nonPathologicalAlcohol?: string;
  @IsOptional() @IsString() nonPathologicalAlcoholDetail?: string;
  @IsOptional() @IsIn(consumptionOptions) nonPathologicalSubstances?: string;
  @IsOptional() @IsString() nonPathologicalSubstancesDetail?: string;
  @IsOptional() @IsString() nonPathologicalHousing?: string;
  @IsOptional() @IsString() nonPathologicalHygiene?: string;
  @IsOptional() @IsString() nonPathologicalImmunizations?: string;

  // 10. Antecedentes gineco-obstétricos
  @IsOptional() @IsInt() @Min(0) @Max(25) gynecoMenarche?: number;
  @IsOptional() @IsString() gynecoMenstrualRhythm?: string;
  @IsOptional() @IsString() gynecoMenstrualRhythmDetail?: string;
  @IsOptional() @IsDateString() gynecoLastMenstrualPeriod?: string;
  @IsOptional() @IsInt() @Min(0) @Max(80) gynecoSexualActivityOnsetAge?: number;
  @IsOptional() @IsInt() @Min(0) gynecoPregnancies?: number;
  @IsOptional() @IsInt() @Min(0) gynecoBirths?: number;
  @IsOptional() @IsInt() @Min(0) gynecoMiscarriages?: number;
  @IsOptional() @IsInt() @Min(0) gynecoCSections?: number;
  @IsOptional() @IsString() gynecoFamilyPlanningMethod?: string;
  @IsOptional() @IsString() gynecoFamilyPlanningDetail?: string;
  @IsOptional() @IsDateString() gynecoMammographyDate?: string;
  @IsOptional() @IsString() gynecoMammographyResult?: string;
  @IsOptional() @IsString() gynecoMenopauseStatus?: string;
  @IsOptional() @IsString() gynecoMenopauseAgeOrDate?: string;

  // 12. Interrogatorio por aparatos y sistemas
  @IsOptional() @IsIn(stateOptions) reviewCardiovascularStatus?: string;
  @IsOptional() @IsString() reviewCardiovascularDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewRespiratoryStatus?: string;
  @IsOptional() @IsString() reviewRespiratoryDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewDigestiveStatus?: string;
  @IsOptional() @IsString() reviewDigestiveDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewGenitourinaryStatus?: string;
  @IsOptional() @IsString() reviewGenitourinaryDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewMusculoskeletalStatus?: string;
  @IsOptional() @IsString() reviewMusculoskeletalDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewNervousStatus?: string;
  @IsOptional() @IsString() reviewNervousDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewEndocrineStatus?: string;
  @IsOptional() @IsString() reviewEndocrineDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewSkinStatus?: string;
  @IsOptional() @IsString() reviewSkinDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewHematologicStatus?: string;
  @IsOptional() @IsString() reviewHematologicDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewOphthalmologicStatus?: string;
  @IsOptional() @IsString() reviewOphthalmologicDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewEntStatus?: string;
  @IsOptional() @IsString() reviewEntDetail?: string;
  @IsOptional() @IsIn(stateOptions) reviewPsychiatricStatus?: string;
  @IsOptional() @IsString() reviewPsychiatricDetail?: string;

  // 13. Exploración física
  @IsOptional() @IsNumber() vitalTemperatureC?: number;
  @IsOptional() @IsInt() vitalSystolicBp?: number;
  @IsOptional() @IsInt() vitalDiastolicBp?: number;
  @IsOptional() @IsInt() vitalHeartRate?: number;
  @IsOptional() @IsInt() vitalRespiratoryRate?: number;
  @IsOptional() @IsNumber() vitalWeightKg?: number;
  @IsOptional() @IsNumber() vitalHeightCm?: number;
  @IsOptional() @IsString() physicalExamGeneralAppearance?: string;
  @IsOptional() @IsString() physicalExamHead?: string;
  @IsOptional() @IsString() physicalExamNeck?: string;
  @IsOptional() @IsString() physicalExamChest?: string;
  @IsOptional() @IsString() physicalExamAbdomen?: string;
  @IsOptional() @IsString() physicalExamExtremities?: string;
  @IsOptional() @IsString() physicalExamGenitals?: string;
  @IsOptional() @IsString() physicalExamOtherFindings?: string;

  // 14. Diagnósticos iniciales
  @IsOptional() @IsString() primaryDiagnosisCode?: string;
  @IsOptional() @IsString() primaryDiagnosisDescription?: string;
  @IsOptional()
  @IsIn(['PRESUNTIVO', 'DEFINITIVO', 'SINDROMATICO', 'NOSOLOGICO'])
  primaryDiagnosisType?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecondaryDiagnosisItemDto)
  secondaryDiagnoses?: SecondaryDiagnosisItemDto[];

  // 15. Estudios previos
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriorStudyItemDto)
  priorStudies?: PriorStudyItemDto[];
  @IsOptional() @IsString() priorStudiesSummary?: string;

  // 16/17. Tratamiento farmacológico y medicación crónica
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentMedicationItemDto)
  currentTreatmentMedications?: TreatmentMedicationItemDto[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentMedicationItemDto)
  chronicMedications?: TreatmentMedicationItemDto[];

  // 18. No farmacológico / seguimiento / pronóstico
  @IsOptional() @IsString() nonPharmacologicalTreatment?: string;
  @IsOptional() @IsString() followUpPlan?: string;
  @IsOptional() @IsString() prognosis?: string;

  // 19. Apego terapéutico
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'ADECUADO', 'PARCIAL', 'INADECUADO'])
  pharmacologicalAdherence?: string;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'ADECUADO', 'PARCIAL', 'INADECUADO'])
  nonPharmacologicalAdherence?: string;
  @IsOptional() @IsString() adherenceNotes?: string;

  // 20. Factores de riesgo
  @IsOptional() @IsBoolean() riskFactorSmoking?: boolean;
  @IsOptional() @IsBoolean() riskFactorAlcohol?: boolean;
  @IsOptional() @IsBoolean() riskFactorSedentary?: boolean;
  @IsOptional() @IsBoolean() riskFactorObesity?: boolean;
  @IsOptional() @IsBoolean() riskFactorDiet?: boolean;
  @IsOptional() @IsBoolean() riskFactorStress?: boolean;
  @IsOptional() @IsBoolean() riskFactorCardiovascularHistory?: boolean;
  @IsOptional() @IsBoolean() riskFactorSubstanceUse?: boolean;
  @IsOptional()
  @IsIn(['', 'SIN_ESPECIFICAR', 'BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO'])
  riskFactorClassification?: string;
  @IsOptional() @IsString() riskFactorNotes?: string;
}
