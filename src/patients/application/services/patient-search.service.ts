import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  type MedicalRecord,
  type Patient,
  type PatientIdentifier,
} from '@prisma/client';
import { MEDICALRECORD_REPOSITORY } from '../../../shared/persistence/tokens/medicalRecord.token';
import { PATIENTIDENTIFIER_REPOSITORY } from '../../../shared/persistence/tokens/patientIdentifier.token';
import { PATIENT_REPOSITORY } from '../../../shared/persistence/tokens/patient.token';
import { PrismaService } from '../../../shared/persistence/prisma/prisma.service';
import type { MedicalRecordRepository } from '../../../shared/persistence/repositories/medicalRecord.repository';
import type { PatientIdentifierRepository } from '../../../shared/persistence/repositories/patientIdentifier.repository';
import type { PatientRepository } from '../../../shared/persistence/repositories/patient.repository';
import type {
  PatientListItemResponse,
  PatientsListResponse,
} from '../dto/patient.response';
import { PatientsQueryDto } from '../dto/patients-query.dto';

@Injectable()
export class PatientSearchService {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(PATIENTIDENTIFIER_REPOSITORY)
    private readonly patientIdentifierRepository: PatientIdentifierRepository,
    @Inject(MEDICALRECORD_REPOSITORY)
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listByTenant(
    tenantId: string,
    query: PatientsQueryDto,
  ): Promise<PatientsListResponse> {
    const trimmedSearch = query.search?.trim();
    const patientIdsByIdentifier = trimmedSearch
      ? await this.findPatientIdsByIdentifierSearch(tenantId, trimmedSearch)
      : [];

    const where = this.buildPatientSearchWhere(
      tenantId,
      query,
      patientIdsByIdentifier,
    );
    const skip = (query.page - 1) * query.pageSize;

    const [patients, total] = await Promise.all([
      this.patientRepository.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip,
        take: query.pageSize,
      } satisfies Prisma.PatientFindManyArgs),
      this.patientRepository.count({
        where,
      } satisfies Prisma.PatientCountArgs),
    ]);

    const patientIds = patients.map((patient) => patient.id);
    const [identifiers, medicalRecords, encounterCounts, allergies] =
      await Promise.all([
        patientIds.length > 0
          ? this.patientIdentifierRepository.findMany({
              where: { tenantId, patientId: { in: patientIds } },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            } satisfies Prisma.PatientIdentifierFindManyArgs)
          : Promise.resolve([]),
        patientIds.length > 0
          ? this.medicalRecordRepository.findMany({
              where: { tenantId, patientId: { in: patientIds } },
              orderBy: { openedAt: 'desc' },
            } satisfies Prisma.MedicalRecordFindManyArgs)
          : Promise.resolve([]),
        patientIds.length > 0
          ? this.prisma.encounter.groupBy({
              by: ['patientId'],
              where: { tenantId, patientId: { in: patientIds } },
              _count: { patientId: true },
            })
          : Promise.resolve([]),
        patientIds.length > 0
          ? this.prisma.allergy.findMany({
              where: {
                tenantId,
                patientId: { in: patientIds },
                encounterId: null,
              },
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
      ]);

    const identifiersByPatientId = this.groupByPatientId(identifiers);
    const medicalRecordByPatientId =
      this.pickLatestMedicalRecordByPatient(medicalRecords);
    const encounterCountByPatientId = new Map<string, number>(
      encounterCounts.map((item): [string, number] => [
        item.patientId,
        item._count.patientId,
      ]),
    );
    const allergiesByPatientId = new Map<string, string[]>();

    for (const allergy of allergies) {
      const collection = allergiesByPatientId.get(allergy.patientId) ?? [];
      collection.push(allergy.substance);
      allergiesByPatientId.set(allergy.patientId, collection);
    }

    return {
      items: patients.map((patient) =>
        this.toPatientListItem(
          patient,
          identifiersByPatientId.get(patient.id) ?? [],
          medicalRecordByPatientId.get(patient.id) ?? null,
          encounterCountByPatientId.get(patient.id) ?? 0,
          allergiesByPatientId.get(patient.id) ?? [],
        ),
      ),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  private async findPatientIdsByIdentifierSearch(
    tenantId: string,
    search: string,
  ): Promise<string[]> {
    const identifiers = (await this.patientIdentifierRepository.findMany({
      where: {
        tenantId,
        identifierValue: { contains: search, mode: 'insensitive' },
      },
      select: { patientId: true },
    } as Prisma.PatientIdentifierFindManyArgs)) as Array<{ patientId: string }>;

    return [...new Set(identifiers.map((identifier) => identifier.patientId))];
  }

  private buildPatientSearchWhere(
    tenantId: string,
    query: PatientsQueryDto,
    patientIdsByIdentifier: string[],
  ): Prisma.PatientWhereInput {
    const search = query.search?.trim();
    const andConditions: Prisma.PatientWhereInput[] = [{ tenantId }];

    if (query.patientStatus) {
      andConditions.push({
        patientStatus: { equals: query.patientStatus, mode: 'insensitive' },
      });
    }

    if (query.sexAtBirth) {
      andConditions.push({ sexAtBirth: query.sexAtBirth as never });
    }

    if (query.allergiesFilter === 'with_allergies') {
      andConditions.push({ hasKnownAllergies: true });
    }

    if (query.allergiesFilter === 'without_allergies') {
      andConditions.push({ hasKnownAllergies: false });
    }

    if (!search) {
      return andConditions.length === 1
        ? andConditions[0]
        : { AND: andConditions };
    }

    const orConditions: Prisma.PatientWhereInput[] = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { curp: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { externalCode: { contains: search, mode: 'insensitive' } },
    ];

    if (patientIdsByIdentifier.length > 0) {
      orConditions.push({ id: { in: patientIdsByIdentifier } });
    }

    return { AND: [...andConditions, { OR: orConditions }] };
  }

  private groupByPatientId(
    identifiers: PatientIdentifier[],
  ): Map<string, PatientIdentifier[]> {
    const map = new Map<string, PatientIdentifier[]>();

    for (const identifier of identifiers) {
      const collection = map.get(identifier.patientId) ?? [];
      collection.push(identifier);
      map.set(identifier.patientId, collection);
    }

    return map;
  }

  private pickLatestMedicalRecordByPatient(
    medicalRecords: MedicalRecord[],
  ): Map<string, MedicalRecord> {
    const map = new Map<string, MedicalRecord>();

    for (const record of medicalRecords) {
      if (!map.has(record.patientId)) {
        map.set(record.patientId, record);
      }
    }

    return map;
  }

  private toPatientListItem(
    patient: Patient,
    identifiers: PatientIdentifier[],
    medicalRecord: MedicalRecord | null,
    encounterCount: number,
    allergiesSummary: string[],
  ): PatientListItemResponse {
    const primaryIdentifier =
      identifiers.find((identifier) => identifier.isPrimary) ??
      identifiers[0] ??
      null;

    return {
      id: patient.id,
      fullName: patient.fullName,
      curp: patient.curp,
      email: patient.email,
      phone: patient.phone,
      sexAtBirth: patient.sexAtBirth,
      birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
      ageLabel: this.buildAgeLabel(patient.birthDate, patient.ageSnapshot),
      patientStatus: patient.patientStatus,
      medicalRecordNumber: medicalRecord?.recordNumber ?? null,
      primaryIdentifier: primaryIdentifier?.identifierValue ?? null,
      lastEncounterAt: medicalRecord?.lastEncounterAt?.toISOString() ?? null,
      encounterCount,
      allergiesSummary,
      hasKnownAllergies: patient.hasKnownAllergies,
    };
  }

  private buildAgeLabel(
    birthDate: Date | null,
    ageSnapshot: number | null,
  ): string | null {
    if (birthDate) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age -= 1;
      }

      return age >= 0 ? `${age} años` : null;
    }

    return ageSnapshot !== null ? `${ageSnapshot} años` : null;
  }
}
