import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RolePermissionModel } from '../models/rolePermission.model';
import type { IBaseRepository } from './base.repository';

export interface RolePermissionRepository extends IBaseRepository<
  RolePermissionModel,
  Prisma.RolePermissionCreateInput,
  Prisma.RolePermissionUpdateInput,
  Prisma.RolePermissionFindManyArgs,
  Prisma.RolePermissionCountArgs,
  Prisma.RolePermissionUpsertArgs
> {}

@Injectable()
export class PrismaRolePermissionRepository implements RolePermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<RolePermissionModel | null> {
    return this.prisma.rolePermission.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.RolePermissionFindManyArgs,
  ): Promise<RolePermissionModel[]> {
    return this.prisma.rolePermission.findMany(args);
  }

  count(args?: Prisma.RolePermissionCountArgs): Promise<number> {
    return this.prisma.rolePermission.count(args);
  }

  create(data: Prisma.RolePermissionCreateInput): Promise<RolePermissionModel> {
    return this.prisma.rolePermission.create({ data });
  }

  update(
    id: string,
    data: Prisma.RolePermissionUpdateInput,
  ): Promise<RolePermissionModel> {
    return this.prisma.rolePermission.update({ where: { id }, data });
  }

  delete(id: string): Promise<RolePermissionModel> {
    return this.prisma.rolePermission.delete({ where: { id } });
  }

  upsert(args: Prisma.RolePermissionUpsertArgs): Promise<RolePermissionModel> {
    return this.prisma.rolePermission.upsert(args);
  }
}
