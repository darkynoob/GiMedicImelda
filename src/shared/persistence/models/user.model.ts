import type { Prisma } from '@prisma/client';

export type UserModel = Prisma.UserGetPayload<Record<string, never>>;
