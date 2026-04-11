import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MedicalRecordStatus,
  Prisma,
  type Encounter,
  type Facility,
  type MedicalRecord,
  type Patient,
  type PatientIdentifier,
} from '@prisma/client';
import { ENCOUNTER_REPOSITORY } from '../../../shared/persistence/tokens/encounter.token';
import { FACILITY_REPOSITORY } from '../../../shared/persistence/tokens/facility.token';
import { MEDICALRECORD_REPOSITORY } from '../../../shared/persistence/tokens/medicalRecord.token';
import { PATIENTIDENTIFIER_REPOSITORY } from '../../../shared/persistence/tokens/patientIdentifier.token';
import { PATIENT_REPOSITORY } from '../../../shared/persistence/tokens/patient.token';
import { USER_REPOSITORY } from '../../../shared/persistence/tokens/user.token';
import { PrismaService } from '../../../shared/persistence/prisma/prisma.service';
import type { EncounterRepository } from '../../../shared/persistence/repositories/encounter.repository';
import type { FacilityRepository } from '../../../shared/persistence/repositories/facility.repository';
import type { MedicalRecordRepository } from '../../../shared/persistence/repositories/medicalRecord.repository';
import type { PatientIdentifierRepository } from '../../../shared/persistence/repositories/patientIdentifier.repository';
import type { PatientRepository } from '../../../shared/persistence/repositories/patient.repository';
import type { UserRepository } from '../../../shared/persistence/repositories/user.repository';
import { CreatePatientDto } from '../../create-patient.dto';
import type {
  PatientDetailResponse,
  PatientListItemResponse,
  PatientsListResponse,
} from '../dto/patient.response';
import { PatientsQueryDto } from '../dto/patients-query.dto';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const PHONE_REGEX = /^[\d\s\-+()]{7,20}$/;

@Injectable()
export class PatientsService {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(PATIENTIDENTIFIER_REPOSITORY)
    private readonly patientIdentifierRepository: PatientIdentifierRepository,
    @Inject(MEDICALRECORD_REPOSITORY)
    private readonly medicalRecordRepository: MedicalRecordRepository,
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(FACILITY_REPOSITORY)
    private readonly facilityRepository: FacilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createForTenant(
    tenantId: string,
    userId: string,
    input: CreatePatientDto,
  ): Promise<PatientDetailResponse> {
    this.validateCreateInput(input);

    const facility = await this.resolveTargetFacility(tenantId, userId, input);
    const fullName = this.buildFullName(input);
    const addressLine1 =
      input.addressLine1 ?? this.buildAddressLine1FromStructuredAddress(input);
    const addressLine2 =
      input.addressLine2 ?? this.buildAddressLine2FromStructuredAddress(input);

    try {
      const patient = await this.prisma.$transaction(async (tx) => {
        // The create flow stores both the structured address fields and the
        // legacy address lines so existing screens keep working during the
        // migration to the richer admission form.
        const createdPatient = await tx.patient.create({
          data: {
            tenantId,
            externalCode: input.externalCode,
            firstName: input.firstName,
            lastName: input.lastName,
            middleName: input.middleName,
            fullName,
            sexAtBirth: input.sexAtBirth,
            birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
            ageSnapshot: input.ageSnapshot,
            maritalStatus: input.maritalStatus,
            bloodType: input.bloodType,
            curp: input.curp,
            phone: input.phone,
            alternatePhone: input.alternatePhone,
            email: input.email,
            addressLine1,
            addressLine2,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country ?? 'MX',
            municipality: input.municipality,
            neighborhood: input.neighborhood,
            street: input.street,
            exteriorNumber: input.exteriorNumber,
            interiorNumber: input.interiorNumber,
            emergencyContactName: input.emergencyContactName,
            emergencyContactPhone: input.emergencyContactPhone,
            emergencyContactRelation: input.emergencyContactRelation,
            patientStatus: input.patientStatus,
            patientType: input.patientType,
            medicalUnit: input.medicalUnit,
            hasKnownAllergies: input.hasKnownAllergies,
            allergiesNotes: input.hasKnownAllergies
              ? input.allergiesNotes
              : null,
            occupation: input.occupation,
            educationLevel: input.educationLevel,
            religion: input.religion,
            primaryLanguage: input.primaryLanguage,
            requiresTranslator: input.requiresTranslator,
            registrationSource: input.registrationSource,
            administrativeNotes: input.administrativeNotes,
            isActive: this.isActivePatientStatus(input.patientStatus),
          },
        });

        if (input.identifierType && input.identifierValue) {
          await tx.patientIdentifier.create({
            data: {
              tenantId,
              patientId: createdPatient.id,
              identifierType: input.identifierType,
              identifierValue: input.identifierValue,
              isPrimary: true,
            },
          });
        }

        await tx.medicalRecord.create({
          data: {
            tenantId,
            facilityId: facility.id,
            patientId: createdPatient.id,
            recordNumber:
              input.recordNumber ?? this.generateRecordNumber(facility.code),
            status: MedicalRecordStatus.ACTIVE,
          },
        });

        return createdPatient;
      });

      return this.getDetailByTenant(tenantId, patient.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Ya existe un registro con alguno de los datos capturados',
          );
        }
      }

      throw error;
    }
  }

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
      trimmedSearch,
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
    const [identifiers, medicalRecords] = await Promise.all([
      patientIds.length > 0
        ? this.patientIdentifierRepository.findMany({
            where: {
              tenantId,
              patientId: { in: patientIds },
            },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          } satisfies Prisma.PatientIdentifierFindManyArgs)
        : Promise.resolve([]),
      patientIds.length > 0
        ? this.medicalRecordRepository.findMany({
            where: {
              tenantId,
              patientId: { in: patientIds },
            },
            orderBy: { openedAt: 'desc' },
          } satisfies Prisma.MedicalRecordFindManyArgs)
        : Promise.resolve([]),
    ]);

    const identifiersByPatientId = this.groupByPatientId(identifiers);
    const medicalRecordByPatientId =
      this.pickLatestMedicalRecordByPatient(medicalRecords);

    return {
      items: patients.map((patient) =>
        this.toPatientListItem(
          patient,
          identifiersByPatientId.get(patient.id) ?? [],
          medicalRecordByPatientId.get(patient.id) ?? null,
        ),
      ),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getDetailByTenant(
    tenantId: string,
    patientId: string,
  ): Promise<PatientDetailResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient || patient.tenantId !== tenantId) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const [identifiers, medicalRecords, encounters] = await Promise.all([
      this.patientIdentifierRepository.findMany({
        where: {
          tenantId,
          patientId,
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      } satisfies Prisma.PatientIdentifierFindManyArgs),
      this.medicalRecordRepository.findMany({
        where: {
          tenantId,
          patientId,
        },
        orderBy: { openedAt: 'desc' },
      } satisfies Prisma.MedicalRecordFindManyArgs),
      this.encounterRepository.findMany({
        where: {
          tenantId,
          patientId,
        },
        orderBy: { openedAt: 'desc' },
        take: 5,
      } satisfies Prisma.EncounterFindManyArgs),
    ]);

    const facilityIds = [
      ...new Set([
        ...medicalRecords.map((record) => record.facilityId),
        ...encounters.map((encounter) => encounter.facilityId),
      ]),
    ];

    const facilities =
      facilityIds.length > 0
        ? await this.facilityRepository.findMany({
            where: {
              id: { in: facilityIds },
            },
          } satisfies Prisma.FacilityFindManyArgs)
        : [];

    const facilitiesById = new Map(
      facilities.map((facility) => [facility.id, facility]),
    );

    return {
      id: patient.id,
      tenantId: patient.tenantId,
      fullName: patient.fullName,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      curp: patient.curp,
      birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
      sexAtBirth: patient.sexAtBirth,
      maritalStatus: patient.maritalStatus,
      bloodType: patient.bloodType,
      email: patient.email,
      phone: patient.phone,
      alternatePhone: patient.alternatePhone,
      addressLine1: patient.addressLine1,
      addressLine2: patient.addressLine2,
      city: patient.city,
      state: patient.state,
      postalCode: patient.postalCode,
      country: patient.country,
      municipality: patient.municipality,
      neighborhood: patient.neighborhood,
      street: patient.street,
      exteriorNumber: patient.exteriorNumber,
      interiorNumber: patient.interiorNumber,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      emergencyContactRelation: patient.emergencyContactRelation,
      patientStatus: patient.patientStatus,
      patientType: patient.patientType,
      medicalUnit: patient.medicalUnit,
      hasKnownAllergies: patient.hasKnownAllergies,
      allergiesNotes: patient.allergiesNotes,
      occupation: patient.occupation,
      educationLevel: patient.educationLevel,
      religion: patient.religion,
      primaryLanguage: patient.primaryLanguage,
      requiresTranslator: patient.requiresTranslator,
      registrationSource: patient.registrationSource,
      administrativeNotes: patient.administrativeNotes,
      identifiers: identifiers.map((identifier) => ({
        id: identifier.id,
        identifierType: identifier.identifierType,
        identifierValue: identifier.identifierValue,
        isPrimary: identifier.isPrimary,
      })),
      medicalRecords: medicalRecords.map((record) => ({
        id: record.id,
        recordNumber: record.recordNumber,
        status: record.status,
        facility: this.toFacilitySummary(
          facilitiesById.get(record.facilityId) ?? null,
        ),
        lastEncounterAt: record.lastEncounterAt?.toISOString() ?? null,
      })),
      recentEncounters: encounters.map((encounter) => ({
        id: encounter.id,
        encounterNumber: encounter.encounterNumber,
        encounterType: encounter.encounterType,
        status: encounter.status,
        openedAt: encounter.openedAt.toISOString(),
        closedAt: encounter.closedAt?.toISOString() ?? null,
        reasonForVisit: encounter.reasonForVisit,
        facilityName: facilitiesById.get(encounter.facilityId)?.name ?? null,
      })),
    };
  }

  private async findPatientIdsByIdentifierSearch(
    tenantId: string,
    search: string,
  ): Promise<string[]> {
    const identifiers = (await this.patientIdentifierRepository.findMany({
      where: {
        tenantId,
        identifierValue: {
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        patientId: true,
      },
    } as Prisma.PatientIdentifierFindManyArgs)) as Array<{ patientId: string }>;

    return [...new Set(identifiers.map((identifier) => identifier.patientId))];
  }

  private buildPatientSearchWhere(
    tenantId: string,
    search: string | undefined,
    patientIdsByIdentifier: string[],
  ): Prisma.PatientWhereInput {
    if (!search) {
      return { tenantId };
    }

    const orConditions: Prisma.PatientWhereInput[] = [
      {
        fullName: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        curp: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        externalCode: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];

    if (patientIdsByIdentifier.length > 0) {
      orConditions.push({
        id: {
          in: patientIdsByIdentifier,
        },
      });
    }

    return {
      tenantId,
      OR: orConditions,
    };
  }

  private groupByPatientId(
    identifiers: PatientIdentifier[],
  ): Map<string, PatientIdentifier[]> {
    const identifiersByPatientId = new Map<string, PatientIdentifier[]>();

    for (const identifier of identifiers) {
      const collection = identifiersByPatientId.get(identifier.patientId) ?? [];
      collection.push(identifier);
      identifiersByPatientId.set(identifier.patientId, collection);
    }

    return identifiersByPatientId;
  }

  private pickLatestMedicalRecordByPatient(
    medicalRecords: MedicalRecord[],
  ): Map<string, MedicalRecord> {
    const recordsByPatientId = new Map<string, MedicalRecord>();

    for (const record of medicalRecords) {
      if (!recordsByPatientId.has(record.patientId)) {
        recordsByPatientId.set(record.patientId, record);
      }
    }

    return recordsByPatientId;
  }

  private toPatientListItem(
    patient: Patient,
    identifiers: PatientIdentifier[],
    medicalRecord: MedicalRecord | null,
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
      medicalRecordNumber: medicalRecord?.recordNumber ?? null,
      primaryIdentifier: primaryIdentifier?.identifierValue ?? null,
      lastEncounterAt: medicalRecord?.lastEncounterAt?.toISOString() ?? null,
    };
  }

  private toFacilitySummary(facility: Facility | null) {
    if (!facility) {
      return null;
    }

    return {
      id: facility.id,
      code: facility.code,
      name: facility.name,
    };
  }

  private buildFullName(input: CreatePatientDto): string {
    return [input.firstName, input.lastName, input.middleName]
      .filter((part): part is string => Boolean(part))
      .join(' ');
  }

  /**
   * Centralizes create-time business rules so both controller tests and future
   * admission flows share the same clinical/administrative invariants.
   */
  private validateCreateInput(input: CreatePatientDto) {
    if (Boolean(input.identifierType) !== Boolean(input.identifierValue)) {
      throw new BadRequestException(
        'El identificador principal requiere tipo y valor',
      );
    }

    if (!input.birthDate && input.ageSnapshot === undefined) {
      throw new BadRequestException(
        'La fecha de nacimiento o la edad referida son obligatorias',
      );
    }

    if (!input.phone) {
      throw new BadRequestException('El telefono principal es obligatorio');
    }

    if (!PHONE_REGEX.test(input.phone)) {
      throw new BadRequestException(
        'El telefono principal tiene formato invalido',
      );
    }

    if (!input.city || !input.state) {
      throw new BadRequestException(
        'La ciudad y el estado son obligatorios para el alta rapida',
      );
    }

    if (input.curp && !CURP_REGEX.test(input.curp)) {
      throw new BadRequestException('La CURP capturada no es valida');
    }

    if (input.hasKnownAllergies && !input.allergiesNotes) {
      throw new BadRequestException(
        'Debes detallar las alergias conocidas del paciente',
      );
    }
  }

  /**
   * The historical UI expects a compact primary address line, so the richer
   * structured address coming from the new form is flattened here as a bridge.
   */
  private buildAddressLine1FromStructuredAddress(input: CreatePatientDto) {
    const primaryAddressLine = [input.street, input.exteriorNumber]
      .filter((part): part is string => Boolean(part))
      .join(' ')
      .trim();

    return primaryAddressLine.length > 0 ? primaryAddressLine : undefined;
  }

  /**
   * Secondary address data remains visible in older screens through the legacy
   * address line while the detail views adopt the richer fields progressively.
   */
  private buildAddressLine2FromStructuredAddress(input: CreatePatientDto) {
    const secondaryAddressLine = [
      input.interiorNumber ? `Int. ${input.interiorNumber}` : null,
      input.neighborhood ? `Col. ${input.neighborhood}` : null,
      input.municipality,
    ]
      .filter((part): part is string => Boolean(part))
      .join(', ')
      .trim();

    return secondaryAddressLine.length > 0 ? secondaryAddressLine : undefined;
  }

  private isActivePatientStatus(patientStatus: string) {
    return patientStatus.trim().toLowerCase() === 'activo';
  }

  private async resolveTargetFacility(
    tenantId: string,
    userId: string,
    input: CreatePatientDto,
  ): Promise<Facility> {
    const fallbackFacilityId = (await this.userRepository.findById(userId))
      ?.facilityId;
    const requestedFacilityId = input.facilityId ?? fallbackFacilityId;

    if (!requestedFacilityId) {
      throw new BadRequestException(
        'No se pudo determinar la sede para abrir el expediente',
      );
    }

    const facility =
      await this.facilityRepository.findById(requestedFacilityId);

    if (!facility || facility.tenantId !== tenantId || !facility.isActive) {
      throw new BadRequestException('La sede indicada no esta disponible');
    }

    return facility;
  }

  private generateRecordNumber(facilityCode: string): string {
    const safeFacilityCode =
      facilityCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'GEN';

    return `EXP-${safeFacilityCode}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
