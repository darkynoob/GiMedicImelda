export interface AuthJwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  fullName: string;
  roleCodes: string[];
  permissions: string[];
}
