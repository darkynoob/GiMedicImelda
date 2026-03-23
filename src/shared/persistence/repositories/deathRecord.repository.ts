import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DeathRecordModel } from '../models/deathRecord.model';
import type { IBaseRepository } from './base.repository';

export interface DeathRecordRepository extends IBaseRepository<
  DeathRecordModel,
  Prisma.DeathRecordCreateInput,
  Prisma.DeathRecordUpdateInput,
  Prisma.DeathRecordFindManyArgs,
  Prisma.DeathRecordCountArgs,
  Prisma.DeathRecordUpsertArgs
> {}

@Injectable()
export class PrismaDeathRecordRepository implements DeathRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<DeathRecordModel | null> {
    return this.prisma.deathRecord.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.DeathRecordFindManyArgs): Promise<DeathRecordModel[]> {
    return this.prisma.deathRecord.findMany(args);
  }

  count(args?: Prisma.DeathRecordCountArgs): Promise<number> {
    return this.prisma.deathRecord.count(args);
  }

  create(data: Prisma.DeathRecordCreateInput): Promise<DeathRecordModel> {
    return this.prisma.deathRecord.create({ data });
  }

  update(
    id: string,
    data: Prisma.DeathRecordUpdateInput,
  ): Promise<DeathRecordModel> {
    return this.prisma.deathRecord.update({ where: { id }, data });
  }

  delete(id: string): Promise<DeathRecordModel> {
    return this.prisma.deathRecord.delete({ where: { id } });
  }

  upsert(args: Prisma.DeathRecordUpsertArgs): Promise<DeathRecordModel> {
    return this.prisma.deathRecord.upsert(args);
  }
}
