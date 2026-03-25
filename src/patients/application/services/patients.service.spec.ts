import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  const patientRepository = {
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
  };

  const patientIdentifierRepository = {
    findMany: jest.fn(),
  };

  const medicalRecordRepository = {
    findMany: jest.fn(),
  };

  const encounterRepository = {
    findMany: jest.fn(),
  };

  const facilityRepository = {
    findMany: jest.fn(),
  };

  const service = new PatientsService(
    patientRepository as never,
    patientIdentifierRepository as never,
    medicalRecordRepository as never,
    encounterRepository as never,
    facilityRepository as never,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated patients shaped for the UI list', async () => {
    patientRepository.findMany.mockResolvedValue([
      {
        id: 'patient-1',
        fullName: 'Ana López Hernández',
        curp: 'CURP123',
        email: 'ana@example.com',
        phone: '5551112222',
        sexAtBirth: 'FEMALE',
        birthDate: new Date('1989-03-12'),
      },
    ]);
    patientRepository.count.mockResolvedValue(1);
    patientIdentifierRepository.findMany.mockResolvedValue([
      {
        patientId: 'patient-1',
        identifierValue: 'NSS-ANA-0001',
        isPrimary: true,
      },
    ]);
    medicalRecordRepository.findMany.mockResolvedValue([
      {
        patientId: 'patient-1',
        recordNumber: 'EXP-NOVA-0001',
        lastEncounterAt: new Date('2026-03-01T10:00:00.000Z'),
      },
    ]);

    const result = await service.listByTenant('tenant-1', {
      page: 1,
      pageSize: 10,
      search: undefined,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.medicalRecordNumber).toBe('EXP-NOVA-0001');
    expect(result.items[0]?.primaryIdentifier).toBe('NSS-ANA-0001');
  });

  it('throws when the patient does not belong to the tenant', async () => {
    patientRepository.findById.mockResolvedValue(null);

    await expect(
      service.getDetailByTenant('tenant-1', 'patient-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
