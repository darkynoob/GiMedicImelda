import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientModel } from '../models/patient.model';
import type { IBaseRepository } from './base.repository';

export interface PatientRepository extends IBaseRepository<
  PatientModel,
  Prisma.PatientCreateInput,
  Prisma.PatientUpdateInput,
  Prisma.PatientFindManyArgs,
  Prisma.PatientCountArgs,
  Prisma.PatientUpsertArgs
> {}

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientModel | null> {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.PatientFindManyArgs): Promise<PatientModel[]> {
    return this.prisma.patient.findMany(args);
  }

  count(args?: Prisma.PatientCountArgs): Promise<number> {
    return this.prisma.patient.count(args);
  }

  create(data: Prisma.PatientCreateInput): Promise<PatientModel> {
    return this.prisma.patient.create({ data });
  }

  update(id: string, data: Prisma.PatientUpdateInput): Promise<PatientModel> {
    return this.prisma.patient.update({ where: { id }, data });
  }

  delete(id: string): Promise<PatientModel> {
    return this.prisma.patient.delete({ where: { id } });
  }

  upsert(args: Prisma.PatientUpsertArgs): Promise<PatientModel> {
    return this.prisma.patient.upsert(args);
  }
}
