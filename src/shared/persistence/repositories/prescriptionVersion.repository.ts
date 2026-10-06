import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PrescriptionVersionModel } from '../models/prescriptionVersion.model';
import type { IBaseRepository } from './base.repository';

export interface PrescriptionVersionRepository extends IBaseRepository<
  PrescriptionVersionModel,
  Prisma.PrescriptionVersionCreateInput,
  Prisma.PrescriptionVersionUpdateInput,
  Prisma.PrescriptionVersionFindManyArgs,
  Prisma.PrescriptionVersionCountArgs,
  Prisma.PrescriptionVersionUpsertArgs
> {
  findCurrentDraft(
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel | null>;
  findLatestFinalized(
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel | null>;
  findAllByPrescriptionId(
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel[]>;
  findByVerificationCode(
    verificationCode: string,
  ): Promise<PrescriptionVersionModel | null>;
}

@Injectable()
export class PrismaPrescriptionVersionRepository
  implements PrescriptionVersionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrescriptionVersionModel | null> {
    return this.prisma.prescriptionVersion.findUnique({ where: { id } });
  }

  findByVerificationCode(
    verificationCode: string,
  ): Promise<PrescriptionVersionModel | null> {
    return this.prisma.prescriptionVersion.findUnique({
      where: { verificationCode },
    });
  }

  findCurrentDraft(
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel | null> {
    return this.prisma.prescriptionVersion.findFirst({
      where: { prescriptionId, status: 'DRAFT' },
    });
  }

  findLatestFinalized(
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel | null> {
    return this.prisma.prescriptionVersion.findFirst({
      where: { prescriptionId, status: 'FINALIZED' },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findAllByPrescriptionId(
    prescriptionId: string,
  ): Promise<PrescriptionVersionModel[]> {
    return this.prisma.prescriptionVersion.findMany({
      where: { prescriptionId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findMany(
    args?: Prisma.PrescriptionVersionFindManyArgs,
  ): Promise<PrescriptionVersionModel[]> {
    return this.prisma.prescriptionVersion.findMany(args);
  }

  count(args?: Prisma.PrescriptionVersionCountArgs): Promise<number> {
    return this.prisma.prescriptionVersion.count(args);
  }

  create(
    data: Prisma.PrescriptionVersionCreateInput,
  ): Promise<PrescriptionVersionModel> {
    return this.prisma.prescriptionVersion.create({ data });
  }

  update(
    id: string,
    data: Prisma.PrescriptionVersionUpdateInput,
  ): Promise<PrescriptionVersionModel> {
    return this.prisma.prescriptionVersion.update({ where: { id }, data });
  }

  delete(id: string): Promise<PrescriptionVersionModel> {
    return this.prisma.prescriptionVersion.delete({ where: { id } });
  }

  upsert(
    args: Prisma.PrescriptionVersionUpsertArgs,
  ): Promise<PrescriptionVersionModel> {
    return this.prisma.prescriptionVersion.upsert(args);
  }
}
