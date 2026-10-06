import { Module } from '@nestjs/common';
import { ClinicalAuditService } from './shared/services/clinical-audit.service';
import { ClinicalDocumentVersioningService } from './shared/services/clinical-document-versioning.service';
import { PatientClinicalSnapshotService } from './shared/services/patient-clinical-snapshot.service';
import {
  CLINICAL_SIGNATURE_ADAPTER,
  NullClinicalSignatureAdapter,
} from './shared/services/clinical-signature.adapter';

/// Módulo dedicado a la documentación clínica de episodios OUTPATIENT (Historia clínica,
/// Consulta actual, Evolución, Receta e indicaciones, Documentos, Resumen). No modifica el
/// lifecycle genérico del episodio ni el código de Emergencias/Hospitalización/Cirugía, que
/// permanecen en `EncountersModule`. Fase 0: solo expone los servicios compartidos; los
/// controllers/servicios por tab se agregan en las fases 1 a 6 del plan.
@Module({
  providers: [
    ClinicalAuditService,
    ClinicalDocumentVersioningService,
    PatientClinicalSnapshotService,
    {
      provide: CLINICAL_SIGNATURE_ADAPTER,
      useClass: NullClinicalSignatureAdapter,
    },
  ],
  exports: [
    ClinicalAuditService,
    ClinicalDocumentVersioningService,
    PatientClinicalSnapshotService,
    CLINICAL_SIGNATURE_ADAPTER,
  ],
})
export class OutpatientConsultationModule {}
