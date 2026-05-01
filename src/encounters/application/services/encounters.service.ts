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
    const triageVersionContext = await this.resolveTriageVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
    });
    const emergencyInitialNoteVersionContext =
      await this.resolveEmergencyInitialNoteVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const emergencyEvolutionVersionContext =
      await this.resolveEmergencyEvolutionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const emergencyOrdersVersionContext =
      await this.resolveEmergencyOrdersVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const emergencyConsultationVersionContext =
      await this.resolveEmergencyConsultationVersionContext({
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
      evolutionVersionContext,
      prescriptionVersionContext,
      documentVersionContext,
      triageVersionContext,
      emergencyInitialNoteVersionContext,
      emergencyEvolutionVersionContext,
      emergencyOrdersVersionContext,
      emergencyConsultationVersionContext,
      responsibleUser,
    });

    const createdRecord = await this.prisma.encounterSectionRecord.create({
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
    await this.syncEmergencyConsultationRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncEmergencyEvolutionRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncEmergencyOrdersRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
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
    const triageVersionContext = await this.resolveTriageVersionContext({
      encounterId: encounter.id,
      encounterType: encounter.encounterType,
      tabKey: input.tabKey,
      currentRecordId: currentRecord.id,
    });
    const emergencyInitialNoteVersionContext =
      await this.resolveEmergencyInitialNoteVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const emergencyEvolutionVersionContext =
      await this.resolveEmergencyEvolutionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const emergencyOrdersVersionContext =
      await this.resolveEmergencyOrdersVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const emergencyConsultationVersionContext =
      await this.resolveEmergencyConsultationVersionContext({
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
      evolutionVersionContext,
      prescriptionVersionContext,
      documentVersionContext,
      triageVersionContext,
      emergencyInitialNoteVersionContext,
      emergencyEvolutionVersionContext,
      emergencyOrdersVersionContext,
      emergencyConsultationVersionContext,
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
    await this.syncEmergencyConsultationRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncEmergencyEvolutionRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncEmergencyOrdersRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
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
    this.assertRecordCanBeSigned({
      encounterType: currentRecord.encounterType,
      tabKey: currentRecord.tabKey,
      noteType: currentRecord.noteType,
      formDataJson: currentRecord.formDataJson,
    });

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

      if (
        this.isEmergencyConsultationRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "EmergencyConsultation"
          SET "signedAt" = ${signedAt}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
      }

      if (
        this.isEmergencyEvolutionRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "EmergencyEvolution"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
      }

      if (
        this.isEmergencyOrdersRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "EmergencyOrderSet"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
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

    if (
      record.status !== EncounterRecordStatus.SIGNED &&
      !this.isEmergencyTriageRecord(record.encounterType, record.tabKey) &&
      !this.isEmergencyInitialNoteRecord(record.encounterType, record.tabKey) &&
      !this.isEmergencyEvolutionRecord(record.encounterType, record.tabKey) &&
      !this.isEmergencyOrdersRecord(record.encounterType, record.tabKey) &&
      !this.isEmergencyConsultationRecord(record.encounterType, record.tabKey)
    ) {
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

  private async resolveTriageVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isEmergencyTriageRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Triage',
        noteType: 'Triage',
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

  private async resolveEmergencyInitialNoteVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isEmergencyInitialNoteRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Nota inicial',
        noteType: 'Nota inicial',
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

  private async resolveEmergencyEvolutionVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isEmergencyEvolutionRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Evolución',
        noteType: 'Evolución en urgencias',
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

  private async resolveEmergencyOrdersVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isEmergencyOrdersRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Órdenes / Indicaciones',
        noteType: 'Órdenes e indicaciones',
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

  private async resolveEmergencyConsultationVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isEmergencyConsultationRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Interconsultas',
        noteType: 'Interconsultas',
        ...(input.currentRecordId ? { NOT: { id: input.currentRecordId } } : {}),
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
    triageVersionContext: Awaited<
      ReturnType<EncountersService['resolveTriageVersionContext']>
    >;
    emergencyInitialNoteVersionContext: Awaited<
      ReturnType<EncountersService['resolveEmergencyInitialNoteVersionContext']>
    >;
    emergencyEvolutionVersionContext: Awaited<
      ReturnType<EncountersService['resolveEmergencyEvolutionVersionContext']>
    >;
    emergencyOrdersVersionContext: Awaited<
      ReturnType<EncountersService['resolveEmergencyOrdersVersionContext']>
    >;
    emergencyConsultationVersionContext: Awaited<
      ReturnType<EncountersService['resolveEmergencyConsultationVersionContext']>
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
      this.isEmergencyTriageRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.triageVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildEmergencyTriageFormData({
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Triage',
        noteType: 'Triage',
        title: `Triage V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          inheritedFromRecordId: currentRecordMetadata.inheritedFromRecordId ?? null,
        },
      };
    }

    if (
      this.isEmergencyConsultationRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const latestInitialNoteRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Nota inicial',
      );
      const latestEvolutionRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Evolución',
      );
      const latestOrdersRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Órdenes / Indicaciones',
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.emergencyConsultationVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildEmergencyConsultationFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        latestInitialNoteFormDataJson: latestInitialNoteRecord?.formDataJson ?? null,
        latestEvolutionFormDataJson: latestEvolutionRecord?.formDataJson ?? null,
        latestOrdersFormDataJson: latestOrdersRecord?.formDataJson ?? null,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Interconsultas',
        noteType: 'Interconsultas',
        title: `Interconsultas V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            latestOrdersRecord?.id ??
            latestEvolutionRecord?.id ??
            latestInitialNoteRecord?.id ??
            null,
        },
      };
    }

    if (
      this.isEmergencyOrdersRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const latestInitialNoteRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Nota inicial',
      );
      const latestEvolutionRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Evolución',
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.emergencyOrdersVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildEmergencyOrdersFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        latestInitialNoteFormDataJson: latestInitialNoteRecord?.formDataJson ?? null,
        latestEvolutionFormDataJson: latestEvolutionRecord?.formDataJson ?? null,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Órdenes / Indicaciones',
        noteType: 'Órdenes e indicaciones',
        title: `Órdenes e indicaciones V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            latestEvolutionRecord?.id ??
            latestInitialNoteRecord?.id ??
            null,
        },
      };
    }

    if (
      this.isEmergencyEvolutionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const latestInitialNoteRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Nota inicial',
      );
      const latestEvolutionRecord =
        input.emergencyEvolutionVersionContext?.latestRecord ?? null;
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.emergencyEvolutionVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildEmergencyEvolutionFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        latestInitialNoteFormDataJson: latestInitialNoteRecord?.formDataJson ?? null,
        latestEvolutionFormDataJson: latestEvolutionRecord?.formDataJson ?? null,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Evolución',
        noteType: 'Evolución en urgencias',
        title: `Evolución en urgencias V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            latestEvolutionRecord?.id ??
            latestInitialNoteRecord?.id ??
            null,
        },
      };
    }

    if (
      this.isEmergencyInitialNoteRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const latestTriageRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Triage',
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.emergencyInitialNoteVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildEmergencyInitialNoteFormData({
        incomingFormData: input.input.formData,
        triageFormDataJson: latestTriageRecord?.formDataJson ?? null,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Nota inicial',
        noteType: 'Nota inicial',
        title: `Nota inicial V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ?? latestTriageRecord?.id ?? null,
        },
      };
    }

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

  private isEmergencyTriageRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.EMERGENCY && tabKey === 'Triage';
  }

  private isEmergencyInitialNoteRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.EMERGENCY && tabKey === 'Nota inicial';
  }

  private isEmergencyEvolutionRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.EMERGENCY && tabKey === 'Evolución';
  }

  private isEmergencyOrdersRecord(encounterType: EncounterType, tabKey: string) {
    return (
      encounterType === EncounterType.EMERGENCY &&
      tabKey === 'Órdenes / Indicaciones'
    );
  }

  private isEmergencyConsultationRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.EMERGENCY && tabKey === 'Interconsultas';
  }

  private buildEmergencyTriageFormData(input: {
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoTriage: 'Triage',
      tipoRegistro: 'Triage',
      triageLegalMedico:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      triageLegalCedula: input.responsibleUser?.professionalLicense ?? 'Sin cédula',
    };
    const tiempoObjetivoAtencion = this.calculateTriageTargetTime(
      baseFormData.nivelPrioridadTriage,
    );
    const tiempoEspera = this.calculateTriageWaitTime(
      baseFormData.horaLlegada,
      baseFormData.horaTriage,
    );
    const glasgowTotal = this.calculateGlasgowTotal({
      eye: baseFormData.glasgowE,
      verbal: baseFormData.glasgowV,
      motor: baseFormData.glasgowM,
    });
    const news2Total = this.calculateNews2(baseFormData);
    const alertasAutomaticas = this.buildTriageAutomaticAlerts({
      formData: baseFormData,
      glasgowTotal,
      news2Total,
    });

    return {
      ...baseFormData,
      fechaRegistroTriage: input.recordedAt.toISOString().slice(0, 16),
      tiempoObjetivoAtencion,
      tiempoEspera,
      glasgowTotal: glasgowTotal === null ? '' : String(glasgowTotal),
      news2Total: news2Total === null ? '' : String(news2Total),
      banderaRojaAutomatica: alertasAutomaticas.length > 0 ? 'SI' : 'NO',
      alertasAutomaticas: alertasAutomaticas.join('\n'),
    };
  }

  private buildEmergencyInitialNoteFormData(input: {
    incomingFormData: Record<string, unknown>;
    triageFormDataJson: Prisma.JsonValue | null;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const triageFormData =
      input.triageFormDataJson &&
      typeof input.triageFormDataJson === 'object' &&
      !Array.isArray(input.triageFormDataJson)
        ? (input.triageFormDataJson as Record<string, unknown>)
        : {};
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoRegistro: 'Nota inicial',
      llegadaVisual: this.readStringValue(triageFormData.horaLlegada),
      triageVisual: this.readStringValue(triageFormData.horaTriage),
      inicioAtencionVisual:
        this.readStringValue(input.incomingFormData.inicioAtencionVisual) ||
        input.recordedAt.toISOString().slice(0, 16),
      decisionVisual: this.readStringValue(input.incomingFormData.horaDecision),
      alertasTriage: this.readStringValue(triageFormData.alertasAutomaticas),
      notaInicialLegalMedico:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      notaInicialLegalCedula:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
    };

    const triageSnapshotFields: Record<string, unknown> = {
      modoLlegadaNota: triageFormData.modoLlegada,
      taSistolicaNota: triageFormData.taSistolica,
      taDiastolicaNota: triageFormData.taDiastolica,
      fcNota: triageFormData.fc,
      frNota: triageFormData.fr,
      tempNota: triageFormData.temp,
      spo2Nota: triageFormData.spo2,
      evaNota: triageFormData.eva,
      glucosaNota: triageFormData.glucosa,
      glasgowNota: triageFormData.glasgowTotal,
      estadoMentalNota: triageFormData.estadoMental,
    };

    for (const [fieldKey, value] of Object.entries(triageSnapshotFields)) {
      if (
        !this.hasCapturedValue(baseFormData[fieldKey]) &&
        this.hasCapturedValue(value)
      ) {
        baseFormData[fieldKey] = value;
      }
    }

    return baseFormData;
  }

  private buildEmergencyEvolutionFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    latestInitialNoteFormDataJson: Prisma.JsonValue | null;
    latestEvolutionFormDataJson: Prisma.JsonValue | null;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const latestInitialNoteFormData =
      this.normalizeJsonObject(input.latestInitialNoteFormDataJson);
    const latestEvolutionFormData =
      this.normalizeJsonObject(input.latestEvolutionFormDataJson);
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoRegistro: 'Evolución en urgencias',
      fechaEvolucionUrg:
        this.readStringValue(input.incomingFormData.fechaEvolucionUrg) ||
        input.recordedAt.toISOString().slice(0, 10),
      horaEvolucionUrg:
        this.readStringValue(input.incomingFormData.horaEvolucionUrg) ||
        input.recordedAt.toISOString().slice(11, 16),
      diaEvolucionUrg: String(
        this.calculateEmergencyEvolutionDay(input.encounter.openedAt, input.recordedAt),
      ),
      resultadosEstudiosIntegrados: this.buildEmergencyExternalResultsSummary(input.encounter),
      ...this.buildEmergencyNursingSnapshot(),
      ...this.buildEmergencyAuxiliaryServicesSnapshot(input.encounter),
      evolucionUrgLegalNombre:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      evolucionUrgLegalCedula:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      evolucionUrgLegalEspecialidad:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      evolucionUrgLegalLugar:
        [input.encounter.facility?.name, input.encounter.serviceArea?.name]
          .filter(Boolean)
          .join(' · ') || 'Lugar no configurado',
    };

    const sourceFormData = Object.keys(latestEvolutionFormData).length > 0
      ? latestEvolutionFormData
      : latestInitialNoteFormData;
    const vitalSnapshotMap: Record<string, unknown> = {
      taSistolicaEvolUrg:
        latestEvolutionFormData.taSistolicaEvolUrg ??
        latestInitialNoteFormData.taSistolicaNota,
      taDiastolicaEvolUrg:
        latestEvolutionFormData.taDiastolicaEvolUrg ??
        latestInitialNoteFormData.taDiastolicaNota,
      fcEvolUrg: latestEvolutionFormData.fcEvolUrg ?? latestInitialNoteFormData.fcNota,
      frEvolUrg: latestEvolutionFormData.frEvolUrg ?? latestInitialNoteFormData.frNota,
      tempEvolUrg:
        latestEvolutionFormData.tempEvolUrg ?? latestInitialNoteFormData.tempNota,
      spo2EvolUrg:
        latestEvolutionFormData.spo2EvolUrg ?? latestInitialNoteFormData.spo2Nota,
      evaEvolUrg: latestEvolutionFormData.evaEvolUrg ?? latestInitialNoteFormData.evaNota,
      glucosaEvolUrg:
        latestEvolutionFormData.glucosaEvolUrg ?? latestInitialNoteFormData.glucosaNota,
      glasgowEvolUrg:
        latestEvolutionFormData.glasgowEvolUrg ?? latestInitialNoteFormData.glasgowNota,
      diagnosticosEvolucionUrg:
        latestEvolutionFormData.diagnosticosEvolucionUrg ??
        this.buildEmergencyEvolutionDiagnoses(latestInitialNoteFormData),
      tratamientoEvolUrg:
        latestEvolutionFormData.tratamientoEvolUrg ??
        latestInitialNoteFormData.medicamentosPlan,
      estudiosPendientesUrg:
        latestEvolutionFormData.estudiosPendientesUrg ??
        latestInitialNoteFormData.estudiosPlan,
      interconsultasEvolUrg:
        latestEvolutionFormData.interconsultasEvolUrg ??
        latestInitialNoteFormData.interconsultasPlan,
      seguimientoEvolUrg:
        latestEvolutionFormData.seguimientoEvolUrg ??
        latestInitialNoteFormData.resumenPronostico,
      consentimientoVigenteUrg:
        latestEvolutionFormData.consentimientoVigenteUrg ??
        (this.hasCapturedValue(latestInitialNoteFormData.consentimientoInicial)
          ? 'VIGENTE'
          : ''),
      informacionBrindadaUrg:
        latestEvolutionFormData.informacionBrindadaUrg ??
        latestInitialNoteFormData.consentimientoInicial,
    };

    for (const [fieldKey, value] of Object.entries(vitalSnapshotMap)) {
      if (
        !this.hasCapturedValue(baseFormData[fieldKey]) &&
        this.hasCapturedValue(value)
      ) {
        baseFormData[fieldKey] = value;
      }
    }

    if (
      !this.hasCapturedValue(baseFormData.diagnosticosEvolucionUrg) &&
      Array.isArray(sourceFormData.diagnosticosEvolucionUrg)
    ) {
      baseFormData.diagnosticosEvolucionUrg = sourceFormData.diagnosticosEvolucionUrg;
    }

    return baseFormData;
  }

  private buildEmergencyOrdersFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    latestInitialNoteFormDataJson: Prisma.JsonValue | null;
    latestEvolutionFormDataJson: Prisma.JsonValue | null;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const latestInitialNoteFormData =
      this.normalizeJsonObject(input.latestInitialNoteFormDataJson);
    const latestEvolutionFormData =
      this.normalizeJsonObject(input.latestEvolutionFormDataJson);
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoRegistro: 'Órdenes e indicaciones',
      ordenesLegalMedico:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      ordenesLegalCedula:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      ordenesLegalEspecialidad:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      ordenesLegalLugar:
        [input.encounter.facility?.name, input.encounter.serviceArea?.name]
          .filter(Boolean)
          .join(' · ') || 'Lugar no configurado',
    };
    const medicationSuggestion =
      this.readStringValue(latestEvolutionFormData.tratamientoEvolUrg) ||
      this.readStringValue(latestInitialNoteFormData.medicamentosPlan);
    const studySuggestion =
      this.readStringValue(latestEvolutionFormData.estudiosPendientesUrg) ||
      this.readStringValue(latestInitialNoteFormData.estudiosPlan) ||
      this.readStringValue(latestInitialNoteFormData.estudiosAnalisis);
    const interventionSuggestion =
      this.readStringValue(latestInitialNoteFormData.intervencionesPlan);

    if (
      !this.hasCapturedValue(baseFormData.medicamentosOrdenesUrg) &&
      medicationSuggestion
    ) {
      baseFormData.medicamentosOrdenesUrg = [
        {
          medicamento: medicationSuggestion,
          dosis: '',
          via: '',
          frecuencia: '',
          duracion: '',
          indicacion: 'Sugerido desde plan clínico',
          prioridad: 'NORMAL',
        },
      ];
    }

    if (
      !this.hasCapturedValue(baseFormData.estudiosSolicitadosOrdenes) &&
      studySuggestion
    ) {
      baseFormData.estudiosSolicitadosOrdenes = [
        {
          tipo: 'LABORATORIO',
          estudio: studySuggestion,
          prioridad: 'NORMAL',
          justificacion: 'Sugerido desde plan clínico',
          frecuencia: '',
          estado: 'PENDIENTE',
        },
      ];
    }

    if (
      !this.hasCapturedValue(baseFormData.monitoreoOrdenes) &&
      interventionSuggestion
    ) {
      baseFormData.monitoreoOrdenes = interventionSuggestion;
    }

    const safetyAlerts = this.buildEmergencyOrderSafetyAlerts({
      medications: baseFormData.medicamentosOrdenesUrg,
      allergies: input.encounter.allergies.map((allergy) => allergy.substance),
    });

    return {
      ...baseFormData,
      alertaAlergiasOrdenes: safetyAlerts.allergyAlerts,
      alertaDuplicidadOrdenes: safetyAlerts.duplicationAlerts,
      alertaDosisOrdenes: safetyAlerts.doseAlerts,
      estadoOrdenesTrazabilidad: this.buildEmergencyOrdersTraceability({
        medications: baseFormData.medicamentosOrdenesUrg,
        studies: baseFormData.estudiosSolicitadosOrdenes,
        solutions: baseFormData.solucionesIntravenosasOrdenes,
        responsibleUserName:
          input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      }),
    };
  }

  private buildEmergencyConsultationFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    latestInitialNoteFormDataJson: Prisma.JsonValue | null;
    latestEvolutionFormDataJson: Prisma.JsonValue | null;
    latestOrdersFormDataJson: Prisma.JsonValue | null;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const initialNote = this.normalizeJsonObject(input.latestInitialNoteFormDataJson);
    const evolution = this.normalizeJsonObject(input.latestEvolutionFormDataJson);
    const orders = this.normalizeJsonObject(input.latestOrdersFormDataJson);
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoRegistro: 'Interconsultas',
      fechaInterconsulta: this.readStringValue(input.incomingFormData.fechaInterconsulta) || input.recordedAt.toISOString().slice(0, 10),
      horaInterconsulta: this.readStringValue(input.incomingFormData.horaInterconsulta) || input.recordedAt.toISOString().slice(11, 16),
      medicoSolicitanteInterconsulta:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaSolicitanteInterconsulta:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      servicioSolicitanteInterconsulta: 'Urgencias',
      interconsultaLegalNombre:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      interconsultaLegalCedula:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      interconsultaLegalEspecialidad:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      interconsultaLegalLugar:
        [input.encounter.facility?.name, input.encounter.serviceArea?.name]
          .filter(Boolean)
          .join(' · ') || 'Lugar no configurado',
    };
    const priority = this.readStringValue(baseFormData.prioridadInterconsulta);
    const requestedAt = this.combineDateAndTime(
      baseFormData.fechaInterconsulta,
      baseFormData.horaInterconsulta,
    ) ?? input.recordedAt;
    const receivedAt = this.parseOptionalDate(baseFormData.horaRecepcionInterconsulta);
    const respondedAt = this.parseOptionalDate(baseFormData.horaRespuestaInterconsulta);

    if (!this.hasCapturedValue(baseFormData.prioridadInterconsulta)) {
      baseFormData.prioridadInterconsulta =
        this.readStringValue(initialNote.riesgoVitalNota) === 'ALTO' ||
        this.readStringValue(evolution.estadoClinicoEvolucionUrg) === 'CRITICO'
          ? 'INMEDIATA'
          : 'URGENTE';
    }
    if (!this.hasCapturedValue(baseFormData.estatusInterconsulta)) {
      baseFormData.estatusInterconsulta = 'PENDIENTE';
    }
    if (!this.hasCapturedValue(baseFormData.motivoInterconsulta)) {
      baseFormData.motivoInterconsulta =
        this.readStringValue(initialNote.motivoAtencion) ||
        this.readStringValue(evolution.referenciaPacienteUrg);
    }
    if (!this.hasCapturedValue(baseFormData.resumenClinicoInterconsulta)) {
      baseFormData.resumenClinicoInterconsulta =
        this.readStringValue(evolution.justificacionClinicaNom004) ||
        this.readStringValue(initialNote.resumenPronostico) ||
        this.readStringValue(initialNote.estudiosAnalisis);
    }
    if (!this.hasCapturedValue(baseFormData.diagnosticoRelacionadoInterconsulta)) {
      baseFormData.diagnosticoRelacionadoInterconsulta =
        this.readStringValue(initialNote.diagnosticoNota);
    }
    if (!this.hasCapturedValue(baseFormData.cie10Interconsulta)) {
      baseFormData.cie10Interconsulta = this.readStringValue(initialNote.cie10Nota);
    }
    if (!this.hasCapturedValue(baseFormData.ordenesAsociadasInterconsulta)) {
      baseFormData.ordenesAsociadasInterconsulta =
        this.readStringValue(orders.estadoOrdenesTrazabilidad);
    }

    return {
      ...baseFormData,
      tiempoObjetivoInterconsulta: this.calculateConsultationTargetTime(
        this.readStringValue(baseFormData.prioridadInterconsulta) || priority,
      ),
      horaSolicitudInterconsulta: requestedAt.toISOString(),
      tiempoRespuestaInterconsulta: this.calculateConsultationResponseTime(
        requestedAt,
        receivedAt,
        respondedAt,
      ),
    };
  }

  private normalizeJsonObject(rawValue: Prisma.JsonValue | null) {
    return rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)
      ? (rawValue as Record<string, unknown>)
      : {};
  }

  private calculateEmergencyEvolutionDay(openedAt: Date, recordedAt: Date) {
    const elapsedMs = recordedAt.getTime() - openedAt.getTime();
    return Math.max(1, Math.floor(elapsedMs / 86_400_000) + 1);
  }

  private buildEmergencyEvolutionDiagnoses(
    latestInitialNoteFormData: Record<string, unknown>,
  ) {
    const diagnosis = this.readStringValue(latestInitialNoteFormData.diagnosticoNota);
    const cie10 = this.readStringValue(latestInitialNoteFormData.cie10Nota);

    return diagnosis || cie10
      ? [
          {
            diagnostico: diagnosis,
            cie10,
            estado: 'ACTIVO',
          },
        ]
      : [];
  }

  private buildEmergencyOrderSafetyAlerts(input: {
    medications: unknown;
    allergies: string[];
  }) {
    const medications = this.normalizeObjectArray(input.medications);
    const medicationNames = medications
      .map((item) => this.readStringValue(item.medicamento).trim())
      .filter(Boolean);
    const lowerMedicationNames = medicationNames.map((name) => name.toLowerCase());
    const allergyMatches = input.allergies.filter((allergy) =>
      lowerMedicationNames.some((medication) =>
        medication.includes(allergy.toLowerCase()),
      ),
    );
    const duplicatedMedicationNames = medicationNames.filter(
      (name, index) =>
        lowerMedicationNames.indexOf(name.toLowerCase()) !== index,
    );
    const missingDoseItems = medications
      .filter((item) => {
        const medication = this.readStringValue(item.medicamento);
        const dose = this.readStringValue(item.dosis);
        return medication && !dose;
      })
      .map((item) => this.readStringValue(item.medicamento));

    return {
      allergyAlerts:
        allergyMatches.length > 0
          ? `Verificar alergias registradas: ${allergyMatches.join(', ')}`
          : 'Sin alertas de alergia con los medicamentos capturados.',
      duplicationAlerts:
        duplicatedMedicationNames.length > 0
          ? `Posible duplicidad: ${[...new Set(duplicatedMedicationNames)].join(', ')}`
          : 'Sin duplicidad terapéutica detectada por nombre.',
      doseAlerts:
        missingDoseItems.length > 0
          ? `Capturar dosis para: ${missingDoseItems.join(', ')}`
          : 'Dosis capturada para los medicamentos indicados.',
    };
  }

  private buildEmergencyOrdersTraceability(input: {
    medications: unknown;
    studies: unknown;
    solutions: unknown;
    responsibleUserName: string;
  }) {
    const rows: string[] = [];

    this.normalizeObjectArray(input.medications).forEach((item, index) => {
      const medication = this.readStringValue(item.medicamento) || `Medicamento ${index + 1}`;
      rows.push(
        `${medication} | pendiente | ${input.responsibleUserName} | sin ejecución | enfermería`,
      );
    });

    this.normalizeObjectArray(input.studies).forEach((item, index) => {
      const study = this.readStringValue(item.estudio) || `Estudio ${index + 1}`;
      const type = this.readStringValue(item.tipo) || 'auxiliar';
      const status = this.readStringValue(item.estado) || 'PENDIENTE';
      rows.push(
        `${study} | ${status.toLowerCase()} | ${input.responsibleUserName} | sin ejecución | ${type.toLowerCase()}`,
      );
    });

    this.normalizeObjectArray(input.solutions).forEach((item, index) => {
      const solution = this.readStringValue(item.tipoSolucion) || `Solución ${index + 1}`;
      rows.push(
        `${solution} | pendiente | ${input.responsibleUserName} | sin ejecución | enfermería`,
      );
    });

    return rows.join('\n') || 'Sin órdenes operativas capturadas.';
  }

  private normalizeObjectArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
  }

  private calculateConsultationTargetTime(priority: string) {
    const targets: Record<string, string> = {
      INMEDIATA: '30 minutos',
      URGENTE: '1 hora',
      PREFERENTE: '4 horas',
      DIFERIDA: 'Diferida',
    };

    return targets[priority] ?? '';
  }

  private calculateConsultationTargetMinutes(priority: string) {
    const targets: Record<string, number | null> = {
      INMEDIATA: 30,
      URGENTE: 60,
      PREFERENTE: 240,
      DIFERIDA: null,
    };

    return targets[priority] ?? null;
  }

  private combineDateAndTime(dateValue: unknown, timeValue: unknown) {
    const dateText = this.readStringValue(dateValue);
    const timeText = this.readStringValue(timeValue);

    if (!dateText || !timeText) {
      return null;
    }

    const parsedDate = new Date(`${dateText}T${timeText}`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private calculateConsultationResponseTime(
    requestedAt: Date,
    receivedAt: Date | null,
    respondedAt: Date | null,
  ) {
    const endDate = respondedAt ?? receivedAt;

    if (!endDate || endDate < requestedAt) {
      return '';
    }

    return `${Math.round((endDate.getTime() - requestedAt.getTime()) / 60000)} min`;
  }

  private jsonbParameter(value: unknown): Prisma.Sql {
    if (value === null || value === undefined) {
      return Prisma.sql`NULL`;
    }

    return Prisma.sql`CAST(${JSON.stringify(value)} AS JSONB)`;
  }

  private async syncEmergencyEvolutionRecord(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (
      !this.isEmergencyEvolutionRecord(input.encounter.encounterType, input.tabKey)
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const nursingSnapshot = {
      habitus: this.readStringValue(input.formData.enfermeriaHabitusUrg),
      dolor: this.readStringValue(input.formData.enfermeriaDolorUrg),
      riesgoCaidas: this.readStringValue(input.formData.enfermeriaRiesgoCaidasUrg),
      medicacionAdministrada: this.readStringValue(input.formData.enfermeriaMedicacionUrg),
      procedimientos: this.readStringValue(input.formData.enfermeriaProcedimientosUrg),
      observaciones: this.readStringValue(input.formData.enfermeriaObservacionesUrg),
      responsableCedula: this.readStringValue(input.formData.enfermeriaResponsableUrg),
    };
    const auxiliarySnapshot = {
      ecg: this.readStringValue(input.formData.auxEcgUrg),
      laboratorios: this.readStringValue(input.formData.auxLaboratoriosUrg),
      interpretacion: this.readStringValue(input.formData.auxInterpretacionUrg),
      incidentes: this.readStringValue(input.formData.auxIncidentesUrg),
    };
    const evolutionDate = this.parseOptionalDate(input.formData.fechaEvolucionUrg);
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;

    await this.prisma.$executeRaw`
      INSERT INTO "EmergencyEvolution" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "evolutionDate",
        "evolutionTime", "evolutionDay", "clinicalStatus", "patientReference",
        "systolicBp", "diastolicBp", "heartRate", "respiratoryRate",
        "temperature", "oxygenSaturation", "painScale", "glucose", "glasgow",
        "directedPhysicalExam", "externalResultsSummary", "diagnosesJson",
        "adverseEvents", "complications", "treatmentPlan", "pendingStudies",
        "interconsultationsPlan", "followUpPlan", "consentStatus",
        "informationProvided", "clinicalJustification", "treatmentResponse",
        "nursingSnapshotJson", "auxiliaryServicesSnapshotJson",
        "professionalName", "professionalLicense", "professionalSpecialty",
        "careLocation", "signerUserId", "signedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt}, ${evolutionDate},
        ${this.readStringValue(input.formData.horaEvolucionUrg)}, ${this.readNumericValue(input.formData.diaEvolucionUrg)}, ${this.readStringValue(input.formData.estadoClinicoEvolucionUrg)}, ${this.readStringValue(input.formData.referenciaPacienteUrg)},
        ${this.readNumericValue(input.formData.taSistolicaEvolUrg)}, ${this.readNumericValue(input.formData.taDiastolicaEvolUrg)}, ${this.readNumericValue(input.formData.fcEvolUrg)}, ${this.readNumericValue(input.formData.frEvolUrg)},
        ${this.readNumericValue(input.formData.tempEvolUrg)}, ${this.readNumericValue(input.formData.spo2EvolUrg)}, ${this.readNumericValue(input.formData.evaEvolUrg)}, ${this.readNumericValue(input.formData.glucosaEvolUrg)}, ${this.readNumericValue(input.formData.glasgowEvolUrg)},
        ${this.readStringValue(input.formData.exploracionDirigidaUrg)}, ${this.readStringValue(input.formData.resultadosEstudiosIntegrados)}, ${this.jsonbParameter(input.formData.diagnosticosEvolucionUrg)},
        ${this.readStringValue(input.formData.eventosAdversosUrg)}, ${this.readStringValue(input.formData.complicacionesUrg)}, ${this.readStringValue(input.formData.tratamientoEvolUrg)}, ${this.readStringValue(input.formData.estudiosPendientesUrg)},
        ${this.readStringValue(input.formData.interconsultasEvolUrg)}, ${this.readStringValue(input.formData.seguimientoEvolUrg)}, ${this.readStringValue(input.formData.consentimientoVigenteUrg)},
        ${this.readStringValue(input.formData.informacionBrindadaUrg)}, ${this.readStringValue(input.formData.justificacionClinicaNom004)}, ${this.readStringValue(input.formData.respuestaTratamientoUrg)},
        ${this.jsonbParameter(nursingSnapshot)}, ${this.jsonbParameter(auxiliarySnapshot)},
        ${this.readStringValue(input.formData.evolucionUrgLegalNombre) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.evolucionUrgLegalCedula)}, ${this.readStringValue(input.formData.evolucionUrgLegalEspecialidad)},
        ${this.readStringValue(input.formData.evolucionUrgLegalLugar)}, ${signedAt ? input.userId : null}, ${signedAt}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "evolutionDate" = EXCLUDED."evolutionDate",
        "evolutionTime" = EXCLUDED."evolutionTime",
        "evolutionDay" = EXCLUDED."evolutionDay",
        "clinicalStatus" = EXCLUDED."clinicalStatus",
        "patientReference" = EXCLUDED."patientReference",
        "systolicBp" = EXCLUDED."systolicBp",
        "diastolicBp" = EXCLUDED."diastolicBp",
        "heartRate" = EXCLUDED."heartRate",
        "respiratoryRate" = EXCLUDED."respiratoryRate",
        "temperature" = EXCLUDED."temperature",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "painScale" = EXCLUDED."painScale",
        "glucose" = EXCLUDED."glucose",
        "glasgow" = EXCLUDED."glasgow",
        "directedPhysicalExam" = EXCLUDED."directedPhysicalExam",
        "externalResultsSummary" = EXCLUDED."externalResultsSummary",
        "diagnosesJson" = EXCLUDED."diagnosesJson",
        "adverseEvents" = EXCLUDED."adverseEvents",
        "complications" = EXCLUDED."complications",
        "treatmentPlan" = EXCLUDED."treatmentPlan",
        "pendingStudies" = EXCLUDED."pendingStudies",
        "interconsultationsPlan" = EXCLUDED."interconsultationsPlan",
        "followUpPlan" = EXCLUDED."followUpPlan",
        "consentStatus" = EXCLUDED."consentStatus",
        "informationProvided" = EXCLUDED."informationProvided",
        "clinicalJustification" = EXCLUDED."clinicalJustification",
        "treatmentResponse" = EXCLUDED."treatmentResponse",
        "nursingSnapshotJson" = EXCLUDED."nursingSnapshotJson",
        "auxiliaryServicesSnapshotJson" = EXCLUDED."auxiliaryServicesSnapshotJson",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncEmergencyOrdersRecord(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (!this.isEmergencyOrdersRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const orderSetId = input.sectionRecordId;
    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const medications = this.normalizeObjectArray(input.formData.medicamentosOrdenesUrg);
    const solutions = this.normalizeObjectArray(input.formData.solucionesIntravenosasOrdenes);
    const studies = this.normalizeObjectArray(input.formData.estudiosSolicitadosOrdenes);
    const transfusionApplies =
      input.formData.transfusionAplica === true ||
      this.readStringValue(input.formData.transfusionAplica).toLowerCase() === 'true';
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        INSERT INTO "EmergencyOrderSet" (
          "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
          "versionNumber", "title", "status", "recordedAt", "recordType",
          "monitoringInstructions", "oxygenType", "oxygenFlow", "oxygenTarget",
          "diet", "rest", "fluidControl", "allergyAlert",
          "therapeuticDuplicationAlert", "safeDoseAlert", "professionalName",
          "professionalLicense", "professionalSpecialty", "careLocation",
          "signerUserId", "signedAt", "createdAt", "updatedAt"
        )
        VALUES (
          ${orderSetId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
          ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt}, 'Órdenes e indicaciones',
          ${this.readStringValue(input.formData.monitoreoOrdenes)}, ${this.readStringValue(input.formData.oxigenoTipoOrdenes)}, ${this.readStringValue(input.formData.oxigenoFlujoOrdenes)}, ${this.readStringValue(input.formData.oxigenoMetaOrdenes)},
          ${this.readStringValue(input.formData.dietaOrdenes)}, ${this.readStringValue(input.formData.reposoOrdenes)}, ${this.readStringValue(input.formData.controlLiquidosOrdenes)}, ${this.readStringValue(input.formData.alertaAlergiasOrdenes)},
          ${this.readStringValue(input.formData.alertaDuplicidadOrdenes)}, ${this.readStringValue(input.formData.alertaDosisOrdenes)}, ${this.readStringValue(input.formData.ordenesLegalMedico) || 'Sin profesional responsable'},
          ${this.readStringValue(input.formData.ordenesLegalCedula)}, ${this.readStringValue(input.formData.ordenesLegalEspecialidad)}, ${this.readStringValue(input.formData.ordenesLegalLugar)},
          ${signedAt ? input.userId : null}, ${signedAt}, NOW(), NOW()
        )
        ON CONFLICT ("sectionRecordId") DO UPDATE SET
          "versionNumber" = EXCLUDED."versionNumber",
          "title" = EXCLUDED."title",
          "status" = EXCLUDED."status",
          "recordedAt" = EXCLUDED."recordedAt",
          "monitoringInstructions" = EXCLUDED."monitoringInstructions",
          "oxygenType" = EXCLUDED."oxygenType",
          "oxygenFlow" = EXCLUDED."oxygenFlow",
          "oxygenTarget" = EXCLUDED."oxygenTarget",
          "diet" = EXCLUDED."diet",
          "rest" = EXCLUDED."rest",
          "fluidControl" = EXCLUDED."fluidControl",
          "allergyAlert" = EXCLUDED."allergyAlert",
          "therapeuticDuplicationAlert" = EXCLUDED."therapeuticDuplicationAlert",
          "safeDoseAlert" = EXCLUDED."safeDoseAlert",
          "professionalName" = EXCLUDED."professionalName",
          "professionalLicense" = EXCLUDED."professionalLicense",
          "professionalSpecialty" = EXCLUDED."professionalSpecialty",
          "careLocation" = EXCLUDED."careLocation",
          "signerUserId" = EXCLUDED."signerUserId",
          "signedAt" = EXCLUDED."signedAt",
          "updatedAt" = NOW()
      `;

      await transaction.$executeRaw`DELETE FROM "EmergencyOrderMedication" WHERE "orderSetId" = ${orderSetId}`;
      await transaction.$executeRaw`DELETE FROM "EmergencyOrderIntravenousSolution" WHERE "orderSetId" = ${orderSetId}`;
      await transaction.$executeRaw`DELETE FROM "EmergencyOrderRequestedStudy" WHERE "orderSetId" = ${orderSetId}`;
      await transaction.$executeRaw`DELETE FROM "EmergencyOrderTrace" WHERE "orderSetId" = ${orderSetId}`;
      await transaction.$executeRaw`DELETE FROM "EmergencyOrderTransfusion" WHERE "orderSetId" = ${orderSetId}`;

      for (const [index, medication] of medications.entries()) {
        await transaction.$executeRaw`
          INSERT INTO "EmergencyOrderMedication" (
            "id", "tenantId", "orderSetId", "medicationName", "dose", "route",
            "frequency", "duration", "indication", "priority", "sortOrder",
            "createdAt", "updatedAt"
          )
          VALUES (
            ${randomUUID()}, ${input.tenantId}, ${orderSetId}, ${this.readStringValue(medication.medicamento)},
            ${this.readStringValue(medication.dosis)}, ${this.readStringValue(medication.via)},
            ${this.readStringValue(medication.frecuencia)}, ${this.readStringValue(medication.duracion)},
            ${this.readStringValue(medication.indicacion)}, ${this.readStringValue(medication.prioridad) || 'NORMAL'},
            ${index}, NOW(), NOW()
          )
        `;
        await this.insertEmergencyOrderTrace(transaction, {
          tenantId: input.tenantId,
          orderSetId,
          orderLabel: this.readStringValue(medication.medicamento) || `Medicamento ${index + 1}`,
          status: 'PENDIENTE',
          responsibleName: this.readStringValue(input.formData.ordenesLegalMedico),
          area: 'ENFERMERIA',
          sourceType: 'MEDICAMENTO',
          sourceIndex: index,
        });
      }

      for (const [index, solution] of solutions.entries()) {
        await transaction.$executeRaw`
          INSERT INTO "EmergencyOrderIntravenousSolution" (
            "id", "tenantId", "orderSetId", "solutionType", "volume", "rate",
            "duration", "addedMedication", "instructions", "sortOrder",
            "createdAt", "updatedAt"
          )
          VALUES (
            ${randomUUID()}, ${input.tenantId}, ${orderSetId}, ${this.readStringValue(solution.tipoSolucion)},
            ${this.readNumericValue(solution.volumen)}, ${this.readStringValue(solution.velocidad)},
            ${this.readStringValue(solution.duracion)}, ${this.readStringValue(solution.medicamentoAnadido)},
            ${this.readStringValue(solution.indicaciones)}, ${index}, NOW(), NOW()
          )
        `;
        await this.insertEmergencyOrderTrace(transaction, {
          tenantId: input.tenantId,
          orderSetId,
          orderLabel: this.readStringValue(solution.tipoSolucion) || `Solución ${index + 1}`,
          status: 'PENDIENTE',
          responsibleName: this.readStringValue(input.formData.ordenesLegalMedico),
          area: 'ENFERMERIA',
          sourceType: 'SOLUCION',
          sourceIndex: index,
        });
      }

      for (const [index, study] of studies.entries()) {
        const studyType = this.readStringValue(study.tipo) || 'LABORATORIO';
        await transaction.$executeRaw`
          INSERT INTO "EmergencyOrderRequestedStudy" (
            "id", "tenantId", "orderSetId", "studyType", "studyName", "priority",
            "justification", "frequency", "status", "sortOrder",
            "createdAt", "updatedAt"
          )
          VALUES (
            ${randomUUID()}, ${input.tenantId}, ${orderSetId}, ${studyType},
            ${this.readStringValue(study.estudio)}, ${this.readStringValue(study.prioridad) || 'NORMAL'},
            ${this.readStringValue(study.justificacion)}, ${this.readStringValue(study.frecuencia)},
            ${this.readStringValue(study.estado) || 'PENDIENTE'}, ${index}, NOW(), NOW()
          )
        `;
        await this.insertEmergencyOrderTrace(transaction, {
          tenantId: input.tenantId,
          orderSetId,
          orderLabel: this.readStringValue(study.estudio) || `Estudio ${index + 1}`,
          status: 'PENDIENTE',
          responsibleName: this.readStringValue(input.formData.ordenesLegalMedico),
          area: studyType === 'LABORATORIO' ? 'LABORATORIO' : 'GABINETE',
          sourceType: 'ESTUDIO',
          sourceIndex: index,
        });
      }

      if (transfusionApplies) {
        await transaction.$executeRaw`
          INSERT INTO "EmergencyOrderTransfusion" (
            "id", "tenantId", "orderSetId", "bloodProductType", "volume",
            "startedAt", "endedAt", "adverseReactions", "responsibleName",
            "sortOrder", "createdAt", "updatedAt"
          )
          VALUES (
            ${randomUUID()}, ${input.tenantId}, ${orderSetId}, ${this.readStringValue(input.formData.transfusionTipoHemoderivado)},
            ${this.readNumericValue(input.formData.transfusionVolumen)}, ${this.parseOptionalDate(input.formData.transfusionHoraInicio)},
            ${this.parseOptionalDate(input.formData.transfusionHoraFin)}, ${this.readStringValue(input.formData.transfusionReacciones)},
            ${this.readStringValue(input.formData.transfusionResponsable)}, 0, NOW(), NOW()
          )
        `;
      }
    });
  }

  private async insertEmergencyOrderTrace(
    transaction: Prisma.TransactionClient,
    input: {
      tenantId: string;
      orderSetId: string;
      orderLabel: string;
      status: string;
      responsibleName: string;
      area: string;
      sourceType: string;
      sourceIndex: number;
    },
  ) {
    await transaction.$executeRaw`
      INSERT INTO "EmergencyOrderTrace" (
        "id", "tenantId", "orderSetId", "orderLabel", "status",
        "responsibleName", "executedAt", "area", "sourceType", "sourceIndex",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.orderSetId}, ${input.orderLabel},
        ${input.status}, ${input.responsibleName}, NULL, ${input.area},
        ${input.sourceType}, ${input.sourceIndex}, NOW(), NOW()
      )
    `;
  }

  private async syncEmergencyConsultationRecord(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (
      !this.isEmergencyConsultationRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const requestedAt =
      this.combineDateAndTime(
        input.formData.fechaInterconsulta,
        input.formData.horaInterconsulta,
      ) ?? input.recordedAt;
    const receivedAt = this.parseOptionalDate(input.formData.horaRecepcionInterconsulta);
    const respondedAt = this.parseOptionalDate(input.formData.horaRespuestaInterconsulta);
    const priority = this.readStringValue(input.formData.prioridadInterconsulta) || 'URGENTE';
    const responseTimeMinutes =
      respondedAt && respondedAt >= requestedAt
        ? Math.round((respondedAt.getTime() - requestedAt.getTime()) / 60000)
        : receivedAt && receivedAt >= requestedAt
          ? Math.round((receivedAt.getTime() - requestedAt.getTime()) / 60000)
          : null;

    await this.prisma.$executeRaw`
      INSERT INTO "EmergencyConsultation" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "priority", "targetResponseMinutes",
        "requestedAt", "receivedAt", "respondedAt", "responseTimeMinutes",
        "notificationMedium", "requestingService", "requestedService",
        "requesterUserId", "requesterName", "requesterLicense",
        "consultantName", "consultantLicense", "reason", "clinicalSummary",
        "relatedDiagnosis", "relatedCie10", "consultantDiagnosis",
        "suggestedConduct", "recommendedFollowUp", "decision",
        "linkedOrdersSummary", "signedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${this.readStringValue(input.formData.estatusInterconsulta) || 'PENDIENTE'}, ${priority}, ${this.calculateConsultationTargetMinutes(priority)},
        ${requestedAt}, ${receivedAt}, ${respondedAt}, ${responseTimeMinutes},
        ${this.readStringValue(input.formData.medioNotificacionInterconsulta)}, 'Urgencias', ${this.readStringValue(input.formData.servicioInterconsultado) || 'Servicio no especificado'},
        ${input.userId}, ${this.readStringValue(input.formData.medicoSolicitanteInterconsulta) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaSolicitanteInterconsulta)},
        ${this.readStringValue(input.formData.medicoInterconsultante)}, ${this.readStringValue(input.formData.cedulaInterconsultante)}, ${this.readStringValue(input.formData.motivoInterconsulta)}, ${this.readStringValue(input.formData.resumenClinicoInterconsulta)},
        ${this.readStringValue(input.formData.diagnosticoRelacionadoInterconsulta)}, ${this.readStringValue(input.formData.cie10Interconsulta)}, ${this.readStringValue(input.formData.diagnosticoInterconsultante)},
        ${this.readStringValue(input.formData.conductaSugerida)}, ${this.readStringValue(input.formData.seguimientoRecomendado)}, ${this.readStringValue(input.formData.decisionInterconsulta)},
        ${this.readStringValue(input.formData.ordenesAsociadasInterconsulta)}, ${input.status === EncounterRecordStatus.SIGNED ? new Date() : null}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "priority" = EXCLUDED."priority",
        "targetResponseMinutes" = EXCLUDED."targetResponseMinutes",
        "requestedAt" = EXCLUDED."requestedAt",
        "receivedAt" = EXCLUDED."receivedAt",
        "respondedAt" = EXCLUDED."respondedAt",
        "responseTimeMinutes" = EXCLUDED."responseTimeMinutes",
        "notificationMedium" = EXCLUDED."notificationMedium",
        "requestedService" = EXCLUDED."requestedService",
        "requesterName" = EXCLUDED."requesterName",
        "requesterLicense" = EXCLUDED."requesterLicense",
        "consultantName" = EXCLUDED."consultantName",
        "consultantLicense" = EXCLUDED."consultantLicense",
        "reason" = EXCLUDED."reason",
        "clinicalSummary" = EXCLUDED."clinicalSummary",
        "relatedDiagnosis" = EXCLUDED."relatedDiagnosis",
        "relatedCie10" = EXCLUDED."relatedCie10",
        "consultantDiagnosis" = EXCLUDED."consultantDiagnosis",
        "suggestedConduct" = EXCLUDED."suggestedConduct",
        "recommendedFollowUp" = EXCLUDED."recommendedFollowUp",
        "decision" = EXCLUDED."decision",
        "linkedOrdersSummary" = EXCLUDED."linkedOrdersSummary",
        "signedAt" = EXCLUDED."signedAt",
        "updatedAt" = NOW()
    `;
  }

  private buildEmergencyExternalResultsSummary(encounter: TenantEncounterRecord) {
    const sections: string[] = [];

    if (encounter.labRequests.length > 0) {
      sections.push(`Laboratorio: ${encounter.labRequests.length} solicitud(es) vinculada(s).`);
    }

    if (encounter.imagingRequests.length > 0) {
      sections.push(`Imagenología: ${encounter.imagingRequests.length} solicitud(es) vinculada(s).`);
    }

    return sections.join('\n') || 'Sin resultados externos vinculados al episodio.';
  }

  private buildEmergencyNursingSnapshot() {
    return {
      enfermeriaHabitusUrg: 'Sin hoja de enfermería vinculada',
      enfermeriaDolorUrg: 'Sin hoja de enfermería vinculada',
      enfermeriaRiesgoCaidasUrg: 'Sin hoja de enfermería vinculada',
      enfermeriaMedicacionUrg: 'Sin hoja de enfermería vinculada',
      enfermeriaProcedimientosUrg: 'Sin hoja de enfermería vinculada',
      enfermeriaObservacionesUrg: 'Sin hoja de enfermería vinculada',
      enfermeriaResponsableUrg: 'Sin hoja de enfermería vinculada',
    };
  }

  private buildEmergencyAuxiliaryServicesSnapshot(encounter: TenantEncounterRecord) {
    return {
      auxEcgUrg: 'Sin ECG vinculado al episodio',
      auxLaboratoriosUrg:
        encounter.labRequests.length > 0
          ? `${encounter.labRequests.length} solicitud(es) de laboratorio vinculada(s)`
          : 'Sin laboratorios vinculados',
      auxInterpretacionUrg: 'Sin interpretación externa vinculada',
      auxIncidentesUrg: 'Sin incidentes registrados en servicios auxiliares',
    };
  }

  private hasCapturedValue(value: unknown) {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined;
  }

  private calculateTriageTargetTime(priority: unknown) {
    const priorityMap: Record<string, string> = {
      '1': 'Atención inmediata',
      '2': '10 minutos',
      '3': '30 minutos',
      '4': '60 minutos',
      '5': '120 minutos',
    };

    return priorityMap[this.readStringValue(priority)] ?? '';
  }

  private calculateTriageWaitTime(arrival: unknown, triage: unknown) {
    const arrivalDate = this.parseOptionalDate(arrival);
    const triageDate = this.parseOptionalDate(triage);

    if (!arrivalDate || !triageDate || triageDate < arrivalDate) {
      return '';
    }

    const minutes = Math.round(
      (triageDate.getTime() - arrivalDate.getTime()) / 60000,
    );
    return `${minutes} min`;
  }

  private calculateGlasgowTotal(input: {
    eye: unknown;
    verbal: unknown;
    motor: unknown;
  }) {
    const eye = this.readNumericValue(input.eye);
    const verbal = this.readNumericValue(input.verbal);
    const motor = this.readNumericValue(input.motor);

    if (eye === null || verbal === null || motor === null) {
      return null;
    }

    return eye + verbal + motor;
  }

  private calculateNews2(formData: Record<string, unknown>) {
    const respiratoryRate = this.readNumericValue(formData.fr);
    const oxygenSaturation = this.readNumericValue(formData.spo2);
    const temperature = this.readNumericValue(formData.temp);
    const systolicPressure = this.readNumericValue(formData.taSistolica);
    const heartRate = this.readNumericValue(formData.fc);

    if (
      respiratoryRate === null ||
      oxygenSaturation === null ||
      temperature === null ||
      systolicPressure === null ||
      heartRate === null
    ) {
      return null;
    }

    return (
      this.scoreNews2RespiratoryRate(respiratoryRate) +
      this.scoreNews2OxygenSaturation(oxygenSaturation) +
      this.scoreNews2Temperature(temperature) +
      this.scoreNews2SystolicPressure(systolicPressure) +
      this.scoreNews2HeartRate(heartRate)
    );
  }

  private scoreNews2RespiratoryRate(value: number) {
    if (value <= 8) return 3;
    if (value <= 11) return 1;
    if (value <= 20) return 0;
    if (value <= 24) return 2;
    return 3;
  }

  private scoreNews2OxygenSaturation(value: number) {
    if (value <= 91) return 3;
    if (value <= 93) return 2;
    if (value <= 95) return 1;
    return 0;
  }

  private scoreNews2Temperature(value: number) {
    if (value <= 35) return 3;
    if (value <= 36) return 1;
    if (value <= 38) return 0;
    if (value <= 39) return 1;
    return 2;
  }

  private scoreNews2SystolicPressure(value: number) {
    if (value <= 90) return 3;
    if (value <= 100) return 2;
    if (value <= 110) return 1;
    if (value <= 219) return 0;
    return 3;
  }

  private scoreNews2HeartRate(value: number) {
    if (value <= 40) return 3;
    if (value <= 50) return 1;
    if (value <= 90) return 0;
    if (value <= 110) return 1;
    if (value <= 130) return 2;
    return 3;
  }

  private buildTriageAutomaticAlerts(input: {
    formData: Record<string, unknown>;
    glasgowTotal: number | null;
    news2Total: number | null;
  }) {
    const alerts: string[] = [];
    const discriminators = [
      ['discDolorToracico', 'Dolor torácico'],
      ['discDisneaSevera', 'Disnea severa'],
      ['discSangradoActivo', 'Sangrado activo'],
      ['discAlteracionConciencia', 'Alteración del estado de conciencia'],
      ['discSepsis', 'Sospecha de sepsis'],
      ['discTraumaMayor', 'Trauma mayor'],
    ] as const;

    for (const [key, label] of discriminators) {
      if (input.formData[key] === true) {
        alerts.push(label);
      }
    }

    const oxygenSaturation = this.readNumericValue(input.formData.spo2);
    const systolicPressure = this.readNumericValue(input.formData.taSistolica);
    const heartRate = this.readNumericValue(input.formData.fc);
    const temperature = this.readNumericValue(input.formData.temp);

    if (oxygenSaturation !== null && oxygenSaturation < 92) {
      alerts.push('SpO2 menor a 92%');
    }
    if (systolicPressure !== null && systolicPressure < 90) {
      alerts.push('TA sistólica menor a 90 mmHg');
    }
    if (heartRate !== null && (heartRate < 40 || heartRate > 130)) {
      alerts.push('Frecuencia cardiaca crítica');
    }
    if (temperature !== null && temperature >= 39) {
      alerts.push('Fiebre alta');
    }
    if (input.glasgowTotal !== null && input.glasgowTotal < 13) {
      alerts.push('Glasgow menor a 13');
    }
    if (input.news2Total !== null && input.news2Total >= 5) {
      alerts.push('NEWS2 alto');
    }

    return [...new Set(alerts)];
  }

  private parseOptionalDate(value: unknown) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

  private assertRecordCanBeSigned(input: {
    encounterType: EncounterType;
    tabKey: string;
    noteType: string;
    formDataJson: Prisma.JsonValue;
  }) {
    const formData =
      input.formDataJson &&
      typeof input.formDataJson === 'object' &&
      !Array.isArray(input.formDataJson)
        ? (input.formDataJson as Record<string, unknown>)
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
    const triageRequiredFields = this.isEmergencyTriageRecord(
      input.encounterType,
      input.tabKey,
    )
      ? [
          'sistemaTriage',
          'nivelPrioridadTriage',
          'fechaLlegada',
          'horaLlegada',
          'horaTriage',
          'motivoPrincipal',
          'categoriaMotivo',
          'descripcionMotivo',
          'taSistolica',
          'taDiastolica',
          'fc',
          'fr',
          'temp',
          'spo2',
          'destinoInicial',
        ]
      : [];
    const emergencyInitialNoteRequiredFields = this.isEmergencyInitialNoteRecord(
      input.encounterType,
      input.tabKey,
    )
      ? [
          'motivoAtencion',
          'horaInicioSintomas',
          'riesgoVitalNota',
          'estudiosAnalisis',
          'diagnosticoNota',
          'cie10Nota',
          'estadoClinicoNota',
          'medicamentosPlan',
          'destinoPlan',
          'pronosticoNota',
        ]
      : [];
    const emergencyEvolutionRequiredFields = this.isEmergencyEvolutionRecord(
      input.encounterType,
      input.tabKey,
    )
      ? [
          'fechaEvolucionUrg',
          'horaEvolucionUrg',
          'estadoClinicoEvolucionUrg',
          'referenciaPacienteUrg',
          'taSistolicaEvolUrg',
          'taDiastolicaEvolUrg',
          'fcEvolUrg',
          'frEvolUrg',
          'tempEvolUrg',
          'spo2EvolUrg',
          'tratamientoEvolUrg',
          'justificacionClinicaNom004',
        ]
      : [];
    const emergencyOrdersRequiredFields = this.isEmergencyOrdersRecord(
      input.encounterType,
      input.tabKey,
    )
      ? ['medicamentosOrdenesUrg', 'estudiosSolicitadosOrdenes']
      : [];
    const emergencyConsultationRequiredFields =
      this.isEmergencyConsultationRecord(input.encounterType, input.tabKey)
        ? [
            'fechaInterconsulta',
            'horaInterconsulta',
            'prioridadInterconsulta',
            'estatusInterconsulta',
            'servicioInterconsultado',
            'motivoInterconsulta',
            'resumenClinicoInterconsulta',
          ]
        : [];

    const missingFields = [
      ...(requiredFieldsByNoteType[input.noteType] ?? []),
      ...triageRequiredFields,
      ...emergencyInitialNoteRequiredFields,
      ...emergencyEvolutionRequiredFields,
      ...emergencyOrdersRequiredFields,
      ...emergencyConsultationRequiredFields,
    ].filter((fieldKey) => {
      const value = formData[fieldKey];
      return !this.hasCapturedValue(value);
    });

    if (missingFields.length > 0) {
      throw new BadRequestException(
        this.isEmergencyTriageRecord(input.encounterType, input.tabKey)
          ? 'Completa los campos obligatorios del triage antes de firmarlo'
          : this.isEmergencyInitialNoteRecord(input.encounterType, input.tabKey)
            ? 'Completa los campos obligatorios de la nota inicial antes de firmarla'
            : this.isEmergencyEvolutionRecord(input.encounterType, input.tabKey)
              ? 'Completa los campos obligatorios de la evolución antes de firmarla'
              : this.isEmergencyOrdersRecord(input.encounterType, input.tabKey)
                ? 'Completa medicamentos y estudios solicitados antes de firmar las órdenes'
                : this.isEmergencyConsultationRecord(input.encounterType, input.tabKey)
                  ? 'Completa los campos obligatorios de la interconsulta antes de firmarla'
                  : 'Completa los campos obligatorios del documento antes de firmarlo',
      );
    }

    if (this.isEmergencyOrdersRecord(input.encounterType, input.tabKey)) {
      this.assertEmergencyOrdersReadyForSignature(formData);
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

  private assertEmergencyOrdersReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const medications = this.normalizeObjectArray(formData.medicamentosOrdenesUrg);
    const studies = this.normalizeObjectArray(formData.estudiosSolicitadosOrdenes);
    const medicationRequiredFields = [
      'medicamento',
      'dosis',
      'via',
      'frecuencia',
      'duracion',
      'prioridad',
    ];
    const studyRequiredFields = ['tipo', 'estudio', 'prioridad', 'justificacion'];
    const hasIncompleteMedication = medications.some((item) =>
      medicationRequiredFields.some(
        (fieldKey) => !this.hasCapturedValue(item[fieldKey]),
      ),
    );
    const hasIncompleteStudy = studies.some((item) =>
      studyRequiredFields.some(
        (fieldKey) => !this.hasCapturedValue(item[fieldKey]),
      ),
    );

    if (hasIncompleteMedication || hasIncompleteStudy) {
      throw new BadRequestException(
        'Completa medicamento, dosis, vía, frecuencia, duración, prioridad, estudio y justificación antes de firmar las órdenes',
      );
    }
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
