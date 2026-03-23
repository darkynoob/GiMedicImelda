import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ConsentFormModel } from '../models/consentForm.model';
import type { IBaseRepository } from './base.repository';

export interface ConsentFormRepository extends IBaseRepository<
  ConsentFormModel,
  Prisma.ConsentFormCreateInput,
  Prisma.ConsentFormUpdateInput,
  Prisma.ConsentFormFindManyArgs,
  Prisma.ConsentFormCountArgs,
  Prisma.ConsentFormUpsertArgs
> {}

@Injectable()
export class PrismaConsentFormRepository implements ConsentFormRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ConsentFormModel | null> {
    return this.prisma.consentForm.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.ConsentFormFindManyArgs): Promise<ConsentFormModel[]> {
    return this.prisma.consentForm.findMany(args);
  }

  count(args?: Prisma.ConsentFormCountArgs): Promise<number> {
    return this.prisma.consentForm.count(args);
  }

  create(data: Prisma.ConsentFormCreateInput): Promise<ConsentFormModel> {
    return this.prisma.consentForm.create({ data });
  }

  update(
    id: string,
    data: Prisma.ConsentFormUpdateInput,
  ): Promise<ConsentFormModel> {
    return this.prisma.consentForm.update({ where: { id }, data });
  }

  delete(id: string): Promise<ConsentFormModel> {
    return this.prisma.consentForm.delete({ where: { id } });
  }

  upsert(args: Prisma.ConsentFormUpsertArgs): Promise<ConsentFormModel> {
    return this.prisma.consentForm.upsert(args);
  }
}
