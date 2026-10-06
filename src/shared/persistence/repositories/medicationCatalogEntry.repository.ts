import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { MedicationCatalogEntryModel } from '../models/medicationCatalogEntry.model';
import type { IBaseRepository } from './base.repository';

export interface MedicationCatalogEntryRepository extends IBaseRepository<
  MedicationCatalogEntryModel,
  Prisma.MedicationCatalogEntryCreateInput,
  Prisma.MedicationCatalogEntryUpdateInput,
  Prisma.MedicationCatalogEntryFindManyArgs,
  Prisma.MedicationCatalogEntryCountArgs,
  Prisma.MedicationCatalogEntryUpsertArgs
> {
  createMany(
    data: Prisma.MedicationCatalogEntryCreateManyInput[],
  ): Promise<number>;
}

@Injectable()
export class PrismaMedicationCatalogEntryRepository
  implements MedicationCatalogEntryRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MedicationCatalogEntryModel | null> {
    return this.prisma.medicationCatalogEntry.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.MedicationCatalogEntryFindManyArgs,
  ): Promise<MedicationCatalogEntryModel[]> {
    return this.prisma.medicationCatalogEntry.findMany(args);
  }

  count(args?: Prisma.MedicationCatalogEntryCountArgs): Promise<number> {
    return this.prisma.medicationCatalogEntry.count(args);
  }

  create(
    data: Prisma.MedicationCatalogEntryCreateInput,
  ): Promise<MedicationCatalogEntryModel> {
    return this.prisma.medicationCatalogEntry.create({ data });
  }

  async createMany(
    data: Prisma.MedicationCatalogEntryCreateManyInput[],
  ): Promise<number> {
    const result = await this.prisma.medicationCatalogEntry.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  update(
    id: string,
    data: Prisma.MedicationCatalogEntryUpdateInput,
  ): Promise<MedicationCatalogEntryModel> {
    return this.prisma.medicationCatalogEntry.update({ where: { id }, data });
  }

  delete(id: string): Promise<MedicationCatalogEntryModel> {
    return this.prisma.medicationCatalogEntry.delete({ where: { id } });
  }

  upsert(
    args: Prisma.MedicationCatalogEntryUpsertArgs,
  ): Promise<MedicationCatalogEntryModel> {
    return this.prisma.medicationCatalogEntry.upsert(args);
  }
}
