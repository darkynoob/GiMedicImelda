import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OutpatientConsultationModule } from '../outpatient-consultation.module';
import { EvolutionNoteController } from './presentation/evolution-note.controller';
import { EvolutionNoteService } from './application/services/evolution-note.service';

/// Fase 3 del plan Episodio/Consulta: Evolución (solo episodios OUTPATIENT).
@Module({
  imports: [AuthModule, OutpatientConsultationModule],
  controllers: [EvolutionNoteController],
  providers: [EvolutionNoteService],
})
export class EvolutionNoteModule {}
