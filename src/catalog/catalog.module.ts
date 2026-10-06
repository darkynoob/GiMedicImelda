import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogController } from './presentation/catalog.controller';
import { IcdCatalogService } from './application/services/icd-catalog.service';
import { MedicationCatalogService } from './application/services/medication-catalog.service';

/// Catálogos clínicos compartidos (CIE-10, medicamentos) — regla 0.7/0.8 del plan Episodio/Consulta.
@Module({
  imports: [AuthModule],
  controllers: [CatalogController],
  providers: [IcdCatalogService, MedicationCatalogService],
  exports: [IcdCatalogService, MedicationCatalogService],
})
export class CatalogModule {}
