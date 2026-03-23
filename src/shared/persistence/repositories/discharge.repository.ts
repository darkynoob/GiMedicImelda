import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DischargeModel } from '../models/discharge.model';
import type { IBaseRepository } from './base.repository';

export interface DischargeRepository extends IBaseRepository<
  DischargeModel,
  Prisma.DischargeCreateInput,
  Prisma.DischargeUpdateInput,
  Prisma.DischargeFindManyArgs,
  Prisma.DischargeCountArgs,
  Prisma.DischargeUpsertArgs
> {}

@Injectable()
export class PrismaDischargeRepository implements DischargeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DischargeModel | null> {
    return this.prisma.discharge.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.DischargeFindManyArgs): Promise<DischargeModel[]> {
    return this.prisma.discharge.findMany(args);
  }

  count(args?: Prisma.DischargeCountArgs): Promise<number> {
    return this.prisma.discharge.count(args);
  }

  create(data: Prisma.DischargeCreateInput): Promise<DischargeModel> {
    return this.prisma.discharge.create({ data });
  }

  update(
    id: string,
    data: Prisma.DischargeUpdateInput,
  ): Promise<DischargeModel> {
    return this.prisma.discharge.update({ where: { id }, data });
  }

  delete(id: string): Promise<DischargeModel> {
    return this.prisma.discharge.delete({ where: { id } });
  }

  upsert(args: Prisma.DischargeUpsertArgs): Promise<DischargeModel> {
    return this.prisma.discharge.upsert(args);
  }
}
