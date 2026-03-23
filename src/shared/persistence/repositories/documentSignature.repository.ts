import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DocumentSignatureModel } from '../models/documentSignature.model';
import type { IBaseRepository } from './base.repository';

export interface DocumentSignatureRepository extends IBaseRepository<
  DocumentSignatureModel,
  Prisma.DocumentSignatureCreateInput,
  Prisma.DocumentSignatureUpdateInput,
  Prisma.DocumentSignatureFindManyArgs,
  Prisma.DocumentSignatureCountArgs,
  Prisma.DocumentSignatureUpsertArgs
> {}

@Injectable()
export class PrismaDocumentSignatureRepository implements DocumentSignatureRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DocumentSignatureModel | null> {
    return this.prisma.documentSignature.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.DocumentSignatureFindManyArgs,
  ): Promise<DocumentSignatureModel[]> {
    return this.prisma.documentSignature.findMany(args);
  }

  count(args?: Prisma.DocumentSignatureCountArgs): Promise<number> {
    return this.prisma.documentSignature.count(args);
  }

  create(
    data: Prisma.DocumentSignatureCreateInput,
  ): Promise<DocumentSignatureModel> {
    return this.prisma.documentSignature.create({ data });
  }

  update(
    id: string,
    data: Prisma.DocumentSignatureUpdateInput,
  ): Promise<DocumentSignatureModel> {
    return this.prisma.documentSignature.update({ where: { id }, data });
  }

  delete(id: string): Promise<DocumentSignatureModel> {
    return this.prisma.documentSignature.delete({ where: { id } });
  }

  upsert(
    args: Prisma.DocumentSignatureUpsertArgs,
  ): Promise<DocumentSignatureModel> {
    return this.prisma.documentSignature.upsert(args);
  }
}
