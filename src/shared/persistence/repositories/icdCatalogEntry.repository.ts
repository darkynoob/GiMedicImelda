import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { IcdCatalogEntryModel } from '../models/icdCatalogEntry.model';
import type { IBaseRepository } from './base.repository';

export interface IcdCatalogEntryRepository extends IBaseRepository<
  IcdCatalogEntryModel,
  Prisma.IcdCatalogEntryCreateInput,
  Prisma.IcdCatalogEntryUpdateInput,
  Prisma.IcdCatalogEntryFindManyArgs,
  Prisma.IcdCatalogEntryCountArgs,
  Prisma.IcdCatalogEntryUpsertArgs
> {
  findByCode(code: string): Promise<IcdCatalogEntryModel | null>;
  createMany(data: Prisma.IcdCatalogEntryCreateManyInput[]): Promise<number>;
}

@Injectable()
export class PrismaIcdCatalogEntryRepository
  implements IcdCatalogEntryRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<IcdCatalogEntryModel | null> {
    return this.prisma.icdCatalogEntry.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<IcdCatalogEntryModel | null> {
    return this.prisma.icdCatalogEntry.findUnique({ where: { code } });
  }

  findMany(
    args?: Prisma.IcdCatalogEntryFindManyArgs,
  ): Promise<IcdCatalogEntryModel[]> {
    return this.prisma.icdCatalogEntry.findMany(args);
  }

  count(args?: Prisma.IcdCatalogEntryCountArgs): Promise<number> {
    return this.prisma.icdCatalogEntry.count(args);
  }

  create(data: Prisma.IcdCatalogEntryCreateInput): Promise<IcdCatalogEntryModel> {
    return this.prisma.icdCatalogEntry.create({ data });
  }

  async createMany(
    data: Prisma.IcdCatalogEntryCreateManyInput[],
  ): Promise<number> {
    const result = await this.prisma.icdCatalogEntry.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  update(
    id: string,
    data: Prisma.IcdCatalogEntryUpdateInput,
  ): Promise<IcdCatalogEntryModel> {
    return this.prisma.icdCatalogEntry.update({ where: { id }, data });
  }

  delete(id: string): Promise<IcdCatalogEntryModel> {
    return this.prisma.icdCatalogEntry.delete({ where: { id } });
  }

  upsert(
    args: Prisma.IcdCatalogEntryUpsertArgs,
  ): Promise<IcdCatalogEntryModel> {
    return this.prisma.icdCatalogEntry.upsert(args);
  }
}
