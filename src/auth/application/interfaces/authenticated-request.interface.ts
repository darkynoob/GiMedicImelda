import type { Request } from 'express';
import type { AuthJwtPayload } from '../../domain/auth-jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: AuthJwtPayload;
}
