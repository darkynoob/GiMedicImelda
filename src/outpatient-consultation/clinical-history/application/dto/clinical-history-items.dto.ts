import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  DiagnosisItemDto,
  MedicationOrderItemDto,
  PriorStudyItemDto,
} from '../../../shared/dto/clinical-item.dto';

export { PriorStudyItemDto };
/// Alias locales para no romper los nombres ya usados en este módulo.
export { MedicationOrderItemDto as TreatmentMedicationItemDto };
export { DiagnosisItemDto as SecondaryDiagnosisItemDto };

/// Grupo de campos repetibles usado tanto en createInitialDraft como en updates.
export class ClinicalHistoryItemsDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PriorStudyItemDto)
  priorStudies?: PriorStudyItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MedicationOrderItemDto)
  currentTreatmentMedications?: MedicationOrderItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MedicationOrderItemDto)
  chronicMedications?: MedicationOrderItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisItemDto)
  secondaryDiagnoses?: DiagnosisItemDto[];
}
