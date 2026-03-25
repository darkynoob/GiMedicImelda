import { apiRequest } from '../../../shared/http/api-client';
import type {
  AuthLoginResponse,
  CurrentUserResponse,
} from '../../../shared/types/contracts';

interface LoginPayload {
  email: string;
  password: string;
}

export function loginRequest(payload: LoginPayload) {
  return apiRequest<AuthLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token: string) {
  return apiRequest<CurrentUserResponse>('/auth/me', {
    token,
  });
}
