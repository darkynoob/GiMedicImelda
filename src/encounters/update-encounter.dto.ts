import {
  AdmissionSource,
  EncounterStatus,
  EncounterType,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export class UpdateEncounterDto {
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  serviceAreaId?: string;

  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @IsOptional()
  @IsUUID()
  attendingUserId?: string;

  @IsOptional()
  @IsEnum(EncounterType)
  encounterType?: EncounterType;

  @IsOptional()
  @IsEnum(EncounterStatus)
  status?: EncounterStatus;

  @IsOptional()
  @IsEnum(AdmissionSource)
  admissionSource?: AdmissionSource;

  @IsOptional()
  @IsDateString()
  openedAt?: string;

  @IsOptional()
  @IsDateString()
  closedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimToUndefined)
  reasonForVisit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trimToUndefined)
  notes?: string;

  @IsOptional()
  @IsObject()
  structuredSections?: Record<string, unknown>;
}
