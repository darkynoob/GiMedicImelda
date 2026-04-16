import { EncounterRecordStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export class EncounterSectionRecordMutationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimToUndefined)
  tabKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimToUndefined)
  noteType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Transform(trimToUndefined)
  title?: string;

  @IsOptional()
  @IsEnum(EncounterRecordStatus)
  status?: EncounterRecordStatus;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsObject()
  formData!: Record<string, unknown>;
}
