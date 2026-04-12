import { SexAtBirth } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const PHONE_REGEX = /^[\d\s\-+()]{7,20}$/;

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

const booleanValue = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  return value;
};

class UpdateResponsibleContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  relationship?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Transform(trimValue)
  @Matches(PHONE_REGEX, { message: 'Telefono del responsable invalido' })
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(trimToUndefined)
  @Matches(PHONE_REGEX, {
    message: 'Telefono alterno del responsable invalido',
  })
  alternatePhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  @Transform(trimToUndefined)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  legalRepresentationType?: string;

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
  @MaxLength(500)
  @Transform(trimToUndefined)
  notes?: string;
}

class UpdateCoverageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Transform(trimValue)
  coverageType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  providerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  planName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  policyNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  membershipNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  insuredPersonName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  relationshipToInsured?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanValue)
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimToUndefined)
  authorizationNotes?: string;
}

class UpdatePatientDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Transform(trimValue)
  documentType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  documentNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  issuedBy?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanValue)
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimToUndefined)
  notes?: string;
}

class UpdateAllergyItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  substance!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  reaction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  severity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  status?: string;
}

class UpdateProblemItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  @Transform(trimValue)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  status?: string;
}

class UpdateClinicalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  organDonorStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  pregnancyStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimToUndefined)
  disabilityNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  @Transform(trimToUndefined)
  clinicalAlerts?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  @Transform(trimToUndefined)
  chronicConditionsNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  @Transform(trimToUndefined)
  currentMedicationsNotes?: string;
}

class UpdateDemographicProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  preferredName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  genderIdentity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  preferredPronouns?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  countryOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  stateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  ethnicGroup?: string;
}

/**
 * Keeps patient-profile editing isolated from the create flow so we can evolve
 * both contracts independently without regressing admission.
 */
export class UpdatePatientDto {
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
  @Matches(CURP_REGEX, { message: 'CURP invalido' })
  curp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(trimToUndefined)
  @Matches(PHONE_REGEX, { message: 'Telefono invalido' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(trimToUndefined)
  @Matches(PHONE_REGEX, { message: 'Telefono alterno invalido' })
  alternatePhone?: string;

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
  @MaxLength(80)
  @Transform(trimToUndefined)
  municipality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  exteriorNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimToUndefined)
  interiorNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(trimToUndefined)
  @Matches(PHONE_REGEX, { message: 'Telefono de emergencia invalido' })
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  emergencyContactRelation?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(trimValue)
  patientStatus!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Transform(trimValue)
  patientType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimValue)
  medicalUnit!: string;

  @IsBoolean()
  @Transform(booleanValue)
  hasKnownAllergies!: boolean;

  @ValidateIf((input: UpdatePatientDto) => input.hasKnownAllergies === true)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(trimValue)
  allergiesNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimToUndefined)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  educationLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  religion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  primaryLanguage?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanValue)
  requiresTranslator?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimToUndefined)
  registrationSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimToUndefined)
  administrativeNotes?: string;

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
  @ValidateNested()
  @Type(() => UpdateResponsibleContactDto)
  responsibleContact?: UpdateResponsibleContactDto;

  @IsOptional()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => UpdateCoverageDto)
  coverages?: UpdateCoverageDto[];

  @IsOptional()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => UpdatePatientDocumentDto)
  documents?: UpdatePatientDocumentDto[];

  @IsOptional()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => UpdateAllergyItemDto)
  allergies?: UpdateAllergyItemDto[];

  @IsOptional()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => UpdateProblemItemDto)
  problems?: UpdateProblemItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateClinicalProfileDto)
  clinicalProfile?: UpdateClinicalProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDemographicProfileDto)
  demographicProfile?: UpdateDemographicProfileDto;
}
