import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DocumentVersionModel } from '../models/documentVersion.model';
import type { IBaseRepository } from './base.repository';

export interface DocumentVersionRepository extends IBaseRepository<
  DocumentVersionModel,
  Prisma.DocumentVersionCreateInput,
  Prisma.DocumentVersionUpdateInput,
  Prisma.DocumentVersionFindManyArgs,
  Prisma.DocumentVersionCountArgs,
  Prisma.DocumentVersionUpsertArgs
> {}

@Injectable()
export class PrismaDocumentVersionRepository implements DocumentVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DocumentVersionModel | null> {
    return this.prisma.documentVersion.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.DocumentVersionFindManyArgs,
  ): Promise<DocumentVersionModel[]> {
    return this.prisma.documentVersion.findMany(args);
  }

  count(args?: Prisma.DocumentVersionCountArgs): Promise<number> {
    return this.prisma.documentVersion.count(args);
  }

  create(
    data: Prisma.DocumentVersionCreateInput,
  ): Promise<DocumentVersionModel> {
    return this.prisma.documentVersion.create({ data });
  }

  update(
    id: string,
    data: Prisma.DocumentVersionUpdateInput,
  ): Promise<DocumentVersionModel> {
    return this.prisma.documentVersion.update({ where: { id }, data });
  }

  delete(id: string): Promise<DocumentVersionModel> {
    return this.prisma.documentVersion.delete({ where: { id } });
  }

  upsert(
    args: Prisma.DocumentVersionUpsertArgs,
  ): Promise<DocumentVersionModel> {
    return this.prisma.documentVersion.upsert(args);
  }
}
