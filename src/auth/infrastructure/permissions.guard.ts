import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthJwtPayload } from '../domain/auth-jwt-payload.interface';
import { PERMISSIONS_KEY } from './decorators/require-permissions.decorator';

/**
 * Guard de permisos basado en RBAC.
 * Lee los permisos requeridos del metadato del endpoint (@RequirePermissions)
 * y los compara con los permisos del usuario autenticado incluidos en el JWT.
 *
 * Debe aplicarse DESPUÉS de JwtAuthGuard (request.user ya debe estar poblado).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si el endpoint no declara permisos, se permite el acceso (JwtAuthGuard ya validó el token).
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as AuthJwtPayload | undefined;

    if (!user?.permissions) {
      throw new ForbiddenException('Sin permisos suficientes');
    }

    const userPermissions = new Set(user.permissions);
    const hasPermission = required.some((code) => userPermissions.has(code));

    if (!hasPermission) {
      throw new ForbiddenException('Sin permisos suficientes');
    }

    return true;
  }
}
