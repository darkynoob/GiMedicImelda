import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  const buildUserRecord = () => ({
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
  });

  const passwordService = {
    compare: jest.fn(),
  } as unknown as PasswordService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const userRepository = {
    findMany: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_EXPIRES_IN') {
        return '15m';
      }

      if (key === 'JWT_REFRESH_EXPIRES_IN') {
        return '7d';
      }

      if (key === 'JWT_ACCESS_SECRET') {
        return 'test-access-secret';
      }

      if (key === 'JWT_REFRESH_SECRET') {
        return 'test-refresh-secret';
      }

      return undefined;
    }),
  } as unknown as ConfigService;

  const service = new AuthService(
    userRepository as never,
    passwordService,
    jwtService,
    configService,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a token and normalized user context for valid credentials', async () => {
    userRepository.findMany = jest.fn().mockResolvedValue([buildUserRecord()]);

    (passwordService.compare as jest.Mock).mockResolvedValue(true);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      email: 'valeria.ruiz@nova.mx',
      password: 'Admin123*',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.fullName).toBe('Valeria Ruiz Santos');
    expect(result.user.permissions).toEqual(['patients.read']);
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('refreshes the session for a valid refresh token', async () => {
    userRepository.findMany = jest.fn().mockResolvedValue([buildUserRecord()]);
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      email: 'valeria.ruiz@nova.mx',
      tenantId: 'tenant-1',
      fullName: 'Valeria Ruiz Santos',
      roleCodes: ['TENANT_ADMIN'],
    });
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('next-access-token')
      .mockResolvedValueOnce('next-refresh-token');

    const result = await service.refresh('valid-refresh-token');

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
      secret: 'test-refresh-secret',
    });
    expect(result.accessToken).toBe('next-access-token');
    expect(result.refreshToken).toBe('next-refresh-token');
    expect(result.user.email).toBe('valeria.ruiz@nova.mx');
  });
});
