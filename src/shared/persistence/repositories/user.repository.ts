import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UserModel } from '../models/user.model';
import type { IBaseRepository } from './base.repository';

export interface UserRepository extends IBaseRepository<
  UserModel,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserFindManyArgs,
  Prisma.UserCountArgs,
  Prisma.UserUpsertArgs
> {}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.UserFindManyArgs): Promise<UserModel[]> {
    return this.prisma.user.findMany(args);
  }

  count(args?: Prisma.UserCountArgs): Promise<number> {
    return this.prisma.user.count(args);
  }

  create(data: Prisma.UserCreateInput): Promise<UserModel> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<UserModel> {
    return this.prisma.user.update({ where: { id }, data });
  }

  delete(id: string): Promise<UserModel> {
    return this.prisma.user.delete({ where: { id } });
  }

  upsert(args: Prisma.UserUpsertArgs): Promise<UserModel> {
    return this.prisma.user.upsert(args);
  }
}
