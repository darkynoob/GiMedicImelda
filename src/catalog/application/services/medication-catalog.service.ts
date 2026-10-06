import { Inject, Injectable } from '@nestjs/common';
import { MEDICATIONCATALOGENTRY_REPOSITORY } from '../../../shared/persistence/tokens/medicationCatalogEntry.token';
import type { MedicationCatalogEntryRepository } from '../../../shared/persistence/repositories/medicationCatalogEntry.repository';
import type { CatalogSearchQueryDto } from '../dto/catalog-search-query.dto';
import type { MedicationCatalogEntryResponse } from '../dto/catalog-entry.response';

const DEFAULT_LIMIT = 20;

/// Búsqueda/autocomplete sobre el catálogo básico de medicamentos (regla 0.7/0.8).
@Injectable()
export class MedicationCatalogService {
  constructor(
    @Inject(MEDICATIONCATALOGENTRY_REPOSITORY)
    private readonly medicationCatalogRepository: MedicationCatalogEntryRepository,
  ) {}

  async search(
    query: CatalogSearchQueryDto,
  ): Promise<MedicationCatalogEntryResponse[]> {
    const term = query.q?.trim();
    const limit = query.limit ?? DEFAULT_LIMIT;
    const includeInactive = query.includeInactive === 'true';

    const entries = await this.medicationCatalogRepository.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { activeIngredient: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      activeIngredient: entry.activeIngredient,
      presentation: entry.presentation,
      defaultRoute: entry.defaultRoute,
    }));
  }
}
