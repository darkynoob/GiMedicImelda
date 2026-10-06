import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OutpatientConsultationModule } from '../outpatient-consultation.module';
import { DocumentController } from './presentation/document.controller';
import { DocumentService } from './application/services/document.service';

/// Fase 5 del plan Episodio/Consulta: Documentos (solo episodios OUTPATIENT). Reutiliza
/// ClinicalDocument/DocumentVersion/DocumentType ya existentes en vez de crear modelos nuevos.
@Module({
  imports: [AuthModule, OutpatientConsultationModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class OutpatientDocumentsModule {}
