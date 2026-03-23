import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ImagingRequestModel } from '../models/imagingRequest.model';
import type { IBaseRepository } from './base.repository';

export interface ImagingRequestRepository extends IBaseRepository<
  ImagingRequestModel,
  Prisma.ImagingRequestCreateInput,
  Prisma.ImagingRequestUpdateInput,
  Prisma.ImagingRequestFindManyArgs,
  Prisma.ImagingRequestCountArgs,
  Prisma.ImagingRequestUpsertArgs
> {}

@Injectable()
export class PrismaImagingRequestRepository implements ImagingRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ImagingRequestModel | null> {
    return this.prisma.imagingRequest.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.ImagingRequestFindManyArgs,
  ): Promise<ImagingRequestModel[]> {
    return this.prisma.imagingRequest.findMany(args);
  }

  count(args?: Prisma.ImagingRequestCountArgs): Promise<number> {
    return this.prisma.imagingRequest.count(args);
  }

  create(data: Prisma.ImagingRequestCreateInput): Promise<ImagingRequestModel> {
    return this.prisma.imagingRequest.create({ data });
  }

  update(
    id: string,
    data: Prisma.ImagingRequestUpdateInput,
  ): Promise<ImagingRequestModel> {
    return this.prisma.imagingRequest.update({ where: { id }, data });
  }

  delete(id: string): Promise<ImagingRequestModel> {
    return this.prisma.imagingRequest.delete({ where: { id } });
  }

  upsert(args: Prisma.ImagingRequestUpsertArgs): Promise<ImagingRequestModel> {
    return this.prisma.imagingRequest.upsert(args);
  }
}
