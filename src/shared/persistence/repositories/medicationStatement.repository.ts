import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { MedicationStatementModel } from '../models/medicationStatement.model';
import type { IBaseRepository } from './base.repository';

export interface MedicationStatementRepository extends IBaseRepository<
  MedicationStatementModel,
  Prisma.MedicationStatementCreateInput,
  Prisma.MedicationStatementUpdateInput,
  Prisma.MedicationStatementFindManyArgs,
  Prisma.MedicationStatementCountArgs,
  Prisma.MedicationStatementUpsertArgs
> {}

@Injectable()
export class PrismaMedicationStatementRepository implements MedicationStatementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MedicationStatementModel | null> {
    return this.prisma.medicationStatement.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.MedicationStatementFindManyArgs,
  ): Promise<MedicationStatementModel[]> {
    return this.prisma.medicationStatement.findMany(args);
  }

  count(args?: Prisma.MedicationStatementCountArgs): Promise<number> {
    return this.prisma.medicationStatement.count(args);
  }

  create(
    data: Prisma.MedicationStatementCreateInput,
  ): Promise<MedicationStatementModel> {
    return this.prisma.medicationStatement.create({ data });
  }

  update(
    id: string,
    data: Prisma.MedicationStatementUpdateInput,
  ): Promise<MedicationStatementModel> {
    return this.prisma.medicationStatement.update({ where: { id }, data });
  }

  delete(id: string): Promise<MedicationStatementModel> {
    return this.prisma.medicationStatement.delete({ where: { id } });
  }

  upsert(
    args: Prisma.MedicationStatementUpsertArgs,
  ): Promise<MedicationStatementModel> {
    return this.prisma.medicationStatement.upsert(args);
  }
}
