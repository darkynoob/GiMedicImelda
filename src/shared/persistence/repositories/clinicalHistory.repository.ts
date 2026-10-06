import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ClinicalHistoryModel } from '../models/clinicalHistory.model';
import type { IBaseRepository } from './base.repository';

export interface ClinicalHistoryRepository extends IBaseRepository<
  ClinicalHistoryModel,
  Prisma.ClinicalHistoryCreateInput,
  Prisma.ClinicalHistoryUpdateInput,
  Prisma.ClinicalHistoryFindManyArgs,
  Prisma.ClinicalHistoryCountArgs,
  Prisma.ClinicalHistoryUpsertArgs
> {
  findByEncounterId(encounterId: string): Promise<ClinicalHistoryModel | null>;
}

@Injectable()
export class PrismaClinicalHistoryRepository
  implements ClinicalHistoryRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ClinicalHistoryModel | null> {
    return this.prisma.clinicalHistory.findUnique({ where: { id } });
  }

  findByEncounterId(encounterId: string): Promise<ClinicalHistoryModel | null> {
    return this.prisma.clinicalHistory.findUnique({ where: { encounterId } });
  }

  findMany(
    args?: Prisma.ClinicalHistoryFindManyArgs,
  ): Promise<ClinicalHistoryModel[]> {
    return this.prisma.clinicalHistory.findMany(args);
  }

  count(args?: Prisma.ClinicalHistoryCountArgs): Promise<number> {
    return this.prisma.clinicalHistory.count(args);
  }

  create(data: Prisma.ClinicalHistoryCreateInput): Promise<ClinicalHistoryModel> {
    return this.prisma.clinicalHistory.create({ data });
  }

  update(
    id: string,
    data: Prisma.ClinicalHistoryUpdateInput,
  ): Promise<ClinicalHistoryModel> {
    return this.prisma.clinicalHistory.update({ where: { id }, data });
  }

  delete(id: string): Promise<ClinicalHistoryModel> {
    return this.prisma.clinicalHistory.delete({ where: { id } });
  }

  upsert(
    args: Prisma.ClinicalHistoryUpsertArgs,
  ): Promise<ClinicalHistoryModel> {
    return this.prisma.clinicalHistory.upsert(args);
  }
}
