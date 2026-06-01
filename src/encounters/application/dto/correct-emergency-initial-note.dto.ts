import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export class CorrectEmergencyInitialNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimToUndefined)
  reason?: string;
}
