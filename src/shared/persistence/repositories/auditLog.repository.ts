import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditLogModel } from '../models/auditLog.model';
import type { IBaseRepository } from './base.repository';

export interface AuditLogRepository extends IBaseRepository<
  AuditLogModel,
  Prisma.AuditLogCreateInput,
  Prisma.AuditLogUpdateInput,
  Prisma.AuditLogFindManyArgs,
  Prisma.AuditLogCountArgs,
  Prisma.AuditLogUpsertArgs
> {}

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<AuditLogModel | null> {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.AuditLogFindManyArgs): Promise<AuditLogModel[]> {
    return this.prisma.auditLog.findMany(args);
  }

  count(args?: Prisma.AuditLogCountArgs): Promise<number> {
    return this.prisma.auditLog.count(args);
  }

  create(data: Prisma.AuditLogCreateInput): Promise<AuditLogModel> {
    return this.prisma.auditLog.create({ data });
  }

  update(id: string, data: Prisma.AuditLogUpdateInput): Promise<AuditLogModel> {
    return this.prisma.auditLog.update({ where: { id }, data });
  }

  delete(id: string): Promise<AuditLogModel> {
    return this.prisma.auditLog.delete({ where: { id } });
  }

  upsert(args: Prisma.AuditLogUpsertArgs): Promise<AuditLogModel> {
    return this.prisma.auditLog.upsert(args);
  }
}
