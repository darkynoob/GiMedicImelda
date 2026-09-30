import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientDemographicProfileModel } from '../models/patientDemographicProfile.model';
import type { IBaseRepository } from './base.repository';

export interface PatientDemographicProfileRepository extends IBaseRepository<
  PatientDemographicProfileModel,
  Prisma.PatientDemographicProfileCreateInput,
  Prisma.PatientDemographicProfileUpdateInput,
  Prisma.PatientDemographicProfileFindManyArgs,
  Prisma.PatientDemographicProfileCountArgs,
  Prisma.PatientDemographicProfileUpsertArgs
> {
  findByPatient(
    patientId: string,
  ): Promise<PatientDemographicProfileModel | null>;
}

@Injectable()
export class PrismaPatientDemographicProfileRepository implements PatientDemographicProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientDemographicProfileModel | null> {
    return this.prisma.patientDemographicProfile.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientDemographicProfileFindManyArgs,
  ): Promise<PatientDemographicProfileModel[]> {
    return this.prisma.patientDemographicProfile.findMany(args);
  }

  count(args?: Prisma.PatientDemographicProfileCountArgs): Promise<number> {
    return this.prisma.patientDemographicProfile.count(args);
  }

  create(
    data: Prisma.PatientDemographicProfileCreateInput,
  ): Promise<PatientDemographicProfileModel> {
    return this.prisma.patientDemographicProfile.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientDemographicProfileUpdateInput,
  ): Promise<PatientDemographicProfileModel> {
    return this.prisma.patientDemographicProfile.update({
      where: { id },
      data,
    });
  }

  delete(id: string): Promise<PatientDemographicProfileModel> {
    return this.prisma.patientDemographicProfile.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientDemographicProfileUpsertArgs,
  ): Promise<PatientDemographicProfileModel> {
    return this.prisma.patientDemographicProfile.upsert(args);
  }

  findByPatient(
    patientId: string,
  ): Promise<PatientDemographicProfileModel | null> {
    return this.prisma.patientDemographicProfile.findUnique({
      where: { patientId },
    });
  }
}
