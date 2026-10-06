import { Inject, Injectable } from '@nestjs/common';
import { ICDCATALOGENTRY_REPOSITORY } from '../../../shared/persistence/tokens/icdCatalogEntry.token';
import type { IcdCatalogEntryRepository } from '../../../shared/persistence/repositories/icdCatalogEntry.repository';
import type { CatalogSearchQueryDto } from '../dto/catalog-search-query.dto';
import type { IcdCatalogEntryResponse } from '../dto/catalog-entry.response';

const DEFAULT_LIMIT = 20;

/// Búsqueda/autocomplete sobre el catálogo CIE-10 (regla 0.7/0.8: catálogo controlado compartido).
@Injectable()
export class IcdCatalogService {
  constructor(
    @Inject(ICDCATALOGENTRY_REPOSITORY)
    private readonly icdCatalogRepository: IcdCatalogEntryRepository,
  ) {}

  async search(query: CatalogSearchQueryDto): Promise<IcdCatalogEntryResponse[]> {
    const term = query.q?.trim();
    const limit = query.limit ?? DEFAULT_LIMIT;
    const includeInactive = query.includeInactive === 'true';

    const entries = await this.icdCatalogRepository.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(term
          ? {
              OR: [
                { code: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { code: 'asc' },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      code: entry.code,
      description: entry.description,
      chapter: entry.chapter,
    }));
  }

  async findByCode(code: string): Promise<IcdCatalogEntryResponse | null> {
    const entry = await this.icdCatalogRepository.findByCode(code);
    if (!entry) return null;

    return {
      id: entry.id,
      code: entry.code,
      description: entry.description,
      chapter: entry.chapter,
    };
  }
}
