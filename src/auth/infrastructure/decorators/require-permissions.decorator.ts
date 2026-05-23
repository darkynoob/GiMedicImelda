import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Declara los códigos de permiso que el endpoint requiere.
 * El usuario debe tener AL MENOS uno de los permisos listados.
 * Debe usarse junto con PermissionsGuard.
 *
 * @example @RequirePermissions('patients.read')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
