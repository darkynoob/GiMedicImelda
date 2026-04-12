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
    findById: jest.fn(),
  };

  const userRepository = {
    findById: jest.fn(),
  };

  const prisma = {
    $transaction: jest.fn(),
    encounter: {
      groupBy: jest.fn(),
    },
    allergy: {
      findMany: jest.fn(),
    },
  };

  const service = new PatientsService(
    patientRepository as never,
    patientIdentifierRepository as never,
    medicalRecordRepository as never,
    encounterRepository as never,
    facilityRepository as never,
    userRepository as never,
    prisma as never,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated patients shaped for the UI list', async () => {
    patientRepository.findMany.mockResolvedValue([
      {
        id: 'patient-1',
        fullName: 'Ana Lopez Hernandez',
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
    prisma.encounter.groupBy.mockResolvedValue([
      {
        patientId: 'patient-1',
        _count: {
          patientId: 3,
        },
      },
    ]);
    prisma.allergy.findMany.mockResolvedValue([
      {
        patientId: 'patient-1',
        substance: 'Penicilina',
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
    expect(result.items[0]?.encounterCount).toBe(3);
    expect(result.items[0]?.allergiesSummary).toEqual(['Penicilina']);
  });

  it('throws when the patient does not belong to the tenant', async () => {
    patientRepository.findById.mockResolvedValue(null);

    await expect(
      service.getDetailByTenant('tenant-1', 'patient-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a patient, primary identifier and medical record', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      facilityId: 'facility-1',
    });
    facilityRepository.findById.mockResolvedValue({
      id: 'facility-1',
      tenantId: 'tenant-1',
      code: 'NOVA',
      isActive: true,
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        patient: {
          create: jest.fn().mockResolvedValue({
            id: 'patient-2',
          }),
        },
        patientIdentifier: {
          create: jest.fn().mockResolvedValue({
            id: 'identifier-1',
          }),
        },
        medicalRecord: {
          create: jest.fn().mockResolvedValue({
            id: 'record-1',
          }),
        },
      }),
    );

    const detailSpy = jest
      .spyOn(service, 'getDetailByTenant')
      .mockResolvedValue({
        id: 'patient-2',
        tenantId: 'tenant-1',
        externalCode: null,
        fullName: 'Patricia Ramirez Nava',
        firstName: 'Patricia',
        lastName: 'Ramirez',
        middleName: 'Nava',
        curp: null,
        rfc: null,
        birthDate: null,
        ageSnapshot: null,
        sexAtBirth: 'FEMALE',
        maritalStatus: null,
        bloodType: null,
        email: null,
        phone: null,
        alternatePhone: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        postalCode: null,
        country: 'MX',
        municipality: null,
        neighborhood: null,
        street: null,
        exteriorNumber: null,
        interiorNumber: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        patientStatus: 'Activo',
        patientType: 'Ambulatorio',
        medicalUnit: 'Hospital Nova',
        hasKnownAllergies: false,
        allergiesNotes: null,
        occupation: null,
        educationLevel: null,
        religion: null,
        primaryLanguage: null,
        requiresTranslator: false,
        registrationSource: null,
        administrativeNotes: null,
        updatedAt: '2026-04-11T12:00:00.000Z',
        responsibleContact: null,
        coverages: [],
        documents: [],
        attachments: [],
        allergies: [],
        problems: [],
        clinicalProfile: null,
        demographicProfile: null,
        billingProfile: null,
        identifiers: [],
        medicalRecords: [],
        recentEncounters: [],
      });

    const result = await service.createForTenant('tenant-1', 'user-1', {
      firstName: 'Patricia',
      lastName: 'Ramirez',
      middleName: 'Nava',
      sexAtBirth: 'FEMALE' as never,
      birthDate: '1990-07-09',
      phone: '5512345678',
      city: 'Ciudad de Mexico',
      state: 'CDMX',
      patientStatus: 'Activo',
      patientType: 'Ambulatorio',
      medicalUnit: 'Hospital Nova',
      hasKnownAllergies: false,
      identifierType: 'NSS',
      identifierValue: 'NSS-1234',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(detailSpy).toHaveBeenCalledWith('tenant-1', 'patient-2');
    expect(result.id).toBe('patient-2');
  });

  it('updates the patient profile and rewrites the primary identifier', async () => {
    patientRepository.findById.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        patient: {
          update: jest.fn().mockResolvedValue({
            id: 'patient-1',
          }),
        },
        patientIdentifier: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'identifier-1',
              isPrimary: true,
            },
          ]),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          update: jest.fn().mockResolvedValue({
            id: 'identifier-1',
          }),
          delete: jest.fn(),
          create: jest.fn(),
        },
        patientResponsibleContact: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
        patientCoverage: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
        patientDocument: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
        allergy: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
        problem: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
        patientClinicalProfile: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
        patientDemographicProfile: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
        patientBillingProfile: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
      }),
    );

    const detailSpy = jest
      .spyOn(service, 'getDetailByTenant')
      .mockResolvedValue({
        id: 'patient-1',
        tenantId: 'tenant-1',
        externalCode: 'LEG-100',
        fullName: 'Ana Lopez Hernandez',
        firstName: 'Ana',
        lastName: 'Lopez',
        middleName: 'Hernandez',
        curp: 'LOHA890312MDFPRN05',
        rfc: 'LOHA890312AB1',
        birthDate: '1989-03-12T00:00:00.000Z',
        ageSnapshot: 37,
        sexAtBirth: 'FEMALE',
        maritalStatus: 'CASADA',
        bloodType: 'O+',
        email: 'ana@example.com',
        phone: '5511111111',
        alternatePhone: null,
        addressLine1: 'Calle Magnolia 22',
        addressLine2: 'Col. Del Valle',
        city: 'Ciudad de Mexico',
        state: 'CDMX',
        postalCode: '03100',
        country: 'MX',
        municipality: 'Benito Juarez',
        neighborhood: 'Del Valle',
        street: 'Calle Magnolia',
        exteriorNumber: '22',
        interiorNumber: null,
        emergencyContactName: 'Luis Lopez',
        emergencyContactPhone: '5522222222',
        emergencyContactRelation: 'Esposo',
        patientStatus: 'Activo',
        patientType: 'Ambulatorio',
        medicalUnit: 'Hospital Nova',
        hasKnownAllergies: true,
        allergiesNotes: 'Penicilina',
        occupation: 'Contadora',
        educationLevel: 'Licenciatura',
        religion: 'Catolica',
        primaryLanguage: 'Español',
        requiresTranslator: false,
        registrationSource: 'Presencial',
        administrativeNotes: 'Nota actualizada',
        updatedAt: '2026-04-11T12:00:00.000Z',
        responsibleContact: {
          id: 'responsible-1',
          fullName: 'Luis Lopez',
          relationship: 'Esposo',
          phone: '5522222222',
          alternatePhone: null,
          email: null,
          legalRepresentationType: 'Familiar responsable',
          addressLine1: 'Calle Magnolia 22',
          addressLine2: null,
          city: 'Ciudad de Mexico',
          state: 'CDMX',
          postalCode: '03100',
          country: 'MX',
          notes: 'Contacto principal',
        },
        coverages: [
          {
            id: 'coverage-1',
            coverageType: 'SEGURO_PRIVADO',
            providerName: 'Seguros Nova',
            planName: 'Integral',
            policyNumber: 'POL-123',
            membershipNumber: 'AFI-222',
            insuredPersonName: 'Ana Lopez Hernandez',
            relationshipToInsured: 'Titular',
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T00:00:00.000Z',
            authorizationNotes: null,
            isPrimary: true,
          },
        ],
        documents: [
          {
            id: 'document-1',
            documentType: 'INE',
            documentNumber: 'INE-ANA-3344',
            issuedBy: 'INE',
            issuedAt: '2021-05-20T00:00:00.000Z',
            expiresAt: '2031-05-20T00:00:00.000Z',
            notes: null,
            isPrimary: true,
          },
        ],
        attachments: [
          {
            id: 'attachment-1',
            fileName: 'ana-identificacion.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: '245760',
            uploadedAt: '2026-04-11T12:00:00.000Z',
          },
        ],
        allergies: [
          {
            id: 'allergy-1',
            substance: 'Penicilina',
            reaction: 'Rash',
            severity: 'SEVERA',
            status: 'ACTIVA',
          },
        ],
        problems: [
          {
            id: 'problem-1',
            description: 'ERGE',
            status: 'ACTIVO',
          },
        ],
        clinicalProfile: {
          id: 'clinical-1',
          organDonorStatus: 'SI',
          rhFactor: 'POSITIVO',
          pregnancyStatus: 'NO',
          disabilityNotes: null,
          clinicalAlerts: 'Alergia a penicilina',
          clinicalObservations: 'Observacion clinica de seguimiento',
          chronicConditionsNotes: 'Seguimiento oncológico',
          currentMedicationsNotes: 'Omeprazol',
        },
        demographicProfile: {
          id: 'demographic-1',
          preferredName: 'Ana Lopez',
          genderIdentity: 'Mujer',
          preferredPronouns: 'Ella',
          nationality: 'Mexicana',
          countryOfBirth: 'México',
          stateOfBirth: 'Ciudad de México',
          ethnicGroup: 'Mestiza',
        },
        billingProfile: {
          id: 'billing-1',
          requiresInvoice: true,
          businessName: 'Ana Lopez Hernandez',
          taxRfc: 'LOHA890312AB1',
          taxRegime: '612',
          taxPostalCode: '03100',
          billingEmail: 'facturacion@ana.com',
          cfdiUse: 'G03',
        },
        identifiers: [
          {
            id: 'identifier-1',
            identifierType: 'NSS',
            identifierValue: 'NSS-UPDATED',
            isPrimary: true,
          },
        ],
        medicalRecords: [],
        recentEncounters: [],
      });

    const result = await service.updateForTenant('tenant-1', 'patient-1', {
      firstName: 'Ana',
      lastName: 'Lopez',
      middleName: 'Hernandez',
      sexAtBirth: 'FEMALE' as never,
      birthDate: '1989-03-12',
      ageSnapshot: 37,
      curp: 'LOHA890312MDFPRN05',
      patientStatus: 'Activo',
      patientType: 'Ambulatorio',
      medicalUnit: 'Hospital Nova',
      phone: '5511111111',
      city: 'Ciudad de Mexico',
      state: 'CDMX',
      hasKnownAllergies: true,
      allergiesNotes: 'Penicilina',
      identifierType: 'NSS',
      identifierValue: 'NSS-UPDATED',
      externalCode: 'LEG-100',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(detailSpy).toHaveBeenCalledWith('tenant-1', 'patient-1');
    expect(result.identifiers[0]?.identifierValue).toBe('NSS-UPDATED');
  });

  it('rejects creation when neither birth date nor age are present', async () => {
    await expect(
      service.createForTenant('tenant-1', 'user-1', {
        firstName: 'Patricia',
        lastName: 'Ramirez',
        sexAtBirth: 'FEMALE' as never,
        phone: '5512345678',
        city: 'Ciudad de Mexico',
        state: 'CDMX',
        patientStatus: 'Activo',
        patientType: 'Ambulatorio',
        medicalUnit: 'Hospital Nova',
        hasKnownAllergies: false,
      }),
    ).rejects.toThrow(
      'La fecha de nacimiento o la edad referida son obligatorias',
    );
  });

  it('rejects creation when allergies were flagged without detail', async () => {
    await expect(
      service.createForTenant('tenant-1', 'user-1', {
        firstName: 'Patricia',
        lastName: 'Ramirez',
        sexAtBirth: 'FEMALE' as never,
        birthDate: '1990-07-09',
        phone: '5512345678',
        city: 'Ciudad de Mexico',
        state: 'CDMX',
        patientStatus: 'Activo',
        patientType: 'Ambulatorio',
        medicalUnit: 'Hospital Nova',
        hasKnownAllergies: true,
      }),
    ).rejects.toThrow('Debes detallar las alergias conocidas del paciente');
  });
});
