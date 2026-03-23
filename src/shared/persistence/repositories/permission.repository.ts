import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PermissionModel } from '../models/permission.model';
import type { IBaseRepository } from './base.repository';

export interface PermissionRepository extends IBaseRepository<
  PermissionModel,
  Prisma.PermissionCreateInput,
  Prisma.PermissionUpdateInput,
  Prisma.PermissionFindManyArgs,
  Prisma.PermissionCountArgs,
  Prisma.PermissionUpsertArgs
> {}

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PermissionModel | null> {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.PermissionFindManyArgs): Promise<PermissionModel[]> {
    return this.prisma.permission.findMany(args);
  }

  count(args?: Prisma.PermissionCountArgs): Promise<number> {
    return this.prisma.permission.count(args);
  }

  create(data: Prisma.PermissionCreateInput): Promise<PermissionModel> {
    return this.prisma.permission.create({ data });
  }

  update(
    id: string,
    data: Prisma.PermissionUpdateInput,
  ): Promise<PermissionModel> {
    return this.prisma.permission.update({ where: { id }, data });
  }

  delete(id: string): Promise<PermissionModel> {
    return this.prisma.permission.delete({ where: { id } });
  }

  upsert(args: Prisma.PermissionUpsertArgs): Promise<PermissionModel> {
    return this.prisma.permission.upsert(args);
  }
}
