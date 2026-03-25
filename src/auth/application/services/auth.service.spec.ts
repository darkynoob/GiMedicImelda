import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  const passwordService = {
    compare: jest.fn(),
  } as unknown as PasswordService;

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
  } as unknown as JwtService;

  const userRepository = {
    findMany: jest.fn(),
  };

  const service = new AuthService(
    userRepository as never,
    passwordService,
    jwtService,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a token and normalized user context for valid credentials', async () => {
    userRepository.findMany = jest.fn().mockResolvedValue([
      {
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'valeria.ruiz@nova.mx',
        passwordHash: 'hashed-value',
        fullName: 'Valeria Ruiz Santos',
        professionalLicense: 'CED-ONCO-1001',
        status: UserStatus.ACTIVE,
        tenant: { id: 'tenant-1', code: 'NOVA', name: 'Nova' },
        facility: { id: 'facility-1', code: 'HOSP', name: 'Hospital Nova' },
        roles: [
          {
            role: {
              code: 'TENANT_ADMIN',
              name: 'Administrador',
              permissions: [
                {
                  permission: {
                    code: 'patients.read',
                  },
                },
              ],
            },
          },
        ],
      },
    ]);

    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'valeria.ruiz@nova.mx',
      password: 'Admin123*',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.fullName).toBe('Valeria Ruiz Santos');
    expect(result.user.permissions).toEqual(['patients.read']);
    expect(jwtService.signAsync).toHaveBeenCalled();
  });
});
