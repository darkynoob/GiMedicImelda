import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AttachmentModel } from '../models/attachment.model';
import type { IBaseRepository } from './base.repository';

export interface AttachmentRepository extends IBaseRepository<
  AttachmentModel,
  Prisma.AttachmentCreateInput,
  Prisma.AttachmentUpdateInput,
  Prisma.AttachmentFindManyArgs,
  Prisma.AttachmentCountArgs,
  Prisma.AttachmentUpsertArgs
> {}

@Injectable()
export class PrismaAttachmentRepository implements AttachmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<AttachmentModel | null> {
    return this.prisma.attachment.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.AttachmentFindManyArgs): Promise<AttachmentModel[]> {
    return this.prisma.attachment.findMany(args);
  }

  count(args?: Prisma.AttachmentCountArgs): Promise<number> {
    return this.prisma.attachment.count(args);
  }

  create(data: Prisma.AttachmentCreateInput): Promise<AttachmentModel> {
    return this.prisma.attachment.create({ data });
  }

  update(
    id: string,
    data: Prisma.AttachmentUpdateInput,
  ): Promise<AttachmentModel> {
    return this.prisma.attachment.update({ where: { id }, data });
  }

  delete(id: string): Promise<AttachmentModel> {
    return this.prisma.attachment.delete({ where: { id } });
  }

  upsert(args: Prisma.AttachmentUpsertArgs): Promise<AttachmentModel> {
    return this.prisma.attachment.upsert(args);
  }
}
