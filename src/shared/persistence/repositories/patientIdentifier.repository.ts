import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientIdentifierModel } from '../models/patientIdentifier.model';
import type { IBaseRepository } from './base.repository';

export interface PatientIdentifierRepository extends IBaseRepository<
  PatientIdentifierModel,
  Prisma.PatientIdentifierCreateInput,
  Prisma.PatientIdentifierUpdateInput,
  Prisma.PatientIdentifierFindManyArgs,
  Prisma.PatientIdentifierCountArgs,
  Prisma.PatientIdentifierUpsertArgs
> {}

@Injectable()
export class PrismaPatientIdentifierRepository implements PatientIdentifierRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientIdentifierModel | null> {
    return this.prisma.patientIdentifier.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientIdentifierFindManyArgs,
  ): Promise<PatientIdentifierModel[]> {
    return this.prisma.patientIdentifier.findMany(args);
  }

  count(args?: Prisma.PatientIdentifierCountArgs): Promise<number> {
    return this.prisma.patientIdentifier.count(args);
  }

  create(
    data: Prisma.PatientIdentifierCreateInput,
  ): Promise<PatientIdentifierModel> {
    return this.prisma.patientIdentifier.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientIdentifierUpdateInput,
  ): Promise<PatientIdentifierModel> {
    return this.prisma.patientIdentifier.update({ where: { id }, data });
  }

  delete(id: string): Promise<PatientIdentifierModel> {
    return this.prisma.patientIdentifier.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientIdentifierUpsertArgs,
  ): Promise<PatientIdentifierModel> {
    return this.prisma.patientIdentifier.upsert(args);
  }
}
