import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus, type Prisma } from '@prisma/client';
import { USER_REPOSITORY } from '../../../shared/persistence/tokens/user.token';
import type { UserRepository } from '../../../shared/persistence/repositories/user.repository';
import { LoginDto } from '../dto/login.dto';
import type {
  AuthLoginResponse,
  CurrentUserResponse,
} from '../dto/auth-user.response';
import { PasswordService } from './password.service';
import type { AuthJwtPayload } from '../../domain/auth-jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

type AuthUserRecord = Prisma.UserGetPayload<{
  include: {
    tenant: true;
    facility: true;
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(input: LoginDto): Promise<AuthLoginResponse> {
    const user = await this.findAccessUserByEmail(input.email);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await this.passwordService.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const permissionCodes = [
      ...new Set(
        user.roles.flatMap((assignment) =>
          assignment.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    const payload: AuthJwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      fullName: user.fullName,
      roleCodes: user.roles.map((assignment) => assignment.role.code),
      permissions: permissionCodes,
    };

    return this.buildAuthResponse(payload, user);
  }

  async refresh(refreshToken: string): Promise<AuthLoginResponse> {
    let payload: AuthJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthJwtPayload>(
        refreshToken,
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ??
            'gimedic-dev-refresh-secret',
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.findAccessUserById(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Usuario no disponible para refrescar sesión',
      );
    }

    const permissionCodes = [
      ...new Set(
        user.roles.flatMap((assignment) =>
          assignment.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    const nextPayload: AuthJwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      fullName: user.fullName,
      roleCodes: user.roles.map((assignment) => assignment.role.code),
      permissions: permissionCodes,
    };

    return this.buildAuthResponse(nextPayload, user);
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResponse> {
    const user = await this.findAccessUserById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toCurrentUserResponse(user);
  }

  private async findAccessUserByEmail(
    email: string,
  ): Promise<AuthUserRecord | null> {
    const users = (await this.userRepository.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      include: {
        tenant: true,
        facility: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 1,
    } satisfies Prisma.UserFindManyArgs)) as AuthUserRecord[];

    return users[0] ?? null;
  }

  private async findAccessUserById(id: string): Promise<AuthUserRecord | null> {
    const users = (await this.userRepository.findMany({
      where: { id },
      include: {
        tenant: true,
        facility: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 1,
    } satisfies Prisma.UserFindManyArgs)) as AuthUserRecord[];

    return users[0] ?? null;
  }

  private toCurrentUserResponse(user: AuthUserRecord): CurrentUserResponse {
    const permissions = new Set<string>();

    for (const assignment of user.roles) {
      for (const rolePermission of assignment.role.permissions) {
        permissions.add(rolePermission.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      professionalLicense: user.professionalLicense,
      tenant: {
        id: user.tenant.id,
        code: user.tenant.code,
        name: user.tenant.name,
      },
      facility: user.facility
        ? {
            id: user.facility.id,
            code: user.facility.code,
            name: user.facility.name,
          }
        : null,
      roles: user.roles.map((assignment) => ({
        code: assignment.role.code,
        name: assignment.role.name,
      })),
      permissions: [...permissions].sort(),
    };
  }

  private async buildAuthResponse(
    payload: AuthJwtPayload,
    user: AuthUserRecord,
  ): Promise<AuthLoginResponse> {
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          'gimedic-dev-access-secret',
        expiresIn: accessExpiresIn as never,
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'gimedic-dev-refresh-secret',
        expiresIn: refreshExpiresIn as never,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      user: this.toCurrentUserResponse(user),
    };
  }
}
