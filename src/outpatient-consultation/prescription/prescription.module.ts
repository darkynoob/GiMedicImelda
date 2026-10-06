import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OutpatientConsultationModule } from '../outpatient-consultation.module';
import { PrescriptionController } from './presentation/prescription.controller';
import { PrescriptionService } from './application/services/prescription.service';

/// Fase 4 del plan Episodio/Consulta: Receta e indicaciones (solo episodios OUTPATIENT).
@Module({
  imports: [AuthModule, OutpatientConsultationModule],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
})
export class PrescriptionModule {}
