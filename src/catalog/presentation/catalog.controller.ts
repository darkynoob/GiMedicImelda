import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CatalogSearchQueryDto } from '../application/dto/catalog-search-query.dto';
import { IcdCatalogService } from '../application/services/icd-catalog.service';
import { MedicationCatalogService } from '../application/services/medication-catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(
    private readonly icdCatalogService: IcdCatalogService,
    private readonly medicationCatalogService: MedicationCatalogService,
  ) {}

  @Get('cie10')
  searchIcd10(@Query() query: CatalogSearchQueryDto) {
    return this.icdCatalogService.search(query);
  }

  @Get('medications')
  searchMedications(@Query() query: CatalogSearchQueryDto) {
    return this.medicationCatalogService.search(query);
  }
}
