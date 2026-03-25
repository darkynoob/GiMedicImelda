import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const tenantRepository = {
    findById: jest.fn(),
  };

  const patientRepository = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const medicalRecordRepository = {
    count: jest.fn(),
  };

  const encounterRepository = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const facilityRepository = {
    findMany: jest.fn(),
  };

  const service = new DashboardService(
    tenantRepository as never,
    patientRepository as never,
    medicalRecordRepository as never,
    encounterRepository as never,
    facilityRepository as never,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds summary metrics and recent encounter snapshots', async () => {
    tenantRepository.findById.mockResolvedValue({
      id: 'tenant-1',
      name: 'Hospital Nova',
    });
    patientRepository.count.mockResolvedValue(18);
    medicalRecordRepository.count.mockResolvedValue(12);
    encounterRepository.count.mockResolvedValue(3);
    encounterRepository.findMany.mockResolvedValue([
      {
        id: 'enc-1',
        patientId: 'patient-1',
        facilityId: 'facility-1',
        encounterNumber: 'ENC-NOVA-0001',
        encounterType: 'OUTPATIENT',
        status: 'OPEN',
        openedAt: new Date('2026-03-01T08:00:00.000Z'),
      },
    ]);
    patientRepository.findMany.mockResolvedValue([
      {
        id: 'patient-1',
        fullName: 'Ana López Hernández',
      },
    ]);
    facilityRepository.findMany.mockResolvedValue([
      {
        id: 'facility-1',
        name: 'Hospital Nova',
      },
    ]);

    const result = await service.getSummary('tenant-1');

    expect(result.metrics).toHaveLength(3);
    expect(result.recentEncounters[0]?.patientName).toBe('Ana López Hernández');
  });
});
