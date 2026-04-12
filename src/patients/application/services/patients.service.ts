import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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
import { UpdatePatientDto } from '../../update-patient.dto';
import type {
  PatientDetailResponse,
  PatientListItemResponse,
  PatientsListResponse,
} from '../dto/patient.response';
import { PatientsQueryDto } from '../dto/patients-query.dto';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
const PHONE_REGEX = /^[\d\s\-+()]{7,20}$/;

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

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

    const where = this.buildPatientSearchWhere(tenantId, query, patientIdsByIdentifier);
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
    const [identifiers, medicalRecords, encounterCounts, allergies] = await Promise.all([
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
      patientIds.length > 0
        ? this.prisma.encounter.groupBy({
            by: ['patientId'],
            where: {
              tenantId,
              patientId: { in: patientIds },
            },
            _count: {
              patientId: true,
            },
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
      encounterCounts.map(
        (item): [string, number] => [item.patientId, item._count.patientId],
      ),
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

  async getDetailByTenant(
    tenantId: string,
    patientId: string,
  ): Promise<PatientDetailResponse> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient || patient.tenantId !== tenantId) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const [
      identifiers,
      medicalRecords,
      encounters,
      responsibleContact,
      coverages,
      documents,
      attachments,
      demographicProfile,
      clinicalProfile,
      billingProfile,
      allergies,
      problems,
    ] = await Promise.all([
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
      this.prisma.patientResponsibleContact.findUnique({
        where: {
          patientId,
        },
      }),
      this.prisma.patientCoverage.findMany({
        where: {
          tenantId,
          patientId,
        },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.patientDocument.findMany({
        where: {
          tenantId,
          patientId,
        },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.attachment.findMany({
        where: {
          tenantId,
          patientId,
        },
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.patientDemographicProfile.findUnique({
        where: {
          patientId,
        },
      }),
      this.prisma.patientClinicalProfile.findUnique({
        where: {
          patientId,
        },
      }),
      this.prisma.patientBillingProfile.findUnique({
        where: {
          patientId,
        },
      }),
      this.prisma.allergy.findMany({
        where: {
          tenantId,
          patientId,
          encounterId: null,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.problem.findMany({
        where: {
          tenantId,
          patientId,
          encounterId: null,
        },
        orderBy: { createdAt: 'asc' },
      }),
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
      externalCode: patient.externalCode,
      fullName: patient.fullName,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      curp: patient.curp,
      rfc: patient.rfc,
      birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
      ageSnapshot: patient.ageSnapshot,
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
      updatedAt: patient.updatedAt.toISOString(),
      responsibleContact: responsibleContact
        ? {
            id: responsibleContact.id,
            fullName: responsibleContact.fullName,
            relationship: responsibleContact.relationship,
            phone: responsibleContact.phone,
            alternatePhone: responsibleContact.alternatePhone,
            email: responsibleContact.email,
            legalRepresentationType: responsibleContact.legalRepresentationType,
            addressLine1: responsibleContact.addressLine1,
            addressLine2: responsibleContact.addressLine2,
            city: responsibleContact.city,
            state: responsibleContact.state,
            postalCode: responsibleContact.postalCode,
            country: responsibleContact.country,
            notes: responsibleContact.notes,
          }
        : null,
      coverages: coverages.map((coverage) => ({
        id: coverage.id,
        coverageType: coverage.coverageType,
        providerName: coverage.providerName,
        planName: coverage.planName,
        policyNumber: coverage.policyNumber,
        membershipNumber: coverage.membershipNumber,
        insuredPersonName: coverage.insuredPersonName,
        relationshipToInsured: coverage.relationshipToInsured,
        validFrom: coverage.validFrom?.toISOString() ?? null,
        validUntil: coverage.validUntil?.toISOString() ?? null,
        authorizationNotes: coverage.authorizationNotes,
        isPrimary: coverage.isPrimary,
      })),
      documents: documents.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        documentNumber: document.documentNumber,
        issuedBy: document.issuedBy,
        issuedAt: document.issuedAt?.toISOString() ?? null,
        expiresAt: document.expiresAt?.toISOString() ?? null,
        notes: document.notes,
        isPrimary: document.isPrimary,
      })),
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSizeBytes: attachment.fileSizeBytes.toString(),
        uploadedAt: attachment.uploadedAt.toISOString(),
      })),
      allergies: allergies.map((allergy) => ({
        id: allergy.id,
        substance: allergy.substance,
        reaction: allergy.reaction,
        severity: allergy.severity,
        status: allergy.status,
      })),
      problems: problems.map((problem) => ({
        id: problem.id,
        description: problem.description,
        status: problem.status,
      })),
      clinicalProfile: clinicalProfile
        ? {
            id: clinicalProfile.id,
            organDonorStatus: clinicalProfile.organDonorStatus,
            rhFactor: clinicalProfile.rhFactor,
            pregnancyStatus: clinicalProfile.pregnancyStatus,
            disabilityNotes: clinicalProfile.disabilityNotes,
            clinicalAlerts: clinicalProfile.clinicalAlerts,
            clinicalObservations: clinicalProfile.clinicalObservations,
            chronicConditionsNotes: clinicalProfile.chronicConditionsNotes,
            currentMedicationsNotes: clinicalProfile.currentMedicationsNotes,
          }
        : null,
      demographicProfile: demographicProfile
        ? {
            id: demographicProfile.id,
            preferredName: demographicProfile.preferredName,
            genderIdentity: demographicProfile.genderIdentity,
            preferredPronouns: demographicProfile.preferredPronouns,
            nationality: demographicProfile.nationality,
            countryOfBirth: demographicProfile.countryOfBirth,
            stateOfBirth: demographicProfile.stateOfBirth,
            ethnicGroup: demographicProfile.ethnicGroup,
          }
        : null,
      billingProfile: billingProfile
        ? {
            id: billingProfile.id,
            requiresInvoice: billingProfile.requiresInvoice,
            businessName: billingProfile.businessName,
            taxRfc: billingProfile.taxRfc,
            taxRegime: billingProfile.taxRegime,
            taxPostalCode: billingProfile.taxPostalCode,
            billingEmail: billingProfile.billingEmail,
            cfdiUse: billingProfile.cfdiUse,
          }
        : null,
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

  async updateForTenant(
    tenantId: string,
    patientId: string,
    input: UpdatePatientDto,
  ): Promise<PatientDetailResponse> {
    const existingPatient = await this.patientRepository.findById(patientId);

    if (!existingPatient || existingPatient.tenantId !== tenantId) {
      throw new NotFoundException('Paciente no encontrado');
    }

    this.validateUpdateInput(input);

    const fullName = this.buildFullName(input);
    const addressLine1 =
      input.addressLine1 ?? this.buildAddressLine1FromStructuredAddress(input);
    const addressLine2 =
      input.addressLine2 ?? this.buildAddressLine2FromStructuredAddress(input);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.patient.update({
          where: { id: patientId },
          data: {
            externalCode: input.externalCode ?? null,
            firstName: input.firstName,
            lastName: input.lastName,
            middleName: input.middleName ?? null,
            fullName,
            sexAtBirth: input.sexAtBirth,
            birthDate: input.birthDate ? new Date(input.birthDate) : null,
            ageSnapshot: input.ageSnapshot ?? null,
            maritalStatus: input.maritalStatus ?? null,
            bloodType: this.composeBloodType(
              input.bloodType,
              input.clinicalProfile?.rhFactor,
            ),
            curp: input.curp ?? null,
            rfc: input.rfc ?? null,
            phone: input.phone ?? null,
            alternatePhone: input.alternatePhone ?? null,
            email: input.email ?? null,
            addressLine1: addressLine1 ?? null,
            addressLine2: addressLine2 ?? null,
            city: input.city ?? null,
            state: input.state ?? null,
            postalCode: input.postalCode ?? null,
            country: input.country ?? 'MX',
            municipality: input.municipality ?? null,
            neighborhood: input.neighborhood ?? null,
            street: input.street ?? null,
            exteriorNumber: input.exteriorNumber ?? null,
            interiorNumber: input.interiorNumber ?? null,
            emergencyContactName:
              input.responsibleContact?.fullName ??
              input.emergencyContactName ??
              null,
            emergencyContactPhone:
              input.responsibleContact?.phone ??
              input.emergencyContactPhone ??
              null,
            emergencyContactRelation:
              input.responsibleContact?.relationship ??
              input.emergencyContactRelation ??
              null,
            patientStatus: input.patientStatus,
            patientType: input.patientType,
            medicalUnit: input.medicalUnit,
            hasKnownAllergies: input.hasKnownAllergies,
            allergiesNotes: input.hasKnownAllergies
              ? (input.allergiesNotes ?? null)
              : null,
            occupation: input.occupation ?? null,
            educationLevel: input.educationLevel ?? null,
            religion: input.religion ?? null,
            primaryLanguage: input.primaryLanguage ?? null,
            requiresTranslator: input.requiresTranslator ?? null,
            registrationSource: input.registrationSource ?? null,
            administrativeNotes: input.administrativeNotes ?? null,
            isActive: this.isActivePatientStatus(input.patientStatus),
          },
        });

        await this.syncPrimaryIdentifier(
          tx,
          tenantId,
          patientId,
          input.identifierType,
          input.identifierValue,
        );

        await this.syncResponsibleContact(
          tx,
          tenantId,
          patientId,
          input.responsibleContact,
        );
        await this.syncCoverages(
          tx,
          tenantId,
          patientId,
          input.coverages ?? [],
        );
        await this.syncPatientDocuments(
          tx,
          tenantId,
          patientId,
          input.documents ?? [],
        );
        await this.syncProfileAllergies(
          tx,
          tenantId,
          patientId,
          input.allergies ?? [],
        );
        await this.syncProfileProblems(
          tx,
          tenantId,
          patientId,
          input.problems ?? [],
        );
        await this.syncClinicalProfile(
          tx,
          tenantId,
          patientId,
          input.clinicalProfile,
        );
        await this.syncDemographicProfile(
          tx,
          tenantId,
          patientId,
          input.demographicProfile,
        );
        await this.syncBillingProfile(
          tx,
          tenantId,
          patientId,
          input.billingProfile,
        );
      });

      return this.getDetailByTenant(tenantId, patientId);
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
    query: PatientsQueryDto,
    patientIdsByIdentifier: string[],
  ): Prisma.PatientWhereInput {
    const search = query.search?.trim();
    const andConditions: Prisma.PatientWhereInput[] = [{ tenantId }];

    if (query.patientStatus) {
      andConditions.push({
        patientStatus: {
          equals: query.patientStatus,
          mode: 'insensitive',
        },
      });
    }

    if (query.sexAtBirth) {
      andConditions.push({
        sexAtBirth: query.sexAtBirth as never,
      });
    }

    if (query.allergiesFilter === 'with_allergies') {
      andConditions.push({
        hasKnownAllergies: true,
      });
    }

    if (query.allergiesFilter === 'without_allergies') {
      andConditions.push({
        hasKnownAllergies: false,
      });
    }

    if (!search) {
      return andConditions.length === 1 ? andConditions[0]! : { AND: andConditions };
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
      AND: [...andConditions, { OR: orConditions }],
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

  private async syncPrimaryIdentifier(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    identifierType: string | undefined,
    identifierValue: string | undefined,
  ) {
    const existingIdentifiers = await tx.patientIdentifier.findMany({
      where: {
        tenantId,
        patientId,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    const currentPrimaryIdentifier =
      existingIdentifiers.find((identifier) => identifier.isPrimary) ??
      existingIdentifiers[0] ??
      null;

    if (!identifierType && !identifierValue) {
      if (currentPrimaryIdentifier) {
        await tx.patientIdentifier.delete({
          where: { id: currentPrimaryIdentifier.id },
        });
      }

      return;
    }

    if (!identifierType || !identifierValue) {
      throw new BadRequestException(
        'El identificador principal requiere tipo y valor',
      );
    }

    await tx.patientIdentifier.updateMany({
      where: {
        tenantId,
        patientId,
        isPrimary: true,
        NOT: currentPrimaryIdentifier
          ? { id: currentPrimaryIdentifier.id }
          : undefined,
      },
      data: {
        isPrimary: false,
      },
    });

    if (currentPrimaryIdentifier) {
      await tx.patientIdentifier.update({
        where: { id: currentPrimaryIdentifier.id },
        data: {
          identifierType,
          identifierValue,
          isPrimary: true,
        },
      });

      return;
    }

    await tx.patientIdentifier.create({
      data: {
        tenantId,
        patientId,
        identifierType,
        identifierValue,
        isPrimary: true,
      },
    });
  }

  private async syncResponsibleContact(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    responsibleContact: UpdatePatientDto['responsibleContact'],
  ) {
    if (!responsibleContact) {
      await tx.patientResponsibleContact.deleteMany({
        where: {
          tenantId,
          patientId,
        },
      });
      return;
    }

    await tx.patientResponsibleContact.upsert({
      where: {
        patientId,
      },
      update: {
        fullName: responsibleContact.fullName,
        relationship: responsibleContact.relationship ?? null,
        phone: responsibleContact.phone,
        alternatePhone: responsibleContact.alternatePhone ?? null,
        email: responsibleContact.email ?? null,
        legalRepresentationType:
          responsibleContact.legalRepresentationType ?? null,
        addressLine1: responsibleContact.addressLine1 ?? null,
        addressLine2: responsibleContact.addressLine2 ?? null,
        city: responsibleContact.city ?? null,
        state: responsibleContact.state ?? null,
        postalCode: responsibleContact.postalCode ?? null,
        country: responsibleContact.country ?? 'MX',
        notes: responsibleContact.notes ?? null,
      },
      create: {
        tenantId,
        patientId,
        fullName: responsibleContact.fullName,
        relationship: responsibleContact.relationship ?? null,
        phone: responsibleContact.phone,
        alternatePhone: responsibleContact.alternatePhone ?? null,
        email: responsibleContact.email ?? null,
        legalRepresentationType:
          responsibleContact.legalRepresentationType ?? null,
        addressLine1: responsibleContact.addressLine1 ?? null,
        addressLine2: responsibleContact.addressLine2 ?? null,
        city: responsibleContact.city ?? null,
        state: responsibleContact.state ?? null,
        postalCode: responsibleContact.postalCode ?? null,
        country: responsibleContact.country ?? 'MX',
        notes: responsibleContact.notes ?? null,
      },
    });
  }

  private async syncCoverages(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    coverages: NonNullable<UpdatePatientDto['coverages']>,
  ) {
    await tx.patientCoverage.deleteMany({
      where: {
        tenantId,
        patientId,
      },
    });

    if (!coverages.length) {
      return;
    }

    await tx.patientCoverage.createMany({
      data: coverages.map((coverage, index) => ({
        tenantId,
        patientId,
        coverageType: coverage.coverageType,
        providerName: coverage.providerName,
        planName: coverage.planName ?? null,
        policyNumber: coverage.policyNumber ?? null,
        membershipNumber: coverage.membershipNumber ?? null,
        insuredPersonName: coverage.insuredPersonName ?? null,
        relationshipToInsured: coverage.relationshipToInsured ?? null,
        validFrom: coverage.validFrom ? new Date(coverage.validFrom) : null,
        validUntil: coverage.validUntil ? new Date(coverage.validUntil) : null,
        authorizationNotes: coverage.authorizationNotes ?? null,
        isPrimary:
          coverage.isPrimary ?? (index === 0 && coverages.length === 1),
      })),
    });
  }

  private async syncPatientDocuments(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    documents: NonNullable<UpdatePatientDto['documents']>,
  ) {
    await tx.patientDocument.deleteMany({
      where: {
        tenantId,
        patientId,
      },
    });

    if (!documents.length) {
      return;
    }

    await tx.patientDocument.createMany({
      data: documents.map((document, index) => ({
        tenantId,
        patientId,
        documentType: document.documentType,
        documentNumber: document.documentNumber,
        issuedBy: document.issuedBy ?? null,
        issuedAt: document.issuedAt ? new Date(document.issuedAt) : null,
        expiresAt: document.expiresAt ? new Date(document.expiresAt) : null,
        isPrimary:
          document.isPrimary ?? (index === 0 && documents.length === 1),
        notes: document.notes ?? null,
      })),
    });
  }

  private async syncProfileAllergies(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    allergies: NonNullable<UpdatePatientDto['allergies']>,
  ) {
    await tx.allergy.deleteMany({
      where: {
        tenantId,
        patientId,
        encounterId: null,
      },
    });

    if (!allergies.length) {
      return;
    }

    await tx.allergy.createMany({
      data: allergies.map((allergy) => ({
        tenantId,
        patientId,
        substance: allergy.substance,
        reaction: allergy.reaction ?? null,
        severity: allergy.severity ?? null,
        status: allergy.status ?? null,
      })),
    });
  }

  private async syncProfileProblems(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    problems: NonNullable<UpdatePatientDto['problems']>,
  ) {
    await tx.problem.deleteMany({
      where: {
        tenantId,
        patientId,
        encounterId: null,
      },
    });

    if (!problems.length) {
      return;
    }

    await tx.problem.createMany({
      data: problems.map((problem) => ({
        tenantId,
        patientId,
        description: problem.description,
        status: problem.status ?? null,
      })),
    });
  }

  private async syncClinicalProfile(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    clinicalProfile: UpdatePatientDto['clinicalProfile'],
  ) {
    if (!clinicalProfile) {
      await tx.patientClinicalProfile.deleteMany({
        where: {
          tenantId,
          patientId,
        },
      });
      return;
    }

    await tx.patientClinicalProfile.upsert({
      where: {
        patientId,
      },
      update: {
        organDonorStatus: clinicalProfile.organDonorStatus ?? null,
        rhFactor: clinicalProfile.rhFactor ?? null,
        pregnancyStatus: clinicalProfile.pregnancyStatus ?? null,
        disabilityNotes: clinicalProfile.disabilityNotes ?? null,
        clinicalAlerts: clinicalProfile.clinicalAlerts ?? null,
        clinicalObservations: clinicalProfile.clinicalObservations ?? null,
        chronicConditionsNotes: clinicalProfile.chronicConditionsNotes ?? null,
        currentMedicationsNotes:
          clinicalProfile.currentMedicationsNotes ?? null,
      },
      create: {
        tenantId,
        patientId,
        organDonorStatus: clinicalProfile.organDonorStatus ?? null,
        rhFactor: clinicalProfile.rhFactor ?? null,
        pregnancyStatus: clinicalProfile.pregnancyStatus ?? null,
        disabilityNotes: clinicalProfile.disabilityNotes ?? null,
        clinicalAlerts: clinicalProfile.clinicalAlerts ?? null,
        clinicalObservations: clinicalProfile.clinicalObservations ?? null,
        chronicConditionsNotes: clinicalProfile.chronicConditionsNotes ?? null,
        currentMedicationsNotes:
          clinicalProfile.currentMedicationsNotes ?? null,
      },
    });
  }

  private async syncDemographicProfile(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    demographicProfile: UpdatePatientDto['demographicProfile'],
  ) {
    if (!demographicProfile) {
      await tx.patientDemographicProfile.deleteMany({
        where: {
          tenantId,
          patientId,
        },
      });
      return;
    }

    await tx.patientDemographicProfile.upsert({
      where: {
        patientId,
      },
      update: {
        preferredName: demographicProfile.preferredName ?? null,
        genderIdentity: demographicProfile.genderIdentity ?? null,
        preferredPronouns: demographicProfile.preferredPronouns ?? null,
        nationality: demographicProfile.nationality ?? null,
        countryOfBirth: demographicProfile.countryOfBirth ?? null,
        stateOfBirth: demographicProfile.stateOfBirth ?? null,
        ethnicGroup: demographicProfile.ethnicGroup ?? null,
      },
      create: {
        tenantId,
        patientId,
        preferredName: demographicProfile.preferredName ?? null,
        genderIdentity: demographicProfile.genderIdentity ?? null,
        preferredPronouns: demographicProfile.preferredPronouns ?? null,
        nationality: demographicProfile.nationality ?? null,
        countryOfBirth: demographicProfile.countryOfBirth ?? null,
        stateOfBirth: demographicProfile.stateOfBirth ?? null,
        ethnicGroup: demographicProfile.ethnicGroup ?? null,
      },
    });
  }

  private async syncBillingProfile(
    tx: Prisma.TransactionClient,
    tenantId: string,
    patientId: string,
    billingProfile: UpdatePatientDto['billingProfile'],
  ) {
    const hasBillingPayload =
      billingProfile &&
      (billingProfile.requiresInvoice ||
        Boolean(
          billingProfile.businessName ||
            billingProfile.taxRfc ||
            billingProfile.taxRegime ||
            billingProfile.taxPostalCode ||
            billingProfile.billingEmail ||
            billingProfile.cfdiUse,
        ));

    if (!hasBillingPayload) {
      await tx.patientBillingProfile.deleteMany({
        where: {
          tenantId,
          patientId,
        },
      });
      return;
    }

    await tx.patientBillingProfile.upsert({
      where: {
        patientId,
      },
      update: {
        requiresInvoice: billingProfile.requiresInvoice,
        businessName: billingProfile.businessName ?? null,
        taxRfc: billingProfile.taxRfc ?? null,
        taxRegime: billingProfile.taxRegime ?? null,
        taxPostalCode: billingProfile.taxPostalCode ?? null,
        billingEmail: billingProfile.billingEmail ?? null,
        cfdiUse: billingProfile.cfdiUse ?? null,
      },
      create: {
        tenantId,
        patientId,
        requiresInvoice: billingProfile.requiresInvoice,
        businessName: billingProfile.businessName ?? null,
        taxRfc: billingProfile.taxRfc ?? null,
        taxRegime: billingProfile.taxRegime ?? null,
        taxPostalCode: billingProfile.taxPostalCode ?? null,
        billingEmail: billingProfile.billingEmail ?? null,
        cfdiUse: billingProfile.cfdiUse ?? null,
      },
    });
  }

  async uploadAttachmentsForTenant(
    tenantId: string,
    userId: string,
    patientId: string,
    files: UploadedAttachmentFile[],
  ) {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient || patient.tenantId !== tenantId) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (!files.length) {
      throw new BadRequestException('Selecciona al menos un archivo');
    }

    const uploadRoot = join(
      process.cwd(),
      'uploads',
      'patients',
      tenantId,
      patientId,
    );
    await mkdir(uploadRoot, { recursive: true });

    const createdAttachments: Array<{
      id: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: string;
      uploadedAt: string;
    }> = [];

    for (const file of files) {
      if (!file.buffer?.length) {
        throw new BadRequestException(
          'Uno de los archivos no contiene datos válidos',
        );
      }

      const storedFileName = `${randomUUID()}-${this.sanitizeFileName(
        file.originalname,
      )}`;
      const absoluteStoragePath = join(uploadRoot, storedFileName);

      await writeFile(absoluteStoragePath, file.buffer);

      const attachment = await this.prisma.attachment.create({
        data: {
          tenantId,
          patientId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          storageKey: absoluteStoragePath,
          fileSizeBytes: BigInt(file.size),
          uploadedByUserId: userId,
          metadataJson: {
            origin: 'patient-profile',
            section: 'documentos',
          },
        },
      });

      createdAttachments.push({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSizeBytes: attachment.fileSizeBytes.toString(),
        uploadedAt: attachment.uploadedAt.toISOString(),
      });
    }

    return createdAttachments;
  }

  async deleteAttachmentForTenant(
    tenantId: string,
    patientId: string,
    attachmentId: string,
  ) {
    const attachment = await this.prisma.attachment.findUnique({
      where: {
        id: attachmentId,
      },
    });

    if (
      !attachment ||
      attachment.tenantId !== tenantId ||
      attachment.patientId !== patientId
    ) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    await this.prisma.attachment.delete({
      where: {
        id: attachmentId,
      },
    });

    await unlink(attachment.storageKey).catch(() => undefined);

    return { success: true };
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
   * Editing reuses the same safety invariants as admission so the profile
   * cannot drift into a shape the rest of the clinical flow does not expect.
   */
  private validateUpdateInput(input: UpdatePatientDto) {
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
        'La ciudad y el estado son obligatorios para editar el perfil',
      );
    }

    if (input.curp && !CURP_REGEX.test(input.curp)) {
      throw new BadRequestException('La CURP capturada no es valida');
    }

    if (input.rfc && !RFC_REGEX.test(input.rfc)) {
      throw new BadRequestException('El RFC capturado no es valido');
    }

    if (input.hasKnownAllergies && !input.allergiesNotes) {
      throw new BadRequestException(
        'Debes detallar las alergias conocidas del paciente',
      );
    }

    if (
      input.responsibleContact?.phone &&
      !PHONE_REGEX.test(input.responsibleContact.phone)
    ) {
      throw new BadRequestException(
        'El telefono del responsable tiene formato invalido',
      );
    }

    if (
      input.emergencyContactPhone &&
      !PHONE_REGEX.test(input.emergencyContactPhone)
    ) {
      throw new BadRequestException(
        'El telefono de emergencia tiene formato invalido',
      );
    }

    if (
      input.billingProfile?.requiresInvoice &&
      (!input.billingProfile.businessName ||
        !input.billingProfile.taxRfc ||
        !input.billingProfile.taxRegime ||
        !input.billingProfile.taxPostalCode ||
        !input.billingProfile.billingEmail ||
        !input.billingProfile.cfdiUse)
    ) {
      throw new BadRequestException(
        'Completa todos los datos fiscales cuando el paciente requiere factura',
      );
    }

    const primaryCoverageCount =
      input.coverages?.filter((coverage) => coverage.isPrimary).length ?? 0;
    if (primaryCoverageCount > 1) {
      throw new BadRequestException(
        'Solo puede existir una cobertura primaria',
      );
    }

    const primaryDocumentCount =
      input.documents?.filter((document) => document.isPrimary).length ?? 0;
    if (primaryDocumentCount > 1) {
      throw new BadRequestException('Solo puede existir un documento primario');
    }
  }

  /**
   * The historical UI expects a compact primary address line, so the richer
   * structured address coming from the new form is flattened here as a bridge.
   */
  private buildAddressLine1FromStructuredAddress(
    input: Pick<CreatePatientDto, 'street' | 'exteriorNumber'>,
  ) {
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
  private buildAddressLine2FromStructuredAddress(
    input: Pick<
      CreatePatientDto,
      'interiorNumber' | 'neighborhood' | 'municipality'
    >,
  ) {
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

  private composeBloodType(
    bloodType: string | undefined,
    rhFactor: string | undefined,
  ) {
    if (!bloodType) {
      return null;
    }

    if (rhFactor === 'POSITIVO') {
      return `${bloodType}+`;
    }

    if (rhFactor === 'NEGATIVO') {
      return `${bloodType}-`;
    }

    return bloodType;
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private buildAgeLabel(birthDate: Date | null, ageSnapshot: number | null) {
    if (birthDate) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthDate.getDate())
      ) {
        age -= 1;
      }

      return age >= 0 ? `${age} años` : null;
    }

    return ageSnapshot !== null ? `${ageSnapshot} años` : null;
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
