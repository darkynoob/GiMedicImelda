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
  EncounterSectionRecordPdfResponse,
  EncountersListResponse,
} from '../dto/encounter.response';

type TenantEncounterRecord = Prisma.EncounterGetPayload<{
  include: {
    tenant: {
      select: {
        name: true;
        legalName: true;
        taxId: true;
      };
    };
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

type RecordVersionContext = {
  latestRecord: {
    id: string;
    title: string;
    formDataJson: Prisma.JsonValue;
    metadataJson: Prisma.JsonValue | null;
    recordedAt: Date;
    createdAt: Date;
  } | null;
  latestVersionNumber: number;
  nextVersionNumber: number;
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
    this.assertEncounterEditable(currentEncounter);

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
    this.assertEncounterEditable(encounter);
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
    const evolutionVersionContext = await this.resolveEvolutionVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
    });
    const prescriptionVersionContext = await this.resolvePrescriptionVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
    });
    const documentVersionContext = await this.resolveDocumentVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      noteType: input.noteType,
    });
    const normalizedRecordPayload = this.normalizeSectionRecordPayload({
      encounter,
      input,
      recordedAt,
      currentRecord: null,
      historyVersionContext,
      consultationVersionContext,
      evolutionVersionContext,
      prescriptionVersionContext,
      documentVersionContext,
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
    this.assertEncounterEditable(encounter);
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
    const evolutionVersionContext = await this.resolveEvolutionVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      currentRecordId: currentRecord.id,
    });
    const prescriptionVersionContext = await this.resolvePrescriptionVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      currentRecordId: currentRecord.id,
    });
    const documentVersionContext = await this.resolveDocumentVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      noteType: input.noteType,
      currentRecordId: currentRecord.id,
    });
    const normalizedRecordPayload = this.normalizeSectionRecordPayload({
      encounter,
      input,
      recordedAt,
      currentRecord,
      historyVersionContext,
      consultationVersionContext,
      evolutionVersionContext,
      prescriptionVersionContext,
      documentVersionContext,
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
    this.assertEncounterEditable(encounter);
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
    this.assertRecordCanBeSigned(currentRecord.noteType, currentRecord.formDataJson);

    const signedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      await transaction.encounterSectionRecord.update({
        where: { id: recordId },
        data: {
          status: EncounterRecordStatus.SIGNED,
          signedAt,
          metadataJson: {
            ...currentMetadata,
            signedByUserId: currentUser.id,
            signedByUserName: currentUser.fullName,
            signedWithPasswordValidation: true,
          } as Prisma.InputJsonValue,
        },
      });

      if (this.isConsultationClosureDocument(currentRecord.encounterType, currentRecord.tabKey, currentRecord.noteType)) {
        await transaction.encounter.update({
          where: { id: encounter.id },
          data: {
            status: EncounterStatus.CLOSED,
            closedAt: encounter.closedAt ?? signedAt,
          },
        });
      }
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return this.toEncounterDetailResponse(
      updatedEncounter,
      updatedEncounter.attendingUserId
        ? await this.userRepository.findById(updatedEncounter.attendingUserId)
        : null,
    );
  }

  async previewSectionRecordPdfForTenant(
    tenantId: string,
    encounterNumber: string,
    recordId: string,
  ): Promise<EncounterSectionRecordPdfResponse> {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    const record = await this.findPdfEligibleSectionRecord(
      tenantId,
      encounter.id,
      recordId,
    );

    return this.buildSectionRecordPdfResponse({
      encounter,
      record,
      preview: true,
      downloadCount:
        this.extractRecordVersionMetadata(record.metadataJson).pdfDownloadCount ?? 0,
    });
  }

  async downloadSectionRecordPdfForTenant(
    tenantId: string,
    encounterNumber: string,
    recordId: string,
  ): Promise<EncounterSectionRecordPdfResponse> {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    const record = await this.findPdfEligibleSectionRecord(
      tenantId,
      encounter.id,
      recordId,
    );

    if (record.status !== EncounterRecordStatus.SIGNED) {
      throw new BadRequestException(
        'El documento debe estar firmado antes de descargarse',
      );
    }

    const currentMetadata = this.extractRecordVersionMetadata(record.metadataJson);
    const currentDownloadCount = currentMetadata.pdfDownloadCount ?? 0;

    if (
      this.isConsultationPrescriptionRecord(record.encounterType, record.tabKey) &&
      currentDownloadCount >= 1
    ) {
      await this.prisma.encounterSectionRecord.update({
        where: { id: record.id },
        data: {
          metadataJson: {
            ...this.normalizeRecordMetadata(record.metadataJson),
            blockedDownloadAttempts:
              (this.readNumericValue(
                this.normalizeRecordMetadata(record.metadataJson)
                  ?.blockedDownloadAttempts,
              ) ?? 0) + 1,
          } as Prisma.InputJsonValue,
        },
      });

      throw new BadRequestException(
        'La receta ya fue descargada una vez y quedó bloqueada para nuevas descargas',
      );
    }

    const nextDownloadCount = currentDownloadCount + 1;
    const downloadedAt = new Date();

    await this.prisma.encounterSectionRecord.update({
      where: { id: record.id },
      data: {
        metadataJson: {
          ...this.normalizeRecordMetadata(record.metadataJson),
          pdfDownloadCount: nextDownloadCount,
          pdfLastDownloadedAt: downloadedAt.toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return this.buildSectionRecordPdfResponse({
      encounter,
      record,
      preview: false,
      downloadCount: nextDownloadCount,
    });
  }

  async uploadAttachmentsForTenant(
    tenantId: string,
    userId: string,
    encounterNumber: string,
    files: UploadedAttachmentFile[],
  ) {
    const encounter = await this.findEncounterByNumber(tenantId, encounterNumber);
    this.assertEncounterEditable(encounter);

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
    this.assertEncounterEditable(encounter);
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
      tenant: {
        select: {
          name: true,
          legalName: true,
          taxId: true,
        },
      },
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
      legalContext: {
        tenantName: encounter.tenant.name,
        tenantLegalName: encounter.tenant.legalName ?? null,
        tenantTaxId: encounter.tenant.taxId ?? null,
        facilityLegalName: encounter.facility?.legalName ?? null,
        facilityInstitutionName: encounter.facility?.institutionName ?? null,
      },
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

  private async resolveEvolutionVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isConsultationEvolutionRecord(input.encounterType, input.tabKey)) {
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
      ? this.extractRecordVersionMetadata(latestRecord.metadataJson).versionNumber ?? 0
      : 0;

    return {
      latestRecord,
      latestVersionNumber,
      nextVersionNumber: latestVersionNumber + 1,
    };
  }

  private async resolvePrescriptionVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isConsultationPrescriptionRecord(input.encounterType, input.tabKey)) {
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
      ? this.extractRecordVersionMetadata(latestRecord.metadataJson).versionNumber ?? 0
      : 0;

    return {
      latestRecord,
      latestVersionNumber,
      nextVersionNumber: latestVersionNumber + 1,
    };
  }

  private async resolveDocumentVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    noteType: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isConsultationDocumentRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: input.tabKey,
        noteType: input.noteType,
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
      ? this.extractRecordVersionMetadata(latestRecord.metadataJson).versionNumber ?? 0
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
    evolutionVersionContext: Awaited<
      ReturnType<EncountersService['resolveEvolutionVersionContext']>
    >;
    prescriptionVersionContext: Awaited<
      ReturnType<EncountersService['resolvePrescriptionVersionContext']>
    >;
    documentVersionContext: Awaited<
      ReturnType<EncountersService['resolveDocumentVersionContext']>
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
      ) &&
      !this.isConsultationEvolutionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isConsultationDocumentRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isConsultationPrescriptionRecord(
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
      this.isConsultationDocumentRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.documentVersionContext?.nextVersionNumber ??
        1;
      const verificationCode =
        currentRecordMetadata.verificationCode ??
        randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
      const mergedFormData = this.buildConsultationDocumentFormData({
        encounter: input.encounter,
        currentRecordFormData: input.currentRecord?.formDataJson ?? null,
        incomingFormData: input.input.formData,
        noteType: input.input.noteType,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: input.input.tabKey,
        noteType: input.input.noteType,
        title: this.buildConsultationDocumentTitle(input.input.noteType, versionNumber),
        status:
          input.currentRecord?.status === EncounterRecordStatus.SIGNED
            ? EncounterRecordStatus.SIGNED
            : EncounterRecordStatus.DRAFT,
        formData: {
          ...mergedFormData,
          documentoCodigoVerificacion: verificationCode,
        },
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          verificationCode,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            input.documentVersionContext?.latestRecord?.id ??
            null,
        },
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

    if (
      this.isConsultationEvolutionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.evolutionVersionContext?.nextVersionNumber ??
        1;
      const previousEvolutionRecord = input.evolutionVersionContext?.latestRecord ?? null;
      const latestConsultationRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Consulta actual',
      );
      const diagnosisBaseline = this.buildEvolutionDiagnosesBaseline({
        previousEvolutionFormData: previousEvolutionRecord?.formDataJson ?? null,
        latestConsultationFormData: latestConsultationRecord?.formDataJson ?? null,
      });
      const treatmentBaseline = this.resolveEvolutionTreatmentBaseline({
        incomingFormData: input.input.formData,
        currentRecordFormData: input.currentRecord?.formDataJson ?? null,
        previousEvolutionFormData: previousEvolutionRecord?.formDataJson ?? null,
      });
      const comparisonSnapshot = this.buildEvolutionComparisonSnapshot(
        previousEvolutionRecord,
      );

      return {
        tabKey: input.input.tabKey,
        noteType: 'Evolución',
        title: `Evolución V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData: {
          ...input.input.formData,
          evolucionDiagnosticos: diagnosisBaseline,
          evolucionTratamiento: treatmentBaseline,
          evolucionPreviaTitulo: comparisonSnapshot.previousTitle,
          evolucionPreviaEstado: comparisonSnapshot.previousStatus,
          evolucionLegalMedico:
            input.responsibleUser?.fullName ?? 'Sin profesional responsable',
          evolucionLegalCedula:
            input.responsibleUser?.professionalLicense ?? 'Sin cédula',
          evolucionLegalEspecialidad:
            input.encounter.specialty?.name ?? 'Sin especialidad',
        },
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            previousEvolutionRecord?.id ??
            null,
        },
      };
    }

    if (
      this.isConsultationPrescriptionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.prescriptionVersionContext?.nextVersionNumber ??
        1;
      const latestHistoryRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Historia clínica',
      );
      const latestConsultationRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Consulta actual',
      );
      const latestEvolutionRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Evolución',
      );
      const prescriptionSuggestionSnapshot =
        this.buildPrescriptionSuggestionSnapshot({
          incomingFormData: input.input.formData,
          currentRecordFormData: input.currentRecord?.formDataJson ?? null,
          consultationFormData: latestConsultationRecord?.formDataJson ?? null,
          evolutionFormData: latestEvolutionRecord?.formDataJson ?? null,
        });
      const safetyAlerts = this.buildPrescriptionSafetyAlerts({
        encounter: input.encounter,
        historyFormData: latestHistoryRecord?.formDataJson ?? null,
        formData: input.input.formData,
      });
      const prescriptionFolio =
        currentRecordMetadata.prescriptionFolio ??
        `${input.encounter.encounterNumber}-RB${String(versionNumber).padStart(2, '0')}`;
      const verificationCode =
        currentRecordMetadata.verificationCode ??
        randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();

      return {
        tabKey: input.input.tabKey,
        noteType: 'Receta médica',
        title: `Receta B${versionNumber}`,
        status:
          input.currentRecord?.status === EncounterRecordStatus.SIGNED
            ? EncounterRecordStatus.SIGNED
            : EncounterRecordStatus.DRAFT,
        formData: {
          ...input.input.formData,
          recetaFolio: prescriptionFolio,
          recetaCodigoVerificacion: verificationCode,
          recetaDiagnosticoPrincipal:
            prescriptionSuggestionSnapshot.primaryDiagnosis,
          recetaDiagnosticoCie10: prescriptionSuggestionSnapshot.primaryDiagnosisCode,
          recetaDiagnosticoSecundarios:
            prescriptionSuggestionSnapshot.secondaryDiagnoses,
          recetaProximaCita: prescriptionSuggestionSnapshot.nextAppointment,
          recetaSeguimientoFecha: prescriptionSuggestionSnapshot.nextAppointment,
          recetaInstitucionEmisora:
            input.encounter.facility?.institutionName ??
            input.encounter.facility?.legalName ??
            input.encounter.tenant.legalName ??
            input.encounter.tenant.name ??
            input.encounter.facility?.name ??
            'Institución no configurada',
          recetaRfcMedico:
            input.encounter.tenant.taxId ||
            'RFC no configurado',
          recetaLicenciaSanitaria:
            input.encounter.facility?.legalName ?? 'Licencia no configurada',
          recetaNombreProfesional:
            input.responsibleUser?.fullName ?? 'Sin profesional responsable',
          recetaCedulaProfesional:
            input.responsibleUser?.professionalLicense ?? 'Sin cédula',
          recetaEspecialidadProfesional:
            input.encounter.specialty?.name ?? 'Sin especialidad',
          recetaLugarAtencion: [
            input.encounter.facility?.name,
            input.encounter.serviceArea?.name,
          ]
            .filter(Boolean)
            .join(' · ') || 'Lugar no configurado',
          recetaAlertas: safetyAlerts,
        },
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          prescriptionFolio,
          verificationCode,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
          inheritedFromRecordId: currentRecordMetadata.inheritedFromRecordId ?? null,
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

  private isConsultationEvolutionRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.OUTPATIENT && tabKey === 'Evolución';
  }

  private isConsultationPrescriptionRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      encounterType === EncounterType.OUTPATIENT &&
      tabKey === 'Receta / Indicaciones'
    );
  }

  private isConsultationDocumentRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.OUTPATIENT && tabKey === 'Documentos';
  }

  private isConsultationClosureDocument(
    encounterType: EncounterType,
    tabKey: string,
    noteType: string,
  ) {
    return (
      this.isConsultationDocumentRecord(encounterType, tabKey) &&
      noteType === 'Nota de cierre'
    );
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
    const normalizedMetadata = this.normalizeRecordMetadata(rawMetadata);

    return {
      versionNumber:
        historyMetadata.versionNumber ?? consultationMetadata.versionNumber ?? null,
      historyType: historyMetadata.historyType,
      consultationType: consultationMetadata.consultationType,
      inheritedFromRecordId:
        historyMetadata.inheritedFromRecordId ??
        consultationMetadata.inheritedFromRecordId ??
        (typeof normalizedMetadata?.inheritedFromRecordId === 'string'
          ? normalizedMetadata.inheritedFromRecordId
          : null),
      prescriptionFolio:
        typeof normalizedMetadata?.prescriptionFolio === 'string'
          ? normalizedMetadata.prescriptionFolio
          : null,
      verificationCode:
        typeof normalizedMetadata?.verificationCode === 'string'
          ? normalizedMetadata.verificationCode
          : null,
      pdfDownloadCount:
        typeof normalizedMetadata?.pdfDownloadCount === 'number'
          ? normalizedMetadata.pdfDownloadCount
          : null,
      pdfLastDownloadedAt:
        typeof normalizedMetadata?.pdfLastDownloadedAt === 'string'
          ? normalizedMetadata.pdfLastDownloadedAt
          : null,
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

  private buildEvolutionDiagnosesBaseline(input: {
    previousEvolutionFormData: Prisma.JsonValue | null;
    latestConsultationFormData: Prisma.JsonValue | null;
  }) {
    const previousEvolutionDiagnoses = this.readDiagnosesArrayFromJson(
      input.previousEvolutionFormData,
      'evolucionDiagnosticos',
    );

    if (previousEvolutionDiagnoses.length > 0) {
      return previousEvolutionDiagnoses;
    }

    return this.readConsultationDiagnosesFromJson(input.latestConsultationFormData);
  }

  private resolveEvolutionTreatmentBaseline(input: {
    incomingFormData: Record<string, unknown>;
    currentRecordFormData: Prisma.JsonValue | null;
    previousEvolutionFormData: Prisma.JsonValue | null;
  }) {
    const directValue = this.readStringValue(input.incomingFormData.evolucionTratamiento);

    if (directValue) {
      return directValue;
    }

    const currentValue = this.readStringValueFromJson(
      input.currentRecordFormData,
      'evolucionTratamiento',
    );

    if (currentValue) {
      return currentValue;
    }

    return (
      this.readStringValueFromJson(
        input.previousEvolutionFormData,
        'evolucionTratamiento',
      ) || ''
    );
  }

  private buildEvolutionComparisonSnapshot(
    previousEvolutionRecord:
      | {
          title: string;
          formDataJson: Prisma.JsonValue;
        }
      | null
      | undefined,
  ) {
    if (!previousEvolutionRecord) {
      return {
        previousTitle: 'Sin evolución previa registrada',
        previousStatus: 'Sin estado previo',
      };
    }

    const previousStatus =
      this.readStringValueFromJson(
        previousEvolutionRecord.formDataJson,
        'evolucionEstadoClinicoGeneral',
      ) || 'Sin estado previo';

    return {
      previousTitle: previousEvolutionRecord.title,
      previousStatus,
    };
  }

  private readDiagnosesArrayFromJson(
    rawValue: Prisma.JsonValue | null,
    key: string,
  ) {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      return [];
    }

    const value = (rawValue as Record<string, unknown>)[key];

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((item) => ({
        diagnostico: this.readStringValue(item.diagnostico),
        cie10: this.readStringValue(item.cie10),
        estado: this.readStringValue(item.estado),
      }))
      .filter((item) => item.diagnostico || item.cie10 || item.estado);
  }

  private readConsultationDiagnosesFromJson(rawValue: Prisma.JsonValue | null) {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      return [];
    }

    const record = rawValue as Record<string, unknown>;
    const diagnoses: Array<Record<string, unknown>> = [];

    const primaryDiagnosis = this.readStringValue(record.idDiagnosticoPrincipal);
    const primaryCie10 = this.readStringValue(record.idCie10);
    const primaryState = this.readStringValue(record.idEstado);

    if (primaryDiagnosis || primaryCie10 || primaryState) {
      diagnoses.push({
        diagnostico: primaryDiagnosis,
        cie10: primaryCie10,
        estado: primaryState,
      });
    }

    const secondaryDiagnoses = this.readDiagnosesArrayFromJson(rawValue, 'idSecundarios');

    return [...diagnoses, ...secondaryDiagnoses];
  }

  private async findPdfEligibleSectionRecord(
    tenantId: string,
    encounterId: string,
    recordId: string,
  ) {
    const record = await this.prisma.encounterSectionRecord.findUnique({
      where: { id: recordId },
    });

    if (
      !record ||
      record.tenantId !== tenantId ||
      record.encounterId !== encounterId ||
      (!this.isConsultationPrescriptionRecord(record.encounterType, record.tabKey) &&
        !this.isConsultationDocumentRecord(record.encounterType, record.tabKey))
    ) {
      throw new NotFoundException('Documento del episodio no encontrado');
    }

    return record;
  }

  private buildPrescriptionSuggestionSnapshot(input: {
    incomingFormData: Record<string, unknown>;
    currentRecordFormData: Prisma.JsonValue | null;
    consultationFormData: Prisma.JsonValue | null;
    evolutionFormData: Prisma.JsonValue | null;
  }) {
    const directPrimaryDiagnosis = this.readStringValue(
      input.incomingFormData.recetaDiagnosticoPrincipal,
    );
    const currentPrimaryDiagnosis = this.readStringValueFromJson(
      input.currentRecordFormData,
      'recetaDiagnosticoPrincipal',
    );
    const consultationPrimaryDiagnosis = this.readStringValueFromJson(
      input.consultationFormData,
      'idDiagnosticoPrincipal',
    );
    const evolutionDiagnoses = this.readDiagnosesArrayFromJson(
      input.evolutionFormData,
      'evolucionDiagnosticos',
    );
    const consultationSecondaryDiagnoses = this.readDiagnosesArrayFromJson(
      input.consultationFormData,
      'idSecundarios',
    );
    const directSecondaryDiagnoses = this.readDiagnosesArrayFromUnknown(
      input.incomingFormData.recetaDiagnosticoSecundarios,
    );
    const currentSecondaryDiagnoses = this.readDiagnosesArrayFromJson(
      input.currentRecordFormData,
      'recetaDiagnosticoSecundarios',
    );
    const primaryDiagnosis =
      directPrimaryDiagnosis ||
      currentPrimaryDiagnosis ||
      consultationPrimaryDiagnosis ||
      evolutionDiagnoses[0]?.diagnostico ||
      '';
    const primaryDiagnosisCode =
      this.readStringValue(input.incomingFormData.recetaDiagnosticoCie10) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'recetaDiagnosticoCie10',
      ) ||
      this.readStringValueFromJson(input.consultationFormData, 'idCie10') ||
      evolutionDiagnoses[0]?.cie10 ||
      '';
    const secondaryDiagnoses =
      directSecondaryDiagnoses.length > 0
        ? directSecondaryDiagnoses
        : currentSecondaryDiagnoses.length > 0
          ? currentSecondaryDiagnoses
          : evolutionDiagnoses.slice(1).length > 0
            ? evolutionDiagnoses.slice(1)
            : consultationSecondaryDiagnoses;
    const nextAppointment =
      this.readStringValue(input.incomingFormData.recetaSeguimientoFecha) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'recetaSeguimientoFecha',
      ) ||
      this.readStringValueFromJson(input.evolutionFormData, 'evolucionSeguimiento') ||
      this.readStringValueFromJson(input.consultationFormData, 'planSeguimiento') ||
      '';

    return {
      primaryDiagnosis,
      primaryDiagnosisCode,
      secondaryDiagnoses,
      nextAppointment,
    };
  }

  private buildPrescriptionSafetyAlerts(input: {
    encounter: TenantEncounterRecord;
    historyFormData: Prisma.JsonValue | null;
    formData: Record<string, unknown>;
  }) {
    const allergyText = [
      this.readStringValueFromJson(input.historyFormData, 'appAlergias'),
      input.encounter.allergies.map((allergy) => allergy.substance).join(', '),
      input.encounter.patient.allergiesNotes ?? '',
    ]
      .filter(Boolean)
      .join(' | ')
      .toLowerCase();
    const chronicConditionsText = [
      this.readStringValueFromJson(input.historyFormData, 'appEnfermedadesCronicas'),
      input.encounter.problems.map((problem) => problem.description).join(', '),
    ]
      .filter(Boolean)
      .join(' | ')
      .toLowerCase();
    const medications = this.readPrescriptionMedicationArray(
      input.formData.recetaMedicamentos,
    );
    const normalizedMedicationNames = medications
      .map((item) => ({
        ...item,
        normalizedName: item.medicamento.toLowerCase().trim(),
      }))
      .filter((item) => item.normalizedName.length > 0);

    const allergyAlerts: string[] = [];
    const duplicityAlerts: string[] = [];
    const interactionAlerts: string[] = [];
    const contraindicationAlerts: string[] = [];

    const allergyRules = [
      {
        keyword: 'penic',
        matches: ['penicilina', 'amoxicilina', 'ampicilina', 'dicloxacilina'],
        message:
          'El paciente tiene antecedente de alergia compatible con penicilinas; revisa la prescripción.',
      },
      {
        keyword: 'sulfa',
        matches: ['trimetoprim', 'sulfametoxazol', 'cotrimoxazol'],
        message:
          'Existe antecedente alérgico a sulfas; valida si el antibiótico indicado es seguro.',
      },
    ];

    for (const rule of allergyRules) {
      if (
        allergyText.includes(rule.keyword) &&
        normalizedMedicationNames.some((item) =>
          rule.matches.some((match) => item.normalizedName.includes(match)),
        )
      ) {
        allergyAlerts.push(rule.message);
      }
    }

    const medicationCountByName = new Map<string, number>();
    for (const medication of normalizedMedicationNames) {
      medicationCountByName.set(
        medication.normalizedName,
        (medicationCountByName.get(medication.normalizedName) ?? 0) + 1,
      );
    }

    for (const [medicationName, count] of medicationCountByName.entries()) {
      if (count > 1) {
        duplicityAlerts.push(
          `Se detectó posible duplicidad terapéutica para ${medicationName}.`,
        );
      }
    }

    const interactionRules = [
      {
        medications: ['warfarina', 'ibuprofeno'],
        message:
          'Warfarina con ibuprofeno incrementa el riesgo de sangrado; confirma indicación.',
      },
      {
        medications: ['enalapril', 'ibuprofeno'],
        message:
          'Enalapril con ibuprofeno puede reducir respuesta antihipertensiva y afectar función renal.',
      },
      {
        medications: ['claritromicina', 'atorvastatina'],
        message:
          'Claritromicina con atorvastatina aumenta el riesgo de toxicidad muscular.',
      },
    ];

    for (const rule of interactionRules) {
      if (
        rule.medications.every((medicationName) =>
          normalizedMedicationNames.some((item) =>
            item.normalizedName.includes(medicationName),
          ),
        )
      ) {
        interactionAlerts.push(rule.message);
      }
    }

    if (
      chronicConditionsText.includes('renal') &&
      normalizedMedicationNames.some((item) =>
        item.normalizedName.includes('metformina'),
      )
    ) {
      contraindicationAlerts.push(
        'Existe antecedente renal; valida la pertinencia de metformina y la función renal actual.',
      );
    }

    return {
      allergyValidation:
        allergyAlerts.length > 0
          ? allergyAlerts
          : ['Sin alertas de alergias detectadas automáticamente.'],
      therapeuticDuplicity:
        duplicityAlerts.length > 0
          ? duplicityAlerts
          : ['Sin duplicidad terapéutica identificada.'],
      drugInteractions:
        interactionAlerts.length > 0
          ? interactionAlerts
          : ['Sin interacciones medicamentosas críticas detectadas.'],
      contraindications:
        contraindicationAlerts.length > 0
          ? contraindicationAlerts
          : ['Sin contraindicaciones automáticas relevantes.'],
    };
  }

  private buildConsultationDocumentTitle(noteType: string, versionNumber: number) {
    return `${noteType} V${versionNumber}`;
  }

  private buildConsultationDocumentFormData(input: {
    encounter: TenantEncounterRecord;
    currentRecordFormData: Prisma.JsonValue | null;
    incomingFormData: Record<string, unknown>;
    noteType: string;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const suggestionSnapshot = this.buildConsultationDocumentSuggestionSnapshot({
      encounter: input.encounter,
      noteType: input.noteType,
      incomingFormData: input.incomingFormData,
      currentRecordFormData: input.currentRecordFormData,
    });
    const legalSnapshot = this.buildConsultationDocumentLegalSnapshot(
      input.encounter,
      input.responsibleUser,
    );

    return {
      ...suggestionSnapshot,
      ...input.incomingFormData,
      ...legalSnapshot,
    };
  }

  private buildConsultationDocumentSuggestionSnapshot(input: {
    encounter: TenantEncounterRecord;
    noteType: string;
    incomingFormData: Record<string, unknown>;
    currentRecordFormData: Prisma.JsonValue | null;
  }) {
    const latestConsultationRecord = this.findLatestSectionRecord(
      input.encounter.sectionRecords,
      'Consulta actual',
    );
    const latestEvolutionRecord = this.findLatestSectionRecord(
      input.encounter.sectionRecords,
      'Evolución',
    );
    const latestPrescriptionRecord = this.findLatestSectionRecord(
      input.encounter.sectionRecords,
      'Receta / Indicaciones',
    );
    const evolutionDiagnoses = this.readDiagnosesArrayFromJson(
      latestEvolutionRecord?.formDataJson ?? null,
      'evolucionDiagnosticos',
    );
    const consultationSecondaryDiagnoses = this.readDiagnosesArrayFromJson(
      latestConsultationRecord?.formDataJson ?? null,
      'idSecundarios',
    );
    const primaryDiagnosis =
      this.readStringValue(input.incomingFormData.documentoDiagnosticoPrincipal) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'documentoDiagnosticoPrincipal',
      ) ||
      this.readStringValueFromJson(
        latestConsultationRecord?.formDataJson ?? null,
        'idDiagnosticoPrincipal',
      ) ||
      evolutionDiagnoses[0]?.diagnostico ||
      '';
    const primaryDiagnosisCode =
      this.readStringValue(input.incomingFormData.documentoDiagnosticoCie10) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'documentoDiagnosticoCie10',
      ) ||
      this.readStringValueFromJson(latestConsultationRecord?.formDataJson ?? null, 'idCie10') ||
      evolutionDiagnoses[0]?.cie10 ||
      '';
    const diagnosisArray =
      this.readDiagnosesArrayFromUnknown(input.incomingFormData.documentoDiagnosticos).length > 0
        ? this.readDiagnosesArrayFromUnknown(input.incomingFormData.documentoDiagnosticos)
        : this.readDiagnosesArrayFromJson(
            input.currentRecordFormData,
            'documentoDiagnosticos',
          ).length > 0
          ? this.readDiagnosesArrayFromJson(
              input.currentRecordFormData,
              'documentoDiagnosticos',
            )
          : consultationSecondaryDiagnoses.length > 0
            ? consultationSecondaryDiagnoses
            : primaryDiagnosis || primaryDiagnosisCode
              ? [{ diagnostico: primaryDiagnosis, cie10: primaryDiagnosisCode, estado: '' }]
              : [];
    const treatmentSummary =
      this.readStringValue(input.incomingFormData.documentoTratamientoActual) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'documentoTratamientoActual',
      ) ||
      this.readStringValueFromJson(
        latestPrescriptionRecord?.formDataJson ?? null,
        'recetaIndicacionesGenerales',
      ) ||
      this.readStringValueFromJson(
        latestEvolutionRecord?.formDataJson ?? null,
        'evolucionTratamiento',
      ) ||
      this.readStringValueFromJson(
        latestConsultationRecord?.formDataJson ?? null,
        'planTratamientoFarmacologico',
      ) ||
      '';
    const studiesSummary =
      this.readStringValue(input.incomingFormData.documentoEstudiosRealizados) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'documentoEstudiosRealizados',
      ) ||
      this.readStringValueFromJson(
        latestConsultationRecord?.formDataJson ?? null,
        'consultaResultadosPreviosResumen',
      ) ||
      this.readStringValueFromJson(
        latestEvolutionRecord?.formDataJson ?? null,
        'evolucionResultadosRecientes',
      ) ||
      '';
    const followUpPlan =
      this.readStringValue(input.incomingFormData.documentoPlanSeguimiento) ||
      this.readStringValueFromJson(
        input.currentRecordFormData,
        'documentoPlanSeguimiento',
      ) ||
      this.readStringValueFromJson(
        latestPrescriptionRecord?.formDataJson ?? null,
        'recetaSeguimientoInstrucciones',
      ) ||
      this.readStringValueFromJson(
        latestConsultationRecord?.formDataJson ?? null,
        'planSeguimiento',
      ) ||
      this.readStringValueFromJson(
        latestEvolutionRecord?.formDataJson ?? null,
        'evolucionSeguimiento',
      ) ||
      '';

    if (input.noteType === 'Solicitud de laboratorio') {
      return {
        documentoDiagnosticoPrincipal: primaryDiagnosis,
        documentoDiagnosticoCie10: primaryDiagnosisCode,
      };
    }

    if (input.noteType === 'Solicitud de imagenología') {
      return {
        documentoDiagnosticoPrincipal: primaryDiagnosis,
        documentoDiagnosticoCie10: primaryDiagnosisCode,
      };
    }

    if (input.noteType === 'Referencia / contrarreferencia') {
      return {
        documentoResumenClinico:
          this.readStringValueFromJson(
            latestConsultationRecord?.formDataJson ?? null,
            'paDescripcion',
          ) ||
          this.readStringValueFromJson(
            latestEvolutionRecord?.formDataJson ?? null,
            'evolucionSubjetivo',
          ) ||
          '',
        documentoDiagnosticos: diagnosisArray,
        documentoTratamientoActual: treatmentSummary,
        documentoEstudiosRealizados: studiesSummary,
      };
    }

    if (input.noteType === 'Consentimiento informado') {
      return {
        documentoNombreTutor: input.encounter.patient.fullName,
      };
    }

    if (input.noteType === 'Certificado / constancia') {
      return {
        documentoDiagnosticoPrincipal: primaryDiagnosis,
        documentoDiagnosticoCie10: primaryDiagnosisCode,
      };
    }

    if (input.noteType === 'Nota de cierre') {
      return {
        documentoResumenClinicoFinal:
          this.readStringValueFromJson(
            latestEvolutionRecord?.formDataJson ?? null,
            'evolucionAnalisisComparativo',
          ) ||
          this.readStringValueFromJson(
            latestConsultationRecord?.formDataJson ?? null,
            'paDescripcion',
          ) ||
          '',
        documentoDiagnosticos: diagnosisArray,
        documentoIndicacionesEgreso:
          this.readStringValueFromJson(
            latestPrescriptionRecord?.formDataJson ?? null,
            'recetaIndicacionesGenerales',
          ) ||
          treatmentSummary,
        documentoPlanSeguimiento: followUpPlan,
      };
    }

    return {};
  }

  private buildConsultationDocumentLegalSnapshot(
    encounter: TenantEncounterRecord,
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null,
  ) {
    return {
      documentoInstitucionEmisora:
        encounter.facility?.institutionName ??
        encounter.facility?.legalName ??
        encounter.tenant.legalName ??
        encounter.tenant.name ??
        encounter.facility?.name ??
        'Institución no configurada',
      documentoRfcMedico: encounter.tenant.taxId ?? 'RFC no configurado',
      documentoLicenciaSanitaria:
        encounter.facility?.legalName ??
        encounter.facility?.code ??
        'Licencia no configurada',
      documentoNombreProfesional:
        responsibleUser?.fullName ?? 'Sin profesional responsable',
      documentoCedulaProfesional:
        responsibleUser?.professionalLicense ?? 'Sin cédula',
      documentoEspecialidadProfesional:
        encounter.specialty?.name ?? 'Sin especialidad',
      documentoLugarAtencion:
        [encounter.facility?.name, encounter.serviceArea?.name]
          .filter(Boolean)
          .join(' · ') || 'Lugar no configurado',
    };
  }

  private readPrescriptionMedicationArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((item) => ({
        medicamento: this.readStringValue(item.medicamento),
        presentacion: this.readStringValue(item.presentacion),
        dosis: this.readStringValue(item.dosis),
        via: this.readStringValue(item.via),
        frecuencia: this.readStringValue(item.frecuencia),
        duracion: this.readStringValue(item.duracion),
        tipoMedicamento: this.readStringValue(item.tipoMedicamento),
        intervaloHoras: this.readStringValue(item.intervaloHoras),
        duracionDias: this.readStringValue(item.duracionDias),
        indicaciones: this.readStringValue(item.indicaciones),
        advertencias: this.readStringValue(item.advertencias),
      }))
      .filter((item) => item.medicamento || item.dosis || item.frecuencia);
  }

  private readDiagnosesArrayFromUnknown(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((item) => ({
        diagnostico: this.readStringValue(item.diagnostico),
        cie10: this.readStringValue(item.cie10),
        estado: this.readStringValue(item.estado),
      }))
      .filter((item) => item.diagnostico || item.cie10 || item.estado);
  }

  private buildSectionRecordPdfResponse(input: {
    encounter: TenantEncounterRecord;
    record: {
      id: string;
      noteType: string;
      encounterType: EncounterType;
      tabKey: string;
      title: string;
      status: EncounterRecordStatus;
      recordedAt: Date;
      formDataJson: Prisma.JsonValue;
      metadataJson: Prisma.JsonValue | null;
    };
    preview: boolean;
    downloadCount: number;
  }): EncounterSectionRecordPdfResponse {
    if (
      this.isConsultationPrescriptionRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      return this.buildPrescriptionPdfResponse(input);
    }

    return this.buildClinicalDocumentPdfResponse(input);
  }

  private buildPrescriptionPdfResponse(input: {
    encounter: TenantEncounterRecord;
    record: {
      id: string;
      noteType: string;
      encounterType: EncounterType;
      tabKey: string;
      title: string;
      status: EncounterRecordStatus;
      recordedAt: Date;
      formDataJson: Prisma.JsonValue;
      metadataJson: Prisma.JsonValue | null;
    };
    preview: boolean;
    downloadCount: number;
  }): EncounterSectionRecordPdfResponse {
    const formData =
      input.record.formDataJson &&
      typeof input.record.formDataJson === 'object' &&
      !Array.isArray(input.record.formDataJson)
        ? (input.record.formDataJson as Record<string, unknown>)
        : {};
    const metadata = this.extractRecordVersionMetadata(input.record.metadataJson);
    const pdfBuffer = this.buildPrescriptionPdfDocument({
      encounter: input.encounter,
      recordTitle: input.record.title,
      recordedAt: input.record.recordedAt,
      formData,
      folio: metadata.prescriptionFolio ?? '',
      verificationCode: metadata.verificationCode ?? '',
      downloadCount: input.downloadCount,
    });

    return {
      fileName: `${this.sanitizeFileName(input.record.title)}.pdf`,
      mimeType: 'application/pdf',
      contentBase64: pdfBuffer.toString('base64'),
      downloadCount: input.downloadCount,
      preview: input.preview,
    };
  }

  private buildClinicalDocumentPdfResponse(input: {
    encounter: TenantEncounterRecord;
    record: {
      id: string;
      noteType: string;
      encounterType: EncounterType;
      tabKey: string;
      title: string;
      status: EncounterRecordStatus;
      recordedAt: Date;
      formDataJson: Prisma.JsonValue;
      metadataJson: Prisma.JsonValue | null;
    };
    preview: boolean;
    downloadCount: number;
  }): EncounterSectionRecordPdfResponse {
    const formData =
      input.record.formDataJson &&
      typeof input.record.formDataJson === 'object' &&
      !Array.isArray(input.record.formDataJson)
        ? (input.record.formDataJson as Record<string, unknown>)
        : {};
    const metadata = this.extractRecordVersionMetadata(input.record.metadataJson);
    const pdfBuffer = this.buildClinicalDocumentPdfDocument({
      encounter: input.encounter,
      noteType: input.record.noteType,
      recordTitle: input.record.title,
      recordedAt: input.record.recordedAt,
      formData,
      verificationCode: metadata.verificationCode ?? '',
      downloadCount: input.downloadCount,
    });

    return {
      fileName: `${this.sanitizeFileName(input.record.title)}.pdf`,
      mimeType: 'application/pdf',
      contentBase64: pdfBuffer.toString('base64'),
      downloadCount: input.downloadCount,
      preview: input.preview,
    };
  }

  private buildPrescriptionPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    folio: string;
    verificationCode: string;
    downloadCount: number;
  }) {
    const medicationLines = this.readPrescriptionMedicationArray(
      input.formData.recetaMedicamentos,
    ).map((item, index) =>
      [
        `${index + 1}. ${item.medicamento || 'Medicamento sin nombre'}`,
        item.presentacion ? `Pres.: ${item.presentacion}` : null,
        item.dosis ? `Dosis: ${item.dosis}` : null,
        item.via ? `Vía: ${item.via}` : null,
        item.frecuencia ? `Frecuencia: ${item.frecuencia}` : null,
        item.duracionDias ? `Duración: ${item.duracionDias} días` : item.duracion ? `Duración: ${item.duracion}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    );
    const signsOfAlarm = this.readStringArray(input.formData.recetaSignosAlarma).join(', ');
    const legalFields = [
      `Institución: ${this.readStringValue(input.formData.recetaInstitucionEmisora)}`,
      `Profesional: ${this.readStringValue(input.formData.recetaNombreProfesional)}`,
      `Cédula: ${this.readStringValue(input.formData.recetaCedulaProfesional)}`,
      `Especialidad: ${this.readStringValue(input.formData.recetaEspecialidadProfesional)}`,
      `Lugar: ${this.readStringValue(input.formData.recetaLugarAtencion)}`,
    ];
    const commonLines = [
      input.recordTitle,
      `Folio: ${input.folio}`,
      `Código verificación: ${input.verificationCode}`,
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Diagnóstico principal: ${this.readStringValue(input.formData.recetaDiagnosticoPrincipal)}`,
      `CIE-10: ${this.readStringValue(input.formData.recetaDiagnosticoCie10)}`,
      `Indicaciones generales: ${this.readStringValue(input.formData.recetaIndicacionesGenerales)}`,
      `Indicaciones diagnósticas: ${this.readStringValue(input.formData.recetaIndicacionesDiagnosticas)}`,
      'Medicamentos:',
      ...(medicationLines.length > 0 ? medicationLines : ['Sin medicamentos capturados']),
      `Signos de alarma: ${signsOfAlarm || 'Sin signos de alarma capturados'}`,
      `Seguimiento: ${this.readStringValue(input.formData.recetaSeguimientoFecha)} ${this.readStringValue(input.formData.recetaSeguimientoTipo)}`.trim(),
      `Instrucciones: ${this.readStringValue(input.formData.recetaSeguimientoInstrucciones)}`,
      `Comprensión del paciente: ${this.readStringValue(input.formData.recetaComprensionPaciente)}`,
      ...legalFields,
      `Descargas oficiales: ${input.downloadCount}`,
    ];
    const lines = [
      'COPIA PACIENTE',
      ...commonLines,
      '----------------------------------------',
      'COPIA FARMACIA',
      ...commonLines,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildClinicalDocumentPdfDocument(input: {
    encounter: TenantEncounterRecord;
    noteType: string;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    verificationCode: string;
    downloadCount: number;
  }) {
    const diagnosisLines = this.readDiagnosesArrayFromUnknown(
      input.formData.documentoDiagnosticos,
    ).map((item, index) =>
      `${index + 1}. ${item.diagnostico || 'Diagnóstico sin capturar'} ${item.cie10 ? `· ${item.cie10}` : ''} ${item.estado ? `· ${item.estado}` : ''}`.trim(),
    );
    const commonHeader = [
      input.recordTitle,
      `Tipo: ${input.noteType}`,
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Código de verificación: ${input.verificationCode}`,
    ];
    const commonLegal = [
      `Institución: ${this.readStringValue(input.formData.documentoInstitucionEmisora)}`,
      `Profesional: ${this.readStringValue(input.formData.documentoNombreProfesional)}`,
      `Cédula: ${this.readStringValue(input.formData.documentoCedulaProfesional)}`,
      `Especialidad: ${this.readStringValue(input.formData.documentoEspecialidadProfesional)}`,
      `Lugar: ${this.readStringValue(input.formData.documentoLugarAtencion)}`,
    ];
    const documentSpecificLines: Record<string, string[]> = {
      'Solicitud de laboratorio': [
        `Motivo: ${this.readStringValue(input.formData.documentoMotivoSolicitud)}`,
        `Estudios solicitados: ${this.readStringValue(input.formData.documentoEstudiosSolicitados)}`,
        `Diagnóstico: ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}`,
        `CIE-10: ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}`,
        `Prioridad: ${this.readStringValue(input.formData.documentoPrioridad)}`,
        `Observaciones: ${this.readStringValue(input.formData.documentoObservaciones)}`,
      ],
      'Solicitud de imagenología': [
        `Motivo: ${this.readStringValue(input.formData.documentoMotivoSolicitud)}`,
        `Estudio: ${this.readStringValue(input.formData.documentoEstudiosSolicitados)}`,
        `Región anatómica: ${this.readStringValue(input.formData.documentoRegionAnatomica)}`,
        `Diagnóstico presuntivo: ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}`,
        `CIE-10: ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}`,
        `Indicaciones especiales: ${this.readStringValue(input.formData.documentoIndicacionesEspeciales)}`,
        `Prioridad: ${this.readStringValue(input.formData.documentoPrioridad)}`,
      ],
      'Referencia / contrarreferencia': [
        `Tipo: ${this.readStringValue(input.formData.documentoTipoReferencia)}`,
        `Unidad destino: ${this.readStringValue(input.formData.documentoUnidadDestino)}`,
        `Motivo de envío: ${this.readStringValue(input.formData.documentoMotivoEnvio)}`,
        `Resumen clínico: ${this.readStringValue(input.formData.documentoResumenClinico)}`,
        'Diagnósticos:',
        ...(diagnosisLines.length > 0 ? diagnosisLines : ['Sin diagnósticos capturados']),
        `Tratamiento actual: ${this.readStringValue(input.formData.documentoTratamientoActual)}`,
        `Estudios realizados: ${this.readStringValue(input.formData.documentoEstudiosRealizados)}`,
        `Recomendaciones: ${this.readStringValue(input.formData.documentoRecomendaciones)}`,
      ],
      'Consentimiento informado': [
        `Procedimiento: ${this.readStringValue(input.formData.documentoProcedimientoTipo)}`,
        `Descripción: ${this.readStringValue(input.formData.documentoProcedimientoDescripcion)}`,
        `Riesgos: ${this.readStringValue(input.formData.documentoRiesgos)}`,
        `Beneficios: ${this.readStringValue(input.formData.documentoBeneficios)}`,
        `Alternativas: ${this.readStringValue(input.formData.documentoAlternativas)}`,
        `Pronóstico sin tratamiento: ${this.readStringValue(input.formData.documentoPronosticoSinTratamiento)}`,
        `Paciente / tutor: ${this.readStringValue(input.formData.documentoNombreTutor)}`,
        `Relación: ${this.readStringValue(input.formData.documentoRelacionTutor)}`,
        `Firma paciente: ${this.readStringValue(input.formData.documentoFirmaPaciente)}`,
      ],
      'Certificado / constancia': [
        `Tipo: ${this.readStringValue(input.formData.documentoTipoCertificado)}`,
        `Uso del documento: ${this.readStringValue(input.formData.documentoUsoDocumento)}`,
        `Motivo: ${this.readStringValue(input.formData.documentoMotivo)}`,
        `Diagnóstico: ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}`,
        `CIE-10: ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}`,
        `Reposo: ${this.readStringValue(input.formData.documentoReposoInicio)} al ${this.readStringValue(input.formData.documentoReposoFin)}`.trim(),
        `Observaciones: ${this.readStringValue(input.formData.documentoObservaciones)}`,
      ],
      'Nota de cierre': [
        `Motivo de cierre: ${this.readStringValue(input.formData.documentoMotivoCierre)}`,
        `Resumen clínico final: ${this.readStringValue(input.formData.documentoResumenClinicoFinal)}`,
        'Diagnósticos finales:',
        ...(diagnosisLines.length > 0 ? diagnosisLines : ['Sin diagnósticos capturados']),
        `Estado final: ${this.readStringValue(input.formData.documentoEstadoFinal)}`,
        `Indicaciones al egreso: ${this.readStringValue(input.formData.documentoIndicacionesEgreso)}`,
        `Plan de seguimiento: ${this.readStringValue(input.formData.documentoPlanSeguimiento)}`,
      ],
    };
    const lines = [
      ...commonHeader,
      ...(documentSpecificLines[input.noteType] ?? []),
      ...commonLegal,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private renderSimplePdf(lines: string[]) {
    const sanitizedLines = lines
      .map((line) => this.escapePdfText(line))
      .slice(0, 90);
    const contentStream = [
      'BT',
      '/F1 10 Tf',
      '42 800 Td',
      '12 TL',
      ...sanitizedLines.flatMap((line, index) =>
        index === 0 ? [`(${line}) Tj`] : ['T*', `(${line}) Tj`],
      ),
      'ET',
    ].join('\n');
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${Buffer.byteLength(contentStream, 'utf8')} >> stream\n${contentStream}\nendstream endobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${object}\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (let index = 1; index < offsets.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, 'utf8');
  }

  private escapePdfText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private readStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  private normalizeRecordMetadata(rawMetadata: Prisma.JsonValue | null | undefined) {
    if (!rawMetadata || typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
      return null;
    }

    return rawMetadata as Record<string, unknown>;
  }

  private assertRecordCanBeSigned(
    noteType: string,
    formDataJson: Prisma.JsonValue,
  ) {
    const formData =
      formDataJson && typeof formDataJson === 'object' && !Array.isArray(formDataJson)
        ? (formDataJson as Record<string, unknown>)
        : {};

    const requiredFieldsByNoteType: Record<string, string[]> = {
      'Solicitud de laboratorio': [
        'documentoMotivoSolicitud',
        'documentoEstudiosSolicitados',
      ],
      'Solicitud de imagenología': ['documentoMotivoSolicitud'],
      'Referencia / contrarreferencia': [
        'documentoUnidadDestino',
        'documentoMotivoEnvio',
        'documentoResumenClinico',
      ],
      'Consentimiento informado': [
        'documentoProcedimientoTipo',
        'documentoProcedimientoDescripcion',
        'documentoRiesgos',
        'documentoFirmaPaciente',
      ],
      'Certificado / constancia': ['documentoMotivo'],
      'Nota de cierre': [
        'documentoMotivoCierre',
        'documentoResumenClinicoFinal',
      ],
    };

    const missingFields = (requiredFieldsByNoteType[noteType] ?? []).filter((fieldKey) => {
      const value = formData[fieldKey];
      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missingFields.length > 0) {
      throw new BadRequestException(
        'Completa los campos obligatorios del documento antes de firmarlo',
      );
    }
  }

  private assertEncounterEditable(encounter: TenantEncounterRecord) {
    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException(
        'El episodio ya está cerrado y no permite nuevas capturas o modificaciones',
      );
    }
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
