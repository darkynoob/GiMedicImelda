import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { MedicalRecordModel } from '../models/medicalRecord.model';
import type { IBaseRepository } from './base.repository';

export interface MedicalRecordRepository extends IBaseRepository<
  MedicalRecordModel,
  Prisma.MedicalRecordCreateInput,
  Prisma.MedicalRecordUpdateInput,
  Prisma.MedicalRecordFindManyArgs,
  Prisma.MedicalRecordCountArgs,
  Prisma.MedicalRecordUpsertArgs
> {}

@Injectable()
export class PrismaMedicalRecordRepository implements MedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MedicalRecordModel | null> {
    return this.prisma.medicalRecord.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.MedicalRecordFindManyArgs,
  ): Promise<MedicalRecordModel[]> {
    return this.prisma.medicalRecord.findMany(args);
  }

  count(args?: Prisma.MedicalRecordCountArgs): Promise<number> {
    return this.prisma.medicalRecord.count(args);
  }

  create(data: Prisma.MedicalRecordCreateInput): Promise<MedicalRecordModel> {
    return this.prisma.medicalRecord.create({ data });
  }

  update(
    id: string,
    data: Prisma.MedicalRecordUpdateInput,
  ): Promise<MedicalRecordModel> {
    return this.prisma.medicalRecord.update({ where: { id }, data });
  }

  delete(id: string): Promise<MedicalRecordModel> {
    return this.prisma.medicalRecord.delete({ where: { id } });
  }

  upsert(args: Prisma.MedicalRecordUpsertArgs): Promise<MedicalRecordModel> {
    return this.prisma.medicalRecord.upsert(args);
  }
}
