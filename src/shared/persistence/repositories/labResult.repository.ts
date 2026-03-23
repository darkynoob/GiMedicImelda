import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { LabResultModel } from '../models/labResult.model';
import type { IBaseRepository } from './base.repository';

export interface LabResultRepository extends IBaseRepository<
  LabResultModel,
  Prisma.LabResultCreateInput,
  Prisma.LabResultUpdateInput,
  Prisma.LabResultFindManyArgs,
  Prisma.LabResultCountArgs,
  Prisma.LabResultUpsertArgs
> {}

@Injectable()
export class PrismaLabResultRepository implements LabResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<LabResultModel | null> {
    return this.prisma.labResult.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.LabResultFindManyArgs): Promise<LabResultModel[]> {
    return this.prisma.labResult.findMany(args);
  }

  count(args?: Prisma.LabResultCountArgs): Promise<number> {
    return this.prisma.labResult.count(args);
  }

  create(data: Prisma.LabResultCreateInput): Promise<LabResultModel> {
    return this.prisma.labResult.create({ data });
  }

  update(
    id: string,
    data: Prisma.LabResultUpdateInput,
  ): Promise<LabResultModel> {
    return this.prisma.labResult.update({ where: { id }, data });
  }

  delete(id: string): Promise<LabResultModel> {
    return this.prisma.labResult.delete({ where: { id } });
  }

  upsert(args: Prisma.LabResultUpsertArgs): Promise<LabResultModel> {
    return this.prisma.labResult.upsert(args);
  }
}
