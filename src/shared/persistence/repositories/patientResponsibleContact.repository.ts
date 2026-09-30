import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientResponsibleContactModel } from '../models/patientResponsibleContact.model';
import type { IBaseRepository } from './base.repository';

export interface PatientResponsibleContactRepository extends IBaseRepository<
  PatientResponsibleContactModel,
  Prisma.PatientResponsibleContactCreateInput,
  Prisma.PatientResponsibleContactUpdateInput,
  Prisma.PatientResponsibleContactFindManyArgs,
  Prisma.PatientResponsibleContactCountArgs,
  Prisma.PatientResponsibleContactUpsertArgs
> {
  findByPatient(
    patientId: string,
  ): Promise<PatientResponsibleContactModel | null>;
}

@Injectable()
export class PrismaPatientResponsibleContactRepository implements PatientResponsibleContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientResponsibleContactModel | null> {
    return this.prisma.patientResponsibleContact.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientResponsibleContactFindManyArgs,
  ): Promise<PatientResponsibleContactModel[]> {
    return this.prisma.patientResponsibleContact.findMany(args);
  }

  count(args?: Prisma.PatientResponsibleContactCountArgs): Promise<number> {
    return this.prisma.patientResponsibleContact.count(args);
  }

  create(
    data: Prisma.PatientResponsibleContactCreateInput,
  ): Promise<PatientResponsibleContactModel> {
    return this.prisma.patientResponsibleContact.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientResponsibleContactUpdateInput,
  ): Promise<PatientResponsibleContactModel> {
    return this.prisma.patientResponsibleContact.update({
      where: { id },
      data,
    });
  }

  delete(id: string): Promise<PatientResponsibleContactModel> {
    return this.prisma.patientResponsibleContact.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientResponsibleContactUpsertArgs,
  ): Promise<PatientResponsibleContactModel> {
    return this.prisma.patientResponsibleContact.upsert(args);
  }

  findByPatient(
    patientId: string,
  ): Promise<PatientResponsibleContactModel | null> {
    return this.prisma.patientResponsibleContact.findUnique({
      where: { patientId },
    });
  }
}
