import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientClinicalProfileModel } from '../models/patientClinicalProfile.model';
import type { IBaseRepository } from './base.repository';

export interface PatientClinicalProfileRepository extends IBaseRepository<
  PatientClinicalProfileModel,
  Prisma.PatientClinicalProfileCreateInput,
  Prisma.PatientClinicalProfileUpdateInput,
  Prisma.PatientClinicalProfileFindManyArgs,
  Prisma.PatientClinicalProfileCountArgs,
  Prisma.PatientClinicalProfileUpsertArgs
> {
  findByPatient(patientId: string): Promise<PatientClinicalProfileModel | null>;
}

@Injectable()
export class PrismaPatientClinicalProfileRepository implements PatientClinicalProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientClinicalProfileModel | null> {
    return this.prisma.patientClinicalProfile.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientClinicalProfileFindManyArgs,
  ): Promise<PatientClinicalProfileModel[]> {
    return this.prisma.patientClinicalProfile.findMany(args);
  }

  count(args?: Prisma.PatientClinicalProfileCountArgs): Promise<number> {
    return this.prisma.patientClinicalProfile.count(args);
  }

  create(
    data: Prisma.PatientClinicalProfileCreateInput,
  ): Promise<PatientClinicalProfileModel> {
    return this.prisma.patientClinicalProfile.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientClinicalProfileUpdateInput,
  ): Promise<PatientClinicalProfileModel> {
    return this.prisma.patientClinicalProfile.update({ where: { id }, data });
  }

  delete(id: string): Promise<PatientClinicalProfileModel> {
    return this.prisma.patientClinicalProfile.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientClinicalProfileUpsertArgs,
  ): Promise<PatientClinicalProfileModel> {
    return this.prisma.patientClinicalProfile.upsert(args);
  }

  findByPatient(
    patientId: string,
  ): Promise<PatientClinicalProfileModel | null> {
    return this.prisma.patientClinicalProfile.findUnique({
      where: { patientId },
    });
  }
}
