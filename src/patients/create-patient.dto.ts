import { SexAtBirth } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const trimUppercaseToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim().toUpperCase();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  middleName?: string;

  @IsEnum(SexAtBirth)
  sexAtBirth!: SexAtBirth;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  ageSnapshot?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(trimUppercaseToUndefined)
  bloodType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  @Transform(trimUppercaseToUndefined)
  curp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(trimToUndefined)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  @Transform(trimToUndefined)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(trimToUndefined)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(trimToUndefined)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(trimToUndefined)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Transform(trimUppercaseToUndefined)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(trimToUndefined)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  externalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(trimUppercaseToUndefined)
  identifierType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  identifierValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimUppercaseToUndefined)
  recordNumber?: string;

  @IsOptional()
  @IsUUID()
  facilityId?: string;
}
