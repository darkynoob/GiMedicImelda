import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { EpisodeSummaryController } from './presentation/episode-summary.controller';
import { EpisodeSummaryService } from './application/services/episode-summary.service';

/// Fase 6 del plan Episodio/Consulta: Resumen (vista ejecutiva de solo lectura, OUTPATIENT).
@Module({
  imports: [AuthModule],
  controllers: [EpisodeSummaryController],
  providers: [EpisodeSummaryService],
})
export class EpisodeSummaryModule {}
