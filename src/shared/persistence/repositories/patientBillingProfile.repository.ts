import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientBillingProfileModel } from '../models/patientBillingProfile.model';
import type { IBaseRepository } from './base.repository';

export interface PatientBillingProfileRepository
  extends IBaseRepository<
    PatientBillingProfileModel,
    Prisma.PatientBillingProfileCreateInput,
    Prisma.PatientBillingProfileUpdateInput,
    Prisma.PatientBillingProfileFindManyArgs,
    Prisma.PatientBillingProfileCountArgs,
    Prisma.PatientBillingProfileUpsertArgs
  > {
  findByPatient(patientId: string): Promise<PatientBillingProfileModel | null>;
}

@Injectable()
export class PrismaPatientBillingProfileRepository
  implements PatientBillingProfileRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientBillingProfileModel | null> {
    return this.prisma.patientBillingProfile.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientBillingProfileFindManyArgs,
  ): Promise<PatientBillingProfileModel[]> {
    return this.prisma.patientBillingProfile.findMany(args);
  }

  count(args?: Prisma.PatientBillingProfileCountArgs): Promise<number> {
    return this.prisma.patientBillingProfile.count(args);
  }

  create(
    data: Prisma.PatientBillingProfileCreateInput,
  ): Promise<PatientBillingProfileModel> {
    return this.prisma.patientBillingProfile.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientBillingProfileUpdateInput,
  ): Promise<PatientBillingProfileModel> {
    return this.prisma.patientBillingProfile.update({ where: { id }, data });
  }

  delete(id: string): Promise<PatientBillingProfileModel> {
    return this.prisma.patientBillingProfile.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientBillingProfileUpsertArgs,
  ): Promise<PatientBillingProfileModel> {
    return this.prisma.patientBillingProfile.upsert(args);
  }

  findByPatient(patientId: string): Promise<PatientBillingProfileModel | null> {
    return this.prisma.patientBillingProfile.findUnique({
      where: { patientId },
    });
  }
}
