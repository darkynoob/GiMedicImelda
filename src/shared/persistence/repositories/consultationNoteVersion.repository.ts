import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ConsultationNoteVersionModel } from '../models/consultationNoteVersion.model';
import type { IBaseRepository } from './base.repository';

export interface ConsultationNoteVersionRepository extends IBaseRepository<
  ConsultationNoteVersionModel,
  Prisma.ConsultationNoteVersionCreateInput,
  Prisma.ConsultationNoteVersionUpdateInput,
  Prisma.ConsultationNoteVersionFindManyArgs,
  Prisma.ConsultationNoteVersionCountArgs,
  Prisma.ConsultationNoteVersionUpsertArgs
> {
  findCurrentDraft(
    consultationNoteId: string,
  ): Promise<ConsultationNoteVersionModel | null>;
  findLatestFinalized(
    consultationNoteId: string,
  ): Promise<ConsultationNoteVersionModel | null>;
  findAllByConsultationNoteId(
    consultationNoteId: string,
  ): Promise<ConsultationNoteVersionModel[]>;
}

@Injectable()
export class PrismaConsultationNoteVersionRepository
  implements ConsultationNoteVersionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ConsultationNoteVersionModel | null> {
    return this.prisma.consultationNoteVersion.findUnique({ where: { id } });
  }

  findCurrentDraft(
    consultationNoteId: string,
  ): Promise<ConsultationNoteVersionModel | null> {
    return this.prisma.consultationNoteVersion.findFirst({
      where: { consultationNoteId, status: 'DRAFT' },
    });
  }

  findLatestFinalized(
    consultationNoteId: string,
  ): Promise<ConsultationNoteVersionModel | null> {
    return this.prisma.consultationNoteVersion.findFirst({
      where: { consultationNoteId, status: 'FINALIZED' },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findAllByConsultationNoteId(
    consultationNoteId: string,
  ): Promise<ConsultationNoteVersionModel[]> {
    return this.prisma.consultationNoteVersion.findMany({
      where: { consultationNoteId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findMany(
    args?: Prisma.ConsultationNoteVersionFindManyArgs,
  ): Promise<ConsultationNoteVersionModel[]> {
    return this.prisma.consultationNoteVersion.findMany(args);
  }

  count(args?: Prisma.ConsultationNoteVersionCountArgs): Promise<number> {
    return this.prisma.consultationNoteVersion.count(args);
  }

  create(
    data: Prisma.ConsultationNoteVersionCreateInput,
  ): Promise<ConsultationNoteVersionModel> {
    return this.prisma.consultationNoteVersion.create({ data });
  }

  update(
    id: string,
    data: Prisma.ConsultationNoteVersionUpdateInput,
  ): Promise<ConsultationNoteVersionModel> {
    return this.prisma.consultationNoteVersion.update({ where: { id }, data });
  }

  delete(id: string): Promise<ConsultationNoteVersionModel> {
    return this.prisma.consultationNoteVersion.delete({ where: { id } });
  }

  upsert(
    args: Prisma.ConsultationNoteVersionUpsertArgs,
  ): Promise<ConsultationNoteVersionModel> {
    return this.prisma.consultationNoteVersion.upsert(args);
  }
}
