import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ClinicalHistoryVersionModel } from '../models/clinicalHistoryVersion.model';
import type { IBaseRepository } from './base.repository';

export interface ClinicalHistoryVersionRepository extends IBaseRepository<
  ClinicalHistoryVersionModel,
  Prisma.ClinicalHistoryVersionCreateInput,
  Prisma.ClinicalHistoryVersionUpdateInput,
  Prisma.ClinicalHistoryVersionFindManyArgs,
  Prisma.ClinicalHistoryVersionCountArgs,
  Prisma.ClinicalHistoryVersionUpsertArgs
> {
  findCurrentDraft(
    clinicalHistoryId: string,
  ): Promise<ClinicalHistoryVersionModel | null>;
  findLatestFinalized(
    clinicalHistoryId: string,
  ): Promise<ClinicalHistoryVersionModel | null>;
  findAllByClinicalHistoryId(
    clinicalHistoryId: string,
  ): Promise<ClinicalHistoryVersionModel[]>;
}

@Injectable()
export class PrismaClinicalHistoryVersionRepository
  implements ClinicalHistoryVersionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ClinicalHistoryVersionModel | null> {
    return this.prisma.clinicalHistoryVersion.findUnique({ where: { id } });
  }

  findCurrentDraft(
    clinicalHistoryId: string,
  ): Promise<ClinicalHistoryVersionModel | null> {
    return this.prisma.clinicalHistoryVersion.findFirst({
      where: { clinicalHistoryId, status: 'DRAFT' },
    });
  }

  findLatestFinalized(
    clinicalHistoryId: string,
  ): Promise<ClinicalHistoryVersionModel | null> {
    return this.prisma.clinicalHistoryVersion.findFirst({
      where: { clinicalHistoryId, status: 'FINALIZED' },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findAllByClinicalHistoryId(
    clinicalHistoryId: string,
  ): Promise<ClinicalHistoryVersionModel[]> {
    return this.prisma.clinicalHistoryVersion.findMany({
      where: { clinicalHistoryId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findMany(
    args?: Prisma.ClinicalHistoryVersionFindManyArgs,
  ): Promise<ClinicalHistoryVersionModel[]> {
    return this.prisma.clinicalHistoryVersion.findMany(args);
  }

  count(args?: Prisma.ClinicalHistoryVersionCountArgs): Promise<number> {
    return this.prisma.clinicalHistoryVersion.count(args);
  }

  create(
    data: Prisma.ClinicalHistoryVersionCreateInput,
  ): Promise<ClinicalHistoryVersionModel> {
    return this.prisma.clinicalHistoryVersion.create({ data });
  }

  update(
    id: string,
    data: Prisma.ClinicalHistoryVersionUpdateInput,
  ): Promise<ClinicalHistoryVersionModel> {
    return this.prisma.clinicalHistoryVersion.update({ where: { id }, data });
  }

  delete(id: string): Promise<ClinicalHistoryVersionModel> {
    return this.prisma.clinicalHistoryVersion.delete({ where: { id } });
  }

  upsert(
    args: Prisma.ClinicalHistoryVersionUpsertArgs,
  ): Promise<ClinicalHistoryVersionModel> {
    return this.prisma.clinicalHistoryVersion.upsert(args);
  }
}
