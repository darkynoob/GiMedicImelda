import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { NursingNoteModel } from '../models/nursingNote.model';
import type { IBaseRepository } from './base.repository';

export interface NursingNoteRepository extends IBaseRepository<
  NursingNoteModel,
  Prisma.NursingNoteCreateInput,
  Prisma.NursingNoteUpdateInput,
  Prisma.NursingNoteFindManyArgs,
  Prisma.NursingNoteCountArgs,
  Prisma.NursingNoteUpsertArgs
> {}

@Injectable()
export class PrismaNursingNoteRepository implements NursingNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<NursingNoteModel | null> {
    return this.prisma.nursingNote.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.NursingNoteFindManyArgs): Promise<NursingNoteModel[]> {
    return this.prisma.nursingNote.findMany(args);
  }

  count(args?: Prisma.NursingNoteCountArgs): Promise<number> {
    return this.prisma.nursingNote.count(args);
  }

  create(data: Prisma.NursingNoteCreateInput): Promise<NursingNoteModel> {
    return this.prisma.nursingNote.create({ data });
  }

  update(
    id: string,
    data: Prisma.NursingNoteUpdateInput,
  ): Promise<NursingNoteModel> {
    return this.prisma.nursingNote.update({ where: { id }, data });
  }

  delete(id: string): Promise<NursingNoteModel> {
    return this.prisma.nursingNote.delete({ where: { id } });
  }

  upsert(args: Prisma.NursingNoteUpsertArgs): Promise<NursingNoteModel> {
    return this.prisma.nursingNote.upsert(args);
  }
}
