import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DocumentStatusHistoryModel } from '../models/documentStatusHistory.model';
import type { IBaseRepository } from './base.repository';

export interface DocumentStatusHistoryRepository extends IBaseRepository<
  DocumentStatusHistoryModel,
  Prisma.DocumentStatusHistoryCreateInput,
  Prisma.DocumentStatusHistoryUpdateInput,
  Prisma.DocumentStatusHistoryFindManyArgs,
  Prisma.DocumentStatusHistoryCountArgs,
  Prisma.DocumentStatusHistoryUpsertArgs
> {}

@Injectable()
export class PrismaDocumentStatusHistoryRepository implements DocumentStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DocumentStatusHistoryModel | null> {
    return this.prisma.documentStatusHistory.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.DocumentStatusHistoryFindManyArgs,
  ): Promise<DocumentStatusHistoryModel[]> {
    return this.prisma.documentStatusHistory.findMany(args);
  }

  count(args?: Prisma.DocumentStatusHistoryCountArgs): Promise<number> {
    return this.prisma.documentStatusHistory.count(args);
  }

  create(
    data: Prisma.DocumentStatusHistoryCreateInput,
  ): Promise<DocumentStatusHistoryModel> {
    return this.prisma.documentStatusHistory.create({ data });
  }

  update(
    id: string,
    data: Prisma.DocumentStatusHistoryUpdateInput,
  ): Promise<DocumentStatusHistoryModel> {
    return this.prisma.documentStatusHistory.update({ where: { id }, data });
  }

  delete(id: string): Promise<DocumentStatusHistoryModel> {
    return this.prisma.documentStatusHistory.delete({ where: { id } });
  }

  upsert(
    args: Prisma.DocumentStatusHistoryUpsertArgs,
  ): Promise<DocumentStatusHistoryModel> {
    return this.prisma.documentStatusHistory.upsert(args);
  }
}
