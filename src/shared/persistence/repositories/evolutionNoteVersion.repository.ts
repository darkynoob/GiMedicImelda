import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { EvolutionNoteVersionModel } from '../models/evolutionNoteVersion.model';
import type { IBaseRepository } from './base.repository';

export interface EvolutionNoteVersionRepository extends IBaseRepository<
  EvolutionNoteVersionModel,
  Prisma.EvolutionNoteVersionCreateInput,
  Prisma.EvolutionNoteVersionUpdateInput,
  Prisma.EvolutionNoteVersionFindManyArgs,
  Prisma.EvolutionNoteVersionCountArgs,
  Prisma.EvolutionNoteVersionUpsertArgs
> {
  findCurrentDraft(
    evolutionNoteId: string,
  ): Promise<EvolutionNoteVersionModel | null>;
  findLatestFinalized(
    evolutionNoteId: string,
  ): Promise<EvolutionNoteVersionModel | null>;
  findAllByEvolutionNoteId(
    evolutionNoteId: string,
  ): Promise<EvolutionNoteVersionModel[]>;
}

@Injectable()
export class PrismaEvolutionNoteVersionRepository
  implements EvolutionNoteVersionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<EvolutionNoteVersionModel | null> {
    return this.prisma.evolutionNoteVersion.findUnique({ where: { id } });
  }

  findCurrentDraft(
    evolutionNoteId: string,
  ): Promise<EvolutionNoteVersionModel | null> {
    return this.prisma.evolutionNoteVersion.findFirst({
      where: { evolutionNoteId, status: 'DRAFT' },
    });
  }

  findLatestFinalized(
    evolutionNoteId: string,
  ): Promise<EvolutionNoteVersionModel | null> {
    return this.prisma.evolutionNoteVersion.findFirst({
      where: { evolutionNoteId, status: 'FINALIZED' },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findAllByEvolutionNoteId(
    evolutionNoteId: string,
  ): Promise<EvolutionNoteVersionModel[]> {
    return this.prisma.evolutionNoteVersion.findMany({
      where: { evolutionNoteId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findMany(
    args?: Prisma.EvolutionNoteVersionFindManyArgs,
  ): Promise<EvolutionNoteVersionModel[]> {
    return this.prisma.evolutionNoteVersion.findMany(args);
  }

  count(args?: Prisma.EvolutionNoteVersionCountArgs): Promise<number> {
    return this.prisma.evolutionNoteVersion.count(args);
  }

  create(
    data: Prisma.EvolutionNoteVersionCreateInput,
  ): Promise<EvolutionNoteVersionModel> {
    return this.prisma.evolutionNoteVersion.create({ data });
  }

  update(
    id: string,
    data: Prisma.EvolutionNoteVersionUpdateInput,
  ): Promise<EvolutionNoteVersionModel> {
    return this.prisma.evolutionNoteVersion.update({ where: { id }, data });
  }

  delete(id: string): Promise<EvolutionNoteVersionModel> {
    return this.prisma.evolutionNoteVersion.delete({ where: { id } });
  }

  upsert(
    args: Prisma.EvolutionNoteVersionUpsertArgs,
  ): Promise<EvolutionNoteVersionModel> {
    return this.prisma.evolutionNoteVersion.upsert(args);
  }
}
