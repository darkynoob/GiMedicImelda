import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { EncounterModel } from '../models/encounter.model';
import type { IBaseRepository } from './base.repository';

export interface EncounterRepository extends IBaseRepository<
  EncounterModel,
  Prisma.EncounterCreateInput,
  Prisma.EncounterUpdateInput,
  Prisma.EncounterFindManyArgs,
  Prisma.EncounterCountArgs,
  Prisma.EncounterUpsertArgs
> {}

@Injectable()
export class PrismaEncounterRepository implements EncounterRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<EncounterModel | null> {
    return this.prisma.encounter.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.EncounterFindManyArgs): Promise<EncounterModel[]> {
    return this.prisma.encounter.findMany(args);
  }

  count(args?: Prisma.EncounterCountArgs): Promise<number> {
    return this.prisma.encounter.count(args);
  }

  create(data: Prisma.EncounterCreateInput): Promise<EncounterModel> {
    return this.prisma.encounter.create({ data });
  }

  update(
    id: string,
    data: Prisma.EncounterUpdateInput,
  ): Promise<EncounterModel> {
    return this.prisma.encounter.update({ where: { id }, data });
  }

  delete(id: string): Promise<EncounterModel> {
    return this.prisma.encounter.delete({ where: { id } });
  }

  upsert(args: Prisma.EncounterUpsertArgs): Promise<EncounterModel> {
    return this.prisma.encounter.upsert(args);
  }
}
