import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DiagnosisModel } from '../models/diagnosis.model';
import type { IBaseRepository } from './base.repository';

export interface DiagnosisRepository extends IBaseRepository<
  DiagnosisModel,
  Prisma.DiagnosisCreateInput,
  Prisma.DiagnosisUpdateInput,
  Prisma.DiagnosisFindManyArgs,
  Prisma.DiagnosisCountArgs,
  Prisma.DiagnosisUpsertArgs
> {}

@Injectable()
export class PrismaDiagnosisRepository implements DiagnosisRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DiagnosisModel | null> {
    return this.prisma.diagnosis.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.DiagnosisFindManyArgs): Promise<DiagnosisModel[]> {
    return this.prisma.diagnosis.findMany(args);
  }

  count(args?: Prisma.DiagnosisCountArgs): Promise<number> {
    return this.prisma.diagnosis.count(args);
  }

  create(data: Prisma.DiagnosisCreateInput): Promise<DiagnosisModel> {
    return this.prisma.diagnosis.create({ data });
  }

  update(
    id: string,
    data: Prisma.DiagnosisUpdateInput,
  ): Promise<DiagnosisModel> {
    return this.prisma.diagnosis.update({ where: { id }, data });
  }

  delete(id: string): Promise<DiagnosisModel> {
    return this.prisma.diagnosis.delete({ where: { id } });
  }

  upsert(args: Prisma.DiagnosisUpsertArgs): Promise<DiagnosisModel> {
    return this.prisma.diagnosis.upsert(args);
  }
}
