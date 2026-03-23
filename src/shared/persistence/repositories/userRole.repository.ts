import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRoleModel } from '../models/userRole.model';
import type { IBaseRepository } from './base.repository';

export interface UserRoleRepository extends IBaseRepository<
  UserRoleModel,
  Prisma.UserRoleCreateInput,
  Prisma.UserRoleUpdateInput,
  Prisma.UserRoleFindManyArgs,
  Prisma.UserRoleCountArgs,
  Prisma.UserRoleUpsertArgs
> {}

@Injectable()
export class PrismaUserRoleRepository implements UserRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserRoleModel | null> {
    return this.prisma.userRole.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.UserRoleFindManyArgs): Promise<UserRoleModel[]> {
    return this.prisma.userRole.findMany(args);
  }

  count(args?: Prisma.UserRoleCountArgs): Promise<number> {
    return this.prisma.userRole.count(args);
  }

  create(data: Prisma.UserRoleCreateInput): Promise<UserRoleModel> {
    return this.prisma.userRole.create({ data });
  }

  update(id: string, data: Prisma.UserRoleUpdateInput): Promise<UserRoleModel> {
    return this.prisma.userRole.update({ where: { id }, data });
  }

  delete(id: string): Promise<UserRoleModel> {
    return this.prisma.userRole.delete({ where: { id } });
  }

  upsert(args: Prisma.UserRoleUpsertArgs): Promise<UserRoleModel> {
    return this.prisma.userRole.upsert(args);
  }
}
