import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ProcedureRecordModel } from '../models/procedureRecord.model';
import type { IBaseRepository } from './base.repository';

export interface ProcedureRecordRepository extends IBaseRepository<
  ProcedureRecordModel,
  Prisma.ProcedureRecordCreateInput,
  Prisma.ProcedureRecordUpdateInput,
  Prisma.ProcedureRecordFindManyArgs,
  Prisma.ProcedureRecordCountArgs,
  Prisma.ProcedureRecordUpsertArgs
> {}

@Injectable()
export class PrismaProcedureRecordRepository implements ProcedureRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ProcedureRecordModel | null> {
    return this.prisma.procedureRecord.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.ProcedureRecordFindManyArgs,
  ): Promise<ProcedureRecordModel[]> {
    return this.prisma.procedureRecord.findMany(args);
  }

  count(args?: Prisma.ProcedureRecordCountArgs): Promise<number> {
    return this.prisma.procedureRecord.count(args);
  }

  create(
    data: Prisma.ProcedureRecordCreateInput,
  ): Promise<ProcedureRecordModel> {
    return this.prisma.procedureRecord.create({ data });
  }

  update(
    id: string,
    data: Prisma.ProcedureRecordUpdateInput,
  ): Promise<ProcedureRecordModel> {
    return this.prisma.procedureRecord.update({ where: { id }, data });
  }

  delete(id: string): Promise<ProcedureRecordModel> {
    return this.prisma.procedureRecord.delete({ where: { id } });
  }

  upsert(
    args: Prisma.ProcedureRecordUpsertArgs,
  ): Promise<ProcedureRecordModel> {
    return this.prisma.procedureRecord.upsert(args);
  }
}
