import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

/// Diagnóstico estructurado reutilizado por Historia clínica, Consulta actual, Evolución y
/// Receta (regla 0.7): siempre código + descripción desde el catálogo CIE-10, nunca texto libre.
export class DiagnosisItemDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional()
  @IsIn(['PRESUNTIVO', 'DEFINITIVO', 'SINDROMATICO', 'NOSOLOGICO'])
  diagnosisType?: string;
  @IsOptional() @IsString() status?: string;
}

/// Medicamento estructurado reutilizado por los tabs con prescripción/tratamiento (regla 0.7).
export class MedicationOrderItemDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() medication?: string;
  @IsOptional() @IsNumber() dose?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsString() indication?: string;
  @IsOptional() @IsString() notes?: string;
}

export class PriorStudyItemDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() studyType?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsString() interpretation?: string;
}
