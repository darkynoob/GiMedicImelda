import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { LabRequestModel } from '../models/labRequest.model';
import type { IBaseRepository } from './base.repository';

export interface LabRequestRepository extends IBaseRepository<
  LabRequestModel,
  Prisma.LabRequestCreateInput,
  Prisma.LabRequestUpdateInput,
  Prisma.LabRequestFindManyArgs,
  Prisma.LabRequestCountArgs,
  Prisma.LabRequestUpsertArgs
> {}

@Injectable()
export class PrismaLabRequestRepository implements LabRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<LabRequestModel | null> {
    return this.prisma.labRequest.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.LabRequestFindManyArgs): Promise<LabRequestModel[]> {
    return this.prisma.labRequest.findMany(args);
  }

  count(args?: Prisma.LabRequestCountArgs): Promise<number> {
    return this.prisma.labRequest.count(args);
  }

  create(data: Prisma.LabRequestCreateInput): Promise<LabRequestModel> {
    return this.prisma.labRequest.create({ data });
  }

  update(
    id: string,
    data: Prisma.LabRequestUpdateInput,
  ): Promise<LabRequestModel> {
    return this.prisma.labRequest.update({ where: { id }, data });
  }

  delete(id: string): Promise<LabRequestModel> {
    return this.prisma.labRequest.delete({ where: { id } });
  }

  upsert(args: Prisma.LabRequestUpsertArgs): Promise<LabRequestModel> {
    return this.prisma.labRequest.upsert(args);
  }
}
