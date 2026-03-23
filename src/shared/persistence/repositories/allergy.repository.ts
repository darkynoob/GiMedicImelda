import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AllergyModel } from '../models/allergy.model';
import type { IBaseRepository } from './base.repository';

export interface AllergyRepository extends IBaseRepository<
  AllergyModel,
  Prisma.AllergyCreateInput,
  Prisma.AllergyUpdateInput,
  Prisma.AllergyFindManyArgs,
  Prisma.AllergyCountArgs,
  Prisma.AllergyUpsertArgs
> {}

@Injectable()
export class PrismaAllergyRepository implements AllergyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<AllergyModel | null> {
    return this.prisma.allergy.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.AllergyFindManyArgs): Promise<AllergyModel[]> {
    return this.prisma.allergy.findMany(args);
  }

  count(args?: Prisma.AllergyCountArgs): Promise<number> {
    return this.prisma.allergy.count(args);
  }

  create(data: Prisma.AllergyCreateInput): Promise<AllergyModel> {
    return this.prisma.allergy.create({ data });
  }

  update(id: string, data: Prisma.AllergyUpdateInput): Promise<AllergyModel> {
    return this.prisma.allergy.update({ where: { id }, data });
  }

  delete(id: string): Promise<AllergyModel> {
    return this.prisma.allergy.delete({ where: { id } });
  }

  upsert(args: Prisma.AllergyUpsertArgs): Promise<AllergyModel> {
    return this.prisma.allergy.upsert(args);
  }
}
