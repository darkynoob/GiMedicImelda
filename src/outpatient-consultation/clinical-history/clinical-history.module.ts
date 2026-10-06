import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OutpatientConsultationModule } from '../outpatient-consultation.module';
import { ClinicalHistoryController } from './presentation/clinical-history.controller';
import { ClinicalHistoryService } from './application/services/clinical-history.service';

/// Fase 1 del plan Episodio/Consulta: Historia clínica (solo episodios OUTPATIENT).
@Module({
  imports: [AuthModule, OutpatientConsultationModule],
  controllers: [ClinicalHistoryController],
  providers: [ClinicalHistoryService],
})
export class ClinicalHistoryModule {}
