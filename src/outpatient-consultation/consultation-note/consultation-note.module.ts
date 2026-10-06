import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OutpatientConsultationModule } from '../outpatient-consultation.module';
import { ConsultationNoteController } from './presentation/consultation-note.controller';
import { ConsultationNoteService } from './application/services/consultation-note.service';

/// Fase 2 del plan Episodio/Consulta: Consulta actual (solo episodios OUTPATIENT).
@Module({
  imports: [AuthModule, OutpatientConsultationModule],
  controllers: [ConsultationNoteController],
  providers: [ConsultationNoteService],
})
export class ConsultationNoteModule {}
