import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SignEncounterRecordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Transform(trimValue)
  password!: string;
}
