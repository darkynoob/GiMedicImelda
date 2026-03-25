import { Inject, Injectable } from '@nestjs/common';
import type {
  Encounter,
  Facility,
  Patient,
  Prisma,
} from '@prisma/client';
import { ENCOUNTER_REPOSITORY } from '../../../shared/persistence/tokens/encounter.token';
import { FACILITY_REPOSITORY } from '../../../shared/persistence/tokens/facility.token';
import { MEDICALRECORD_REPOSITORY } from '../../../shared/persistence/tokens/medicalRecord.token';
import { PATIENT_REPOSITORY } from '../../../shared/persistence/tokens/patient.token';
import { TENANT_REPOSITORY } from '../../../shared/persistence/tokens/tenant.token';
import type { EncounterRepository } from '../../../shared/persistence/repositories/encounter.repository';
import type { FacilityRepository } from '../../../shared/persistence/repositories/facility.repository';
import type { MedicalRecordRepository } from '../../../shared/persistence/repositories/medicalRecord.repository';
import type { PatientRepository } from '../../../shared/persistence/repositories/patient.repository';
import type { TenantRepository } from '../../../shared/persistence/repositories/tenant.repository';
import type { DashboardSummaryResponse } from '../dto/dashboard-summary.response';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(MEDICALRECORD_REPOSITORY)
    private readonly medicalRecordRepository: MedicalRecordRepository,
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(FACILITY_REPOSITORY)
    private readonly facilityRepository: FacilityRepository,
  ) {}

  async getSummary(tenantId: string): Promise<DashboardSummaryResponse> {
    const [tenant, patientsCount, medicalRecordsCount, openEncountersCount, recentEncounters] =
      await Promise.all([
        this.tenantRepository.findById(tenantId),
        this.patientRepository.count({
          where: { tenantId },
        } satisfies Prisma.PatientCountArgs),
        this.medicalRecordRepository.count({
          where: {
            tenantId,
            status: 'ACTIVE',
          },
        } as Prisma.MedicalRecordCountArgs),
        this.encounterRepository.count({
          where: {
            tenantId,
            status: 'OPEN',
          },
        } as Prisma.EncounterCountArgs),
        this.encounterRepository.findMany({
          where: { tenantId },
          orderBy: { openedAt: 'desc' },
          take: 5,
        } satisfies Prisma.EncounterFindManyArgs),
      ]);

    const patientIds = [
      ...new Set(recentEncounters.map((encounter) => encounter.patientId)),
    ];
    const facilityIds = [
      ...new Set(recentEncounters.map((encounter) => encounter.facilityId)),
    ];

    const [patients, facilities] = await Promise.all([
      patientIds.length > 0
        ? this.patientRepository.findMany({
            where: { id: { in: patientIds } },
          } satisfies Prisma.PatientFindManyArgs)
        : Promise.resolve([]),
      facilityIds.length > 0
        ? this.facilityRepository.findMany({
            where: { id: { in: facilityIds } },
          } satisfies Prisma.FacilityFindManyArgs)
        : Promise.resolve([]),
    ]);

    const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
    const facilitiesById = new Map(
      facilities.map((facility) => [facility.id, facility]),
    );

    return {
      tenant: {
        id: tenantId,
        name: tenant?.name ?? 'Tenant desconocido',
      },
      metrics: [
        {
          label: 'Pacientes activos',
          value: patientsCount,
          accent: 'var(--accent-sky)',
        },
        {
          label: 'Expedientes activos',
          value: medicalRecordsCount,
          accent: 'var(--accent-mint)',
        },
        {
          label: 'Episodios abiertos',
          value: openEncountersCount,
          accent: 'var(--accent-gold)',
        },
      ],
      recentEncounters: recentEncounters.map((encounter) => ({
        id: encounter.id,
        encounterNumber: encounter.encounterNumber,
        encounterType: encounter.encounterType,
        status: encounter.status,
        patientName:
          patientsById.get(encounter.patientId)?.fullName ?? 'Paciente sin nombre',
        facilityName: facilitiesById.get(encounter.facilityId)?.name ?? null,
        openedAt: encounter.openedAt.toISOString(),
      })),
    };
  }
}
