import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ConsultationNoteModel } from '../models/consultationNote.model';
import type { IBaseRepository } from './base.repository';

export interface ConsultationNoteRepository extends IBaseRepository<
  ConsultationNoteModel,
  Prisma.ConsultationNoteCreateInput,
  Prisma.ConsultationNoteUpdateInput,
  Prisma.ConsultationNoteFindManyArgs,
  Prisma.ConsultationNoteCountArgs,
  Prisma.ConsultationNoteUpsertArgs
> {
  findByEncounterId(encounterId: string): Promise<ConsultationNoteModel | null>;
}

@Injectable()
export class PrismaConsultationNoteRepository
  implements ConsultationNoteRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ConsultationNoteModel | null> {
    return this.prisma.consultationNote.findUnique({ where: { id } });
  }

  findByEncounterId(
    encounterId: string,
  ): Promise<ConsultationNoteModel | null> {
    return this.prisma.consultationNote.findUnique({ where: { encounterId } });
  }

  findMany(
    args?: Prisma.ConsultationNoteFindManyArgs,
  ): Promise<ConsultationNoteModel[]> {
    return this.prisma.consultationNote.findMany(args);
  }

  count(args?: Prisma.ConsultationNoteCountArgs): Promise<number> {
    return this.prisma.consultationNote.count(args);
  }

  create(
    data: Prisma.ConsultationNoteCreateInput,
  ): Promise<ConsultationNoteModel> {
    return this.prisma.consultationNote.create({ data });
  }

  update(
    id: string,
    data: Prisma.ConsultationNoteUpdateInput,
  ): Promise<ConsultationNoteModel> {
    return this.prisma.consultationNote.update({ where: { id }, data });
  }

  delete(id: string): Promise<ConsultationNoteModel> {
    return this.prisma.consultationNote.delete({ where: { id } });
  }

  upsert(
    args: Prisma.ConsultationNoteUpsertArgs,
  ): Promise<ConsultationNoteModel> {
    return this.prisma.consultationNote.upsert(args);
  }
}
