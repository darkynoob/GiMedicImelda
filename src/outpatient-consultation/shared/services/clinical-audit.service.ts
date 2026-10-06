import { Inject, Injectable } from '@nestjs/common';
import type { AuditAction } from '@prisma/client';
import { AUDITLOG_REPOSITORY } from '../../../shared/persistence/tokens/auditLog.token';
import type { AuditLogRepository } from '../../../shared/persistence/repositories/auditLog.repository';

export interface ClinicalAuditEventInput {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  /// Tipo de entidad auditada, ej. "ClinicalHistoryVersion", "PrescriptionVersion".
  entityType: string;
  entityId?: string | null;
  facilityId?: string | null;
  patientId?: string | null;
  encounterId?: string | null;
  metadata?: Record<string, unknown>;
}

/// Servicio único de auditoría append-only para los documentos clínicos en alcance (regla 0.5).
/// No implementa UPDATE/DELETE: cada llamada agrega un nuevo evento inmutable.
@Injectable()
export class ClinicalAuditService {
  constructor(
    @Inject(AUDITLOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async record(event: ClinicalAuditEventInput): Promise<void> {
    await this.auditLogRepository.create({
      tenant: { connect: { id: event.tenantId } },
      ...(event.userId ? { user: { connect: { id: event.userId } } } : {}),
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      ...(event.facilityId
        ? { facility: { connect: { id: event.facilityId } } }
        : {}),
      ...(event.patientId
        ? { patient: { connect: { id: event.patientId } } }
        : {}),
      ...(event.encounterId
        ? { encounter: { connect: { id: event.encounterId } } }
        : {}),
      metadataJson: event.metadata
        ? (event.metadata as object)
        : undefined,
    });
  }
}
