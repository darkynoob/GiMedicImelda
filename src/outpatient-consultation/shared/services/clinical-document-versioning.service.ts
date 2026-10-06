import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';

export type VersionedClinicalRecordStatus = 'DRAFT' | 'FINALIZED';

/// Forma mínima que debe cumplir cualquier entidad versionada del flujo Episodio/Consulta
/// (Historia clínica, Consulta actual, Evolución, Receta...) para reutilizar este servicio.
export interface VersionedClinicalRecord {
  id: string;
  status: VersionedClinicalRecordStatus;
  versionNumber: number;
  previousVersionId: string | null;
}

/// Puerto que cada módulo concreto implementa contra su propio modelo Prisma. Mantiene el
/// servicio de versionado agnóstico de la persistencia (regla 0.7: lógica compartida, sin
/// reimplementar el estado Borrador/Finalizado distinto en cada tab).
export interface ClinicalVersionPort<
  TDocument extends VersionedClinicalRecord,
  TDraftInput,
> {
  findCurrentDraft(parentId: string): Promise<TDocument | null>;
  findLatestFinalized(parentId: string): Promise<TDocument | null>;
  createInitialDraft(parentId: string, input: TDraftInput): Promise<TDocument>;
  updateDraft(document: TDocument, input: TDraftInput): Promise<TDocument>;
  finalize(document: TDocument): Promise<TDocument>;
  createVersionFromFinalized(
    previous: TDocument,
    input: TDraftInput,
  ): Promise<TDocument>;
}

/// Máquina de estados genérica Borrador/Finalizado (reglas 0.1, 0.2, 0.4). Un mismo parentId
/// (historia clínica, nota, receta, documento) solo puede tener una versión editable a la vez;
/// una nueva versión solo puede originarse desde la última versión Finalizada; una versión
/// Finalizada queda inmutable para siempre en el backend (no solo en UI).
@Injectable()
export class ClinicalDocumentVersioningService {
  async saveDraft<TDocument extends VersionedClinicalRecord, TDraftInput>(
    port: ClinicalVersionPort<TDocument, TDraftInput>,
    parentId: string,
    input: TDraftInput,
  ): Promise<TDocument> {
    const currentDraft = await port.findCurrentDraft(parentId);

    if (currentDraft) {
      this.assertEditable(currentDraft);
      return port.updateDraft(currentDraft, input);
    }

    return port.createInitialDraft(parentId, input);
  }

  async finalize<TDocument extends VersionedClinicalRecord, TDraftInput>(
    port: ClinicalVersionPort<TDocument, TDraftInput>,
    parentId: string,
    validate?: (document: TDocument) => void,
  ): Promise<TDocument> {
    const currentDraft = await port.findCurrentDraft(parentId);

    if (!currentDraft) {
      throw new BadRequestException(
        'No existe una versión en Borrador para finalizar.',
      );
    }

    this.assertEditable(currentDraft);
    validate?.(currentDraft);

    return port.finalize(currentDraft);
  }

  async createNewVersion<TDocument extends VersionedClinicalRecord, TDraftInput>(
    port: ClinicalVersionPort<TDocument, TDraftInput>,
    parentId: string,
    input: TDraftInput,
  ): Promise<TDocument> {
    const currentDraft = await port.findCurrentDraft(parentId);
    if (currentDraft) {
      throw new ConflictException(
        'Ya existe una versión en Borrador; debe finalizarse antes de crear una nueva versión.',
      );
    }

    const latestFinalized = await port.findLatestFinalized(parentId);
    if (!latestFinalized) {
      throw new BadRequestException(
        'No existe una versión Finalizada previa desde la cual crear una nueva versión.',
      );
    }

    return port.createVersionFromFinalized(latestFinalized, input);
  }

  /// Rechaza cualquier intento de UPDATE/DELETE sobre contenido Finalizado (regla 0.2).
  /// Los llamadores deben capturar esta excepción y registrar MODIFY_FINALIZED_DENIED en auditoría.
  assertEditable(document: VersionedClinicalRecord): void {
    if (document.status === 'FINALIZED') {
      throw new ForbiddenException(
        'La versión está Finalizada y es inmutable; no se puede editar ni eliminar.',
      );
    }
  }
}
