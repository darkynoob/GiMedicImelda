import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { FacilityModel } from '../models/facility.model';
import type { IBaseRepository } from './base.repository';

export interface FacilityRepository extends IBaseRepository<
  FacilityModel,
  Prisma.FacilityCreateInput,
  Prisma.FacilityUpdateInput,
  Prisma.FacilityFindManyArgs,
  Prisma.FacilityCountArgs,
  Prisma.FacilityUpsertArgs
> {}

@Injectable()
export class PrismaFacilityRepository implements FacilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<FacilityModel | null> {
    return this.prisma.facility.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.FacilityFindManyArgs): Promise<FacilityModel[]> {
    return this.prisma.facility.findMany(args);
  }

  count(args?: Prisma.FacilityCountArgs): Promise<number> {
    return this.prisma.facility.count(args);
  }

  create(data: Prisma.FacilityCreateInput): Promise<FacilityModel> {
    return this.prisma.facility.create({ data });
  }

  update(id: string, data: Prisma.FacilityUpdateInput): Promise<FacilityModel> {
    return this.prisma.facility.update({ where: { id }, data });
  }

  delete(id: string): Promise<FacilityModel> {
    return this.prisma.facility.delete({ where: { id } });
  }

  upsert(args: Prisma.FacilityUpsertArgs): Promise<FacilityModel> {
    return this.prisma.facility.upsert(args);
  }
}
