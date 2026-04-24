import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  AdmissionSource,
  EncounterRecordStatus,
  EncounterStatus,
  EncounterType,
  Prisma,
} from '@prisma/client';
import { FACILITY_REPOSITORY } from '../../../shared/persistence/tokens/facility.token';
import { PATIENT_REPOSITORY } from '../../../shared/persistence/tokens/patient.token';
import { USER_REPOSITORY } from '../../../shared/persistence/tokens/user.token';
import type { FacilityRepository } from '../../../shared/persistence/repositories/facility.repository';
import type { PatientRepository } from '../../../shared/persistence/repositories/patient.repository';
import type { UserRepository } from '../../../shared/persistence/repositories/user.repository';
import { PrismaService } from '../../../shared/persistence/prisma/prisma.service';
import { PasswordService } from '../../../auth/application/services/password.service';
import { CreateEncounterDto } from '../../create-encounter.dto';
import { UpdateEncounterDto } from '../../update-encounter.dto';
import { EncountersQueryDto } from '../dto/encounters-query.dto';
import { EncounterSectionRecordMutationDto } from '../dto/encounter-section-record.dto';
import type {
  EncounterDetailResponse,
  EncounterListItemResponse,
  EncounterMetaResponse,
  EncountersListResponse,
} from '../dto/encounter.response';

type TenantEncounterRecord = Prisma.EncounterGetPayload<{
  include: {
    patient: true;
    facility: true;
    serviceArea: true;
    specialty: true;
    medicalRecord: true;
    clinicalDocuments: {
      select: {
        id: true;
        title: true;
        status: true;
        documentDate: true;
        author: {
          select: {
            fullName: true;
          };
        };
      };
      orderBy: {
        documentDate: 'desc';
      };
      take: 5;
    };
    vitalSigns: {
      orderBy: {
        takenAt: 'desc';
      };
      take: 1;
    };
    diagnoses: {
      orderBy: {
        isPrimary: 'desc';
      };
    };
    problems: {
      orderBy: {
        createdAt: 'desc';
      };
    };
    allergies: {
      orderBy: {
        createdAt: 'desc';
      };
    };
    medicationStatements: {
      select: {
        id: true;
      };
    };
    labRequests: {
      select: {
        id: true;
      };
    };
    imagingRequests: {
      select: {
        id: true;
      };
    };
    attachments: {
      orderBy: {
        uploadedAt: 'desc';
      };
      select: {
        id: true;
        fileName: true;
        mimeType: true;
        fileSizeBytes: true;
        uploadedAt: true;
      };
    };
    sectionRecords: {
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }];
      include: {
        authoredByUser: {
          select: {
            fullName: true;
            professionalLicense: true;
          };
        };
      };
    };
    profile: true;
  };
}>;

type CreateContext = {
  tenantId: string;
  userId: string;
};

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const encounterTypeLabels: Record<EncounterType, string> = {
  OUTPATIENT: 'Consulta',
  EMERGENCY: 'Urgencia',
  HOSPITALIZATION: 'Hospitalizacion',
  SURGERY: 'Procedimiento',
  FOLLOW_UP: 'Seguimiento',
};

const encounterStatusLabels: Record<EncounterStatus, string> = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

const admissionSourceLabels: Record<AdmissionSource, string> = {
  CONSULTATION: 'Consulta',
  EMERGENCY: 'Urgencias',
  TRANSFER: 'Traslado',
  SURGERY: 'Cirugia',
  OTHER: 'Otro',
};

const encounterTabsByType: Record<EncounterType, string[]> = {
  OUTPATIENT: [
    'Resumen',
    'Historia clínica',
    'Consulta actual',
    'Evolución',
    'Receta / Indicaciones',
    'Documentos',
  ],
  EMERGENCY: [
    'Resumen',
    'Triage',
    'Nota inicial',
    'Evolución',
    'Órdenes / Indicaciones',
    'Interconsultas',
    'Egreso',
    'Documentos',
  ],
  HOSPITALIZATION: [
    'Resumen',
    'Ingreso',
    'Evolución',
    'Indicaciones médicas',
    'Interconsultas',
    'Procedimientos / Cirugía',
    'Enfermería',
    'Egreso',
    'Documentos',
  ],
  SURGERY: [
    'Resumen',
    'Valoración preprocedimiento',
    'Procedimiento',
    'Recuperación / Evolución',
    'Indicaciones / Receta',
    'Egreso',
    'Documentos',
  ],
  FOLLOW_UP: [
    'Resumen',
    'Historia clínica',
    'Seguimiento',
    'Evolución',
    'Indicaciones',
    'Documentos',
  ],
};

const supportedEncounterTypesForUi = new Set<EncounterType>([
  EncounterType.OUTPATIENT,
  EncounterType.EMERGENCY,
  EncounterType.HOSPITALIZATION,
  EncounterType.SURGERY,
]);

@Injectable()
export class EncountersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(FACILITY_REPOSITORY)
    private readonly facilityRepository: FacilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async listByTenant(
    tenantId: string,
    query: EncountersQueryDto,
  ): Promise<EncountersListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildEncounterSearchWhere(tenantId, query);

    const [encounters, total] = await Promise.all([
      this.prisma.encounter.findMany({
        where,
        orderBy: [{ openedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: {
          patient: true,
          facility: true,
          serviceArea: true,
          specialty: true,
          diagnoses: {
            select: { id: true },
          },
          clinicalDocuments: {
            select: { id: true },
          },
          allergies: {
            select: { substance: true },
          },
        },
      }),
      this.prisma.encounter.count({ where }),
    ]);

    const clinicianIds = [
      ...new Set(
        encounters
          .map((encounter) => encounter.attendingUserId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const clinicians =
      clinicianIds.length > 0
        ? await this.userRepository.findMany({
            where: {
              id: { in: clinicianIds },
            },
          } satisfies Prisma.UserFindManyArgs)
        : [];
    const cliniciansById = new Map(
      clinicians.map((clinician) => [clinician.id, clinician]),
    );

    return {
      items: encounters.map((encounter) => ({
        id: encounter.id,
        encounterNumber: encounter.encounterNumber,
        encounterType: encounter.encounterType,
        status: encounter.status,
        admissionSource: encounter.admissionSource,
        openedAt: encounter.openedAt.toISOString(),
        closedAt: encounter.closedAt?.toISOString() ?? null,
        updatedAt: encounter.updatedAt.toISOString(),
        reasonForVisit: encounter.reasonForVisit,
        patient: {
          id: encounter.patient.id,
          fullName: encounter.patient.fullName,
          curp: encounter.patient.curp,
          ageLabel: this.buildAgeLabel(
            encounter.patient.birthDate,
            encounter.patient.ageSnapshot,
          ),
          sexAtBirth: encounter.patient.sexAtBirth,
        },
        facility: encounter.facility
          ? {
              id: encounter.facility.id,
              code: encounter.facility.code,
              name: encounter.facility.name,
            }
          : null,
        serviceArea: encounter.serviceArea
          ? {
              id: encounter.serviceArea.id,
              name: encounter.serviceArea.name,
            }
          : null,
        specialty: encounter.specialty
          ? {
              id: encounter.specialty.id,
              name: encounter.specialty.name,
            }
          : null,
        attendingClinician: encounter.attendingUserId
          ? {
              id: encounter.attendingUserId,
              fullName:
                cliniciansById.get(encounter.attendingUserId)?.fullName ??
                'Profesional no disponible',
            }
          : null,
        activeAlerts: encounter.allergies
          .slice(0, 3)
          .map((allergy) => allergy.substance),
        documentCount: encounter.clinicalDocuments.length,
        diagnosisCount: encounter.diagnoses.length,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getMetaByTenant(
    tenantId: string,
    userId: string,
  ): Promise<EncounterMetaResponse> {
    const [patients, facilities, serviceAreas, specialties, clinicians, user] =
      await Promise.all([
        this.patientRepository.findMany({
          where: {
            tenantId,
            isActive: true,
          },
          orderBy: { fullName: 'asc' },
        } satisfies Prisma.PatientFindManyArgs),
        this.facilityRepository.findMany({
          where: {
            tenantId,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        } satisfies Prisma.FacilityFindManyArgs),
        this.prisma.serviceArea.findMany({
          where: { tenantId },
          orderBy: { name: 'asc' },
        }),
        this.prisma.specialty.findMany({
          where: {
            tenantId,
            isActive: true,
          },
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.userRepository.findMany({
          where: {
            tenantId,
            status: 'ACTIVE',
          },
          orderBy: { fullName: 'asc' },
        } satisfies Prisma.UserFindManyArgs),
        this.userRepository.findById(userId),
      ]);

    const facilitiesOrdered = [...facilities].sort((left, right) => {
      if (user?.facilityId === left.id) return -1;
      if (user?.facilityId === right.id) return 1;
      return left.name.localeCompare(right.name);
    });

    return {
      encounterTypes: Object.entries(encounterTypeLabels).map(
        ([value, label]) => ({ value, label }),
      ).filter((option) =>
        supportedEncounterTypesForUi.has(option.value as EncounterType),
      ),
      encounterStatuses: Object.entries(encounterStatusLabels).map(
        ([value, label]) => ({
          value,
          label,
        }),
      ),
      admissionSources: Object.entries(admissionSourceLabels).map(
        ([value, label]) => ({
          value,
          label,
        }),
      ),
      patients: patients.map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        curp: patient.curp,
        patientStatus: patient.patientStatus,
        medicalUnit: patient.medicalUnit,
      })),
      facilities: facilitiesOrdered.map((facility) => ({
        id: facility.id,
        code: facility.code,
        name: facility.name,
      })),
      serviceAreas: serviceAreas.map((serviceArea) => ({
        id: serviceArea.id,
        name: serviceArea.name,
        facilityId: serviceArea.facilityId,
        specialtyId: serviceArea.specialtyId,
      })),
      specialties: specialties.map((specialty) => ({
        id: specialty.id,
        code: specialty.code,
        name: specialty.name,
        category: specialty.category,
      })),
      clinicians: clinicians.map((clinician) => ({
        id: clinician.id,
        fullName: clinician.fullName,
        facilityId: clinician.facilityId,
        professionalLicense: clinician.professionalLicense,
      })),
    };
  }

  async getDetailByTenant(
    tenantId: string,
    encounterNumber: string,
  ): Promise<EncounterDetailResponse> {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);

    return this.toEncounterDetailResponse(
      encounter,
      encounter.attendingUserId
        ? await this.userRepository.findById(encounter.attendingUserId)
        : null,
    );
  }

  async createForTenant(
    context: CreateContext,
    input: CreateEncounterDto,
  ): Promise<EncounterDetailResponse> {
    const patient = await this.patientRepository.findById(input.patientId);

    if (!patient || patient.tenantId !== context.tenantId) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const facility = await this.resolveFacility(
      context.tenantId,
      context.userId,
      input.facilityId,
    );

    const relatedCatalogs = await this.resolveEncounterRelations({
      tenantId: context.tenantId,
      facilityId: facility.id,
      specialtyId: input.specialtyId,
      attendingUserId: input.attendingUserId,
    });

    const openedAt = input.openedAt ? new Date(input.openedAt) : new Date();
    const status = EncounterStatus.OPEN;
    const closedAt =
      input.closedAt !== undefined
        ? new Date(input.closedAt)
        : status === EncounterStatus.OPEN
          ? null
          : new Date();

    if (closedAt && closedAt < openedAt) {
      throw new BadRequestException(
        'La fecha de cierre no puede ser anterior a la apertura',
      );
    }

    const encounterNumber = await this.generateEncounterNumber(facility.id, openedAt);

    const result = await this.prisma.$transaction(async (tx) => {
      const medicalRecord = await tx.medicalRecord.findFirst({
        where: {
          tenantId: context.tenantId,
          patientId: patient.id,
          facilityId: facility.id,
        },
        orderBy: [{ lastEncounterAt: 'desc' }, { openedAt: 'desc' }],
      });

      const medicalRecordId =
        medicalRecord?.id ??
        (
          await tx.medicalRecord.create({
            data: {
              tenantId: context.tenantId,
              facilityId: facility.id,
              patientId: patient.id,
              recordNumber: await this.generateMedicalRecordNumber(
                tx,
                context.tenantId,
                facility.code,
              ),
              status: 'ACTIVE',
              openedAt,
              lastEncounterAt: openedAt,
            },
          })
        ).id;

      const encounter = await tx.encounter.create({
        data: {
          tenantId: context.tenantId,
          facilityId: facility.id,
          serviceAreaId: relatedCatalogs.serviceAreaId,
          specialtyId: relatedCatalogs.specialtyId,
          medicalRecordId,
          patientId: patient.id,
          encounterNumber,
          encounterType: input.encounterType,
          status,
          admissionSource: null,
          openedAt,
          closedAt,
          attendingUserId: relatedCatalogs.attendingUserId,
          reasonForVisit: input.reasonForVisit,
          notes: input.notes,
        },
      });

      await tx.encounterProfile.create({
        data: {
          tenantId: context.tenantId,
          encounterId: encounter.id,
          encounterType: input.encounterType,
          sectionsJson: this.buildDefaultStructuredSections(input.encounterType),
          alertsJson: [],
        },
      });

      await tx.medicalRecord.update({
        where: { id: medicalRecordId },
        data: {
          lastEncounterAt: openedAt,
        },
      });

      return encounter.id;
    });

    const createdEncounter = await this.findEncounterById(context.tenantId, result);
    return this.toEncounterDetailResponse(
      createdEncounter,
      createdEncounter.attendingUserId
        ? await this.userRepository.findById(createdEncounter.attendingUserId)
        : null,
    );
  }

  async updateForTenant(
    tenantId: string,
    encounterNumber: string,
    input: UpdateEncounterDto,
  ): Promise<EncounterDetailResponse> {
    const currentEncounter = await this.findEncounterByNumber(
      tenantId,
      encounterNumber,
    );

    const facilityId = input.facilityId ?? currentEncounter.facilityId;

    const relatedCatalogs = await this.resolveEncounterRelations({
      tenantId,
      facilityId,
      serviceAreaId:
        input.serviceAreaId === undefined
          ? currentEncounter.serviceAreaId ?? undefined
          : input.serviceAreaId,
      specialtyId:
        input.specialtyId === undefined
          ? currentEncounter.specialtyId ?? undefined
          : input.specialtyId,
      attendingUserId:
        input.attendingUserId === undefined
          ? currentEncounter.attendingUserId ?? undefined
          : input.attendingUserId,
    });

    const openedAt = input.openedAt
      ? new Date(input.openedAt)
      : currentEncounter.openedAt;
    const nextStatus = input.status ?? currentEncounter.status;
    const closedAt =
      input.closedAt !== undefined
        ? new Date(input.closedAt)
        : nextStatus === EncounterStatus.OPEN
          ? null
          : currentEncounter.closedAt ?? new Date();

    if (closedAt && closedAt < openedAt) {
      throw new BadRequestException(
        'La fecha de cierre no puede ser anterior a la apertura',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.encounter.update({
        where: { id: currentEncounter.id },
        data: {
          facilityId,
          serviceAreaId: relatedCatalogs.serviceAreaId,
          specialtyId: relatedCatalogs.specialtyId,
          attendingUserId: relatedCatalogs.attendingUserId,
          encounterType: input.encounterType ?? currentEncounter.encounterType,
          status: nextStatus,
          admissionSource:
            input.admissionSource === undefined
              ? currentEncounter.admissionSource
              : input.admissionSource,
          openedAt,
          closedAt,
          reasonForVisit:
            input.reasonForVisit === undefined
              ? currentEncounter.reasonForVisit
              : input.reasonForVisit,
          notes: input.notes === undefined ? currentEncounter.notes : input.notes,
        },
      });

      if (input.structuredSections) {
        await tx.encounterProfile.upsert({
          where: {
            encounterId: currentEncounter.id,
          },
          update: {
            encounterType:
              input.encounterType ?? currentEncounter.encounterType,
            sectionsJson: input.structuredSections as Prisma.InputJsonValue,
          },
          create: {
            tenantId,
            encounterId: currentEncounter.id,
            encounterType:
              input.encounterType ?? currentEncounter.encounterType,
            sectionsJson: input.structuredSections as Prisma.InputJsonValue,
            alertsJson: [],
          },
        });
      } else if (input.encounterType && input.encounterType !== currentEncounter.encounterType) {
        await tx.encounterProfile.upsert({
          where: {
            encounterId: currentEncounter.id,
          },
          update: {
            encounterType: input.encounterType,
            sectionsJson: this.ensureStructuredSections(
              input.encounterType,
              currentEncounter.profile?.sectionsJson ?? null,
            ) as Prisma.InputJsonValue,
          },
          create: {
            tenantId,
            encounterId: currentEncounter.id,
            encounterType: input.encounterType,
            sectionsJson: this.buildDefaultStructuredSections(input.encounterType),
            alertsJson: [],
          },
        });
      }

      await tx.medicalRecord.update({
        where: { id: currentEncounter.medicalRecordId },
        data: {
          facilityId,
          lastEncounterAt: openedAt,
        },
      });
    });

    const updatedEncounter = await this.findEncounterById(
      tenantId,
      currentEncounter.id,
    );
    return this.toEncounterDetailResponse(
      updatedEncounter,
      updatedEncounter.attendingUserId
        ? await this.userRepository.findById(updatedEncounter.attendingUserId)
        : null,
    );
  }

  async createSectionRecordForTenant(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    input: EncounterSectionRecordMutationDto,
  ): Promise<EncounterDetailResponse> {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    this.assertRecordTabAllowed(encounter.encounterType, input.tabKey);
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
    const responsibleUser = encounter.attendingUserId
      ? await this.userRepository.findById(encounter.attendingUserId)
      : null;
    const historyVersionContext = await this.resolveHistoryVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
    });
    const consultationVersionContext = await this.resolveConsultationVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
    });
    const normalizedRecordPayload = this.normalizeSectionRecordPayload({
      encounter,
      input,
      recordedAt,
      currentRecord: null,
      historyVersionContext,
      consultationVersionContext,
      responsibleUser,
    });

    await this.prisma.encounterSectionRecord.create({
      data: {
        tenantId,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        encounterType: encounter.encounterType,
        tabKey: normalizedRecordPayload.tabKey,
        noteType: normalizedRecordPayload.noteType,
        title: normalizedRecordPayload.title,
        status: normalizedRecordPayload.status,
        recordedAt,
        authoredByUserId: userId,
        formDataJson: normalizedRecordPayload.formData as Prisma.InputJsonValue,
        metadataJson: normalizedRecordPayload.metadata as Prisma.InputJsonValue,
        signedAt:
          normalizedRecordPayload.status === EncounterRecordStatus.SIGNED
            ? new Date()
            : null,
      },
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return this.toEncounterDetailResponse(
      updatedEncounter,
      updatedEncounter.attendingUserId
        ? await this.userRepository.findById(updatedEncounter.attendingUserId)
        : null,
    );
  }

  async updateSectionRecordForTenant(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    recordId: string,
    input: EncounterSectionRecordMutationDto,
  ): Promise<EncounterDetailResponse> {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    const currentRecord = await this.prisma.encounterSectionRecord.findUnique({
      where: { id: recordId },
    });

    if (
      !currentRecord ||
      currentRecord.tenantId !== tenantId ||
      currentRecord.encounterId !== encounter.id
    ) {
      throw new NotFoundException('Registro del episodio no encontrado');
    }

    if (currentRecord.status === EncounterRecordStatus.SIGNED) {
      throw new BadRequestException(
        'El registro ya fue firmado y no puede modificarse',
      );
    }

    this.assertRecordTabAllowed(encounter.encounterType, input.tabKey);
    const recordedAt = input.recordedAt
      ? new Date(input.recordedAt)
      : currentRecord.recordedAt;
    const responsibleUser = encounter.attendingUserId
      ? await this.userRepository.findById(encounter.attendingUserId)
      : null;
    const historyVersionContext = await this.resolveHistoryVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      currentRecordId: currentRecord.id,
    });
    const consultationVersionContext = await this.resolveConsultationVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      currentRecordId: currentRecord.id,
    });
    const normalizedRecordPayload = this.normalizeSectionRecordPayload({
      encounter,
      input,
      recordedAt,
      currentRecord,
      historyVersionContext,
      consultationVersionContext,
      responsibleUser,
    });

    await this.prisma.encounterSectionRecord.update({
      where: { id: recordId },
      data: {
        tabKey: normalizedRecordPayload.tabKey,
        noteType: normalizedRecordPayload.noteType,
        title: normalizedRecordPayload.title,
        status: normalizedRecordPayload.status,
        recordedAt,
        authoredByUserId: userId,
        formDataJson: normalizedRecordPayload.formData as Prisma.InputJsonValue,
        metadataJson: normalizedRecordPayload.metadata as Prisma.InputJsonValue,
        signedAt:
          normalizedRecordPayload.status === EncounterRecordStatus.SIGNED
            ? currentRecord.signedAt ?? new Date()
            : null,
      },
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return this.toEncounterDetailResponse(
      updatedEncounter,
      updatedEncounter.attendingUserId
        ? await this.userRepository.findById(updatedEncounter.attendingUserId)
        : null,
    );
  }

  async signSectionRecordForTenant(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    recordId: string,
    password: string,
  ): Promise<EncounterDetailResponse> {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    const [currentRecord, currentUser] = await Promise.all([
      this.prisma.encounterSectionRecord.findUnique({
        where: { id: recordId },
      }),
      this.userRepository.findById(userId),
    ]);

    if (
      !currentRecord ||
      currentRecord.tenantId !== tenantId ||
      currentRecord.encounterId !== encounter.id
    ) {
      throw new NotFoundException('Registro del episodio no encontrado');
    }

    if (!currentUser) {
      throw new NotFoundException('Usuario firmante no encontrado');
    }

    if (currentRecord.status === EncounterRecordStatus.SIGNED) {
      throw new BadRequestException('El registro ya fue firmado');
    }

    const passwordMatches = await this.passwordService.compare(
      password,
      currentUser.passwordHash,
    );

    if (!passwordMatches) {
      throw new BadRequestException('La contraseña capturada no es correcta');
    }

    const currentMetadata = this.normalizeRecordMetadata(currentRecord.metadataJson) ?? {};

    await this.prisma.encounterSectionRecord.update({
      where: { id: recordId },
      data: {
        status: EncounterRecordStatus.SIGNED,
        signedAt: new Date(),
        metadataJson: {
          ...currentMetadata,
          signedByUserId: currentUser.id,
          signedByUserName: currentUser.fullName,
          signedWithPasswordValidation: true,
        } as Prisma.InputJsonValue,
      },
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return this.toEncounterDetailResponse(
      updatedEncounter,
      updatedEncounter.attendingUserId
        ? await this.userRepository.findById(updatedEncounter.attendingUserId)
        : null,
    );
  }

  async uploadAttachmentsForTenant(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    files: UploadedAttachmentFile[],
  ) {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);

    if (!files.length) {
      throw new BadRequestException('Selecciona al menos un archivo');
    }

    const uploadRoot = join(
      process.cwd(),
      'uploads',
      'encounters',
      tenantId,
      encounter.id,
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
          encounterId: encounter.id,
          patientId: encounter.patientId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          storageKey: absoluteStoragePath,
          fileSizeBytes: BigInt(file.size),
          uploadedByUserId: userId,
          metadataJson: {
            origin: 'encounter-detail',
            section: 'documentos',
            encounterNumber: encounter.encounterNumber,
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
    encounterNumber: string,
    attachmentId: string,
  ) {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (
      !attachment ||
      attachment.tenantId !== tenantId ||
      attachment.encounterId !== encounter.id
    ) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });
    await unlink(attachment.storageKey).catch(() => undefined);

    return { success: true };
  }

  private buildEncounterSearchWhere(
    tenantId: string,
    query: EncountersQueryDto,
  ): Prisma.EncounterWhereInput {
    const search = query.search?.trim();

    return {
      tenantId,
      encounterType: query.encounterType,
      status: query.status,
      admissionSource: query.admissionSource,
      facilityId: query.facilityId,
      patientId: query.patientId,
      ...(search
        ? {
            OR: [
              {
                encounterNumber: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                reasonForVisit: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                patient: {
                  fullName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                patient: {
                  curp: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private async resolveFacility(
    tenantId: string,
    userId: string,
    requestedFacilityId?: string,
  ) {
    const fallbackFacilityId = (await this.userRepository.findById(userId))
      ?.facilityId;
    const facilityId = requestedFacilityId ?? fallbackFacilityId;

    if (!facilityId) {
      throw new BadRequestException(
        'No fue posible determinar la sede del episodio',
      );
    }

    const facility = await this.facilityRepository.findById(facilityId);

    if (!facility || facility.tenantId !== tenantId || !facility.isActive) {
      throw new NotFoundException('Sede no encontrada');
    }

    return facility;
  }

  private async resolveEncounterRelations(input: {
    tenantId: string;
    facilityId: string;
    serviceAreaId?: string;
    specialtyId?: string;
    attendingUserId?: string;
  }) {
    const serviceArea =
      input.serviceAreaId === undefined
        ? null
        : await this.prisma.serviceArea.findFirst({
            where: {
              id: input.serviceAreaId,
              tenantId: input.tenantId,
              facilityId: input.facilityId,
            },
          });

    if (input.serviceAreaId && !serviceArea) {
      throw new NotFoundException('Area de servicio no encontrada');
    }

    const specialtyId = input.specialtyId ?? serviceArea?.specialtyId ?? null;

    if (specialtyId) {
      const specialty = await this.prisma.specialty.findFirst({
        where: {
          id: specialtyId,
          tenantId: input.tenantId,
          isActive: true,
        },
      });

      if (!specialty) {
        throw new NotFoundException('Especialidad no encontrada');
      }
    }

    if (input.attendingUserId) {
      const clinician = await this.userRepository.findById(input.attendingUserId);
      if (!clinician || clinician.tenantId !== input.tenantId) {
        throw new NotFoundException('Profesional responsable no encontrado');
      }
    }

    return {
      serviceAreaId: serviceArea?.id ?? null,
      specialtyId,
      attendingUserId: input.attendingUserId ?? null,
    };
  }

  private async generateEncounterNumber(facilityId: string, openedAt: Date) {
    const year = openedAt.getUTCFullYear();
    const periodStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

    const yearlyCount = await this.prisma.encounter.count({
      where: {
        facilityId,
        openedAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    });

    return `EP-${year}-${String(yearlyCount + 1).padStart(4, '0')}`;
  }

  private async generateMedicalRecordNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
    facilityCode: string,
  ) {
    const existingCount = await tx.medicalRecord.count({
      where: { tenantId },
    });
    const codePrefix =
      facilityCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'GEN';

    return `EXP-${codePrefix}-${String(existingCount + 1).padStart(4, '0')}`;
  }

  private async findEncounterByNumber(
    tenantId: string,
    encounterNumber: string,
  ): Promise<TenantEncounterRecord> {
    const encounter = await this.prisma.encounter.findFirst({
      where: {
        tenantId,
        encounterNumber,
      },
      include: this.encounterDetailInclude(),
    });

    if (!encounter) {
      throw new NotFoundException('Episodio no encontrado');
    }

    return encounter;
  }

  private async findEncounterById(
    tenantId: string,
    encounterId: string,
  ): Promise<TenantEncounterRecord> {
    const encounter = await this.prisma.encounter.findFirst({
      where: {
        tenantId,
        id: encounterId,
      },
      include: this.encounterDetailInclude(),
    });

    if (!encounter) {
      throw new NotFoundException('Episodio no encontrado');
    }

    return encounter;
  }

  private encounterDetailInclude() {
    return {
      patient: true,
      facility: true,
      serviceArea: true,
      specialty: true,
      medicalRecord: true,
      clinicalDocuments: {
        select: {
          id: true,
          title: true,
          status: true,
          documentDate: true,
          author: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          documentDate: 'desc' as const,
        },
        take: 5,
      },
      vitalSigns: {
        orderBy: {
          takenAt: 'desc' as const,
        },
        take: 1,
      },
      diagnoses: {
        orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'desc' as const }],
      },
      problems: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      allergies: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      medicationStatements: {
        select: {
          id: true,
        },
      },
      labRequests: {
        select: {
          id: true,
        },
      },
      imagingRequests: {
        select: {
          id: true,
        },
      },
      attachments: {
        orderBy: {
          uploadedAt: 'desc' as const,
        },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          fileSizeBytes: true,
          uploadedAt: true,
        },
      },
      sectionRecords: {
        orderBy: [{ recordedAt: 'desc' as const }, { createdAt: 'desc' as const }],
        include: {
          authoredByUser: {
            select: {
              fullName: true,
              professionalLicense: true,
            },
          },
        },
      },
      profile: true,
    };
  }

  private toEncounterDetailResponse(
    encounter: TenantEncounterRecord,
    attendingClinician: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null,
  ): EncounterDetailResponse {
    const latestVitalSign = encounter.vitalSigns[0] ?? null;
    const sectionRecords = encounter.sectionRecords.map((record) => ({
      id: record.id,
      tabKey: record.tabKey,
      noteType: record.noteType,
      title: record.title,
      status: record.status,
      recordedAt: record.recordedAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      signedAt: record.signedAt?.toISOString() ?? null,
      authorName: record.authoredByUser?.fullName ?? null,
      authorLicense: record.authoredByUser?.professionalLicense ?? null,
      formData:
        record.formDataJson &&
        typeof record.formDataJson === 'object' &&
        !Array.isArray(record.formDataJson)
          ? (record.formDataJson as Record<string, unknown>)
          : {},
      metadata: this.extractRecordVersionMetadata(record.metadataJson),
    }));
    const attachments = encounter.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSizeBytes: attachment.fileSizeBytes.toString(),
      uploadedAt: attachment.uploadedAt.toISOString(),
    }));
    const timeline = [
      {
        id: `${encounter.id}-created`,
        label: 'Episodio abierto',
        timestamp: encounter.openedAt.toISOString(),
        detail: encounter.reasonForVisit ?? 'Sin motivo de consulta capturado',
        kind: 'episode' as const,
      },
      ...encounter.clinicalDocuments.map((document) => ({
        id: document.id,
        label: document.title,
        timestamp: document.documentDate.toISOString(),
        detail: document.author?.fullName ?? 'Sin autor',
        kind: 'document' as const,
      })),
      ...sectionRecords.slice(0, 8).map((record) => ({
        id: record.id,
        label: record.title,
        timestamp: record.updatedAt,
        detail: `${record.noteType} · ${record.authorName ?? 'Sin autor'}`,
        kind: 'record' as const,
      })),
      ...attachments.slice(0, 8).map((attachment) => ({
        id: attachment.id,
        label: attachment.fileName,
        timestamp: attachment.uploadedAt,
        detail: 'Adjunto del episodio',
        kind: 'attachment' as const,
      })),
      ...encounter.diagnoses.slice(0, 3).map((diagnosis) => ({
        id: diagnosis.id,
        label: diagnosis.code
          ? `${diagnosis.code} · ${diagnosis.description}`
          : diagnosis.description,
        timestamp: diagnosis.createdAt.toISOString(),
        detail: diagnosis.diagnosisType ?? 'Diagnostico registrado',
        kind: 'diagnosis' as const,
      })),
      ...(latestVitalSign
        ? [
            {
              id: latestVitalSign.id,
              label: 'Signos vitales registrados',
              timestamp: latestVitalSign.takenAt.toISOString(),
              detail: this.summarizeVitalSigns(latestVitalSign),
              kind: 'vital' as const,
            },
          ]
        : []),
    ].sort((left, right) => right.timestamp.localeCompare(left.timestamp));

    return {
      id: encounter.id,
      encounterNumber: encounter.encounterNumber,
      encounterType: encounter.encounterType,
      status: encounter.status,
      admissionSource: encounter.admissionSource,
      openedAt: encounter.openedAt.toISOString(),
      closedAt: encounter.closedAt?.toISOString() ?? null,
      updatedAt: encounter.updatedAt.toISOString(),
      reasonForVisit: encounter.reasonForVisit,
      notes: encounter.notes,
      patient: {
        id: encounter.patient.id,
        fullName: encounter.patient.fullName,
        firstName: encounter.patient.firstName,
        lastName: encounter.patient.lastName,
        middleName: encounter.patient.middleName,
        curp: encounter.patient.curp,
        sexAtBirth: encounter.patient.sexAtBirth,
        birthDate: encounter.patient.birthDate?.toISOString() ?? null,
        ageLabel: this.buildAgeLabel(
          encounter.patient.birthDate,
          encounter.patient.ageSnapshot,
        ),
        phone: encounter.patient.phone,
        email: encounter.patient.email,
        bloodType: encounter.patient.bloodType,
        patientStatus: encounter.patient.patientStatus,
        allergiesSummary: encounter.allergies
          .slice(0, 5)
          .map((allergy) => allergy.substance),
        activeProblems: encounter.problems
          .filter((problem) => (problem.status ?? 'ACTIVO') !== 'RESUELTO')
          .slice(0, 5)
          .map((problem) => problem.description),
      },
      facility: encounter.facility
        ? {
            id: encounter.facility.id,
            code: encounter.facility.code,
            name: encounter.facility.name,
          }
        : null,
      serviceArea: encounter.serviceArea
        ? {
            id: encounter.serviceArea.id,
            name: encounter.serviceArea.name,
            facilityId: encounter.serviceArea.facilityId,
          }
        : null,
      specialty: encounter.specialty
        ? {
            id: encounter.specialty.id,
            code: encounter.specialty.code,
            name: encounter.specialty.name,
          }
        : null,
      medicalRecord: {
        id: encounter.medicalRecord.id,
        recordNumber: encounter.medicalRecord.recordNumber,
        status: encounter.medicalRecord.status,
      },
      attendingClinician,
      metrics: {
        documents: encounter.clinicalDocuments.length,
        diagnoses: encounter.diagnoses.length,
        problems: encounter.problems.length,
        allergies: encounter.allergies.length,
        medications: encounter.medicationStatements.length,
        labs: encounter.labRequests.length,
        imaging: encounter.imagingRequests.length,
        attachments: encounter.attachments.length,
      },
      latestVitalSigns: latestVitalSign
        ? this.toVitalSignsSummary(latestVitalSign)
        : [],
      diagnoses: encounter.diagnoses.map((diagnosis) => ({
        id: diagnosis.id,
        code: diagnosis.code,
        description: diagnosis.description,
        diagnosisType: diagnosis.diagnosisType,
        isPrimary: diagnosis.isPrimary,
      })),
      problems: encounter.problems.map((problem) => ({
        id: problem.id,
        description: problem.description,
        status: problem.status,
      })),
      allergies: encounter.allergies.map((allergy) => ({
        id: allergy.id,
        substance: allergy.substance,
        reaction: allergy.reaction,
        severity: allergy.severity,
        status: allergy.status,
      })),
      documents: encounter.clinicalDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        status: document.status,
        documentDate: document.documentDate.toISOString(),
        authorName: document.author?.fullName ?? null,
      })),
      sectionRecords,
      attachments,
      timeline,
      profile: {
        encounterType: encounter.profile?.encounterType ?? encounter.encounterType,
        sections: this.ensureStructuredSections(
          encounter.profile?.encounterType ?? encounter.encounterType,
          encounter.profile?.sectionsJson ?? null,
        ),
        alerts: this.normalizeProfileAlerts(encounter.profile?.alertsJson),
      },
    };
  }

  private buildDefaultStructuredSections(encounterType: EncounterType) {
    const sections: Record<string, unknown> = {};

    for (const tab of encounterTabsByType[encounterType] ?? []) {
      if (tab === 'Resumen') {
        continue;
      }

      sections[tab] = {};
    }

    return sections as Prisma.InputJsonValue;
  }

  private ensureStructuredSections(
    encounterType: EncounterType,
    rawSections: Prisma.JsonValue | null,
  ) {
    const defaultSections = this.buildDefaultStructuredSections(encounterType) as Record<
      string,
      unknown
    >;

    if (!rawSections || typeof rawSections !== 'object' || Array.isArray(rawSections)) {
      return defaultSections;
    }

    return {
      ...defaultSections,
      ...(rawSections as Record<string, unknown>),
    };
  }

  private async resolveHistoryVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }) {
    if (!this.isConsultationHistoryRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: input.tabKey,
        ...(input.currentRecordId
          ? {
              NOT: {
                id: input.currentRecordId,
              },
            }
          : {}),
      },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const latestRecord = records[0] ?? null;
    const latestVersionNumber = latestRecord
      ? this.extractHistoryVersionMetadata(latestRecord.metadataJson).versionNumber ?? 0
      : 0;
    const nextVersionNumber = latestVersionNumber + 1;

    return {
      latestRecord,
      latestVersionNumber,
      nextVersionNumber,
    };
  }

  private async resolveConsultationVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }) {
    if (!this.isConsultationCurrentRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: input.tabKey,
        ...(input.currentRecordId
          ? {
              NOT: {
                id: input.currentRecordId,
              },
            }
          : {}),
      },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const latestRecord = records[0] ?? null;
    const latestVersionNumber = latestRecord
      ? this.extractConsultationVersionMetadata(latestRecord.metadataJson)
          .versionNumber ?? 0
      : 0;

    return {
      latestRecord,
      latestVersionNumber,
      nextVersionNumber: latestVersionNumber + 1,
    };
  }

  private normalizeSectionRecordPayload(input: {
    encounter: TenantEncounterRecord;
    currentRecord:
      | {
          title: string;
          noteType: string;
          status: EncounterRecordStatus;
          formDataJson: Prisma.JsonValue;
          metadataJson: Prisma.JsonValue | null;
        }
      | null;
    historyVersionContext: Awaited<
      ReturnType<EncountersService['resolveHistoryVersionContext']>
    >;
    consultationVersionContext: Awaited<
      ReturnType<EncountersService['resolveConsultationVersionContext']>
    >;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    input: EncounterSectionRecordMutationDto;
    recordedAt: Date;
  }) {
    if (
      !this.isConsultationHistoryRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isConsultationCurrentRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      return {
        tabKey: input.input.tabKey,
        noteType: input.input.noteType,
        title:
          input.input.title ??
          input.currentRecord?.title ??
          this.buildDefaultRecordTitle(
            input.input.noteType,
            input.encounter.encounterNumber,
          ),
        status: input.input.status ?? input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
        formData: input.input.formData,
        metadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      };
    }

    if (
      this.isConsultationCurrentRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractConsultationVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.consultationVersionContext?.nextVersionNumber ??
        1;
      const consultationType =
        versionNumber === 1 ? 'PRIMERA_VEZ' : 'SUBSECUENTE';
      const latestHistoryRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Historia clínica',
      );
      const latestConsultationRecord =
        input.consultationVersionContext?.latestRecord ?? null;
      const referenceSnapshot = this.buildConsultationReferenceSnapshot(
        input.encounter,
        latestHistoryRecord?.formDataJson ?? null,
      );
      const longitudinalResultsSummary = this.resolveConsultationResultsSummary({
        incomingFormData: input.input.formData,
        currentRecordFormData: input.currentRecord?.formDataJson ?? null,
        latestConsultationFormData: latestConsultationRecord?.formDataJson ?? null,
        latestHistoryFormData: latestHistoryRecord?.formDataJson ?? null,
      });
      const calculatedImc = this.calculateBodyMassIndex(
        input.input.formData,
        input.currentRecord?.formDataJson ?? null,
      );

      return {
        tabKey: input.input.tabKey,
        noteType: 'Consulta actual',
        title: `Consulta versión ${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData: {
          ...input.input.formData,
          tipoConsultaActual: consultationType,
          referenciaAlergiasCriticas: referenceSnapshot.allergies,
          referenciaCronicos: referenceSnapshot.chronicConditions,
          referenciaMedicacionCronica: referenceSnapshot.chronicMedication,
          consultaResultadosPreviosResumen: longitudinalResultsSummary,
          svImc: calculatedImc,
          consultaLegalMedico:
            input.responsibleUser?.fullName ?? 'Sin profesional responsable',
          consultaLegalCedula:
            input.responsibleUser?.professionalLicense ?? 'Sin cédula',
          consultaLegalEspecialidad:
            input.encounter.specialty?.name ?? 'Sin especialidad',
        },
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          consultationType,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            input.consultationVersionContext?.latestRecord?.id ??
            null,
        },
      };
    }

    const currentRecordMetadata = this.extractHistoryVersionMetadata(
      input.currentRecord?.metadataJson,
    );
    const versionNumber =
      currentRecordMetadata.versionNumber ??
      input.historyVersionContext?.nextVersionNumber ??
      1;
    const historyType = versionNumber === 1 ? 'INICIAL' : 'SUBSECUENTE';

    return {
      tabKey: input.input.tabKey,
      noteType: 'Historia clínica',
      title: `Historia clínica versión ${versionNumber}`,
      status: input.input.status ?? input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
      formData: {
        ...input.input.formData,
        tipoHistoriaClinica: historyType,
        fechaHistoria: input.recordedAt.toISOString().slice(0, 16),
        legalMedico:
          input.responsibleUser?.fullName ?? 'Sin profesional responsable',
        legalCedula: input.responsibleUser?.professionalLicense ?? 'Sin cédula',
        legalEspecialidad: input.encounter.specialty?.name ?? 'Sin especialidad',
      },
      metadata: {
        ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
        versionNumber,
        historyType,
        inheritedFromRecordId:
          currentRecordMetadata.inheritedFromRecordId ??
          input.historyVersionContext?.latestRecord?.id ??
          null,
      },
    };
  }

  private isConsultationHistoryRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.OUTPATIENT && tabKey === 'Historia clínica';
  }

  private isConsultationCurrentRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.OUTPATIENT && tabKey === 'Consulta actual';
  }

  private findLatestSectionRecord(
    records: TenantEncounterRecord['sectionRecords'],
    tabKey: string,
  ) {
    return records.find((record) => record.tabKey === tabKey) ?? null;
  }

  private buildConsultationReferenceSnapshot(
    encounter: TenantEncounterRecord,
    historyFormData: Prisma.JsonValue | null,
  ) {
    const normalizedHistory =
      historyFormData &&
      typeof historyFormData === 'object' &&
      !Array.isArray(historyFormData)
        ? (historyFormData as Record<string, unknown>)
        : {};

    return {
      allergies:
        this.readStringValue(normalizedHistory.appAlergias) ||
        encounter.patient.allergiesNotes ||
        encounter.allergies
          .map((allergy) => allergy.substance)
          .slice(0, 3)
          .join(', ') ||
        'Sin alergias críticas registradas',
      chronicConditions:
        this.readStringValue(normalizedHistory.appEnfermedadesCronicas) ||
        'Sin enfermedades crónicas registradas',
      chronicMedication: this.stringifyMedicationSummary(
        normalizedHistory.medicacionCronicaActual,
      ),
    };
  }

  private resolveConsultationResultsSummary(input: {
    incomingFormData: Record<string, unknown>;
    currentRecordFormData: Prisma.JsonValue | null;
    latestConsultationFormData: Prisma.JsonValue | null;
    latestHistoryFormData: Prisma.JsonValue | null;
  }) {
    const directValue = this.readStringValue(
      input.incomingFormData.consultaResultadosPreviosResumen,
    );

    if (directValue) {
      return directValue;
    }

    const currentRecordValue = this.readStringValueFromJson(
      input.currentRecordFormData,
      'consultaResultadosPreviosResumen',
    );

    if (currentRecordValue) {
      return currentRecordValue;
    }

    const latestConsultationValue = this.readStringValueFromJson(
      input.latestConsultationFormData,
      'consultaResultadosPreviosResumen',
    );

    if (latestConsultationValue) {
      return latestConsultationValue;
    }

    return (
      this.readStringValueFromJson(
        input.latestHistoryFormData,
        'resultadosPreviosResumen',
      ) || ''
    );
  }

  private calculateBodyMassIndex(
    incomingFormData: Record<string, unknown>,
    currentRecordFormData: Prisma.JsonValue | null,
  ) {
    const weightKg = this.readNumericValue(incomingFormData.svPeso)
      ?? this.readNumericValueFromJson(currentRecordFormData, 'svPeso');
    const heightCm = this.readNumericValue(incomingFormData.svTalla)
      ?? this.readNumericValueFromJson(currentRecordFormData, 'svTalla');

    if (!weightKg || !heightCm) {
      return '';
    }

    const heightMeters = heightCm / 100;

    if (heightMeters <= 0) {
      return '';
    }

    return (weightKg / (heightMeters * heightMeters)).toFixed(1);
  }

  private extractHistoryVersionMetadata(rawMetadata: Prisma.JsonValue | null | undefined) {
    const normalizedMetadata = this.normalizeRecordMetadata(rawMetadata);

    return {
      versionNumber:
        typeof normalizedMetadata?.versionNumber === 'number'
          ? normalizedMetadata.versionNumber
          : null,
      historyType:
        typeof normalizedMetadata?.historyType === 'string'
          ? normalizedMetadata.historyType
          : null,
      inheritedFromRecordId:
        typeof normalizedMetadata?.inheritedFromRecordId === 'string'
          ? normalizedMetadata.inheritedFromRecordId
          : null,
    };
  }

  private extractConsultationVersionMetadata(
    rawMetadata: Prisma.JsonValue | null | undefined,
  ) {
    const normalizedMetadata = this.normalizeRecordMetadata(rawMetadata);

    return {
      versionNumber:
        typeof normalizedMetadata?.versionNumber === 'number'
          ? normalizedMetadata.versionNumber
          : null,
      consultationType:
        typeof normalizedMetadata?.consultationType === 'string'
          ? normalizedMetadata.consultationType
          : null,
      inheritedFromRecordId:
        typeof normalizedMetadata?.inheritedFromRecordId === 'string'
          ? normalizedMetadata.inheritedFromRecordId
          : null,
    };
  }

  private extractRecordVersionMetadata(
    rawMetadata: Prisma.JsonValue | null | undefined,
  ) {
    const historyMetadata = this.extractHistoryVersionMetadata(rawMetadata);
    const consultationMetadata = this.extractConsultationVersionMetadata(rawMetadata);

    return {
      versionNumber:
        historyMetadata.versionNumber ?? consultationMetadata.versionNumber ?? null,
      historyType: historyMetadata.historyType,
      consultationType: consultationMetadata.consultationType,
      inheritedFromRecordId:
        historyMetadata.inheritedFromRecordId ??
        consultationMetadata.inheritedFromRecordId ??
        null,
    };
  }

  private readStringValue(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private readStringValueFromJson(
    rawValue: Prisma.JsonValue | null,
    key: string,
  ) {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      return '';
    }

    return this.readStringValue((rawValue as Record<string, unknown>)[key]);
  }

  private readNumericValue(value: unknown) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  private readNumericValueFromJson(
    rawValue: Prisma.JsonValue | null,
    key: string,
  ) {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      return null;
    }

    return this.readNumericValue((rawValue as Record<string, unknown>)[key]);
  }

  private stringifyMedicationSummary(value: unknown) {
    if (!Array.isArray(value)) {
      return 'Sin medicación crónica registrada';
    }

    const medicationLines = value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((item) => {
        const name = this.readStringValue(item.medicamento);
        const route = this.readStringValue(item.via);
        const frequency = this.readStringValue(item.frecuencia);
        const indication = this.readStringValue(item.indicacion);

        return [name, route, frequency, indication].filter(Boolean).join(' · ');
      })
      .filter(Boolean);

    return medicationLines.length > 0
      ? medicationLines.join('\n')
      : 'Sin medicación crónica registrada';
  }

  private normalizeRecordMetadata(rawMetadata: Prisma.JsonValue | null | undefined) {
    if (!rawMetadata || typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
      return null;
    }

    return rawMetadata as Record<string, unknown>;
  }

  private assertRecordTabAllowed(encounterType: EncounterType, tabKey: string) {
    const allowedTabs = encounterTabsByType[encounterType] ?? [];

    if (!allowedTabs.includes(tabKey) || tabKey === 'Resumen') {
      throw new BadRequestException(
        'La pestaña seleccionada no es válida para este tipo de episodio',
      );
    }
  }

  private buildDefaultRecordTitle(noteType: string, encounterNumber: string) {
    return `${noteType} · ${encounterNumber}`;
  }

  private normalizeProfileAlerts(rawAlerts: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(rawAlerts)) {
      return [];
    }

    return rawAlerts.filter((value): value is string => typeof value === 'string');
  }

  private summarizeVitalSigns(vitalSign: TenantEncounterRecord['vitalSigns'][number]) {
    const parts = [
      vitalSign.systolicBp && vitalSign.diastolicBp
        ? `PA ${vitalSign.systolicBp}/${vitalSign.diastolicBp}`
        : null,
      vitalSign.heartRate ? `FC ${vitalSign.heartRate}` : null,
      vitalSign.temperatureC ? `Temp ${vitalSign.temperatureC}` : null,
      vitalSign.oxygenSaturation ? `SpO2 ${vitalSign.oxygenSaturation}` : null,
    ].filter(Boolean);

    return parts.join(' · ') || 'Sin valores destacados';
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private toVitalSignsSummary(
    vitalSign: TenantEncounterRecord['vitalSigns'][number],
  ) {
    return [
      {
        label: 'PA',
        value:
          vitalSign.systolicBp && vitalSign.diastolicBp
            ? `${vitalSign.systolicBp}/${vitalSign.diastolicBp}`
            : '--',
        unit: 'mmHg',
      },
      {
        label: 'FC',
        value: vitalSign.heartRate ? String(vitalSign.heartRate) : '--',
        unit: 'lpm',
      },
      {
        label: 'FR',
        value: vitalSign.respiratoryRate
          ? String(vitalSign.respiratoryRate)
          : '--',
        unit: 'rpm',
      },
      {
        label: 'Temp',
        value: vitalSign.temperatureC ? String(vitalSign.temperatureC) : '--',
        unit: 'C',
      },
      {
        label: 'SpO2',
        value: vitalSign.oxygenSaturation
          ? String(vitalSign.oxygenSaturation)
          : '--',
        unit: '%',
      },
      {
        label: 'Peso',
        value: vitalSign.weightKg ? String(vitalSign.weightKg) : '--',
        unit: 'kg',
      },
    ];
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

      return `${Math.max(age, 0)} años`;
    }

    if (ageSnapshot !== null) {
      return `${ageSnapshot} años`;
    }

    return null;
  }
}
