import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PrescriptionModel } from '../models/prescription.model';
import type { IBaseRepository } from './base.repository';

export interface PrescriptionRepository extends IBaseRepository<
  PrescriptionModel,
  Prisma.PrescriptionCreateInput,
  Prisma.PrescriptionUpdateInput,
  Prisma.PrescriptionFindManyArgs,
  Prisma.PrescriptionCountArgs,
  Prisma.PrescriptionUpsertArgs
> {
  findAllByEncounterId(encounterId: string): Promise<PrescriptionModel[]>;
  countByEncounterId(encounterId: string): Promise<number>;
  findByFolio(folio: string): Promise<PrescriptionModel | null>;
}

@Injectable()
export class PrismaPrescriptionRepository implements PrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrescriptionModel | null> {
    return this.prisma.prescription.findUnique({ where: { id } });
  }

  findByFolio(folio: string): Promise<PrescriptionModel | null> {
    return this.prisma.prescription.findUnique({ where: { folio } });
  }

  findAllByEncounterId(encounterId: string): Promise<PrescriptionModel[]> {
    return this.prisma.prescription.findMany({
      where: { encounterId },
      orderBy: { prescriptionNumber: 'desc' },
    });
  }

  countByEncounterId(encounterId: string): Promise<number> {
    return this.prisma.prescription.count({ where: { encounterId } });
  }

  findMany(args?: Prisma.PrescriptionFindManyArgs): Promise<PrescriptionModel[]> {
    return this.prisma.prescription.findMany(args);
  }

  count(args?: Prisma.PrescriptionCountArgs): Promise<number> {
    return this.prisma.prescription.count(args);
  }

  create(data: Prisma.PrescriptionCreateInput): Promise<PrescriptionModel> {
    return this.prisma.prescription.create({ data });
  }

  update(
    id: string,
    data: Prisma.PrescriptionUpdateInput,
  ): Promise<PrescriptionModel> {
    return this.prisma.prescription.update({ where: { id }, data });
  }

  delete(id: string): Promise<PrescriptionModel> {
    return this.prisma.prescription.delete({ where: { id } });
  }

  upsert(args: Prisma.PrescriptionUpsertArgs): Promise<PrescriptionModel> {
    return this.prisma.prescription.upsert(args);
  }
}
