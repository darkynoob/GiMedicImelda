import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DocumentTypeModel } from '../models/documentType.model';
import type { IBaseRepository } from './base.repository';

export interface DocumentTypeRepository extends IBaseRepository<
  DocumentTypeModel,
  Prisma.DocumentTypeCreateInput,
  Prisma.DocumentTypeUpdateInput,
  Prisma.DocumentTypeFindManyArgs,
  Prisma.DocumentTypeCountArgs,
  Prisma.DocumentTypeUpsertArgs
> {}

@Injectable()
export class PrismaDocumentTypeRepository implements DocumentTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DocumentTypeModel | null> {
    return this.prisma.documentType.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.DocumentTypeFindManyArgs,
  ): Promise<DocumentTypeModel[]> {
    return this.prisma.documentType.findMany(args);
  }

  count(args?: Prisma.DocumentTypeCountArgs): Promise<number> {
    return this.prisma.documentType.count(args);
  }

  create(data: Prisma.DocumentTypeCreateInput): Promise<DocumentTypeModel> {
    return this.prisma.documentType.create({ data });
  }

  update(
    id: string,
    data: Prisma.DocumentTypeUpdateInput,
  ): Promise<DocumentTypeModel> {
    return this.prisma.documentType.update({ where: { id }, data });
  }

  delete(id: string): Promise<DocumentTypeModel> {
    return this.prisma.documentType.delete({ where: { id } });
  }

  upsert(args: Prisma.DocumentTypeUpsertArgs): Promise<DocumentTypeModel> {
    return this.prisma.documentType.upsert(args);
  }
}
