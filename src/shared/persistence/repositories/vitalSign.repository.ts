import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { VitalSignModel } from '../models/vitalSign.model';
import type { IBaseRepository } from './base.repository';

export interface VitalSignRepository extends IBaseRepository<
  VitalSignModel,
  Prisma.VitalSignCreateInput,
  Prisma.VitalSignUpdateInput,
  Prisma.VitalSignFindManyArgs,
  Prisma.VitalSignCountArgs,
  Prisma.VitalSignUpsertArgs
> {}

@Injectable()
export class PrismaVitalSignRepository implements VitalSignRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<VitalSignModel | null> {
    return this.prisma.vitalSign.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.VitalSignFindManyArgs): Promise<VitalSignModel[]> {
    return this.prisma.vitalSign.findMany(args);
  }

  count(args?: Prisma.VitalSignCountArgs): Promise<number> {
    return this.prisma.vitalSign.count(args);
  }

  create(data: Prisma.VitalSignCreateInput): Promise<VitalSignModel> {
    return this.prisma.vitalSign.create({ data });
  }

  update(
    id: string,
    data: Prisma.VitalSignUpdateInput,
  ): Promise<VitalSignModel> {
    return this.prisma.vitalSign.update({ where: { id }, data });
  }

  delete(id: string): Promise<VitalSignModel> {
    return this.prisma.vitalSign.delete({ where: { id } });
  }

  upsert(args: Prisma.VitalSignUpsertArgs): Promise<VitalSignModel> {
    return this.prisma.vitalSign.upsert(args);
  }
}
