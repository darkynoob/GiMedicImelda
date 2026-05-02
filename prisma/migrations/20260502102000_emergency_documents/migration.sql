-- Documentos complementarios versionados de Urgencias.
-- Nota de cierre queda excluida; el cierre lo realiza Egreso de urgencias.
CREATE TABLE "EmergencyDocument" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "folio" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "documentDate" TIMESTAMP(3),
  "documentTime" TEXT,
  "responsibleName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "verificationCode" TEXT,
  "contentJson" JSONB,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyDocument_sectionRecordId_key" ON "EmergencyDocument"("sectionRecordId");
CREATE UNIQUE INDEX "EmergencyDocument_folio_key" ON "EmergencyDocument"("folio");
CREATE UNIQUE INDEX "EmergencyDocument_encounterId_documentType_versionNumber_key" ON "EmergencyDocument"("encounterId", "documentType", "versionNumber");
CREATE INDEX "EmergencyDocument_tenantId_idx" ON "EmergencyDocument"("tenantId");
CREATE INDEX "EmergencyDocument_encounterId_idx" ON "EmergencyDocument"("encounterId");
CREATE INDEX "EmergencyDocument_patientId_idx" ON "EmergencyDocument"("patientId");
CREATE INDEX "EmergencyDocument_documentType_idx" ON "EmergencyDocument"("documentType");
CREATE INDEX "EmergencyDocument_status_idx" ON "EmergencyDocument"("status");
CREATE INDEX "EmergencyDocument_recordedAt_idx" ON "EmergencyDocument"("recordedAt");
CREATE INDEX "EmergencyDocument_signerUserId_idx" ON "EmergencyDocument"("signerUserId");

ALTER TABLE "EmergencyDocument" ADD CONSTRAINT "EmergencyDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDocument" ADD CONSTRAINT "EmergencyDocument_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDocument" ADD CONSTRAINT "EmergencyDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDocument" ADD CONSTRAINT "EmergencyDocument_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDocument" ADD CONSTRAINT "EmergencyDocument_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
