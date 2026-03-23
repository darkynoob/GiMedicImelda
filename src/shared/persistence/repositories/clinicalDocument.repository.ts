import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ClinicalDocumentModel } from '../models/clinicalDocument.model';
import type { IBaseRepository } from './base.repository';

export interface ClinicalDocumentRepository extends IBaseRepository<
  ClinicalDocumentModel,
  Prisma.ClinicalDocumentCreateInput,
  Prisma.ClinicalDocumentUpdateInput,
  Prisma.ClinicalDocumentFindManyArgs,
  Prisma.ClinicalDocumentCountArgs,
  Prisma.ClinicalDocumentUpsertArgs
> {}

@Injectable()
export class PrismaClinicalDocumentRepository implements ClinicalDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ClinicalDocumentModel | null> {
    return this.prisma.clinicalDocument.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.ClinicalDocumentFindManyArgs,
  ): Promise<ClinicalDocumentModel[]> {
    return this.prisma.clinicalDocument.findMany(args);
  }

  count(args?: Prisma.ClinicalDocumentCountArgs): Promise<number> {
    return this.prisma.clinicalDocument.count(args);
  }

  create(
    data: Prisma.ClinicalDocumentCreateInput,
  ): Promise<ClinicalDocumentModel> {
    return this.prisma.clinicalDocument.create({ data });
  }

  update(
    id: string,
    data: Prisma.ClinicalDocumentUpdateInput,
  ): Promise<ClinicalDocumentModel> {
    return this.prisma.clinicalDocument.update({ where: { id }, data });
  }

  delete(id: string): Promise<ClinicalDocumentModel> {
    return this.prisma.clinicalDocument.delete({ where: { id } });
  }

  upsert(
    args: Prisma.ClinicalDocumentUpsertArgs,
  ): Promise<ClinicalDocumentModel> {
    return this.prisma.clinicalDocument.upsert(args);
  }
}
