export interface AuthenticatedRoleResponse {
  code: string;
  name: string;
}

export interface AuthenticatedTenantResponse {
  id: string;
  code: string;
  name: string;
}

export interface AuthenticatedFacilityResponse {
  id: string;
  code: string;
  name: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName: string;
  professionalLicense: string | null;
  tenant: AuthenticatedTenantResponse;
  facility: AuthenticatedFacilityResponse | null;
  roles: AuthenticatedRoleResponse[];
  permissions: string[];
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: CurrentUserResponse;
}
