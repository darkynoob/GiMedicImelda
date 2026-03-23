import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RoleModel } from '../models/role.model';
import type { IBaseRepository } from './base.repository';

export interface RoleRepository extends IBaseRepository<
  RoleModel,
  Prisma.RoleCreateInput,
  Prisma.RoleUpdateInput,
  Prisma.RoleFindManyArgs,
  Prisma.RoleCountArgs,
  Prisma.RoleUpsertArgs
> {}

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<RoleModel | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.RoleFindManyArgs): Promise<RoleModel[]> {
    return this.prisma.role.findMany(args);
  }

  count(args?: Prisma.RoleCountArgs): Promise<number> {
    return this.prisma.role.count(args);
  }

  create(data: Prisma.RoleCreateInput): Promise<RoleModel> {
    return this.prisma.role.create({ data });
  }

  update(id: string, data: Prisma.RoleUpdateInput): Promise<RoleModel> {
    return this.prisma.role.update({ where: { id }, data });
  }

  delete(id: string): Promise<RoleModel> {
    return this.prisma.role.delete({ where: { id } });
  }

  upsert(args: Prisma.RoleUpsertArgs): Promise<RoleModel> {
    return this.prisma.role.upsert(args);
  }
}
