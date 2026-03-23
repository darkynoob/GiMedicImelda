import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantModel } from '../models/tenant.model';
import type { IBaseRepository } from './base.repository';

export interface TenantRepository extends IBaseRepository<
  TenantModel,
  Prisma.TenantCreateInput,
  Prisma.TenantUpdateInput,
  Prisma.TenantFindManyArgs,
  Prisma.TenantCountArgs,
  Prisma.TenantUpsertArgs
> {}

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<TenantModel | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.TenantFindManyArgs): Promise<TenantModel[]> {
    return this.prisma.tenant.findMany(args);
  }

  count(args?: Prisma.TenantCountArgs): Promise<number> {
    return this.prisma.tenant.count(args);
  }

  create(data: Prisma.TenantCreateInput): Promise<TenantModel> {
    return this.prisma.tenant.create({ data });
  }

  update(id: string, data: Prisma.TenantUpdateInput): Promise<TenantModel> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  delete(id: string): Promise<TenantModel> {
    return this.prisma.tenant.delete({ where: { id } });
  }

  upsert(args: Prisma.TenantUpsertArgs): Promise<TenantModel> {
    return this.prisma.tenant.upsert(args);
  }
}
