import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { MpNotificationModel } from '../models/mpNotification.model';
import type { IBaseRepository } from './base.repository';

export interface MpNotificationRepository extends IBaseRepository<
  MpNotificationModel,
  Prisma.MpNotificationCreateInput,
  Prisma.MpNotificationUpdateInput,
  Prisma.MpNotificationFindManyArgs,
  Prisma.MpNotificationCountArgs,
  Prisma.MpNotificationUpsertArgs
> {}

@Injectable()
export class PrismaMpNotificationRepository implements MpNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MpNotificationModel | null> {
    return this.prisma.mpNotification.findUnique({ where: { id } });
  }

  findMany(
    args?: Prisma.MpNotificationFindManyArgs,
  ): Promise<MpNotificationModel[]> {
    return this.prisma.mpNotification.findMany(args);
  }

  count(args?: Prisma.MpNotificationCountArgs): Promise<number> {
    return this.prisma.mpNotification.count(args);
  }

  create(data: Prisma.MpNotificationCreateInput): Promise<MpNotificationModel> {
    return this.prisma.mpNotification.create({ data });
  }

  update(
    id: string,
    data: Prisma.MpNotificationUpdateInput,
  ): Promise<MpNotificationModel> {
    return this.prisma.mpNotification.update({ where: { id }, data });
  }

  delete(id: string): Promise<MpNotificationModel> {
    return this.prisma.mpNotification.delete({ where: { id } });
  }

  upsert(args: Prisma.MpNotificationUpsertArgs): Promise<MpNotificationModel> {
    return this.prisma.mpNotification.upsert(args);
  }
}
