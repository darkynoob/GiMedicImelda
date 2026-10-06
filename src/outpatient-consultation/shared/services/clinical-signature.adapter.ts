import { Injectable } from '@nestjs/common';

export type ClinicalSignatureVerificationStatus =
  | 'NOT_IMPLEMENTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED';

export interface ClinicalSignatureResult {
  signatureId: string | null;
  hash: string | null;
  signerUserId: string | null;
  signedAt: Date | null;
  provider: string | null;
  verificationStatus: ClinicalSignatureVerificationStatus;
}

export interface ClinicalSignatureRequest {
  documentId: string;
  contentHash: string;
  userId: string;
}

/// Puerto para la futura integración de FEA (regla 0.10). No implementar certificados,
/// tokens ni hashes presentados como firma mientras no exista un motor real.
export interface ClinicalSignatureAdapter {
  sign(request: ClinicalSignatureRequest): Promise<ClinicalSignatureResult>;
}

export const CLINICAL_SIGNATURE_ADAPTER = Symbol('ClinicalSignatureAdapter');

/// Implementación no-op: deja todos los campos de firma en null/NOT_IMPLEMENTED.
/// Finalizar un documento NUNCA debe depender de este adapter para marcarse como Finalizado.
@Injectable()
export class NullClinicalSignatureAdapter implements ClinicalSignatureAdapter {
  async sign(): Promise<ClinicalSignatureResult> {
    return {
      signatureId: null,
      hash: null,
      signerUserId: null,
      signedAt: null,
      provider: null,
      verificationStatus: 'NOT_IMPLEMENTED',
    };
  }
}
