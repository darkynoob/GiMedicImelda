import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import {
  AdmissionSource,
  AuditAction,
  EncounterSectionRecord,
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

const consultationConsentComprehensionValues = [
  'Comprende y acepta',
  'Comprensión parcial',
  'No comprende',
  'Requiere apoyo o acompañante',
] as const;

const consultationPrescriptionPatientComprehensionValues =
  consultationConsentComprehensionValues;

const consultationPrescriptionRecordType = 'Receta e indicaciones';
const consultationPrescriptionTabKey = 'Receta e indicaciones';
const legacyConsultationPrescriptionTabKey = 'Receta / Indicaciones';
const emergencyInitialTriageType = 'Triaje inicial';
const triageClinicalDiscriminatorFields = [
  { key: 'discDolorToracico', label: 'Dolor torácico' },
  { key: 'discDisneaSevera', label: 'Disnea severa' },
  { key: 'discEstadoMentalAlterado', label: 'Estado mental alterado' },
  { key: 'discSangradoActivo', label: 'Sangrado activo' },
  { key: 'discFiebreMayor385', label: 'Fiebre mayor a 38.5 °C' },
  {
    key: 'discHipotensionSistolicaMenor90',
    label: 'Hipotensión sistólica menor a 90 mmHg',
  },
  { key: 'discConvulsiones', label: 'Convulsiones' },
  { key: 'discDeficitNeurologicoFocal', label: 'Déficit neurológico focal' },
  { key: 'discDolorAbdominalSevero', label: 'Dolor abdominal severo' },
  { key: 'discSepsis', label: 'Sospecha de sepsis' },
  { key: 'discTraumaMayor', label: 'Trauma mayor' },
  { key: 'discOtro', label: 'Otro' },
] as const;
const triageOtherClinicalDiscriminatorFieldKey = 'discOtroEspecificacion';
const emergencyTriageClinicalQuickStateFields = [
  {
    key: 'viaAerea',
    label: 'Vía aérea',
    allowedValues: ['PERMEABLE', 'COMPROMETIDA', 'INTUBADA'],
  },
  {
    key: 'estadoHemodinamico',
    label: 'Estado hemodinámico',
    allowedValues: ['ESTABLE', 'INESTABLE', 'CHOQUE'],
  },
  {
    key: 'estadoNeurologico',
    label: 'Estado neurológico',
    allowedValues: ['ALERTA', 'RESPONDE_VOZ', 'RESPONDE_DOLOR', 'INCONSCIENTE'],
  },
] as const;
const emergencyTriageDestinationAllowedValues = [
  'SALA_ESPERA',
  'OBSERVACION',
  'SALA_CHOQUE',
  'CONSULTA_MEDICA',
  'UCI',
  'HOSPITALIZACION',
] as const;
const emergencyTriageReevaluationRequiredValues = ['NO', 'SI'] as const;
const emergencyTriageReevaluationPriorityAllowedValues = [
  'SIN_CAMBIO',
  'REANIMACION',
  'EMERGENCIA',
  'URGENTE',
  'MENOR_URGENCIA',
  'NO_URGENTE',
] as const;
const emergencyTriageReevaluationFieldKeys = [
  'horaReevaluacion',
  'nuevaPrioridadReevaluacion',
  'motivoCambioReevaluacion',
] as const;
const emergencyTriageOriginAllowedValues = [
  'DOMICILIO',
  'VIA_PUBLICA',
  'TRABAJO',
  'ESCUELA',
  'OTRA_UNIDAD_MEDICA',
  'OTRO',
] as const;
const emergencyTriageReferenceAdmissionValues = ['NO', 'SI'] as const;
const emergencyTriageCompanionRelationshipAllowedValues = [
  'ESPOSO_A',
  'HIJO_A',
  'PADRE_MADRE',
  'HERMANO_A',
  'OTRO',
  'NINGUNO',
] as const;
const emergencyTriageReferenceFieldKeys = [
  'unidadQueRefiere',
  'documentoReferencia',
] as const;

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

type TriageResponsibleUser = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

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
    consultationPrescriptionTabKey,
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
    'Recuperación / Evaluación',
    'Receta e indicaciones de egreso',
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

    return await this.toEncounterDetailResponse(
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
    return await this.toEncounterDetailResponse(
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
    return await this.toEncounterDetailResponse(
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
    if (this.isAmbulatoryProcedureRecord(encounter.encounterType, input.tabKey)) {
      await this.assertAmbulatoryProcedureStageEnabled(encounter.id);
    }
    if (
      this.isAmbulatoryRecoveryEvaluationRecord(
        encounter.encounterType,
        input.tabKey,
      )
    ) {
      await this.assertAmbulatoryRecoveryEvaluationStageEnabled(encounter.id);
    }
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
    const responsibleUser = encounter.attendingUserId
      ? await this.userRepository.findById(encounter.attendingUserId)
      : null;
    const triageResponsibleUser = this.isEmergencyTriageRecord(
      encounter.encounterType,
      input.tabKey,
    )
      ? await this.findTriageResponsibleUser(userId)
      : null;
    const historyVersionContext = await this.resolveHistoryVersionContext({
      patientId: encounter.patientId,
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
    const emergencyDischargeVersionContext =
      await this.resolveEmergencyDischargeVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalAdmissionVersionContext =
      await this.resolveHospitalAdmissionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalEvolutionVersionContext =
      await this.resolveHospitalEvolutionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalMedicalOrdersVersionContext =
      await this.resolveHospitalMedicalOrdersVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalConsultationVersionContext =
      await this.resolveHospitalConsultationVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalSurgicalDocumentVersionContext =
      await this.resolveHospitalSurgicalDocumentVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalNursingShiftVersionContext =
      await this.resolveHospitalNursingShiftVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const hospitalDischargeVersionContext =
      await this.resolveHospitalDischargeVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const ambulatoryPreprocedureVersionContext =
      await this.resolveAmbulatoryPreprocedureVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const ambulatoryProcedureVersionContext =
      await this.resolveAmbulatoryProcedureVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const ambulatoryRecoveryEvaluationVersionContext =
      await this.resolveAmbulatoryRecoveryEvaluationVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const ambulatoryDischargePrescriptionVersionContext =
      await this.resolveAmbulatoryDischargePrescriptionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    const ambulatoryDischargeVersionContext =
      await this.resolveAmbulatoryDischargeVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
      });
    if (
      emergencyDischargeVersionContext?.latestRecord &&
      this.isEmergencyDischargeRecord(encounter.encounterType, input.tabKey)
    ) {
      throw new BadRequestException(
        'Este episodio ya tiene un egreso de urgencias. Solo se permite uno por episodio.',
      );
    }
    if (
      hospitalDischargeVersionContext?.latestRecord &&
      this.isHospitalDischargeRecord(encounter.encounterType, input.tabKey)
    ) {
      throw new BadRequestException(
        'Este episodio ya tiene un egreso hospitalario. Solo se permite uno por episodio.',
      );
    }
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
      emergencyDischargeVersionContext,
      hospitalAdmissionVersionContext,
      hospitalEvolutionVersionContext,
      hospitalMedicalOrdersVersionContext,
      hospitalConsultationVersionContext,
      hospitalSurgicalDocumentVersionContext,
      hospitalNursingShiftVersionContext,
      hospitalDischargeVersionContext,
      ambulatoryPreprocedureVersionContext,
      ambulatoryProcedureVersionContext,
      ambulatoryRecoveryEvaluationVersionContext,
      ambulatoryDischargePrescriptionVersionContext,
      ambulatoryDischargeVersionContext,
      responsibleUser,
      triageResponsibleUser,
    });

    let createdRecord: EncounterSectionRecord;
    try {
      createdRecord = await this.prisma.encounterSectionRecord.create({
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        this.isConsultationPrescriptionRecord(
          encounter.encounterType,
          normalizedRecordPayload.tabKey,
        )
      ) {
        throw new BadRequestException(
          'La versión de la receta ya fue ocupada en este episodio. Actualiza el episodio e intenta crear una nueva receta.',
        );
      }

      throw error;
    }
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
    await this.syncEmergencyDischargeRecord({
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
    await this.syncEmergencyDocumentRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncHospitalDocumentRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncAmbulatoryProcedureSupportingDocument({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncHospitalAdmissionRecord({
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
    await this.syncHospitalEvolutionRecord({
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
    await this.syncHospitalMedicalOrdersRecord({
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
    await this.syncHospitalConsultationRecord({
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
    await this.syncHospitalSurgicalDocumentRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncHospitalNursingShiftRecord({
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
    await this.syncHospitalDischargeRecord({
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
    await this.syncAmbulatoryPreprocedureAssessment({
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
    await this.syncAmbulatoryProcedureDocument({
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
    await this.syncAmbulatoryRecoveryEvaluation({
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
    await this.syncAmbulatoryDischargePrescription({
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
    await this.syncAmbulatoryDischargeSummary({
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
    await this.syncConsultationHistoryPriorStudies({
      tenantId,
      userId,
      encounter,
      sectionRecordId: createdRecord.id,
      tabKey: normalizedRecordPayload.tabKey,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return await this.toEncounterDetailResponse(
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
    if (this.isAmbulatoryProcedureRecord(encounter.encounterType, input.tabKey)) {
      await this.assertAmbulatoryProcedureStageEnabled(encounter.id);
    }
    if (
      this.isAmbulatoryRecoveryEvaluationRecord(
        encounter.encounterType,
        input.tabKey,
      )
    ) {
      await this.assertAmbulatoryRecoveryEvaluationStageEnabled(encounter.id);
    }
    const recordedAt = input.recordedAt
      ? new Date(input.recordedAt)
      : currentRecord.recordedAt;
    const responsibleUser = encounter.attendingUserId
      ? await this.userRepository.findById(encounter.attendingUserId)
      : null;
    const triageResponsibleUser = this.isEmergencyTriageRecord(
      encounter.encounterType,
      input.tabKey,
    )
      ? await this.findTriageResponsibleUser(userId)
      : null;
    const historyVersionContext = await this.resolveHistoryVersionContext({
      patientId: encounter.patientId,
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
    const emergencyDischargeVersionContext =
      await this.resolveEmergencyDischargeVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalAdmissionVersionContext =
      await this.resolveHospitalAdmissionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalEvolutionVersionContext =
      await this.resolveHospitalEvolutionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalMedicalOrdersVersionContext =
      await this.resolveHospitalMedicalOrdersVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalConsultationVersionContext =
      await this.resolveHospitalConsultationVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalSurgicalDocumentVersionContext =
      await this.resolveHospitalSurgicalDocumentVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalNursingShiftVersionContext =
      await this.resolveHospitalNursingShiftVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const hospitalDischargeVersionContext =
      await this.resolveHospitalDischargeVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const ambulatoryPreprocedureVersionContext =
      await this.resolveAmbulatoryPreprocedureVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const ambulatoryProcedureVersionContext =
      await this.resolveAmbulatoryProcedureVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const ambulatoryRecoveryEvaluationVersionContext =
      await this.resolveAmbulatoryRecoveryEvaluationVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const ambulatoryDischargePrescriptionVersionContext =
      await this.resolveAmbulatoryDischargePrescriptionVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    const ambulatoryDischargeVersionContext =
      await this.resolveAmbulatoryDischargeVersionContext({
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        tabKey: input.tabKey,
        currentRecordId: currentRecord.id,
      });
    if (
      emergencyDischargeVersionContext?.latestRecord &&
      this.isEmergencyDischargeRecord(encounter.encounterType, input.tabKey)
    ) {
      throw new BadRequestException(
        'Este episodio ya tiene otro egreso de urgencias. Solo se permite uno por episodio.',
      );
    }
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
      emergencyDischargeVersionContext,
      hospitalAdmissionVersionContext,
      hospitalEvolutionVersionContext,
      hospitalMedicalOrdersVersionContext,
      hospitalConsultationVersionContext,
      hospitalSurgicalDocumentVersionContext,
      hospitalNursingShiftVersionContext,
      hospitalDischargeVersionContext,
      ambulatoryPreprocedureVersionContext,
      ambulatoryProcedureVersionContext,
      ambulatoryRecoveryEvaluationVersionContext,
      ambulatoryDischargePrescriptionVersionContext,
      ambulatoryDischargeVersionContext,
      responsibleUser,
      triageResponsibleUser,
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
    await this.syncEmergencyDischargeRecord({
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
    await this.syncEmergencyDocumentRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncHospitalDocumentRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncAmbulatoryProcedureSupportingDocument({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncHospitalAdmissionRecord({
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
    await this.syncHospitalEvolutionRecord({
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
    await this.syncHospitalMedicalOrdersRecord({
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
    await this.syncHospitalConsultationRecord({
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
    await this.syncHospitalSurgicalDocumentRecord({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      noteType: normalizedRecordPayload.noteType,
      recordedAt,
      title: normalizedRecordPayload.title,
      status: normalizedRecordPayload.status,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });
    await this.syncHospitalNursingShiftRecord({
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
    await this.syncHospitalDischargeRecord({
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
    await this.syncAmbulatoryPreprocedureAssessment({
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
    await this.syncAmbulatoryProcedureDocument({
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
    await this.syncAmbulatoryRecoveryEvaluation({
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
    await this.syncAmbulatoryDischargePrescription({
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
    await this.syncAmbulatoryDischargeSummary({
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
    await this.syncConsultationHistoryPriorStudies({
      tenantId,
      userId,
      encounter,
      sectionRecordId: recordId,
      tabKey: normalizedRecordPayload.tabKey,
      formData: normalizedRecordPayload.formData,
      metadata: normalizedRecordPayload.metadata,
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return await this.toEncounterDetailResponse(
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
    if (
      this.isEmergencyDischargeRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      this.assertEmergencyDischargeCanBeSigned(encounter, currentRecord);
    }
    if (
      this.isAmbulatoryPreprocedureRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      const preprocedureFormData =
        currentRecord.formDataJson &&
        typeof currentRecord.formDataJson === 'object' &&
        !Array.isArray(currentRecord.formDataJson)
          ? (currentRecord.formDataJson as Record<string, unknown>)
          : {};
      await this.syncAmbulatoryPreprocedureAssessment({
        tenantId,
        userId,
        encounter,
        sectionRecordId: currentRecord.id,
        tabKey: currentRecord.tabKey,
        recordedAt: currentRecord.recordedAt,
        title: currentRecord.title,
        status: currentRecord.status,
        formData: preprocedureFormData,
        metadata: currentMetadata,
      });
    }
    if (
      this.isAmbulatoryProcedureRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      const procedureFormData =
        currentRecord.formDataJson &&
        typeof currentRecord.formDataJson === 'object' &&
        !Array.isArray(currentRecord.formDataJson)
          ? (currentRecord.formDataJson as Record<string, unknown>)
          : {};
      await this.syncAmbulatoryProcedureDocument({
        tenantId,
        userId,
        encounter,
        sectionRecordId: currentRecord.id,
        tabKey: currentRecord.tabKey,
        recordedAt: currentRecord.recordedAt,
        title: currentRecord.title,
        status: currentRecord.status,
        formData: procedureFormData,
        metadata: currentMetadata,
      });
    }
    if (
      this.isAmbulatoryRecoveryEvaluationRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      const recoveryFormData =
        currentRecord.formDataJson &&
        typeof currentRecord.formDataJson === 'object' &&
        !Array.isArray(currentRecord.formDataJson)
          ? (currentRecord.formDataJson as Record<string, unknown>)
          : {};
      await this.syncAmbulatoryRecoveryEvaluation({
        tenantId,
        userId,
        encounter,
        sectionRecordId: currentRecord.id,
        tabKey: currentRecord.tabKey,
        recordedAt: currentRecord.recordedAt,
        title: currentRecord.title,
        status: currentRecord.status,
        formData: recoveryFormData,
        metadata: currentMetadata,
      });
    }
    if (
      this.isAmbulatoryDischargePrescriptionRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      const prescriptionFormData =
        currentRecord.formDataJson &&
        typeof currentRecord.formDataJson === 'object' &&
        !Array.isArray(currentRecord.formDataJson)
          ? (currentRecord.formDataJson as Record<string, unknown>)
          : {};
      await this.syncAmbulatoryDischargePrescription({
        tenantId,
        userId,
        encounter,
        sectionRecordId: currentRecord.id,
        tabKey: currentRecord.tabKey,
        recordedAt: currentRecord.recordedAt,
        title: currentRecord.title,
        status: currentRecord.status,
        formData: prescriptionFormData,
        metadata: currentMetadata,
      });
    }
    if (
      this.isAmbulatoryDischargeRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      const dischargeFormData =
        currentRecord.formDataJson &&
        typeof currentRecord.formDataJson === 'object' &&
        !Array.isArray(currentRecord.formDataJson)
          ? (currentRecord.formDataJson as Record<string, unknown>)
          : {};
      await this.syncAmbulatoryDischargeSummary({
        tenantId,
        userId,
        encounter,
        sectionRecordId: currentRecord.id,
        tabKey: currentRecord.tabKey,
        recordedAt: currentRecord.recordedAt,
        title: currentRecord.title,
        status: currentRecord.status,
        formData: dischargeFormData,
        metadata: currentMetadata,
      });
    }
    if (
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      )
    ) {
      const supportingFormData =
        currentRecord.formDataJson &&
        typeof currentRecord.formDataJson === 'object' &&
        !Array.isArray(currentRecord.formDataJson)
          ? (currentRecord.formDataJson as Record<string, unknown>)
          : {};
      await this.syncAmbulatoryProcedureSupportingDocument({
        tenantId,
        userId,
        encounter,
        sectionRecordId: currentRecord.id,
        tabKey: currentRecord.tabKey,
        noteType: currentRecord.noteType,
        recordedAt: currentRecord.recordedAt,
        title: currentRecord.title,
        status: currentRecord.status,
        formData: supportingFormData,
        metadata: currentMetadata,
      });
    }

    const signedAt = new Date();
    const isHospitalConsultation = this.isHospitalConsultationRecord(
      currentRecord.encounterType,
      currentRecord.tabKey,
    );
    const isHospitalSurgicalDocument = this.isHospitalSurgicalDocumentRecord(
      currentRecord.encounterType,
      currentRecord.tabKey,
    );
    const isHospitalDocument = this.isHospitalDocumentRecord(
      currentRecord.encounterType,
      currentRecord.tabKey,
    );
    const isAmbulatoryProcedureSupportingDocument =
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        currentRecord.encounterType,
        currentRecord.tabKey,
      );
    const hospitalConsultationFormData =
      currentRecord.formDataJson &&
      typeof currentRecord.formDataJson === 'object' &&
      !Array.isArray(currentRecord.formDataJson)
        ? (currentRecord.formDataJson as Record<string, unknown>)
        : {};
    const isHospitalConsultationResponseSignature =
      isHospitalConsultation &&
      this.hasCapturedValue(hospitalConsultationFormData.requestSignedAtInterHosp) &&
      (this.hasCapturedValue(hospitalConsultationFormData.impresionDiagnosticaInterHosp) ||
        this.hasCapturedValue(hospitalConsultationFormData.sugerenciasTerapeuticasInterHosp) ||
        this.hasCapturedValue(hospitalConsultationFormData.resultadoInterconsultaHosp));
    const nextRecordStatus =
      isHospitalConsultation && !isHospitalConsultationResponseSignature
        ? EncounterRecordStatus.OPEN
        : EncounterRecordStatus.SIGNED;
    const nextRecordSignedAt =
      isHospitalConsultation && !isHospitalConsultationResponseSignature
        ? null
        : signedAt;
    const nextHospitalConsultationFormData: Record<string, unknown> | null = isHospitalConsultation
      ? {
          ...hospitalConsultationFormData,
          ...(isHospitalConsultationResponseSignature
            ? {
                responseSignedAtInterHosp: signedAt.toISOString(),
                estatusInterconsultaHosp: 'RESPONDIDA',
              }
            : {
                requestSignedAtInterHosp: signedAt.toISOString(),
                estatusInterconsultaHosp: 'SOLICITADA',
          }),
        }
      : null;
    const nextHospitalSurgicalDocumentFormData: Record<string, unknown> | null =
      isHospitalSurgicalDocument
        ? {
            ...hospitalConsultationFormData,
            estadoDocumentoQuirurgico: 'FIRMADO',
            signedAtDocumentoQuirurgico: signedAt.toISOString(),
          }
        : null;
    const nextHospitalDocumentFormData: Record<string, unknown> | null =
      isHospitalDocument
        ? {
            ...hospitalConsultationFormData,
            documentoEstado: 'Firmado',
            documentoFechaFirma: signedAt.toISOString(),
          }
        : null;
    const nextAmbulatoryProcedureSupportingDocumentFormData:
      | Record<string, unknown>
      | null = isAmbulatoryProcedureSupportingDocument
      ? {
          ...hospitalConsultationFormData,
          documentoEstado: 'Firmado',
          documentoFechaFirma: signedAt.toISOString(),
        }
      : null;
    const nextSignedFormData =
      nextHospitalConsultationFormData ??
      nextHospitalSurgicalDocumentFormData ??
      nextHospitalDocumentFormData ??
      nextAmbulatoryProcedureSupportingDocumentFormData;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.encounterSectionRecord.update({
        where: { id: recordId },
        data: {
          status: nextRecordStatus,
          signedAt: nextRecordSignedAt,
          ...(nextSignedFormData
            ? {
                formDataJson: nextSignedFormData as Prisma.InputJsonValue,
              }
            : {}),
          metadataJson: {
            ...currentMetadata,
            signedByUserId: currentUser.id,
            signedByUserName: currentUser.fullName,
            signedWithPasswordValidation: true,
            ...(isHospitalConsultation && !isHospitalConsultationResponseSignature
              ? {
                  requestSignedAt: signedAt.toISOString(),
                  systemStatus: 'SOLICITADA',
                }
              : {}),
            ...(isHospitalConsultation && isHospitalConsultationResponseSignature
              ? {
                  responseSignedAt: signedAt.toISOString(),
                  systemStatus: 'RESPONDIDA',
                }
              : {}),
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

      if (
        this.isEmergencyDischargeRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "EmergencyDischarge"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "closedEncounterAt" = ${signedAt}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.encounter.update({
          where: { id: encounter.id },
          data: {
            status: EncounterStatus.CLOSED,
            closedAt: signedAt,
          },
        });
      }

      if (
        this.isEmergencyDocumentRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "EmergencyDocument"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;

        if (currentRecord.noteType === 'Egreso voluntario') {
          await transaction.encounter.update({
            where: { id: encounter.id },
            data: {
              status: EncounterStatus.CLOSED,
              closedAt: signedAt,
            },
          });
        }
      }

      if (isHospitalDocument) {
        await transaction.$executeRaw`
          UPDATE "HospitalDocument"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "contentJson" = ${this.jsonbParameter(nextHospitalDocumentFormData ?? {})}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;

        if (currentRecord.noteType === 'Defunción') {
          await transaction.encounter.update({
            where: { id: encounter.id },
            data: {
              status: EncounterStatus.CLOSED,
              closedAt: signedAt,
            },
          });
        }

        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalDocument',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              documentType: currentRecord.noteType,
              signedAt: signedAt.toISOString(),
              closedEncounter: currentRecord.noteType === 'Defunción',
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              status: EncounterRecordStatus.SIGNED,
            },
          },
        });
      }

      if (
        this.isAmbulatoryPreprocedureRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const preprocedureFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        await transaction.encounterSectionRecord.update({
          where: { id: currentRecord.id },
          data: {
            metadataJson: {
              ...currentMetadata,
              signedByUserId: currentUser.id,
              signedByUserName: currentUser.fullName,
              signedAt: signedAt.toISOString(),
              signedWithPasswordValidation: true,
              procedureStageEnabled: true,
              documentHash: this.readStringValue(preprocedureFormData.hashPreproc),
              digitalSeal: this.readStringValue(preprocedureFormData.selloDigitalPreproc),
            } as Prisma.InputJsonValue,
          },
        });
        await transaction.$executeRaw`
          UPDATE "AmbulatoryPreprocedureAssessment"
          SET "status" = ${EncounterRecordStatus.SIGNED},
              "signerUserId" = ${userId},
              "signedAt" = ${signedAt},
              "procedureStageEnabled" = true,
              "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${signedAt}),
              "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(currentRecord.title)}.pdf`}),
              "documentHash" = ${this.readStringValue(preprocedureFormData.hashPreproc)},
              "digitalSeal" = ${this.readStringValue(preprocedureFormData.selloDigitalPreproc)},
              "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.vitalSign.create({
          data: {
            tenantId,
            encounterId: encounter.id,
            patientId: encounter.patientId,
            takenAt: currentRecord.recordedAt,
            weightKg: this.readNumericValue(preprocedureFormData.pesoKgPreproc),
            heightCm: this.readNumericValue(preprocedureFormData.tallaCmPreproc),
            temperatureC: this.readNumericValue(
              preprocedureFormData.temperaturaPreproc,
            ),
            heartRate: this.readRoundedNumericValue(preprocedureFormData.fcPreproc),
            respiratoryRate: this.readRoundedNumericValue(
              preprocedureFormData.frPreproc,
            ),
            oxygenSaturation: this.readNumericValue(
              preprocedureFormData.spo2Preproc,
            ),
          },
        });
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'AmbulatoryPreprocedureAssessment',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              signedAt: signedAt.toISOString(),
              status: EncounterRecordStatus.SIGNED,
              hash: this.readStringValue(preprocedureFormData.hashPreproc),
              digitalSeal: this.readStringValue(
                preprocedureFormData.selloDigitalPreproc,
              ),
              procedureStageEnabled: true,
            },
          },
        });
      }

      if (
        this.isAmbulatoryProcedureRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const procedureFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        await transaction.$executeRaw`
          UPDATE "AmbulatoryProcedureDocument"
          SET "status" = ${EncounterRecordStatus.SIGNED},
              "signerUserId" = ${userId},
              "signedAt" = ${signedAt},
              "availableForDischarge" = true,
              "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${signedAt}),
              "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(currentRecord.title)}.pdf`}),
              "documentHash" = ${this.readStringValue(procedureFormData.hashProc)},
              "digitalSeal" = ${this.readStringValue(procedureFormData.selloDigitalProc)},
              "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'AmbulatoryProcedureDocument',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              signedAt: signedAt.toISOString(),
              status: EncounterRecordStatus.SIGNED,
              hash: this.readStringValue(procedureFormData.hashProc),
              digitalSeal: this.readStringValue(procedureFormData.selloDigitalProc),
              availableForDischarge: true,
            },
          },
        });
      }

      if (
        this.isAmbulatoryRecoveryEvaluationRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const recoveryFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        const aldreteTotal = this.calculateAldreteTotal(recoveryFormData);
        const alerts = this.buildAmbulatoryRecoveryEvaluationAlerts(
          recoveryFormData,
          aldreteTotal,
        );
        const readyForDischarge =
          this.readStringValue(
            recoveryFormData.destinoPostRecuperacionRecEval,
          ) === 'ALTA_AMBULATORIA' &&
          aldreteTotal !== null &&
          aldreteTotal >= 9 &&
          !alerts.some((alert) => alert.severity === 'ROJO') &&
          this.ambulatoryRecoveryDischargeChecklistComplete(recoveryFormData);

        await transaction.$executeRaw`
          UPDATE "AmbulatoryRecoveryEvaluation"
          SET "status" = ${EncounterRecordStatus.SIGNED},
              "signerUserId" = ${userId},
              "signedAt" = ${signedAt},
              "readyForDischarge" = ${readyForDischarge},
              "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${signedAt}),
              "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(currentRecord.title)}.pdf`}),
              "documentHash" = ${this.readStringValue(recoveryFormData.hashRecEval)},
              "digitalSeal" = ${this.readStringValue(recoveryFormData.selloDigitalRecEval)},
              "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'AmbulatoryRecoveryEvaluation',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              signedAt: signedAt.toISOString(),
              status: EncounterRecordStatus.SIGNED,
              hash: this.readStringValue(recoveryFormData.hashRecEval),
              digitalSeal: this.readStringValue(
                recoveryFormData.selloDigitalRecEval,
              ),
              readyForDischarge,
              aldreteTotal,
              redAlertActive: alerts.some((alert) => alert.severity === 'ROJO'),
            },
          },
        });
      }

      if (
        this.isAmbulatoryDischargePrescriptionRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const prescriptionFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        const verificationCode =
          this.extractRecordVersionMetadata(currentRecord.metadataJson)
            .verificationCode ?? randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
        const qrValue = `GIMEDIC-QR:${this.readStringValue(prescriptionFormData.folioRecetaEgreso)}:${verificationCode}`;

        await transaction.encounterSectionRecord.update({
          where: { id: currentRecord.id },
          data: {
            formDataJson: {
              ...prescriptionFormData,
              qrActivoRecetaEgreso: 'SI',
              qrVerificacionRecetaEgreso: qrValue,
            } as Prisma.InputJsonValue,
            metadataJson: {
              ...currentMetadata,
              signedByUserId: currentUser.id,
              signedByUserName: currentUser.fullName,
              signedAt: signedAt.toISOString(),
              signedWithPasswordValidation: true,
              qrActive: true,
              verificationCode,
              documentHash: this.readStringValue(prescriptionFormData.hashRecetaEgreso),
              digitalSeal: this.readStringValue(prescriptionFormData.selloDigitalRecetaEgreso),
            } as Prisma.InputJsonValue,
          },
        });
        await transaction.$executeRaw`
          UPDATE "AmbulatoryDischargePrescription"
          SET "status" = ${EncounterRecordStatus.SIGNED},
              "signerUserId" = ${userId},
              "signedAt" = ${signedAt},
              "qrActive" = true,
              "verificationQr" = ${qrValue},
              "prescriptionPdfGeneratedAt" = COALESCE("prescriptionPdfGeneratedAt", ${signedAt}),
              "completePdfGeneratedAt" = COALESCE("completePdfGeneratedAt", ${signedAt}),
              "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(currentRecord.title)}.pdf`}),
              "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'AmbulatoryDischargePrescription',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              signedAt: signedAt.toISOString(),
              status: EncounterRecordStatus.SIGNED,
              folio: this.readStringValue(prescriptionFormData.folioRecetaEgreso),
              qrActive: true,
            },
          },
        });
      }

      if (
        this.isAmbulatoryDischargeRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const dischargeFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        await transaction.$executeRaw`
          UPDATE "AmbulatoryDischargeSummary"
          SET "status" = ${EncounterRecordStatus.SIGNED},
              "signerUserId" = ${userId},
              "signedAt" = ${signedAt},
              "closedEncounterAt" = ${signedAt},
              "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${signedAt}),
              "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(currentRecord.title)}.pdf`}),
              "documentHash" = ${this.readStringValue(dischargeFormData.hashEgresoAmb)},
              "digitalSeal" = ${this.readStringValue(dischargeFormData.selloDigitalEgresoAmb)},
              "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.encounter.update({
          where: { id: encounter.id },
          data: {
            status: EncounterStatus.CLOSED,
            closedAt: signedAt,
          },
        });
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'AmbulatoryDischargeSummary',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              signedAt: signedAt.toISOString(),
              status: EncounterRecordStatus.SIGNED,
              closedEncounter: true,
              hash: this.readStringValue(dischargeFormData.hashEgresoAmb),
              digitalSeal: this.readStringValue(dischargeFormData.selloDigitalEgresoAmb),
            },
          },
        });
      }

      if (isAmbulatoryProcedureSupportingDocument) {
        await transaction.$executeRaw`
          UPDATE "AmbulatoryProcedureSupportingDocument"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "contentJson" = ${this.jsonbParameter(nextAmbulatoryProcedureSupportingDocumentFormData ?? {})}, "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${signedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(currentRecord.title)}.pdf`}), "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;

        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'AmbulatoryProcedureSupportingDocument',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              documentType: currentRecord.noteType,
              signedAt: signedAt.toISOString(),
              closesEncounter: false,
            },
          },
        });
      }

      if (
        this.isHospitalAdmissionRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const hospitalFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        const admittedAt =
          this.parseOptionalDate(
            `${this.readStringValue(hospitalFormData.fechaIngresoHosp)}T${this.readStringValue(hospitalFormData.horaIngresoHosp)}`,
          ) ?? signedAt;
        await transaction.$executeRaw`
          UPDATE "HospitalAdmission"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.vitalSign.create({
          data: {
            tenantId,
            encounterId: encounter.id,
            patientId: encounter.patientId,
            takenAt: admittedAt,
            weightKg: this.readNumericValue(hospitalFormData.pesoHosp),
            heightCm: this.readNumericValue(hospitalFormData.tallaHosp),
            temperatureC: this.readNumericValue(hospitalFormData.temperaturaHosp),
            heartRate: this.readRoundedNumericValue(hospitalFormData.fcHosp),
            respiratoryRate: this.readRoundedNumericValue(hospitalFormData.frHosp),
            systolicBp: this.readRoundedNumericValue(hospitalFormData.taSistolicaHosp),
            diastolicBp: this.readRoundedNumericValue(hospitalFormData.taDiastolicaHosp),
            oxygenSaturation: this.readNumericValue(hospitalFormData.spo2Hosp),
            painScale: this.readRoundedNumericValue(hospitalFormData.dolorEvaHosp),
          },
        });
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalAdmission',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              signedAt: signedAt.toISOString(),
            },
          },
        });
      }

      if (
        this.isHospitalEvolutionRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const hospitalFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        await transaction.$executeRaw`
          UPDATE "HospitalEvolution"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.vitalSign.create({
          data: {
            tenantId,
            encounterId: encounter.id,
            patientId: encounter.patientId,
            takenAt: currentRecord.recordedAt,
            temperatureC: this.readNumericValue(
              hospitalFormData.temperaturaEvolHosp,
            ),
            heartRate: this.readRoundedNumericValue(hospitalFormData.fcEvolHosp),
            respiratoryRate: this.readRoundedNumericValue(
              hospitalFormData.frEvolHosp,
            ),
            systolicBp: this.readRoundedNumericValue(
              hospitalFormData.taSistolicaEvolHosp,
            ),
            diastolicBp: this.readRoundedNumericValue(
              hospitalFormData.taDiastolicaEvolHosp,
            ),
            oxygenSaturation: this.readNumericValue(hospitalFormData.spo2EvolHosp),
            painScale: this.readRoundedNumericValue(
              hospitalFormData.dolorEvaEvolHosp,
            ),
          },
        });
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalEvolution',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              signedAt: signedAt.toISOString(),
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              status: EncounterRecordStatus.SIGNED,
            },
          },
        });
      }

      if (
        this.isHospitalMedicalOrdersRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "HospitalMedicalOrder"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalMedicalOrder',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              signedAt: signedAt.toISOString(),
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              status: EncounterRecordStatus.SIGNED,
            },
          },
        });
      }

      if (isHospitalConsultation && nextHospitalConsultationFormData) {
        const requestSignedAt = this.parseOptionalDate(
          nextHospitalConsultationFormData.requestSignedAtInterHosp,
        );
        const responseSignedAt = this.parseOptionalDate(
          nextHospitalConsultationFormData.responseSignedAtInterHosp,
        );
        const requestedAt = this.parseOptionalDate(
          `${this.readStringValue(nextHospitalConsultationFormData.fechaSolicitudInterHosp)}T${this.readStringValue(nextHospitalConsultationFormData.horaSolicitudInterHosp)}`,
        );
        const responseTimeMinutes =
          requestedAt && responseSignedAt && responseSignedAt >= requestedAt
            ? Math.round((responseSignedAt.getTime() - requestedAt.getTime()) / 60000)
            : null;

        await transaction.$executeRaw`
          UPDATE "HospitalConsultation"
          SET "status" = ${this.readStringValue(nextHospitalConsultationFormData.estatusInterconsultaHosp)},
              "requestSignedAt" = ${requestSignedAt},
              "responseSignedAt" = ${responseSignedAt},
              "responseTimeMinutes" = ${responseTimeMinutes},
              "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalConsultation',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              signedAt: signedAt.toISOString(),
              phase: isHospitalConsultationResponseSignature
                ? 'RESPUESTA'
                : 'SOLICITUD',
              status: this.readStringValue(
                nextHospitalConsultationFormData.estatusInterconsultaHosp,
              ),
            },
          },
        });
      }

      if (
        this.isHospitalSurgicalDocumentRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        await transaction.$executeRaw`
          UPDATE "HospitalSurgicalDocument"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "contentJson" = ${this.jsonbParameter(nextHospitalSurgicalDocumentFormData ?? {})}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalSurgicalDocument',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              subdocumentType: currentRecord.noteType,
              signedAt: signedAt.toISOString(),
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              status: EncounterRecordStatus.SIGNED,
            },
          },
        });
      }

      if (
        this.isHospitalNursingShiftRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const nursingFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        const nextNursingFormData = {
          ...nursingFormData,
          estadoTurnoEnfermeriaHosp: 'FIRMADO',
          signedAtTurnoEnfermeriaHosp: signedAt.toISOString(),
        };
        await transaction.encounterSectionRecord.update({
          where: { id: currentRecord.id },
          data: {
            formDataJson: nextNursingFormData as Prisma.InputJsonValue,
          },
        });
        await transaction.$executeRaw`
          UPDATE "HospitalNursingShift"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "contentJson" = ${this.jsonbParameter(nextNursingFormData)}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalNursingShift',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              shiftType: currentRecord.noteType,
              signedAt: signedAt.toISOString(),
              version:
                this.extractRecordVersionMetadata(currentRecord.metadataJson)
                  .versionNumber ?? null,
              status: EncounterRecordStatus.SIGNED,
            },
          },
        });
      }

      if (
        this.isHospitalDischargeRecord(
          currentRecord.encounterType,
          currentRecord.tabKey,
        )
      ) {
        const dischargeFormData =
          currentRecord.formDataJson &&
          typeof currentRecord.formDataJson === 'object' &&
          !Array.isArray(currentRecord.formDataJson)
            ? (currentRecord.formDataJson as Record<string, unknown>)
            : {};
        const nextDischargeFormData = {
          ...dischargeFormData,
          fechaHoraFirmaEgresoHosp: signedAt.toISOString(),
          estadoDocumentoEgresoHosp: 'FIRMADO',
        };
        await transaction.encounterSectionRecord.update({
          where: { id: currentRecord.id },
          data: {
            formDataJson: nextDischargeFormData as Prisma.InputJsonValue,
          },
        });
        await transaction.$executeRaw`
          UPDATE "HospitalDischarge"
          SET "status" = ${EncounterRecordStatus.SIGNED}, "signedAt" = ${signedAt}, "signerUserId" = ${userId}, "closedEncounterAt" = ${signedAt}, "contentJson" = ${this.jsonbParameter(nextDischargeFormData)}, "updatedAt" = NOW()
          WHERE "sectionRecordId" = ${currentRecord.id}
        `;
        await transaction.encounter.update({
          where: { id: encounter.id },
          data: {
            status: EncounterStatus.CLOSED,
            closedAt: signedAt,
          },
        });
        await transaction.auditLog.create({
          data: {
            tenantId,
            userId,
            action: AuditAction.SIGN,
            entityType: 'HospitalDischarge',
            entityId: currentRecord.id,
            facilityId: encounter.facilityId,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            metadataJson: {
              title: currentRecord.title,
              tabKey: currentRecord.tabKey,
              signedAt: signedAt.toISOString(),
              closedEncounter: true,
              status: EncounterRecordStatus.SIGNED,
            },
          },
        });
      }
    });

    const updatedEncounter = await this.findEncounterById(tenantId, encounter.id);
    return await this.toEncounterDetailResponse(
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
      !this.isEmergencyConsultationRecord(record.encounterType, record.tabKey) &&
      !this.isEmergencyDischargeRecord(record.encounterType, record.tabKey) &&
      !this.isEmergencyDocumentRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalAdmissionRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalEvolutionRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalMedicalOrdersRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalConsultationRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalSurgicalDocumentRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalNursingShiftRecord(record.encounterType, record.tabKey) &&
      !this.isHospitalDischargeRecord(record.encounterType, record.tabKey) &&
      !this.isAmbulatoryRecoveryEvaluationRecord(
        record.encounterType,
        record.tabKey,
      ) &&
      !this.isAmbulatoryDischargePrescriptionRecord(
        record.encounterType,
        record.tabKey,
      ) &&
      !this.isAmbulatoryDischargeRecord(
        record.encounterType,
        record.tabKey,
      ) &&
      !this.isAmbulatoryProcedureSupportingDocumentRecord(
        record.encounterType,
        record.tabKey,
      )
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

    if (this.isEmergencyDocumentRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "EmergencyDocument"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalDocumentRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalDocument"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        record.encounterType,
        record.tabKey,
      )
    ) {
      await this.prisma.$executeRaw`
        UPDATE "AmbulatoryProcedureSupportingDocument"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${downloadedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(record.title)}.pdf`}), "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalAdmissionRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalAdmission"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalEvolutionRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalEvolution"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalMedicalOrdersRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalMedicalOrder"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalConsultationRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalConsultation"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalSurgicalDocumentRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalSurgicalDocument"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalNursingShiftRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalNursingShift"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isHospitalDischargeRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "HospitalDischarge"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isAmbulatoryPreprocedureRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "AmbulatoryPreprocedureAssessment"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${downloadedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(record.title)}.pdf`}), "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isAmbulatoryProcedureRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "AmbulatoryProcedureDocument"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${downloadedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(record.title)}.pdf`}), "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (
      this.isAmbulatoryRecoveryEvaluationRecord(
        record.encounterType,
        record.tabKey,
      )
    ) {
      await this.prisma.$executeRaw`
        UPDATE "AmbulatoryRecoveryEvaluation"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${downloadedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(record.title)}.pdf`}), "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (
      this.isAmbulatoryDischargePrescriptionRecord(
        record.encounterType,
        record.tabKey,
      )
    ) {
      await this.prisma.$executeRaw`
        UPDATE "AmbulatoryDischargePrescription"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "completePdfGeneratedAt" = COALESCE("completePdfGeneratedAt", ${downloadedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(record.title)}.pdf`}), "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

    if (this.isAmbulatoryDischargeRecord(record.encounterType, record.tabKey)) {
      await this.prisma.$executeRaw`
        UPDATE "AmbulatoryDischargeSummary"
        SET "pdfDownloadCount" = ${nextDownloadCount}, "pdfLastDownloadedAt" = ${downloadedAt}, "pdfGeneratedAt" = COALESCE("pdfGeneratedAt", ${downloadedAt}), "pdfFileName" = COALESCE("pdfFileName", ${`${this.sanitizeFileName(record.title)}.pdf`}), "updatedAt" = NOW()
        WHERE "sectionRecordId" = ${record.id}
      `;
    }

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

  private async toEncounterDetailResponse(
    encounter: TenantEncounterRecord,
    attendingClinician: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null,
  ): Promise<EncounterDetailResponse> {
    const latestVitalSign = encounter.vitalSigns[0] ?? null;
    const patientHistoryVersionContext =
      await this.resolveHistoryVersionContext({
        patientId: encounter.patientId,
        encounterType: EncounterType.OUTPATIENT,
        tabKey: 'Historia clínica',
      });
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
      historyVersionContext: {
        latestVersionNumber:
          patientHistoryVersionContext?.latestVersionNumber ?? 0,
        nextVersionNumber:
          patientHistoryVersionContext?.nextVersionNumber ?? 1,
        latestRecordId: patientHistoryVersionContext?.latestRecord?.id ?? null,
        latestRecordTitle:
          patientHistoryVersionContext?.latestRecord?.title ?? null,
        latestRecordFormData:
          patientHistoryVersionContext?.latestRecord?.formDataJson &&
          typeof patientHistoryVersionContext.latestRecord.formDataJson === 'object' &&
          !Array.isArray(patientHistoryVersionContext.latestRecord.formDataJson)
            ? (patientHistoryVersionContext.latestRecord.formDataJson as Record<
                string,
                unknown
              >)
            : null,
      },
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
    patientId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }) {
    if (!this.isConsultationHistoryRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        patientId: input.patientId,
        encounterType: EncounterType.OUTPATIENT,
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

    const recordsWithVersion = records.map((record) => ({
      record,
      versionNumber:
        this.extractHistoryVersionMetadata(record.metadataJson).versionNumber ?? 0,
    }));
    const latestVersion = recordsWithVersion.sort((left, right) => {
      if (left.versionNumber !== right.versionNumber) {
        return right.versionNumber - left.versionNumber;
      }

      if (left.record.recordedAt.getTime() !== right.record.recordedAt.getTime()) {
        return right.record.recordedAt.getTime() - left.record.recordedAt.getTime();
      }

      return right.record.createdAt.getTime() - left.record.createdAt.getTime();
    })[0] ?? null;
    const latestRecord = latestVersion?.record ?? null;
    const latestVersionNumber = latestVersion?.versionNumber ?? 0;
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
        tabKey: {
          in: [
            consultationPrescriptionTabKey,
            legacyConsultationPrescriptionTabKey,
          ],
        },
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
    const latestVersionNumber = records.reduce((highestVersion, record) => {
      const recordVersion =
        this.extractRecordVersionMetadata(record.metadataJson).versionNumber ?? 0;

      return Math.max(highestVersion, recordVersion);
    }, 0);

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

  private async resolveEmergencyDischargeVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isEmergencyDischargeRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Egreso',
        noteType: 'Egreso de urgencias',
        ...(input.currentRecordId ? { NOT: { id: input.currentRecordId } } : {}),
      },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const latestRecord = records[0] ?? null;

    return {
      latestRecord,
      latestVersionNumber: latestRecord ? 1 : 0,
      nextVersionNumber: 1,
    };
  }

  private async resolveHospitalAdmissionVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalAdmissionRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Ingreso',
        noteType: 'Ingreso hospitalario',
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

  private async resolveHospitalEvolutionVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalEvolutionRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Evolución',
        noteType: 'Evolución hospitalaria',
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

  private async resolveHospitalMedicalOrdersVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalMedicalOrdersRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Indicaciones médicas',
        noteType: 'Indicaciones médicas',
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

  private async resolveHospitalConsultationVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalConsultationRecord(input.encounterType, input.tabKey)) {
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

  private async resolveHospitalSurgicalDocumentVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalSurgicalDocumentRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Procedimientos / Cirugía',
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

  private async resolveHospitalNursingShiftVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalNursingShiftRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Enfermería',
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

  private async resolveHospitalDischargeVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isHospitalDischargeRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Egreso',
        ...(input.currentRecordId ? { NOT: { id: input.currentRecordId } } : {}),
      },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const latestRecord = records[0] ?? null;

    return {
      latestRecord,
      latestVersionNumber: latestRecord ? 1 : 0,
      nextVersionNumber: 1,
    };
  }

  private async resolveAmbulatoryPreprocedureVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isAmbulatoryPreprocedureRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Valoración preprocedimiento',
        noteType: 'Valoración preprocedimiento',
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

  private async resolveAmbulatoryProcedureVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isAmbulatoryProcedureRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Procedimiento',
        noteType: 'Procedimiento',
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

  private async resolveAmbulatoryRecoveryEvaluationVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (
      !this.isAmbulatoryRecoveryEvaluationRecord(
        input.encounterType,
        input.tabKey,
      )
    ) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: { in: ['Recuperación / Evaluación', 'Recuperación / Evolución'] },
        noteType: { in: ['Recuperación / Evaluación', 'Recuperación / Evolución'] },
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

  private async resolveAmbulatoryDischargePrescriptionVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isAmbulatoryDischargePrescriptionRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: { in: ['Receta e indicaciones de egreso', 'Indicaciones / Receta'] },
        noteType: { in: ['Receta e indicaciones de egreso', 'Indicaciones de egreso', 'Receta médica'] },
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

  private async resolveAmbulatoryDischargeVersionContext(input: {
    encounterId: string;
    encounterType: EncounterType;
    tabKey: string;
    currentRecordId?: string;
  }): Promise<RecordVersionContext | null> {
    if (!this.isAmbulatoryDischargeRecord(input.encounterType, input.tabKey)) {
      return null;
    }

    const records = await this.prisma.encounterSectionRecord.findMany({
      where: {
        encounterId: input.encounterId,
        tabKey: 'Egreso',
        noteType: 'Egreso',
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

  private findTriageResponsibleUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
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
    emergencyDischargeVersionContext: Awaited<
      ReturnType<EncountersService['resolveEmergencyDischargeVersionContext']>
    >;
    hospitalAdmissionVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalAdmissionVersionContext']>
    >;
    hospitalEvolutionVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalEvolutionVersionContext']>
    >;
    hospitalMedicalOrdersVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalMedicalOrdersVersionContext']>
    >;
    hospitalConsultationVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalConsultationVersionContext']>
    >;
    hospitalSurgicalDocumentVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalSurgicalDocumentVersionContext']>
    >;
    hospitalNursingShiftVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalNursingShiftVersionContext']>
    >;
    hospitalDischargeVersionContext: Awaited<
      ReturnType<EncountersService['resolveHospitalDischargeVersionContext']>
    >;
    ambulatoryPreprocedureVersionContext: Awaited<
      ReturnType<EncountersService['resolveAmbulatoryPreprocedureVersionContext']>
    >;
    ambulatoryProcedureVersionContext: Awaited<
      ReturnType<EncountersService['resolveAmbulatoryProcedureVersionContext']>
    >;
    ambulatoryRecoveryEvaluationVersionContext: Awaited<
      ReturnType<
        EncountersService['resolveAmbulatoryRecoveryEvaluationVersionContext']
      >
    >;
    ambulatoryDischargePrescriptionVersionContext: Awaited<
      ReturnType<
        EncountersService['resolveAmbulatoryDischargePrescriptionVersionContext']
      >
    >;
    ambulatoryDischargeVersionContext: Awaited<
      ReturnType<EncountersService['resolveAmbulatoryDischargeVersionContext']>
    >;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    triageResponsibleUser: TriageResponsibleUser | null;
    input: EncounterSectionRecordMutationDto;
    recordedAt: Date;
  }) {
    if (
      this.isAmbulatoryDischargeRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.ambulatoryDischargeVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildAmbulatoryDischargeFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
        versionNumber,
        currentMetadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      });

      return {
        tabKey: 'Egreso',
        noteType: 'Egreso',
        title: `Egreso V${versionNumber}`,
        status: input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Egreso',
          documentHash: formData.hashEgresoAmb,
          digitalSeal: formData.selloDigitalEgresoAmb,
          closesEncounter: true,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isAmbulatoryDischargePrescriptionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.ambulatoryDischargePrescriptionVersionContext?.nextVersionNumber ??
        1;
      const prescriptionFolio =
        currentRecordMetadata.prescriptionFolio ??
        (this.readStringValue(input.input.formData.folioRecetaEgreso) ||
          `${input.encounter.encounterNumber}-RA${String(versionNumber).padStart(2, '0')}`);
      const verificationCode =
        currentRecordMetadata.verificationCode ??
        randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
      const formData = this.buildAmbulatoryDischargePrescriptionFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
        versionNumber,
        prescriptionFolio,
        verificationCode,
        currentMetadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      });

      return {
        tabKey: 'Receta e indicaciones de egreso',
        noteType: 'Receta e indicaciones de egreso',
        title: `Receta e indicaciones de egreso V${versionNumber}`,
        status: input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Receta e indicaciones de egreso',
          prescriptionFolio,
          verificationCode,
          documentHash: formData.hashRecetaEgreso,
          digitalSeal: formData.selloDigitalRecetaEgreso,
          qrActive: formData.qrActivoRecetaEgreso === 'SI',
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isAmbulatoryRecoveryEvaluationRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.ambulatoryRecoveryEvaluationVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildAmbulatoryRecoveryEvaluationFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
        versionNumber,
        currentMetadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      });

      return {
        tabKey: 'Recuperación / Evaluación',
        noteType: 'Recuperación / Evaluación',
        title: `Recuperación / Evaluación V${versionNumber}`,
        status: input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Recuperación / Evaluación',
          documentHash: formData.hashRecEval,
          digitalSeal: formData.selloDigitalRecEval,
          readyForDischarge: false,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isAmbulatoryProcedureRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.ambulatoryProcedureVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildAmbulatoryProcedureFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
        versionNumber,
        currentMetadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      });

      return {
        tabKey: 'Procedimiento',
        noteType: 'Procedimiento',
        title: `Procedimiento V${versionNumber}`,
        status: input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Procedimiento',
          documentHash: formData.hashProc,
          digitalSeal: formData.selloDigitalProc,
          availableForDischarge: false,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isAmbulatoryPreprocedureRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.ambulatoryPreprocedureVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildAmbulatoryPreprocedureFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
        versionNumber,
        currentMetadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      });

      return {
        tabKey: 'Valoración preprocedimiento',
        noteType: 'Valoración preprocedimiento',
        title: `Valoración preprocedimiento V${versionNumber}`,
        status: input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Valoración preprocedimiento',
          documentHash: formData.hashPreproc,
          digitalSeal: formData.selloDigitalPreproc,
          procedureStageEnabled: false,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalDischargeRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const formData = this.buildHospitalDischargeFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Egreso',
        noteType: 'Egreso',
        title: 'Egreso V1',
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber: 1,
          recordType: 'Egreso',
          pdfDownloadCount:
            this.extractRecordVersionMetadata(input.currentRecord?.metadataJson)
              .pdfDownloadCount ?? 0,
          pdfLastDownloadedAt:
            this.extractRecordVersionMetadata(input.currentRecord?.metadataJson)
              .pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalNursingShiftRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.hospitalNursingShiftVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildHospitalNursingShiftFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        responsibleUser: input.responsibleUser,
        noteType: input.input.noteType,
      });

      return {
        tabKey: 'Enfermería',
        noteType: formData.turnoEnfermeriaHosp,
        title: `Enfermería V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Enfermería',
          shiftType: formData.turnoEnfermeriaHosp,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalSurgicalDocumentRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.hospitalSurgicalDocumentVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildHospitalSurgicalDocumentFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
        noteType: input.input.noteType,
        versionNumber,
        currentMetadata:
          this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {},
      });

      return {
        tabKey: 'Procedimientos / Cirugía',
        noteType: formData.tipoSubdocumentoQuirurgico,
        title: `Procedimientos y cirugía V${versionNumber}`,
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Procedimientos y cirugía',
          subdocumentType: formData.tipoSubdocumentoQuirurgico,
          folio: formData.folioDocumentoQuirurgico,
          documentHash: formData.hashDocumentoQuirurgico,
          digitalSeal: formData.selloDigitalQuirurgico,
          progressStatus: formData.progresoQuirurgicoGlobal,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            input.hospitalSurgicalDocumentVersionContext?.latestRecord?.id ??
            null,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalConsultationRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.hospitalConsultationVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildHospitalConsultationFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });
      const systemStatus = this.resolveHospitalConsultationStatus(formData);

      return {
        tabKey: 'Interconsultas',
        noteType: 'Interconsultas',
        title: `Interconsultas V${versionNumber}`,
        status:
          systemStatus === 'RESPONDIDA' || systemStatus === 'CERRADA'
            ? EncounterRecordStatus.SIGNED
            : input.input.status ??
              input.currentRecord?.status ??
              EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Interconsultas',
          systemStatus,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            input.hospitalConsultationVersionContext?.latestRecord?.id ??
            null,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalMedicalOrdersRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.hospitalMedicalOrdersVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildHospitalMedicalOrdersFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Indicaciones médicas',
        noteType: 'Indicaciones médicas',
        title: `Indicaciones médicas V${versionNumber}`,
        status:
          input.currentRecord?.status === EncounterRecordStatus.SIGNED
            ? EncounterRecordStatus.SIGNED
            : input.input.status ??
              input.currentRecord?.status ??
              EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Indicaciones médicas',
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            input.hospitalMedicalOrdersVersionContext?.latestRecord?.id ??
            null,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalEvolutionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const latestHospitalEvolutionRecord =
        input.hospitalEvolutionVersionContext?.latestRecord ?? null;
      const latestHospitalAdmissionRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Ingreso',
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.hospitalEvolutionVersionContext?.nextVersionNumber ??
        1;
      const formData = this.buildHospitalEvolutionFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        admissionFormDataJson: latestHospitalAdmissionRecord?.formDataJson ?? null,
        previousEvolutionFormDataJson:
          latestHospitalEvolutionRecord?.formDataJson ?? null,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Evolución',
        noteType: 'Evolución hospitalaria',
        title: `Evolución hospitalaria V${versionNumber}`,
        status:
          input.currentRecord?.status === EncounterRecordStatus.SIGNED
            ? EncounterRecordStatus.SIGNED
            : input.input.status ??
              input.currentRecord?.status ??
              EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Evolución hospitalaria',
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            latestHospitalEvolutionRecord?.id ??
            latestHospitalAdmissionRecord?.id ??
            null,
          previousEvolutionRecordId:
            this.readStringValue(
              this.normalizeRecordMetadata(input.currentRecord?.metadataJson)
                ?.previousEvolutionRecordId,
            ) || latestHospitalEvolutionRecord?.id || null,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

    if (
      this.isHospitalAdmissionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const versionNumber =
        currentRecordMetadata.versionNumber ??
        input.hospitalAdmissionVersionContext?.nextVersionNumber ??
        1;
      const latestEmergencyDischargeRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Egreso',
      );
      const formData = this.buildHospitalAdmissionFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        emergencyDischargeFormDataJson:
          latestEmergencyDischargeRecord?.formDataJson ?? null,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Ingreso',
        noteType: 'Ingreso hospitalario',
        title: `Ingreso hospitalario V${versionNumber}`,
        status:
          input.currentRecord?.status === EncounterRecordStatus.SIGNED
            ? EncounterRecordStatus.SIGNED
            : input.input.status ??
              input.currentRecord?.status ??
              EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          recordType: 'Ingreso hospitalario',
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            latestEmergencyDischargeRecord?.id ??
            null,
          sourceEmergencyRecordId:
            this.readStringValue(
              this.normalizeRecordMetadata(input.currentRecord?.metadataJson)
                ?.sourceEmergencyRecordId,
            ) || latestEmergencyDischargeRecord?.id || null,
          pdfDownloadCount: currentRecordMetadata.pdfDownloadCount ?? 0,
          pdfLastDownloadedAt: currentRecordMetadata.pdfLastDownloadedAt,
        },
      };
    }

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
        responsibleUser: input.triageResponsibleUser ?? input.responsibleUser,
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
      this.isEmergencyDischargeRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
    ) {
      const currentRecordMetadata = this.extractRecordVersionMetadata(
        input.currentRecord?.metadataJson,
      );
      const triageRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Triage',
      );
      const initialNoteRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Nota inicial',
      );
      const evolutionRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Evolución',
      );
      const ordersRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Órdenes / Indicaciones',
      );
      const consultationRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Interconsultas',
      );
      const formData = this.buildEmergencyDischargeFormData({
        encounter: input.encounter,
        incomingFormData: input.input.formData,
        triageFormDataJson: triageRecord?.formDataJson ?? null,
        initialNoteFormDataJson: initialNoteRecord?.formDataJson ?? null,
        evolutionFormDataJson: evolutionRecord?.formDataJson ?? null,
        ordersFormDataJson: ordersRecord?.formDataJson ?? null,
        consultationFormDataJson: consultationRecord?.formDataJson ?? null,
        recordedAt: input.recordedAt,
        responsibleUser: input.responsibleUser,
      });

      return {
        tabKey: 'Egreso',
        noteType: 'Egreso de urgencias',
        title: 'Egreso de urgencias V1',
        status:
          input.input.status ??
          input.currentRecord?.status ??
          EncounterRecordStatus.DRAFT,
        formData,
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber: 1,
          inheritedFromRecordId:
            currentRecordMetadata.inheritedFromRecordId ??
            evolutionRecord?.id ??
            initialNoteRecord?.id ??
            triageRecord?.id ??
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
      ) &&
      !this.isHospitalAdmissionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isHospitalEvolutionRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isHospitalMedicalOrdersRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isHospitalConsultationRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isHospitalNursingShiftRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      ) &&
      !this.isHospitalDischargeRecord(
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
      if (
        this.isEmergencyDocumentRecord(
          input.encounter.encounterType,
          input.input.tabKey,
        ) &&
        !this.isAllowedEmergencyDocumentType(input.input.noteType)
      ) {
        throw new BadRequestException(
          'Tipo de documento no permitido en Urgencias',
        );
      }
      if (
        this.isHospitalDocumentRecord(
          input.encounter.encounterType,
          input.input.tabKey,
        ) &&
        !this.isAllowedHospitalDocumentType(input.input.noteType)
      ) {
        throw new BadRequestException(
          'Tipo de documento no permitido en Hospitalización',
        );
      }
      if (
        this.isAmbulatoryProcedureSupportingDocumentRecord(
          input.encounter.encounterType,
          input.input.tabKey,
        ) &&
        !this.isAllowedAmbulatoryProcedureSupportingDocumentType(
          input.input.noteType,
        )
      ) {
        throw new BadRequestException(
          'Tipo de documento no permitido en Procedimiento ambulatorio',
        );
      }
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
      const documentFolio =
        currentRecordMetadata.folio ??
        `${input.encounter.encounterNumber}-${this.sanitizeFileName(input.input.noteType).toUpperCase()}-${String(versionNumber).padStart(2, '0')}`;
      const mergedFormData = this.isAmbulatoryProcedureSupportingDocumentRecord(
        input.encounter.encounterType,
        input.input.tabKey,
      )
        ? this.buildAmbulatoryProcedureSupportingDocumentFormData({
            encounter: input.encounter,
            currentRecordFormData: input.currentRecord?.formDataJson ?? null,
            incomingFormData: input.input.formData,
            noteType: input.input.noteType,
            recordedAt: input.recordedAt,
            responsibleUser: input.responsibleUser,
            versionNumber,
            folio: documentFolio,
            verificationCode,
          })
        : this.isHospitalDocumentRecord(
              input.encounter.encounterType,
              input.input.tabKey,
            )
          ? this.buildHospitalDocumentFormData({
            encounter: input.encounter,
            currentRecordFormData: input.currentRecord?.formDataJson ?? null,
            incomingFormData: input.input.formData,
            noteType: input.input.noteType,
            recordedAt: input.recordedAt,
            responsibleUser: input.responsibleUser,
            versionNumber,
            folio: documentFolio,
            verificationCode,
            })
          : (this.buildConsultationDocumentFormData({
            encounter: input.encounter,
            currentRecordFormData: input.currentRecord?.formDataJson ?? null,
            incomingFormData: input.input.formData,
            noteType: input.input.noteType,
            responsibleUser: input.responsibleUser,
            }) as Record<string, unknown>);

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
          tipoRegistro: input.input.noteType,
          documentoCodigoVerificacion: verificationCode,
          documentoFolio: documentFolio,
          documentoVersion: `V${versionNumber}`,
          documentoEstado:
            input.currentRecord?.status === EncounterRecordStatus.SIGNED
              ? 'Firmado'
              : 'Borrador',
          documentoFecha:
            this.readStringValue(mergedFormData.documentoFecha) ||
            input.recordedAt.toISOString().slice(0, 10),
          documentoHora:
            this.readStringValue(mergedFormData.documentoHora) ||
            input.recordedAt.toISOString().slice(11, 16),
        },
        metadata: {
          ...this.normalizeRecordMetadata(input.currentRecord?.metadataJson),
          versionNumber,
          folio: documentFolio,
          verificationCode,
          documentHash: this.readStringValue(mergedFormData.documentoHash),
          digitalSeal: this.readStringValue(mergedFormData.documentoSelloDigital),
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
      const consentimientoComprension =
        this.normalizeConsultationConsentComprehension(
          input.input.formData.consentimientoComprension,
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
          consentimientoComprension,
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
      const prescriptionTitle =
        this.buildConsultationPrescriptionTitle(versionNumber);
      const patientComprehension =
        this.normalizeConsultationPrescriptionPatientComprehension(
          input.input.formData.recetaComprensionPaciente,
        );

      return {
        tabKey: consultationPrescriptionTabKey,
        noteType: consultationPrescriptionRecordType,
        title: prescriptionTitle,
        status:
          input.currentRecord?.status === EncounterRecordStatus.SIGNED
            ? EncounterRecordStatus.SIGNED
            : EncounterRecordStatus.DRAFT,
        formData: {
          ...input.input.formData,
          recetaComprensionPaciente: patientComprehension,
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
    const { historyType: _historyType, ...baseHistoryMetadata } =
      this.normalizeRecordMetadata(input.currentRecord?.metadataJson) ?? {};
    const normalizedHistoryFormData = this.omitLegacyHistorySystemFields(
      input.input.formData,
    );
    normalizedHistoryFormData.estudiosPreviosRegistrados =
      this.normalizeConsultationHistoryPriorStudiesFormData(
        normalizedHistoryFormData.estudiosPreviosRegistrados,
      );

    return {
      tabKey: input.input.tabKey,
      noteType: 'Historia clínica',
      title: `Historia clínica versión ${versionNumber}`,
      status: input.input.status ?? input.currentRecord?.status ?? EncounterRecordStatus.DRAFT,
      formData: {
        ...normalizedHistoryFormData,
        legalMedico:
          input.responsibleUser?.fullName ?? 'Sin profesional responsable',
        legalCedula: input.responsibleUser?.professionalLicense ?? 'Sin cédula',
        legalEspecialidad: input.encounter.specialty?.name ?? 'Sin especialidad',
      },
      metadata: {
        ...baseHistoryMetadata,
        versionNumber,
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

  private omitLegacyHistorySystemFields(formData: Record<string, unknown>) {
    const {
      tipoHistoriaClinica: _legacyHistoryType,
      fechaHistoria: _legacyHistoryDate,
      ...editableHistoryFormData
    } = formData;

    return editableHistoryFormData;
  }

  private normalizeConsultationHistoryPriorStudiesFormData(value: unknown) {
    return this.readObjectArray(value)
      .map((study) => ({
        tipoEstudio: this.normalizeConsultationPriorStudyType(study.tipoEstudio),
        nombreEstudio: this.readStringValue(study.nombreEstudio).trim(),
        fechaEstudio: this.readStringValue(study.fechaEstudio).trim(),
        resultado: this.readStringValue(study.resultado).trim(),
        interpretacionHallazgo: this.readStringValue(
          study.interpretacionHallazgo,
        ).trim(),
        sourceModule: this.readStringValue(study.sourceModule).trim(),
        sourceReferenceId: this.readStringValue(study.sourceReferenceId).trim(),
      }))
      .filter((study) =>
        [
          study.tipoEstudio,
          study.nombreEstudio,
          study.fechaEstudio,
          study.resultado,
          study.interpretacionHallazgo,
        ].some((fieldValue) => fieldValue.length > 0),
      );
  }

  private normalizeConsultationPriorStudyType(value: unknown) {
    const studyType = this.readStringValue(value).trim().toUpperCase();

    if (['LABORATORY', 'IMAGING', 'CABINET', 'OTHER'].includes(studyType)) {
      return studyType;
    }

    return '';
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

  private isEmergencyDischargeRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.EMERGENCY && tabKey === 'Egreso';
  }

  private isEmergencyDocumentRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.EMERGENCY && tabKey === 'Documentos';
  }

  private isHospitalAdmissionRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.HOSPITALIZATION && tabKey === 'Ingreso';
  }

  private isHospitalEvolutionRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.HOSPITALIZATION && tabKey === 'Evolución';
  }

  private isHospitalMedicalOrdersRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      encounterType === EncounterType.HOSPITALIZATION &&
      tabKey === 'Indicaciones médicas'
    );
  }

  private isHospitalConsultationRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.HOSPITALIZATION && tabKey === 'Interconsultas';
  }

  private isHospitalSurgicalDocumentRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      encounterType === EncounterType.HOSPITALIZATION &&
      tabKey === 'Procedimientos / Cirugía'
    );
  }

  private isHospitalNursingShiftRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.HOSPITALIZATION && tabKey === 'Enfermería';
  }

  private isHospitalDischargeRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.HOSPITALIZATION && tabKey === 'Egreso';
  }

  private isAmbulatoryPreprocedureRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      encounterType === EncounterType.SURGERY &&
      tabKey === 'Valoración preprocedimiento'
    );
  }

  private isAmbulatoryProcedureRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.SURGERY && tabKey === 'Procedimiento';
  }

  private isAmbulatoryRecoveryEvaluationRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      encounterType === EncounterType.SURGERY &&
      (tabKey === 'Recuperación / Evaluación' ||
        tabKey === 'Recuperación / Evolución')
    );
  }

  private isAmbulatoryDischargePrescriptionRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      encounterType === EncounterType.SURGERY &&
      (tabKey === 'Receta e indicaciones de egreso' ||
        tabKey === 'Indicaciones / Receta')
    );
  }

  private isAmbulatoryDischargeRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.SURGERY && tabKey === 'Egreso';
  }

  private async assertAmbulatoryProcedureStageEnabled(encounterId: string) {
    const signedPreprocedure = await this.prisma.encounterSectionRecord.findFirst({
      where: {
        encounterId,
        encounterType: EncounterType.SURGERY,
        tabKey: 'Valoración preprocedimiento',
        noteType: 'Valoración preprocedimiento',
        status: EncounterRecordStatus.SIGNED,
      },
      select: { id: true },
    });

    if (!signedPreprocedure) {
      throw new BadRequestException(
        'Firma la valoración preprocedimiento antes de avanzar a Procedimiento',
      );
    }
  }

  private async assertAmbulatoryRecoveryEvaluationStageEnabled(encounterId: string) {
    const signedProcedure = await this.prisma.encounterSectionRecord.findFirst({
      where: {
        encounterId,
        encounterType: EncounterType.SURGERY,
        tabKey: 'Procedimiento',
        noteType: 'Procedimiento',
        status: EncounterRecordStatus.SIGNED,
      },
      select: { id: true },
    });

    if (!signedProcedure) {
      throw new BadRequestException(
        'Firma el procedimiento antes de avanzar a Recuperación / Evaluación',
      );
    }
  }

  private isAllowedEmergencyDocumentType(noteType: string) {
    return [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Referencia / contrarreferencia',
      'Consentimiento informado',
      'Certificado / constancia',
      'Egreso voluntario',
    ].includes(noteType);
  }

  private isAllowedHospitalDocumentType(noteType: string) {
    return [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Consentimiento informado',
      'Resumen clínico',
      'Referencia / traslado',
      'Defunción',
    ].includes(noteType);
  }

  private isAllowedAmbulatoryProcedureSupportingDocumentType(noteType: string) {
    return [
      'Solicitud de laboratorio',
      'Solicitud de imagenología',
      'Referencia / contrarreferencia',
      'Consentimiento informado',
      'Certificado / constancia',
    ].includes(noteType);
  }

  private buildHospitalDocumentFormData(input: {
    encounter: TenantEncounterRecord;
    currentRecordFormData: Prisma.JsonValue | null;
    incomingFormData: Record<string, unknown>;
    noteType: string;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    folio: string;
    verificationCode: string;
  }) {
    const currentFormData =
      input.currentRecordFormData &&
      typeof input.currentRecordFormData === 'object' &&
      !Array.isArray(input.currentRecordFormData)
        ? (input.currentRecordFormData as Record<string, unknown>)
        : {};
    const latestAdmission = this.findLatestHospitalRecordFormData(
      input.encounter,
      'Ingreso',
    );
    const latestEvolution = this.findLatestHospitalRecordFormData(
      input.encounter,
      'Evolución',
    );
    const latestOrders = this.findLatestHospitalRecordFormData(
      input.encounter,
      'Indicaciones médicas',
    );
    const latestSurgical = this.findLatestHospitalRecordFormData(
      input.encounter,
      'Procedimientos / Cirugía',
    );
    const latestConsultation = this.findLatestHospitalRecordFormData(
      input.encounter,
      'Interconsultas',
    );
    const latestDischarge = this.findLatestHospitalRecordFormData(
      input.encounter,
      'Egreso',
    );
    const careLocation =
      [
        input.encounter.facility?.name,
        input.encounter.serviceArea?.name,
      ]
        .filter(Boolean)
        .join(' · ') ||
      input.encounter.tenant.legalName ||
      input.encounter.tenant.name;
    const patientCurp = this.readStringValue(
      (input.encounter.patient as { curp?: unknown }).curp,
    );
    const documentHash =
      this.readStringValue(input.incomingFormData.documentoHash) ||
      this.readStringValue(currentFormData.documentoHash) ||
      randomUUID().replace(/-/g, '');
    const digitalSeal =
      this.readStringValue(input.incomingFormData.documentoSelloDigital) ||
      this.readStringValue(currentFormData.documentoSelloDigital) ||
      `${input.verificationCode}-${documentHash.slice(0, 16)}`;
    const diagnosis =
      this.readStringValue(input.incomingFormData.documentoDiagnosticoPrincipal) ||
      this.readStringValueFromJson(latestDischarge, 'diagnosticoFinalEgresoHosp') ||
      this.readStringValueFromJson(latestEvolution, 'diagnosticoPrincipalEvolHosp') ||
      this.readStringValueFromJson(latestAdmission, 'diagnosticoPrincipalHosp') ||
      input.encounter.diagnoses[0]?.description ||
      '';
    const cie10 =
      this.readStringValue(input.incomingFormData.documentoDiagnosticoCie10) ||
      this.readStringValueFromJson(latestDischarge, 'cie10EgresoHosp') ||
      this.readStringValueFromJson(latestEvolution, 'cie10EvolHosp') ||
      this.readStringValueFromJson(latestAdmission, 'cie10Hosp') ||
      input.encounter.diagnoses[0]?.code ||
      '';
    const hospitalSuggestions = this.buildHospitalDocumentSuggestionSnapshot({
      noteType: input.noteType,
      diagnosis,
      cie10,
      latestAdmission,
      latestEvolution,
      latestOrders,
      latestSurgical,
      latestConsultation,
      latestDischarge,
    });

    return {
      ...hospitalSuggestions,
      ...input.incomingFormData,
      tipoRegistro: input.noteType,
      documentoTipoEpisodio: 'Hospitalización',
      documentoPacienteNombre: input.encounter.patient.fullName,
      documentoPacienteCurp: patientCurp,
      documentoExpediente: input.encounter.medicalRecord.recordNumber,
      documentoFolioEpisodio: input.encounter.encounterNumber,
      documentoFolio: input.folio,
      documentoVersion: `V${input.versionNumber}`,
      documentoEstado:
        this.readStringValue(currentFormData.documentoEstado) === 'Firmado'
          ? 'Firmado'
          : 'Borrador',
      documentoCodigoVerificacion: input.verificationCode,
      documentoHash: documentHash,
      documentoSelloDigital: digitalSeal,
      documentoFecha:
        this.readStringValue(input.incomingFormData.documentoFecha) ||
        this.readStringValue(currentFormData.documentoFecha) ||
        input.recordedAt.toISOString().slice(0, 10),
      documentoHora:
        this.readStringValue(input.incomingFormData.documentoHora) ||
        this.readStringValue(currentFormData.documentoHora) ||
        input.recordedAt.toISOString().slice(11, 16),
      documentoInstitucionEmisora:
        input.encounter.facility?.institutionName ??
        input.encounter.facility?.legalName ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      documentoRfcMedico: input.encounter.tenant.taxId ?? 'Sin dato disponible',
      documentoLicenciaSanitaria:
        input.encounter.facility?.legalName ?? 'Sin dato disponible',
      documentoNombreProfesional:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      documentoCedulaProfesional:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      documentoEspecialidadProfesional:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      documentoLugarAtencion: careLocation,
    };
  }

  private buildAmbulatoryProcedureSupportingDocumentFormData(input: {
    encounter: TenantEncounterRecord;
    currentRecordFormData: Prisma.JsonValue | null;
    incomingFormData: Record<string, unknown>;
    noteType: string;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    folio: string;
    verificationCode: string;
  }) {
    const currentFormData =
      input.currentRecordFormData &&
      typeof input.currentRecordFormData === 'object' &&
      !Array.isArray(input.currentRecordFormData)
        ? (input.currentRecordFormData as Record<string, unknown>)
        : {};
    const latestPreprocedure = this.findLatestSectionRecord(
      input.encounter.sectionRecords,
      'Valoración preprocedimiento',
    );
    const latestProcedure = this.findLatestSectionRecord(
      input.encounter.sectionRecords,
      'Procedimiento',
    );
    const latestRecovery =
      this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Recuperación / Evaluación',
      ) ??
      this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Recuperación / Evolución',
      );
    const latestDischarge = this.findLatestSectionRecord(
      input.encounter.sectionRecords,
      'Egreso',
    );
    const procedureFormData = latestProcedure?.formDataJson ?? null;
    const preprocedureFormData = latestPreprocedure?.formDataJson ?? null;
    const recoveryFormData = latestRecovery?.formDataJson ?? null;
    const dischargeFormData = latestDischarge?.formDataJson ?? null;
    const documentHash =
      this.readStringValue(input.incomingFormData.documentoHash) ||
      this.readStringValue(currentFormData.documentoHash) ||
      randomUUID().replace(/-/g, '');
    const digitalSeal =
      this.readStringValue(input.incomingFormData.documentoSelloDigital) ||
      this.readStringValue(currentFormData.documentoSelloDigital) ||
      `${input.verificationCode}-${documentHash.slice(0, 16)}`;
    const diagnosis =
      this.readStringValue(input.incomingFormData.documentoDiagnosticoPrincipal) ||
      this.readStringValueFromJson(dischargeFormData, 'diagnosticoFinalEgresoAmb') ||
      this.readStringValueFromJson(procedureFormData, 'diagnosticoPostoperatorioProc') ||
      this.readStringValueFromJson(preprocedureFormData, 'diagnosticoPreoperatorioPreproc') ||
      input.encounter.diagnoses[0]?.description ||
      '';
    const cie10 =
      this.readStringValue(input.incomingFormData.documentoDiagnosticoCie10) ||
      this.readStringValueFromJson(dischargeFormData, 'cie10EgresoAmb') ||
      this.readStringValueFromJson(procedureFormData, 'cie10PostoperatorioProc') ||
      this.readStringValueFromJson(preprocedureFormData, 'cie10Preproc') ||
      input.encounter.diagnoses[0]?.code ||
      '';
    const procedureName =
      this.readStringValue(input.incomingFormData.documentoProcedimientoNombre) ||
      this.readStringValueFromJson(procedureFormData, 'procedimientoRealizadoProc') ||
      this.readStringValueFromJson(preprocedureFormData, 'procedimientoIndicadoPreproc') ||
      '';
    const careLocation =
      [input.encounter.facility?.name, input.encounter.serviceArea?.name]
        .filter(Boolean)
        .join(' · ') ||
      input.encounter.tenant.legalName ||
      input.encounter.tenant.name;
    const contrastAlert =
      input.noteType === 'Solicitud de imagenología' &&
      this.readStringValue(input.incomingFormData.documentoConContraste) ===
        'Con contraste' &&
      input.encounter.allergies.some((allergy) =>
        allergy.substance.toLowerCase().includes('contraste'),
      )
        ? 'Alergia a contraste registrada: verificar antes de solicitar'
        : '';

    const suggestions =
      input.noteType === 'Referencia / contrarreferencia'
        ? {
            documentoDiagnosticoPrincipal: diagnosis,
            documentoProcedimientoRealizado: procedureName,
            documentoEvolucionBreve:
              this.readStringValueFromJson(
                recoveryFormData,
                'exploracionPostprocedimientoRecEval',
              ) ||
              this.readStringValueFromJson(recoveryFormData, 'planVigilanciaRecEval'),
          }
        : input.noteType === 'Consentimiento informado'
          ? {
              documentoProcedimientoNombre: procedureName,
              documentoTipoAnestesia:
                this.readStringValueFromJson(procedureFormData, 'tipoAnestesiaProc') ||
                this.readStringValueFromJson(
                  preprocedureFormData,
                  'tipoAnestesiaPrevistaPreproc',
                ),
              documentoRiesgos:
                this.readStringValueFromJson(
                  preprocedureFormData,
                  'riesgosInformadosPreproc',
                ) || '',
              documentoBeneficios:
                this.readStringValueFromJson(
                  preprocedureFormData,
                  'beneficiosEsperadosPreproc',
                ) || '',
            }
          : input.noteType === 'Certificado / constancia'
            ? {
                documentoDiagnosticoPrincipal: diagnosis,
                documentoTextoConstancia: procedureName
                  ? `Se realizó procedimiento ambulatorio: ${procedureName}.`
                  : '',
              }
            : {
                documentoDiagnosticoPrincipal: diagnosis,
                documentoDiagnosticoCie10: cie10,
              };

    return {
      ...suggestions,
      ...input.incomingFormData,
      tipoRegistro: input.noteType,
      documentoTipoEpisodio: 'Procedimiento ambulatorio',
      documentoPacienteNombre: input.encounter.patient.fullName,
      documentoExpediente: input.encounter.medicalRecord.recordNumber,
      documentoFolioEpisodio: input.encounter.encounterNumber,
      documentoFolio: input.folio,
      documentoVersion: `V${input.versionNumber}`,
      documentoEstado:
        this.readStringValue(currentFormData.documentoEstado) === 'Firmado'
          ? 'Firmado'
          : 'Borrador',
      documentoCodigoVerificacion: input.verificationCode,
      documentoHash: documentHash,
      documentoSelloDigital: digitalSeal,
      documentoFecha:
        this.readStringValue(input.incomingFormData.documentoFecha) ||
        this.readStringValue(currentFormData.documentoFecha) ||
        input.recordedAt.toISOString().slice(0, 10),
      documentoHora:
        this.readStringValue(input.incomingFormData.documentoHora) ||
        this.readStringValue(currentFormData.documentoHora) ||
        input.recordedAt.toISOString().slice(11, 16),
      documentoInstitucionEmisora:
        input.encounter.facility?.institutionName ??
        input.encounter.facility?.legalName ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      documentoInstitucionNombre:
        input.encounter.facility?.institutionName ??
        input.encounter.tenant.name,
      documentoRazonSocial:
        input.encounter.facility?.legalName ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      documentoRfcMedico: input.encounter.tenant.taxId ?? 'Sin dato disponible',
      documentoLicenciaSanitaria:
        input.encounter.facility?.legalName ?? 'Sin dato disponible',
      documentoNombreProfesional:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      documentoCedulaProfesional:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      documentoEspecialidadProfesional:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      documentoLugarAtencion: careLocation,
      documentoFirmaMedico:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      documentoAlertaContraste: contrastAlert,
    };
  }

  private buildHospitalDocumentSuggestionSnapshot(input: {
    noteType: string;
    diagnosis: string;
    cie10: string;
    latestAdmission: Prisma.JsonValue | null;
    latestEvolution: Prisma.JsonValue | null;
    latestOrders: Prisma.JsonValue | null;
    latestSurgical: Prisma.JsonValue | null;
    latestConsultation: Prisma.JsonValue | null;
    latestDischarge: Prisma.JsonValue | null;
  }): Record<string, unknown> {
    if (input.noteType === 'Solicitud de laboratorio') {
      return {
        documentoDiagnosticoPrincipal: input.diagnosis,
        documentoDiagnosticoCie10: input.cie10,
        documentoServicioSolicitud:
          this.readStringValueFromJson(input.latestAdmission, 'servicioIngresoHosp') ||
          '',
        documentoEstudiosLaboratorio: this.readObjectArray(
          this.readUnknownFromJson(input.latestOrders, 'estudiosSolicitadosHospDoc'),
        ),
      };
    }

    if (input.noteType === 'Solicitud de imagenología') {
      return {
        documentoDiagnosticoPrincipal: input.diagnosis,
        documentoDiagnosticoCie10: input.cie10,
        documentoServicioSolicitud:
          this.readStringValueFromJson(input.latestAdmission, 'servicioIngresoHosp') ||
          '',
      };
    }

    if (input.noteType === 'Consentimiento informado') {
      return {
        documentoProcedimientoNombre:
          this.readStringValueFromJson(input.latestSurgical, 'cirugiaPropuestaQuirHosp') ||
          this.readStringValueFromJson(input.latestSurgical, 'procedimientoRealizadoPostopHosp') ||
          '',
        documentoNombrePacienteConsentimiento:
          this.readStringValueFromJson(input.latestAdmission, 'pacienteNombre') || '',
      };
    }

    if (input.noteType === 'Resumen clínico') {
      return {
        documentoMotivoAtencion:
          this.readStringValueFromJson(input.latestAdmission, 'motivoIngresoClinicoHosp') ||
          '',
        documentoDiagnosticosIniciales:
          this.readStringValueFromJson(input.latestAdmission, 'diagnosticoPrincipalHosp') ||
          input.diagnosis,
        documentoDiagnosticosFinales:
          this.readStringValueFromJson(input.latestDischarge, 'diagnosticoFinalEgresoHosp') ||
          input.diagnosis,
        documentoEvolucion:
          this.readStringValueFromJson(input.latestDischarge, 'evolucionEstanciaEgresoHosp') ||
          this.readStringValueFromJson(input.latestEvolution, 'interpretacionClinicaEvolHosp') ||
          '',
        documentoTratamientos:
          this.readStringValueFromJson(input.latestDischarge, 'manejoRealizadoEgresoHosp') ||
          this.summarizeHospitalOrderMedications(
            this.readObjectArray(
              this.readUnknownFromJson(input.latestOrders, 'medicamentosIndicacionesHosp'),
            ),
          ),
        documentoPlan:
          this.readStringValueFromJson(input.latestDischarge, 'seguimientoEgresoHosp') ||
          this.readStringValueFromJson(input.latestEvolution, 'seguimientoEvolHosp') ||
          '',
      };
    }

    if (input.noteType === 'Referencia / traslado') {
      return {
        documentoUnidadOrigen:
          this.readStringValueFromJson(input.latestAdmission, 'servicioIngresoHosp') || '',
        documentoMotivoTraslado:
          this.readStringValueFromJson(input.latestDischarge, 'problemasPendientesEgresoHosp') ||
          '',
        documentoResumenClinicoBreve:
          this.readStringValueFromJson(input.latestDischarge, 'resumenNarrativoEgresoHosp') ||
          this.readStringValueFromJson(input.latestEvolution, 'interpretacionClinicaEvolHosp') ||
          '',
        documentoManejoPrevio:
          this.readStringValueFromJson(input.latestDischarge, 'manejoRealizadoEgresoHosp') ||
          '',
      };
    }

    if (input.noteType === 'Defunción') {
      return {
        documentoDatosPacienteDefuncion:
          this.readStringValueFromJson(input.latestDischarge, 'resumenNarrativoEgresoHosp') ||
          '',
        documentoMedicoCertificante:
          this.readStringValueFromJson(input.latestDischarge, 'medicoResponsableEgresoHosp') ||
          '',
        documentoCedulaCertificante:
          this.readStringValueFromJson(input.latestDischarge, 'cedulaResponsableEgresoHosp') ||
          '',
      };
    }

    return {};
  }

  private buildHospitalAdmissionFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    emergencyDischargeFormDataJson: Prisma.JsonValue | null;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const admissionDate =
      this.readStringValue(input.incomingFormData.fechaIngresoHosp) ||
      input.recordedAt.toISOString().slice(0, 10);
    const admissionTime =
      this.readStringValue(input.incomingFormData.horaIngresoHosp) ||
      input.recordedAt.toISOString().slice(11, 16);
    const emergencyOrigin =
      input.encounter.admissionSource === AdmissionSource.EMERGENCY;
    const sourceEmergencySummary = this.readStringValueFromJson(
      input.emergencyDischargeFormDataJson,
      'resumenTrasladoUrg',
    );
    const originEpisodeReference =
      this.readStringValue(input.incomingFormData.episodioOrigenHosp) ||
      (emergencyOrigin ? input.encounter.encounterNumber : '');
    const bloodType =
      this.readStringValue(input.incomingFormData.grupoSanguineoRhHosp) ||
      input.encounter.patient.bloodType ||
      '';

    return {
      ...input.incomingFormData,
      tipoRegistro: 'Ingreso hospitalario',
      origenIngresoHosp:
        this.readStringValue(input.incomingFormData.origenIngresoHosp) ||
        (emergencyOrigin ? 'URGENCIAS' : 'MANUAL'),
      fechaIngresoHosp: admissionDate,
      horaIngresoHosp: admissionTime,
      tiempoValoracionInicialHosp:
        this.readStringValue(input.incomingFormData.tiempoValoracionInicialHosp) ||
        this.calculateAdmissionAssessmentTime(input.encounter.openedAt, input.recordedAt),
      episodioOrigenHosp: originEpisodeReference,
      referenciaUrgenciasHosp:
        this.readStringValue(input.incomingFormData.referenciaUrgenciasHosp) ||
        sourceEmergencySummary,
      grupoSanguineoRhHosp: bloodType,
      medicoIngresoLegal:
        input.responsibleUser?.fullName ??
        'Sin profesional responsable',
      cedulaIngresoLegal:
        input.responsibleUser?.professionalLicense ??
        'Sin cédula',
      especialidadIngresoLegal: input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionIngresoLegal:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
    };
  }

  private buildHospitalEvolutionFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    admissionFormDataJson: Prisma.JsonValue | null;
    previousEvolutionFormDataJson: Prisma.JsonValue | null;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const previousDiagnoses = this.readObjectArray(
      input.incomingFormData.diagnosticosActivosEvolHosp,
    );
    const activeDiagnoses =
      previousDiagnoses.length > 0
        ? previousDiagnoses
        : input.encounter.diagnoses.map((diagnosis) => ({
            diagnostico: diagnosis.description,
            cie10: diagnosis.code ?? '',
            estado: diagnosis.isPrimary ? 'ACTIVO' : 'ACTIVO',
            sourceDiagnosisId: diagnosis.id,
          }));

    return {
      ...input.incomingFormData,
      tipoRegistro: 'Evolución hospitalaria',
      diagnosticosActivosEvolHosp: activeDiagnoses,
      cambiosClinicosEvolHosp:
        this.readStringValue(input.incomingFormData.cambiosClinicosEvolHosp) ||
        this.buildHospitalEvolutionChangeReference(input.previousEvolutionFormDataJson),
      medicoEvolHospLegal:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaEvolHospLegal:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadEvolHospLegal: input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionEvolHospLegal:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      referenciaIngresoHosp:
        this.readStringValueFromJson(input.admissionFormDataJson, 'diagnosticoPrincipalHosp') ||
        this.readStringValueFromJson(input.admissionFormDataJson, 'motivoIngresoClinicoHosp'),
    };
  }

  private buildHospitalEvolutionChangeReference(rawValue: Prisma.JsonValue | null) {
    const previousInterpretation = this.readStringValueFromJson(
      rawValue,
      'interpretacionClinicaEvolHosp',
    );
    const previousPlan = this.readStringValueFromJson(rawValue, 'tratamientoEvolHosp');

    if (!previousInterpretation && !previousPlan) {
      return '';
    }

    return [
      previousInterpretation ? `Evolución previa: ${previousInterpretation}` : '',
      previousPlan ? `Plan previo: ${previousPlan}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildHospitalMedicalOrdersFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const startTime =
      this.readStringValue(input.incomingFormData.horaInicioIndicacionesHosp) ||
      input.recordedAt.toISOString().slice(11, 16);

    return {
      ...input.incomingFormData,
      tipoRegistro: 'Indicaciones médicas',
      horaInicioIndicacionesHosp: startTime,
      programacionSiguienteTurnoHosp:
        this.readStringValue(
          input.incomingFormData.programacionSiguienteTurnoHosp,
        ) || 'Pendiente de programación por enfermería',
      usuarioEjecutorHosp:
        this.readStringValue(input.incomingFormData.usuarioEjecutorHosp) ||
        'Pendiente de asignación por enfermería',
      medicoIndicacionesLegal:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaIndicacionesLegal:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadIndicacionesLegal:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionIndicacionesLegal:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
    };
  }

  private buildHospitalConsultationFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const requestDate =
      this.readStringValue(input.incomingFormData.fechaSolicitudInterHosp) ||
      input.recordedAt.toISOString().slice(0, 10);
    const requestTime =
      this.readStringValue(input.incomingFormData.horaSolicitudInterHosp) ||
      input.recordedAt.toISOString().slice(11, 16);
    const priority = this.readStringValue(input.incomingFormData.prioridadInterHosp);
    const targetResponseMinutes =
      this.readNumericValue(input.incomingFormData.tiempoObjetivoRespuestaInterHosp) ??
      this.calculateHospitalConsultationSlaMinutes(priority);
    const responseDate = this.readStringValue(
      input.incomingFormData.fechaRespuestaInterHosp,
    );
    const responseTime = this.readStringValue(
      input.incomingFormData.horaRespuestaInterHosp,
    );
    const responseTimeMinutes = this.calculateHospitalConsultationElapsedMinutes(
      requestDate,
      requestTime,
      responseDate,
      responseTime,
    );
    const closedAt = this.parseOptionalDate(input.incomingFormData.fechaCierreInterHosp);
    const requestedAt = this.parseOptionalDate(`${requestDate}T${requestTime}`);
    const closureTimeMinutes =
      requestedAt && closedAt && closedAt >= requestedAt
        ? Math.round((closedAt.getTime() - requestedAt.getTime()) / 60000)
        : null;

    return {
      ...input.incomingFormData,
      tipoRegistro: 'Interconsultas',
      fechaSolicitudInterHosp: requestDate,
      horaSolicitudInterHosp: requestTime,
      medicoSolicitanteInterHosp:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaSolicitanteInterHosp:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadSolicitanteInterHosp:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      servicioSolicitanteInterHosp:
        input.encounter.serviceArea?.name ??
        input.encounter.specialty?.name ??
        'Servicio no configurado',
      tiempoObjetivoRespuestaInterHosp: String(targetResponseMinutes),
      estatusInterconsultaHosp: this.resolveHospitalConsultationStatus({
        ...input.incomingFormData,
      }),
      tiempoRespuestaRealInterHosp:
        responseTimeMinutes === null ? '' : `${responseTimeMinutes} min`,
      tiempoCierreInterHosp:
        closureTimeMinutes === null ? '' : `${closureTimeMinutes} min`,
      medicoInterLegal:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaInterLegal:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadInterLegal: input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionInterLegal:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
    };
  }

  private buildAmbulatoryProcedureFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    currentMetadata: Record<string, unknown>;
  }) {
    const procedureDate =
      this.readStringValue(input.incomingFormData.fechaProcedimientoProc) ||
      input.recordedAt.toISOString().slice(0, 10);
    const realStartTime =
      this.readStringValue(input.incomingFormData.horaInicioRealProc) ||
      input.recordedAt.toISOString().slice(11, 16);
    const realEndTime = this.readStringValue(
      input.incomingFormData.horaFinRealProc,
    );
    const calculatedDuration =
      this.calculateProcedureDurationMinutes(
        procedureDate,
        realStartTime,
        realEndTime,
      ) ?? this.readRoundedNumericValue(input.incomingFormData.duracionMinutosProc);
    const anesthesiaType = this.readStringValue(
      input.incomingFormData.tipoAnestesiaProc,
    );
    const hasAnesthesia = anesthesiaType !== '' && anesthesiaType !== 'NO_APLICA';
    const alerts = this.buildAmbulatoryProcedureAlerts(input.incomingFormData);
    const hashSeed = JSON.stringify({
      encounterId: input.encounter.id,
      tabKey: 'Procedimiento',
      versionNumber: input.versionNumber,
      recordedAt: input.recordedAt.toISOString(),
      formData: input.incomingFormData,
    });
    const documentHash =
      this.readStringValue(input.currentMetadata.documentHash) ||
      createHash('sha256').update(hashSeed).digest('hex');

    return {
      ...input.incomingFormData,
      tipoRegistroProcedimiento: 'Procedimiento',
      versionProcedimiento: input.versionNumber,
      fechaProcedimientoProc: procedureDate,
      horaInicioRealProc: realStartTime,
      duracionMinutosProc:
        calculatedDuration !== null && calculatedDuration !== undefined
          ? String(calculatedDuration)
          : '',
      tipoAnestesiaProc: anesthesiaType || 'NO_APLICA',
      huboAnestesiaProc: hasAnesthesia ? 'SI' : 'NO',
      alertasAnestesiaProc:
        alerts.length > 0 ? alerts.join('\n') : 'Sin alertas anestésicas',
      alertaDestinoProc:
        this.readStringValue(input.incomingFormData.destinoPostprocedimientoProc) ===
        'HOSPITALIZACION'
          ? 'Destino hospitalización: preparar enlace a episodio hospitalario.'
          : 'Sin alerta de destino.',
      profesionalNombreProc:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      profesionalCedulaProc:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      profesionalEspecialidadProc:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionProc:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      hashProc: documentHash,
      selloDigitalProc:
        this.readStringValue(input.currentMetadata.digitalSeal) ||
        `GIMEDIC-PROC-${String(input.versionNumber).padStart(3, '0')}-${documentHash.slice(0, 12)}`,
    };
  }

  private calculateProcedureDurationMinutes(
    procedureDate: string,
    realStartTime: string,
    realEndTime: string,
  ) {
    if (!procedureDate || !realStartTime || !realEndTime) {
      return null;
    }
    const start = new Date(`${procedureDate}T${realStartTime}`);
    let end = new Date(`${procedureDate}T${realEndTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    if (end < start) {
      end = new Date(end.getTime() + 86_400_000);
    }
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  }

  private buildAmbulatoryProcedureAlerts(formData: Record<string, unknown>) {
    return [
      Boolean(formData.toProfilaxisAntibioticaProc) === false
        ? 'Profilaxis antibiótica no registrada en Time-Out.'
        : '',
      this.readStringValue(formData.cuentaGasasInstrumentalProc) === 'INCOMPLETA'
        ? 'Cuenta de gasas e instrumental incompleta: bloquea firma.'
        : '',
      this.readStringValue(formData.huboComplicacionesProc) === 'SI' &&
      (!this.hasCapturedValue(formData.tipoComplicacionProc) ||
        !this.hasCapturedValue(formData.manejoComplicacionProc))
        ? 'Complicaciones sin documentación completa.'
        : '',
    ].filter((alert) => alert.length > 0);
  }

  private buildAmbulatoryRecoveryEvaluationFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    currentMetadata: Record<string, unknown>;
  }) {
    const aldreteTotal = this.calculateAldreteTotal(input.incomingFormData);
    const alerts = this.buildAmbulatoryRecoveryEvaluationAlerts(
      input.incomingFormData,
      aldreteTotal,
    );
    const hasRedAlert = alerts.some((alert) => alert.severity === 'ROJO');
    const hashSeed = JSON.stringify({
      encounterId: input.encounter.id,
      tabKey: 'Recuperación / Evaluación',
      versionNumber: input.versionNumber,
      recordedAt: input.recordedAt.toISOString(),
      formData: input.incomingFormData,
    });
    const documentHash =
      this.readStringValue(input.currentMetadata.documentHash) ||
      createHash('sha256').update(hashSeed).digest('hex');

    return {
      ...input.incomingFormData,
      tipoRegistroRecEval: 'Recuperación / Evaluación',
      versionRecEval: input.versionNumber,
      fechaRecEval:
        this.readStringValue(input.incomingFormData.fechaRecEval) ||
        input.recordedAt.toISOString().slice(0, 10),
      horaValoracionRecEval:
        this.readStringValue(input.incomingFormData.horaValoracionRecEval) ||
        input.recordedAt.toISOString().slice(11, 16),
      aldreteTotalRecEval:
        aldreteTotal === null ? '' : String(aldreteTotal),
      aldreteInterpretacionRecEval:
        aldreteTotal === null
          ? 'Aldrete pendiente de cálculo'
          : `Aldrete ${aldreteTotal}/10 — ${aldreteTotal >= 9 ? 'Cumple criterios de alta' : 'No cumple criterios de alta'}`,
      altaAldreteMayorIgual9RecEval:
        aldreteTotal === null
          ? Boolean(input.incomingFormData.altaAldreteMayorIgual9RecEval)
          : aldreteTotal >= 9,
      semaforoRecEval: hasRedAlert
        ? 'Rojo - crítico'
        : alerts.length > 0
          ? 'Amarillo - vigilancia'
          : 'Verde - normal',
      alertasAutomaticasRecEval:
        alerts.length > 0
          ? alerts.map((alert) => `${alert.severity}: ${alert.message}`).join('\n')
          : 'Sin alertas activas',
      profesionalNombreRecEval:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      profesionalCedulaRecEval:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      profesionalEspecialidadRecEval:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionRecEval:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      hashRecEval: documentHash,
      selloDigitalRecEval:
        this.readStringValue(input.currentMetadata.digitalSeal) ||
        `GIMEDIC-REC-EVAL-${String(input.versionNumber).padStart(3, '0')}-${documentHash.slice(0, 12)}`,
    };
  }

  private buildAmbulatoryDischargePrescriptionFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    prescriptionFolio: string;
    verificationCode: string;
    currentMetadata: Record<string, unknown>;
  }) {
    const alerts = this.buildAmbulatoryDischargePrescriptionValidations({
      encounter: input.encounter,
      formData: input.incomingFormData,
    });
    const hasRedAlert = alerts.some((alert) => alert.severity === 'ROJO');
    const hashSeed = JSON.stringify({
      encounterId: input.encounter.id,
      tabKey: 'Receta e indicaciones de egreso',
      versionNumber: input.versionNumber,
      prescriptionFolio: input.prescriptionFolio,
      formData: input.incomingFormData,
    });
    const documentHash =
      this.readStringValue(input.currentMetadata.documentHash) ||
      createHash('sha256').update(hashSeed).digest('hex');
    const qrActive = this.readStringValue(input.currentMetadata.qrActive) === 'true';

    return {
      ...input.incomingFormData,
      tipoRegistroRecetaEgreso: 'Receta e indicaciones de egreso',
      versionRecetaEgreso: input.versionNumber,
      folioRecetaEgreso: input.prescriptionFolio,
      fechaEmisionRecetaEgreso:
        this.readStringValue(input.incomingFormData.fechaEmisionRecetaEgreso) ||
        input.recordedAt.toISOString().slice(0, 10),
      vigenciaRecetaEgreso:
        this.readStringValue(input.incomingFormData.vigenciaRecetaEgreso) ||
        '7 días',
      institucionEmisoraRecetaEgreso:
        input.encounter.facility?.institutionName ??
        input.encounter.facility?.legalName ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      rfcMedicoRecetaEgreso:
        input.encounter.tenant.taxId || 'RFC no configurado',
      licenciaSanitariaRecetaEgreso:
        input.encounter.facility?.legalName ?? 'Licencia no configurada',
      qrVerificacionRecetaEgreso: qrActive
        ? `GIMEDIC-QR:${input.prescriptionFolio}:${input.verificationCode}`
        : 'Se activará al firmar',
      qrActivoRecetaEgreso: qrActive ? 'SI' : 'NO',
      alertasAlergiasRecetaEgreso:
        alerts
          .filter((alert) => alert.validationType === 'ALERGIA')
          .map((alert) => alert.message)
          .join('\n') || 'Sin alergias conflictivas detectadas automáticamente',
      validacionesMedicamentosRecetaEgreso:
        alerts.length > 0
          ? alerts.map((alert) => `${alert.severity}: ${alert.message}`).join('\n')
          : 'VERDE: sin problemas detectados',
      semaforoMedicamentosRecetaEgreso: hasRedAlert
        ? 'Rojo - bloqueo'
        : alerts.length > 0
          ? 'Amarillo - precaución'
          : 'Verde - sin problemas',
      profesionalNombreRecetaEgreso:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      profesionalCedulaRecetaEgreso:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      profesionalEspecialidadRecetaEgreso:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionRecetaEgreso:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      hashRecetaEgreso: documentHash,
      selloDigitalRecetaEgreso:
        this.readStringValue(input.currentMetadata.digitalSeal) ||
        `GIMEDIC-RECETA-EGRESO-${String(input.versionNumber).padStart(3, '0')}-${documentHash.slice(0, 12)}`,
    };
  }

  private buildAmbulatoryDischargeFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    currentMetadata: Record<string, unknown>;
  }) {
    const hashSeed = JSON.stringify({
      encounterId: input.encounter.id,
      tabKey: 'Egreso',
      versionNumber: input.versionNumber,
      formData: input.incomingFormData,
    });
    const documentHash =
      this.readStringValue(input.currentMetadata.documentHash) ||
      createHash('sha256').update(hashSeed).digest('hex');
    return {
      ...input.incomingFormData,
      tipoRegistroEgresoAmb: 'Egreso',
      versionEgresoAmb: input.versionNumber,
      fechaEgresoAmb:
        this.readStringValue(input.incomingFormData.fechaEgresoAmb) ||
        input.recordedAt.toISOString().slice(0, 10),
      horaEgresoAmb:
        this.readStringValue(input.incomingFormData.horaEgresoAmb) ||
        input.recordedAt.toISOString().slice(11, 16),
      alertaCierreEgresoAmb:
        'Al firmar esta nota de egreso, el episodio se marcará como cerrado, todo el expediente quedará en solo lectura, se generará sello digital y hash, y se registrará en auditoría.',
      medicoAutorizaEgresoAmb:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaAutorizaEgresoAmb:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      referenciaEstablecimientoEnviaEgresoAmb:
        input.encounter.facility?.name ?? input.encounter.tenant.name,
      referenciaMedicoEmisorEgresoAmb:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      profesionalNombreEgresoAmb:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      profesionalCedulaEgresoAmb:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      profesionalEspecialidadEgresoAmb:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionEgresoAmb:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      hashEgresoAmb: documentHash,
      selloDigitalEgresoAmb:
        this.readStringValue(input.currentMetadata.digitalSeal) ||
        `GIMEDIC-EGRESO-AMB-${String(input.versionNumber).padStart(3, '0')}-${documentHash.slice(0, 12)}`,
    };
  }

  private buildAmbulatoryDischargePrescriptionValidations(input: {
    encounter: TenantEncounterRecord;
    formData: Record<string, unknown>;
  }) {
    const medications = this.readObjectArray(input.formData.medicamentosRecetaEgreso);
    const normalizedNames = medications
      .map((item) => this.readStringValue(item.medicamento).toLowerCase().trim())
      .filter(Boolean);
    const allergyText = [
      input.encounter.allergies.map((allergy) => allergy.substance).join(', '),
      input.encounter.patient.allergiesNotes ?? '',
    ].join(' ').toLowerCase();
    const validations: Array<{
      severity: 'VERDE' | 'AMARILLO' | 'ROJO';
      validationType: string;
      message: string;
      blocking: boolean;
    }> = [];
    const duplicates = normalizedNames.filter(
      (name, index) => normalizedNames.indexOf(name) !== index,
    );
    if (duplicates.length > 0) {
      validations.push({
        severity: 'AMARILLO',
        validationType: 'DUPLICIDAD',
        message: `Duplicidad terapéutica posible: ${[...new Set(duplicates)].join(', ')}`,
        blocking: false,
      });
    }
    if (
      allergyText.includes('penic') &&
      normalizedNames.some((name) =>
        ['penicilina', 'amoxicilina', 'ampicilina'].some((keyword) =>
          name.includes(keyword),
        ),
      )
    ) {
      validations.push({
        severity: 'ROJO',
        validationType: 'ALERGIA',
        message: 'Alergia registrada a penicilinas y medicamento relacionado indicado.',
        blocking: true,
      });
    }
    if (
      normalizedNames.some((name) => name.includes('warfarina')) &&
      normalizedNames.some((name) => name.includes('ibuprofeno'))
    ) {
      validations.push({
        severity: 'ROJO',
        validationType: 'INTERACCION',
        message: 'Interacción grave: warfarina con ibuprofeno aumenta riesgo de sangrado.',
        blocking: true,
      });
    }

    return validations;
  }

  private calculateAldreteTotal(formData: Record<string, unknown>) {
    const values = [
      formData.aldreteActividadRecEval,
      formData.aldreteRespiracionRecEval,
      formData.aldreteCirculacionRecEval,
      formData.aldreteConcienciaRecEval,
      formData.aldreteSpo2RecEval,
    ].map((value) => this.readRoundedNumericValue(value));

    if (values.some((value) => value === null || value === undefined)) {
      return null;
    }

    return values.reduce<number>((total, value) => total + (value ?? 0), 0);
  }

  private buildAmbulatoryRecoveryEvaluationAlerts(
    formData: Record<string, unknown>,
    aldreteTotal = this.calculateAldreteTotal(formData),
  ) {
    const alerts: Array<{
      severity: 'VERDE' | 'AMARILLO' | 'ROJO';
      code: string;
      message: string;
      sourceMetric: string;
    }> = [];
    const systolic = this.readRoundedNumericValue(formData.taSistolicaRecEval);
    const diastolic = this.readRoundedNumericValue(formData.taDiastolicaRecEval);
    const heartRate = this.readRoundedNumericValue(formData.fcRecEval);
    const spo2 = this.readNumericValue(formData.spo2RecEval);
    const temperature = this.readNumericValue(formData.temperaturaRecEval);
    const painEva = this.readRoundedNumericValue(formData.dolorEvaRecEval);
    const glasgow = this.readRoundedNumericValue(formData.glasgowRecEval);

    if (spo2 !== null && spo2 < 92) {
      alerts.push({
        severity: 'ROJO',
        code: 'SPO2_LOW',
        message: 'SpO2 < 92%: bloqueo de alta.',
        sourceMetric: 'spo2RecEval',
      });
    }
    if (
      (systolic !== null && (systolic < 90 || systolic > 180)) ||
      (diastolic !== null && (diastolic < 50 || diastolic > 110))
    ) {
      alerts.push({
        severity: 'ROJO',
        code: 'BLOOD_PRESSURE_UNSAFE',
        message: 'Tensión arterial fuera de rango seguro.',
        sourceMetric: 'taRecEval',
      });
    }
    if (painEva !== null && painEva > 6) {
      alerts.push({
        severity: 'AMARILLO',
        code: 'PAIN_HIGH',
        message: 'Dolor EVA > 6: continuar vigilancia.',
        sourceMetric: 'dolorEvaRecEval',
      });
    }
    if (glasgow !== null && glasgow < 15) {
      alerts.push({
        severity: 'ROJO',
        code: 'GLASGOW_LOW',
        message: 'Glasgow < 15: no permitir alta.',
        sourceMetric: 'glasgowRecEval',
      });
    }
    if (heartRate !== null && (heartRate < 50 || heartRate > 120)) {
      alerts.push({
        severity: 'AMARILLO',
        code: 'HEART_RATE_WATCH',
        message: 'FC fuera de rango de vigilancia.',
        sourceMetric: 'fcRecEval',
      });
    }
    if (temperature !== null && (temperature < 35.5 || temperature >= 38)) {
      alerts.push({
        severity: 'AMARILLO',
        code: 'TEMPERATURE_WATCH',
        message: 'Temperatura fuera de rango esperado.',
        sourceMetric: 'temperaturaRecEval',
      });
    }
    if (aldreteTotal !== null && aldreteTotal < 9) {
      alerts.push({
        severity: 'AMARILLO',
        code: 'ALDRETE_LOW',
        message: 'Aldrete < 9: continuar vigilancia.',
        sourceMetric: 'aldreteTotalRecEval',
      });
    }

    return alerts;
  }

  private buildAmbulatoryPreprocedureFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    versionNumber: number;
    currentMetadata: Record<string, unknown>;
  }) {
    const weight = this.readNumericValue(input.incomingFormData.pesoKgPreproc);
    const height = this.readNumericValue(input.incomingFormData.tallaCmPreproc);
    const heightMeters = height ? height / 100 : null;
    const imc =
      weight && heightMeters && heightMeters > 0
        ? Number((weight / (heightMeters * heightMeters)).toFixed(1))
        : null;
    const anesthesiaType = this.readStringValue(
      input.incomingFormData.tipoAnestesiaPrevistaPreproc,
    );
    const hasAnesthesia = anesthesiaType !== '' && anesthesiaType !== 'NO_APLICA';
    const alerts = this.buildAmbulatoryPreprocedureAlerts(input.incomingFormData);
    const hashSeed = JSON.stringify({
      encounterId: input.encounter.id,
      tabKey: 'Valoración preprocedimiento',
      versionNumber: input.versionNumber,
      recordedAt: input.recordedAt.toISOString(),
      formData: input.incomingFormData,
    });
    const documentHash =
      this.readStringValue(input.currentMetadata.documentHash) ||
      createHash('sha256').update(hashSeed).digest('hex');

    return {
      ...input.incomingFormData,
      tipoRegistroPreproc: 'Valoración preprocedimiento',
      tituloDocumentoConsentimientoPreproc: 'Consentimiento informado NOM-004',
      versionPreproc: input.versionNumber,
      imcPreproc: imc !== null ? String(imc) : '',
      institucionConsentimientoPreproc:
        this.readStringValue(input.incomingFormData.institucionConsentimientoPreproc) ||
        input.encounter.tenant.name,
      razonSocialConsentimientoPreproc:
        this.readStringValue(input.incomingFormData.razonSocialConsentimientoPreproc) ||
        input.encounter.tenant.legalName ||
        input.encounter.tenant.name,
      lugarFechaConsentimientoPreproc:
        this.readStringValue(input.incomingFormData.lugarFechaConsentimientoPreproc) ||
        `${input.encounter.facility?.name ?? input.encounter.tenant.name} · ${input.recordedAt.toISOString().slice(0, 10)}`,
      consentimientoAnestesicoPreproc: hasAnesthesia
        ? this.readStringValue(input.incomingFormData.consentimientoAnestesicoPreproc)
        : 'NO_APLICA',
      profesionalNombrePreproc:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      profesionalCedulaPreproc:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      profesionalEspecialidadPreproc:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionPreproc:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
      alertasClinicasPreproc:
        alerts.length > 0 ? alerts.join('\n') : 'Sin alertas críticas',
      hashPreproc: documentHash,
      selloDigitalPreproc:
        this.readStringValue(input.currentMetadata.digitalSeal) ||
        `GIMEDIC-PREPROC-${String(input.versionNumber).padStart(3, '0')}-${documentHash.slice(0, 12)}`,
    };
  }

  private buildAmbulatoryPreprocedureAlerts(formData: Record<string, unknown>) {
    return [
      ['ASA_III', 'ASA_IV', 'ASA_V'].includes(
        this.readStringValue(formData.clasificacionAsaPreproc),
      )
        ? 'ASA alto: requiere revisión de factibilidad ambulatoria.'
        : '',
      this.readStringValue(formData.riesgoQuirurgicoPreproc) === 'ALTO'
        ? 'Riesgo quirúrgico alto.'
        : '',
      this.readStringValue(formData.riesgoCardiovascularPreproc) === 'ALTO'
        ? 'Riesgo cardiovascular alto.'
        : '',
      this.readStringValue(formData.riesgoTromboembolicoCapriniPreproc) === 'ALTO'
        ? 'Riesgo tromboembólico alto.'
        : '',
      this.readStringValue(formData.ayunoConfirmadoPreproc) === 'NO'
        ? 'Ayuno no confirmado.'
        : '',
      Boolean(formData.antAlergiasMedicamentosasPreproc) &&
      this.hasCapturedValue(formData.atbProfilacticoPreproc)
        ? 'Verificar alergias antes de ATB profiláctico.'
        : '',
    ].filter((alert) => alert.length > 0);
  }

  private buildHospitalSurgicalDocumentFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    noteType: string;
    versionNumber: number;
    currentMetadata: Record<string, unknown>;
  }) {
    const subdocumentType =
      this.resolveHospitalSurgicalSubdocumentType(input.noteType) ||
      this.resolveHospitalSurgicalSubdocumentType(
        this.readStringValue(input.incomingFormData.tipoSubdocumentoQuirurgico),
      ) ||
      'Nota preoperatoria';
    const folio =
      this.readStringValue(input.incomingFormData.folioDocumentoQuirurgico) ||
      this.readStringValue(input.currentMetadata.folio) ||
      `${input.encounter.encounterNumber}-QX-${String(input.versionNumber).padStart(3, '0')}`;
    const documentHash =
      this.readStringValue(input.incomingFormData.hashDocumentoQuirurgico) ||
      this.readStringValue(input.currentMetadata.documentHash) ||
      randomUUID().replace(/-/g, '').toUpperCase();
    const digitalSeal =
      this.readStringValue(input.incomingFormData.selloDigitalQuirurgico) ||
      this.readStringValue(input.currentMetadata.digitalSeal) ||
      randomUUID().replace(/-/g, '').slice(0, 24).toUpperCase();
    const surgeryDuration = this.calculateTimeSpanMinutes(
      this.readStringValue(input.incomingFormData.horaInicioCirugiaPostop),
      this.readStringValue(input.incomingFormData.horaFinCirugiaPostop),
    );
    const patient = input.encounter.patient;

    return {
      ...input.incomingFormData,
      tipoRegistro: 'Procedimientos y cirugía',
      tipoSubdocumentoQuirurgico: subdocumentType,
      folioDocumentoQuirurgico: folio,
      versionDocumentoQuirurgico: String(input.versionNumber),
      estadoDocumentoQuirurgico: 'BORRADOR',
      progresoQuirurgicoGlobal:
        this.readStringValue(input.incomingFormData.progresoQuirurgicoGlobal) ||
        'Procedimiento incompleto',
      hashDocumentoQuirurgico: documentHash,
      selloDigitalQuirurgico: digitalSeal,
      pacienteDocumentoQuirurgico: patient.fullName,
      curpDocumentoQuirurgico: patient.curp ?? 'CURP no registrada',
      expedienteDocumentoQuirurgico:
        input.encounter.medicalRecord?.recordNumber ?? 'Expediente no configurado',
      folioEpisodioDocumentoQuirurgico: input.encounter.encounterNumber,
      tipoEpisodioDocumentoQuirurgico: 'Hospitalización',
      servicioDocumentoQuirurgico:
        input.encounter.serviceArea?.name ??
        input.encounter.specialty?.name ??
        'Servicio no configurado',
      medicoResponsableDocumentoQuirurgico:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      fechaHoraDocumentoQuirurgico: input.recordedAt.toISOString(),
      idDocumentoQuirurgico: folio,
      usuarioCreadorDocumentoQuirurgico:
        input.responsibleUser?.fullName ?? 'Usuario no identificado',
      ipDocumentoQuirurgico:
        this.readStringValue(input.incomingFormData.ipDocumentoQuirurgico) ||
        'IP no capturada',
      duracionCirugiaPostop:
        surgeryDuration === null ? '' : String(surgeryDuration),
      medicoQuirLegal:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaQuirLegal:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadQuirLegal: input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionQuirLegal:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
    };
  }

  private buildHospitalNursingShiftFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
    noteType: string;
  }) {
    const shiftType =
      this.resolveHospitalNursingShiftType(input.noteType) ||
      this.resolveHospitalNursingShiftType(
        this.readStringValue(input.incomingFormData.turnoEnfermeriaHosp),
      ) ||
      'Turno Matutino';
    const intake = this.readNumericValue(input.incomingFormData.ingresosMlEnfHosp);
    const output = this.readNumericValue(input.incomingFormData.egresosMlEnfHosp);
    const balance = intake !== null || output !== null ? (intake ?? 0) - (output ?? 0) : null;
    const nurseName =
      input.responsibleUser?.fullName ?? 'Sin profesional responsable';

    return {
      ...input.incomingFormData,
      tipoRegistro: 'Enfermería',
      turnoEnfermeriaHosp: shiftType,
      estadoTurnoEnfermeriaHosp:
        this.readStringValue(input.incomingFormData.estadoTurnoEnfermeriaHosp) ||
        'BORRADOR',
      balanceTotalEnfHosp: balance === null ? '' : String(balance),
      medicamentosMinistradosEnfHosp: this
        .readObjectArray(input.incomingFormData.medicamentosMinistradosEnfHosp)
        .map((medication) => ({
          ...medication,
          enfermeria:
            this.readStringValue(medication.enfermeria) || nurseName,
        })),
      procedimientosEnfermeriaTurnoHosp: this
        .readObjectArray(input.incomingFormData.procedimientosEnfermeriaTurnoHosp)
        .map((procedure) => ({
          ...procedure,
          realizadoPor:
            this.readStringValue(procedure.realizadoPor) || nurseName,
        })),
      profesionalEnfermeriaLegal: nurseName,
      cedulaEnfermeriaLegal:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadEnfermeriaLegal:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionEnfermeriaLegal:
        input.encounter.facility?.name ??
        input.encounter.tenant.legalName ??
        input.encounter.tenant.name,
    };
  }

  private buildHospitalDischargeFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const admission = this.normalizeJsonObject(
      this.findLatestHospitalRecordFormData(input.encounter, 'Ingreso'),
    );
    const evolution = this.normalizeJsonObject(
      this.findLatestHospitalRecordFormData(input.encounter, 'Evolución'),
    );
    const orders = this.normalizeJsonObject(
      this.findLatestHospitalRecordFormData(input.encounter, 'Indicaciones médicas'),
    );
    const procedure = this.normalizeJsonObject(
      this.findLatestHospitalRecordFormData(input.encounter, 'Procedimientos / Cirugía'),
    );
    const consultation = this.normalizeJsonObject(
      this.findLatestHospitalRecordFormData(input.encounter, 'Interconsultas'),
    );
    const dischargeAt =
      this.readStringValue(input.incomingFormData.fechaHoraEgresoHosp) ||
      input.recordedAt.toISOString().slice(0, 16);
    const admittedAtValue =
      this.readStringValue(input.incomingFormData.fechaIngresoReadonlyHosp) ||
      [
        this.readStringValue(admission.fechaIngresoHosp),
        this.readStringValue(admission.horaIngresoHosp),
      ]
        .filter(Boolean)
        .join('T');
    const admittedAt = this.parseOptionalDate(admittedAtValue);
    const dischargedAt = this.parseOptionalDate(dischargeAt);
    const stayDays =
      admittedAt && dischargedAt && dischargedAt >= admittedAt
        ? Math.max(
            1,
            Math.ceil(
              (dischargedAt.getTime() - admittedAt.getTime()) / 86_400_000,
            ),
          )
        : null;
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoRegistro: 'Egreso',
      fechaHoraEgresoHosp: dischargeAt,
      fechaIngresoReadonlyHosp: admittedAtValue,
      diasEstanciaHosp: stayDays === null ? '' : String(stayDays),
      alertaCierreEgresoHosp:
        'Al firmar esta nota de egreso, el episodio se cerrará y el expediente quedará en modo solo lectura.',
      medicoResponsableEgresoHosp:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaResponsableEgresoHosp:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      medicoLegalEgresoHosp:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaLegalEgresoHosp:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadLegalEgresoHosp:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionEgresoHosp:
        [input.encounter.facility?.name, input.encounter.serviceArea?.name]
          .filter(Boolean)
          .join(' · ') || 'Lugar no configurado',
    };

    const suggestions: Record<string, unknown> = {
      motivoIngresoEgresoHosp:
        this.readStringValue(admission.motivoIngresoClinicoHosp) ||
        input.encounter.reasonForVisit,
      diagnosticoIngresoEgresoHosp:
        this.readStringValue(admission.diagnosticoPrincipalHosp),
      diagnosticoFinalEgresoHosp:
        this.readStringValue(evolution.diagnosticosActivosEvolHosp) ||
        this.readStringValue(admission.diagnosticoPrincipalHosp),
      cie10EgresoHosp:
        this.readStringValue(evolution.cie10EvolucionHosp) ||
        this.readStringValue(admission.cie10Hosp),
      procedimientosRealizadosEstanciaHosp:
        this.readStringValue(procedure.procedimientoRealizadoPostopHosp) ||
        this.readStringValue(admission.procedimientosPlanHosp),
      manejoRealizadoEgresoHosp:
        this.readStringValue(orders.medicamentosIndicacionesHosp) ||
        this.readStringValue(admission.medicamentosPlanHosp),
      evolucionEstanciaEgresoHosp:
        this.readStringValue(evolution.interpretacionClinicaEvolHosp) ||
        this.readStringValue(evolution.justificacionNom004EvolHosp),
      problemasPendientesEgresoHosp:
        this.readStringValue(evolution.cambiosClinicosEvolHosp),
      resumenNarrativoEgresoHosp:
        this.readStringValue(consultation.impresionDiagnosticaInterHosp),
      medicamentosEgresoHosp:
        this.summarizeHospitalOrderMedications(orders.medicamentosIndicacionesHosp),
      dietaEgresoHosp:
        this.readStringValue(orders.dietaIndicacionesHosp) ||
        this.readStringValue(admission.dietaInicialHosp),
      actividadRestriccionesEgresoHosp:
        this.readStringValue(orders.reposoActividadIndicacionesHosp),
      seguimientoEgresoHosp:
        this.readStringValue(evolution.seguimientoEvolHosp) ||
        this.readStringValue(consultation.sugerenciasTerapeuticasInterHosp),
      signosAlarmaEgresoHosp:
        'Acudir a urgencias ante fiebre persistente, dolor intenso, dificultad respiratoria, sangrado, deterioro neurológico o empeoramiento del estado general.',
      educacionOtorgadaEgresoHosp:
        'Se explica diagnóstico, tratamiento, medicamentos, cuidados, restricciones, signos de alarma y seguimiento.',
      comprensionPacienteEgresoHosp: 'ADECUADA',
    };

    for (const [fieldKey, value] of Object.entries(suggestions)) {
      if (!this.hasCapturedValue(baseFormData[fieldKey]) && this.hasCapturedValue(value)) {
        baseFormData[fieldKey] = value;
      }
    }

    if (this.readStringValue(baseFormData.tipoEgresoHosp) === 'ALTA_MEDICA') {
      baseFormData.destinoPacienteEgresoHosp =
        this.readStringValue(baseFormData.destinoPacienteEgresoHosp) || 'DOMICILIO';
    }

    return baseFormData;
  }

  private findLatestHospitalRecordFormData(
    encounter: TenantEncounterRecord,
    tabKey: string,
  ) {
    return [...encounter.sectionRecords]
      .filter((record) => record.tabKey === tabKey)
      .sort((left, right) => right.recordedAt.getTime() - left.recordedAt.getTime())[0]
      ?.formDataJson ?? null;
  }

  private summarizeHospitalOrderMedications(rawValue: unknown) {
    return this.readObjectArray(rawValue)
      .map((item) =>
        [
          this.readStringValue(item.medicamento),
          this.readStringValue(item.dosis),
          this.readStringValue(item.via),
          this.readStringValue(item.frecuencia),
          this.readStringValue(item.duracion),
        ]
          .filter(Boolean)
          .join(' '),
      )
      .filter(Boolean)
      .join('\n');
  }

  private resolveHospitalNursingShiftType(noteType: string) {
    return ['Turno Matutino', 'Turno Vespertino', 'Turno Nocturno'].find(
      (allowedType) => allowedType === noteType,
    );
  }

  private resolveHospitalSurgicalSubdocumentType(noteType: string) {
    return [
      'Nota preoperatoria',
      'Nota preanestésica',
      'Nota postoperatoria',
      'Nota postanestésica',
    ].find((allowedType) => allowedType === noteType);
  }

  private calculateTimeSpanMinutes(startTime: string, endTime: string) {
    if (!startTime || !endTime) {
      return null;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return null;
    }

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return end >= start ? end - start : end + 24 * 60 - start;
  }

  private calculateHospitalConsultationSlaMinutes(priority: string) {
    if (priority === 'URGENTE') {
      return 60;
    }

    if (priority === 'PREFERENTE') {
      return 240;
    }

    return 1440;
  }

  private calculateHospitalConsultationElapsedMinutes(
    requestDate: string,
    requestTime: string,
    responseDate: string,
    responseTime: string,
  ) {
    const requestedAt = this.parseOptionalDate(`${requestDate}T${requestTime}`);
    const respondedAt = this.parseOptionalDate(`${responseDate}T${responseTime}`);

    if (!requestedAt || !respondedAt || respondedAt < requestedAt) {
      return null;
    }

    return Math.round((respondedAt.getTime() - requestedAt.getTime()) / 60000);
  }

  private resolveHospitalConsultationStatus(formData: Record<string, unknown>) {
    if (this.hasCapturedValue(formData.fechaCierreInterHosp)) {
      return 'CERRADA';
    }

    if (
      this.hasCapturedValue(formData.impresionDiagnosticaInterHosp) ||
      this.hasCapturedValue(formData.sugerenciasTerapeuticasInterHosp) ||
      this.hasCapturedValue(formData.resultadoInterconsultaHosp)
    ) {
      return 'RESPONDIDA';
    }

    if (this.hasCapturedValue(formData.requestSignedAtInterHosp)) {
      return 'SOLICITADA';
    }

    return 'BORRADOR';
  }

  private inferStudyTargetModule(studyType: string) {
    const normalizedStudyType = studyType.toLowerCase();

    if (
      normalizedStudyType.includes('imagen') ||
      normalizedStudyType.includes('rx') ||
      normalizedStudyType.includes('tac') ||
      normalizedStudyType.includes('ultrasonido') ||
      normalizedStudyType.includes('resonancia')
    ) {
      return 'IMAGEN';
    }

    return 'LABORATORIO';
  }

  private buildHospitalOrderTraceRows(formData: Record<string, unknown>) {
    const executorUserLabel =
      this.readStringValue(formData.usuarioEjecutorHosp) ||
      'Pendiente de asignación por enfermería';
    const executionTime = this.parseOptionalDate(formData.horaEjecucionIndicacionesHosp);
    const rows: Array<{
      orderLabel: string;
      responsibleArea: string;
      status: string;
      executorUserLabel: string;
      executionTime: Date | null;
      sourceType: string;
    }> = [];

    this.readObjectArray(formData.medicamentosIndicacionesHosp).forEach((item) => {
      const medicationName = this.readStringValue(item.medicamento);
      if (medicationName) {
        rows.push({
          orderLabel: medicationName,
          responsibleArea: 'Farmacia / Enfermería',
          status: 'PENDIENTE',
          executorUserLabel,
          executionTime,
          sourceType: 'MEDICAMENTO',
        });
      }
    });
    this.readObjectArray(formData.solucionesIvIndicacionesHosp).forEach((item) => {
      const solutionType = this.readStringValue(item.tipoSolucion);
      if (solutionType) {
        rows.push({
          orderLabel: solutionType,
          responsibleArea: 'Enfermería',
          status: 'PENDIENTE',
          executorUserLabel,
          executionTime,
          sourceType: 'SOLUCION_IV',
        });
      }
    });
    this.readObjectArray(formData.estudiosSolicitadosIndicacionesHosp).forEach((item) => {
      const studyType = this.readStringValue(item.tipoEstudio);
      if (studyType) {
        rows.push({
          orderLabel: studyType,
          responsibleArea: this.inferStudyTargetModule(studyType),
          status: 'PENDIENTE',
          executorUserLabel,
          executionTime,
          sourceType: 'ESTUDIO',
        });
      }
    });
    this.readObjectArray(formData.interconsultasSolicitadasIndicacionesHosp).forEach(
      (item) => {
        const serviceName = this.readStringValue(item.servicio);
        if (serviceName) {
          rows.push({
            orderLabel: serviceName,
            responsibleArea: 'Interconsulta',
            status: 'PENDIENTE',
            executorUserLabel,
            executionTime,
            sourceType: 'INTERCONSULTA',
          });
        }
      },
    );

    return rows;
  }

  private buildEmergencyTriageFormData(input: {
    incomingFormData: Record<string, unknown>;
    recordedAt: Date;
    responsibleUser: (Partial<TriageResponsibleUser> & {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    }) | null;
  }) {
    const cleanIncomingFormData = { ...input.incomingFormData };
    delete cleanIncomingFormData.tipoRegistro;
    delete cleanIncomingFormData.tipoTriage;
    delete cleanIncomingFormData.responsableTriage;
    delete cleanIncomingFormData.procedenciaAdministrativa;
    if (cleanIncomingFormData.discAlteracionConciencia === true) {
      cleanIncomingFormData.discEstadoMentalAlterado = true;
    }
    delete cleanIncomingFormData.discAlteracionConciencia;
    delete cleanIncomingFormData.reevaluacion;
    if (cleanIncomingFormData.discOtro !== true) {
      cleanIncomingFormData[triageOtherClinicalDiscriminatorFieldKey] = '';
    }
    if (
      cleanIncomingFormData.discOtro === true &&
      this.readStringValue(
        cleanIncomingFormData[triageOtherClinicalDiscriminatorFieldKey],
      ).trim().length === 0
    ) {
      throw new BadRequestException(
        'Especifica el otro discriminador clínico seleccionado',
      );
    }

    const baseFormData: Record<string, unknown> = {
      ...cleanIncomingFormData,
      tipoTriaje: emergencyInitialTriageType,
      ...this.buildEmergencyTriageResponsibleSnapshot(
        input.responsibleUser,
        input.recordedAt,
      ),
      triageLegalMedico:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      triageLegalCedula: input.responsibleUser?.professionalLicense ?? 'Sin cédula',
    };
    this.assertEmergencyTriageClinicalQuickState(baseFormData);
    this.normalizeAndAssertEmergencyTriageDestination(baseFormData);
    this.normalizeAndAssertEmergencyTriageOrigin(baseFormData);
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
      banderaRojaAutomatica: this.hasSelectedTriageClinicalDiscriminator(
        baseFormData,
      )
        ? 'Sí'
        : 'No',
      alertasAutomaticas: alertasAutomaticas.join('\n'),
    };
  }

  private hasSelectedTriageClinicalDiscriminator(formData: Record<string, unknown>) {
    return triageClinicalDiscriminatorFields.some(({ key }) => formData[key] === true);
  }

  private assertEmergencyTriageClinicalQuickState(formData: Record<string, unknown>) {
    const missingFields = emergencyTriageClinicalQuickStateFields
      .filter(({ key }) => !this.hasCapturedValue(formData[key]))
      .map(({ label }) => label);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Completa Estado clínico rápido: ${missingFields.join(', ')}.`,
      );
    }

    const invalidFields = emergencyTriageClinicalQuickStateFields
      .filter(({ key, allowedValues }) => {
        const value = this.readStringValue(formData[key]);
        return !allowedValues.some((allowedValue) => allowedValue === value);
      })
      .map(({ label }) => label);

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Estado clínico rápido contiene valores no permitidos: ${invalidFields.join(
          ', ',
        )}.`,
      );
    }
  }

  private inferEmergencyTriageResponsibleType(
    responsibleUser:
      | (Partial<TriageResponsibleUser> & {
          id: string;
          fullName: string;
          professionalLicense: string | null;
        })
      | null,
  ) {
    const roleText = (responsibleUser?.roles ?? [])
      .map((assignment) => `${assignment.role.code} ${assignment.role.name}`.toLowerCase())
      .join(' ');

    if (roleText.includes('paramed')) return 'Paramédico';
    if (roleText.includes('enferm') || roleText.includes('nurse')) return 'Enfermería';
    if (
      roleText.includes('medic') ||
      roleText.includes('physician') ||
      roleText.includes('doctor')
    ) {
      return 'Médico';
    }

    return 'Médico';
  }

  private resolveEmergencyTriageResponsibleShift(recordedAt: Date) {
    const hour = recordedAt.getHours();

    if (hour >= 6 && hour < 14) return 'Matutino';
    if (hour >= 14 && hour < 22) return 'Vespertino';
    return 'Nocturno';
  }

  private buildEmergencyTriageResponsibleSnapshot(
    responsibleUser:
      | (Partial<TriageResponsibleUser> & {
          id: string;
          fullName: string;
          professionalLicense: string | null;
        })
      | null,
    recordedAt: Date,
  ) {
    return {
      triageResponsableUserId: responsibleUser?.id ?? '',
      triageResponsableNombre:
        responsibleUser?.fullName ?? 'Sin profesional responsable',
      triageResponsableCedula:
        responsibleUser?.professionalLicense ?? 'Sin cédula',
      triageResponsableTipo:
        this.inferEmergencyTriageResponsibleType(responsibleUser),
      triageResponsableTurno:
        this.resolveEmergencyTriageResponsibleShift(recordedAt),
      triageResponsableArea: 'Urgencias — Triaje',
    };
  }

  private normalizeAndAssertEmergencyTriageDestination(
    formData: Record<string, unknown>,
  ) {
    const destinoInicial = this.readStringValue(formData.destinoInicial);
    if (
      !emergencyTriageDestinationAllowedValues.some(
        (allowedValue) => allowedValue === destinoInicial,
      )
    ) {
      throw new BadRequestException('Selecciona un destino inicial válido');
    }

    const requiereReevaluacion = this.readStringValue(
      formData.requiereReevaluacion,
    );
    if (
      !emergencyTriageReevaluationRequiredValues.some(
        (allowedValue) => allowedValue === requiereReevaluacion,
      )
    ) {
      throw new BadRequestException('Indica si el paciente requiere reevaluación');
    }

    if (requiereReevaluacion !== 'SI') {
      for (const fieldKey of emergencyTriageReevaluationFieldKeys) {
        formData[fieldKey] = '';
      }
      return;
    }

    const horaReevaluacion = this.readStringValue(formData.horaReevaluacion);
    const nuevaPrioridad = this.readStringValue(
      formData.nuevaPrioridadReevaluacion,
    );
    const motivoCambio = this.readStringValue(formData.motivoCambioReevaluacion);

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horaReevaluacion)) {
      throw new BadRequestException('Captura una hora de reevaluación válida');
    }

    if (
      !emergencyTriageReevaluationPriorityAllowedValues.some(
        (allowedValue) => allowedValue === nuevaPrioridad,
      )
    ) {
      throw new BadRequestException('Selecciona una nueva prioridad válida');
    }

    if (!motivoCambio) {
      throw new BadRequestException('Captura el motivo del cambio de reevaluación');
    }
  }

  private normalizeAndAssertEmergencyTriageOrigin(formData: Record<string, unknown>) {
    const procedencia = this.readStringValue(formData.procedenciaIngreso);
    if (
      !emergencyTriageOriginAllowedValues.some(
        (allowedValue) => allowedValue === procedencia,
      )
    ) {
      throw new BadRequestException('Selecciona una procedencia válida');
    }

    const ingresoPorReferencia = this.readStringValue(
      formData.ingresoPorReferencia,
    );
    if (
      !emergencyTriageReferenceAdmissionValues.some(
        (allowedValue) => allowedValue === ingresoPorReferencia,
      )
    ) {
      throw new BadRequestException('Indica si el ingreso es por referencia');
    }

    if (ingresoPorReferencia !== 'SI') {
      for (const fieldKey of emergencyTriageReferenceFieldKeys) {
        formData[fieldKey] = '';
      }
    } else if (!this.readStringValue(formData.unidadQueRefiere)) {
      throw new BadRequestException('Captura la unidad que refiere');
    }

    const parentesco = this.readStringValue(formData.parentescoAcompanante);
    if (
      parentesco &&
      !emergencyTriageCompanionRelationshipAllowedValues.some(
        (allowedValue) => allowedValue === parentesco,
      )
    ) {
      throw new BadRequestException(
        'Selecciona un parentesco válido para el acompañante',
      );
    }

    if (parentesco === 'NINGUNO') {
      formData.telefonoAcompanante = '';
    }

    const telefono = this.readStringValue(formData.telefonoAcompanante);
    if (telefono && !/^[0-9+\-\s()]{7,20}$/.test(telefono)) {
      throw new BadRequestException('Captura un teléfono de acompañante válido');
    }
  }

  private calculateAdmissionAssessmentTime(openedAt: Date, recordedAt: Date) {
    if (recordedAt < openedAt) {
      return '';
    }

    return `${Math.round((recordedAt.getTime() - openedAt.getTime()) / 60000)} min`;
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

  private buildEmergencyDischargeFormData(input: {
    encounter: TenantEncounterRecord;
    incomingFormData: Record<string, unknown>;
    triageFormDataJson: Prisma.JsonValue | null;
    initialNoteFormDataJson: Prisma.JsonValue | null;
    evolutionFormDataJson: Prisma.JsonValue | null;
    ordersFormDataJson: Prisma.JsonValue | null;
    consultationFormDataJson: Prisma.JsonValue | null;
    recordedAt: Date;
    responsibleUser: {
      id: string;
      fullName: string;
      professionalLicense: string | null;
    } | null;
  }) {
    const triage = this.normalizeJsonObject(input.triageFormDataJson);
    const initialNote = this.normalizeJsonObject(input.initialNoteFormDataJson);
    const evolution = this.normalizeJsonObject(input.evolutionFormDataJson);
    const orders = this.normalizeJsonObject(input.ordersFormDataJson);
    const consultation = this.normalizeJsonObject(input.consultationFormDataJson);
    const baseFormData: Record<string, unknown> = {
      ...input.incomingFormData,
      tipoRegistro: 'Egreso de urgencias',
      fechaHoraEgresoUrg:
        this.readStringValue(input.incomingFormData.fechaHoraEgresoUrg) ||
        input.recordedAt.toISOString().slice(0, 16),
      medicoResponsableEgresoUrg:
        input.responsibleUser?.fullName ?? 'Sin profesional responsable',
      cedulaResponsableEgresoUrg:
        input.responsibleUser?.professionalLicense ?? 'Sin cédula',
      especialidadResponsableEgresoUrg:
        input.encounter.specialty?.name ?? 'Sin especialidad',
      lugarAtencionEgresoUrg:
        [input.encounter.facility?.name, input.encounter.serviceArea?.name]
          .filter(Boolean)
          .join(' · ') || 'Lugar no configurado',
    };

    const fieldSuggestions: Record<string, unknown> = {
      motivoIngresoEgresoUrg:
        this.readStringValue(triage.motivoPrincipal) ||
        this.readStringValue(initialNote.motivoAtencion),
      diagnosticoEgresoUrg:
        this.readStringValue(evolution.diagnosticoEvolucionUrg) ||
        this.readStringValue(initialNote.diagnosticoNota),
      cie10EgresoUrg:
        this.readStringValue(evolution.cie10EvolucionUrg) ||
        this.readStringValue(initialNote.cie10Nota),
      manejoUrgenciasEgresoUrg:
        this.readStringValue(orders.estadoOrdenesTrazabilidad) ||
        this.readStringValue(orders.medicamentosOrdenesUrg),
      procedimientosRealizadosEgresoUrg:
        this.readStringValue(evolution.procedimientosEvolucionUrg) ||
        this.readStringValue(initialNote.procedimientosNota),
      evolucionEstanciaEgresoUrg:
        this.readStringValue(evolution.justificacionClinicaNom004) ||
        this.readStringValue(evolution.referenciaPacienteUrg),
      medicamentosEgresoUrg:
        this.summarizeEmergencyOrderMedications(orders.medicamentosOrdenesUrg),
      cuidadosGeneralesEgresoUrg:
        this.readStringValue(orders.monitoreoOrdenes) ||
        this.readStringValue(evolution.seguimientoEvolUrg),
      dietaEgresoUrg: this.readStringValue(orders.dietaOrdenes),
      seguimientoEgresoUrg:
        this.readStringValue(evolution.seguimientoEvolUrg) ||
        this.readStringValue(consultation.seguimientoRecomendado),
      signosAlarmaEgresoUrg:
        'Regresar a Urgencias ante fiebre persistente, dolor intenso, dificultad respiratoria, deterioro neurológico, sangrado, vómito incoercible o empeoramiento del estado general.',
      recetaAsociadaEgresoUrg:
        this.readStringValue(input.incomingFormData.recetaAsociadaEgresoUrg) ||
        'Sin receta vinculada en este módulo',
      educacionOtorgadaEgresoUrg:
        'Se explica diagnóstico, tratamiento recibido, indicaciones, datos de alarma y plan de seguimiento.',
      comprensionPacienteEgresoUrg: 'ADECUADA',
      unidadOrigenTrasladoUrg: input.encounter.facility?.name ?? '',
      unidadDestinoTrasladoUrg: this.readStringValue(baseFormData.destinoEgresoUrg),
      resumenTrasladoUrg:
        this.readStringValue(evolution.justificacionClinicaNom004) ||
        this.readStringValue(initialNote.resumenPronostico),
      diagnosticoTrasladoUrg:
        this.readStringValue(evolution.diagnosticoEvolucionUrg) ||
        this.readStringValue(initialNote.diagnosticoNota),
      tratamientoPrevioTrasladoUrg:
        this.readStringValue(orders.estadoOrdenesTrazabilidad),
      medicoReceptorTrasladoUrg: this.readStringValue(baseFormData.medicoReceptorUrg),
    };

    for (const [fieldKey, value] of Object.entries(fieldSuggestions)) {
      if (
        !this.hasCapturedValue(baseFormData[fieldKey]) &&
        this.hasCapturedValue(value)
      ) {
        baseFormData[fieldKey] = value;
      }
    }

    if (this.readStringValue(baseFormData.tipoEgresoUrg) === 'ALTA_DOMICILIO') {
      baseFormData.destinoEgresoUrg =
        this.readStringValue(baseFormData.destinoEgresoUrg) || 'DOMICILIO';
    }

    return baseFormData;
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

  private summarizeEmergencyOrderMedications(value: unknown) {
    const medications = this.normalizeObjectArray(value);

    return medications
      .map((item) =>
        [
          this.readStringValue(item.medicamento),
          this.readStringValue(item.dosis),
          this.readStringValue(item.via),
          this.readStringValue(item.frecuencia),
          this.readStringValue(item.duracion),
        ]
          .filter(Boolean)
          .join(' · '),
      )
      .filter(Boolean)
      .join('\n');
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

  private async syncConsultationHistoryPriorStudies(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (
      !this.isConsultationHistoryRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const studies = this.normalizeConsultationHistoryPriorStudiesFormData(
      input.formData.estudiosPreviosRegistrados,
    );

    await this.prisma.$executeRaw`
      DELETE FROM "ConsultationHistoryPriorStudy"
      WHERE "sectionRecordId" = ${input.sectionRecordId}
    `;

    for (const study of studies) {
      const studyType = study.tipoEstudio || 'OTHER';
      const studyName = study.nombreEstudio || 'Estudio no especificado';

      await this.prisma.$executeRaw`
        INSERT INTO "ConsultationHistoryPriorStudy" (
          "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
          "versionNumber", "studyType", "studyName", "studyDate", "result",
          "relevantFinding", "sourceModule", "sourceReferenceId",
          "registeredByUserId", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id},
          ${input.encounter.patientId}, ${input.sectionRecordId},
          ${versionNumber},
          CAST(${studyType} AS "public"."ConsultationPriorStudyType"),
          ${studyName}, ${this.parseOptionalDate(study.fechaEstudio)},
          ${study.resultado}, ${study.interpretacionHallazgo || null},
          ${study.sourceModule || null}, ${study.sourceReferenceId || null},
          ${input.userId}, NOW(), NOW()
        )
      `;
    }
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

  private async syncEmergencyDischargeRecord(input: {
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
    if (!this.isEmergencyDischargeRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const dischargedAt =
      this.parseOptionalDate(input.formData.fechaHoraEgresoUrg) ?? input.recordedAt;

    await this.prisma.$executeRaw`
      INSERT INTO "EmergencyDischarge" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "dischargeType",
        "destination", "receivingService", "receivingPhysician", "dischargedAt",
        "admissionReason", "dischargeDiagnosis", "cie10", "emergencyManagement",
        "performedProcedures", "stayEvolution", "dischargeCondition",
        "dischargeMedications", "generalCare", "specificCare", "diet",
        "physicalActivity", "followUp", "alarmSigns", "linkedPrescription",
        "prescriptionJustification", "incapacityGranted", "incapacityDays",
        "incapacityType", "patientEducation", "patientComprehension",
        "transferOriginUnit", "transferDestinationUnit", "transferVitalSigns",
        "transferClinicalSummary", "transferDiagnosis", "transferPreviousTreatment",
        "transferConditions", "transferReceivingPhysician", "consentProcedure",
        "consentRisks", "consentBenefits", "consentAuthorization",
        "consentSignatures", "publicMinistryNotice", "deathCertificateData",
        "professionalName", "professionalLicense", "professionalSpecialty",
        "careLocation", "signerUserId", "signedAt", "closedEncounterAt",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        1, ${input.title}, ${input.status}, ${input.recordedAt}, ${this.readStringValue(input.formData.tipoEgresoUrg)},
        ${this.readStringValue(input.formData.destinoEgresoUrg)}, ${this.readStringValue(input.formData.servicioReceptorUrg)}, ${this.readStringValue(input.formData.medicoReceptorUrg)}, ${dischargedAt},
        ${this.readStringValue(input.formData.motivoIngresoEgresoUrg)}, ${this.readStringValue(input.formData.diagnosticoEgresoUrg)}, ${this.readStringValue(input.formData.cie10EgresoUrg)}, ${this.readStringValue(input.formData.manejoUrgenciasEgresoUrg)},
        ${this.readStringValue(input.formData.procedimientosRealizadosEgresoUrg)}, ${this.readStringValue(input.formData.evolucionEstanciaEgresoUrg)}, ${this.readStringValue(input.formData.estadoAlEgresoUrg)},
        ${this.readStringValue(input.formData.medicamentosEgresoUrg)}, ${this.readStringValue(input.formData.cuidadosGeneralesEgresoUrg)}, ${this.readStringValue(input.formData.cuidadosEspecificosEgresoUrg)}, ${this.readStringValue(input.formData.dietaEgresoUrg)},
        ${this.readStringValue(input.formData.actividadFisicaEgresoUrg)}, ${this.readStringValue(input.formData.seguimientoEgresoUrg)}, ${this.readStringValue(input.formData.signosAlarmaEgresoUrg)}, ${this.readStringValue(input.formData.recetaAsociadaEgresoUrg)},
        ${this.readStringValue(input.formData.justificacionSinRecetaEgresoUrg)}, ${this.readStringValue(input.formData.incapacidadOtorgadaUrg)}, ${this.readNumericValue(input.formData.diasIncapacidadUrg)},
        ${this.readStringValue(input.formData.tipoIncapacidadUrg)}, ${this.readStringValue(input.formData.educacionOtorgadaEgresoUrg)}, ${this.readStringValue(input.formData.comprensionPacienteEgresoUrg)},
        ${this.readStringValue(input.formData.unidadOrigenTrasladoUrg)}, ${this.readStringValue(input.formData.unidadDestinoTrasladoUrg)}, ${this.readStringValue(input.formData.signosVitalesTrasladoUrg)},
        ${this.readStringValue(input.formData.resumenTrasladoUrg)}, ${this.readStringValue(input.formData.diagnosticoTrasladoUrg)}, ${this.readStringValue(input.formData.tratamientoPrevioTrasladoUrg)},
        ${this.readStringValue(input.formData.condicionesTrasladoUrg)}, ${this.readStringValue(input.formData.medicoReceptorTrasladoUrg)}, ${this.readStringValue(input.formData.procedimientoConsentimientoUrg)},
        ${this.readStringValue(input.formData.riesgosConsentimientoUrg)}, ${this.readStringValue(input.formData.beneficiosConsentimientoUrg)}, ${this.readStringValue(input.formData.autorizacionConsentimientoUrg)},
        ${this.readStringValue(input.formData.firmasConsentimientoUrg)}, ${this.readStringValue(input.formData.avisoMinisterioPublico)}, ${this.readStringValue(input.formData.certificadoDefuncion)},
        ${this.readStringValue(input.formData.medicoResponsableEgresoUrg) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaResponsableEgresoUrg)}, ${this.readStringValue(input.formData.especialidadResponsableEgresoUrg)},
        ${this.readStringValue(input.formData.lugarAtencionEgresoUrg)}, ${signedAt ? input.userId : null}, ${signedAt}, ${signedAt}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "dischargeType" = EXCLUDED."dischargeType",
        "destination" = EXCLUDED."destination",
        "receivingService" = EXCLUDED."receivingService",
        "receivingPhysician" = EXCLUDED."receivingPhysician",
        "dischargedAt" = EXCLUDED."dischargedAt",
        "admissionReason" = EXCLUDED."admissionReason",
        "dischargeDiagnosis" = EXCLUDED."dischargeDiagnosis",
        "cie10" = EXCLUDED."cie10",
        "emergencyManagement" = EXCLUDED."emergencyManagement",
        "performedProcedures" = EXCLUDED."performedProcedures",
        "stayEvolution" = EXCLUDED."stayEvolution",
        "dischargeCondition" = EXCLUDED."dischargeCondition",
        "dischargeMedications" = EXCLUDED."dischargeMedications",
        "generalCare" = EXCLUDED."generalCare",
        "specificCare" = EXCLUDED."specificCare",
        "diet" = EXCLUDED."diet",
        "physicalActivity" = EXCLUDED."physicalActivity",
        "followUp" = EXCLUDED."followUp",
        "alarmSigns" = EXCLUDED."alarmSigns",
        "linkedPrescription" = EXCLUDED."linkedPrescription",
        "prescriptionJustification" = EXCLUDED."prescriptionJustification",
        "incapacityGranted" = EXCLUDED."incapacityGranted",
        "incapacityDays" = EXCLUDED."incapacityDays",
        "incapacityType" = EXCLUDED."incapacityType",
        "patientEducation" = EXCLUDED."patientEducation",
        "patientComprehension" = EXCLUDED."patientComprehension",
        "transferOriginUnit" = EXCLUDED."transferOriginUnit",
        "transferDestinationUnit" = EXCLUDED."transferDestinationUnit",
        "transferVitalSigns" = EXCLUDED."transferVitalSigns",
        "transferClinicalSummary" = EXCLUDED."transferClinicalSummary",
        "transferDiagnosis" = EXCLUDED."transferDiagnosis",
        "transferPreviousTreatment" = EXCLUDED."transferPreviousTreatment",
        "transferConditions" = EXCLUDED."transferConditions",
        "transferReceivingPhysician" = EXCLUDED."transferReceivingPhysician",
        "consentProcedure" = EXCLUDED."consentProcedure",
        "consentRisks" = EXCLUDED."consentRisks",
        "consentBenefits" = EXCLUDED."consentBenefits",
        "consentAuthorization" = EXCLUDED."consentAuthorization",
        "consentSignatures" = EXCLUDED."consentSignatures",
        "publicMinistryNotice" = EXCLUDED."publicMinistryNotice",
        "deathCertificateData" = EXCLUDED."deathCertificateData",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "closedEncounterAt" = EXCLUDED."closedEncounterAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncEmergencyDocumentRecord(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    noteType: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (!this.isEmergencyDocumentRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const folio =
      this.readStringValue(input.metadata.folio) ||
      this.readStringValue(input.formData.documentoFolio) ||
      `${input.encounter.encounterNumber}-${this.sanitizeFileName(input.noteType).toUpperCase()}-${String(versionNumber).padStart(2, '0')}`;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const documentDate = this.parseOptionalDate(input.formData.documentoFecha);

    await this.prisma.$executeRaw`
      INSERT INTO "EmergencyDocument" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "documentType", "versionNumber", "title", "folio", "status",
        "recordedAt", "documentDate", "documentTime", "responsibleName",
        "professionalLicense", "professionalSpecialty", "careLocation",
        "verificationCode", "contentJson", "signerUserId", "signedAt",
        "pdfDownloadCount", "pdfLastDownloadedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${input.noteType}, ${versionNumber}, ${input.title}, ${folio}, ${input.status},
        ${input.recordedAt}, ${documentDate}, ${this.readStringValue(input.formData.documentoHora)}, ${this.readStringValue(input.formData.documentoNombreProfesional) || 'Sin profesional responsable'},
        ${this.readStringValue(input.formData.documentoCedulaProfesional)}, ${this.readStringValue(input.formData.documentoEspecialidadProfesional)}, ${this.readStringValue(input.formData.documentoLugarAtencion)},
        ${this.readStringValue(input.formData.documentoCodigoVerificacion)}, ${this.jsonbParameter(input.formData)}, ${signedAt ? input.userId : null}, ${signedAt},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "documentType" = EXCLUDED."documentType",
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "folio" = EXCLUDED."folio",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "documentDate" = EXCLUDED."documentDate",
        "documentTime" = EXCLUDED."documentTime",
        "responsibleName" = EXCLUDED."responsibleName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "verificationCode" = EXCLUDED."verificationCode",
        "contentJson" = EXCLUDED."contentJson",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncHospitalDocumentRecord(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    noteType: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (!this.isHospitalDocumentRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const folio =
      this.readStringValue(input.metadata.folio) ||
      this.readStringValue(input.formData.documentoFolio) ||
      `${input.encounter.encounterNumber}-${this.sanitizeFileName(input.noteType).toUpperCase()}-${String(versionNumber).padStart(2, '0')}`;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const documentDate = this.parseOptionalDate(input.formData.documentoFecha);
    const documentHash =
      this.readStringValue(input.metadata.documentHash) ||
      this.readStringValue(input.formData.documentoHash);
    const digitalSeal =
      this.readStringValue(input.metadata.digitalSeal) ||
      this.readStringValue(input.formData.documentoSelloDigital);

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalDocument" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "documentType", "versionNumber", "title", "folio", "status",
        "recordedAt", "documentDate", "documentTime", "patientName",
        "patientCurp", "medicalRecordNumber", "encounterFolio",
        "responsibleName", "professionalLicense", "professionalSpecialty",
        "careLocation", "verificationCode", "documentHash", "digitalSeal",
        "contentJson", "signerUserId", "signedAt", "pdfDownloadCount",
        "pdfLastDownloadedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${input.noteType}, ${versionNumber}, ${input.title}, ${folio}, ${input.status},
        ${input.recordedAt}, ${documentDate}, ${this.readStringValue(input.formData.documentoHora)}, ${this.readStringValue(input.formData.documentoPacienteNombre) || input.encounter.patient.fullName},
        ${this.readStringValue(input.formData.documentoPacienteCurp)}, ${this.readStringValue(input.formData.documentoExpediente) || input.encounter.medicalRecord.recordNumber}, ${this.readStringValue(input.formData.documentoFolioEpisodio) || input.encounter.encounterNumber},
        ${this.readStringValue(input.formData.documentoNombreProfesional) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.documentoCedulaProfesional)}, ${this.readStringValue(input.formData.documentoEspecialidadProfesional)},
        ${this.readStringValue(input.formData.documentoLugarAtencion)}, ${this.readStringValue(input.formData.documentoCodigoVerificacion)}, ${documentHash}, ${digitalSeal},
        ${this.jsonbParameter(input.formData)}, ${signedAt ? input.userId : null}, ${signedAt}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0},
        ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "documentType" = EXCLUDED."documentType",
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "folio" = EXCLUDED."folio",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "documentDate" = EXCLUDED."documentDate",
        "documentTime" = EXCLUDED."documentTime",
        "patientName" = EXCLUDED."patientName",
        "patientCurp" = EXCLUDED."patientCurp",
        "medicalRecordNumber" = EXCLUDED."medicalRecordNumber",
        "encounterFolio" = EXCLUDED."encounterFolio",
        "responsibleName" = EXCLUDED."responsibleName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "verificationCode" = EXCLUDED."verificationCode",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "contentJson" = EXCLUDED."contentJson",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "updatedAt" = NOW()
    `;

    const storedRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "HospitalDocument" WHERE "sectionRecordId" = ${input.sectionRecordId} LIMIT 1
    `;
    const hospitalDocumentId = storedRows[0]?.id;
    if (!hospitalDocumentId) return;

    await this.prisma.$executeRaw`DELETE FROM "HospitalDocumentLabStudy" WHERE "hospitalDocumentId" = ${hospitalDocumentId}`;
    await this.prisma.$executeRaw`DELETE FROM "HospitalDocumentImagingStudy" WHERE "hospitalDocumentId" = ${hospitalDocumentId}`;
    await this.prisma.$executeRaw`DELETE FROM "HospitalDocumentSigner" WHERE "hospitalDocumentId" = ${hospitalDocumentId}`;

    const labStudies = this.readObjectArray(input.formData.documentoEstudiosLaboratorio);
    for (const [index, study] of labStudies.entries()) {
      const studyType = this.readStringValue(study.tipoEstudio);
      if (!studyType) continue;

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalDocumentLabStudy" (
          "id", "tenantId", "encounterId", "patientId", "hospitalDocumentId",
          "studyType", "priority", "clinicalIndication", "sortOrder",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${hospitalDocumentId},
          ${studyType}, ${this.readStringValue(study.prioridad)}, ${this.readStringValue(study.indicacionClinica)}, ${index},
          NOW(), NOW()
        )
      `;
    }

    const imagingStudies = this.readObjectArray(input.formData.documentoEstudiosImagen);
    const fallbackImagingStudies =
      imagingStudies.length > 0
        ? imagingStudies
        : this.hasCapturedValue(input.formData.documentoEstudioImagen)
          ? [
              {
                estudio: input.formData.documentoEstudioImagen,
                tipo: input.formData.documentoTipoImagen,
                regionAnatomica: input.formData.documentoRegionAnatomica,
                proyeccion: input.formData.documentoProyeccion,
                prioridad: input.formData.documentoPrioridadImagen,
                indicacionClinica: input.formData.documentoIndicacionClinicaImagen,
                alergiaContraste: input.formData.documentoAlergiaContraste,
                embarazo: input.formData.documentoEmbarazo,
                funcionRenal: input.formData.documentoFuncionRenal,
              },
            ]
          : [];
    for (const [index, study] of fallbackImagingStudies.entries()) {
      const studyName = this.readStringValue(study.estudio);
      if (!studyName) continue;

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalDocumentImagingStudy" (
          "id", "tenantId", "encounterId", "patientId", "hospitalDocumentId",
          "studyName", "imageType", "anatomicalRegion", "projection",
          "priority", "clinicalIndication", "contrastAllergy", "pregnancy",
          "renalFunction", "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${hospitalDocumentId},
          ${studyName}, ${this.readStringValue(study.tipo)}, ${this.readStringValue(study.regionAnatomica)}, ${this.readStringValue(study.proyeccion)},
          ${this.readStringValue(study.prioridad)}, ${this.readStringValue(study.indicacionClinica)}, ${this.readStringValue(study.alergiaContraste)}, ${this.readStringValue(study.embarazo)},
          ${this.readStringValue(study.funcionRenal)}, ${index}, NOW(), NOW()
        )
      `;
    }

    const signers = [
      {
        signerType: 'PACIENTE',
        signerName: input.formData.documentoNombrePacienteConsentimiento,
        signatureLabel: input.formData.documentoFirmaPacienteConsentimiento,
      },
      {
        signerType: 'MEDICO',
        signerName: input.formData.documentoNombreProfesional,
        signatureLabel: input.formData.documentoFirmaMedicoConsentimiento,
      },
      ...this.readObjectArray(input.formData.documentoTestigosConsentimiento).map(
        (signer) => ({
          signerType: 'TESTIGO',
          signerName: signer.nombre,
          signatureLabel: signer.firma,
        }),
      ),
    ];
    for (const [index, signer] of signers.entries()) {
      const signerName = this.readStringValue(signer.signerName);
      if (!signerName) continue;

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalDocumentSigner" (
          "id", "tenantId", "encounterId", "patientId", "hospitalDocumentId",
          "signerType", "signerName", "signatureLabel", "sortOrder",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${hospitalDocumentId},
          ${signer.signerType}, ${signerName}, ${this.readStringValue(signer.signatureLabel)}, ${index},
          NOW(), NOW()
        )
      `;
    }
  }

  private async syncAmbulatoryProcedureSupportingDocument(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    noteType: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (
      !this.isAmbulatoryProcedureSupportingDocumentRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const folio =
      this.readStringValue(input.metadata.folio) ||
      this.readStringValue(input.formData.documentoFolio) ||
      `${input.encounter.encounterNumber}-${this.sanitizeFileName(input.noteType).toUpperCase()}-${String(versionNumber).padStart(2, '0')}`;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const documentDate = this.parseOptionalDate(input.formData.documentoFecha);

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryProcedureSupportingDocument" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "documentType", "versionNumber", "title", "folio", "status",
        "recordedAt", "documentDate", "documentTime", "patientName",
        "medicalRecordNumber", "encounterFolio", "responsibleName",
        "professionalLicense", "professionalSpecialty", "careLocation",
        "verificationCode", "documentHash", "digitalSeal", "contentJson",
        "signerUserId", "signedAt", "pdfGeneratedAt", "pdfFileName",
        "pdfDownloadCount", "pdfLastDownloadedAt",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${input.noteType}, ${versionNumber}, ${input.title}, ${folio}, ${input.status},
        ${input.recordedAt}, ${documentDate}, ${this.readStringValue(input.formData.documentoHora)}, ${this.readStringValue(input.formData.documentoPacienteNombre) || input.encounter.patient.fullName},
        ${this.readStringValue(input.formData.documentoExpediente) || input.encounter.medicalRecord.recordNumber}, ${this.readStringValue(input.formData.documentoFolioEpisodio) || input.encounter.encounterNumber},
        ${this.readStringValue(input.formData.documentoNombreProfesional) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.documentoCedulaProfesional)}, ${this.readStringValue(input.formData.documentoEspecialidadProfesional)},
        ${this.readStringValue(input.formData.documentoLugarAtencion)}, ${this.readStringValue(input.formData.documentoCodigoVerificacion)}, ${this.readStringValue(input.formData.documentoHash)}, ${this.readStringValue(input.formData.documentoSelloDigital)}, ${this.jsonbParameter(input.formData)},
        ${signedAt ? input.userId : null}, ${signedAt}, ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? `${this.sanitizeFileName(input.title)}.pdf` : null},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)},
        NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "documentType" = EXCLUDED."documentType",
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "folio" = EXCLUDED."folio",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "documentDate" = EXCLUDED."documentDate",
        "documentTime" = EXCLUDED."documentTime",
        "patientName" = EXCLUDED."patientName",
        "medicalRecordNumber" = EXCLUDED."medicalRecordNumber",
        "encounterFolio" = EXCLUDED."encounterFolio",
        "responsibleName" = EXCLUDED."responsibleName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "verificationCode" = EXCLUDED."verificationCode",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "contentJson" = EXCLUDED."contentJson",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfGeneratedAt" = EXCLUDED."pdfGeneratedAt",
        "pdfFileName" = EXCLUDED."pdfFileName",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "updatedAt" = NOW()
    `;

    const storedRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryProcedureSupportingDocument" WHERE "sectionRecordId" = ${input.sectionRecordId} LIMIT 1
    `;
    const supportingDocumentId = storedRows[0]?.id;
    if (!supportingDocumentId) return;

    await this.prisma.$executeRaw`DELETE FROM "AmbulatoryProcedureDocumentLabStudy" WHERE "supportingDocumentId" = ${supportingDocumentId}`;

    if (input.noteType === 'Solicitud de laboratorio') {
      const labStudies = this.readObjectArray(
        input.formData.documentoEstudiosLaboratorio,
      );
      for (const [index, study] of labStudies.entries()) {
        const studyType = this.readStringValue(study.tipoEstudio);
        if (!studyType) continue;

        await this.prisma.$executeRaw`
          INSERT INTO "AmbulatoryProcedureDocumentLabStudy" (
            "id", "tenantId", "encounterId", "patientId", "supportingDocumentId",
            "studyType", "clinicalIndication", "sortOrder", "createdAt", "updatedAt"
          )
          VALUES (
            ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${supportingDocumentId},
            ${studyType}, ${this.readStringValue(study.indicacionClinica)}, ${index}, NOW(), NOW()
          )
        `;
      }
    }

    await this.prisma.$executeRaw`DELETE FROM "AmbulatoryProcedureLabRequest" WHERE "supportingDocumentId" = ${supportingDocumentId}`;
    await this.prisma.$executeRaw`DELETE FROM "AmbulatoryProcedureImagingRequest" WHERE "supportingDocumentId" = ${supportingDocumentId}`;
    await this.prisma.$executeRaw`DELETE FROM "AmbulatoryProcedureReferralDocument" WHERE "supportingDocumentId" = ${supportingDocumentId}`;
    await this.prisma.$executeRaw`DELETE FROM "AmbulatoryProcedureConsentDocument" WHERE "supportingDocumentId" = ${supportingDocumentId}`;
    await this.prisma.$executeRaw`DELETE FROM "AmbulatoryProcedureCertificateDocument" WHERE "supportingDocumentId" = ${supportingDocumentId}`;

    if (input.noteType === 'Solicitud de laboratorio') {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureLabRequest" (
          "id", "supportingDocumentId", "tenantId", "encounterId", "patientId",
          "requestType", "priority", "diagnosis", "cie10", "clinicalReason",
          "fasting", "preparation", "additionalStudies", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${supportingDocumentId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId},
          ${this.readStringValue(input.formData.documentoTipoSolicitud)}, ${this.readStringValue(input.formData.documentoPrioridad)}, ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}, ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}, ${this.readStringValue(input.formData.documentoMotivoSolicitud)},
          ${this.readStringValue(input.formData.documentoAyuno)}, ${this.readStringValue(input.formData.documentoPreparacionEspecifica)}, ${this.readStringValue(input.formData.documentoEstudiosSolicitados)}, NOW(), NOW()
        )
      `;
      return;
    }

    if (input.noteType === 'Solicitud de imagenología') {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureImagingRequest" (
          "id", "supportingDocumentId", "tenantId", "encounterId", "patientId",
          "imageType", "anatomicalRegion", "clinicalReason", "probableDiagnosis",
          "cie10", "contrast", "preparation", "contrastAlert", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${supportingDocumentId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId},
          ${this.readStringValue(input.formData.documentoTipoImagen)}, ${this.readStringValue(input.formData.documentoRegionAnatomica)}, ${this.readStringValue(input.formData.documentoMotivoSolicitud)}, ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)},
          ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}, ${this.readStringValue(input.formData.documentoConContraste)}, ${this.readStringValue(input.formData.documentoPreparacionEspecifica)}, ${this.readStringValue(input.formData.documentoAlertaContraste)}, NOW(), NOW()
        )
      `;
      return;
    }

    if (input.noteType === 'Referencia / contrarreferencia') {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureReferralDocument" (
          "id", "supportingDocumentId", "tenantId", "encounterId", "patientId",
          "referralType", "destinationHospital", "destinationClinic",
          "destinationPhysician", "reason", "diagnosis", "performedProcedure",
          "briefEvolution", "currentTreatment", "medication", "planRecommendations",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${supportingDocumentId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId},
          ${this.readStringValue(input.formData.documentoTipoReferencia)}, ${this.readStringValue(input.formData.documentoHospitalDestino)}, ${this.readStringValue(input.formData.documentoClinicaDestino)},
          ${this.readStringValue(input.formData.documentoMedicoDestino)}, ${this.readStringValue(input.formData.documentoMotivoEnvio)}, ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}, ${this.readStringValue(input.formData.documentoProcedimientoRealizado)},
          ${this.readStringValue(input.formData.documentoEvolucionBreve)}, ${this.readStringValue(input.formData.documentoTratamientoActual)}, ${this.readStringValue(input.formData.documentoMedicacion)}, ${this.readStringValue(input.formData.documentoPlanRecomendaciones)},
          NOW(), NOW()
        )
      `;
      return;
    }

    if (input.noteType === 'Consentimiento informado') {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureConsentDocument" (
          "id", "supportingDocumentId", "tenantId", "encounterId", "patientId",
          "institutionName", "legalName", "procedureName", "anesthesiaType",
          "risks", "benefits", "alternatives", "legalAuthorization",
          "patientSignature", "witnessOneSignature", "witnessTwoSignature",
          "physicianSignature", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${supportingDocumentId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId},
          ${this.readStringValue(input.formData.documentoInstitucionNombre)}, ${this.readStringValue(input.formData.documentoRazonSocial)}, ${this.readStringValue(input.formData.documentoProcedimientoNombre)}, ${this.readStringValue(input.formData.documentoTipoAnestesia)},
          ${this.readStringValue(input.formData.documentoRiesgos)}, ${this.readStringValue(input.formData.documentoBeneficios)}, ${this.readStringValue(input.formData.documentoAlternativas)}, ${this.readStringValue(input.formData.documentoAutorizacionLegal)},
          ${this.readStringValue(input.formData.documentoFirmaPaciente)}, ${this.readStringValue(input.formData.documentoFirmaTestigo1)}, ${this.readStringValue(input.formData.documentoFirmaTestigo2)},
          ${this.readStringValue(input.formData.documentoFirmaMedico)}, NOW(), NOW()
        )
      `;
      return;
    }

    if (input.noteType === 'Certificado / constancia') {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureCertificateDocument" (
          "id", "supportingDocumentId", "tenantId", "encounterId", "patientId",
          "certificateType", "incapacityDays", "incapacityType", "certificateText",
          "startDate", "endDate", "diagnosis", "observations", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${supportingDocumentId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId},
          ${this.readStringValue(input.formData.documentoTipoCertificado)}, ${this.readNumericValue(input.formData.documentoDiasIncapacidad)}, ${this.readStringValue(input.formData.documentoTipoIncapacidad)}, ${this.readStringValue(input.formData.documentoTextoConstancia)},
          ${this.parseOptionalDate(input.formData.documentoReposoInicio)}, ${this.parseOptionalDate(input.formData.documentoReposoFin)}, ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}, ${this.readStringValue(input.formData.documentoObservaciones)}, NOW(), NOW()
        )
      `;
    }
  }

  private async syncHospitalAdmissionRecord(input: {
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
    if (!this.isHospitalAdmissionRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const admittedAt = this.parseOptionalDate(
      `${this.readStringValue(input.formData.fechaIngresoHosp)}T${this.readStringValue(input.formData.horaIngresoHosp)}`,
    );
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalAdmission" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt",
        "admissionType", "admissionOrigin", "initialClinicalStatus", "serviceName",
        "floor", "room", "bed", "admittedAt", "initialAssessmentTime",
        "administrativeReason", "hospitalizationType", "admissionPriority", "stayRegimen",
        "attendingPhysician", "admissionShift", "assignedNursing", "admissionResponsible",
        "originEpisodeReference", "administrativeNotes", "coverageType", "insurerAgreement",
        "authorizationNumber", "accountResponsible", "requiresEstimate", "requiresAuthorization",
        "admissionReasonClinical", "presentIllnessHistory", "interviewSummary",
        "systolicBp", "diastolicBp", "heartRate", "respiratoryRate", "temperature",
        "oxygenSaturation", "painEva", "weight", "height", "glucose",
        "physicalExam", "mentalStatus", "studyResults", "clinicalInterpretation",
        "primaryDiagnosis", "primaryCie10", "secondaryDiagnosesJson", "admissionPrognosis",
        "comorbiditiesJson", "initialDiet", "restMobility", "admissionDevices",
        "isolationRequired", "bloodTypeRh", "medicationsJson", "studiesPlan", "proceduresPlan",
        "consultationsPlan", "additionalPlan", "surgicalRisk", "thromboticRisk",
        "infectiousRisk", "fallRiskMorse", "nutritionalRisk", "initialClinicalRisk",
        "hospitalizationConsent", "procedureConsent", "identifiedRisks", "professionalName",
        "professionalLicense", "professionalSpecialty", "careLocation", "signerUserId",
        "signedAt", "pdfDownloadCount", "pdfLastDownloadedAt", "sourceEmergencyRecordId",
        "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt},
        ${this.readStringValue(input.formData.tipoIngresoHosp)}, ${this.readStringValue(input.formData.origenIngresoHosp)}, ${this.readStringValue(input.formData.estadoClinicoIngresoHosp)}, ${this.readStringValue(input.formData.servicioIngresoHosp)},
        ${this.readStringValue(input.formData.pisoIngresoHosp)}, ${this.readStringValue(input.formData.habitacionIngresoHosp)}, ${this.readStringValue(input.formData.camaIngresoHosp)}, ${admittedAt}, ${this.readStringValue(input.formData.tiempoValoracionInicialHosp)},
        ${this.readStringValue(input.formData.motivoAdministrativoHosp)}, ${this.readStringValue(input.formData.tipoHospitalizacionHosp)}, ${this.readStringValue(input.formData.prioridadIngresoHosp)}, ${this.readStringValue(input.formData.regimenEstanciaHosp)},
        ${this.readStringValue(input.formData.medicoAdscritoHosp)}, ${this.readStringValue(input.formData.turnoIngresoHosp)}, ${this.readStringValue(input.formData.enfermeriaAsignadaHosp)}, ${this.readStringValue(input.formData.responsableAdmisionHosp)},
        ${this.readStringValue(input.formData.episodioOrigenHosp)}, ${this.readStringValue(input.formData.observacionesAdministrativasHosp)}, ${this.readStringValue(input.formData.tipoCoberturaHosp)}, ${this.readStringValue(input.formData.aseguradoraConvenioHosp)},
        ${this.readStringValue(input.formData.numeroAutorizacionHosp)}, ${this.readStringValue(input.formData.responsableCuentaHosp)}, ${this.readStringValue(input.formData.requiereEstimadoHosp)}, ${this.readStringValue(input.formData.requiereAutorizacionHosp)},
        ${this.readStringValue(input.formData.motivoIngresoClinicoHosp)}, ${this.readStringValue(input.formData.historiaPadecimientoActualHosp)}, ${this.readStringValue(input.formData.resumenInterrogatorioHosp)},
        ${this.readNumericValue(input.formData.taSistolicaHosp)}, ${this.readNumericValue(input.formData.taDiastolicaHosp)}, ${this.readNumericValue(input.formData.fcHosp)}, ${this.readNumericValue(input.formData.frHosp)}, ${this.readNumericValue(input.formData.temperaturaHosp)},
        ${this.readNumericValue(input.formData.spo2Hosp)}, ${this.readNumericValue(input.formData.dolorEvaHosp)}, ${this.readNumericValue(input.formData.pesoHosp)}, ${this.readNumericValue(input.formData.tallaHosp)}, ${this.readNumericValue(input.formData.glucosaHosp)},
        ${this.readStringValue(input.formData.exploracionFisicaHosp)}, ${this.readStringValue(input.formData.estadoMentalHosp)}, ${this.readStringValue(input.formData.resultadosEstudiosHosp)}, ${this.readStringValue(input.formData.interpretacionClinicaHosp)},
        ${this.readStringValue(input.formData.diagnosticoPrincipalHosp)}, ${this.readStringValue(input.formData.cie10Hosp)}, ${this.jsonbParameter(input.formData.diagnosticosSecundariosHosp)}, ${this.readStringValue(input.formData.pronosticoIngresoHosp)},
        ${this.jsonbParameter(input.formData.comorbilidadesHosp)}, ${this.readStringValue(input.formData.dietaInicialHosp)}, ${this.readStringValue(input.formData.reposoMovilidadHosp)}, ${this.readStringValue(input.formData.dispositivosIngresoHosp)},
        ${this.readStringValue(input.formData.aislamientoRequeridoHosp)}, ${this.readStringValue(input.formData.grupoSanguineoRhHosp)}, ${this.jsonbParameter(input.formData.medicamentosHosp)}, ${this.readStringValue(input.formData.estudiosPlanHosp)}, ${this.readStringValue(input.formData.procedimientosPlanHosp)},
        ${this.readStringValue(input.formData.interconsultasPlanHosp)}, ${this.readStringValue(input.formData.planAdicionalHosp)}, ${this.readStringValue(input.formData.riesgoQuirurgicoHosp)}, ${this.readStringValue(input.formData.riesgoTromboticoHosp)},
        ${this.readStringValue(input.formData.riesgoInfecciosoHosp)}, ${this.readStringValue(input.formData.riesgoCaidasMorseHosp)}, ${this.readStringValue(input.formData.riesgoNutricionalHosp)}, ${this.readStringValue(input.formData.riesgoClinicoInicialHosp)},
        ${this.readStringValue(input.formData.consentimientoHospitalizacionHosp)}, ${this.readStringValue(input.formData.consentimientoProcedimientosHosp)}, ${this.readStringValue(input.formData.riesgosIdentificadosHosp)}, ${this.readStringValue(input.formData.medicoIngresoLegal) || 'Sin profesional responsable'},
        ${this.readStringValue(input.formData.cedulaIngresoLegal)}, ${this.readStringValue(input.formData.especialidadIngresoLegal)}, ${this.readStringValue(input.formData.lugarAtencionIngresoLegal)}, ${signedAt ? input.userId : null},
        ${signedAt}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.readStringValue(input.metadata.sourceEmergencyRecordId)},
        ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "admissionType" = EXCLUDED."admissionType",
        "admissionOrigin" = EXCLUDED."admissionOrigin",
        "initialClinicalStatus" = EXCLUDED."initialClinicalStatus",
        "serviceName" = EXCLUDED."serviceName",
        "floor" = EXCLUDED."floor",
        "room" = EXCLUDED."room",
        "bed" = EXCLUDED."bed",
        "admittedAt" = EXCLUDED."admittedAt",
        "initialAssessmentTime" = EXCLUDED."initialAssessmentTime",
        "administrativeReason" = EXCLUDED."administrativeReason",
        "hospitalizationType" = EXCLUDED."hospitalizationType",
        "admissionPriority" = EXCLUDED."admissionPriority",
        "stayRegimen" = EXCLUDED."stayRegimen",
        "attendingPhysician" = EXCLUDED."attendingPhysician",
        "admissionShift" = EXCLUDED."admissionShift",
        "assignedNursing" = EXCLUDED."assignedNursing",
        "admissionResponsible" = EXCLUDED."admissionResponsible",
        "originEpisodeReference" = EXCLUDED."originEpisodeReference",
        "administrativeNotes" = EXCLUDED."administrativeNotes",
        "coverageType" = EXCLUDED."coverageType",
        "insurerAgreement" = EXCLUDED."insurerAgreement",
        "authorizationNumber" = EXCLUDED."authorizationNumber",
        "accountResponsible" = EXCLUDED."accountResponsible",
        "requiresEstimate" = EXCLUDED."requiresEstimate",
        "requiresAuthorization" = EXCLUDED."requiresAuthorization",
        "admissionReasonClinical" = EXCLUDED."admissionReasonClinical",
        "presentIllnessHistory" = EXCLUDED."presentIllnessHistory",
        "interviewSummary" = EXCLUDED."interviewSummary",
        "systolicBp" = EXCLUDED."systolicBp",
        "diastolicBp" = EXCLUDED."diastolicBp",
        "heartRate" = EXCLUDED."heartRate",
        "respiratoryRate" = EXCLUDED."respiratoryRate",
        "temperature" = EXCLUDED."temperature",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "painEva" = EXCLUDED."painEva",
        "weight" = EXCLUDED."weight",
        "height" = EXCLUDED."height",
        "glucose" = EXCLUDED."glucose",
        "physicalExam" = EXCLUDED."physicalExam",
        "mentalStatus" = EXCLUDED."mentalStatus",
        "studyResults" = EXCLUDED."studyResults",
        "clinicalInterpretation" = EXCLUDED."clinicalInterpretation",
        "primaryDiagnosis" = EXCLUDED."primaryDiagnosis",
        "primaryCie10" = EXCLUDED."primaryCie10",
        "secondaryDiagnosesJson" = EXCLUDED."secondaryDiagnosesJson",
        "admissionPrognosis" = EXCLUDED."admissionPrognosis",
        "comorbiditiesJson" = EXCLUDED."comorbiditiesJson",
        "initialDiet" = EXCLUDED."initialDiet",
        "restMobility" = EXCLUDED."restMobility",
        "admissionDevices" = EXCLUDED."admissionDevices",
        "isolationRequired" = EXCLUDED."isolationRequired",
        "bloodTypeRh" = EXCLUDED."bloodTypeRh",
        "medicationsJson" = EXCLUDED."medicationsJson",
        "studiesPlan" = EXCLUDED."studiesPlan",
        "proceduresPlan" = EXCLUDED."proceduresPlan",
        "consultationsPlan" = EXCLUDED."consultationsPlan",
        "additionalPlan" = EXCLUDED."additionalPlan",
        "surgicalRisk" = EXCLUDED."surgicalRisk",
        "thromboticRisk" = EXCLUDED."thromboticRisk",
        "infectiousRisk" = EXCLUDED."infectiousRisk",
        "fallRiskMorse" = EXCLUDED."fallRiskMorse",
        "nutritionalRisk" = EXCLUDED."nutritionalRisk",
        "initialClinicalRisk" = EXCLUDED."initialClinicalRisk",
        "hospitalizationConsent" = EXCLUDED."hospitalizationConsent",
        "procedureConsent" = EXCLUDED."procedureConsent",
        "identifiedRisks" = EXCLUDED."identifiedRisks",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "sourceEmergencyRecordId" = EXCLUDED."sourceEmergencyRecordId",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;
  }

  private async syncHospitalEvolutionRecord(input: {
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
    if (!this.isHospitalEvolutionRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const previousEvolutionRecordId = this.readStringValue(
      input.metadata.previousEvolutionRecordId,
    );
    const hospitalEvolutionId = randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalEvolution" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "subjective",
        "systolicBp", "diastolicBp", "heartRate", "respiratoryRate", "temperature",
        "oxygenSaturation", "painEva", "capillaryGlucose", "physicalExam",
        "clinicalInterpretation", "clinicalChanges", "nom004Justification",
        "adverseEvents", "complications", "treatmentPlan", "studiesPlan",
        "consultationsPlan", "followUpPlan", "prognosis", "currentConsent",
        "patientFamilyInformation", "professionalName", "professionalLicense",
        "professionalSpecialty", "careLocation", "signerUserId", "signedAt",
        "pdfDownloadCount", "pdfLastDownloadedAt", "previousEvolutionRecordId",
        "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${hospitalEvolutionId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt}, ${this.readStringValue(input.formData.subjetivoEvolHosp)},
        ${this.readNumericValue(input.formData.taSistolicaEvolHosp)}, ${this.readNumericValue(input.formData.taDiastolicaEvolHosp)}, ${this.readNumericValue(input.formData.fcEvolHosp)}, ${this.readNumericValue(input.formData.frEvolHosp)}, ${this.readNumericValue(input.formData.temperaturaEvolHosp)},
        ${this.readNumericValue(input.formData.spo2EvolHosp)}, ${this.readNumericValue(input.formData.dolorEvaEvolHosp)}, ${this.readNumericValue(input.formData.glucosaCapilarEvolHosp)}, ${this.readStringValue(input.formData.exploracionFisicaEvolHosp)},
        ${this.readStringValue(input.formData.interpretacionClinicaEvolHosp)}, ${this.readStringValue(input.formData.cambiosClinicosEvolHosp)}, ${this.readStringValue(input.formData.justificacionNom004EvolHosp)},
        ${this.readStringValue(input.formData.eventosAdversosEvolHosp)}, ${this.readStringValue(input.formData.complicacionesEvolHosp)}, ${this.readStringValue(input.formData.tratamientoEvolHosp)}, ${this.readStringValue(input.formData.estudiosEvolHosp)},
        ${this.readStringValue(input.formData.interconsultasEvolHosp)}, ${this.readStringValue(input.formData.seguimientoEvolHosp)}, ${this.readStringValue(input.formData.pronosticoEvolHosp)}, ${this.readStringValue(input.formData.consentimientoVigenteEvolHosp)},
        ${this.readStringValue(input.formData.informacionPacienteFamiliarEvolHosp)}, ${this.readStringValue(input.formData.medicoEvolHospLegal) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaEvolHospLegal)},
        ${this.readStringValue(input.formData.especialidadEvolHospLegal)}, ${this.readStringValue(input.formData.lugarAtencionEvolHospLegal)}, ${signedAt ? input.userId : null}, ${signedAt},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${previousEvolutionRecordId || null},
        ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "subjective" = EXCLUDED."subjective",
        "systolicBp" = EXCLUDED."systolicBp",
        "diastolicBp" = EXCLUDED."diastolicBp",
        "heartRate" = EXCLUDED."heartRate",
        "respiratoryRate" = EXCLUDED."respiratoryRate",
        "temperature" = EXCLUDED."temperature",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "painEva" = EXCLUDED."painEva",
        "capillaryGlucose" = EXCLUDED."capillaryGlucose",
        "physicalExam" = EXCLUDED."physicalExam",
        "clinicalInterpretation" = EXCLUDED."clinicalInterpretation",
        "clinicalChanges" = EXCLUDED."clinicalChanges",
        "nom004Justification" = EXCLUDED."nom004Justification",
        "adverseEvents" = EXCLUDED."adverseEvents",
        "complications" = EXCLUDED."complications",
        "treatmentPlan" = EXCLUDED."treatmentPlan",
        "studiesPlan" = EXCLUDED."studiesPlan",
        "consultationsPlan" = EXCLUDED."consultationsPlan",
        "followUpPlan" = EXCLUDED."followUpPlan",
        "prognosis" = EXCLUDED."prognosis",
        "currentConsent" = EXCLUDED."currentConsent",
        "patientFamilyInformation" = EXCLUDED."patientFamilyInformation",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "previousEvolutionRecordId" = EXCLUDED."previousEvolutionRecordId",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const storedRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "HospitalEvolution" WHERE "sectionRecordId" = ${input.sectionRecordId} LIMIT 1
    `;
    const storedEvolutionId = storedRows[0]?.id;

    if (!storedEvolutionId) {
      return;
    }

    await this.prisma.$executeRaw`
      DELETE FROM "HospitalEvolutionResult" WHERE "hospitalEvolutionId" = ${storedEvolutionId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "HospitalEvolutionDiagnosis" WHERE "hospitalEvolutionId" = ${storedEvolutionId}
    `;

    for (const [index, result] of this
      .readObjectArray(input.formData.resultadosEstudiosEvolHosp)
      .entries()) {
      const studyName = this.readStringValue(result.estudio);
      const resultDate = this.parseOptionalDate(result.fecha);

      if (!studyName || !resultDate) {
        continue;
      }

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalEvolutionResult" (
          "id", "tenantId", "encounterId", "patientId", "hospitalEvolutionId",
          "studyName", "resultText", "resultDate", "sourceType", "sourceRecordId",
          "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedEvolutionId},
          ${studyName}, ${this.readStringValue(result.resultado)}, ${resultDate}, ${this.readStringValue(result.sourceType) || null}, ${this.readStringValue(result.sourceRecordId) || null},
          ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, diagnosis] of this
      .readObjectArray(input.formData.diagnosticosActivosEvolHosp)
      .entries()) {
      const diagnosisText = this.readStringValue(diagnosis.diagnostico);

      if (!diagnosisText) {
        continue;
      }

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalEvolutionDiagnosis" (
          "id", "tenantId", "encounterId", "patientId", "hospitalEvolutionId",
          "diagnosis", "cie10", "status", "sourceDiagnosisId", "sortOrder",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedEvolutionId},
          ${diagnosisText}, ${this.readStringValue(diagnosis.cie10)}, ${this.readStringValue(diagnosis.estado) || 'ACTIVO'}, ${this.readStringValue(diagnosis.sourceDiagnosisId) || null}, ${index},
          NOW(), NOW()
        )
      `;
    }
  }

  private async syncHospitalMedicalOrdersRecord(input: {
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
      !this.isHospitalMedicalOrdersRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const orderId = randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalMedicalOrder" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "diet",
        "restActivity", "position", "generalCare", "nursingMonitoring",
        "oxygen", "fluidControl", "indicationsStartTime", "nextShiftSchedule",
        "executorUserLabel", "professionalName", "professionalLicense",
        "professionalSpecialty", "careLocation", "signerUserId", "signedAt",
        "pdfDownloadCount", "pdfLastDownloadedAt", "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${orderId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt}, ${this.readStringValue(input.formData.dietaIndicacionesHosp)},
        ${this.readStringValue(input.formData.reposoActividadIndicacionesHosp)}, ${this.readStringValue(input.formData.posicionIndicacionesHosp)}, ${this.readStringValue(input.formData.cuidadosGeneralesIndicacionesHosp)}, ${this.readStringValue(input.formData.monitoreoEnfermeriaIndicacionesHosp)},
        ${this.readStringValue(input.formData.oxigenoIndicacionesHosp)}, ${this.readStringValue(input.formData.controlLiquidosIndicacionesHosp)}, ${this.readStringValue(input.formData.horaInicioIndicacionesHosp)}, ${this.readStringValue(input.formData.programacionSiguienteTurnoHosp)},
        ${this.readStringValue(input.formData.usuarioEjecutorHosp)}, ${this.readStringValue(input.formData.medicoIndicacionesLegal) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaIndicacionesLegal)},
        ${this.readStringValue(input.formData.especialidadIndicacionesLegal)}, ${this.readStringValue(input.formData.lugarAtencionIndicacionesLegal)}, ${signedAt ? input.userId : null}, ${signedAt},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "diet" = EXCLUDED."diet",
        "restActivity" = EXCLUDED."restActivity",
        "position" = EXCLUDED."position",
        "generalCare" = EXCLUDED."generalCare",
        "nursingMonitoring" = EXCLUDED."nursingMonitoring",
        "oxygen" = EXCLUDED."oxygen",
        "fluidControl" = EXCLUDED."fluidControl",
        "indicationsStartTime" = EXCLUDED."indicationsStartTime",
        "nextShiftSchedule" = EXCLUDED."nextShiftSchedule",
        "executorUserLabel" = EXCLUDED."executorUserLabel",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const storedRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "HospitalMedicalOrder" WHERE "sectionRecordId" = ${input.sectionRecordId} LIMIT 1
    `;
    const storedOrderId = storedRows[0]?.id;

    if (!storedOrderId) {
      return;
    }

    await this.prisma.$executeRaw`
      DELETE FROM "HospitalOrderMedication" WHERE "orderId" = ${storedOrderId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "HospitalOrderIntravenousSolution" WHERE "orderId" = ${storedOrderId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "HospitalOrderRequestedStudy" WHERE "orderId" = ${storedOrderId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "HospitalOrderConsultationRequest" WHERE "orderId" = ${storedOrderId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "HospitalOrderTrace" WHERE "orderId" = ${storedOrderId}
    `;

    for (const [index, medication] of this
      .readObjectArray(input.formData.medicamentosIndicacionesHosp)
      .entries()) {
      const medicationName = this.readStringValue(medication.medicamento);

      if (!medicationName) {
        continue;
      }

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalOrderMedication" (
          "id", "tenantId", "encounterId", "patientId", "orderId", "medicationName",
          "dose", "route", "priority", "frequency", "duration", "indication",
          "pharmacyStatus", "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedOrderId}, ${medicationName},
          ${this.readStringValue(medication.dosis)}, ${this.readStringValue(medication.via)}, ${this.readStringValue(medication.prioridad)}, ${this.readStringValue(medication.frecuencia)}, ${this.readStringValue(medication.duracion)}, ${this.readStringValue(medication.indicacion)},
          'PENDIENTE', ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, solution] of this
      .readObjectArray(input.formData.solucionesIvIndicacionesHosp)
      .entries()) {
      const solutionType = this.readStringValue(solution.tipoSolucion);
      const volumeMl = this.readNumericValue(solution.volumenMl);

      if (!solutionType || volumeMl === null) {
        continue;
      }

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalOrderIntravenousSolution" (
          "id", "tenantId", "encounterId", "patientId", "orderId", "solutionType",
          "volumeMl", "rateMlHour", "duration", "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedOrderId}, ${solutionType},
          ${volumeMl}, ${this.readNumericValue(solution.velocidadMlHora)}, ${this.readStringValue(solution.duracion)}, ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, study] of this
      .readObjectArray(input.formData.estudiosSolicitadosIndicacionesHosp)
      .entries()) {
      const studyType = this.readStringValue(study.tipoEstudio);

      if (!studyType) {
        continue;
      }

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalOrderRequestedStudy" (
          "id", "tenantId", "encounterId", "patientId", "orderId", "studyType",
          "priority", "indication", "systemStatus", "targetModule",
          "linkedRequestId", "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedOrderId}, ${studyType},
          ${this.readStringValue(study.prioridad)}, ${this.readStringValue(study.indicacion)}, 'PENDIENTE', ${this.inferStudyTargetModule(studyType)},
          ${this.readStringValue(study.linkedRequestId) || null}, ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, consultation] of this
      .readObjectArray(input.formData.interconsultasSolicitadasIndicacionesHosp)
      .entries()) {
      const serviceName = this.readStringValue(consultation.servicio);

      if (!serviceName) {
        continue;
      }

      await this.prisma.$executeRaw`
        INSERT INTO "HospitalOrderConsultationRequest" (
          "id", "tenantId", "encounterId", "patientId", "orderId", "serviceName",
          "reason", "priority", "systemStatus", "linkedConsultationId",
          "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedOrderId}, ${serviceName},
          ${this.readStringValue(consultation.motivo)}, ${this.readStringValue(consultation.prioridad)}, 'PENDIENTE', ${this.readStringValue(consultation.linkedConsultationId) || null},
          ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, trace] of this.buildHospitalOrderTraceRows(input.formData).entries()) {
      await this.prisma.$executeRaw`
        INSERT INTO "HospitalOrderTrace" (
          "id", "tenantId", "encounterId", "patientId", "orderId", "orderLabel",
          "responsibleArea", "status", "executorUserLabel", "executionTime",
          "sourceType", "sourceIndex", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedOrderId}, ${trace.orderLabel},
          ${trace.responsibleArea}, ${trace.status}, ${trace.executorUserLabel}, ${trace.executionTime},
          ${trace.sourceType}, ${index}, NOW(), NOW()
        )
      `;
    }
  }

  private async syncHospitalConsultationRecord(input: {
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
    if (!this.isHospitalConsultationRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const requestDate = this.parseOptionalDate(input.formData.fechaSolicitudInterHosp);
    const responseDate = this.parseOptionalDate(input.formData.fechaRespuestaInterHosp);
    const closedAt = this.parseOptionalDate(input.formData.fechaCierreInterHosp);
    const responseTimeMinutes = this.readNumericValueFromTimeLabel(
      input.formData.tiempoRespuestaRealInterHosp,
    );
    const closureTimeMinutes = this.readNumericValueFromTimeLabel(
      input.formData.tiempoCierreInterHosp,
    );

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalConsultation" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "requestedDate",
        "requestedTime", "notificationMedium", "requestingService", "requestedService",
        "priority", "targetResponseMinutes", "reason", "diagnosticCriteria",
        "relatedDiagnosis", "relatedCie10", "relatedStudies", "requesterUserId",
        "requesterName", "requesterLicense", "requesterSpecialty", "requestSignedAt",
        "responseDate", "responseTime", "consultantUserId", "consultantName",
        "consultantLicense", "diagnosticImpression", "diagnosticSuggestions",
        "therapeuticSuggestions", "requiresFollowUp", "consultationResult",
        "responseSignedAt", "responseTimeMinutes", "closureTimeMinutes", "closedAt",
        "legalProfessionalName", "legalProfessionalLicense", "legalProfessionalSpecialty",
        "careLocation", "pdfDownloadCount", "pdfLastDownloadedAt", "contentJson",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${this.readStringValue(input.formData.estatusInterconsultaHosp) || 'BORRADOR'}, ${input.recordedAt}, ${requestDate},
        ${this.readStringValue(input.formData.horaSolicitudInterHosp)}, ${this.readStringValue(input.formData.medioNotificacionInterHosp)}, ${this.readStringValue(input.formData.servicioSolicitanteInterHosp)}, ${this.readStringValue(input.formData.servicioInterconsultadoHosp)},
        ${this.readStringValue(input.formData.prioridadInterHosp)}, ${this.readRoundedNumericValue(input.formData.tiempoObjetivoRespuestaInterHosp)}, ${this.readStringValue(input.formData.motivoInterconsultaHosp)}, ${this.readStringValue(input.formData.criterioDiagnosticoInterHosp)},
        ${this.readStringValue(input.formData.diagnosticoRelacionadoInterHosp)}, ${this.readStringValue(input.formData.cie10RelacionadoInterHosp)}, ${this.readStringValue(input.formData.estudiosRelacionadosInterHosp)}, ${input.userId},
        ${this.readStringValue(input.formData.medicoSolicitanteInterHosp) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaSolicitanteInterHosp)}, ${this.readStringValue(input.formData.especialidadSolicitanteInterHosp)}, ${this.parseOptionalDate(input.formData.requestSignedAtInterHosp)},
        ${responseDate}, ${this.readStringValue(input.formData.horaRespuestaInterHosp)}, ${null}, ${this.readStringValue(input.formData.medicoInterconsultanteHosp)},
        ${this.readStringValue(input.formData.cedulaInterconsultanteHosp)}, ${this.readStringValue(input.formData.impresionDiagnosticaInterHosp)}, ${this.readStringValue(input.formData.sugerenciasDiagnosticasInterHosp)},
        ${this.readStringValue(input.formData.sugerenciasTerapeuticasInterHosp)}, ${this.readStringValue(input.formData.requiereSeguimientoInterHosp)}, ${this.readStringValue(input.formData.resultadoInterconsultaHosp)},
        ${this.parseOptionalDate(input.formData.responseSignedAtInterHosp)}, ${responseTimeMinutes}, ${closureTimeMinutes}, ${closedAt},
        ${this.readStringValue(input.formData.medicoInterLegal) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaInterLegal)}, ${this.readStringValue(input.formData.especialidadInterLegal)},
        ${this.readStringValue(input.formData.lugarAtencionInterLegal)}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)},
        NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "requestedDate" = EXCLUDED."requestedDate",
        "requestedTime" = EXCLUDED."requestedTime",
        "notificationMedium" = EXCLUDED."notificationMedium",
        "requestingService" = EXCLUDED."requestingService",
        "requestedService" = EXCLUDED."requestedService",
        "priority" = EXCLUDED."priority",
        "targetResponseMinutes" = EXCLUDED."targetResponseMinutes",
        "reason" = EXCLUDED."reason",
        "diagnosticCriteria" = EXCLUDED."diagnosticCriteria",
        "relatedDiagnosis" = EXCLUDED."relatedDiagnosis",
        "relatedCie10" = EXCLUDED."relatedCie10",
        "relatedStudies" = EXCLUDED."relatedStudies",
        "requesterUserId" = EXCLUDED."requesterUserId",
        "requesterName" = EXCLUDED."requesterName",
        "requesterLicense" = EXCLUDED."requesterLicense",
        "requesterSpecialty" = EXCLUDED."requesterSpecialty",
        "requestSignedAt" = EXCLUDED."requestSignedAt",
        "responseDate" = EXCLUDED."responseDate",
        "responseTime" = EXCLUDED."responseTime",
        "consultantName" = EXCLUDED."consultantName",
        "consultantLicense" = EXCLUDED."consultantLicense",
        "diagnosticImpression" = EXCLUDED."diagnosticImpression",
        "diagnosticSuggestions" = EXCLUDED."diagnosticSuggestions",
        "therapeuticSuggestions" = EXCLUDED."therapeuticSuggestions",
        "requiresFollowUp" = EXCLUDED."requiresFollowUp",
        "consultationResult" = EXCLUDED."consultationResult",
        "responseSignedAt" = EXCLUDED."responseSignedAt",
        "responseTimeMinutes" = EXCLUDED."responseTimeMinutes",
        "closureTimeMinutes" = EXCLUDED."closureTimeMinutes",
        "closedAt" = EXCLUDED."closedAt",
        "legalProfessionalName" = EXCLUDED."legalProfessionalName",
        "legalProfessionalLicense" = EXCLUDED."legalProfessionalLicense",
        "legalProfessionalSpecialty" = EXCLUDED."legalProfessionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;
  }

  private async syncHospitalSurgicalDocumentRecord(input: {
    tenantId: string;
    userId: string;
    encounter: TenantEncounterRecord;
    sectionRecordId: string;
    tabKey: string;
    noteType: string;
    recordedAt: Date;
    title: string;
    status: EncounterRecordStatus;
    formData: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) {
    if (
      !this.isHospitalSurgicalDocumentRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalSurgicalDocument" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "recordType", "subdocumentType", "folio",
        "status", "progressStatus", "recordedAt", "preoperativeDiagnosis",
        "preoperativeCie10", "proposedSurgery", "surgeryType", "procedureCode",
        "procedureCatalog", "mainSurgeon", "firstAssistant", "anesthesiologist",
        "scrubNurse", "circulatingNurse", "surgicalRisks", "asaClassification",
        "anesthesiaType", "airwayAssessment", "anestheticRisk", "informedConsent",
        "consentSignedDate", "consentExplainer", "preoperativeStudies",
        "preanesthesiaAssessmentDate", "preanesthesiaAssessmentTime",
        "scheduledProcedure", "mallampati", "anesthesiaPlan", "anestheticHistory",
        "allergies", "fastingConfirmed", "lastIntake", "airwayEvaluation",
        "detailedAnesthesiaPlan", "anesthesiologistLicense", "surgeryDate",
        "surgeryStartTime", "surgeryEndTime", "operatingRoom",
        "postoperativeDiagnosis", "performedProcedure", "durationMinutes",
        "surgicalTechnique", "transoperativeFindings", "estimatedBleeding",
        "administeredFluids", "transfusions", "drains", "diuresis",
        "textileCount", "incidents", "materialUsed", "implantsProsthesis",
        "lotsSeries", "hadComplications", "complicationType",
        "complicationManagement", "hemodynamicStatus", "consciousnessLevel",
        "pain", "destination", "immediateStatus", "prognosis",
        "postoperativeMedications", "postoperativeSurveillance",
        "postoperativeStudies", "woundCare", "mobilization", "postoperativeDiet",
        "additionalIndications", "recoveryAnesthesiaType", "recoveryAdmissionTime",
        "recoveryDischargeTime", "recoveryBloodPressure", "recoveryHeartRate",
        "recoveryRespiratoryRate", "recoverySpo2", "aldreteScore",
        "recoveryConsciousnessLevel", "recoveryPainEva", "anestheticComplications",
        "motorBlock", "recoveryObservations", "recoveryAnesthesiologist",
        "recoveryAnesthesiologistLicense", "legalProfessionalName",
        "legalProfessionalLicense", "legalProfessionalSpecialty", "careLocation",
        "signerUserId", "signedAt", "pdfDownloadCount", "pdfLastDownloadedAt",
        "documentHash", "digitalSeal", "creatorUserId", "creatorIp", "contentJson",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, 'Procedimientos y cirugía', ${this.readStringValue(input.formData.tipoSubdocumentoQuirurgico) || input.noteType}, ${this.readStringValue(input.formData.folioDocumentoQuirurgico)},
        ${input.status}, ${this.readStringValue(input.formData.progresoQuirurgicoGlobal)}, ${input.recordedAt}, ${this.readStringValue(input.formData.diagnosticoPreoperatorioQuirHosp)},
        ${this.readStringValue(input.formData.cie10PreoperatorioQuirHosp)}, ${this.readStringValue(input.formData.cirugiaPropuestaQuirHosp)}, ${this.readStringValue(input.formData.tipoCirugiaQuirHosp)}, ${this.readStringValue(input.formData.codigoProcedimientoQuirHosp)},
        ${this.readStringValue(input.formData.catalogoProcedimientoQuirHosp)}, ${this.readStringValue(input.formData.cirujanoPrincipalQuirHosp)}, ${this.readStringValue(input.formData.primerAyudanteQuirHosp)}, ${this.readStringValue(input.formData.anestesiologoQuirHosp)},
        ${this.readStringValue(input.formData.instrumentistaQuirHosp)}, ${this.readStringValue(input.formData.enfermeriaCirculanteQuirHosp)}, ${this.readStringValue(input.formData.riesgosQuirurgicosQuirHosp)}, ${this.readStringValue(input.formData.clasificacionAsaQuirHosp)},
        ${this.readStringValue(input.formData.tipoAnestesiaQuirHosp)}, ${this.readStringValue(input.formData.valoracionViaAereaQuirHosp)}, ${this.readStringValue(input.formData.riesgoAnestesicoQuirHosp)}, ${this.readStringValue(input.formData.consentimientoInformadoQuirHosp)},
        ${this.parseOptionalDate(input.formData.fechaFirmaConsentimientoQuirHosp)}, ${this.readStringValue(input.formData.responsableExplicaQuirHosp)}, ${this.readStringValue(input.formData.estudiosPreoperatoriosQuirHosp)},
        ${this.parseOptionalDate(input.formData.fechaValoracionPreanHosp)}, ${this.readStringValue(input.formData.horaValoracionPreanHosp)},
        ${this.readStringValue(input.formData.procedimientoProgramadoPreanHosp)}, ${this.readStringValue(input.formData.mallampatiPreanHosp)}, ${this.readStringValue(input.formData.planAnestesicoPreanHosp)}, ${this.readStringValue(input.formData.antecedentesAnestesicosPreanHosp)},
        ${this.readStringValue(input.formData.alergiasPreanHosp)}, ${this.readStringValue(input.formData.ayunoConfirmadoPreanHosp)}, ${this.readStringValue(input.formData.ultimaIngestaPreanHosp)}, ${this.readStringValue(input.formData.evaluacionViaAereaPreanHosp)},
        ${this.readStringValue(input.formData.planAnestesicoDetalladoPreanHosp)}, ${this.readStringValue(input.formData.cedulaAnestesiologoPreanHosp)}, ${this.parseOptionalDate(input.formData.fechaCirugiaPostop)},
        ${this.readStringValue(input.formData.horaInicioCirugiaPostop)}, ${this.readStringValue(input.formData.horaFinCirugiaPostop)}, ${this.readStringValue(input.formData.quirofanoPostop)},
        ${this.readStringValue(input.formData.diagnosticoPostoperatorioPostop)}, ${this.readStringValue(input.formData.procedimientoRealizadoPostopHosp)}, ${this.readRoundedNumericValue(input.formData.duracionCirugiaPostop)},
        ${this.readStringValue(input.formData.tecnicaQuirurgicaPostop)}, ${this.readStringValue(input.formData.hallazgosTransoperatoriosPostop)}, ${this.readStringValue(input.formData.sangradoEstimadoPostop)},
        ${this.readStringValue(input.formData.liquidosAdministradosPostop)}, ${this.readStringValue(input.formData.transfusionesPostop)}, ${this.readStringValue(input.formData.drenajesPostop)}, ${this.readStringValue(input.formData.diuresisPostop)},
        ${this.readStringValue(input.formData.conteoTextilPostop)}, ${this.readStringValue(input.formData.incidentesPostop)}, ${this.readStringValue(input.formData.materialUtilizadoPostop)}, ${this.readStringValue(input.formData.implantesProtesisPostop)},
        ${this.readStringValue(input.formData.lotesSeriesPostop)}, ${this.readStringValue(input.formData.huboComplicacionesPostop)}, ${this.readStringValue(input.formData.tipoComplicacionPostop)},
        ${this.readStringValue(input.formData.manejoComplicacionPostop)}, ${this.readStringValue(input.formData.estadoHemodinamicoPostop)}, ${this.readStringValue(input.formData.nivelConcienciaPostop)},
        ${this.readStringValue(input.formData.dolorPostop)}, ${this.readStringValue(input.formData.destinoPostop)}, ${this.readStringValue(input.formData.estadoInmediatoPostop)}, ${this.readStringValue(input.formData.pronosticoPostop)},
        ${this.readStringValue(input.formData.medicamentosPostoperatoriosPostop)}, ${this.readStringValue(input.formData.vigilanciaPostoperatoriaPostop)},
        ${this.readStringValue(input.formData.estudiosPostoperatoriosPostop)}, ${this.readStringValue(input.formData.cuidadosHeridaPostop)}, ${this.readStringValue(input.formData.movilidadPostop)}, ${this.readStringValue(input.formData.dietaPostop)},
        ${this.readStringValue(input.formData.indicacionesAdicionalesPostop)}, ${this.readStringValue(input.formData.tipoAnestesiaPostanesHosp)}, ${this.readStringValue(input.formData.horaIngresoPostanesHosp)},
        ${this.readStringValue(input.formData.horaEgresoPostanesHosp)}, ${this.readStringValue(input.formData.taPostanesHosp)}, ${this.readRoundedNumericValue(input.formData.fcPostanesHosp)},
        ${this.readRoundedNumericValue(input.formData.frPostanesHosp)}, ${this.readNumericValue(input.formData.spo2PostanesHosp)}, ${this.readStringValue(input.formData.aldretePostanesHosp)},
        ${this.readStringValue(input.formData.nivelConcienciaPostanesHosp)}, ${this.readRoundedNumericValue(input.formData.dolorEvaPostanesHosp)}, ${this.readStringValue(input.formData.complicacionesAnestesicasPostanesHosp)},
        ${this.readStringValue(input.formData.bloqueoMotorPostanesHosp)}, ${this.readStringValue(input.formData.observacionesPostanesHosp)}, ${this.readStringValue(input.formData.anestesiologoPostanesHosp)},
        ${this.readStringValue(input.formData.cedulaPostanesHosp)}, ${this.readStringValue(input.formData.medicoQuirLegal) || 'Sin profesional responsable'},
        ${this.readStringValue(input.formData.cedulaQuirLegal)}, ${this.readStringValue(input.formData.especialidadQuirLegal)}, ${this.readStringValue(input.formData.lugarAtencionQuirLegal)},
        ${signedAt ? input.userId : null}, ${signedAt}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)},
        ${this.readStringValue(input.formData.hashDocumentoQuirurgico)}, ${this.readStringValue(input.formData.selloDigitalQuirurgico)}, ${input.userId}, ${this.readStringValue(input.formData.ipDocumentoQuirurgico)}, ${this.jsonbParameter(input.formData)},
        NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "recordType" = EXCLUDED."recordType",
        "subdocumentType" = EXCLUDED."subdocumentType",
        "folio" = EXCLUDED."folio",
        "status" = EXCLUDED."status",
        "progressStatus" = EXCLUDED."progressStatus",
        "recordedAt" = EXCLUDED."recordedAt",
        "preoperativeDiagnosis" = EXCLUDED."preoperativeDiagnosis",
        "preoperativeCie10" = EXCLUDED."preoperativeCie10",
        "proposedSurgery" = EXCLUDED."proposedSurgery",
        "surgeryType" = EXCLUDED."surgeryType",
        "procedureCode" = EXCLUDED."procedureCode",
        "procedureCatalog" = EXCLUDED."procedureCatalog",
        "mainSurgeon" = EXCLUDED."mainSurgeon",
        "firstAssistant" = EXCLUDED."firstAssistant",
        "anesthesiologist" = EXCLUDED."anesthesiologist",
        "scrubNurse" = EXCLUDED."scrubNurse",
        "circulatingNurse" = EXCLUDED."circulatingNurse",
        "surgicalRisks" = EXCLUDED."surgicalRisks",
        "asaClassification" = EXCLUDED."asaClassification",
        "anesthesiaType" = EXCLUDED."anesthesiaType",
        "airwayAssessment" = EXCLUDED."airwayAssessment",
        "anestheticRisk" = EXCLUDED."anestheticRisk",
        "informedConsent" = EXCLUDED."informedConsent",
        "consentSignedDate" = EXCLUDED."consentSignedDate",
        "consentExplainer" = EXCLUDED."consentExplainer",
        "preoperativeStudies" = EXCLUDED."preoperativeStudies",
        "preanesthesiaAssessmentDate" = EXCLUDED."preanesthesiaAssessmentDate",
        "preanesthesiaAssessmentTime" = EXCLUDED."preanesthesiaAssessmentTime",
        "scheduledProcedure" = EXCLUDED."scheduledProcedure",
        "mallampati" = EXCLUDED."mallampati",
        "anesthesiaPlan" = EXCLUDED."anesthesiaPlan",
        "anestheticHistory" = EXCLUDED."anestheticHistory",
        "allergies" = EXCLUDED."allergies",
        "fastingConfirmed" = EXCLUDED."fastingConfirmed",
        "lastIntake" = EXCLUDED."lastIntake",
        "airwayEvaluation" = EXCLUDED."airwayEvaluation",
        "detailedAnesthesiaPlan" = EXCLUDED."detailedAnesthesiaPlan",
        "anesthesiologistLicense" = EXCLUDED."anesthesiologistLicense",
        "surgeryDate" = EXCLUDED."surgeryDate",
        "surgeryStartTime" = EXCLUDED."surgeryStartTime",
        "surgeryEndTime" = EXCLUDED."surgeryEndTime",
        "operatingRoom" = EXCLUDED."operatingRoom",
        "postoperativeDiagnosis" = EXCLUDED."postoperativeDiagnosis",
        "performedProcedure" = EXCLUDED."performedProcedure",
        "durationMinutes" = EXCLUDED."durationMinutes",
        "surgicalTechnique" = EXCLUDED."surgicalTechnique",
        "transoperativeFindings" = EXCLUDED."transoperativeFindings",
        "estimatedBleeding" = EXCLUDED."estimatedBleeding",
        "administeredFluids" = EXCLUDED."administeredFluids",
        "transfusions" = EXCLUDED."transfusions",
        "drains" = EXCLUDED."drains",
        "diuresis" = EXCLUDED."diuresis",
        "textileCount" = EXCLUDED."textileCount",
        "incidents" = EXCLUDED."incidents",
        "materialUsed" = EXCLUDED."materialUsed",
        "implantsProsthesis" = EXCLUDED."implantsProsthesis",
        "lotsSeries" = EXCLUDED."lotsSeries",
        "hadComplications" = EXCLUDED."hadComplications",
        "complicationType" = EXCLUDED."complicationType",
        "complicationManagement" = EXCLUDED."complicationManagement",
        "hemodynamicStatus" = EXCLUDED."hemodynamicStatus",
        "consciousnessLevel" = EXCLUDED."consciousnessLevel",
        "pain" = EXCLUDED."pain",
        "destination" = EXCLUDED."destination",
        "immediateStatus" = EXCLUDED."immediateStatus",
        "prognosis" = EXCLUDED."prognosis",
        "postoperativeMedications" = EXCLUDED."postoperativeMedications",
        "postoperativeSurveillance" = EXCLUDED."postoperativeSurveillance",
        "postoperativeStudies" = EXCLUDED."postoperativeStudies",
        "woundCare" = EXCLUDED."woundCare",
        "mobilization" = EXCLUDED."mobilization",
        "postoperativeDiet" = EXCLUDED."postoperativeDiet",
        "additionalIndications" = EXCLUDED."additionalIndications",
        "recoveryAnesthesiaType" = EXCLUDED."recoveryAnesthesiaType",
        "recoveryAdmissionTime" = EXCLUDED."recoveryAdmissionTime",
        "recoveryDischargeTime" = EXCLUDED."recoveryDischargeTime",
        "recoveryBloodPressure" = EXCLUDED."recoveryBloodPressure",
        "recoveryHeartRate" = EXCLUDED."recoveryHeartRate",
        "recoveryRespiratoryRate" = EXCLUDED."recoveryRespiratoryRate",
        "recoverySpo2" = EXCLUDED."recoverySpo2",
        "aldreteScore" = EXCLUDED."aldreteScore",
        "recoveryConsciousnessLevel" = EXCLUDED."recoveryConsciousnessLevel",
        "recoveryPainEva" = EXCLUDED."recoveryPainEva",
        "anestheticComplications" = EXCLUDED."anestheticComplications",
        "motorBlock" = EXCLUDED."motorBlock",
        "recoveryObservations" = EXCLUDED."recoveryObservations",
        "recoveryAnesthesiologist" = EXCLUDED."recoveryAnesthesiologist",
        "recoveryAnesthesiologistLicense" = EXCLUDED."recoveryAnesthesiologistLicense",
        "legalProfessionalName" = EXCLUDED."legalProfessionalName",
        "legalProfessionalLicense" = EXCLUDED."legalProfessionalLicense",
        "legalProfessionalSpecialty" = EXCLUDED."legalProfessionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;
  }

  private async syncHospitalNursingShiftRecord(input: {
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
    if (!this.isHospitalNursingShiftRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const nursingShiftId = randomUUID();
    const intake = this.readNumericValue(input.formData.ingresosMlEnfHosp);
    const output = this.readNumericValue(input.formData.egresosMlEnfHosp);
    const balance = intake !== null || output !== null ? (intake ?? 0) - (output ?? 0) : null;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalNursingShift" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "recordType", "shiftType", "status", "recordedAt",
        "habitusExterior", "fluidIntakeMl", "fluidOutputMl", "fluidBalanceMl",
        "woundCare", "mobilization", "hygiene", "surveillance", "devices",
        "morseFallRisk", "bradenUppRisk", "adverseEvent", "adverseEventType",
        "adverseEventDescriptionAction", "generalObservations", "professionalName",
        "professionalLicense", "professionalSpecialty", "careLocation",
        "signerUserId", "signedAt", "pdfDownloadCount", "pdfLastDownloadedAt",
        "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${nursingShiftId}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, 'Enfermería', ${this.readStringValue(input.formData.turnoEnfermeriaHosp)}, ${input.status}, ${input.recordedAt},
        ${this.readStringValue(input.formData.habitusExteriorEnfHosp)}, ${intake}, ${output}, ${balance},
        ${this.readStringValue(input.formData.curacionesEnfHosp)}, ${this.readStringValue(input.formData.movilizacionEnfHosp)}, ${this.readStringValue(input.formData.higieneEnfHosp)}, ${this.readStringValue(input.formData.vigilanciaEnfHosp)}, ${this.readStringValue(input.formData.dispositivosEnfHosp)},
        ${this.readStringValue(input.formData.riesgoCaidaMorseEnfHosp)}, ${this.readStringValue(input.formData.riesgoUppBradenEnfHosp)}, ${this.readStringValue(input.formData.eventoAdversoEnfHosp)}, ${this.readStringValue(input.formData.tipoEventoAdversoEnfHosp)},
        ${this.readStringValue(input.formData.descripcionAccionEventoEnfHosp)}, ${this.readStringValue(input.formData.observacionesGeneralesEnfHosp)}, ${this.readStringValue(input.formData.profesionalEnfermeriaLegal) || 'Sin profesional responsable'},
        ${this.readStringValue(input.formData.cedulaEnfermeriaLegal)}, ${this.readStringValue(input.formData.especialidadEnfermeriaLegal)}, ${this.readStringValue(input.formData.lugarAtencionEnfermeriaLegal)},
        ${signedAt ? input.userId : null}, ${signedAt}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)},
        ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "shiftType" = EXCLUDED."shiftType",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "habitusExterior" = EXCLUDED."habitusExterior",
        "fluidIntakeMl" = EXCLUDED."fluidIntakeMl",
        "fluidOutputMl" = EXCLUDED."fluidOutputMl",
        "fluidBalanceMl" = EXCLUDED."fluidBalanceMl",
        "woundCare" = EXCLUDED."woundCare",
        "mobilization" = EXCLUDED."mobilization",
        "hygiene" = EXCLUDED."hygiene",
        "surveillance" = EXCLUDED."surveillance",
        "devices" = EXCLUDED."devices",
        "morseFallRisk" = EXCLUDED."morseFallRisk",
        "bradenUppRisk" = EXCLUDED."bradenUppRisk",
        "adverseEvent" = EXCLUDED."adverseEvent",
        "adverseEventType" = EXCLUDED."adverseEventType",
        "adverseEventDescriptionAction" = EXCLUDED."adverseEventDescriptionAction",
        "generalObservations" = EXCLUDED."generalObservations",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const storedRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "HospitalNursingShift" WHERE "sectionRecordId" = ${input.sectionRecordId} LIMIT 1
    `;
    const storedShiftId = storedRows[0]?.id;
    if (!storedShiftId) return;

    await this.prisma.$executeRaw`DELETE FROM "HospitalNursingVitalSign" WHERE "nursingShiftId" = ${storedShiftId}`;
    await this.prisma.$executeRaw`DELETE FROM "HospitalMedicationAdministration" WHERE "nursingShiftId" = ${storedShiftId}`;
    await this.prisma.$executeRaw`DELETE FROM "HospitalNursingProcedure" WHERE "nursingShiftId" = ${storedShiftId}`;

    for (const [index, vital] of this.readObjectArray(input.formData.signosVitalesSeriadosEnfHosp).entries()) {
      const date = this.readStringValue(vital.fecha);
      const time = this.readStringValue(vital.hora);
      const takenAt = this.parseOptionalDate(`${date}T${time}`);
      if (!takenAt) continue;
      await this.prisma.$executeRaw`
        INSERT INTO "HospitalNursingVitalSign" (
          "id", "tenantId", "encounterId", "patientId", "nursingShiftId",
          "takenAt", "systolicBp", "diastolicBp", "heartRate", "respiratoryRate",
          "temperatureC", "oxygenSaturation", "capillaryGlucose", "painEva",
          "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedShiftId},
          ${takenAt}, ${this.readRoundedNumericValue(vital.taSistolica) ?? 0}, ${this.readRoundedNumericValue(vital.taDiastolica) ?? 0}, ${this.readRoundedNumericValue(vital.fc) ?? 0}, ${this.readRoundedNumericValue(vital.fr) ?? 0},
          ${this.readNumericValue(vital.temperatura) ?? 0}, ${this.readNumericValue(vital.spo2) ?? 0}, ${this.readNumericValue(vital.glucosaCapilar)}, ${this.readRoundedNumericValue(vital.dolorEva)},
          ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, medication] of this.readObjectArray(input.formData.medicamentosMinistradosEnfHosp).entries()) {
      const name = this.readStringValue(medication.medicamento);
      const scheduledTime = this.readStringValue(medication.horaProgramada);
      if (!name || !scheduledTime) continue;
      await this.prisma.$executeRaw`
        INSERT INTO "HospitalMedicationAdministration" (
          "id", "tenantId", "encounterId", "patientId", "nursingShiftId",
          "medicationName", "scheduledTime", "administeredTime", "status",
          "omissionReason", "nurseName", "sourceMedicalOrderId", "sourceMedicationId",
          "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedShiftId},
          ${name}, ${scheduledTime}, ${this.readStringValue(medication.horaAdministrada)}, ${this.readStringValue(medication.estado)},
          ${this.readStringValue(medication.motivoNoAdministracion)}, ${this.readStringValue(medication.enfermeria) || this.readStringValue(input.formData.profesionalEnfermeriaLegal)}, ${this.readStringValue(medication.sourceMedicalOrderId)}, ${this.readStringValue(medication.sourceMedicationId)},
          ${index}, NOW(), NOW()
        )
      `;
    }

    for (const [index, procedure] of this.readObjectArray(input.formData.procedimientosEnfermeriaTurnoHosp).entries()) {
      const name = this.readStringValue(procedure.procedimiento);
      if (!name) continue;
      await this.prisma.$executeRaw`
        INSERT INTO "HospitalNursingProcedure" (
          "id", "tenantId", "encounterId", "patientId", "nursingShiftId",
          "procedureName", "performedTime", "performedBy", "observations",
          "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${storedShiftId},
          ${name}, ${this.readStringValue(procedure.hora)}, ${this.readStringValue(procedure.realizadoPor)}, ${this.readStringValue(procedure.observaciones)},
          ${index}, NOW(), NOW()
        )
      `;
    }
  }

  private async syncHospitalDischargeRecord(input: {
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
    if (!this.isHospitalDischargeRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const dischargedAt =
      this.parseOptionalDate(input.formData.fechaHoraEgresoHosp) ?? input.recordedAt;
    const admittedAt = this.parseOptionalDate(input.formData.fechaIngresoReadonlyHosp);
    const stayDays = this.readRoundedNumericValue(input.formData.diasEstanciaHosp);
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;

    await this.prisma.$executeRaw`
      INSERT INTO "HospitalDischarge" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "dischargeType",
        "patientDestination", "receivingUnit", "dischargedAt", "admittedAt",
        "stayDays", "dischargeCondition", "admissionReason", "admissionDiagnosis",
        "finalDiagnosis", "cie10", "performedProcedures", "managementPerformed",
        "stayEvolution", "pendingClinicalProblems", "additionalNarrativeSummary",
        "dischargeMedications", "linkedPrescriptionId", "prescriptionGenerated",
        "prescriptionJustification", "homeCare", "diet", "activityRestrictions",
        "followUp", "nextAppointmentDate", "alarmSigns", "patientEducation",
        "patientComprehension", "incapacityDays", "incapacityType", "prognosis",
        "responsiblePhysicianName", "responsiblePhysicianLicense",
        "professionalName", "professionalLicense", "professionalSpecialty",
        "careLocation", "signerUserId", "signedAt", "closedEncounterAt",
        "pdfDownloadCount", "pdfLastDownloadedAt", "contentJson", "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        1, ${input.title}, ${input.status}, ${input.recordedAt}, ${this.readStringValue(input.formData.tipoEgresoHosp)},
        ${this.readStringValue(input.formData.destinoPacienteEgresoHosp)}, ${this.readStringValue(input.formData.unidadReceptoraEgresoHosp)}, ${dischargedAt}, ${admittedAt},
        ${stayDays}, ${this.readStringValue(input.formData.estadoAlEgresoHosp)}, ${this.readStringValue(input.formData.motivoIngresoEgresoHosp)}, ${this.readStringValue(input.formData.diagnosticoIngresoEgresoHosp)},
        ${this.readStringValue(input.formData.diagnosticoFinalEgresoHosp)}, ${this.readStringValue(input.formData.cie10EgresoHosp)}, ${this.readStringValue(input.formData.procedimientosRealizadosEstanciaHosp)}, ${this.readStringValue(input.formData.manejoRealizadoEgresoHosp)},
        ${this.readStringValue(input.formData.evolucionEstanciaEgresoHosp)}, ${this.readStringValue(input.formData.problemasPendientesEgresoHosp)}, ${this.readStringValue(input.formData.resumenNarrativoEgresoHosp)},
        ${this.readStringValue(input.formData.medicamentosEgresoHosp)}, ${this.readStringValue(input.formData.idRecetaRelacionadaEgresoHosp)}, ${this.readStringValue(input.formData.recetaGeneradaEgresoHosp)},
        ${this.readStringValue(input.formData.justificacionSinRecetaEgresoHosp)}, ${this.readStringValue(input.formData.cuidadosDomicilioEgresoHosp)}, ${this.readStringValue(input.formData.dietaEgresoHosp)}, ${this.readStringValue(input.formData.actividadRestriccionesEgresoHosp)},
        ${this.readStringValue(input.formData.seguimientoEgresoHosp)}, ${this.parseOptionalDate(input.formData.fechaProximaCitaEgresoHosp)}, ${this.readStringValue(input.formData.signosAlarmaEgresoHosp)}, ${this.readStringValue(input.formData.educacionOtorgadaEgresoHosp)},
        ${this.readStringValue(input.formData.comprensionPacienteEgresoHosp)}, ${this.readRoundedNumericValue(input.formData.diasIncapacidadEgresoHosp)}, ${this.readStringValue(input.formData.tipoIncapacidadEgresoHosp)}, ${this.readStringValue(input.formData.pronosticoEgresoHosp)},
        ${this.readStringValue(input.formData.medicoResponsableEgresoHosp) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaResponsableEgresoHosp) || 'Sin cédula'},
        ${this.readStringValue(input.formData.medicoLegalEgresoHosp) || 'Sin profesional responsable'}, ${this.readStringValue(input.formData.cedulaLegalEgresoHosp)}, ${this.readStringValue(input.formData.especialidadLegalEgresoHosp)},
        ${this.readStringValue(input.formData.lugarAtencionEgresoHosp)}, ${signedAt ? input.userId : null}, ${signedAt}, ${signedAt},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)}, NOW(),
        NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "dischargeType" = EXCLUDED."dischargeType",
        "patientDestination" = EXCLUDED."patientDestination",
        "receivingUnit" = EXCLUDED."receivingUnit",
        "dischargedAt" = EXCLUDED."dischargedAt",
        "admittedAt" = EXCLUDED."admittedAt",
        "stayDays" = EXCLUDED."stayDays",
        "dischargeCondition" = EXCLUDED."dischargeCondition",
        "admissionReason" = EXCLUDED."admissionReason",
        "admissionDiagnosis" = EXCLUDED."admissionDiagnosis",
        "finalDiagnosis" = EXCLUDED."finalDiagnosis",
        "cie10" = EXCLUDED."cie10",
        "performedProcedures" = EXCLUDED."performedProcedures",
        "managementPerformed" = EXCLUDED."managementPerformed",
        "stayEvolution" = EXCLUDED."stayEvolution",
        "pendingClinicalProblems" = EXCLUDED."pendingClinicalProblems",
        "additionalNarrativeSummary" = EXCLUDED."additionalNarrativeSummary",
        "dischargeMedications" = EXCLUDED."dischargeMedications",
        "linkedPrescriptionId" = EXCLUDED."linkedPrescriptionId",
        "prescriptionGenerated" = EXCLUDED."prescriptionGenerated",
        "prescriptionJustification" = EXCLUDED."prescriptionJustification",
        "homeCare" = EXCLUDED."homeCare",
        "diet" = EXCLUDED."diet",
        "activityRestrictions" = EXCLUDED."activityRestrictions",
        "followUp" = EXCLUDED."followUp",
        "nextAppointmentDate" = EXCLUDED."nextAppointmentDate",
        "alarmSigns" = EXCLUDED."alarmSigns",
        "patientEducation" = EXCLUDED."patientEducation",
        "patientComprehension" = EXCLUDED."patientComprehension",
        "incapacityDays" = EXCLUDED."incapacityDays",
        "incapacityType" = EXCLUDED."incapacityType",
        "prognosis" = EXCLUDED."prognosis",
        "responsiblePhysicianName" = EXCLUDED."responsiblePhysicianName",
        "responsiblePhysicianLicense" = EXCLUDED."responsiblePhysicianLicense",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "closedEncounterAt" = EXCLUDED."closedEncounterAt",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryPreprocedureAssessment(input: {
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
      !this.isAmbulatoryPreprocedureRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const hasAnesthesia = this.ambulatoryPreprocedureHasAnesthesia(input.formData);
    const documentHash = this.readStringValue(input.formData.hashPreproc);
    const digitalSeal = this.readStringValue(input.formData.selloDigitalPreproc);

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryPreprocedureAssessment" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt",
        "preoperativeDiagnosis", "preoperativeCie10", "indicatedProcedure",
        "procedureCode", "procedureCodeSystem", "clinicalIndication",
        "procedureType", "currentSymptoms", "illnessEvolution",
        "relevantHistoryDetail", "physicalExam", "preoperativeStudies",
        "anesthesiaPlanned", "hasAnesthesia", "asaClassification",
        "surgicalRisk", "cardiovascularRisk", "capriniThromboembolicRisk",
        "informedProcedureRisks", "prognosis", "indicatedProphylaxis",
        "clinicalAlerts", "preoperativePreparation", "fastingHours",
        "fastingConfirmed", "medicationSuspension", "prophylacticAntibiotic",
        "specialPreparation", "professionalName", "professionalLicense",
        "professionalSpecialty", "careLocation", "signerUserId", "signedAt",
        "documentHash", "digitalSeal", "procedureStageEnabled",
        "pdfGeneratedAt", "pdfFileName", "pdfDownloadCount",
        "pdfLastDownloadedAt", "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt},
        ${this.readStringValue(input.formData.diagnosticoPreoperatorioPreproc)}, ${this.readStringValue(input.formData.cie10Preproc)}, ${this.readStringValue(input.formData.procedimientoIndicadoPreproc)},
        ${this.readStringValue(input.formData.codigoProcedimientoPreproc)}, ${this.readStringValue(input.formData.catalogoProcedimientoPreproc)}, ${this.readStringValue(input.formData.indicacionClinicaPreproc)},
        ${this.readStringValue(input.formData.tipoProcedimientoPreproc)}, ${this.readStringValue(input.formData.sintomasActualesPreproc)}, ${this.readStringValue(input.formData.evolucionPadecimientoPreproc)},
        ${this.readStringValue(input.formData.detalleAntecedentesPreproc)}, ${this.readStringValue(input.formData.exploracionFisicaPreproc)}, ${this.readStringValue(input.formData.estudiosPreoperatoriosPreproc)},
        ${this.readStringValue(input.formData.tipoAnestesiaPrevistaPreproc)}, ${hasAnesthesia}, ${this.readStringValue(input.formData.clasificacionAsaPreproc)},
        ${this.readStringValue(input.formData.riesgoQuirurgicoPreproc)}, ${this.readStringValue(input.formData.riesgoCardiovascularPreproc)}, ${this.readStringValue(input.formData.riesgoTromboembolicoCapriniPreproc)},
        ${this.readStringValue(input.formData.riesgosInformadosPreproc)}, ${this.readStringValue(input.formData.pronosticoPreproc)}, ${this.readStringValue(input.formData.profilaxisIndicadaPreproc)},
        ${this.readStringValue(input.formData.alertasClinicasPreproc)}, ${this.readStringValue(input.formData.preparacionPreoperatoriaPreproc)}, ${this.readNumericValue(input.formData.horasAyunoPreproc)},
        ${this.readStringValue(input.formData.ayunoConfirmadoPreproc)}, ${this.readStringValue(input.formData.suspensionMedicamentosPreproc)}, ${this.readStringValue(input.formData.atbProfilacticoPreproc)},
        ${this.readStringValue(input.formData.preparacionEspecialPreproc)}, ${this.readStringValue(input.formData.profesionalNombrePreproc)}, ${this.readStringValue(input.formData.profesionalCedulaPreproc)},
        ${this.readStringValue(input.formData.profesionalEspecialidadPreproc)}, ${this.readStringValue(input.formData.lugarAtencionPreproc)}, ${signedAt ? input.userId : null}, ${signedAt},
        ${documentHash}, ${digitalSeal}, ${input.status === EncounterRecordStatus.SIGNED},
        ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? `${this.sanitizeFileName(input.title)}.pdf` : null}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0},
        ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "preoperativeDiagnosis" = EXCLUDED."preoperativeDiagnosis",
        "preoperativeCie10" = EXCLUDED."preoperativeCie10",
        "indicatedProcedure" = EXCLUDED."indicatedProcedure",
        "procedureCode" = EXCLUDED."procedureCode",
        "procedureCodeSystem" = EXCLUDED."procedureCodeSystem",
        "clinicalIndication" = EXCLUDED."clinicalIndication",
        "procedureType" = EXCLUDED."procedureType",
        "currentSymptoms" = EXCLUDED."currentSymptoms",
        "illnessEvolution" = EXCLUDED."illnessEvolution",
        "relevantHistoryDetail" = EXCLUDED."relevantHistoryDetail",
        "physicalExam" = EXCLUDED."physicalExam",
        "preoperativeStudies" = EXCLUDED."preoperativeStudies",
        "anesthesiaPlanned" = EXCLUDED."anesthesiaPlanned",
        "hasAnesthesia" = EXCLUDED."hasAnesthesia",
        "asaClassification" = EXCLUDED."asaClassification",
        "surgicalRisk" = EXCLUDED."surgicalRisk",
        "cardiovascularRisk" = EXCLUDED."cardiovascularRisk",
        "capriniThromboembolicRisk" = EXCLUDED."capriniThromboembolicRisk",
        "informedProcedureRisks" = EXCLUDED."informedProcedureRisks",
        "prognosis" = EXCLUDED."prognosis",
        "indicatedProphylaxis" = EXCLUDED."indicatedProphylaxis",
        "clinicalAlerts" = EXCLUDED."clinicalAlerts",
        "preoperativePreparation" = EXCLUDED."preoperativePreparation",
        "fastingHours" = EXCLUDED."fastingHours",
        "fastingConfirmed" = EXCLUDED."fastingConfirmed",
        "medicationSuspension" = EXCLUDED."medicationSuspension",
        "prophylacticAntibiotic" = EXCLUDED."prophylacticAntibiotic",
        "specialPreparation" = EXCLUDED."specialPreparation",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "procedureStageEnabled" = EXCLUDED."procedureStageEnabled",
        "pdfGeneratedAt" = EXCLUDED."pdfGeneratedAt",
        "pdfFileName" = EXCLUDED."pdfFileName",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const [assessment] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryPreprocedureAssessment"
      WHERE "sectionRecordId" = ${input.sectionRecordId}
      LIMIT 1
    `;

    if (!assessment) {
      return;
    }

    await this.syncAmbulatoryPreprocedureChildren(assessment.id, input);
  }

  private async syncAmbulatoryProcedureDocument(input: {
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
    if (!this.isAmbulatoryProcedureRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const hasAnesthesia = this.ambulatoryProcedureHasAnesthesia(input.formData);
    const procedureDate =
      this.parseOptionalDate(input.formData.fechaProcedimientoProc) ??
      input.recordedAt;
    const documentHash = this.readStringValue(input.formData.hashProc);
    const digitalSeal = this.readStringValue(input.formData.selloDigitalProc);
    const [preprocedureAssessment] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryPreprocedureAssessment"
      WHERE "encounterId" = ${input.encounter.id} AND "status" = ${EncounterRecordStatus.SIGNED}
      ORDER BY "versionNumber" DESC, "signedAt" DESC NULLS LAST, "createdAt" DESC
      LIMIT 1
    `;

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryProcedureDocument" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "preprocedureAssessmentId", "versionNumber", "title", "status",
        "recordedAt", "procedureDate", "realStartTime", "realEndTime",
        "durationMinutes", "operatingRoom", "procedureCode",
        "preoperativeDiagnosis", "preoperativeCie10", "postoperativeDiagnosis",
        "postoperativeCie10", "performedProcedure", "anesthesiaType",
        "anesthesiaMedications", "anesthesiaEvents", "anesthesiaAlerts",
        "hasAnesthesia", "surgicalTechnique", "transoperativeFindings",
        "woundClassification", "estimatedBleedingMl", "ivFluids",
        "transfusions", "drainsPlaced", "implantsDevices", "lotsSeries",
        "spongeInstrumentCount", "surgicalSpecimenDescription",
        "sentToPathology", "pathologyFolio", "hadComplications",
        "openConversion", "complicationType", "complicationManagement",
        "postprocedureDestination", "requiresMonitoring",
        "immediatePostprocedureIndications", "destinationAlert",
        "availableForDischarge", "professionalName", "professionalLicense",
        "professionalSpecialty", "careLocation", "signerUserId", "signedAt",
        "documentHash", "digitalSeal", "pdfGeneratedAt", "pdfFileName",
        "pdfDownloadCount", "pdfLastDownloadedAt", "contentJson",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${preprocedureAssessment?.id ?? null}, ${versionNumber}, ${input.title}, ${input.status},
        ${input.recordedAt}, ${procedureDate}, ${this.readStringValue(input.formData.horaInicioRealProc)}, ${this.readStringValue(input.formData.horaFinRealProc)},
        ${this.readRoundedNumericValue(input.formData.duracionMinutosProc)}, ${this.readStringValue(input.formData.salaQuirofanoProc)}, ${this.readStringValue(input.formData.codigoProcedimientoProc)},
        ${this.readStringValue(input.formData.diagnosticoPreoperatorioProc)}, ${this.readStringValue(input.formData.ciePreoperatorioProc)}, ${this.readStringValue(input.formData.diagnosticoPostoperatorioProc)},
        ${this.readStringValue(input.formData.ciePostoperatorioProc)}, ${this.readStringValue(input.formData.procedimientoRealizadoProc)}, ${this.readStringValue(input.formData.tipoAnestesiaProc) || 'NO_APLICA'},
        ${this.readStringValue(input.formData.medicamentosAnestesicosProc)}, ${this.readStringValue(input.formData.eventosAnestesicosProc)}, ${this.readStringValue(input.formData.alertasAnestesiaProc)},
        ${hasAnesthesia}, ${this.readStringValue(input.formData.tecnicaQuirurgicaProc)}, ${this.readStringValue(input.formData.hallazgosTransoperatoriosProc)},
        ${this.readStringValue(input.formData.clasificacionHeridaProc)}, ${this.readNumericValue(input.formData.sangradoEstimadoMlProc) ?? 0}, ${this.readStringValue(input.formData.liquidosIvProc)},
        ${this.readStringValue(input.formData.transfusionesProc)}, ${this.readStringValue(input.formData.drenajesColocadosProc)}, ${this.readStringValue(input.formData.implantesDispositivosProc)}, ${this.readStringValue(input.formData.lotesSeriesProc)},
        ${this.readStringValue(input.formData.cuentaGasasInstrumentalProc)}, ${this.readStringValue(input.formData.descripcionPiezaProc)},
        ${this.readStringValue(input.formData.envioPatologiaProc)}, ${this.readStringValue(input.formData.folioPatologiaProc)}, ${this.readStringValue(input.formData.huboComplicacionesProc)},
        ${this.readStringValue(input.formData.conversionAbiertaProc)}, ${this.readStringValue(input.formData.tipoComplicacionProc)}, ${this.readStringValue(input.formData.manejoComplicacionProc)},
        ${this.readStringValue(input.formData.destinoPostprocedimientoProc)}, ${this.readStringValue(input.formData.requiereMonitorizacionProc)},
        ${this.readStringValue(input.formData.indicacionesInmediatasProc)}, ${this.readStringValue(input.formData.alertaDestinoProc)},
        ${input.status === EncounterRecordStatus.SIGNED}, ${this.readStringValue(input.formData.profesionalNombreProc)}, ${this.readStringValue(input.formData.profesionalCedulaProc)},
        ${this.readStringValue(input.formData.profesionalEspecialidadProc)}, ${this.readStringValue(input.formData.lugarAtencionProc)}, ${signedAt ? input.userId : null}, ${signedAt},
        ${documentHash}, ${digitalSeal}, ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? `${this.sanitizeFileName(input.title)}.pdf` : null},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)},
        NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "preprocedureAssessmentId" = EXCLUDED."preprocedureAssessmentId",
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "procedureDate" = EXCLUDED."procedureDate",
        "realStartTime" = EXCLUDED."realStartTime",
        "realEndTime" = EXCLUDED."realEndTime",
        "durationMinutes" = EXCLUDED."durationMinutes",
        "operatingRoom" = EXCLUDED."operatingRoom",
        "procedureCode" = EXCLUDED."procedureCode",
        "preoperativeDiagnosis" = EXCLUDED."preoperativeDiagnosis",
        "preoperativeCie10" = EXCLUDED."preoperativeCie10",
        "postoperativeDiagnosis" = EXCLUDED."postoperativeDiagnosis",
        "postoperativeCie10" = EXCLUDED."postoperativeCie10",
        "performedProcedure" = EXCLUDED."performedProcedure",
        "anesthesiaType" = EXCLUDED."anesthesiaType",
        "anesthesiaMedications" = EXCLUDED."anesthesiaMedications",
        "anesthesiaEvents" = EXCLUDED."anesthesiaEvents",
        "anesthesiaAlerts" = EXCLUDED."anesthesiaAlerts",
        "hasAnesthesia" = EXCLUDED."hasAnesthesia",
        "surgicalTechnique" = EXCLUDED."surgicalTechnique",
        "transoperativeFindings" = EXCLUDED."transoperativeFindings",
        "woundClassification" = EXCLUDED."woundClassification",
        "estimatedBleedingMl" = EXCLUDED."estimatedBleedingMl",
        "ivFluids" = EXCLUDED."ivFluids",
        "transfusions" = EXCLUDED."transfusions",
        "drainsPlaced" = EXCLUDED."drainsPlaced",
        "implantsDevices" = EXCLUDED."implantsDevices",
        "lotsSeries" = EXCLUDED."lotsSeries",
        "spongeInstrumentCount" = EXCLUDED."spongeInstrumentCount",
        "surgicalSpecimenDescription" = EXCLUDED."surgicalSpecimenDescription",
        "sentToPathology" = EXCLUDED."sentToPathology",
        "pathologyFolio" = EXCLUDED."pathologyFolio",
        "hadComplications" = EXCLUDED."hadComplications",
        "openConversion" = EXCLUDED."openConversion",
        "complicationType" = EXCLUDED."complicationType",
        "complicationManagement" = EXCLUDED."complicationManagement",
        "postprocedureDestination" = EXCLUDED."postprocedureDestination",
        "requiresMonitoring" = EXCLUDED."requiresMonitoring",
        "immediatePostprocedureIndications" = EXCLUDED."immediatePostprocedureIndications",
        "destinationAlert" = EXCLUDED."destinationAlert",
        "availableForDischarge" = EXCLUDED."availableForDischarge",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "pdfGeneratedAt" = EXCLUDED."pdfGeneratedAt",
        "pdfFileName" = EXCLUDED."pdfFileName",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const [procedureDocument] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryProcedureDocument"
      WHERE "sectionRecordId" = ${input.sectionRecordId}
      LIMIT 1
    `;

    if (!procedureDocument) {
      return;
    }

    await this.syncAmbulatoryProcedureChildren(procedureDocument.id, input);
  }

  private async syncAmbulatoryRecoveryEvaluation(input: {
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
      !this.isAmbulatoryRecoveryEvaluationRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const documentHash = this.readStringValue(input.formData.hashRecEval);
    const digitalSeal = this.readStringValue(input.formData.selloDigitalRecEval);
    const aldreteTotal = this.calculateAldreteTotal(input.formData);
    const alerts = this.buildAmbulatoryRecoveryEvaluationAlerts(
      input.formData,
      aldreteTotal,
    );
    const redAlertActive = alerts.some((alert) => alert.severity === 'ROJO');
    const readyForDischarge =
      input.status === EncounterRecordStatus.SIGNED &&
      this.readStringValue(input.formData.destinoPostRecuperacionRecEval) ===
        'ALTA_AMBULATORIA' &&
      aldreteTotal !== null &&
      aldreteTotal >= 9 &&
      !redAlertActive &&
      this.ambulatoryRecoveryDischargeChecklistComplete(input.formData);
    const [procedureDocument] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryProcedureDocument"
      WHERE "encounterId" = ${input.encounter.id} AND "status" = ${EncounterRecordStatus.SIGNED}
      ORDER BY "versionNumber" DESC, "signedAt" DESC NULLS LAST, "createdAt" DESC
      LIMIT 1
    `;

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryRecoveryEvaluation" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "procedureDocumentId", "versionNumber", "title", "status",
        "recordedAt", "evaluationDate", "evaluationTime", "postprocedureTime",
        "monitoringFrequency", "patientSymptoms", "oralTolerance", "ambulation",
        "urination", "consciousnessState", "generalState", "postprocedureExam",
        "postprocedureComplications", "complicationManagement", "adverseEvent",
        "adverseEventAction", "surveillancePlan", "recoveryTimeMinutes",
        "postRecoveryDestination", "immediateChanges", "alertsSummary",
        "trafficLight", "redAlertActive", "readyForDischarge",
        "professionalName", "professionalLicense", "professionalSpecialty",
        "careLocation", "signerUserId", "signedAt", "documentHash",
        "digitalSeal", "pdfGeneratedAt", "pdfFileName", "pdfDownloadCount",
        "pdfLastDownloadedAt", "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${procedureDocument?.id ?? null}, ${versionNumber}, ${input.title}, ${input.status},
        ${input.recordedAt}, ${this.parseOptionalDate(input.formData.fechaRecEval)}, ${this.readStringValue(input.formData.horaValoracionRecEval)}, ${this.readStringValue(input.formData.tiempoPostprocedimientoRecEval)},
        ${this.readStringValue(input.formData.frecuenciaMonitoreoRecEval)}, ${this.readStringValue(input.formData.sintomasPacienteRecEval)}, ${this.readStringValue(input.formData.toleranciaViaOralRecEval)}, ${this.readStringValue(input.formData.deambulacionRecEval)},
        ${this.readStringValue(input.formData.miccionRecEval)}, ${this.readStringValue(input.formData.estadoConcienciaRecEval)}, ${this.readStringValue(input.formData.estadoGeneralRecEval)}, ${this.readStringValue(input.formData.exploracionPostprocedimientoRecEval)},
        ${this.readStringValue(input.formData.complicacionesPostprocedimientoRecEval)}, ${this.readStringValue(input.formData.manejoComplicacionRecEval)}, ${this.readStringValue(input.formData.eventoAdversoRecEval)},
        ${this.readStringValue(input.formData.descripcionAccionEventoRecEval)}, ${this.readStringValue(input.formData.planVigilanciaRecEval)}, ${this.readRoundedNumericValue(input.formData.tiempoEnRecuperacionMinRecEval)},
        ${this.readStringValue(input.formData.destinoPostRecuperacionRecEval)}, ${this.readStringValue(input.formData.cambiosValoracionInmediataRecEval)}, ${this.readStringValue(input.formData.alertasAutomaticasRecEval)},
        ${this.readStringValue(input.formData.semaforoRecEval)}, ${redAlertActive}, ${readyForDischarge},
        ${this.readStringValue(input.formData.profesionalNombreRecEval)}, ${this.readStringValue(input.formData.profesionalCedulaRecEval)}, ${this.readStringValue(input.formData.profesionalEspecialidadRecEval)},
        ${this.readStringValue(input.formData.lugarAtencionRecEval)}, ${signedAt ? input.userId : null}, ${signedAt}, ${documentHash},
        ${digitalSeal}, ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? `${this.sanitizeFileName(input.title)}.pdf` : null}, ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0},
        ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "procedureDocumentId" = EXCLUDED."procedureDocumentId",
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "evaluationDate" = EXCLUDED."evaluationDate",
        "evaluationTime" = EXCLUDED."evaluationTime",
        "postprocedureTime" = EXCLUDED."postprocedureTime",
        "monitoringFrequency" = EXCLUDED."monitoringFrequency",
        "patientSymptoms" = EXCLUDED."patientSymptoms",
        "oralTolerance" = EXCLUDED."oralTolerance",
        "ambulation" = EXCLUDED."ambulation",
        "urination" = EXCLUDED."urination",
        "consciousnessState" = EXCLUDED."consciousnessState",
        "generalState" = EXCLUDED."generalState",
        "postprocedureExam" = EXCLUDED."postprocedureExam",
        "postprocedureComplications" = EXCLUDED."postprocedureComplications",
        "complicationManagement" = EXCLUDED."complicationManagement",
        "adverseEvent" = EXCLUDED."adverseEvent",
        "adverseEventAction" = EXCLUDED."adverseEventAction",
        "surveillancePlan" = EXCLUDED."surveillancePlan",
        "recoveryTimeMinutes" = EXCLUDED."recoveryTimeMinutes",
        "postRecoveryDestination" = EXCLUDED."postRecoveryDestination",
        "immediateChanges" = EXCLUDED."immediateChanges",
        "alertsSummary" = EXCLUDED."alertsSummary",
        "trafficLight" = EXCLUDED."trafficLight",
        "redAlertActive" = EXCLUDED."redAlertActive",
        "readyForDischarge" = EXCLUDED."readyForDischarge",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "pdfGeneratedAt" = EXCLUDED."pdfGeneratedAt",
        "pdfFileName" = EXCLUDED."pdfFileName",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const [recoveryEvaluation] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryRecoveryEvaluation"
      WHERE "sectionRecordId" = ${input.sectionRecordId}
      LIMIT 1
    `;
    if (!recoveryEvaluation) {
      return;
    }

    await this.syncAmbulatoryRecoveryEvaluationChildren(
      recoveryEvaluation.id,
      input,
      alerts,
      aldreteTotal,
    );
  }

  private async syncAmbulatoryDischargePrescription(input: {
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
      !this.isAmbulatoryDischargePrescriptionRecord(
        input.encounter.encounterType,
        input.tabKey,
      )
    ) {
      return;
    }

    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const validations = this.buildAmbulatoryDischargePrescriptionValidations({
      encounter: input.encounter,
      formData: input.formData,
    });
    const qrActive =
      input.status === EncounterRecordStatus.SIGNED ||
      this.readStringValue(input.formData.qrActivoRecetaEgreso) === 'SI';

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryDischargePrescription" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "prescriptionFolio",
        "prescriptionType", "issuedAt", "validity", "issuerInstitution",
        "physicianRfc", "sanitaryLicense", "verificationQr", "qrActive",
        "allergyAlerts", "medicationValidationSummary", "medicationTrafficLight",
        "dietInstructions", "physicalActivityLevel", "physicalActivityDetail",
        "woundCare", "homeMonitoring", "alarmSigns", "followUpDate",
        "followUpType", "followUpReason", "patientEducation",
        "patientUnderstands", "companionInformed", "professionalName",
        "professionalLicense", "professionalSpecialty", "careLocation",
        "signerUserId", "signedAt", "documentHash", "digitalSeal",
        "prescriptionPdfGeneratedAt", "completePdfGeneratedAt", "pdfFileName",
        "pdfDownloadCount", "pdfLastDownloadedAt", "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt}, ${this.readStringValue(input.formData.folioRecetaEgreso)},
        ${this.readStringValue(input.formData.tipoRecetaEgreso)}, ${this.parseOptionalDate(input.formData.fechaEmisionRecetaEgreso)}, ${this.readStringValue(input.formData.vigenciaRecetaEgreso)}, ${this.readStringValue(input.formData.institucionEmisoraRecetaEgreso)},
        ${this.readStringValue(input.formData.rfcMedicoRecetaEgreso)}, ${this.readStringValue(input.formData.licenciaSanitariaRecetaEgreso)}, ${this.readStringValue(input.formData.qrVerificacionRecetaEgreso)}, ${qrActive},
        ${this.readStringValue(input.formData.alertasAlergiasRecetaEgreso)}, ${this.readStringValue(input.formData.validacionesMedicamentosRecetaEgreso)}, ${this.readStringValue(input.formData.semaforoMedicamentosRecetaEgreso)},
        ${this.readStringValue(input.formData.dietaIndicacionesEgreso)}, ${this.readStringValue(input.formData.actividadFisicaNivelEgreso)}, ${this.readStringValue(input.formData.actividadFisicaDetalleEgreso)},
        ${this.readStringValue(input.formData.cuidadosHeridaEgreso)}, ${this.readStringValue(input.formData.vigilanciaDomiciliariaEgreso)}, ${this.readStringValue(input.formData.signosAlarmaEgreso)}, ${this.parseOptionalDate(input.formData.fechaCitaSeguimientoEgreso)},
        ${this.readStringValue(input.formData.tipoCitaSeguimientoEgreso)}, ${this.readStringValue(input.formData.motivoCitaSeguimientoEgreso)}, ${this.readStringValue(input.formData.educacionOtorgadaEgreso)},
        ${Boolean(input.formData.pacienteComprendeIndicacionesEgreso)}, ${Boolean(input.formData.familiarInformadoEgreso)}, ${this.readStringValue(input.formData.profesionalNombreRecetaEgreso)},
        ${this.readStringValue(input.formData.profesionalCedulaRecetaEgreso)}, ${this.readStringValue(input.formData.profesionalEspecialidadRecetaEgreso)}, ${this.readStringValue(input.formData.lugarAtencionRecetaEgreso)},
        ${signedAt ? input.userId : null}, ${signedAt}, ${this.readStringValue(input.formData.hashRecetaEgreso)}, ${this.readStringValue(input.formData.selloDigitalRecetaEgreso)},
        ${signedAt}, ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? `${this.sanitizeFileName(input.title)}.pdf` : null},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber",
        "title" = EXCLUDED."title",
        "status" = EXCLUDED."status",
        "recordedAt" = EXCLUDED."recordedAt",
        "prescriptionFolio" = EXCLUDED."prescriptionFolio",
        "prescriptionType" = EXCLUDED."prescriptionType",
        "issuedAt" = EXCLUDED."issuedAt",
        "validity" = EXCLUDED."validity",
        "issuerInstitution" = EXCLUDED."issuerInstitution",
        "physicianRfc" = EXCLUDED."physicianRfc",
        "sanitaryLicense" = EXCLUDED."sanitaryLicense",
        "verificationQr" = EXCLUDED."verificationQr",
        "qrActive" = EXCLUDED."qrActive",
        "allergyAlerts" = EXCLUDED."allergyAlerts",
        "medicationValidationSummary" = EXCLUDED."medicationValidationSummary",
        "medicationTrafficLight" = EXCLUDED."medicationTrafficLight",
        "dietInstructions" = EXCLUDED."dietInstructions",
        "physicalActivityLevel" = EXCLUDED."physicalActivityLevel",
        "physicalActivityDetail" = EXCLUDED."physicalActivityDetail",
        "woundCare" = EXCLUDED."woundCare",
        "homeMonitoring" = EXCLUDED."homeMonitoring",
        "alarmSigns" = EXCLUDED."alarmSigns",
        "followUpDate" = EXCLUDED."followUpDate",
        "followUpType" = EXCLUDED."followUpType",
        "followUpReason" = EXCLUDED."followUpReason",
        "patientEducation" = EXCLUDED."patientEducation",
        "patientUnderstands" = EXCLUDED."patientUnderstands",
        "companionInformed" = EXCLUDED."companionInformed",
        "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense",
        "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation",
        "signerUserId" = EXCLUDED."signerUserId",
        "signedAt" = EXCLUDED."signedAt",
        "documentHash" = EXCLUDED."documentHash",
        "digitalSeal" = EXCLUDED."digitalSeal",
        "prescriptionPdfGeneratedAt" = EXCLUDED."prescriptionPdfGeneratedAt",
        "completePdfGeneratedAt" = EXCLUDED."completePdfGeneratedAt",
        "pdfFileName" = EXCLUDED."pdfFileName",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount",
        "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson",
        "updatedAt" = NOW()
    `;

    const [prescription] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryDischargePrescription"
      WHERE "sectionRecordId" = ${input.sectionRecordId}
      LIMIT 1
    `;
    if (!prescription) {
      return;
    }
    await this.syncAmbulatoryDischargePrescriptionChildren(
      prescription.id,
      input,
      validations,
    );
  }

  private async syncAmbulatoryDischargeSummary(input: {
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
    if (!this.isAmbulatoryDischargeRecord(input.encounter.encounterType, input.tabKey)) {
      return;
    }
    const versionNumber = this.readNumericValue(input.metadata.versionNumber) ?? 1;
    const signedAt =
      input.status === EncounterRecordStatus.SIGNED ? new Date() : null;
    const completedCriteria = this.ambulatoryDischargeCriteriaComplete(input.formData);

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryDischargeSummary" (
        "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
        "versionNumber", "title", "status", "recordedAt", "dischargeType",
        "destination", "dischargeDate", "dischargeTime", "finalDiagnosis",
        "finalCie10", "dischargeCondition", "clinicalStatusAtDischarge",
        "prognosis", "procedureReason", "performedProcedure", "recoveryEvolution",
        "statusSummaryAtDischarge", "linkedPrescriptionPlan", "linkedMedications",
        "linkedPrescriptionFolio", "followUp", "disabilityDays", "disabilityType",
        "patientEducation", "patientUnderstands", "companionInformed",
        "responsiblePhysician", "responsiblePhysicianLicense", "professionalName",
        "professionalLicense", "professionalSpecialty", "careLocation",
        "closureWarning", "signerUserId", "signedAt", "closedEncounterAt",
        "documentHash", "digitalSeal", "pdfGeneratedAt", "pdfFileName",
        "pdfDownloadCount", "pdfLastDownloadedAt", "contentJson", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.encounter.id}, ${input.encounter.patientId}, ${input.sectionRecordId},
        ${versionNumber}, ${input.title}, ${input.status}, ${input.recordedAt}, ${this.readStringValue(input.formData.tipoEgresoAmb)},
        ${this.readStringValue(input.formData.destinoEgresoAmb)}, ${this.parseOptionalDate(input.formData.fechaEgresoAmb)}, ${this.readStringValue(input.formData.horaEgresoAmb)}, ${this.readStringValue(input.formData.diagnosticoFinalEgresoAmb)},
        ${this.readStringValue(input.formData.cie10EgresoAmb)}, ${this.readStringValue(input.formData.condicionesEgresoAmb)}, ${this.readStringValue(input.formData.estadoClinicoEgresoAmb)},
        ${this.readStringValue(input.formData.pronosticoEgresoAmb)}, ${this.readStringValue(input.formData.motivoProcedimientoEgresoAmb)}, ${this.readStringValue(input.formData.procedimientoRealizadoEgresoAmb)}, ${this.readStringValue(input.formData.evolucionRecuperacionEgresoAmb)},
        ${this.readStringValue(input.formData.estadoAlEgresoResumenAmb)}, ${this.readStringValue(input.formData.planVinculadoRecetaEgresoAmb)}, ${this.readStringValue(input.formData.medicamentosRecetaEgresoAmb)},
        ${this.readStringValue(input.formData.recetaRelacionadaEgresoAmb)}, ${this.readStringValue(input.formData.seguimientoEgresoAmb)}, ${this.readRoundedNumericValue(input.formData.diasIncapacidadEgresoAmb)}, ${this.readStringValue(input.formData.tipoIncapacidadEgresoAmb)},
        ${this.readStringValue(input.formData.educacionPacienteEgresoAmb)}, ${Boolean(input.formData.pacienteComprendeEgresoAmb)}, ${Boolean(input.formData.familiarInformadoEgresoAmb)},
        ${this.readStringValue(input.formData.medicoAutorizaEgresoAmb)}, ${this.readStringValue(input.formData.cedulaAutorizaEgresoAmb)}, ${this.readStringValue(input.formData.profesionalNombreEgresoAmb)},
        ${this.readStringValue(input.formData.profesionalCedulaEgresoAmb)}, ${this.readStringValue(input.formData.profesionalEspecialidadEgresoAmb)}, ${this.readStringValue(input.formData.lugarAtencionEgresoAmb)},
        ${this.readStringValue(input.formData.alertaCierreEgresoAmb)}, ${signedAt ? input.userId : null}, ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? signedAt : null},
        ${this.readStringValue(input.formData.hashEgresoAmb)}, ${this.readStringValue(input.formData.selloDigitalEgresoAmb)}, ${signedAt}, ${input.status === EncounterRecordStatus.SIGNED ? `${this.sanitizeFileName(input.title)}.pdf` : null},
        ${this.readNumericValue(input.metadata.pdfDownloadCount) ?? 0}, ${this.parseOptionalDate(input.metadata.pdfLastDownloadedAt)}, ${this.jsonbParameter(input.formData)}, NOW(), NOW()
      )
      ON CONFLICT ("sectionRecordId") DO UPDATE SET
        "versionNumber" = EXCLUDED."versionNumber", "title" = EXCLUDED."title",
        "status" = EXCLUDED."status", "recordedAt" = EXCLUDED."recordedAt",
        "dischargeType" = EXCLUDED."dischargeType", "destination" = EXCLUDED."destination",
        "dischargeDate" = EXCLUDED."dischargeDate", "dischargeTime" = EXCLUDED."dischargeTime",
        "finalDiagnosis" = EXCLUDED."finalDiagnosis", "finalCie10" = EXCLUDED."finalCie10",
        "dischargeCondition" = EXCLUDED."dischargeCondition", "clinicalStatusAtDischarge" = EXCLUDED."clinicalStatusAtDischarge",
        "prognosis" = EXCLUDED."prognosis", "procedureReason" = EXCLUDED."procedureReason",
        "performedProcedure" = EXCLUDED."performedProcedure", "recoveryEvolution" = EXCLUDED."recoveryEvolution",
        "statusSummaryAtDischarge" = EXCLUDED."statusSummaryAtDischarge",
        "linkedPrescriptionPlan" = EXCLUDED."linkedPrescriptionPlan", "linkedMedications" = EXCLUDED."linkedMedications",
        "linkedPrescriptionFolio" = EXCLUDED."linkedPrescriptionFolio", "followUp" = EXCLUDED."followUp",
        "disabilityDays" = EXCLUDED."disabilityDays", "disabilityType" = EXCLUDED."disabilityType",
        "patientEducation" = EXCLUDED."patientEducation", "patientUnderstands" = EXCLUDED."patientUnderstands",
        "companionInformed" = EXCLUDED."companionInformed", "responsiblePhysician" = EXCLUDED."responsiblePhysician",
        "responsiblePhysicianLicense" = EXCLUDED."responsiblePhysicianLicense", "professionalName" = EXCLUDED."professionalName",
        "professionalLicense" = EXCLUDED."professionalLicense", "professionalSpecialty" = EXCLUDED."professionalSpecialty",
        "careLocation" = EXCLUDED."careLocation", "closureWarning" = EXCLUDED."closureWarning",
        "documentHash" = EXCLUDED."documentHash", "digitalSeal" = EXCLUDED."digitalSeal",
        "pdfDownloadCount" = EXCLUDED."pdfDownloadCount", "pdfLastDownloadedAt" = EXCLUDED."pdfLastDownloadedAt",
        "contentJson" = EXCLUDED."contentJson", "updatedAt" = NOW()
    `;
    const [summary] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "AmbulatoryDischargeSummary"
      WHERE "sectionRecordId" = ${input.sectionRecordId}
      LIMIT 1
    `;
    if (!summary) {
      return;
    }
    await this.syncAmbulatoryDischargeSummaryChildren(summary.id, input, completedCriteria);
  }

  private async syncAmbulatoryPreprocedureChildren(
    assessmentId: string,
    input: {
      sectionRecordId: string;
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryPreprocedureRelevantHistory" WHERE "assessmentId" = ${assessmentId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryPreprocedureComorbidity" WHERE "assessmentId" = ${assessmentId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryPreprocedureAllergy" WHERE "assessmentId" = ${assessmentId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryPreprocedureMedication" WHERE "assessmentId" = ${assessmentId}
    `;

    const historyOptions = [
      ['antDiabetesPreproc', 'Diabetes'],
      ['antHipertensionPreproc', 'Hipertensión'],
      ['antCardiopatiaPreproc', 'Cardiopatía'],
      ['antCoagulopatiaPreproc', 'Coagulopatía'],
      ['antHepatopatiaPreproc', 'Hepatopatía'],
      ['antEnfermedadRenalPreproc', 'Enfermedad renal'],
      ['antAlergiasMedicamentosasPreproc', 'Alergias medicamentosas'],
      ['antCirugiasPreviasPreproc', 'Cirugías previas'],
      ['antTabaquismoPreproc', 'Tabaquismo'],
    ];
    for (const [conditionKey, label] of historyOptions) {
      if (!Boolean(input.formData[conditionKey])) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryPreprocedureRelevantHistory" (
          "id", "assessmentId", "conditionKey", "label", "present", "detail", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${assessmentId}, ${conditionKey}, ${label}, true, ${this.readStringValue(input.formData.detalleAntecedentesPreproc)}, NOW(), NOW()
        )
      `;
    }

    for (const item of this.readObjectArray(input.formData.comorbilidadesPreproc)) {
      if (!this.hasCapturedValue(item.diagnostico) && !this.hasCapturedValue(item.cie10)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryPreprocedureComorbidity" (
          "id", "assessmentId", "diagnosis", "cie10", "controlStatus", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${assessmentId}, ${this.readStringValue(item.diagnostico)}, ${this.readStringValue(item.cie10)}, ${this.readStringValue(item.estado)}, NOW(), NOW()
        )
      `;
    }

    for (const item of this.readObjectArray(input.formData.alergiasPreproc)) {
      if (!this.hasCapturedValue(item.sustancia)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryPreprocedureAllergy" (
          "id", "assessmentId", "substance", "reaction", "severity", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${assessmentId}, ${this.readStringValue(item.sustancia)}, ${this.readStringValue(item.reaccion)}, ${this.readStringValue(item.severidad)}, NOW(), NOW()
        )
      `;
    }

    for (const item of this.readObjectArray(input.formData.medicacionActualPreproc)) {
      if (!this.hasCapturedValue(item.farmaco)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryPreprocedureMedication" (
          "id", "assessmentId", "drugName", "dose", "frequency", "sourceFromRecord", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${assessmentId}, ${this.readStringValue(item.farmaco)}, ${this.readStringValue(item.dosis)}, ${this.readStringValue(item.frecuencia)}, false, NOW(), NOW()
        )
      `;
    }

    await this.syncAmbulatoryPreprocedureOneToOneChildren(assessmentId, input);
  }

  private async syncAmbulatoryRecoveryEvaluationChildren(
    recoveryEvaluationId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
    alerts: Array<{
      severity: 'VERDE' | 'AMARILLO' | 'ROJO';
      code: string;
      message: string;
      sourceMetric: string;
    }>,
    aldreteTotal: number | null,
  ) {
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryRecoveryAlert" WHERE "recoveryEvaluationId" = ${recoveryEvaluationId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryRecoveryNursingRecord" WHERE "recoveryEvaluationId" = ${recoveryEvaluationId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryRecoveryAuxiliaryService" WHERE "recoveryEvaluationId" = ${recoveryEvaluationId}
    `;

    await this.syncAmbulatoryRecoveryVitals(recoveryEvaluationId, input);
    await this.syncAmbulatoryRecoveryAldrete(
      recoveryEvaluationId,
      input,
      aldreteTotal,
    );
    await this.syncAmbulatoryRecoveryDischargeChecklist(
      recoveryEvaluationId,
      input,
    );

    for (const alert of alerts) {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryRecoveryAlert" (
          "id", "recoveryEvaluationId", "severity", "code", "message",
          "sourceMetric", "createdAt"
        )
        VALUES (
          ${randomUUID()}, ${recoveryEvaluationId}, ${alert.severity},
          ${alert.code}, ${alert.message}, ${alert.sourceMetric}, NOW()
        )
      `;
    }

    for (const item of this.readObjectArray(input.formData.registrosEnfermeriaRecEval)) {
      if (!this.hasCapturedValue(item.fecha) && !this.hasCapturedValue(item.hora)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryRecoveryNursingRecord" (
          "id", "recoveryEvaluationId", "recordDate", "recordTime", "shift",
          "authorName", "habitusExterior", "medicationAdministration",
          "nursingProcedures", "painEva", "fallRisk", "observations",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${recoveryEvaluationId}, ${this.parseOptionalDate(item.fecha)}, ${this.readStringValue(item.hora)}, ${this.readStringValue(item.turno)},
          ${this.readStringValue(item.nombreElabora)}, ${this.readStringValue(item.habitusExterior)}, ${this.readStringValue(item.ministracionMedicamentos)},
          ${this.readStringValue(item.procedimientosEnfermeria)}, ${this.readRoundedNumericValue(item.dolorEva)}, ${this.readStringValue(item.riesgoCaidas)}, ${this.readStringValue(item.observaciones)},
          NOW(), NOW()
        )
      `;
    }

    for (const item of this.readObjectArray(input.formData.serviciosAuxiliaresRecEval)) {
      if (!this.hasCapturedValue(item.estudioSolicitado) && !this.hasCapturedValue(item.folioEstudio)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryRecoveryAuxiliaryService" (
          "id", "recoveryEvaluationId", "studyDateTime", "requestedStudy",
          "clinicalProblem", "incidentsOrAccidents", "resultsDescription",
          "treatingPhysicianInterpretation", "physicianName", "studyFolio",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${recoveryEvaluationId}, ${this.parseOptionalDate(item.fechaHoraEstudio)}, ${this.readStringValue(item.estudioSolicitado)},
          ${this.readStringValue(item.problemaClinico)}, ${this.readStringValue(item.incidentesAccidentes)}, ${this.readStringValue(item.descripcionResultados)},
          ${this.readStringValue(item.interpretacionMedico)}, ${this.readStringValue(item.nombreMedico)}, ${this.readStringValue(item.folioEstudio)},
          NOW(), NOW()
        )
      `;
    }
  }

  private async syncAmbulatoryDischargePrescriptionChildren(
    prescriptionId: string,
    input: {
      formData: Record<string, unknown>;
    },
    validations: Array<{
      severity: 'VERDE' | 'AMARILLO' | 'ROJO';
      validationType: string;
      message: string;
      blocking: boolean;
    }>,
  ) {
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryDischargePrescriptionMedication" WHERE "prescriptionId" = ${prescriptionId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryDischargePrescriptionValidation" WHERE "prescriptionId" = ${prescriptionId}
    `;

    for (const item of this.readObjectArray(input.formData.medicamentosRecetaEgreso)) {
      if (!this.hasCapturedValue(item.medicamento)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryDischargePrescriptionMedication" (
          "id", "prescriptionId", "medicationName", "dose", "route",
          "frequency", "duration", "medicationType", "indication",
          "sourceCatalogId", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${prescriptionId}, ${this.readStringValue(item.medicamento)}, ${this.readStringValue(item.dosis)}, ${this.readStringValue(item.via)},
          ${this.readStringValue(item.frecuencia)}, ${this.readStringValue(item.duracion)}, ${this.readStringValue(item.tipo)}, ${this.readStringValue(item.indicacion)},
          ${this.readStringValue(item.sourceCatalogId)}, NOW(), NOW()
        )
      `;
    }

    for (const validation of validations) {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryDischargePrescriptionValidation" (
          "id", "prescriptionId", "severity", "validationType", "message",
          "blocking", "createdAt"
        )
        VALUES (
          ${randomUUID()}, ${prescriptionId}, ${validation.severity}, ${validation.validationType},
          ${validation.message}, ${validation.blocking}, NOW()
        )
      `;
    }
  }

  private async syncAmbulatoryDischargeSummaryChildren(
    summaryId: string,
    input: {
      formData: Record<string, unknown>;
    },
    completedCriteria: boolean,
  ) {
    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryDischargeVitalSnapshot" (
        "id", "dischargeSummaryId", "bloodPressure", "heartRate",
        "respiratoryRate", "temperatureC", "oxygenSaturation",
        "capillaryGlucose", "painEva", "aldreteScore", "prognosis",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${summaryId}, ${this.readStringValue(input.formData.taEgresoAmb)}, ${this.readRoundedNumericValue(input.formData.fcEgresoAmb)},
        ${this.readRoundedNumericValue(input.formData.frEgresoAmb)}, ${this.readNumericValue(input.formData.temperaturaEgresoAmb)}, ${this.readNumericValue(input.formData.spo2EgresoAmb)},
        ${this.readNumericValue(input.formData.glucosaCapilarEgresoAmb)}, ${this.readRoundedNumericValue(input.formData.evaDolorEgresoAmb)}, ${this.readRoundedNumericValue(input.formData.aldreteEgresoAmb)}, ${this.readStringValue(input.formData.pronosticoEgresoAmb)},
        NOW(), NOW()
      )
      ON CONFLICT ("dischargeSummaryId") DO UPDATE SET
        "bloodPressure" = EXCLUDED."bloodPressure",
        "heartRate" = EXCLUDED."heartRate",
        "respiratoryRate" = EXCLUDED."respiratoryRate",
        "temperatureC" = EXCLUDED."temperatureC",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "capillaryGlucose" = EXCLUDED."capillaryGlucose",
        "painEva" = EXCLUDED."painEva",
        "aldreteScore" = EXCLUDED."aldreteScore",
        "prognosis" = EXCLUDED."prognosis",
        "updatedAt" = NOW()
    `;
    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryDischargeCriteria" (
        "id", "dischargeSummaryId", "stableVitalsOneHour", "controlledPain",
        "oralTolerance", "independentAmbulation", "spontaneousUrination",
        "woundsWithoutBleeding", "aldreteAtLeastNine", "responsibleCompanion",
        "writtenInstructionsDelivered", "prescriptionDelivered", "meetsCriteria",
        "finalAldrete", "completed", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${summaryId}, ${Boolean(input.formData.altaSignosEstablesEgresoAmb)}, ${Boolean(input.formData.altaDolorControladoEgresoAmb)},
        ${Boolean(input.formData.altaToleraViaOralEgresoAmb)}, ${Boolean(input.formData.altaDeambulacionEgresoAmb)}, ${Boolean(input.formData.altaMiccionEgresoAmb)},
        ${Boolean(input.formData.altaHeridasSinSangradoEgresoAmb)}, ${Boolean(input.formData.altaAldreteMayor9EgresoAmb)}, ${Boolean(input.formData.altaAcompananteEgresoAmb)},
        ${Boolean(input.formData.altaIndicacionesEntregadasEgresoAmb)}, ${Boolean(input.formData.altaRecetaEntregadaEgresoAmb)}, ${this.readStringValue(input.formData.cumpleCriteriosAltaEgresoAmb)},
        ${this.readRoundedNumericValue(input.formData.aldreteFinalEgresoAmb)}, ${completedCriteria}, NOW(), NOW()
      )
      ON CONFLICT ("dischargeSummaryId") DO UPDATE SET
        "stableVitalsOneHour" = EXCLUDED."stableVitalsOneHour",
        "controlledPain" = EXCLUDED."controlledPain",
        "oralTolerance" = EXCLUDED."oralTolerance",
        "independentAmbulation" = EXCLUDED."independentAmbulation",
        "spontaneousUrination" = EXCLUDED."spontaneousUrination",
        "woundsWithoutBleeding" = EXCLUDED."woundsWithoutBleeding",
        "aldreteAtLeastNine" = EXCLUDED."aldreteAtLeastNine",
        "responsibleCompanion" = EXCLUDED."responsibleCompanion",
        "writtenInstructionsDelivered" = EXCLUDED."writtenInstructionsDelivered",
        "prescriptionDelivered" = EXCLUDED."prescriptionDelivered",
        "meetsCriteria" = EXCLUDED."meetsCriteria",
        "finalAldrete" = EXCLUDED."finalAldrete",
        "completed" = EXCLUDED."completed",
        "updatedAt" = NOW()
    `;
    if (['TRASLADO', 'REFERENCIA'].includes(this.readStringValue(input.formData.tipoEgresoAmb))) {
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryDischargeTransferReference" (
          "id", "dischargeSummaryId", "referenceDateTime", "referralReason",
          "clinicalSummary", "physicalExam", "studyResults", "diagnoses",
          "previousTreatmentPlan", "prognosis", "sendingFacility",
          "receivingFacility", "receivingPhysician", "transportMethod",
          "transportConditions", "transferVitalSigns", "issuingPhysician",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${summaryId}, ${this.parseOptionalDate(input.formData.referenciaFechaHoraEgresoAmb)}, ${this.readStringValue(input.formData.referenciaMotivoEnvioEgresoAmb)},
          ${this.readStringValue(input.formData.referenciaResumenClinicoEgresoAmb)}, ${this.readStringValue(input.formData.referenciaExploracionFisicaEgresoAmb)}, ${this.readStringValue(input.formData.referenciaResultadosEstudiosEgresoAmb)}, ${this.readStringValue(input.formData.referenciaDiagnosticosEgresoAmb)},
          ${this.readStringValue(input.formData.referenciaPlanTratamientoEgresoAmb)}, ${this.readStringValue(input.formData.referenciaPronosticoEgresoAmb)}, ${this.readStringValue(input.formData.referenciaEstablecimientoEnviaEgresoAmb)},
          ${this.readStringValue(input.formData.referenciaEstablecimientoReceptorEgresoAmb)}, ${this.readStringValue(input.formData.referenciaMedicoReceptorEgresoAmb)}, ${this.readStringValue(input.formData.referenciaMedioTrasladoEgresoAmb)},
          ${this.readStringValue(input.formData.referenciaCondicionesTrasladoEgresoAmb)}, ${this.readStringValue(input.formData.referenciaSignosVitalesEgresoAmb)}, ${this.readStringValue(input.formData.referenciaMedicoEmisorEgresoAmb)},
          NOW(), NOW()
        )
        ON CONFLICT ("dischargeSummaryId") DO UPDATE SET
          "referenceDateTime" = EXCLUDED."referenceDateTime",
          "referralReason" = EXCLUDED."referralReason",
          "clinicalSummary" = EXCLUDED."clinicalSummary",
          "physicalExam" = EXCLUDED."physicalExam",
          "studyResults" = EXCLUDED."studyResults",
          "diagnoses" = EXCLUDED."diagnoses",
          "previousTreatmentPlan" = EXCLUDED."previousTreatmentPlan",
          "prognosis" = EXCLUDED."prognosis",
          "sendingFacility" = EXCLUDED."sendingFacility",
          "receivingFacility" = EXCLUDED."receivingFacility",
          "receivingPhysician" = EXCLUDED."receivingPhysician",
          "transportMethod" = EXCLUDED."transportMethod",
          "transportConditions" = EXCLUDED."transportConditions",
          "transferVitalSigns" = EXCLUDED."transferVitalSigns",
          "issuingPhysician" = EXCLUDED."issuingPhysician",
          "updatedAt" = NOW()
      `;
    } else {
      await this.prisma.$executeRaw`
        DELETE FROM "AmbulatoryDischargeTransferReference" WHERE "dischargeSummaryId" = ${summaryId}
      `;
    }
  }

  private async syncAmbulatoryRecoveryVitals(
    recoveryEvaluationId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryRecoveryVitalMeasurement" (
        "id", "recoveryEvaluationId", "systolicBloodPressure",
        "diastolicBloodPressure", "heartRate", "respiratoryRate",
        "oxygenSaturation", "temperatureC", "painEva", "glasgow",
        "capillaryGlucose", "measuredAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${recoveryEvaluationId}, ${this.readRoundedNumericValue(input.formData.taSistolicaRecEval)},
        ${this.readRoundedNumericValue(input.formData.taDiastolicaRecEval)}, ${this.readRoundedNumericValue(input.formData.fcRecEval)}, ${this.readRoundedNumericValue(input.formData.frRecEval)},
        ${this.readNumericValue(input.formData.spo2RecEval)}, ${this.readNumericValue(input.formData.temperaturaRecEval)}, ${this.readRoundedNumericValue(input.formData.dolorEvaRecEval)}, ${this.readRoundedNumericValue(input.formData.glasgowRecEval)},
        ${this.readNumericValue(input.formData.glucosaCapilarRecEval)}, ${input.recordedAt}, NOW(), NOW()
      )
      ON CONFLICT ("recoveryEvaluationId") DO UPDATE SET
        "systolicBloodPressure" = EXCLUDED."systolicBloodPressure",
        "diastolicBloodPressure" = EXCLUDED."diastolicBloodPressure",
        "heartRate" = EXCLUDED."heartRate",
        "respiratoryRate" = EXCLUDED."respiratoryRate",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "temperatureC" = EXCLUDED."temperatureC",
        "painEva" = EXCLUDED."painEva",
        "glasgow" = EXCLUDED."glasgow",
        "capillaryGlucose" = EXCLUDED."capillaryGlucose",
        "measuredAt" = EXCLUDED."measuredAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryRecoveryAldrete(
    recoveryEvaluationId: string,
    input: {
      formData: Record<string, unknown>;
    },
    aldreteTotal: number | null,
  ) {
    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryRecoveryAldreteScore" (
        "id", "recoveryEvaluationId", "motorActivity", "respiration",
        "circulation", "consciousness", "oxygenSaturation", "totalScore",
        "interpretation", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${recoveryEvaluationId}, ${this.readRoundedNumericValue(input.formData.aldreteActividadRecEval)}, ${this.readRoundedNumericValue(input.formData.aldreteRespiracionRecEval)},
        ${this.readRoundedNumericValue(input.formData.aldreteCirculacionRecEval)}, ${this.readRoundedNumericValue(input.formData.aldreteConcienciaRecEval)}, ${this.readRoundedNumericValue(input.formData.aldreteSpo2RecEval)}, ${aldreteTotal},
        ${this.readStringValue(input.formData.aldreteInterpretacionRecEval)}, NOW(), NOW()
      )
      ON CONFLICT ("recoveryEvaluationId") DO UPDATE SET
        "motorActivity" = EXCLUDED."motorActivity",
        "respiration" = EXCLUDED."respiration",
        "circulation" = EXCLUDED."circulation",
        "consciousness" = EXCLUDED."consciousness",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "totalScore" = EXCLUDED."totalScore",
        "interpretation" = EXCLUDED."interpretation",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryRecoveryDischargeChecklist(
    recoveryEvaluationId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    const completed = this.ambulatoryRecoveryDischargeChecklistComplete(
      input.formData,
    );

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryRecoveryDischargeChecklist" (
        "id", "recoveryEvaluationId", "oralToleranceWithoutNausea",
        "independentAmbulation", "spontaneousUrination", "controlledPain",
        "noNauseaVomiting", "stableVitalsOneHour", "woundsWithoutBleeding",
        "aldreteAtLeastNine", "responsibleCompanionPresent",
        "dischargeInstructionsDelivered", "completed", "completedAt",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${recoveryEvaluationId}, ${Boolean(input.formData.altaToleraViaOralRecEval)},
        ${Boolean(input.formData.altaDeambulacionIndependienteRecEval)}, ${Boolean(input.formData.altaMiccionEspontaneaRecEval)}, ${Boolean(input.formData.altaDolorControladoRecEval)},
        ${Boolean(input.formData.altaSinNauseaVomitoRecEval)}, ${Boolean(input.formData.altaSignosVitalesEstablesRecEval)}, ${Boolean(input.formData.altaHeridasSinSangradoRecEval)},
        ${Boolean(input.formData.altaAldreteMayorIgual9RecEval)}, ${Boolean(input.formData.altaAcompananteResponsableRecEval)},
        ${Boolean(input.formData.altaInstruccionesEntregadasRecEval)}, ${completed}, ${completed ? input.recordedAt : null},
        NOW(), NOW()
      )
      ON CONFLICT ("recoveryEvaluationId") DO UPDATE SET
        "oralToleranceWithoutNausea" = EXCLUDED."oralToleranceWithoutNausea",
        "independentAmbulation" = EXCLUDED."independentAmbulation",
        "spontaneousUrination" = EXCLUDED."spontaneousUrination",
        "controlledPain" = EXCLUDED."controlledPain",
        "noNauseaVomiting" = EXCLUDED."noNauseaVomiting",
        "stableVitalsOneHour" = EXCLUDED."stableVitalsOneHour",
        "woundsWithoutBleeding" = EXCLUDED."woundsWithoutBleeding",
        "aldreteAtLeastNine" = EXCLUDED."aldreteAtLeastNine",
        "responsibleCompanionPresent" = EXCLUDED."responsibleCompanionPresent",
        "dischargeInstructionsDelivered" = EXCLUDED."dischargeInstructionsDelivered",
        "completed" = EXCLUDED."completed",
        "completedAt" = EXCLUDED."completedAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryProcedureChildren(
    procedureDocumentId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryProcedureTeamMember" WHERE "procedureDocumentId" = ${procedureDocumentId}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "AmbulatoryProcedureMaterial" WHERE "procedureDocumentId" = ${procedureDocumentId}
    `;

    const teamMembers = [
      ['CIRUJANO_PRINCIPAL', input.formData.cirujanoPrincipalProc, input.formData.cedulaCirujanoProc],
      ['PRIMER_AYUDANTE', input.formData.primerAyudanteProc, null],
      ['SEGUNDO_AYUDANTE', input.formData.segundoAyudanteProc, null],
      ['ANESTESIOLOGO', input.formData.anestesiologoProc, input.formData.cedulaAnestesiologoProc],
      ['INSTRUMENTISTA', input.formData.instrumentistaProc, null],
      ['ENFERMERIA_CIRCULANTE', input.formData.enfermeriaCirculanteProc, null],
    ];
    for (const [role, fullName, professionalLicense] of teamMembers) {
      if (!this.hasCapturedValue(fullName)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureTeamMember" (
          "id", "procedureDocumentId", "role", "fullName", "professionalLicense", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${procedureDocumentId}, ${role}, ${this.readStringValue(fullName)}, ${this.readStringValue(professionalLicense)}, NOW(), NOW()
        )
      `;
    }

    for (const item of this.readObjectArray(input.formData.materialesProc)) {
      if (!this.hasCapturedValue(item.nombre)) {
        continue;
      }
      await this.prisma.$executeRaw`
        INSERT INTO "AmbulatoryProcedureMaterial" (
          "id", "procedureDocumentId", "name", "quantity", "lotSerial", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${procedureDocumentId}, ${this.readStringValue(item.nombre)}, ${this.readStringValue(item.cantidad)}, ${this.readStringValue(item.loteSerie)}, NOW(), NOW()
        )
      `;
    }

    await this.syncAmbulatoryProcedureTimeOut(procedureDocumentId, input);
    await this.syncAmbulatoryProcedurePostanesthesia(procedureDocumentId, input);
  }

  private async syncAmbulatoryProcedureTimeOut(
    procedureDocumentId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    const completed = [
      'toPacienteVerificadoProc',
      'toProcedimientoConfirmadoProc',
      'toSitioConfirmadoProc',
      'toRealizadoAntesIncisionProc',
      'toProfilaxisAntibioticaProc',
      'toEquipoInstrumentalProc',
      'toConsentimientoVerificadoProc',
      'toImagenesDisponiblesProc',
    ].every((fieldKey) => Boolean(input.formData[fieldKey]));

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryProcedureTimeOutChecklist" (
        "id", "procedureDocumentId", "patientVerified", "procedureConfirmed",
        "surgicalSiteConfirmed", "timeOutBeforeIncision",
        "antibioticProphylaxisAdministered", "equipmentInstrumentalVerified",
        "informedConsentVerified", "imagingAvailableInRoom", "completed",
        "completedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${procedureDocumentId}, ${Boolean(input.formData.toPacienteVerificadoProc)}, ${Boolean(input.formData.toProcedimientoConfirmadoProc)},
        ${Boolean(input.formData.toSitioConfirmadoProc)}, ${Boolean(input.formData.toRealizadoAntesIncisionProc)},
        ${Boolean(input.formData.toProfilaxisAntibioticaProc)}, ${Boolean(input.formData.toEquipoInstrumentalProc)},
        ${Boolean(input.formData.toConsentimientoVerificadoProc)}, ${Boolean(input.formData.toImagenesDisponiblesProc)}, ${completed},
        ${completed ? input.recordedAt : null}, NOW(), NOW()
      )
      ON CONFLICT ("procedureDocumentId") DO UPDATE SET
        "patientVerified" = EXCLUDED."patientVerified",
        "procedureConfirmed" = EXCLUDED."procedureConfirmed",
        "surgicalSiteConfirmed" = EXCLUDED."surgicalSiteConfirmed",
        "timeOutBeforeIncision" = EXCLUDED."timeOutBeforeIncision",
        "antibioticProphylaxisAdministered" = EXCLUDED."antibioticProphylaxisAdministered",
        "equipmentInstrumentalVerified" = EXCLUDED."equipmentInstrumentalVerified",
        "informedConsentVerified" = EXCLUDED."informedConsentVerified",
        "imagingAvailableInRoom" = EXCLUDED."imagingAvailableInRoom",
        "completed" = EXCLUDED."completed",
        "completedAt" = EXCLUDED."completedAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryProcedurePostanesthesia(
    procedureDocumentId: string,
    input: {
      formData: Record<string, unknown>;
    },
  ) {
    if (!this.ambulatoryProcedureHasAnesthesia(input.formData)) {
      await this.prisma.$executeRaw`
        DELETE FROM "AmbulatoryProcedurePostanestheticNote" WHERE "procedureDocumentId" = ${procedureDocumentId}
      `;
      return;
    }

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryProcedurePostanestheticNote" (
        "id", "procedureDocumentId", "anestheticMedicationsUsed",
        "anesthesiaDuration", "bloodApplied", "solutionsApplied",
        "anesthesiaIncidents", "clinicalStatusAtRoomDischarge",
        "postanestheticManagementPlan", "anesthesiologistName",
        "anesthesiologistLicense", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${procedureDocumentId}, ${this.readStringValue(input.formData.postMedicamentosAnestesicosProc)},
        ${this.readStringValue(input.formData.postDuracionAnestesiaProc)}, ${this.readStringValue(input.formData.postSangreAplicadaProc)}, ${this.readStringValue(input.formData.postSolucionesAplicadasProc)},
        ${this.readStringValue(input.formData.postIncidentesAnestesiaProc)}, ${this.readStringValue(input.formData.postEstadoClinicoEgresoSalaProc)},
        ${this.readStringValue(input.formData.postPlanManejoProc)}, ${this.readStringValue(input.formData.postNombreAnestesiologoProc)},
        ${this.readStringValue(input.formData.postCedulaAnestesiologoProc)}, NOW(), NOW()
      )
      ON CONFLICT ("procedureDocumentId") DO UPDATE SET
        "anestheticMedicationsUsed" = EXCLUDED."anestheticMedicationsUsed",
        "anesthesiaDuration" = EXCLUDED."anesthesiaDuration",
        "bloodApplied" = EXCLUDED."bloodApplied",
        "solutionsApplied" = EXCLUDED."solutionsApplied",
        "anesthesiaIncidents" = EXCLUDED."anesthesiaIncidents",
        "clinicalStatusAtRoomDischarge" = EXCLUDED."clinicalStatusAtRoomDischarge",
        "postanestheticManagementPlan" = EXCLUDED."postanestheticManagementPlan",
        "anesthesiologistName" = EXCLUDED."anesthesiologistName",
        "anesthesiologistLicense" = EXCLUDED."anesthesiologistLicense",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryPreprocedureOneToOneChildren(
    assessmentId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    const checklistCompleted = [
      'omsPacienteIdentificadoPreproc',
      'omsProcedimientoConfirmadoPreproc',
      'omsSitioQuirurgicoMarcadoPreproc',
      'omsConsentimientoFirmadoPreproc',
      'omsAlergiasVerificadasPreproc',
      'omsEstudiosDisponiblesPreproc',
      'omsAyunoVerificadoPreproc',
      'omsProfilaxisAntibioticaIndicadaPreproc',
    ].every((fieldKey) => Boolean(input.formData[fieldKey]));

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryPreprocedureRiskAssessment" (
        "id", "assessmentId", "asaClassification", "surgicalRisk",
        "cardiovascularRisk", "capriniThromboembolicRisk",
        "informedProcedureRisks", "prognosis", "indicatedProphylaxis",
        "clinicalAlerts", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${assessmentId}, ${this.readStringValue(input.formData.clasificacionAsaPreproc)}, ${this.readStringValue(input.formData.riesgoQuirurgicoPreproc)},
        ${this.readStringValue(input.formData.riesgoCardiovascularPreproc)}, ${this.readStringValue(input.formData.riesgoTromboembolicoCapriniPreproc)},
        ${this.readStringValue(input.formData.riesgosInformadosPreproc)}, ${this.readStringValue(input.formData.pronosticoPreproc)}, ${this.readStringValue(input.formData.profilaxisIndicadaPreproc)},
        ${this.readStringValue(input.formData.alertasClinicasPreproc)}, NOW(), NOW()
      )
      ON CONFLICT ("assessmentId") DO UPDATE SET
        "asaClassification" = EXCLUDED."asaClassification",
        "surgicalRisk" = EXCLUDED."surgicalRisk",
        "cardiovascularRisk" = EXCLUDED."cardiovascularRisk",
        "capriniThromboembolicRisk" = EXCLUDED."capriniThromboembolicRisk",
        "informedProcedureRisks" = EXCLUDED."informedProcedureRisks",
        "prognosis" = EXCLUDED."prognosis",
        "indicatedProphylaxis" = EXCLUDED."indicatedProphylaxis",
        "clinicalAlerts" = EXCLUDED."clinicalAlerts",
        "updatedAt" = NOW()
    `;

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryPreprocedureSafetyChecklist" (
        "id", "assessmentId", "patientIdentified", "procedureConfirmed",
        "surgicalSiteMarked", "consentSigned", "allergiesVerified",
        "studiesAvailable", "fastingVerified", "antibioticProphylaxisIndicated",
        "completed", "completedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${assessmentId}, ${Boolean(input.formData.omsPacienteIdentificadoPreproc)}, ${Boolean(input.formData.omsProcedimientoConfirmadoPreproc)},
        ${Boolean(input.formData.omsSitioQuirurgicoMarcadoPreproc)}, ${Boolean(input.formData.omsConsentimientoFirmadoPreproc)}, ${Boolean(input.formData.omsAlergiasVerificadasPreproc)},
        ${Boolean(input.formData.omsEstudiosDisponiblesPreproc)}, ${Boolean(input.formData.omsAyunoVerificadoPreproc)}, ${Boolean(input.formData.omsProfilaxisAntibioticaIndicadaPreproc)},
        ${checklistCompleted}, ${checklistCompleted ? input.recordedAt : null}, NOW(), NOW()
      )
      ON CONFLICT ("assessmentId") DO UPDATE SET
        "patientIdentified" = EXCLUDED."patientIdentified",
        "procedureConfirmed" = EXCLUDED."procedureConfirmed",
        "surgicalSiteMarked" = EXCLUDED."surgicalSiteMarked",
        "consentSigned" = EXCLUDED."consentSigned",
        "allergiesVerified" = EXCLUDED."allergiesVerified",
        "studiesAvailable" = EXCLUDED."studiesAvailable",
        "fastingVerified" = EXCLUDED."fastingVerified",
        "antibioticProphylaxisIndicated" = EXCLUDED."antibioticProphylaxisIndicated",
        "completed" = EXCLUDED."completed",
        "completedAt" = EXCLUDED."completedAt",
        "updatedAt" = NOW()
    `;

    await this.syncAmbulatoryPreprocedureVitals(assessmentId, input);
    await this.syncAmbulatoryPreprocedurePreanesthesia(assessmentId, input);
    await this.syncAmbulatoryPreprocedureConsent(assessmentId, input);
  }

  private async syncAmbulatoryPreprocedureVitals(
    assessmentId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    const weight = this.readNumericValue(input.formData.pesoKgPreproc);
    const height = this.readNumericValue(input.formData.tallaCmPreproc);
    const bloodPressure = this.readStringValue(input.formData.taPreproc);
    const heartRate = this.readRoundedNumericValue(input.formData.fcPreproc);
    const respiratoryRate = this.readRoundedNumericValue(input.formData.frPreproc);
    const oxygenSaturation = this.readNumericValue(input.formData.spo2Preproc);
    const temperature = this.readNumericValue(input.formData.temperaturaPreproc);

    if (
      weight === null ||
      height === null ||
      !bloodPressure ||
      heartRate === null ||
      respiratoryRate === null ||
      oxygenSaturation === null ||
      temperature === null
    ) {
      await this.prisma.$executeRaw`
        DELETE FROM "AmbulatoryPreprocedureVitalMeasurement" WHERE "assessmentId" = ${assessmentId}
      `;
      return;
    }

    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryPreprocedureVitalMeasurement" (
        "id", "assessmentId", "weightKg", "heightCm", "bmi", "bloodPressure",
        "heartRate", "respiratoryRate", "oxygenSaturation", "temperatureC",
        "capillaryGlucose", "measuredAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${assessmentId}, ${weight}, ${height}, ${this.readNumericValue(input.formData.imcPreproc)}, ${bloodPressure},
        ${heartRate}, ${respiratoryRate}, ${oxygenSaturation}, ${temperature},
        ${this.readNumericValue(input.formData.glucosaCapilarPreproc)}, ${input.recordedAt}, NOW(), NOW()
      )
      ON CONFLICT ("assessmentId") DO UPDATE SET
        "weightKg" = EXCLUDED."weightKg",
        "heightCm" = EXCLUDED."heightCm",
        "bmi" = EXCLUDED."bmi",
        "bloodPressure" = EXCLUDED."bloodPressure",
        "heartRate" = EXCLUDED."heartRate",
        "respiratoryRate" = EXCLUDED."respiratoryRate",
        "oxygenSaturation" = EXCLUDED."oxygenSaturation",
        "temperatureC" = EXCLUDED."temperatureC",
        "capillaryGlucose" = EXCLUDED."capillaryGlucose",
        "measuredAt" = EXCLUDED."measuredAt",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryPreprocedurePreanesthesia(
    assessmentId: string,
    input: {
      formData: Record<string, unknown>;
    },
  ) {
    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryPreprocedurePreanestheticEvaluation" (
        "id", "assessmentId", "anesthesiaPlanned", "mallampati", "mouthOpening",
        "cervicalMobility", "thyromentalDistance", "anestheticRisk",
        "functionalCapacityMets", "functionalLimitation", "clinicalEvaluation",
        "anestheticHistory", "anesthesiaPlanType", "anesthesiaSpecificRisk",
        "anesthesiaRelevantAllergies", "anesthesiaPlan", "anesthesiologistName",
        "anesthesiologistLicense", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${assessmentId}, ${this.readStringValue(input.formData.tipoAnestesiaPrevistaPreproc)}, ${this.readStringValue(input.formData.mallampatiPreproc)}, ${this.readStringValue(input.formData.aperturaBucalPreproc)},
        ${this.readStringValue(input.formData.movilidadCervicalPreproc)}, ${this.readStringValue(input.formData.distanciaTiromentonianaPreproc)}, ${this.readStringValue(input.formData.riesgoAnestesicoPreproc)},
        ${this.readStringValue(input.formData.capacidadFuncionalMetsPreproc)}, ${this.readStringValue(input.formData.limitacionFuncionalPreproc)}, ${this.readStringValue(input.formData.evaluacionClinicaAnestesiaPreproc)},
        ${this.readStringValue(input.formData.antecedentesAnestesicosPreproc)}, ${this.readStringValue(input.formData.tipoAnestesiaPlaneadaPreproc)}, ${this.readStringValue(input.formData.riesgoAnestesicoNom006Preproc)},
        ${this.readStringValue(input.formData.alergiasAnestesiaPreproc)}, ${this.readStringValue(input.formData.planAnestesicoPreproc)}, ${this.readStringValue(input.formData.nombreAnestesiologoPreproc)},
        ${this.readStringValue(input.formData.cedulaAnestesiologoPreproc)}, NOW(), NOW()
      )
      ON CONFLICT ("assessmentId") DO UPDATE SET
        "anesthesiaPlanned" = EXCLUDED."anesthesiaPlanned",
        "mallampati" = EXCLUDED."mallampati",
        "mouthOpening" = EXCLUDED."mouthOpening",
        "cervicalMobility" = EXCLUDED."cervicalMobility",
        "thyromentalDistance" = EXCLUDED."thyromentalDistance",
        "anestheticRisk" = EXCLUDED."anestheticRisk",
        "functionalCapacityMets" = EXCLUDED."functionalCapacityMets",
        "functionalLimitation" = EXCLUDED."functionalLimitation",
        "clinicalEvaluation" = EXCLUDED."clinicalEvaluation",
        "anestheticHistory" = EXCLUDED."anestheticHistory",
        "anesthesiaPlanType" = EXCLUDED."anesthesiaPlanType",
        "anesthesiaSpecificRisk" = EXCLUDED."anesthesiaSpecificRisk",
        "anesthesiaRelevantAllergies" = EXCLUDED."anesthesiaRelevantAllergies",
        "anesthesiaPlan" = EXCLUDED."anesthesiaPlan",
        "anesthesiologistName" = EXCLUDED."anesthesiologistName",
        "anesthesiologistLicense" = EXCLUDED."anesthesiologistLicense",
        "updatedAt" = NOW()
    `;
  }

  private async syncAmbulatoryPreprocedureConsent(
    assessmentId: string,
    input: {
      recordedAt: Date;
      formData: Record<string, unknown>;
    },
  ) {
    await this.prisma.$executeRaw`
      INSERT INTO "AmbulatoryPreprocedureInformedConsent" (
        "id", "assessmentId", "institutionName", "legalName", "documentTitle",
        "placeAndDate", "surgicalConsentStatus", "anesthesiaConsentStatus",
        "consentSignedDate", "explainingPhysician", "authorizedAct",
        "expectedRisks", "expectedBenefits", "contingencyAuthorization",
        "patientExplanation", "authorizerName", "relationshipToPatient",
        "witnessOneName", "witnessTwoName", "performerName",
        "patientUnderstands", "responsibleInformed", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${assessmentId}, ${this.readStringValue(input.formData.institucionConsentimientoPreproc)}, ${this.readStringValue(input.formData.razonSocialConsentimientoPreproc)}, ${this.readStringValue(input.formData.tituloDocumentoConsentimientoPreproc)},
        ${this.readStringValue(input.formData.lugarFechaConsentimientoPreproc)}, ${this.readStringValue(input.formData.consentimientoQuirurgicoPreproc)}, ${this.readStringValue(input.formData.consentimientoAnestesicoPreproc)},
        ${this.parseOptionalDate(input.formData.fechaFirmaConsentimientoPreproc) ?? input.recordedAt}, ${this.readStringValue(input.formData.medicoExplicaPreproc)}, ${this.readStringValue(input.formData.actoAutorizadoPreproc)},
        ${this.readStringValue(input.formData.riesgosEsperadosPreproc)}, ${this.readStringValue(input.formData.beneficiosEsperadosPreproc)}, ${this.readStringValue(input.formData.autorizacionContingenciasPreproc)},
        ${this.readStringValue(input.formData.explicacionPacientePreproc)}, ${this.readStringValue(input.formData.nombreAutorizaPreproc)}, ${this.readStringValue(input.formData.relacionPacientePreproc)},
        ${this.readStringValue(input.formData.nombreTestigo1Preproc)}, ${this.readStringValue(input.formData.nombreTestigo2Preproc)}, ${this.readStringValue(input.formData.nombreRealizaActoPreproc)},
        ${Boolean(input.formData.pacienteComprendePreproc)}, ${Boolean(input.formData.responsableInformadoPreproc)}, NOW(), NOW()
      )
      ON CONFLICT ("assessmentId") DO UPDATE SET
        "institutionName" = EXCLUDED."institutionName",
        "legalName" = EXCLUDED."legalName",
        "documentTitle" = EXCLUDED."documentTitle",
        "placeAndDate" = EXCLUDED."placeAndDate",
        "surgicalConsentStatus" = EXCLUDED."surgicalConsentStatus",
        "anesthesiaConsentStatus" = EXCLUDED."anesthesiaConsentStatus",
        "consentSignedDate" = EXCLUDED."consentSignedDate",
        "explainingPhysician" = EXCLUDED."explainingPhysician",
        "authorizedAct" = EXCLUDED."authorizedAct",
        "expectedRisks" = EXCLUDED."expectedRisks",
        "expectedBenefits" = EXCLUDED."expectedBenefits",
        "contingencyAuthorization" = EXCLUDED."contingencyAuthorization",
        "patientExplanation" = EXCLUDED."patientExplanation",
        "authorizerName" = EXCLUDED."authorizerName",
        "relationshipToPatient" = EXCLUDED."relationshipToPatient",
        "witnessOneName" = EXCLUDED."witnessOneName",
        "witnessTwoName" = EXCLUDED."witnessTwoName",
        "performerName" = EXCLUDED."performerName",
        "patientUnderstands" = EXCLUDED."patientUnderstands",
        "responsibleInformed" = EXCLUDED."responsibleInformed",
        "updatedAt" = NOW()
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
    for (const { key, label } of triageClinicalDiscriminatorFields) {
      if (input.formData[key] === true) {
        const otherDetail =
          key === 'discOtro'
            ? this.readStringValue(
                input.formData[triageOtherClinicalDiscriminatorFieldKey],
              ).trim()
            : '';
        alerts.push(otherDetail ? `${label}: ${otherDetail}` : label);
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

  private normalizeConsultationConsentComprehension(value: unknown) {
    const comprehensionValue = this.readStringValue(value).trim();

    if (!comprehensionValue) {
      return '';
    }

    if (
      consultationConsentComprehensionValues.includes(
        comprehensionValue as (typeof consultationConsentComprehensionValues)[number],
      )
    ) {
      return comprehensionValue;
    }

    throw new BadRequestException(
      'La comprensión del consentimiento informado no es válida',
    );
  }

  private normalizeConsultationPrescriptionPatientComprehension(value: unknown) {
    const comprehensionValue = this.readStringValue(value).trim();

    if (!comprehensionValue) {
      return '';
    }

    if (
      consultationPrescriptionPatientComprehensionValues.includes(
        comprehensionValue as (typeof consultationPrescriptionPatientComprehensionValues)[number],
      )
    ) {
      return comprehensionValue;
    }

    throw new BadRequestException(
      'La comprensión del paciente en receta no es válida',
    );
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
      (tabKey === consultationPrescriptionTabKey ||
        tabKey === legacyConsultationPrescriptionTabKey)
    );
  }

  private buildConsultationPrescriptionTitle(versionNumber: number) {
    return `Receta V${versionNumber}`;
  }

  private isConsultationDocumentRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return (
      (encounterType === EncounterType.OUTPATIENT ||
        encounterType === EncounterType.EMERGENCY ||
        encounterType === EncounterType.HOSPITALIZATION ||
        encounterType === EncounterType.SURGERY) &&
      tabKey === 'Documentos'
    );
  }

  private isHospitalDocumentRecord(encounterType: EncounterType, tabKey: string) {
    return encounterType === EncounterType.HOSPITALIZATION && tabKey === 'Documentos';
  }

  private isAmbulatoryProcedureSupportingDocumentRecord(
    encounterType: EncounterType,
    tabKey: string,
  ) {
    return encounterType === EncounterType.SURGERY && tabKey === 'Documentos';
  }

  private isConsultationClosureDocument(
    encounterType: EncounterType,
    tabKey: string,
    noteType: string,
  ) {
    return (
      encounterType === EncounterType.OUTPATIENT &&
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
      folio:
        typeof normalizedMetadata?.folio === 'string'
          ? normalizedMetadata.folio
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

  private readObjectArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
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

  private readUnknownFromJson(rawValue: Prisma.JsonValue | null, key: string) {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      return undefined;
    }

    return (rawValue as Record<string, unknown>)[key];
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

  private readRoundedNumericValue(value: unknown) {
    const numericValue = this.readNumericValue(value);
    return numericValue === null ? null : Math.round(numericValue);
  }

  private readNumericValueFromTimeLabel(value: unknown) {
    const rawValue = this.readStringValue(value);

    if (!rawValue) {
      return null;
    }

    const match = rawValue.match(/\d+/);
    return match ? Number(match[0]) : null;
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
        !this.isConsultationDocumentRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalAdmissionRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalEvolutionRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalMedicalOrdersRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalConsultationRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalSurgicalDocumentRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalNursingShiftRecord(record.encounterType, record.tabKey) &&
        !this.isHospitalDischargeRecord(record.encounterType, record.tabKey) &&
        !this.isAmbulatoryDischargePrescriptionRecord(record.encounterType, record.tabKey) &&
        !this.isAmbulatoryDischargeRecord(record.encounterType, record.tabKey) &&
        !this.isAmbulatoryProcedureSupportingDocumentRecord(record.encounterType, record.tabKey))
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

    if (input.encounter.encounterType === EncounterType.EMERGENCY) {
      const latestInitialNoteRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Nota inicial',
      );
      const latestEmergencyEvolutionRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Evolución',
      );
      const latestEmergencyOrdersRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Órdenes / Indicaciones',
      );
      const latestEmergencyDischargeRecord = this.findLatestSectionRecord(
        input.encounter.sectionRecords,
        'Egreso',
      );
      const latestEvolutionFormData =
        latestEmergencyEvolutionRecord?.formDataJson &&
        typeof latestEmergencyEvolutionRecord.formDataJson === 'object' &&
        !Array.isArray(latestEmergencyEvolutionRecord.formDataJson)
          ? (latestEmergencyEvolutionRecord.formDataJson as Record<string, unknown>)
          : {};
      const latestOrdersFormData =
        latestEmergencyOrdersRecord?.formDataJson &&
        typeof latestEmergencyOrdersRecord.formDataJson === 'object' &&
        !Array.isArray(latestEmergencyOrdersRecord.formDataJson)
          ? (latestEmergencyOrdersRecord.formDataJson as Record<string, unknown>)
          : {};
      const emergencyEvolutionDiagnoses = this.normalizeObjectArray(
        latestEvolutionFormData.diagnosticosEvolucionUrg,
      );
      const primaryDiagnosis =
        this.readStringValue(input.incomingFormData.documentoDiagnosticoPrincipal) ||
        this.readStringValueFromJson(
          input.currentRecordFormData,
          'documentoDiagnosticoPrincipal',
        ) ||
        this.readStringValueFromJson(
          latestEmergencyDischargeRecord?.formDataJson ?? null,
          'diagnosticoEgresoUrg',
        ) ||
        this.readStringValue(emergencyEvolutionDiagnoses[0]?.diagnostico) ||
        this.readStringValueFromJson(
          latestInitialNoteRecord?.formDataJson ?? null,
          'diagnosticoNota',
        ) ||
        '';
      const primaryDiagnosisCode =
        this.readStringValue(input.incomingFormData.documentoDiagnosticoCie10) ||
        this.readStringValueFromJson(
          input.currentRecordFormData,
          'documentoDiagnosticoCie10',
        ) ||
        this.readStringValueFromJson(
          latestEmergencyDischargeRecord?.formDataJson ?? null,
          'cie10EgresoUrg',
        ) ||
        this.readStringValue(emergencyEvolutionDiagnoses[0]?.cie10) ||
        this.readStringValueFromJson(
          latestInitialNoteRecord?.formDataJson ?? null,
          'cie10Nota',
        ) ||
        '';
      const diagnosisArray =
        this.readDiagnosesArrayFromUnknown(input.incomingFormData.documentoDiagnosticos)
          .length > 0
          ? this.readDiagnosesArrayFromUnknown(input.incomingFormData.documentoDiagnosticos)
          : emergencyEvolutionDiagnoses.length > 0
            ? emergencyEvolutionDiagnoses.map((diagnosis) => ({
                diagnostico: this.readStringValue(diagnosis.diagnostico),
                cie10: this.readStringValue(diagnosis.cie10),
                estado: this.readStringValue(diagnosis.estado),
              }))
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
          latestEmergencyDischargeRecord?.formDataJson ?? null,
          'manejoUrgenciasEgresoUrg',
        ) ||
        this.summarizeEmergencyOrderMedications(
          latestOrdersFormData.medicamentosOrdenesUrg,
        ) ||
        this.readStringValueFromJson(
          latestEmergencyEvolutionRecord?.formDataJson ?? null,
          'tratamientoEvolUrg',
        ) ||
        '';
      const studiesSummary =
        this.readStringValue(input.incomingFormData.documentoEstudiosRealizados) ||
        this.readStringValueFromJson(
          input.currentRecordFormData,
          'documentoEstudiosRealizados',
        ) ||
        this.normalizeObjectArray(latestOrdersFormData.estudiosSolicitadosOrdenes)
          .map((study) =>
            [
              this.readStringValue(study.tipo),
              this.readStringValue(study.estudio),
              this.readStringValue(study.prioridad),
            ]
              .filter(Boolean)
              .join(' · '),
          )
          .filter(Boolean)
          .join('\n') ||
        '';
      const clinicalSummary =
        this.readStringValueFromJson(
          latestEmergencyDischargeRecord?.formDataJson ?? null,
          'evolucionEstanciaEgresoUrg',
        ) ||
        this.readStringValueFromJson(
          latestEmergencyEvolutionRecord?.formDataJson ?? null,
          'justificacionClinicaNom004',
        ) ||
        this.readStringValueFromJson(
          latestInitialNoteRecord?.formDataJson ?? null,
          'resumenPronostico',
        ) ||
        '';

      if (
        input.noteType === 'Solicitud de laboratorio' ||
        input.noteType === 'Solicitud de imagenología' ||
        input.noteType === 'Certificado / constancia'
      ) {
        return {
          documentoDiagnosticoPrincipal: primaryDiagnosis,
          documentoDiagnosticoCie10: primaryDiagnosisCode,
        };
      }

      if (input.noteType === 'Referencia / contrarreferencia') {
        return {
          documentoResumenClinico: clinicalSummary,
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

      return {};
    }

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
    if (
      this.isHospitalAdmissionRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalAdmissionPdfDocument({
        encounter: input.encounter,
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

    if (
      this.isHospitalEvolutionRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalEvolutionPdfDocument({
        encounter: input.encounter,
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

    if (
      this.isHospitalMedicalOrdersRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalMedicalOrdersPdfDocument({
        encounter: input.encounter,
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

    if (
      this.isHospitalConsultationRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalConsultationPdfDocument({
        encounter: input.encounter,
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

    if (
      this.isHospitalSurgicalDocumentRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalSurgicalDocumentPdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
        downloadCount: input.downloadCount,
      });

      return {
        fileName: `${this.sanitizeFileName(input.record.title)}-${this.sanitizeFileName(input.record.noteType)}.pdf`,
        mimeType: 'application/pdf',
        contentBase64: pdfBuffer.toString('base64'),
        downloadCount: input.downloadCount,
        preview: input.preview,
      };
    }

    if (
      this.isHospitalNursingShiftRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalNursingShiftPdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
        downloadCount: input.downloadCount,
      });

      return {
        fileName: `${this.sanitizeFileName(input.record.title)}-${this.sanitizeFileName(input.record.noteType)}.pdf`,
        mimeType: 'application/pdf',
        contentBase64: pdfBuffer.toString('base64'),
        downloadCount: input.downloadCount,
        preview: input.preview,
      };
    }

    if (
      this.isHospitalDischargeRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildHospitalDischargePdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
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

    if (
      this.isAmbulatoryPreprocedureRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildAmbulatoryPreprocedurePdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
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

    if (
      this.isAmbulatoryProcedureRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildAmbulatoryProcedurePdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
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

    if (
      this.isAmbulatoryRecoveryEvaluationRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildAmbulatoryRecoveryEvaluationPdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
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

    if (
      this.isAmbulatoryDischargePrescriptionRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildAmbulatoryDischargePrescriptionPdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
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

    if (
      this.isAmbulatoryDischargeRecord(
        input.record.encounterType,
        input.record.tabKey,
      )
    ) {
      const pdfBuffer = this.buildAmbulatoryDischargePdfDocument({
        encounter: input.encounter,
        recordTitle: input.record.title,
        recordedAt: input.record.recordedAt,
        formData,
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
    if (input.encounter.encounterType === EncounterType.OUTPATIENT) {
      return this.renderSimplePdf(
        this.buildConsultationDocumentPdfLines(input),
      );
    }

    const diagnosisLines = this.readDiagnosesArrayFromUnknown(
      input.formData.documentoDiagnosticos,
    ).map((item, index) =>
      `${index + 1}. ${item.diagnostico || 'Diagnóstico sin capturar'} ${item.cie10 ? `· ${item.cie10}` : ''} ${item.estado ? `· ${item.estado}` : ''}`.trim(),
    );
    const labStudyLines = this.readObjectArray(
      input.formData.documentoEstudiosLaboratorio,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.tipoEstudio) || 'Estudio sin capturar'} · ${this.readStringValue(item.prioridad) || 'Sin prioridad'} · ${this.readStringValue(item.indicacionClinica)}`,
    );
    const consentWitnessLines = this.readObjectArray(
      input.formData.documentoTestigosConsentimiento,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.nombre) || 'Testigo sin capturar'} · Firma: ${this.readStringValue(item.firma) || 'Sin firma'}`,
    );
    const commonHeader = [
      input.recordTitle,
      `Tipo: ${input.noteType}`,
      `Paciente: ${input.encounter.patient.fullName}`,
      `CURP: ${this.readStringValue(input.formData.documentoPacienteCurp)}`,
      `Expediente: ${this.readStringValue(input.formData.documentoExpediente)}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Tipo de episodio: ${this.readStringValue(input.formData.documentoTipoEpisodio)}`,
      `Fecha: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Código de verificación: ${input.verificationCode}`,
      `Hash: ${this.readStringValue(input.formData.documentoHash)}`,
      `Sello digital: ${this.readStringValue(input.formData.documentoSelloDigital)}`,
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
        `Servicio: ${this.readStringValue(input.formData.documentoServicioSolicitud)}`,
        `Motivo: ${this.readStringValue(input.formData.documentoMotivoSolicitud)}`,
        'Estudios solicitados:',
        ...(labStudyLines.length > 0
          ? labStudyLines
          : [this.readStringValue(input.formData.documentoEstudiosSolicitados)]),
        `Diagnóstico: ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}`,
        `CIE-10: ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}`,
        `Prioridad: ${this.readStringValue(input.formData.documentoPrioridad)}`,
        `Observaciones: ${this.readStringValue(input.formData.documentoObservaciones)}`,
      ],
      'Solicitud de imagenología': [
        `Servicio: ${this.readStringValue(input.formData.documentoServicioSolicitud)}`,
        `Motivo: ${this.readStringValue(input.formData.documentoMotivoSolicitud)}`,
        `Estudio: ${this.readStringValue(input.formData.documentoEstudioImagen) || this.readStringValue(input.formData.documentoEstudiosSolicitados)}`,
        `Tipo: ${this.readStringValue(input.formData.documentoTipoImagen)}`,
        `Región anatómica: ${this.readStringValue(input.formData.documentoRegionAnatomica)}`,
        `Proyección: ${this.readStringValue(input.formData.documentoProyeccion)}`,
        `Diagnóstico presuntivo: ${this.readStringValue(input.formData.documentoDiagnosticoPrincipal)}`,
        `CIE-10: ${this.readStringValue(input.formData.documentoDiagnosticoCie10)}`,
        `Indicación clínica: ${this.readStringValue(input.formData.documentoIndicacionClinicaImagen) || this.readStringValue(input.formData.documentoIndicacionesEspeciales)}`,
        `Prioridad: ${this.readStringValue(input.formData.documentoPrioridadImagen) || this.readStringValue(input.formData.documentoPrioridad)}`,
        `Alergia contraste: ${this.readStringValue(input.formData.documentoAlergiaContraste)}`,
        `Embarazo: ${this.readStringValue(input.formData.documentoEmbarazo)}`,
        `Función renal: ${this.readStringValue(input.formData.documentoFuncionRenal)}`,
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
        `Procedimiento: ${this.readStringValue(input.formData.documentoProcedimientoNombre) || this.readStringValue(input.formData.documentoProcedimientoTipo)}`,
        `Descripción: ${this.readStringValue(input.formData.documentoProcedimientoDescripcion)}`,
        `Riesgos generales: ${this.readStringValue(input.formData.documentoRiesgosGenerales) || this.readStringValue(input.formData.documentoRiesgos)}`,
        `Riesgos específicos: ${this.readStringValue(input.formData.documentoRiesgosEspecificos)}`,
        `Beneficios: ${this.readStringValue(input.formData.documentoBeneficios)}`,
        `Alternativas: ${this.readStringValue(input.formData.documentoAlternativas)}`,
        `Riesgos de no tratamiento: ${this.readStringValue(input.formData.documentoRiesgosNoTratamiento) || this.readStringValue(input.formData.documentoPronosticoSinTratamiento)}`,
        `Paciente / tutor: ${this.readStringValue(input.formData.documentoNombrePacienteConsentimiento) || this.readStringValue(input.formData.documentoNombreTutor)}`,
        `Relación: ${this.readStringValue(input.formData.documentoRelacionTutor)}`,
        `Firma paciente: ${this.readStringValue(input.formData.documentoFirmaPacienteConsentimiento) || this.readStringValue(input.formData.documentoFirmaPaciente)}`,
        'Testigos:',
        ...(consentWitnessLines.length > 0 ? consentWitnessLines : ['Sin testigos capturados']),
      ],
      'Resumen clínico': [
        `Motivo de atención: ${this.readStringValue(input.formData.documentoMotivoAtencion)}`,
        `Diagnósticos iniciales: ${this.readStringValue(input.formData.documentoDiagnosticosIniciales)}`,
        `Diagnósticos finales: ${this.readStringValue(input.formData.documentoDiagnosticosFinales)}`,
        `Evolución: ${this.readStringValue(input.formData.documentoEvolucion)}`,
        `Estudios relevantes: ${this.readStringValue(input.formData.documentoEstudiosRelevantes)}`,
        `Tratamientos: ${this.readStringValue(input.formData.documentoTratamientos)}`,
        `Estado actual: ${this.readStringValue(input.formData.documentoEstadoActual)}`,
        `Plan: ${this.readStringValue(input.formData.documentoPlan)}`,
      ],
      'Referencia / traslado': [
        `Unidad origen: ${this.readStringValue(input.formData.documentoUnidadOrigen)}`,
        `Unidad receptora: ${this.readStringValue(input.formData.documentoUnidadReceptora)}`,
        `Hospital destino: ${this.readStringValue(input.formData.documentoHospitalDestino)}`,
        `Servicio: ${this.readStringValue(input.formData.documentoServicioDestino)}`,
        `Motivo: ${this.readStringValue(input.formData.documentoMotivoTraslado)}`,
        `Resumen clínico: ${this.readStringValue(input.formData.documentoResumenClinicoBreve)}`,
        `Signos vitales: ${this.readStringValue(input.formData.documentoSignosVitalesTraslado)}`,
        `Estabilidad: ${this.readStringValue(input.formData.documentoEstabilidadPaciente)}`,
        `Manejo previo: ${this.readStringValue(input.formData.documentoManejoPrevio)}`,
        `Tratamiento traslado: ${this.readStringValue(input.formData.documentoTratamientoTraslado)}`,
        `Ambulancia: ${this.readStringValue(input.formData.documentoAmbulanciaTraslado)}`,
        `Tipo ambulancia: ${this.readStringValue(input.formData.documentoTipoAmbulancia)}`,
      ],
      Defunción: [
        `Datos del paciente: ${this.readStringValue(input.formData.documentoDatosPacienteDefuncion)}`,
        `Fecha de muerte: ${this.readStringValue(input.formData.documentoFechaMuerte)}`,
        `Hora de muerte: ${this.readStringValue(input.formData.documentoHoraMuerte)}`,
        `Lugar: ${this.readStringValue(input.formData.documentoLugarMuerte)}`,
        `Causa inmediata: ${this.readStringValue(input.formData.documentoCausaInmediata)}`,
        `Causa intermedia: ${this.readStringValue(input.formData.documentoCausaIntermedia)}`,
        `Causa básica: ${this.readStringValue(input.formData.documentoCausaBasica)}`,
        `Otros estados: ${this.readStringValue(input.formData.documentoOtrosEstadosDefuncion)}`,
        `Comorbilidades: ${this.readStringValue(input.formData.documentoComorbilidadesDefuncion)}`,
        `Tipo de muerte: ${this.readStringValue(input.formData.documentoTipoMuerte)}`,
        `Aviso institucional: ${this.readStringValue(input.formData.documentoAvisoInstitucionalDefuncion)}`,
        `Médico certificante: ${this.readStringValue(input.formData.documentoMedicoCertificante)}`,
        `Cédula certificante: ${this.readStringValue(input.formData.documentoCedulaCertificante)}`,
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

  private buildConsultationDocumentPdfLines(input: {
    encounter: TenantEncounterRecord;
    noteType: string;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    verificationCode: string;
    downloadCount: number;
  }) {
    const value = (rawValue: unknown) =>
      this.readPrintableDocumentValue(rawValue);
    const line = (label: string, rawValue: unknown) =>
      this.buildPrintableDocumentLine(label, rawValue);
    const lines = (...rawLines: Array<string | null>) =>
      rawLines.filter((item): item is string => Boolean(item));
    const documentDate =
      value(input.formData.documentoFecha) ||
      input.recordedAt.toISOString().slice(0, 10);
    const documentTime =
      value(input.formData.documentoHora) ||
      input.recordedAt.toISOString().slice(11, 16);
    const verificationCode =
      value(input.verificationCode) ||
      value(input.formData.documentoCodigoVerificacion);
    const professionalName = value(input.formData.documentoNombreProfesional);
    const professionalLicense = value(input.formData.documentoCedulaProfesional);
    const professionalSpecialty = value(
      input.formData.documentoEspecialidadProfesional,
    );
    const issuer = value(input.formData.documentoInstitucionEmisora);
    const headerLines = issuer
      ? lines(
          line('Institución emisora', issuer),
          line('RFC', input.formData.documentoRfcMedico),
          line('Licencia sanitaria', input.formData.documentoLicenciaSanitaria),
        )
      : lines(
          line('Médico', professionalName),
          line('Especialidad', professionalSpecialty),
          line('Cédula profesional', professionalLicense),
        );
    const diagnosisLines = this.readDiagnosesArrayFromUnknown(
      input.formData.documentoDiagnosticos,
    )
      .map((item, index) =>
        lines(
          line('Diagnóstico', item.diagnostico),
          line('CIE-10', item.cie10),
          line('Estado', item.estado),
        ).length
          ? `${index + 1}. ${lines(
              line('Diagnóstico', item.diagnostico),
              line('CIE-10', item.cie10),
              line('Estado', item.estado),
            )
              .map((itemLine) => itemLine.replace(/^[^:]+:\s*/, ''))
              .join(' · ')}`
          : null,
      )
      .filter((item): item is string => Boolean(item));
    const consentWitnessLines = this.readObjectArray(
      input.formData.documentoTestigosConsentimiento,
    )
      .map((item, index) => {
        const witnessParts = lines(
          line('Nombre', item.nombre),
          line('Firma', item.firma),
        ).map((itemLine) => itemLine.replace(/^[^:]+:\s*/, ''));

        return witnessParts.length
          ? `${index + 1}. ${witnessParts.join(' · ')}`
          : null;
      })
      .filter((item): item is string => Boolean(item));
    const restRange = lines(
      line('Inicio', input.formData.documentoReposoInicio),
      line('Fin', input.formData.documentoReposoFin),
    )
      .map((itemLine) => itemLine.replace(/^[^:]+:\s*/, ''))
      .join(' al ');
    const clinicalLinesByDocument: Record<string, string[]> = {
      'Solicitud de laboratorio': lines(
        line('Motivo de solicitud', input.formData.documentoMotivoSolicitud),
        line('Estudios solicitados', input.formData.documentoEstudiosSolicitados),
        line('Diagnóstico asociado', input.formData.documentoDiagnosticoPrincipal),
        line('CIE-10', input.formData.documentoDiagnosticoCie10),
        line('Observaciones', input.formData.documentoObservaciones),
        line('Prioridad', input.formData.documentoPrioridad),
      ),
      'Solicitud de imagenología': lines(
        line('Motivo de estudio', input.formData.documentoMotivoSolicitud),
        line(
          'Estudio solicitado',
          value(input.formData.documentoEstudioImagen) ||
            value(input.formData.documentoEstudiosSolicitados),
        ),
        line('Región anatómica', input.formData.documentoRegionAnatomica),
        line('Diagnóstico presuntivo', input.formData.documentoDiagnosticoPrincipal),
        line('CIE-10', input.formData.documentoDiagnosticoCie10),
        line('Indicaciones especiales', input.formData.documentoIndicacionesEspeciales),
        line('Prioridad', input.formData.documentoPrioridad),
      ),
      'Referencia / contrarreferencia': lines(
        line('Tipo', input.formData.documentoTipoReferencia),
        line('Unidad destino', input.formData.documentoUnidadDestino),
        line('Motivo de envío', input.formData.documentoMotivoEnvio),
        line('Resumen clínico', input.formData.documentoResumenClinico),
        ...(diagnosisLines.length ? ['Diagnósticos:', ...diagnosisLines] : []),
        line('Tratamiento actual', input.formData.documentoTratamientoActual),
        line('Estudios realizados', input.formData.documentoEstudiosRealizados),
        line('Recomendaciones', input.formData.documentoRecomendaciones),
      ),
      'Consentimiento informado': lines(
        line('Tipo de procedimiento', input.formData.documentoProcedimientoTipo),
        line(
          'Descripción del procedimiento',
          input.formData.documentoProcedimientoDescripcion,
        ),
        line('Riesgos', input.formData.documentoRiesgos),
        line('Beneficios', input.formData.documentoBeneficios),
        line('Alternativas', input.formData.documentoAlternativas),
        line(
          'Pronóstico sin tratamiento',
          input.formData.documentoPronosticoSinTratamiento,
        ),
        line('Nombre paciente / tutor', input.formData.documentoNombreTutor),
        line('Relación', input.formData.documentoRelacionTutor),
        line('Firma paciente / tutor', input.formData.documentoFirmaPaciente),
        ...(consentWitnessLines.length ? ['Testigos:', ...consentWitnessLines] : []),
      ),
      'Certificado / constancia': lines(
        line('Tipo', input.formData.documentoTipoCertificado),
        line('Uso del documento', input.formData.documentoUsoDocumento),
        line('Motivo', input.formData.documentoMotivo),
        line('Diagnóstico', input.formData.documentoDiagnosticoPrincipal),
        line('CIE-10', input.formData.documentoDiagnosticoCie10),
        line('Reposo', restRange),
        line('Observaciones', input.formData.documentoObservaciones),
      ),
      'Nota de cierre': lines(
        line('Motivo de cierre', input.formData.documentoMotivoCierre),
        line('Resumen clínico final', input.formData.documentoResumenClinicoFinal),
        ...(diagnosisLines.length ? ['Diagnósticos finales:', ...diagnosisLines] : []),
        line('Estado final', input.formData.documentoEstadoFinal),
        line('Indicaciones al egreso', input.formData.documentoIndicacionesEgreso),
        line('Plan de seguimiento', input.formData.documentoPlanSeguimiento),
      ),
    };
    const clinicalLines = clinicalLinesByDocument[input.noteType] ?? [];
    const legalLines = lines(
      'Datos legales y firma',
      line('Tipo de documento', input.noteType),
      line('Fecha', documentDate),
      line('Hora', documentTime),
      line('Folio del documento', input.formData.documentoFolio),
      line('Versión', input.formData.documentoVersion),
      line('Estado', input.formData.documentoEstado),
      line('Institución emisora', issuer),
      line('RFC', input.formData.documentoRfcMedico),
      line('Licencia sanitaria', input.formData.documentoLicenciaSanitaria),
      line('Código de verificación', verificationCode),
      line('Profesional responsable', professionalName),
      line('Cédula', professionalLicense),
      line('Especialidad', professionalSpecialty),
      line('Lugar de atención', input.formData.documentoLugarAtencion),
      line('Firma', professionalName),
    );
    const footerLines = lines(
      'Pie legal',
      line('Nombre del médico', professionalName),
      line('Cédula profesional', professionalLicense),
      line('Fecha', documentDate),
      line('Firma', professionalName),
      line('Código de verificación', verificationCode),
    );

    return lines(
      input.recordTitle,
      ...headerLines,
      line('Paciente', input.encounter.patient.fullName),
      line('Fecha clínica del registro', `${documentDate} ${documentTime}`.trim()),
      input.noteType,
      ...clinicalLines,
      ...legalLines,
      ...footerLines,
    );
  }

  private readPrintableDocumentValue(value: unknown) {
    const printableValue = this.readStringValue(value).trim();

    if (
      !printableValue ||
      ['N/A', 'Sin dato disponible', 'Sin cédula', 'Sin especialidad'].includes(
        printableValue,
      ) ||
      printableValue.startsWith('Se generará')
    ) {
      return '';
    }

    return printableValue;
  }

  private buildPrintableDocumentLine(label: string, value: unknown) {
    const printableValue = this.readPrintableDocumentValue(value);

    return printableValue ? `${label}: ${printableValue}` : null;
  }

  private buildAmbulatoryPreprocedurePdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const listLines = (value: unknown, fields: string[]) =>
      this.readObjectArray(value).map((item, index) =>
        `${index + 1}. ${fields.map((field) => this.readStringValue(item[field])).filter(Boolean).join(' · ')}`,
      );
    const comorbidityLines = listLines(input.formData.comorbilidadesPreproc, [
      'diagnostico',
      'cie10',
      'estado',
    ]);
    const allergyLines = listLines(input.formData.alergiasPreproc, [
      'sustancia',
      'reaccion',
      'severidad',
    ]);
    const medicationLines = listLines(input.formData.medicacionActualPreproc, [
      'farmaco',
      'dosis',
      'frecuencia',
    ]);
    const lines = [
      input.recordTitle,
      'Tipo: Valoración preprocedimiento',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Expediente: ${input.encounter.medicalRecord.recordNumber}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Hash: ${this.readStringValue(input.formData.hashPreproc)}`,
      `Sello digital: ${this.readStringValue(input.formData.selloDigitalPreproc)}`,
      'Subjetivo',
      `Diagnóstico preoperatorio: ${this.readStringValue(input.formData.diagnosticoPreoperatorioPreproc)}`,
      `CIE-10: ${this.readStringValue(input.formData.cie10Preproc)}`,
      `Procedimiento indicado: ${this.readStringValue(input.formData.procedimientoIndicadoPreproc)}`,
      `Indicación clínica: ${this.readStringValue(input.formData.indicacionClinicaPreproc)}`,
      `Tipo procedimiento: ${this.readStringValue(input.formData.tipoProcedimientoPreproc)}`,
      `Síntomas: ${this.readStringValue(input.formData.sintomasActualesPreproc)}`,
      `Evolución: ${this.readStringValue(input.formData.evolucionPadecimientoPreproc)}`,
      `Antecedentes: ${this.readStringValue(input.formData.detalleAntecedentesPreproc)}`,
      'Comorbilidades:',
      ...(comorbidityLines.length > 0 ? comorbidityLines : ['Sin comorbilidades agregadas']),
      'Alergias:',
      ...(allergyLines.length > 0 ? allergyLines : ['Sin alergias agregadas']),
      'Medicación actual:',
      ...(medicationLines.length > 0 ? medicationLines : ['Sin medicación agregada']),
      'Objetivo',
      `Peso/Talla/IMC: ${this.readStringValue(input.formData.pesoKgPreproc)} kg / ${this.readStringValue(input.formData.tallaCmPreproc)} cm / ${this.readStringValue(input.formData.imcPreproc)}`,
      `TA/FC/FR/SpO2/T: ${this.readStringValue(input.formData.taPreproc)} / ${this.readStringValue(input.formData.fcPreproc)} / ${this.readStringValue(input.formData.frPreproc)} / ${this.readStringValue(input.formData.spo2Preproc)} / ${this.readStringValue(input.formData.temperaturaPreproc)}`,
      `Glucosa capilar: ${this.readStringValue(input.formData.glucosaCapilarPreproc)}`,
      `Exploración física: ${this.readStringValue(input.formData.exploracionFisicaPreproc)}`,
      `Estudios preoperatorios: ${this.readStringValue(input.formData.estudiosPreoperatoriosPreproc)}`,
      'Evaluación preanestésica',
      `Anestesia prevista: ${this.readStringValue(input.formData.tipoAnestesiaPrevistaPreproc)}`,
      `Mallampati/vía aérea: ${this.readStringValue(input.formData.mallampatiPreproc)} / ${this.readStringValue(input.formData.aperturaBucalPreproc)} / ${this.readStringValue(input.formData.movilidadCervicalPreproc)} / ${this.readStringValue(input.formData.distanciaTiromentonianaPreproc)}`,
      `Riesgo anestésico: ${this.readStringValue(input.formData.riesgoAnestesicoPreproc)}`,
      `Plan anestésico NOM-006: ${this.readStringValue(input.formData.planAnestesicoPreproc)}`,
      'Análisis',
      `ASA: ${this.readStringValue(input.formData.clasificacionAsaPreproc)}`,
      `Riesgo quirúrgico: ${this.readStringValue(input.formData.riesgoQuirurgicoPreproc)}`,
      `Riesgo cardiovascular: ${this.readStringValue(input.formData.riesgoCardiovascularPreproc)}`,
      `Riesgo Caprini: ${this.readStringValue(input.formData.riesgoTromboembolicoCapriniPreproc)}`,
      `Riesgos informados: ${this.readStringValue(input.formData.riesgosInformadosPreproc)}`,
      `Pronóstico: ${this.readStringValue(input.formData.pronosticoPreproc)}`,
      `Profilaxis: ${this.readStringValue(input.formData.profilaxisIndicadaPreproc)}`,
      `Alertas: ${this.readStringValue(input.formData.alertasClinicasPreproc)}`,
      'Plan y consentimiento',
      `Preparación: ${this.readStringValue(input.formData.preparacionPreoperatoriaPreproc)}`,
      `Ayuno: ${this.readStringValue(input.formData.horasAyunoPreproc)} horas · confirmado ${this.readStringValue(input.formData.ayunoConfirmadoPreproc)}`,
      `Consentimiento quirúrgico: ${this.readStringValue(input.formData.consentimientoQuirurgicoPreproc)}`,
      `Consentimiento anestésico: ${this.readStringValue(input.formData.consentimientoAnestesicoPreproc)}`,
      `Acto autorizado: ${this.readStringValue(input.formData.actoAutorizadoPreproc)}`,
      `Riesgos/beneficios: ${this.readStringValue(input.formData.riesgosEsperadosPreproc)} / ${this.readStringValue(input.formData.beneficiosEsperadosPreproc)}`,
      `Autoriza: ${this.readStringValue(input.formData.nombreAutorizaPreproc)} · ${this.readStringValue(input.formData.relacionPacientePreproc)}`,
      `Testigos: ${this.readStringValue(input.formData.nombreTestigo1Preproc)} / ${this.readStringValue(input.formData.nombreTestigo2Preproc)}`,
      'Datos legales',
      `Institución: ${this.readStringValue(input.formData.institucionConsentimientoPreproc)}`,
      `Razón social: ${this.readStringValue(input.formData.razonSocialConsentimientoPreproc)}`,
      `Profesional: ${this.readStringValue(input.formData.profesionalNombrePreproc)}`,
      `Cédula: ${this.readStringValue(input.formData.profesionalCedulaPreproc)}`,
      `Especialidad: ${this.readStringValue(input.formData.profesionalEspecialidadPreproc)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionPreproc)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildAmbulatoryProcedurePdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const materialLines = this.readObjectArray(input.formData.materialesProc).map(
      (item, index) =>
        `${index + 1}. ${this.readStringValue(item.nombre)} ${this.readStringValue(item.cantidad)} ${this.readStringValue(item.loteSerie)}`.trim(),
    );
    const lines = [
      input.recordTitle,
      'Tipo: Procedimiento',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Expediente: ${input.encounter.medicalRecord.recordNumber}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Hash: ${this.readStringValue(input.formData.hashProc)}`,
      `Sello digital: ${this.readStringValue(input.formData.selloDigitalProc)}`,
      'Equipo quirúrgico',
      `Cirujano principal: ${this.readStringValue(input.formData.cirujanoPrincipalProc)} · Cédula ${this.readStringValue(input.formData.cedulaCirujanoProc)}`,
      `Ayudantes: ${this.readStringValue(input.formData.primerAyudanteProc)} / ${this.readStringValue(input.formData.segundoAyudanteProc)}`,
      `Anestesiólogo: ${this.readStringValue(input.formData.anestesiologoProc)} · Cédula ${this.readStringValue(input.formData.cedulaAnestesiologoProc)}`,
      `Instrumentista / circulante: ${this.readStringValue(input.formData.instrumentistaProc)} / ${this.readStringValue(input.formData.enfermeriaCirculanteProc)}`,
      'Time-Out',
      `Paciente verificado: ${Boolean(input.formData.toPacienteVerificadoProc) ? 'Sí' : 'No'}`,
      `Procedimiento confirmado: ${Boolean(input.formData.toProcedimientoConfirmadoProc) ? 'Sí' : 'No'}`,
      `Sitio marcado: ${Boolean(input.formData.toSitioConfirmadoProc) ? 'Sí' : 'No'}`,
      `Time-Out antes de incisión: ${Boolean(input.formData.toRealizadoAntesIncisionProc) ? 'Sí' : 'No'}`,
      `Profilaxis/equipo/consentimiento/imágenes: ${Boolean(input.formData.toProfilaxisAntibioticaProc) ? 'Sí' : 'No'} / ${Boolean(input.formData.toEquipoInstrumentalProc) ? 'Sí' : 'No'} / ${Boolean(input.formData.toConsentimientoVerificadoProc) ? 'Sí' : 'No'} / ${Boolean(input.formData.toImagenesDisponiblesProc) ? 'Sí' : 'No'}`,
      'Descripción',
      `Fecha: ${this.readStringValue(input.formData.fechaProcedimientoProc)} ${this.readStringValue(input.formData.horaInicioRealProc)}-${this.readStringValue(input.formData.horaFinRealProc)}`,
      `Duración: ${this.readStringValue(input.formData.duracionMinutosProc)} min`,
      `Sala: ${this.readStringValue(input.formData.salaQuirofanoProc)}`,
      `Código procedimiento: ${this.readStringValue(input.formData.codigoProcedimientoProc)}`,
      `Diagnóstico preoperatorio: ${this.readStringValue(input.formData.diagnosticoPreoperatorioProc)} · ${this.readStringValue(input.formData.ciePreoperatorioProc)}`,
      `Diagnóstico postoperatorio: ${this.readStringValue(input.formData.diagnosticoPostoperatorioProc)} · ${this.readStringValue(input.formData.ciePostoperatorioProc)}`,
      `Procedimiento realizado: ${this.readStringValue(input.formData.procedimientoRealizadoProc)}`,
      'Anestesia',
      `Tipo: ${this.readStringValue(input.formData.tipoAnestesiaProc)}`,
      `Medicamentos: ${this.readStringValue(input.formData.medicamentosAnestesicosProc)}`,
      `Eventos: ${this.readStringValue(input.formData.eventosAnestesicosProc)}`,
      `Alertas: ${this.readStringValue(input.formData.alertasAnestesiaProc)}`,
      'Técnica y hallazgos',
      `Técnica: ${this.readStringValue(input.formData.tecnicaQuirurgicaProc)}`,
      `Hallazgos: ${this.readStringValue(input.formData.hallazgosTransoperatoriosProc)}`,
      `Herida: ${this.readStringValue(input.formData.clasificacionHeridaProc)}`,
      'Transoperatorio',
      `Sangrado estimado: ${this.readStringValue(input.formData.sangradoEstimadoMlProc)} ml`,
      `Líquidos IV: ${this.readStringValue(input.formData.liquidosIvProc)}`,
      `Transfusiones: ${this.readStringValue(input.formData.transfusionesProc)}`,
      `Drenajes: ${this.readStringValue(input.formData.drenajesColocadosProc)}`,
      'Materiales:',
      ...(materialLines.length > 0 ? materialLines : ['Sin materiales estructurados']),
      `Implantes/dispositivos: ${this.readStringValue(input.formData.implantesDispositivosProc)}`,
      `Lotes/series: ${this.readStringValue(input.formData.lotesSeriesProc)}`,
      `Cuenta gasas/instrumental: ${this.readStringValue(input.formData.cuentaGasasInstrumentalProc)}`,
      'Patología y complicaciones',
      `Pieza quirúrgica: ${this.readStringValue(input.formData.descripcionPiezaProc)}`,
      `Envío patología: ${this.readStringValue(input.formData.envioPatologiaProc)} · Folio ${this.readStringValue(input.formData.folioPatologiaProc)}`,
      `Complicaciones: ${this.readStringValue(input.formData.huboComplicacionesProc)} · Conversión ${this.readStringValue(input.formData.conversionAbiertaProc)}`,
      `Tipo/manejo: ${this.readStringValue(input.formData.tipoComplicacionProc)} / ${this.readStringValue(input.formData.manejoComplicacionProc)}`,
      'Destino',
      `Destino: ${this.readStringValue(input.formData.destinoPostprocedimientoProc)}`,
      `Monitorización: ${this.readStringValue(input.formData.requiereMonitorizacionProc)}`,
      `Indicaciones inmediatas: ${this.readStringValue(input.formData.indicacionesInmediatasProc)}`,
      'Postanestesia',
      `Medicamentos: ${this.readStringValue(input.formData.postMedicamentosAnestesicosProc)}`,
      `Duración anestesia: ${this.readStringValue(input.formData.postDuracionAnestesiaProc)}`,
      `Sangre/soluciones: ${this.readStringValue(input.formData.postSangreAplicadaProc)} / ${this.readStringValue(input.formData.postSolucionesAplicadasProc)}`,
      `Incidentes: ${this.readStringValue(input.formData.postIncidentesAnestesiaProc)}`,
      `Estado egreso sala: ${this.readStringValue(input.formData.postEstadoClinicoEgresoSalaProc)}`,
      `Plan postanestésico: ${this.readStringValue(input.formData.postPlanManejoProc)}`,
      `Anestesiólogo responsable: ${this.readStringValue(input.formData.postNombreAnestesiologoProc)} · ${this.readStringValue(input.formData.postCedulaAnestesiologoProc)}`,
      'Datos legales',
      `Profesional: ${this.readStringValue(input.formData.profesionalNombreProc)}`,
      `Cédula: ${this.readStringValue(input.formData.profesionalCedulaProc)}`,
      `Especialidad: ${this.readStringValue(input.formData.profesionalEspecialidadProc)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionProc)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildAmbulatoryRecoveryEvaluationPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const nursingLines = this.readObjectArray(
      input.formData.registrosEnfermeriaRecEval,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.fecha)} ${this.readStringValue(item.hora)} · ${this.readStringValue(item.turno)} · ${this.readStringValue(item.nombreElabora)} · EVA ${this.readStringValue(item.dolorEva)} · Caídas ${this.readStringValue(item.riesgoCaidas)}`.trim(),
    );
    const auxiliaryLines = this.readObjectArray(
      input.formData.serviciosAuxiliaresRecEval,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.fechaHoraEstudio)} · ${this.readStringValue(item.estudioSolicitado)} · Folio ${this.readStringValue(item.folioEstudio)} · ${this.readStringValue(item.interpretacionMedico)}`.trim(),
    );
    const checklistLines = [
      ['Tolera vía oral', input.formData.altaToleraViaOralRecEval],
      ['Deambulación independiente', input.formData.altaDeambulacionIndependienteRecEval],
      ['Micción espontánea', input.formData.altaMiccionEspontaneaRecEval],
      ['Dolor controlado', input.formData.altaDolorControladoRecEval],
      ['Sin náusea/vómito', input.formData.altaSinNauseaVomitoRecEval],
      ['Signos vitales estables', input.formData.altaSignosVitalesEstablesRecEval],
      ['Heridas sin sangrado', input.formData.altaHeridasSinSangradoRecEval],
      ['Aldrete >= 9', input.formData.altaAldreteMayorIgual9RecEval],
      ['Acompañante responsable', input.formData.altaAcompananteResponsableRecEval],
      ['Instrucciones entregadas', input.formData.altaInstruccionesEntregadasRecEval],
    ].map(([label, value]) => `${label}: ${Boolean(value) ? 'Sí' : 'No'}`);
    const lines = [
      input.recordTitle,
      'Tipo: Recuperación / Evaluación',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Expediente: ${input.encounter.medicalRecord.recordNumber}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Hash: ${this.readStringValue(input.formData.hashRecEval)}`,
      `Sello digital: ${this.readStringValue(input.formData.selloDigitalRecEval)}`,
      'Subjetivo',
      `Valoración: ${this.readStringValue(input.formData.fechaRecEval)} ${this.readStringValue(input.formData.horaValoracionRecEval)} · Postprocedimiento ${this.readStringValue(input.formData.tiempoPostprocedimientoRecEval)}`,
      `Frecuencia monitoreo: ${this.readStringValue(input.formData.frecuenciaMonitoreoRecEval)}`,
      `Síntomas: ${this.readStringValue(input.formData.sintomasPacienteRecEval)}`,
      `VO/deambulación/micción: ${this.readStringValue(input.formData.toleranciaViaOralRecEval)} / ${this.readStringValue(input.formData.deambulacionRecEval)} / ${this.readStringValue(input.formData.miccionRecEval)}`,
      'Objetivo',
      `TA/FC/FR/SpO2/T: ${this.readStringValue(input.formData.taSistolicaRecEval)}/${this.readStringValue(input.formData.taDiastolicaRecEval)} ${this.readStringValue(input.formData.fcRecEval)} ${this.readStringValue(input.formData.frRecEval)} ${this.readStringValue(input.formData.spo2RecEval)} ${this.readStringValue(input.formData.temperaturaRecEval)}`,
      `EVA/Glasgow/Glucosa: ${this.readStringValue(input.formData.dolorEvaRecEval)} / ${this.readStringValue(input.formData.glasgowRecEval)} / ${this.readStringValue(input.formData.glucosaCapilarRecEval)}`,
      `Conciencia/general: ${this.readStringValue(input.formData.estadoConcienciaRecEval)} / ${this.readStringValue(input.formData.estadoGeneralRecEval)}`,
      `Exploración: ${this.readStringValue(input.formData.exploracionPostprocedimientoRecEval)}`,
      `Complicaciones: ${this.readStringValue(input.formData.complicacionesPostprocedimientoRecEval)} · Manejo ${this.readStringValue(input.formData.manejoComplicacionRecEval)}`,
      'Aldrete y criterios de alta',
      `Aldrete: ${this.readStringValue(input.formData.aldreteTotalRecEval)} · ${this.readStringValue(input.formData.aldreteInterpretacionRecEval)}`,
      ...checklistLines,
      `Semáforo: ${this.readStringValue(input.formData.semaforoRecEval)}`,
      `Alertas: ${this.readStringValue(input.formData.alertasAutomaticasRecEval)}`,
      'Eventos y plan',
      `Evento adverso: ${this.readStringValue(input.formData.eventoAdversoRecEval)} · ${this.readStringValue(input.formData.descripcionAccionEventoRecEval)}`,
      `Plan vigilancia: ${this.readStringValue(input.formData.planVigilanciaRecEval)}`,
      `Tiempo recuperación: ${this.readStringValue(input.formData.tiempoEnRecuperacionMinRecEval)} min`,
      `Destino: ${this.readStringValue(input.formData.destinoPostRecuperacionRecEval)}`,
      `Cambios: ${this.readStringValue(input.formData.cambiosValoracionInmediataRecEval)}`,
      'Registros de enfermería:',
      ...(nursingLines.length > 0 ? nursingLines : ['Sin registros de enfermería agregados']),
      'Servicios auxiliares:',
      ...(auxiliaryLines.length > 0 ? auxiliaryLines : ['Sin servicios auxiliares vinculados']),
      'Datos legales',
      `Profesional: ${this.readStringValue(input.formData.profesionalNombreRecEval)}`,
      `Cédula: ${this.readStringValue(input.formData.profesionalCedulaRecEval)}`,
      `Especialidad: ${this.readStringValue(input.formData.profesionalEspecialidadRecEval)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionRecEval)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildAmbulatoryDischargePrescriptionPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const medicationLines = this.readObjectArray(
      input.formData.medicamentosRecetaEgreso,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.medicamento)} · ${this.readStringValue(item.dosis)} · ${this.readStringValue(item.via)} · ${this.readStringValue(item.frecuencia)} · ${this.readStringValue(item.duracion)} · ${this.readStringValue(item.indicacion)}`.trim(),
    );
    const lines = [
      input.recordTitle,
      'Tipo: Receta e indicaciones de egreso',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Expediente: ${input.encounter.medicalRecord.recordNumber}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Hash: ${this.readStringValue(input.formData.hashRecetaEgreso)}`,
      `Sello digital: ${this.readStringValue(input.formData.selloDigitalRecetaEgreso)}`,
      'RECETA MÉDICA',
      `Folio: ${this.readStringValue(input.formData.folioRecetaEgreso)}`,
      `Tipo: ${this.readStringValue(input.formData.tipoRecetaEgreso)} · Vigencia ${this.readStringValue(input.formData.vigenciaRecetaEgreso)}`,
      `QR: ${this.readStringValue(input.formData.qrVerificacionRecetaEgreso)}`,
      `Institución: ${this.readStringValue(input.formData.institucionEmisoraRecetaEgreso)}`,
      `RFC médico: ${this.readStringValue(input.formData.rfcMedicoRecetaEgreso)}`,
      `Licencia sanitaria: ${this.readStringValue(input.formData.licenciaSanitariaRecetaEgreso)}`,
      'Medicamentos:',
      ...(medicationLines.length > 0 ? medicationLines : ['Sin medicamentos capturados']),
      `Alertas alergias: ${this.readStringValue(input.formData.alertasAlergiasRecetaEgreso)}`,
      `Validaciones: ${this.readStringValue(input.formData.validacionesMedicamentosRecetaEgreso)}`,
      'INDICACIONES DE EGRESO',
      `Dieta: ${this.readStringValue(input.formData.dietaIndicacionesEgreso)}`,
      `Actividad: ${this.readStringValue(input.formData.actividadFisicaNivelEgreso)} · ${this.readStringValue(input.formData.actividadFisicaDetalleEgreso)}`,
      `Cuidados de herida: ${this.readStringValue(input.formData.cuidadosHeridaEgreso)}`,
      `Vigilancia domiciliaria: ${this.readStringValue(input.formData.vigilanciaDomiciliariaEgreso)}`,
      `Signos de alarma: ${this.readStringValue(input.formData.signosAlarmaEgreso)}`,
      `Seguimiento: ${this.readStringValue(input.formData.fechaCitaSeguimientoEgreso)} · ${this.readStringValue(input.formData.tipoCitaSeguimientoEgreso)} · ${this.readStringValue(input.formData.motivoCitaSeguimientoEgreso)}`,
      `Educación otorgada: ${this.readStringValue(input.formData.educacionOtorgadaEgreso)}`,
      `Comprensión paciente/familiar: ${Boolean(input.formData.pacienteComprendeIndicacionesEgreso) ? 'Sí' : 'No'} / ${Boolean(input.formData.familiarInformadoEgreso) ? 'Sí' : 'No'}`,
      'Datos legales',
      `Profesional: ${this.readStringValue(input.formData.profesionalNombreRecetaEgreso)}`,
      `Cédula: ${this.readStringValue(input.formData.profesionalCedulaRecetaEgreso)}`,
      `Especialidad: ${this.readStringValue(input.formData.profesionalEspecialidadRecetaEgreso)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionRecetaEgreso)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildAmbulatoryDischargePdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const criteriaLines = [
      ['Signos estables', input.formData.altaSignosEstablesEgresoAmb],
      ['Dolor controlado', input.formData.altaDolorControladoEgresoAmb],
      ['Tolera vía oral', input.formData.altaToleraViaOralEgresoAmb],
      ['Deambulación', input.formData.altaDeambulacionEgresoAmb],
      ['Micción', input.formData.altaMiccionEgresoAmb],
      ['Heridas sin sangrado', input.formData.altaHeridasSinSangradoEgresoAmb],
      ['Aldrete >= 9', input.formData.altaAldreteMayor9EgresoAmb],
      ['Acompañante', input.formData.altaAcompananteEgresoAmb],
      ['Indicaciones entregadas', input.formData.altaIndicacionesEntregadasEgresoAmb],
      ['Receta entregada', input.formData.altaRecetaEntregadaEgresoAmb],
    ].map(([label, value]) => `${label}: ${Boolean(value) ? 'Sí' : 'No'}`);
    const lines = [
      input.recordTitle,
      'Tipo: Egreso',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Expediente: ${input.encounter.medicalRecord.recordNumber}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Hash: ${this.readStringValue(input.formData.hashEgresoAmb)}`,
      `Sello digital: ${this.readStringValue(input.formData.selloDigitalEgresoAmb)}`,
      'Datos de egreso',
      `Tipo/destino: ${this.readStringValue(input.formData.tipoEgresoAmb)} / ${this.readStringValue(input.formData.destinoEgresoAmb)}`,
      `Fecha/hora: ${this.readStringValue(input.formData.fechaEgresoAmb)} ${this.readStringValue(input.formData.horaEgresoAmb)}`,
      `Diagnóstico final: ${this.readStringValue(input.formData.diagnosticoFinalEgresoAmb)} · ${this.readStringValue(input.formData.cie10EgresoAmb)}`,
      `Condición/estado: ${this.readStringValue(input.formData.condicionesEgresoAmb)} / ${this.readStringValue(input.formData.estadoClinicoEgresoAmb)}`,
      'Signos vitales',
      `TA/FC/FR/T/SpO2: ${this.readStringValue(input.formData.taEgresoAmb)} / ${this.readStringValue(input.formData.fcEgresoAmb)} / ${this.readStringValue(input.formData.frEgresoAmb)} / ${this.readStringValue(input.formData.temperaturaEgresoAmb)} / ${this.readStringValue(input.formData.spo2EgresoAmb)}`,
      `EVA/Aldrete/Pronóstico: ${this.readStringValue(input.formData.evaDolorEgresoAmb)} / ${this.readStringValue(input.formData.aldreteFinalEgresoAmb)} / ${this.readStringValue(input.formData.pronosticoEgresoAmb)}`,
      'Criterios de alta',
      ...criteriaLines,
      `Cumple criterios: ${this.readStringValue(input.formData.cumpleCriteriosAltaEgresoAmb)}`,
      'Resumen clínico',
      `Motivo: ${this.readStringValue(input.formData.motivoProcedimientoEgresoAmb)}`,
      `Procedimiento: ${this.readStringValue(input.formData.procedimientoRealizadoEgresoAmb)}`,
      `Recuperación: ${this.readStringValue(input.formData.evolucionRecuperacionEgresoAmb)}`,
      `Estado al egreso: ${this.readStringValue(input.formData.estadoAlEgresoResumenAmb)}`,
      'Plan',
      `Receta: ${this.readStringValue(input.formData.recetaRelacionadaEgresoAmb)}`,
      `Medicamentos: ${this.readStringValue(input.formData.medicamentosRecetaEgresoAmb)}`,
      `Seguimiento: ${this.readStringValue(input.formData.seguimientoEgresoAmb)}`,
      `Incapacidad: ${this.readStringValue(input.formData.diasIncapacidadEgresoAmb)} días · ${this.readStringValue(input.formData.tipoIncapacidadEgresoAmb)}`,
      `Educación: ${this.readStringValue(input.formData.educacionPacienteEgresoAmb)}`,
      `Comprensión paciente/familiar: ${Boolean(input.formData.pacienteComprendeEgresoAmb) ? 'Sí' : 'No'} / ${Boolean(input.formData.familiarInformadoEgresoAmb) ? 'Sí' : 'No'}`,
      `Referencia/traslado: ${this.readStringValue(input.formData.referenciaEstablecimientoReceptorEgresoAmb)} ${this.readStringValue(input.formData.referenciaMotivoEnvioEgresoAmb)}`.trim(),
      'Responsable',
      `Médico: ${this.readStringValue(input.formData.medicoAutorizaEgresoAmb)} · ${this.readStringValue(input.formData.cedulaAutorizaEgresoAmb)}`,
      `Profesional firma: ${this.readStringValue(input.formData.profesionalNombreEgresoAmb)} · ${this.readStringValue(input.formData.profesionalCedulaEgresoAmb)}`,
      `Especialidad/lugar: ${this.readStringValue(input.formData.profesionalEspecialidadEgresoAmb)} / ${this.readStringValue(input.formData.lugarAtencionEgresoAmb)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildHospitalAdmissionPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    verificationCode: string;
    downloadCount: number;
  }) {
    const medicationLines = this.readObjectArray(input.formData.medicamentosHosp).map(
      (item, index) =>
        `${index + 1}. ${this.readStringValue(item.medicamento)} ${this.readStringValue(item.dosis)} ${this.readStringValue(item.via)} ${this.readStringValue(item.frecuencia)}`.trim(),
    );
    const comorbidityLines = this.readObjectArray(input.formData.comorbilidadesHosp).map(
      (item, index) =>
        `${index + 1}. ${this.readStringValue(item.comorbilidad)} - ${this.readStringValue(item.estado)}`.trim(),
    );
    const diagnosisLines = this.readObjectArray(
      input.formData.diagnosticosSecundariosHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.diagnostico)} ${this.readStringValue(item.cie10)}`.trim(),
    );
    const lines = [
      input.recordTitle,
      'Tipo: Ingreso hospitalario',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Código verificación: ${input.verificationCode}`,
      `Tipo ingreso: ${this.readStringValue(input.formData.tipoIngresoHosp)}`,
      `Origen: ${this.readStringValue(input.formData.origenIngresoHosp)}`,
      `Estado clínico: ${this.readStringValue(input.formData.estadoClinicoIngresoHosp)}`,
      `Servicio/piso/hab/cama: ${this.readStringValue(input.formData.servicioIngresoHosp)} / ${this.readStringValue(input.formData.pisoIngresoHosp)} / ${this.readStringValue(input.formData.habitacionIngresoHosp)} / ${this.readStringValue(input.formData.camaIngresoHosp)}`,
      `Ingreso: ${this.readStringValue(input.formData.fechaIngresoHosp)} ${this.readStringValue(input.formData.horaIngresoHosp)}`.trim(),
      `Cobertura: ${this.readStringValue(input.formData.tipoCoberturaHosp)} ${this.readStringValue(input.formData.aseguradoraConvenioHosp)}`.trim(),
      `Motivo: ${this.readStringValue(input.formData.motivoIngresoClinicoHosp)}`,
      `Historia: ${this.readStringValue(input.formData.historiaPadecimientoActualHosp)}`,
      `TA/FC/FR/T/SpO2: ${this.readStringValue(input.formData.taSistolicaHosp)}/${this.readStringValue(input.formData.taDiastolicaHosp)} ${this.readStringValue(input.formData.fcHosp)} ${this.readStringValue(input.formData.frHosp)} ${this.readStringValue(input.formData.temperaturaHosp)} ${this.readStringValue(input.formData.spo2Hosp)}`,
      `Exploración: ${this.readStringValue(input.formData.exploracionFisicaHosp)}`,
      `Estado mental: ${this.readStringValue(input.formData.estadoMentalHosp)}`,
      `Diagnóstico principal: ${this.readStringValue(input.formData.diagnosticoPrincipalHosp)}`,
      `CIE-10: ${this.readStringValue(input.formData.cie10Hosp)}`,
      'Diagnósticos secundarios:',
      ...(diagnosisLines.length > 0 ? diagnosisLines : ['Sin diagnósticos secundarios']),
      'Comorbilidades:',
      ...(comorbidityLines.length > 0 ? comorbidityLines : ['Sin comorbilidades agregadas']),
      `Dieta inicial: ${this.readStringValue(input.formData.dietaInicialHosp)}`,
      `Aislamiento: ${this.readStringValue(input.formData.aislamientoRequeridoHosp)}`,
      'Medicamentos:',
      ...(medicationLines.length > 0 ? medicationLines : ['Sin medicamentos capturados']),
      `Estudios: ${this.readStringValue(input.formData.estudiosPlanHosp)}`,
      `Procedimientos: ${this.readStringValue(input.formData.procedimientosPlanHosp)}`,
      `Interconsultas: ${this.readStringValue(input.formData.interconsultasPlanHosp)}`,
      `Riesgos identificados: ${this.readStringValue(input.formData.riesgosIdentificadosHosp)}`,
      `Médico: ${this.readStringValue(input.formData.medicoIngresoLegal)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaIngresoLegal)}`,
      `Especialidad: ${this.readStringValue(input.formData.especialidadIngresoLegal)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionIngresoLegal)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildHospitalEvolutionPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    verificationCode: string;
    downloadCount: number;
  }) {
    const resultLines = this.readObjectArray(
      input.formData.resultadosEstudiosEvolHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.estudio)} (${this.readStringValue(item.fecha)}): ${this.readStringValue(item.resultado)}`.trim(),
    );
    const diagnosisLines = this.readObjectArray(
      input.formData.diagnosticosActivosEvolHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.diagnostico)} ${this.readStringValue(item.cie10)} - ${this.readStringValue(item.estado)}`.trim(),
    );
    const lines = [
      input.recordTitle,
      'Tipo: Evolución hospitalaria',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Código verificación: ${input.verificationCode}`,
      `Subjetivo: ${this.readStringValue(input.formData.subjetivoEvolHosp)}`,
      `TA/FC/FR/T/SpO2/EVA: ${this.readStringValue(input.formData.taSistolicaEvolHosp)}/${this.readStringValue(input.formData.taDiastolicaEvolHosp)} ${this.readStringValue(input.formData.fcEvolHosp)} ${this.readStringValue(input.formData.frEvolHosp)} ${this.readStringValue(input.formData.temperaturaEvolHosp)} ${this.readStringValue(input.formData.spo2EvolHosp)} ${this.readStringValue(input.formData.dolorEvaEvolHosp)}`,
      `Glucosa capilar: ${this.readStringValue(input.formData.glucosaCapilarEvolHosp)}`,
      `Exploración: ${this.readStringValue(input.formData.exploracionFisicaEvolHosp)}`,
      'Resultados:',
      ...(resultLines.length > 0 ? resultLines : ['Sin resultados capturados']),
      `Interpretación: ${this.readStringValue(input.formData.interpretacionClinicaEvolHosp)}`,
      `Cambios clínicos: ${this.readStringValue(input.formData.cambiosClinicosEvolHosp)}`,
      `Justificación NOM-004: ${this.readStringValue(input.formData.justificacionNom004EvolHosp)}`,
      'Diagnósticos activos:',
      ...(diagnosisLines.length > 0 ? diagnosisLines : ['Sin diagnósticos activos']),
      `Eventos adversos: ${this.readStringValue(input.formData.eventosAdversosEvolHosp)}`,
      `Complicaciones: ${this.readStringValue(input.formData.complicacionesEvolHosp)}`,
      `Tratamiento: ${this.readStringValue(input.formData.tratamientoEvolHosp)}`,
      `Estudios: ${this.readStringValue(input.formData.estudiosEvolHosp)}`,
      `Interconsultas: ${this.readStringValue(input.formData.interconsultasEvolHosp)}`,
      `Seguimiento: ${this.readStringValue(input.formData.seguimientoEvolHosp)}`,
      `Pronóstico: ${this.readStringValue(input.formData.pronosticoEvolHosp)}`,
      `Consentimiento vigente: ${this.readStringValue(input.formData.consentimientoVigenteEvolHosp)}`,
      `Información brindada: ${this.readStringValue(input.formData.informacionPacienteFamiliarEvolHosp)}`,
      `Profesional: ${this.readStringValue(input.formData.medicoEvolHospLegal)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaEvolHospLegal)}`,
      `Especialidad: ${this.readStringValue(input.formData.especialidadEvolHospLegal)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionEvolHospLegal)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildHospitalMedicalOrdersPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    verificationCode: string;
    downloadCount: number;
  }) {
    const medicationLines = this.readObjectArray(
      input.formData.medicamentosIndicacionesHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.medicamento)} ${this.readStringValue(item.dosis)} ${this.readStringValue(item.via)} ${this.readStringValue(item.frecuencia)} ${this.readStringValue(item.duracion)} ${this.readStringValue(item.prioridad)}`.trim(),
    );
    const solutionLines = this.readObjectArray(
      input.formData.solucionesIvIndicacionesHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.tipoSolucion)} ${this.readStringValue(item.volumenMl)} ml ${this.readStringValue(item.velocidadMlHora)} ml/h ${this.readStringValue(item.duracion)}`.trim(),
    );
    const studyLines = this.readObjectArray(
      input.formData.estudiosSolicitadosIndicacionesHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.tipoEstudio)} ${this.readStringValue(item.prioridad)} - ${this.readStringValue(item.indicacion)}`.trim(),
    );
    const consultationLines = this.readObjectArray(
      input.formData.interconsultasSolicitadasIndicacionesHosp,
    ).map((item, index) =>
      `${index + 1}. ${this.readStringValue(item.servicio)} ${this.readStringValue(item.prioridad)} - ${this.readStringValue(item.motivo)}`.trim(),
    );
    const traceLines = this.buildHospitalOrderTraceRows(input.formData).map(
      (item, index) =>
        `${index + 1}. ${item.orderLabel} - ${item.responsibleArea} - ${item.status}`,
    );
    const lines = [
      input.recordTitle,
      'Tipo: Indicaciones médicas',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Código verificación: ${input.verificationCode}`,
      'Medicamentos:',
      ...(medicationLines.length > 0 ? medicationLines : ['Sin medicamentos capturados']),
      'Soluciones IV:',
      ...(solutionLines.length > 0 ? solutionLines : ['Sin soluciones IV capturadas']),
      `Dieta: ${this.readStringValue(input.formData.dietaIndicacionesHosp)}`,
      `Reposo / actividad: ${this.readStringValue(input.formData.reposoActividadIndicacionesHosp)}`,
      `Posición: ${this.readStringValue(input.formData.posicionIndicacionesHosp)}`,
      `Cuidados generales: ${this.readStringValue(input.formData.cuidadosGeneralesIndicacionesHosp)}`,
      'Estudios solicitados:',
      ...(studyLines.length > 0 ? studyLines : ['Sin estudios solicitados']),
      'Interconsultas solicitadas:',
      ...(consultationLines.length > 0 ? consultationLines : ['Sin interconsultas solicitadas']),
      `Monitoreo enfermería: ${this.readStringValue(input.formData.monitoreoEnfermeriaIndicacionesHosp)}`,
      `Oxígeno: ${this.readStringValue(input.formData.oxigenoIndicacionesHosp)}`,
      `Control de líquidos: ${this.readStringValue(input.formData.controlLiquidosIndicacionesHosp)}`,
      `Hora inicio: ${this.readStringValue(input.formData.horaInicioIndicacionesHosp)}`,
      `Siguiente turno: ${this.readStringValue(input.formData.programacionSiguienteTurnoHosp)}`,
      `Usuario ejecutor: ${this.readStringValue(input.formData.usuarioEjecutorHosp)}`,
      'Trazabilidad:',
      ...(traceLines.length > 0 ? traceLines : ['Sin trazas generadas']),
      `Médico: ${this.readStringValue(input.formData.medicoIndicacionesLegal)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaIndicacionesLegal)}`,
      `Especialidad: ${this.readStringValue(input.formData.especialidadIndicacionesLegal)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionIndicacionesLegal)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildHospitalConsultationPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    verificationCode: string;
    downloadCount: number;
  }) {
    const lines = [
      input.recordTitle,
      'Tipo: Interconsultas',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Código verificación: ${input.verificationCode}`,
      `Estado: ${this.readStringValue(input.formData.estatusInterconsultaHosp)}`,
      `Solicitud: ${this.readStringValue(input.formData.fechaSolicitudInterHosp)} ${this.readStringValue(input.formData.horaSolicitudInterHosp)}`,
      `Solicitante: ${this.readStringValue(input.formData.medicoSolicitanteInterHosp)}`,
      `Servicio solicitante: ${this.readStringValue(input.formData.servicioSolicitanteInterHosp)}`,
      `Servicio interconsultado: ${this.readStringValue(input.formData.servicioInterconsultadoHosp)}`,
      `Prioridad: ${this.readStringValue(input.formData.prioridadInterHosp)}`,
      `SLA objetivo: ${this.readStringValue(input.formData.tiempoObjetivoRespuestaInterHosp)} min`,
      `Motivo: ${this.readStringValue(input.formData.motivoInterconsultaHosp)}`,
      `Criterio diagnóstico: ${this.readStringValue(input.formData.criterioDiagnosticoInterHosp)}`,
      `Diagnóstico relacionado: ${this.readStringValue(input.formData.diagnosticoRelacionadoInterHosp)}`,
      `CIE-10 relacionado: ${this.readStringValue(input.formData.cie10RelacionadoInterHosp)}`,
      `Estudios relacionados: ${this.readStringValue(input.formData.estudiosRelacionadosInterHosp)}`,
      `Respuesta: ${this.readStringValue(input.formData.fechaRespuestaInterHosp)} ${this.readStringValue(input.formData.horaRespuestaInterHosp)}`,
      `Interconsultante: ${this.readStringValue(input.formData.medicoInterconsultanteHosp)}`,
      `Impresión diagnóstica: ${this.readStringValue(input.formData.impresionDiagnosticaInterHosp)}`,
      `Sugerencias diagnósticas: ${this.readStringValue(input.formData.sugerenciasDiagnosticasInterHosp)}`,
      `Sugerencias terapéuticas: ${this.readStringValue(input.formData.sugerenciasTerapeuticasInterHosp)}`,
      `Requiere seguimiento: ${this.readStringValue(input.formData.requiereSeguimientoInterHosp)}`,
      `Resultado: ${this.readStringValue(input.formData.resultadoInterconsultaHosp)}`,
      `Tiempo respuesta real: ${this.readStringValue(input.formData.tiempoRespuestaRealInterHosp)}`,
      `Tiempo cierre: ${this.readStringValue(input.formData.tiempoCierreInterHosp)}`,
      `Profesional legal: ${this.readStringValue(input.formData.medicoInterLegal)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaInterLegal)}`,
      `Especialidad: ${this.readStringValue(input.formData.especialidadInterLegal)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionInterLegal)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ];

    return this.renderSimplePdf(lines);
  }

  private buildHospitalSurgicalDocumentPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const subdocumentType = this.readStringValue(
      input.formData.tipoSubdocumentoQuirurgico,
    );
    const sharedLines = [
      input.recordTitle,
      'Tipo: Procedimientos y cirugía',
      `Subdocumento: ${subdocumentType}`,
      `Paciente: ${input.encounter.patient.fullName}`,
      `CURP: ${this.readStringValue(input.formData.curpDocumentoQuirurgico)}`,
      `Expediente: ${this.readStringValue(input.formData.expedienteDocumentoQuirurgico)}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Folio documento: ${this.readStringValue(input.formData.folioDocumentoQuirurgico)}`,
      `Versión: ${this.readStringValue(input.formData.versionDocumentoQuirurgico)}`,
      `Hash: ${this.readStringValue(input.formData.hashDocumentoQuirurgico)}`,
      `Sello digital: ${this.readStringValue(input.formData.selloDigitalQuirurgico)}`,
    ];

    const bodyLines =
      subdocumentType === 'Nota preanestésica'
        ? [
            `Procedimiento programado: ${this.readStringValue(input.formData.procedimientoProgramadoPreanHosp)}`,
            `Fecha/hora valoración: ${this.readStringValue(input.formData.fechaValoracionPreanHosp)} ${this.readStringValue(input.formData.horaValoracionPreanHosp)}`,
            `ASA: ${this.readStringValue(input.formData.clasificacionAsaPreanHosp)}`,
            `Mallampati: ${this.readStringValue(input.formData.mallampatiPreanHosp)}`,
            `Plan anestésico: ${this.readStringValue(input.formData.planAnestesicoPreanHosp)}`,
            `Antecedentes anestésicos: ${this.readStringValue(input.formData.antecedentesAnestesicosPreanHosp)}`,
            `Alergias: ${this.readStringValue(input.formData.alergiasPreanHosp)}`,
            `Ayuno confirmado: ${this.readStringValue(input.formData.ayunoConfirmadoPreanHosp)}`,
            `Riesgo anestésico: ${this.readStringValue(input.formData.riesgoAnestesicoPreanHosp)}`,
            `Plan detallado: ${this.readStringValue(input.formData.planAnestesicoDetalladoPreanHosp)}`,
            `Anestesiólogo: ${this.readStringValue(input.formData.anestesiologoPreanHosp)}`,
            `Cédula anestesiólogo: ${this.readStringValue(input.formData.cedulaAnestesiologoPreanHosp)}`,
          ]
        : subdocumentType === 'Nota postoperatoria'
          ? [
              `Cirugía: ${this.readStringValue(input.formData.fechaCirugiaPostop)} ${this.readStringValue(input.formData.horaInicioCirugiaPostop)}-${this.readStringValue(input.formData.horaFinCirugiaPostop)}`,
              `Quirófano: ${this.readStringValue(input.formData.quirofanoPostop)}`,
              `Cirujano: ${this.readStringValue(input.formData.cirujanoPrincipalPostop)}`,
              `Anestesiólogo: ${this.readStringValue(input.formData.anestesiologoPostop)}`,
              `Diagnóstico pre/post: ${this.readStringValue(input.formData.diagnosticoPreoperatorioPostop)} / ${this.readStringValue(input.formData.diagnosticoPostoperatorioPostop)}`,
              `Procedimiento: ${this.readStringValue(input.formData.procedimientoRealizadoPostopHosp)}`,
              `Duración: ${this.readStringValue(input.formData.duracionCirugiaPostop)} min`,
              `Técnica: ${this.readStringValue(input.formData.tecnicaQuirurgicaPostop)}`,
              `Hallazgos: ${this.readStringValue(input.formData.hallazgosTransoperatoriosPostop)}`,
              `Conteo textil: ${this.readStringValue(input.formData.conteoTextilPostop)}`,
              `Complicaciones: ${this.readStringValue(input.formData.huboComplicacionesPostop)} ${this.readStringValue(input.formData.tipoComplicacionPostop)}`,
              `Estado postquirúrgico: ${this.readStringValue(input.formData.estadoInmediatoPostop)}`,
              `Pronóstico: ${this.readStringValue(input.formData.pronosticoPostop)}`,
            ]
          : subdocumentType === 'Nota postanestésica'
            ? [
                `Tipo anestesia: ${this.readStringValue(input.formData.tipoAnestesiaPostanesHosp)}`,
                `Ingreso/egreso: ${this.readStringValue(input.formData.horaIngresoPostanesHosp)}-${this.readStringValue(input.formData.horaEgresoPostanesHosp)}`,
                `TA/FC/FR/SpO2: ${this.readStringValue(input.formData.taPostanesHosp)} ${this.readStringValue(input.formData.fcPostanesHosp)} ${this.readStringValue(input.formData.frPostanesHosp)} ${this.readStringValue(input.formData.spo2PostanesHosp)}`,
                `Aldrete: ${this.readStringValue(input.formData.aldretePostanesHosp)}`,
                `Nivel conciencia: ${this.readStringValue(input.formData.nivelConcienciaPostanesHosp)}`,
                `Dolor EVA: ${this.readStringValue(input.formData.dolorEvaPostanesHosp)}`,
                `Complicaciones anestésicas: ${this.readStringValue(input.formData.complicacionesAnestesicasPostanesHosp)}`,
                `Anestesiólogo: ${this.readStringValue(input.formData.anestesiologoPostanesHosp)}`,
                `Cédula: ${this.readStringValue(input.formData.cedulaPostanesHosp)}`,
              ]
            : [
                `Diagnóstico preoperatorio: ${this.readStringValue(input.formData.diagnosticoPreoperatorioQuirHosp)}`,
                `CIE-10: ${this.readStringValue(input.formData.cie10PreoperatorioQuirHosp)}`,
                `Cirugía propuesta: ${this.readStringValue(input.formData.cirugiaPropuestaQuirHosp)}`,
                `Tipo cirugía: ${this.readStringValue(input.formData.tipoCirugiaQuirHosp)}`,
                `Cirujano principal: ${this.readStringValue(input.formData.cirujanoPrincipalQuirHosp)}`,
                `Anestesiólogo: ${this.readStringValue(input.formData.anestesiologoQuirHosp)}`,
                `Riesgos quirúrgicos: ${this.readStringValue(input.formData.riesgosQuirurgicosQuirHosp)}`,
                `ASA: ${this.readStringValue(input.formData.clasificacionAsaQuirHosp)}`,
                `Consentimiento: ${this.readStringValue(input.formData.consentimientoInformadoQuirHosp)}`,
                `Estudios preoperatorios: ${this.readStringValue(input.formData.estudiosPreoperatoriosQuirHosp)}`,
              ];

    return this.renderSimplePdf([
      ...sharedLines,
      ...bodyLines,
      `Profesional: ${this.readStringValue(input.formData.medicoQuirLegal)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaQuirLegal)}`,
      `Especialidad: ${this.readStringValue(input.formData.especialidadQuirLegal)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionQuirLegal)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ]);
  }

  private buildHospitalNursingShiftPdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    const vitalLines = this.readObjectArray(input.formData.signosVitalesSeriadosEnfHosp)
      .map((item, index) =>
        `${index + 1}. ${this.readStringValue(item.fecha)} ${this.readStringValue(item.hora)} TA ${this.readStringValue(item.taSistolica)}/${this.readStringValue(item.taDiastolica)} FC ${this.readStringValue(item.fc)} FR ${this.readStringValue(item.fr)} T ${this.readStringValue(item.temperatura)} SpO2 ${this.readStringValue(item.spo2)}`,
      );
    const medicationLines = this.readObjectArray(input.formData.medicamentosMinistradosEnfHosp)
      .map((item, index) =>
        `${index + 1}. ${this.readStringValue(item.medicamento)} ${this.readStringValue(item.horaProgramada)} ${this.readStringValue(item.estado)} ${this.readStringValue(item.motivoNoAdministracion)}`.trim(),
      );
    const procedureLines = this.readObjectArray(input.formData.procedimientosEnfermeriaTurnoHosp)
      .map((item, index) =>
        `${index + 1}. ${this.readStringValue(item.procedimiento)} ${this.readStringValue(item.hora)} ${this.readStringValue(item.realizadoPor)}`.trim(),
      );

    return this.renderSimplePdf([
      input.recordTitle,
      'Tipo: Enfermería',
      `Turno: ${this.readStringValue(input.formData.turnoEnfermeriaHosp)}`,
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Estado turno: ${this.readStringValue(input.formData.estadoTurnoEnfermeriaHosp)}`,
      `Hábitus: ${this.readStringValue(input.formData.habitusExteriorEnfHosp)}`,
      'Signos vitales seriados:',
      ...(vitalLines.length > 0 ? vitalLines : ['Sin signos capturados']),
      'Ministración de medicamentos:',
      ...(medicationLines.length > 0 ? medicationLines : ['Sin ministración capturada']),
      'Procedimientos:',
      ...(procedureLines.length > 0 ? procedureLines : ['Sin procedimientos capturados']),
      `Balance hídrico: ingresos ${this.readStringValue(input.formData.ingresosMlEnfHosp)} ml / egresos ${this.readStringValue(input.formData.egresosMlEnfHosp)} ml / total ${this.readStringValue(input.formData.balanceTotalEnfHosp)} ml`,
      `Cuidados: curaciones ${this.readStringValue(input.formData.curacionesEnfHosp)} / movilización ${this.readStringValue(input.formData.movilizacionEnfHosp)} / higiene ${this.readStringValue(input.formData.higieneEnfHosp)}`,
      `Vigilancia: ${this.readStringValue(input.formData.vigilanciaEnfHosp)}`,
      `Dispositivos: ${this.readStringValue(input.formData.dispositivosEnfHosp)}`,
      `Morse: ${this.readStringValue(input.formData.riesgoCaidaMorseEnfHosp)} / Braden: ${this.readStringValue(input.formData.riesgoUppBradenEnfHosp)}`,
      `Evento adverso: ${this.readStringValue(input.formData.eventoAdversoEnfHosp)} ${this.readStringValue(input.formData.tipoEventoAdversoEnfHosp)}`,
      `Acción evento: ${this.readStringValue(input.formData.descripcionAccionEventoEnfHosp)}`,
      `Observaciones: ${this.readStringValue(input.formData.observacionesGeneralesEnfHosp)}`,
      `Profesional: ${this.readStringValue(input.formData.profesionalEnfermeriaLegal)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaEnfermeriaLegal)}`,
      `Especialidad: ${this.readStringValue(input.formData.especialidadEnfermeriaLegal)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionEnfermeriaLegal)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ]);
  }

  private buildHospitalDischargePdfDocument(input: {
    encounter: TenantEncounterRecord;
    recordTitle: string;
    recordedAt: Date;
    formData: Record<string, unknown>;
    downloadCount: number;
  }) {
    return this.renderSimplePdf([
      input.recordTitle,
      'Tipo: Egreso',
      `Paciente: ${input.encounter.patient.fullName}`,
      `Episodio: ${input.encounter.encounterNumber}`,
      `Fecha registro: ${input.recordedAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      `Tipo/destino: ${this.readStringValue(input.formData.tipoEgresoHosp)} / ${this.readStringValue(input.formData.destinoPacienteEgresoHosp)}`,
      `Egreso: ${this.readStringValue(input.formData.fechaHoraEgresoHosp)}`,
      `Ingreso: ${this.readStringValue(input.formData.fechaIngresoReadonlyHosp)}`,
      `Días estancia: ${this.readStringValue(input.formData.diasEstanciaHosp)}`,
      `Estado al egreso: ${this.readStringValue(input.formData.estadoAlEgresoHosp)}`,
      `Motivo ingreso: ${this.readStringValue(input.formData.motivoIngresoEgresoHosp)}`,
      `Diagnóstico ingreso: ${this.readStringValue(input.formData.diagnosticoIngresoEgresoHosp)}`,
      `Diagnóstico final: ${this.readStringValue(input.formData.diagnosticoFinalEgresoHosp)}`,
      `CIE-10: ${this.readStringValue(input.formData.cie10EgresoHosp)}`,
      `Procedimientos: ${this.readStringValue(input.formData.procedimientosRealizadosEstanciaHosp)}`,
      `Manejo: ${this.readStringValue(input.formData.manejoRealizadoEgresoHosp)}`,
      `Evolución: ${this.readStringValue(input.formData.evolucionEstanciaEgresoHosp)}`,
      `Problemas pendientes: ${this.readStringValue(input.formData.problemasPendientesEgresoHosp)}`,
      `Medicamentos al egreso: ${this.readStringValue(input.formData.medicamentosEgresoHosp)}`,
      `Receta: ${this.readStringValue(input.formData.recetaGeneradaEgresoHosp)} ${this.readStringValue(input.formData.idRecetaRelacionadaEgresoHosp)}`,
      `Cuidados domicilio: ${this.readStringValue(input.formData.cuidadosDomicilioEgresoHosp)}`,
      `Dieta: ${this.readStringValue(input.formData.dietaEgresoHosp)}`,
      `Actividad/restricciones: ${this.readStringValue(input.formData.actividadRestriccionesEgresoHosp)}`,
      `Seguimiento: ${this.readStringValue(input.formData.seguimientoEgresoHosp)}`,
      `Próxima cita: ${this.readStringValue(input.formData.fechaProximaCitaEgresoHosp)}`,
      `Signos alarma: ${this.readStringValue(input.formData.signosAlarmaEgresoHosp)}`,
      `Educación: ${this.readStringValue(input.formData.educacionOtorgadaEgresoHosp)}`,
      `Comprensión: ${this.readStringValue(input.formData.comprensionPacienteEgresoHosp)}`,
      `Pronóstico: ${this.readStringValue(input.formData.pronosticoEgresoHosp)}`,
      `Médico responsable: ${this.readStringValue(input.formData.medicoResponsableEgresoHosp)}`,
      `Cédula: ${this.readStringValue(input.formData.cedulaResponsableEgresoHosp)}`,
      `Lugar: ${this.readStringValue(input.formData.lugarAtencionEgresoHosp)}`,
      `Descargas registradas: ${input.downloadCount}`,
    ]);
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
    if (
      this.isEmergencyDocumentRecord(input.encounterType, input.tabKey) &&
      !this.isAllowedEmergencyDocumentType(input.noteType)
    ) {
      throw new BadRequestException(
        'Tipo de documento no permitido en Urgencias',
      );
    }
    if (
      this.isHospitalDocumentRecord(input.encounterType, input.tabKey) &&
      !this.isAllowedHospitalDocumentType(input.noteType)
    ) {
      throw new BadRequestException(
        'Tipo de documento no permitido en Hospitalización',
      );
    }
    if (
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        input.encounterType,
        input.tabKey,
      ) &&
      !this.isAllowedAmbulatoryProcedureSupportingDocumentType(input.noteType)
    ) {
      throw new BadRequestException(
        'Tipo de documento no permitido en Procedimiento ambulatorio',
      );
    }

    const formData =
      input.formDataJson &&
      typeof input.formDataJson === 'object' &&
      !Array.isArray(input.formDataJson)
        ? (input.formDataJson as Record<string, unknown>)
        : {};

    if (
      this.isConsultationDocumentRecord(input.encounterType, input.tabKey) &&
      input.noteType === 'Solicitud de laboratorio' &&
      !this.readPrintableDocumentValue(formData.documentoCedulaProfesional)
    ) {
      throw new BadRequestException(
        'La cédula profesional es obligatoria para firmar la solicitud de laboratorio',
      );
    }

    const requiredFieldsByNoteType: Record<string, string[]> = {
      'Solicitud de laboratorio': [
        'documentoMotivoSolicitud',
        'documentoEstudiosSolicitados',
        'documentoPrioridad',
      ],
      'Solicitud de imagenología': [
        'documentoMotivoSolicitud',
        'documentoEstudiosSolicitados',
        'documentoPrioridad',
      ],
      'Referencia / contrarreferencia': [
        'documentoTipoReferencia',
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
      'Certificado / constancia': ['documentoTipoCertificado', 'documentoMotivo'],
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
          'viaAerea',
          'estadoHemodinamico',
          'estadoNeurologico',
          'destinoInicial',
          'requiereReevaluacion',
          'procedenciaIngreso',
          'ingresoPorReferencia',
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
    const emergencyDischargeRequiredFields = this.isEmergencyDischargeRecord(
      input.encounterType,
      input.tabKey,
    )
      ? [
          'tipoEgresoUrg',
          'destinoEgresoUrg',
          'fechaHoraEgresoUrg',
          'motivoIngresoEgresoUrg',
          'diagnosticoEgresoUrg',
          'cie10EgresoUrg',
          'manejoUrgenciasEgresoUrg',
          'evolucionEstanciaEgresoUrg',
          'estadoAlEgresoUrg',
          'signosAlarmaEgresoUrg',
          'educacionOtorgadaEgresoUrg',
          'comprensionPacienteEgresoUrg',
        ]
      : [];
    const hospitalAdmissionRequiredFields = this.isHospitalAdmissionRecord(
      input.encounterType,
      input.tabKey,
    )
      ? [
          'tipoIngresoHosp',
          'origenIngresoHosp',
          'estadoClinicoIngresoHosp',
          'servicioIngresoHosp',
          'pisoIngresoHosp',
          'habitacionIngresoHosp',
          'camaIngresoHosp',
          'fechaIngresoHosp',
          'horaIngresoHosp',
          'motivoIngresoClinicoHosp',
          'historiaPadecimientoActualHosp',
          'taSistolicaHosp',
          'taDiastolicaHosp',
          'fcHosp',
          'frHosp',
          'temperaturaHosp',
          'spo2Hosp',
          'exploracionFisicaHosp',
          'estadoMentalHosp',
          'dietaInicialHosp',
          'consentimientoHospitalizacionHosp',
          'riesgosIdentificadosHosp',
        ]
      : [];
    const hospitalEvolutionRequiredFields = this.isHospitalEvolutionRecord(
      input.encounterType,
      input.tabKey,
    )
      ? [
          'subjetivoEvolHosp',
          'taSistolicaEvolHosp',
          'taDiastolicaEvolHosp',
          'fcEvolHosp',
          'frEvolHosp',
          'temperaturaEvolHosp',
          'spo2EvolHosp',
          'dolorEvaEvolHosp',
          'exploracionFisicaEvolHosp',
          'interpretacionClinicaEvolHosp',
          'justificacionNom004EvolHosp',
          'diagnosticosActivosEvolHosp',
          'tratamientoEvolHosp',
        ]
      : [];
    const hospitalMedicalOrdersRequiredFields =
      this.isHospitalMedicalOrdersRecord(input.encounterType, input.tabKey)
        ? [
            'medicamentosIndicacionesHosp',
            'dietaIndicacionesHosp',
            'reposoActividadIndicacionesHosp',
            'horaInicioIndicacionesHosp',
          ]
        : [];
    const hospitalConsultationRequiredFields =
      this.isHospitalConsultationRecord(input.encounterType, input.tabKey)
        ? [
            'fechaSolicitudInterHosp',
            'horaSolicitudInterHosp',
            'servicioSolicitanteInterHosp',
            'servicioInterconsultadoHosp',
            'motivoInterconsultaHosp',
          ]
        : [];
    const hospitalSurgicalRequiredFields =
      this.isHospitalSurgicalDocumentRecord(input.encounterType, input.tabKey)
        ? this.resolveHospitalSurgicalRequiredFields(input.noteType)
        : [];
    const hospitalNursingRequiredFields =
      this.isHospitalNursingShiftRecord(input.encounterType, input.tabKey)
        ? [
            'turnoEnfermeriaHosp',
            'signosVitalesSeriadosEnfHosp',
            'medicamentosMinistradosEnfHosp',
        ]
        : [];
    const hospitalDischargeRequiredFields =
      this.isHospitalDischargeRecord(input.encounterType, input.tabKey)
        ? [
            'tipoEgresoHosp',
            'fechaHoraEgresoHosp',
            'estadoAlEgresoHosp',
            'diagnosticoFinalEgresoHosp',
            'cie10EgresoHosp',
            'cuidadosDomicilioEgresoHosp',
            'seguimientoEgresoHosp',
            'signosAlarmaEgresoHosp',
            'pronosticoEgresoHosp',
            'medicoResponsableEgresoHosp',
            'cedulaResponsableEgresoHosp',
          ]
        : [];
    const hospitalDocumentRequiredFields = this.isHospitalDocumentRecord(
      input.encounterType,
      input.tabKey,
    )
      ? this.resolveHospitalDocumentRequiredFields(input.noteType)
      : [];
    const ambulatorySupportingDocumentRequiredFields =
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        input.encounterType,
        input.tabKey,
      )
        ? this.resolveAmbulatoryProcedureSupportingDocumentRequiredFields(
            input.noteType,
          )
        : [];
    const ambulatoryPreprocedureRequiredFields =
      this.isAmbulatoryPreprocedureRecord(input.encounterType, input.tabKey)
        ? this.resolveAmbulatoryPreprocedureRequiredFields(formData)
        : [];
    const ambulatoryProcedureRequiredFields =
      this.isAmbulatoryProcedureRecord(input.encounterType, input.tabKey)
        ? this.resolveAmbulatoryProcedureRequiredFields(formData)
        : [];
    const ambulatoryRecoveryEvaluationRequiredFields =
      this.isAmbulatoryRecoveryEvaluationRecord(input.encounterType, input.tabKey)
        ? this.resolveAmbulatoryRecoveryEvaluationRequiredFields(formData)
        : [];
    const ambulatoryDischargePrescriptionRequiredFields =
      this.isAmbulatoryDischargePrescriptionRecord(input.encounterType, input.tabKey)
        ? this.resolveAmbulatoryDischargePrescriptionRequiredFields()
        : [];
    const ambulatoryDischargeRequiredFields =
      this.isAmbulatoryDischargeRecord(input.encounterType, input.tabKey)
        ? this.resolveAmbulatoryDischargeRequiredFields(formData)
        : [];

    const missingFields = [
      ...(this.isHospitalDocumentRecord(input.encounterType, input.tabKey) ||
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        input.encounterType,
        input.tabKey,
      )
        ? []
        : (requiredFieldsByNoteType[input.noteType] ?? [])),
      ...triageRequiredFields,
      ...emergencyInitialNoteRequiredFields,
      ...emergencyEvolutionRequiredFields,
      ...emergencyOrdersRequiredFields,
      ...emergencyConsultationRequiredFields,
      ...emergencyDischargeRequiredFields,
      ...hospitalAdmissionRequiredFields,
      ...hospitalEvolutionRequiredFields,
      ...hospitalMedicalOrdersRequiredFields,
      ...hospitalConsultationRequiredFields,
      ...hospitalSurgicalRequiredFields,
      ...hospitalNursingRequiredFields,
      ...hospitalDischargeRequiredFields,
      ...hospitalDocumentRequiredFields,
      ...ambulatorySupportingDocumentRequiredFields,
      ...ambulatoryPreprocedureRequiredFields,
      ...ambulatoryProcedureRequiredFields,
      ...ambulatoryRecoveryEvaluationRequiredFields,
      ...ambulatoryDischargePrescriptionRequiredFields,
      ...ambulatoryDischargeRequiredFields,
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
                  : this.isEmergencyDischargeRecord(input.encounterType, input.tabKey)
                    ? 'Completa los campos obligatorios del egreso de urgencias antes de firmarlo'
                    : this.isHospitalAdmissionRecord(input.encounterType, input.tabKey)
                      ? 'Completa los campos obligatorios del ingreso hospitalario antes de firmarlo'
                      : this.isHospitalEvolutionRecord(input.encounterType, input.tabKey)
                        ? 'Completa los campos obligatorios de la evolución hospitalaria antes de firmarla'
                        : this.isHospitalMedicalOrdersRecord(input.encounterType, input.tabKey)
                          ? 'Completa los campos obligatorios de indicaciones médicas antes de firmarlas'
                          : this.isHospitalConsultationRecord(input.encounterType, input.tabKey)
                            ? 'Completa los campos obligatorios de la interconsulta antes de firmarla'
                            : this.isHospitalSurgicalDocumentRecord(input.encounterType, input.tabKey)
                              ? 'Completa los campos obligatorios del subdocumento quirúrgico antes de firmarlo'
                              : this.isHospitalNursingShiftRecord(input.encounterType, input.tabKey)
                                ? 'Completa los signos vitales y medicamentos del turno antes de firmarlo'
                                : this.isHospitalDischargeRecord(input.encounterType, input.tabKey)
                                  ? 'Completa los campos obligatorios del egreso antes de firmarlo'
                                  : this.isHospitalDocumentRecord(input.encounterType, input.tabKey)
                                    ? 'Completa los campos obligatorios del documento hospitalario antes de firmarlo'
                                    : this.isAmbulatoryProcedureSupportingDocumentRecord(input.encounterType, input.tabKey)
                                      ? 'Completa los campos obligatorios del documento ambulatorio antes de firmarlo'
                                      : this.isAmbulatoryPreprocedureRecord(input.encounterType, input.tabKey)
                                      ? 'Completa los campos obligatorios de la valoración preprocedimiento antes de firmarla'
                                      : this.isAmbulatoryProcedureRecord(input.encounterType, input.tabKey)
                                        ? 'Completa los campos obligatorios del procedimiento antes de firmarlo'
                                        : this.isAmbulatoryRecoveryEvaluationRecord(input.encounterType, input.tabKey)
                                          ? 'Completa los campos obligatorios de Recuperación / Evaluación antes de firmarla'
                                          : this.isAmbulatoryDischargePrescriptionRecord(input.encounterType, input.tabKey)
                                            ? 'Completa los campos obligatorios de receta e indicaciones de egreso antes de firmar'
                                            : this.isAmbulatoryDischargeRecord(input.encounterType, input.tabKey)
                                              ? 'Completa los campos obligatorios de Egreso antes de firmar'
                  : 'Completa los campos obligatorios del documento antes de firmarlo',
      );
    }

    if (this.isAmbulatoryDischargeRecord(input.encounterType, input.tabKey)) {
      this.assertAmbulatoryDischargeReadyForSignature(formData);
    }

    if (this.isAmbulatoryDischargePrescriptionRecord(input.encounterType, input.tabKey)) {
      this.assertAmbulatoryDischargePrescriptionReadyForSignature(input, formData);
    }

    if (this.isAmbulatoryRecoveryEvaluationRecord(input.encounterType, input.tabKey)) {
      this.assertAmbulatoryRecoveryEvaluationReadyForSignature(formData);
    }

    if (this.isAmbulatoryProcedureRecord(input.encounterType, input.tabKey)) {
      this.assertAmbulatoryProcedureReadyForSignature(formData);
    }

    if (this.isAmbulatoryPreprocedureRecord(input.encounterType, input.tabKey)) {
      this.assertAmbulatoryPreprocedureReadyForSignature(formData);
    }

    if (this.isHospitalDocumentRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalDocumentReadyForSignature(input.noteType, formData);
    }

    if (
      this.isAmbulatoryProcedureSupportingDocumentRecord(
        input.encounterType,
        input.tabKey,
      )
    ) {
      this.assertAmbulatoryProcedureSupportingDocumentReadyForSignature(
        input.noteType,
        formData,
      );
    }

    if (this.isHospitalDischargeRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalDischargeReadyForSignature(formData);
    }

    if (this.isHospitalNursingShiftRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalNursingShiftReadyForSignature(formData);
    }

    if (this.isHospitalSurgicalDocumentRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalSurgicalDocumentReadyForSignature(input.noteType, formData);
    }

    if (this.isHospitalConsultationRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalConsultationReadyForSignature(formData);
    }

    if (this.isHospitalMedicalOrdersRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalMedicalOrdersReadyForSignature(formData);
    }

    if (this.isHospitalEvolutionRecord(input.encounterType, input.tabKey)) {
      this.assertHospitalEvolutionReadyForSignature(formData);
    }

    if (this.isEmergencyOrdersRecord(input.encounterType, input.tabKey)) {
      this.assertEmergencyOrdersReadyForSignature(formData);
    }

    if (this.isEmergencyTriageRecord(input.encounterType, input.tabKey)) {
      this.assertEmergencyTriageClinicalQuickState(formData);
      this.normalizeAndAssertEmergencyTriageDestination(formData);
      this.normalizeAndAssertEmergencyTriageOrigin(formData);
    }
  }

  private resolveAmbulatoryPreprocedureRequiredFields(
    formData: Record<string, unknown>,
  ) {
    const baseRequiredFields = [
      'diagnosticoPreoperatorioPreproc',
      'cie10Preproc',
      'procedimientoIndicadoPreproc',
      'indicacionClinicaPreproc',
      'tipoProcedimientoPreproc',
      'sintomasActualesPreproc',
      'evolucionPadecimientoPreproc',
      'pesoKgPreproc',
      'tallaCmPreproc',
      'taPreproc',
      'fcPreproc',
      'frPreproc',
      'spo2Preproc',
      'temperaturaPreproc',
      'exploracionFisicaPreproc',
      'estudiosPreoperatoriosPreproc',
      'tipoAnestesiaPrevistaPreproc',
      'riesgoAnestesicoPreproc',
      'clasificacionAsaPreproc',
      'riesgoQuirurgicoPreproc',
      'riesgosInformadosPreproc',
      'pronosticoPreproc',
      'preparacionPreoperatoriaPreproc',
      'ayunoConfirmadoPreproc',
      'institucionConsentimientoPreproc',
      'razonSocialConsentimientoPreproc',
      'lugarFechaConsentimientoPreproc',
      'consentimientoQuirurgicoPreproc',
      'fechaFirmaConsentimientoPreproc',
      'medicoExplicaPreproc',
      'actoAutorizadoPreproc',
      'riesgosEsperadosPreproc',
      'beneficiosEsperadosPreproc',
      'autorizacionContingenciasPreproc',
      'explicacionPacientePreproc',
      'nombreAutorizaPreproc',
      'relacionPacientePreproc',
      'nombreTestigo1Preproc',
      'nombreTestigo2Preproc',
      'nombreRealizaActoPreproc',
      'profesionalNombrePreproc',
      'profesionalCedulaPreproc',
      'profesionalEspecialidadPreproc',
      'lugarAtencionPreproc',
    ];
    const hasRelevantHistory = [
      'antDiabetesPreproc',
      'antHipertensionPreproc',
      'antCardiopatiaPreproc',
      'antCoagulopatiaPreproc',
      'antHepatopatiaPreproc',
      'antEnfermedadRenalPreproc',
      'antAlergiasMedicamentosasPreproc',
      'antCirugiasPreviasPreproc',
      'antTabaquismoPreproc',
    ].some((fieldKey) => Boolean(formData[fieldKey]));
    const hasAnesthesia = this.ambulatoryPreprocedureHasAnesthesia(formData);

    return [
      ...baseRequiredFields,
      ...(hasRelevantHistory ? ['detalleAntecedentesPreproc'] : []),
      ...(hasAnesthesia
        ? [
            'evaluacionClinicaAnestesiaPreproc',
            'tipoAnestesiaPlaneadaPreproc',
            'planAnestesicoPreproc',
            'nombreAnestesiologoPreproc',
            'cedulaAnestesiologoPreproc',
            'consentimientoAnestesicoPreproc',
          ]
        : []),
    ];
  }

  private resolveAmbulatoryProcedureRequiredFields(
    formData: Record<string, unknown>,
  ) {
    const baseRequiredFields = [
      'cirujanoPrincipalProc',
      'cedulaCirujanoProc',
      'anestesiologoProc',
      'cedulaAnestesiologoProc',
      'fechaProcedimientoProc',
      'horaInicioRealProc',
      'horaFinRealProc',
      'salaQuirofanoProc',
      'diagnosticoPreoperatorioProc',
      'ciePreoperatorioProc',
      'diagnosticoPostoperatorioProc',
      'ciePostoperatorioProc',
      'procedimientoRealizadoProc',
      'tipoAnestesiaProc',
      'tecnicaQuirurgicaProc',
      'hallazgosTransoperatoriosProc',
      'clasificacionHeridaProc',
      'sangradoEstimadoMlProc',
      'cuentaGasasInstrumentalProc',
      'huboComplicacionesProc',
      'destinoPostprocedimientoProc',
      'requiereMonitorizacionProc',
      'indicacionesInmediatasProc',
      'profesionalNombreProc',
      'profesionalCedulaProc',
      'profesionalEspecialidadProc',
      'lugarAtencionProc',
    ];
    const hasComplications = this.readStringValue(formData.huboComplicacionesProc) === 'SI';
    const hasAnesthesia = this.ambulatoryProcedureHasAnesthesia(formData);

    return [
      ...baseRequiredFields,
      ...(hasComplications
        ? ['tipoComplicacionProc', 'manejoComplicacionProc']
        : []),
      ...(hasAnesthesia
        ? [
            'postMedicamentosAnestesicosProc',
            'postDuracionAnestesiaProc',
            'postSolucionesAplicadasProc',
            'postIncidentesAnestesiaProc',
            'postEstadoClinicoEgresoSalaProc',
            'postPlanManejoProc',
            'postNombreAnestesiologoProc',
            'postCedulaAnestesiologoProc',
          ]
        : []),
    ];
  }

  private assertAmbulatoryProcedureReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const timeOutFields = [
      'toPacienteVerificadoProc',
      'toProcedimientoConfirmadoProc',
      'toSitioConfirmadoProc',
      'toRealizadoAntesIncisionProc',
      'toProfilaxisAntibioticaProc',
      'toEquipoInstrumentalProc',
      'toConsentimientoVerificadoProc',
      'toImagenesDisponiblesProc',
    ];
    if (timeOutFields.some((fieldKey) => !Boolean(formData[fieldKey]))) {
      throw new BadRequestException(
        'Completa todo el Time-Out antes de firmar el procedimiento',
      );
    }

    if (this.readStringValue(formData.cuentaGasasInstrumentalProc) === 'INCOMPLETA') {
      throw new BadRequestException(
        'No se puede firmar con cuenta de gasas e instrumental incompleta',
      );
    }

    if (
      this.readStringValue(formData.huboComplicacionesProc) === 'SI' &&
      (!this.hasCapturedValue(formData.tipoComplicacionProc) ||
        !this.hasCapturedValue(formData.manejoComplicacionProc))
    ) {
      throw new BadRequestException(
        'Documenta tipo y manejo de la complicación antes de firmar',
      );
    }

    if (
      this.readStringValue(formData.envioPatologiaProc) === 'SI' &&
      !this.hasCapturedValue(formData.folioPatologiaProc)
    ) {
      throw new BadRequestException(
        'Captura el folio de patología cuando se envíe pieza quirúrgica',
      );
    }
  }

  private resolveAmbulatoryRecoveryEvaluationRequiredFields(
    formData: Record<string, unknown>,
  ) {
    const baseRequiredFields = [
      'fechaRecEval',
      'horaValoracionRecEval',
      'sintomasPacienteRecEval',
      'toleranciaViaOralRecEval',
      'deambulacionRecEval',
      'miccionRecEval',
      'taSistolicaRecEval',
      'taDiastolicaRecEval',
      'fcRecEval',
      'frRecEval',
      'spo2RecEval',
      'temperaturaRecEval',
      'dolorEvaRecEval',
      'estadoConcienciaRecEval',
      'estadoGeneralRecEval',
      'exploracionPostprocedimientoRecEval',
      'complicacionesPostprocedimientoRecEval',
      'aldreteActividadRecEval',
      'aldreteRespiracionRecEval',
      'aldreteCirculacionRecEval',
      'aldreteConcienciaRecEval',
      'aldreteSpo2RecEval',
      'aldreteTotalRecEval',
      'planVigilanciaRecEval',
      'destinoPostRecuperacionRecEval',
      'profesionalNombreRecEval',
      'profesionalCedulaRecEval',
      'profesionalEspecialidadRecEval',
      'lugarAtencionRecEval',
    ];

    return [
      ...baseRequiredFields,
      ...(this.readStringValue(formData.complicacionesPostprocedimientoRecEval) ===
      'SI'
        ? ['manejoComplicacionRecEval']
        : []),
      ...(this.readStringValue(formData.eventoAdversoRecEval) === 'SI'
        ? ['descripcionAccionEventoRecEval']
        : []),
    ];
  }

  private resolveAmbulatoryDischargePrescriptionRequiredFields() {
    return [
      'folioRecetaEgreso',
      'tipoRecetaEgreso',
      'fechaEmisionRecetaEgreso',
      'institucionEmisoraRecetaEgreso',
      'rfcMedicoRecetaEgreso',
      'licenciaSanitariaRecetaEgreso',
      'dietaIndicacionesEgreso',
      'actividadFisicaNivelEgreso',
      'cuidadosHeridaEgreso',
      'signosAlarmaEgreso',
      'fechaCitaSeguimientoEgreso',
      'educacionOtorgadaEgreso',
      'profesionalNombreRecetaEgreso',
      'profesionalCedulaRecetaEgreso',
      'profesionalEspecialidadRecetaEgreso',
      'lugarAtencionRecetaEgreso',
    ];
  }

  private resolveAmbulatoryDischargeRequiredFields(
    formData: Record<string, unknown>,
  ) {
    const transferRequired = ['TRASLADO', 'REFERENCIA'].includes(
      this.readStringValue(formData.tipoEgresoAmb),
    )
      ? [
          'referenciaFechaHoraEgresoAmb',
          'referenciaMotivoEnvioEgresoAmb',
          'referenciaResumenClinicoEgresoAmb',
          'referenciaDiagnosticosEgresoAmb',
          'referenciaEstablecimientoReceptorEgresoAmb',
          'referenciaMedicoReceptorEgresoAmb',
          'referenciaMedioTrasladoEgresoAmb',
          'referenciaCondicionesTrasladoEgresoAmb',
        ]
      : [];
    return [
      'tipoEgresoAmb',
      'destinoEgresoAmb',
      'fechaEgresoAmb',
      'horaEgresoAmb',
      'diagnosticoFinalEgresoAmb',
      'cie10EgresoAmb',
      'condicionesEgresoAmb',
      'estadoClinicoEgresoAmb',
      'taEgresoAmb',
      'fcEgresoAmb',
      'frEgresoAmb',
      'temperaturaEgresoAmb',
      'spo2EgresoAmb',
      'evaDolorEgresoAmb',
      'aldreteEgresoAmb',
      'pronosticoEgresoAmb',
      'cumpleCriteriosAltaEgresoAmb',
      'aldreteFinalEgresoAmb',
      'motivoProcedimientoEgresoAmb',
      'procedimientoRealizadoEgresoAmb',
      'evolucionRecuperacionEgresoAmb',
      'estadoAlEgresoResumenAmb',
      'educacionPacienteEgresoAmb',
      'medicoAutorizaEgresoAmb',
      'cedulaAutorizaEgresoAmb',
      'profesionalNombreEgresoAmb',
      'profesionalCedulaEgresoAmb',
      ...transferRequired,
    ];
  }

  private assertAmbulatoryDischargeReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    if (!this.ambulatoryDischargeCriteriaComplete(formData)) {
      throw new BadRequestException(
        'No se puede firmar el egreso: deben cumplirse todos los criterios de alta',
      );
    }
    if (this.readStringValue(formData.cumpleCriteriosAltaEgresoAmb) !== 'SI') {
      throw new BadRequestException(
        'No se puede firmar el egreso si no cumple criterios de alta',
      );
    }
    const finalAldrete = this.readRoundedNumericValue(formData.aldreteFinalEgresoAmb);
    if (
      this.readStringValue(formData.tipoEgresoAmb) === 'ALTA_MEDICA' &&
      (finalAldrete === null || finalAldrete < 9)
    ) {
      throw new BadRequestException(
        'No se puede firmar alta ambulatoria con Aldrete final menor a 9',
      );
    }
    if (
      !Boolean(formData.pacienteComprendeEgresoAmb) &&
      !Boolean(formData.familiarInformadoEgresoAmb)
    ) {
      throw new BadRequestException(
        'Marca comprensión del paciente o familiar informado antes de firmar el egreso',
      );
    }
    if (!this.hasCapturedValue(formData.recetaRelacionadaEgresoAmb)) {
      throw new BadRequestException(
        'Vincula la receta e indicaciones de egreso antes de firmar el Egreso',
      );
    }
  }

  private ambulatoryDischargeCriteriaComplete(formData: Record<string, unknown>) {
    return [
      'altaSignosEstablesEgresoAmb',
      'altaDolorControladoEgresoAmb',
      'altaToleraViaOralEgresoAmb',
      'altaDeambulacionEgresoAmb',
      'altaMiccionEgresoAmb',
      'altaHeridasSinSangradoEgresoAmb',
      'altaAldreteMayor9EgresoAmb',
      'altaAcompananteEgresoAmb',
      'altaIndicacionesEntregadasEgresoAmb',
      'altaRecetaEntregadaEgresoAmb',
    ].every((fieldKey) => Boolean(formData[fieldKey]));
  }

  private assertAmbulatoryDischargePrescriptionReadyForSignature(
    input: {
      encounterType: EncounterType;
      tabKey: string;
      formDataJson: Prisma.JsonValue;
    },
    formData: Record<string, unknown>,
  ) {
    void input;
    const medications = this.readObjectArray(formData.medicamentosRecetaEgreso);
    if (medications.length === 0) {
      throw new BadRequestException(
        'Agrega al menos un medicamento antes de firmar la receta',
      );
    }
    for (const medication of medications) {
      if (
        !this.hasCapturedValue(medication.medicamento) ||
        !this.hasCapturedValue(medication.dosis) ||
        !this.hasCapturedValue(medication.via) ||
        !this.hasCapturedValue(medication.frecuencia) ||
        !this.hasCapturedValue(medication.duracion) ||
        !this.hasCapturedValue(medication.indicacion)
      ) {
        throw new BadRequestException(
          'Completa medicamento, dosis, vía, frecuencia, duración e indicación en todos los medicamentos',
        );
      }
    }
    const normalizedNames = medications
      .map((item) => this.readStringValue(item.medicamento).toLowerCase())
      .filter(Boolean);
    const hasBlockingInteraction =
      normalizedNames.some((name) => name.includes('warfarina')) &&
      normalizedNames.some((name) => name.includes('ibuprofeno'));
    if (hasBlockingInteraction) {
      throw new BadRequestException(
        'No se puede firmar con interacción grave: warfarina con ibuprofeno',
      );
    }
    if (
      !Boolean(formData.pacienteComprendeIndicacionesEgreso) &&
      !Boolean(formData.familiarInformadoEgreso)
    ) {
      throw new BadRequestException(
        'Marca comprensión del paciente o familiar informado antes de firmar',
      );
    }
  }

  private assertAmbulatoryRecoveryEvaluationReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const aldreteTotal = this.calculateAldreteTotal(formData);
    if (aldreteTotal === null) {
      throw new BadRequestException(
        'Calcula la escala de Aldrete antes de firmar Recuperación / Evaluación',
      );
    }

    if (
      this.readStringValue(formData.complicacionesPostprocedimientoRecEval) ===
        'SI' &&
      !this.hasCapturedValue(formData.manejoComplicacionRecEval)
    ) {
      throw new BadRequestException(
        'Documenta el manejo de la complicación antes de firmar',
      );
    }

    if (
      this.readStringValue(formData.eventoAdversoRecEval) === 'SI' &&
      !this.hasCapturedValue(formData.descripcionAccionEventoRecEval)
    ) {
      throw new BadRequestException(
        'Documenta la descripción y acción del evento adverso antes de firmar',
      );
    }

    const alerts = this.buildAmbulatoryRecoveryEvaluationAlerts(
      formData,
      aldreteTotal,
    );
    const hasRedAlert = alerts.some((alert) => alert.severity === 'ROJO');
    const destination = this.readStringValue(formData.destinoPostRecuperacionRecEval);
    if (destination === 'ALTA_AMBULATORIA') {
      if (aldreteTotal < 9) {
        throw new BadRequestException(
          'No se puede indicar alta ambulatoria con Aldrete menor a 9',
        );
      }
      if (!this.ambulatoryRecoveryDischargeChecklistComplete(formData)) {
        throw new BadRequestException(
          'Completa todos los criterios de alta ambulatoria antes de firmar',
        );
      }
      if (hasRedAlert) {
        throw new BadRequestException(
          'No se puede indicar alta ambulatoria con alerta roja activa',
        );
      }
    }
  }

  private ambulatoryRecoveryDischargeChecklistComplete(
    formData: Record<string, unknown>,
  ) {
    return [
      'altaToleraViaOralRecEval',
      'altaDeambulacionIndependienteRecEval',
      'altaMiccionEspontaneaRecEval',
      'altaDolorControladoRecEval',
      'altaSinNauseaVomitoRecEval',
      'altaSignosVitalesEstablesRecEval',
      'altaHeridasSinSangradoRecEval',
      'altaAldreteMayorIgual9RecEval',
      'altaAcompananteResponsableRecEval',
      'altaInstruccionesEntregadasRecEval',
    ].every((fieldKey) => Boolean(formData[fieldKey]));
  }

  private ambulatoryProcedureHasAnesthesia(formData: Record<string, unknown>) {
    const anesthesiaType = this.readStringValue(formData.tipoAnestesiaProc);
    return anesthesiaType !== '' && anesthesiaType !== 'NO_APLICA';
  }

  private assertAmbulatoryPreprocedureReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const checklistFields = [
      'omsPacienteIdentificadoPreproc',
      'omsProcedimientoConfirmadoPreproc',
      'omsSitioQuirurgicoMarcadoPreproc',
      'omsConsentimientoFirmadoPreproc',
      'omsAlergiasVerificadasPreproc',
      'omsEstudiosDisponiblesPreproc',
      'omsAyunoVerificadoPreproc',
      'omsProfilaxisAntibioticaIndicadaPreproc',
    ];
    if (checklistFields.some((fieldKey) => !Boolean(formData[fieldKey]))) {
      throw new BadRequestException(
        'Completa todo el checklist de seguridad quirúrgica OMS antes de firmar',
      );
    }

    if (this.readStringValue(formData.consentimientoQuirurgicoPreproc) !== 'FIRMADO') {
      throw new BadRequestException(
        'El consentimiento quirúrgico debe estar firmado para firmar la valoración',
      );
    }

    if (
      this.ambulatoryPreprocedureHasAnesthesia(formData) &&
      this.readStringValue(formData.consentimientoAnestesicoPreproc) !== 'FIRMADO'
    ) {
      throw new BadRequestException(
        'El consentimiento anestésico debe estar firmado cuando aplica anestesia',
      );
    }

    if (!Boolean(formData.pacienteComprendePreproc)) {
      throw new BadRequestException(
        'Confirma que el paciente comprende la información otorgada',
      );
    }

    if (!Boolean(formData.responsableInformadoPreproc)) {
      throw new BadRequestException(
        'Confirma que el responsable fue informado',
      );
    }

    if (this.readStringValue(formData.ayunoConfirmadoPreproc) !== 'SI') {
      throw new BadRequestException(
        'No se puede firmar si el ayuno no está confirmado',
      );
    }
  }

  private ambulatoryPreprocedureHasAnesthesia(formData: Record<string, unknown>) {
    const anesthesiaType = this.readStringValue(
      formData.tipoAnestesiaPrevistaPreproc,
    );
    return anesthesiaType !== '' && anesthesiaType !== 'NO_APLICA';
  }

  private resolveHospitalSurgicalRequiredFields(noteType: string) {
    if (noteType === 'Nota preanestésica') {
      return [
        'fechaValoracionPreanHosp',
        'horaValoracionPreanHosp',
        'procedimientoProgramadoPreanHosp',
        'clasificacionAsaPreanHosp',
        'mallampatiPreanHosp',
        'planAnestesicoPreanHosp',
        'riesgoAnestesicoPreanHosp',
        'planAnestesicoDetalladoPreanHosp',
        'anestesiologoPreanHosp',
        'cedulaAnestesiologoPreanHosp',
      ];
    }

    if (noteType === 'Nota postoperatoria') {
      return [
        'fechaCirugiaPostop',
        'horaInicioCirugiaPostop',
        'horaFinCirugiaPostop',
        'quirofanoPostop',
        'cirujanoPrincipalPostop',
        'anestesiologoPostop',
        'diagnosticoPreoperatorioPostop',
        'diagnosticoPostoperatorioPostop',
        'procedimientoRealizadoPostopHosp',
        'tecnicaQuirurgicaPostop',
        'hallazgosTransoperatoriosPostop',
        'conteoTextilPostop',
        'estadoHemodinamicoPostop',
        'nivelConcienciaPostop',
        'dolorPostop',
        'destinoPostop',
        'estadoInmediatoPostop',
        'pronosticoPostop',
      ];
    }

    if (noteType === 'Nota postanestésica') {
      return [
        'tipoAnestesiaPostanesHosp',
        'horaIngresoPostanesHosp',
        'horaEgresoPostanesHosp',
        'taPostanesHosp',
        'fcPostanesHosp',
        'frPostanesHosp',
        'spo2PostanesHosp',
        'aldretePostanesHosp',
        'nivelConcienciaPostanesHosp',
        'dolorEvaPostanesHosp',
        'anestesiologoPostanesHosp',
        'cedulaPostanesHosp',
      ];
    }

    return [
      'diagnosticoPreoperatorioQuirHosp',
      'cie10PreoperatorioQuirHosp',
      'cirugiaPropuestaQuirHosp',
      'tipoCirugiaQuirHosp',
      'cirujanoPrincipalQuirHosp',
      'anestesiologoQuirHosp',
      'riesgosQuirurgicosQuirHosp',
      'clasificacionAsaQuirHosp',
      'consentimientoInformadoQuirHosp',
    ];
  }

  private resolveHospitalDocumentRequiredFields(noteType: string) {
    if (noteType === 'Solicitud de laboratorio') {
      return ['documentoEstudiosLaboratorio', 'documentoDiagnosticoPrincipal'];
    }

    if (noteType === 'Solicitud de imagenología') {
      return [
        'documentoEstudioImagen',
        'documentoTipoImagen',
        'documentoIndicacionClinicaImagen',
        'documentoDiagnosticoPrincipal',
      ];
    }

    if (noteType === 'Consentimiento informado') {
      return [
        'documentoProcedimientoNombre',
        'documentoProcedimientoDescripcion',
        'documentoRiesgosGenerales',
        'documentoBeneficios',
        'documentoNombrePacienteConsentimiento',
      ];
    }

    if (noteType === 'Resumen clínico') {
      return [
        'documentoMotivoAtencion',
        'documentoDiagnosticosIniciales',
        'documentoEvolucion',
        'documentoEstadoActual',
        'documentoPlan',
      ];
    }

    if (noteType === 'Referencia / traslado') {
      return [
        'documentoUnidadOrigen',
        'documentoUnidadReceptora',
        'documentoMotivoTraslado',
        'documentoResumenClinicoBreve',
        'documentoEstabilidadPaciente',
      ];
    }

    if (noteType === 'Defunción') {
      return [
        'documentoFechaMuerte',
        'documentoHoraMuerte',
        'documentoLugarMuerte',
        'documentoCausaInmediata',
        'documentoCausaBasica',
        'documentoTipoMuerte',
        'documentoMedicoCertificante',
        'documentoCedulaCertificante',
      ];
    }

    return [];
  }

  private assertHospitalDocumentReadyForSignature(
    noteType: string,
    formData: Record<string, unknown>,
  ) {
    if (noteType === 'Solicitud de laboratorio') {
      const studies = this.readObjectArray(formData.documentoEstudiosLaboratorio);
      if (
        studies.length === 0 ||
        studies.some(
          (study) =>
            !this.hasCapturedValue(study.tipoEstudio) ||
            !this.hasCapturedValue(study.prioridad),
        )
      ) {
        throw new BadRequestException(
          'Cada estudio de laboratorio debe tener tipo de estudio y prioridad',
        );
      }
    }

    if (
      noteType === 'Defunción' &&
      ['ACCIDENTAL', 'VIOLENTA'].includes(
        this.readStringValue(formData.documentoTipoMuerte),
      ) &&
      !this.hasCapturedValue(formData.documentoAvisoInstitucionalDefuncion)
    ) {
      throw new BadRequestException(
        'Registra el aviso institucional cuando la muerte sea accidental o violenta',
      );
    }
  }

  private resolveAmbulatoryProcedureSupportingDocumentRequiredFields(
    noteType: string,
  ) {
    if (noteType === 'Solicitud de laboratorio') {
      return ['documentoTipoSolicitud', 'documentoPrioridad', 'documentoMotivoSolicitud'];
    }

    if (noteType === 'Solicitud de imagenología') {
      return ['documentoTipoImagen', 'documentoRegionAnatomica', 'documentoMotivoSolicitud'];
    }

    if (noteType === 'Referencia / contrarreferencia') {
      return [
        'documentoTipoReferencia',
        'documentoMotivoEnvio',
        'documentoDiagnosticoPrincipal',
        'documentoProcedimientoRealizado',
        'documentoPlanRecomendaciones',
      ];
    }

    if (noteType === 'Consentimiento informado') {
      return [
        'documentoProcedimientoNombre',
        'documentoRiesgos',
        'documentoBeneficios',
        'documentoAutorizacionLegal',
        'documentoFirmaPaciente',
      ];
    }

    if (noteType === 'Certificado / constancia') {
      return ['documentoTipoCertificado'];
    }

    return [];
  }

  private assertAmbulatoryProcedureSupportingDocumentReadyForSignature(
    noteType: string,
    formData: Record<string, unknown>,
  ) {
    if (noteType === 'Nota de cierre') {
      throw new BadRequestException(
        'Procedimiento ambulatorio no utiliza Nota de cierre en Documentos',
      );
    }

    if (noteType === 'Solicitud de laboratorio') {
      const studies = this.readObjectArray(formData.documentoEstudiosLaboratorio);
      if (
        studies.length === 0 &&
        !this.hasCapturedValue(formData.documentoEstudiosSolicitados)
      ) {
        throw new BadRequestException(
          'Agrega al menos un estudio de laboratorio o un estudio adicional',
        );
      }
    }

    if (
      noteType === 'Solicitud de imagenología' &&
      this.readStringValue(formData.documentoConContraste) === 'Con contraste' &&
      this.hasCapturedValue(formData.documentoAlertaContraste)
    ) {
      throw new BadRequestException(
        'Existe alerta por contraste. Verifica alergias o contraindicaciones antes de firmar',
      );
    }

    if (noteType === 'Certificado / constancia') {
      const certificateType = this.readStringValue(formData.documentoTipoCertificado);
      if (
        certificateType === 'Incapacidad' &&
        (!this.hasCapturedValue(formData.documentoDiasIncapacidad) ||
          !this.hasCapturedValue(formData.documentoReposoInicio) ||
          !this.hasCapturedValue(formData.documentoReposoFin))
      ) {
        throw new BadRequestException(
          'La incapacidad debe incluir días e intervalo de fechas',
        );
      }
      if (
        certificateType === 'Constancia médica' &&
        !this.hasCapturedValue(formData.documentoTextoConstancia)
      ) {
        throw new BadRequestException(
          'La constancia médica debe incluir texto estructurado',
        );
      }
    }
  }

  private assertHospitalSurgicalDocumentReadyForSignature(
    noteType: string,
    formData: Record<string, unknown>,
  ) {
    if (
      noteType === 'Nota postoperatoria' &&
      this.readStringValue(formData.conteoTextilPostop) !== 'COMPLETO'
    ) {
      throw new BadRequestException(
        'No se puede firmar la nota postoperatoria con conteo textil incompleto',
      );
    }

    if (
      noteType === 'Nota postoperatoria' &&
      this.readStringValue(formData.huboComplicacionesPostop) === 'SI' &&
      (!this.hasCapturedValue(formData.tipoComplicacionPostop) ||
        !this.hasCapturedValue(formData.manejoComplicacionPostop))
    ) {
      throw new BadRequestException(
        'Documenta tipo y manejo de las complicaciones antes de firmar la nota postoperatoria',
      );
    }
  }

  private assertHospitalNursingShiftReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const vitals = this.readObjectArray(formData.signosVitalesSeriadosEnfHosp);
    if (
      vitals.length === 0 ||
      vitals.some(
        (vital) =>
          !this.hasCapturedValue(vital.fecha) ||
          !this.hasCapturedValue(vital.hora) ||
          !this.hasCapturedValue(vital.taSistolica) ||
          !this.hasCapturedValue(vital.taDiastolica) ||
          !this.hasCapturedValue(vital.fc) ||
          !this.hasCapturedValue(vital.fr) ||
          !this.hasCapturedValue(vital.temperatura) ||
          !this.hasCapturedValue(vital.spo2),
      )
    ) {
      throw new BadRequestException(
        'Cada toma de signos vitales debe tener fecha, hora, TA, FC, FR, temperatura y SpO2',
      );
    }

    const medications = this.readObjectArray(formData.medicamentosMinistradosEnfHosp);
    if (
      medications.length === 0 ||
      medications.some(
        (medication) =>
          !this.hasCapturedValue(medication.medicamento) ||
          !this.hasCapturedValue(medication.horaProgramada) ||
          !this.hasCapturedValue(medication.estado) ||
          !this.hasCapturedValue(medication.enfermeria),
      )
    ) {
      throw new BadRequestException(
        'Cada medicamento del turno debe venir de indicaciones, tener hora programada, estado y responsable de enfermería',
      );
    }

    if (
      medications.some(
        (medication) =>
          this.readStringValue(medication.estado) === 'NO_ADMINISTRADO' &&
          !this.hasCapturedValue(medication.motivoNoAdministracion),
      )
    ) {
      throw new BadRequestException(
        'Justifica todo medicamento marcado como no administrado',
      );
    }

    if (
      this.readStringValue(formData.eventoAdversoEnfHosp) === 'SI' &&
      (!this.hasCapturedValue(formData.tipoEventoAdversoEnfHosp) ||
        !this.hasCapturedValue(formData.descripcionAccionEventoEnfHosp))
    ) {
      throw new BadRequestException(
        'Documenta tipo, descripción y acción del evento adverso antes de firmar el turno',
      );
    }
  }

  private assertHospitalDischargeReadyForSignature(formData: Record<string, unknown>) {
    const admittedAt = this.parseOptionalDate(formData.fechaIngresoReadonlyHosp);
    const dischargedAt = this.parseOptionalDate(formData.fechaHoraEgresoHosp);

    if (admittedAt && dischargedAt && dischargedAt < admittedAt) {
      throw new BadRequestException(
        'La fecha de egreso no puede ser menor a la fecha de ingreso',
      );
    }

    if (
      this.readStringValue(formData.tipoEgresoHosp) === 'TRASLADO' &&
      !this.hasCapturedValue(formData.unidadReceptoraEgresoHosp)
    ) {
      throw new BadRequestException(
        'Captura la unidad receptora para el egreso por traslado',
      );
    }

    if (
      this.hasCapturedValue(formData.medicamentosEgresoHosp) &&
      !this.hasCapturedValue(formData.idRecetaRelacionadaEgresoHosp) &&
      !this.hasCapturedValue(formData.justificacionSinRecetaEgresoHosp)
    ) {
      throw new BadRequestException(
        'Vincula la receta de egreso o justifica por qué no se genera',
      );
    }

    if (
      this.hasCapturedValue(formData.tipoIncapacidadEgresoHosp) &&
      !this.hasCapturedValue(formData.diasIncapacidadEgresoHosp)
    ) {
      throw new BadRequestException(
        'Captura los días de incapacidad cuando exista tipo de incapacidad',
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

  private assertHospitalEvolutionReadyForSignature(formData: Record<string, unknown>) {
    const resultsMissingDate = this
      .readObjectArray(formData.resultadosEstudiosEvolHosp)
      .some((result) => {
        const hasAnyResultValue =
          this.hasCapturedValue(result.estudio) ||
          this.hasCapturedValue(result.resultado);

        return hasAnyResultValue && !this.hasCapturedValue(result.fecha);
      });

    if (resultsMissingDate) {
      throw new BadRequestException(
        'Cada resultado capturado en la evolución hospitalaria debe tener fecha',
      );
    }

    const diagnoses = this.readObjectArray(formData.diagnosticosActivosEvolHosp);
    const hasIncompleteDiagnosis = diagnoses.some(
      (diagnosis) =>
        !this.hasCapturedValue(diagnosis.diagnostico) ||
        !this.hasCapturedValue(diagnosis.estado),
    );

    if (diagnoses.length === 0 || hasIncompleteDiagnosis) {
      throw new BadRequestException(
        'Captura diagnóstico y estado para cada diagnóstico activo de la evolución hospitalaria',
      );
    }
  }

  private assertHospitalMedicalOrdersReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const medications = this.readObjectArray(formData.medicamentosIndicacionesHosp);
    const invalidMedication = medications.some(
      (medication) =>
        !this.hasCapturedValue(medication.medicamento) ||
        !this.hasCapturedValue(medication.dosis) ||
        !this.hasCapturedValue(medication.via) ||
        !this.hasCapturedValue(medication.frecuencia) ||
        !this.hasCapturedValue(medication.duracion),
    );

    if (medications.length === 0 || invalidMedication) {
      throw new BadRequestException(
        'Cada medicamento debe tener medicamento, dosis, vía, frecuencia y duración',
      );
    }

    const invalidSolution = this
      .readObjectArray(formData.solucionesIvIndicacionesHosp)
      .some(
        (solution) =>
          this.hasCapturedValue(solution.tipoSolucion) &&
          !this.hasCapturedValue(solution.volumenMl),
      );

    if (invalidSolution) {
      throw new BadRequestException(
        'Cada solución IV capturada debe tener volumen en ml',
      );
    }

    const invalidStudy = this
      .readObjectArray(formData.estudiosSolicitadosIndicacionesHosp)
      .some(
        (study) =>
          this.hasCapturedValue(study.indicacion) &&
          !this.hasCapturedValue(study.tipoEstudio),
      );

    if (invalidStudy) {
      throw new BadRequestException(
        'Cada estudio solicitado debe tener tipo de estudio',
      );
    }

    const invalidConsultation = this
      .readObjectArray(formData.interconsultasSolicitadasIndicacionesHosp)
      .some(
        (consultation) =>
          this.hasCapturedValue(consultation.motivo) &&
          !this.hasCapturedValue(consultation.servicio),
      );

    if (invalidConsultation) {
      throw new BadRequestException(
        'Cada interconsulta solicitada debe tener servicio',
      );
    }
  }

  private assertHospitalConsultationReadyForSignature(
    formData: Record<string, unknown>,
  ) {
    const isResponsePhase =
      this.hasCapturedValue(formData.requestSignedAtInterHosp) &&
      (this.hasCapturedValue(formData.impresionDiagnosticaInterHosp) ||
        this.hasCapturedValue(formData.sugerenciasTerapeuticasInterHosp) ||
        this.hasCapturedValue(formData.resultadoInterconsultaHosp));

    if (!isResponsePhase) {
      return;
    }

    const missingResponseFields = [
      'fechaRespuestaInterHosp',
      'horaRespuestaInterHosp',
      'medicoInterconsultanteHosp',
      'impresionDiagnosticaInterHosp',
      'resultadoInterconsultaHosp',
    ].filter((fieldKey) => !this.hasCapturedValue(formData[fieldKey]));

    if (missingResponseFields.length > 0) {
      throw new BadRequestException(
        'Completa los campos obligatorios de la respuesta antes de firmarla',
      );
    }
  }

  private assertRecordTabAllowed(encounterType: EncounterType, tabKey: string) {
    const allowedTabs = encounterTabsByType[encounterType] ?? [];
    const normalizedTabKey =
      encounterType === EncounterType.OUTPATIENT &&
      tabKey === legacyConsultationPrescriptionTabKey
        ? consultationPrescriptionTabKey
        : tabKey;

    if (!allowedTabs.includes(normalizedTabKey) || normalizedTabKey === 'Resumen') {
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

  private assertEmergencyDischargeCanBeSigned(
    encounter: TenantEncounterRecord,
    record: {
      id: string;
      formDataJson: Prisma.JsonValue;
    },
  ) {
    const formData = this.normalizeJsonObject(record.formDataJson);
    const hasSignedInitialNote = encounter.sectionRecords.some(
      (sectionRecord) =>
        sectionRecord.tabKey === 'Nota inicial' &&
        sectionRecord.noteType === 'Nota inicial' &&
        sectionRecord.status === EncounterRecordStatus.SIGNED,
    );
    const hasEvolution = encounter.sectionRecords.some(
      (sectionRecord) =>
        sectionRecord.tabKey === 'Evolución' && sectionRecord.id !== record.id,
    );
    const dischargedAt = this.parseOptionalDate(formData.fechaHoraEgresoUrg);
    const dischargeType = this.readStringValue(formData.tipoEgresoUrg);
    const medications = this.readStringValue(formData.medicamentosEgresoUrg);
    const hasPrescriptionOrJustification =
      this.hasCapturedValue(formData.recetaAsociadaEgresoUrg) ||
      this.hasCapturedValue(formData.justificacionSinRecetaEgresoUrg);

    if (!hasSignedInitialNote) {
      throw new BadRequestException(
        'No se puede firmar el egreso: falta una Nota inicial firmada.',
      );
    }

    if (!hasEvolution) {
      throw new BadRequestException(
        'No se puede firmar el egreso: debe existir al menos una Evolución en urgencias.',
      );
    }

    if (!this.hasCapturedValue(formData.diagnosticoEgresoUrg)) {
      throw new BadRequestException(
        'No se puede firmar el egreso: captura el diagnóstico de egreso.',
      );
    }

    if (!dischargedAt || dischargedAt < encounter.openedAt) {
      throw new BadRequestException(
        'No se puede firmar el egreso: la fecha de egreso debe ser igual o posterior al inicio del episodio.',
      );
    }

    if (dischargeType === 'HOSPITALIZACION' && !this.hasCapturedValue(formData.servicioReceptorUrg)) {
      throw new BadRequestException(
        'No se puede firmar el egreso: hospitalización requiere servicio receptor.',
      );
    }

    if (dischargeType === 'REFERENCIA_TRASLADO' && !this.hasCapturedValue(formData.unidadDestinoTrasladoUrg)) {
      throw new BadRequestException(
        'No se puede firmar el egreso: referencia o traslado requiere unidad destino.',
      );
    }

    if (dischargeType === 'ALTA_DOMICILIO') {
      const requiredHomeDischargeFields = [
        'medicamentosEgresoUrg',
        'cuidadosGeneralesEgresoUrg',
        'seguimientoEgresoUrg',
        'signosAlarmaEgresoUrg',
      ];
      const missingHomeField = requiredHomeDischargeFields.some(
        (fieldKey) => !this.hasCapturedValue(formData[fieldKey]),
      );

      if (missingHomeField) {
        throw new BadRequestException(
          'No se puede firmar el egreso: alta a domicilio requiere medicamentos, cuidados, seguimiento y signos de alarma.',
        );
      }
    }

    if (medications && !hasPrescriptionOrJustification) {
      throw new BadRequestException(
        'No se puede firmar el egreso: medicamentos al egreso requieren receta asociada o justificación.',
      );
    }

    if (
      this.readStringValue(formData.incapacidadOtorgadaUrg) === 'SI' &&
      !this.hasCapturedValue(formData.diasIncapacidadUrg)
    ) {
      throw new BadRequestException(
        'No se puede firmar el egreso: captura los días de incapacidad.',
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
