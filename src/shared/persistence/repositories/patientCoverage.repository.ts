import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientCoverageModel } from '../models/patientCoverage.model';
import type { IBaseRepository } from './base.repository';

export interface PatientCoverageRepository extends IBaseRepository<
  PatientCoverageModel,
  Prisma.PatientCoverageCreateInput,
  Prisma.PatientCoverageUpdateInput,
  Prisma.PatientCoverageFindManyArgs,
  Prisma.PatientCoverageCountArgs,
  Prisma.PatientCoverageUpsertArgs
> {
  findManyByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<PatientCoverageModel[]>;
}

@Injectable()
export class PrismaPatientCoverageRepository implements PatientCoverageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientCoverageModel | null> {
    return this.prisma.patientCoverage.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientCoverageFindManyArgs,
  ): Promise<PatientCoverageModel[]> {
    return this.prisma.patientCoverage.findMany(args);
  }

  count(args?: Prisma.PatientCoverageCountArgs): Promise<number> {
    return this.prisma.patientCoverage.count(args);
  }

  create(
    data: Prisma.PatientCoverageCreateInput,
  ): Promise<PatientCoverageModel> {
    return this.prisma.patientCoverage.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientCoverageUpdateInput,
  ): Promise<PatientCoverageModel> {
    return this.prisma.patientCoverage.update({ where: { id }, data });
  }

  delete(id: string): Promise<PatientCoverageModel> {
    return this.prisma.patientCoverage.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientCoverageUpsertArgs,
  ): Promise<PatientCoverageModel> {
    return this.prisma.patientCoverage.upsert(args);
  }

  findManyByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<PatientCoverageModel[]> {
    return this.prisma.patientCoverage.findMany({
      where: { tenantId, patientId },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    });
  }
}
