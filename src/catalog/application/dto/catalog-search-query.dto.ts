import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/// Query de búsqueda/autocomplete compartida por los catálogos clínicos (CIE-10, medicamentos).
export class CatalogSearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsIn(['true', 'false'])
  includeInactive?: string;
}
