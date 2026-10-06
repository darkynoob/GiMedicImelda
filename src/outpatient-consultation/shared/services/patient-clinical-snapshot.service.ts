import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PATIENT_REPOSITORY } from '../../../shared/persistence/tokens/patient.token';
import type { PatientRepository } from '../../../shared/persistence/repositories/patient.repository';
import { MEDICALRECORD_REPOSITORY } from '../../../shared/persistence/tokens/medicalRecord.token';
import type { MedicalRecordRepository } from '../../../shared/persistence/repositories/medicalRecord.repository';
import { ENCOUNTER_REPOSITORY } from '../../../shared/persistence/tokens/encounter.token';
import type { EncounterRepository } from '../../../shared/persistence/repositories/encounter.repository';
import { FACILITY_REPOSITORY } from '../../../shared/persistence/tokens/facility.token';
import type { FacilityRepository } from '../../../shared/persistence/repositories/facility.repository';
import { USER_REPOSITORY } from '../../../shared/persistence/tokens/user.token';
import type { UserRepository } from '../../../shared/persistence/repositories/user.repository';
import { SPECIALTY_REPOSITORY } from '../../../shared/persistence/tokens/specialty.token';
import type { SpecialtyRepository } from '../../../shared/persistence/repositories/specialty.repository';

export interface ClinicalPatientIdentitySnapshot {
  patientId: string;
  fullName: string;
  birthDate: string | null;
  ageSnapshot: number | null;
  sexAtBirth: string;
  curp: string | null;
}

export interface ClinicalProfessionalSnapshot {
  userId: string;
  fullName: string;
  professionalLicense: string | null;
  specialty: string | null;
}

export interface ClinicalFacilitySnapshot {
  facilityId: string;
  name: string;
  legalName: string | null;
  institutionName: string | null;
}

export interface ClinicalRecordSnapshot {
  patient: ClinicalPatientIdentitySnapshot;
  medicalRecordId: string;
  medicalRecordNumber: string;
  encounterId: string;
  facility: ClinicalFacilitySnapshot;
  professional: ClinicalProfessionalSnapshot;
  /// Fecha/hora clínica capturada por el usuario para el registro (ISO).
  clinicalDateTime: string;
  /// Fecha/hora real del servidor al momento de construir el snapshot (ISO).
  snapshotTakenAt: string;
}

/// Construye el snapshot global de identidad/autoría exigido por la regla 0.3. Debe invocarse
/// una sola vez por versión al Finalizar; el resultado se copia al contenido de la versión y
/// nunca se vuelve a recalcular dinámicamente para una versión ya Finalizada.
@Injectable()
export class PatientClinicalSnapshotService {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(MEDICALRECORD_REPOSITORY)
    private readonly medicalRecordRepository: MedicalRecordRepository,
    @Inject(ENCOUNTER_REPOSITORY)
    private readonly encounterRepository: EncounterRepository,
    @Inject(FACILITY_REPOSITORY)
    private readonly facilityRepository: FacilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(SPECIALTY_REPOSITORY)
    private readonly specialtyRepository: SpecialtyRepository,
  ) {}

  async buildSnapshot(params: {
    encounterId: string;
    professionalUserId: string;
    clinicalDateTime: Date;
  }): Promise<ClinicalRecordSnapshot> {
    const encounter = await this.encounterRepository.findById(
      params.encounterId,
    );
    if (!encounter) {
      throw new NotFoundException('Episodio no encontrado para snapshot clínico.');
    }

    const [patient, medicalRecord, facility, professional] = await Promise.all([
      this.patientRepository.findById(encounter.patientId),
      this.medicalRecordRepository.findById(encounter.medicalRecordId),
      this.facilityRepository.findById(encounter.facilityId),
      this.userRepository.findById(params.professionalUserId),
    ]);

    if (!patient) throw new NotFoundException('Paciente no encontrado para snapshot clínico.');
    if (!medicalRecord) throw new NotFoundException('Expediente no encontrado para snapshot clínico.');
    if (!facility) throw new NotFoundException('Sede no encontrada para snapshot clínico.');
    if (!professional) throw new NotFoundException('Profesional no encontrado para snapshot clínico.');

    const specialty = professional.specialtyId
      ? await this.specialtyRepository.findById(professional.specialtyId)
      : null;

    return {
      patient: {
        patientId: patient.id,
        fullName: patient.fullName,
        birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
        ageSnapshot: patient.ageSnapshot ?? null,
        sexAtBirth: patient.sexAtBirth,
        curp: patient.curp ?? null,
      },
      medicalRecordId: medicalRecord.id,
      medicalRecordNumber: medicalRecord.recordNumber,
      encounterId: encounter.id,
      facility: {
        facilityId: facility.id,
        name: facility.name,
        legalName: facility.legalName ?? null,
        institutionName: facility.institutionName ?? null,
      },
      professional: {
        userId: professional.id,
        fullName: professional.fullName,
        professionalLicense: professional.professionalLicense ?? null,
        specialty: specialty?.name ?? null,
      },
      clinicalDateTime: params.clinicalDateTime.toISOString(),
      snapshotTakenAt: new Date().toISOString(),
    };
  }
}
