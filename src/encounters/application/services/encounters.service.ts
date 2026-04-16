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
      serviceAreaId: input.serviceAreaId,
      specialtyId: input.specialtyId,
      attendingUserId: input.attendingUserId,
    });

    const openedAt = input.openedAt ? new Date(input.openedAt) : new Date();
    const status = input.status ?? EncounterStatus.OPEN;
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
          admissionSource: input.admissionSource,
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

    await this.prisma.encounterSectionRecord.create({
      data: {
        tenantId,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        noteType: input.noteType,
        title:
          input.title ??
          this.buildDefaultRecordTitle(input.noteType, encounter.encounterNumber),
        status: input.status ?? EncounterRecordStatus.DRAFT,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        authoredByUserId: userId,
        formDataJson: input.formData as Prisma.InputJsonValue,
        signedAt:
          (input.status ?? EncounterRecordStatus.DRAFT) ===
          EncounterRecordStatus.SIGNED
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

    this.assertRecordTabAllowed(encounter.encounterType, input.tabKey);

    await this.prisma.encounterSectionRecord.update({
      where: { id: recordId },
      data: {
        tabKey: input.tabKey,
        noteType: input.noteType,
        title:
          input.title ??
          currentRecord.title ??
          this.buildDefaultRecordTitle(input.noteType, encounter.encounterNumber),
        status: input.status ?? currentRecord.status,
        recordedAt: input.recordedAt
          ? new Date(input.recordedAt)
          : currentRecord.recordedAt,
        authoredByUserId: userId,
        formDataJson: input.formData as Prisma.InputJsonValue,
        signedAt:
          (input.status ?? currentRecord.status) === EncounterRecordStatus.SIGNED
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
