import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatientDocumentModel } from '../models/patientDocument.model';
import type { IBaseRepository } from './base.repository';

export interface PatientDocumentRepository extends IBaseRepository<
  PatientDocumentModel,
  Prisma.PatientDocumentCreateInput,
  Prisma.PatientDocumentUpdateInput,
  Prisma.PatientDocumentFindManyArgs,
  Prisma.PatientDocumentCountArgs,
  Prisma.PatientDocumentUpsertArgs
> {
  findManyByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<PatientDocumentModel[]>;
}

@Injectable()
export class PrismaPatientDocumentRepository implements PatientDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PatientDocumentModel | null> {
    return this.prisma.patientDocument.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.PatientDocumentFindManyArgs,
  ): Promise<PatientDocumentModel[]> {
    return this.prisma.patientDocument.findMany(args);
  }

  count(args?: Prisma.PatientDocumentCountArgs): Promise<number> {
    return this.prisma.patientDocument.count(args);
  }

  create(
    data: Prisma.PatientDocumentCreateInput,
  ): Promise<PatientDocumentModel> {
    return this.prisma.patientDocument.create({ data });
  }

  update(
    id: string,
    data: Prisma.PatientDocumentUpdateInput,
  ): Promise<PatientDocumentModel> {
    return this.prisma.patientDocument.update({ where: { id }, data });
  }

  delete(id: string): Promise<PatientDocumentModel> {
    return this.prisma.patientDocument.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PatientDocumentUpsertArgs,
  ): Promise<PatientDocumentModel> {
    return this.prisma.patientDocument.upsert(args);
  }

  findManyByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<PatientDocumentModel[]> {
    return this.prisma.patientDocument.findMany({
      where: { tenantId, patientId },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    });
  }
}
