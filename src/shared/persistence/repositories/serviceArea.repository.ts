import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ServiceAreaModel } from '../models/serviceArea.model';
import type { IBaseRepository } from './base.repository';

export interface ServiceAreaRepository extends IBaseRepository<
  ServiceAreaModel,
  Prisma.ServiceAreaCreateInput,
  Prisma.ServiceAreaUpdateInput,
  Prisma.ServiceAreaFindManyArgs,
  Prisma.ServiceAreaCountArgs,
  Prisma.ServiceAreaUpsertArgs
> {}

@Injectable()
export class PrismaServiceAreaRepository implements ServiceAreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ServiceAreaModel | null> {
    return this.prisma.serviceArea.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.ServiceAreaFindManyArgs): Promise<ServiceAreaModel[]> {
    return this.prisma.serviceArea.findMany(args);
  }

  count(args?: Prisma.ServiceAreaCountArgs): Promise<number> {
    return this.prisma.serviceArea.count(args);
  }

  create(data: Prisma.ServiceAreaCreateInput): Promise<ServiceAreaModel> {
    return this.prisma.serviceArea.create({ data });
  }

  update(
    id: string,
    data: Prisma.ServiceAreaUpdateInput,
  ): Promise<ServiceAreaModel> {
    return this.prisma.serviceArea.update({ where: { id }, data });
  }

  delete(id: string): Promise<ServiceAreaModel> {
    return this.prisma.serviceArea.delete({ where: { id } });
  }

  upsert(args: Prisma.ServiceAreaUpsertArgs): Promise<ServiceAreaModel> {
    return this.prisma.serviceArea.upsert(args);
  }
}
