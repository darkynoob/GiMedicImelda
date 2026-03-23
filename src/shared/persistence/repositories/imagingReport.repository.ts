import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ImagingReportModel } from '../models/imagingReport.model';
import type { IBaseRepository } from './base.repository';

export interface ImagingReportRepository extends IBaseRepository<
  ImagingReportModel,
  Prisma.ImagingReportCreateInput,
  Prisma.ImagingReportUpdateInput,
  Prisma.ImagingReportFindManyArgs,
  Prisma.ImagingReportCountArgs,
  Prisma.ImagingReportUpsertArgs
> {}

@Injectable()
export class PrismaImagingReportRepository implements ImagingReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ImagingReportModel | null> {
    return this.prisma.imagingReport.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.ImagingReportFindManyArgs,
  ): Promise<ImagingReportModel[]> {
    return this.prisma.imagingReport.findMany(args);
  }

  count(args?: Prisma.ImagingReportCountArgs): Promise<number> {
    return this.prisma.imagingReport.count(args);
  }

  create(data: Prisma.ImagingReportCreateInput): Promise<ImagingReportModel> {
    return this.prisma.imagingReport.create({ data });
  }

  update(
    id: string,
    data: Prisma.ImagingReportUpdateInput,
  ): Promise<ImagingReportModel> {
    return this.prisma.imagingReport.update({ where: { id }, data });
  }

  delete(id: string): Promise<ImagingReportModel> {
    return this.prisma.imagingReport.delete({ where: { id } });
  }

  upsert(args: Prisma.ImagingReportUpsertArgs): Promise<ImagingReportModel> {
    return this.prisma.imagingReport.upsert(args);
  }
}
