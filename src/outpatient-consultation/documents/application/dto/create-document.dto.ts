import { IsIn } from 'class-validator';
import { OUTPATIENT_DOCUMENT_TYPES, SaveDocumentContentDto } from './save-document-content.dto';

/// Entrada para crear un documento nuevo: fija el tipo documental (read-only después, spec 5.4).
export class CreateDocumentDto extends SaveDocumentContentDto {
  @IsIn(OUTPATIENT_DOCUMENT_TYPES)
  documentTypeCode!: string;
}
