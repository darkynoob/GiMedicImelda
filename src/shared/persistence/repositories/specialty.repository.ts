import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SpecialtyModel } from '../models/specialty.model';
import type { IBaseRepository } from './base.repository';

export interface SpecialtyRepository extends IBaseRepository<
  SpecialtyModel,
  Prisma.SpecialtyCreateInput,
  Prisma.SpecialtyUpdateInput,
  Prisma.SpecialtyFindManyArgs,
  Prisma.SpecialtyCountArgs,
  Prisma.SpecialtyUpsertArgs
> {}

@Injectable()
export class PrismaSpecialtyRepository implements SpecialtyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<SpecialtyModel | null> {
    return this.prisma.specialty.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.SpecialtyFindManyArgs): Promise<SpecialtyModel[]> {
    return this.prisma.specialty.findMany(args);
  }

  count(args?: Prisma.SpecialtyCountArgs): Promise<number> {
    return this.prisma.specialty.count(args);
  }

  create(data: Prisma.SpecialtyCreateInput): Promise<SpecialtyModel> {
    return this.prisma.specialty.create({ data });
  }

  update(
    id: string,
    data: Prisma.SpecialtyUpdateInput,
  ): Promise<SpecialtyModel> {
    return this.prisma.specialty.update({ where: { id }, data });
  }

  delete(id: string): Promise<SpecialtyModel> {
    return this.prisma.specialty.delete({ where: { id } });
  }

  upsert(args: Prisma.SpecialtyUpsertArgs): Promise<SpecialtyModel> {
    return this.prisma.specialty.upsert(args);
  }
}
