import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { EvolutionNoteModel } from '../models/evolutionNote.model';
import type { IBaseRepository } from './base.repository';

export interface EvolutionNoteRepository extends IBaseRepository<
  EvolutionNoteModel,
  Prisma.EvolutionNoteCreateInput,
  Prisma.EvolutionNoteUpdateInput,
  Prisma.EvolutionNoteFindManyArgs,
  Prisma.EvolutionNoteCountArgs,
  Prisma.EvolutionNoteUpsertArgs
> {
  findAllByEncounterId(encounterId: string): Promise<EvolutionNoteModel[]>;
  countByEncounterId(encounterId: string): Promise<number>;
}

@Injectable()
export class PrismaEvolutionNoteRepository implements EvolutionNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<EvolutionNoteModel | null> {
    return this.prisma.evolutionNote.findUnique({ where: { id } });
  }

  findAllByEncounterId(encounterId: string): Promise<EvolutionNoteModel[]> {
    return this.prisma.evolutionNote.findMany({
      where: { encounterId },
      orderBy: { noteNumber: 'desc' },
    });
  }

  countByEncounterId(encounterId: string): Promise<number> {
    return this.prisma.evolutionNote.count({ where: { encounterId } });
  }

  findMany(args?: Prisma.EvolutionNoteFindManyArgs): Promise<EvolutionNoteModel[]> {
    return this.prisma.evolutionNote.findMany(args);
  }

  count(args?: Prisma.EvolutionNoteCountArgs): Promise<number> {
    return this.prisma.evolutionNote.count(args);
  }

  create(data: Prisma.EvolutionNoteCreateInput): Promise<EvolutionNoteModel> {
    return this.prisma.evolutionNote.create({ data });
  }

  update(
    id: string,
    data: Prisma.EvolutionNoteUpdateInput,
  ): Promise<EvolutionNoteModel> {
    return this.prisma.evolutionNote.update({ where: { id }, data });
  }

  delete(id: string): Promise<EvolutionNoteModel> {
    return this.prisma.evolutionNote.delete({ where: { id } });
  }

  upsert(args: Prisma.EvolutionNoteUpsertArgs): Promise<EvolutionNoteModel> {
    return this.prisma.evolutionNote.upsert(args);
  }
}
