import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ProblemModel } from '../models/problem.model';
import type { IBaseRepository } from './base.repository';

export interface ProblemRepository extends IBaseRepository<
  ProblemModel,
  Prisma.ProblemCreateInput,
  Prisma.ProblemUpdateInput,
  Prisma.ProblemFindManyArgs,
  Prisma.ProblemCountArgs,
  Prisma.ProblemUpsertArgs
> {}

@Injectable()
export class PrismaProblemRepository implements ProblemRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ProblemModel | null> {
    return this.prisma.problem.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.ProblemFindManyArgs): Promise<ProblemModel[]> {
    return this.prisma.problem.findMany(args);
  }

  count(args?: Prisma.ProblemCountArgs): Promise<number> {
    return this.prisma.problem.count(args);
  }

  create(data: Prisma.ProblemCreateInput): Promise<ProblemModel> {
    return this.prisma.problem.create({ data });
  }

  update(id: string, data: Prisma.ProblemUpdateInput): Promise<ProblemModel> {
    return this.prisma.problem.update({ where: { id }, data });
  }

  delete(id: string): Promise<ProblemModel> {
    return this.prisma.problem.delete({ where: { id } });
  }

  upsert(args: Prisma.ProblemUpsertArgs): Promise<ProblemModel> {
    return this.prisma.problem.upsert(args);
  }
}
