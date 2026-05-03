CREATE TABLE "HospitalConsultation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BORRADOR',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "requestedDate" TIMESTAMP(3),
  "requestedTime" TEXT,
  "notificationMedium" TEXT,
  "requestingService" TEXT,
  "requestedService" TEXT NOT NULL,
  "priority" TEXT,
  "targetResponseMinutes" INTEGER,
  "reason" TEXT NOT NULL,
  "diagnosticCriteria" TEXT,
  "relatedDiagnosis" TEXT,
  "relatedCie10" TEXT,
  "relatedStudies" TEXT,
  "requesterUserId" TEXT,
  "requesterName" TEXT NOT NULL,
  "requesterLicense" TEXT,
  "requesterSpecialty" TEXT,
  "requestSignedAt" TIMESTAMP(3),
  "responseDate" TIMESTAMP(3),
  "responseTime" TEXT,
  "consultantUserId" TEXT,
  "consultantName" TEXT,
  "consultantLicense" TEXT,
  "diagnosticImpression" TEXT,
  "diagnosticSuggestions" TEXT,
  "therapeuticSuggestions" TEXT,
  "requiresFollowUp" TEXT,
  "consultationResult" TEXT,
  "responseSignedAt" TIMESTAMP(3),
  "responseTimeMinutes" INTEGER,
  "closureTimeMinutes" INTEGER,
  "closedAt" TIMESTAMP(3),
  "legalProfessionalName" TEXT NOT NULL,
  "legalProfessionalLicense" TEXT,
  "legalProfessionalSpecialty" TEXT,
  "careLocation" TEXT,
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalConsultation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalConsultation_sectionRecordId_key" ON "HospitalConsultation"("sectionRecordId");
CREATE UNIQUE INDEX "HospitalConsultation_encounterId_versionNumber_key" ON "HospitalConsultation"("encounterId", "versionNumber");
CREATE INDEX "HospitalConsultation_tenantId_idx" ON "HospitalConsultation"("tenantId");
CREATE INDEX "HospitalConsultation_encounterId_idx" ON "HospitalConsultation"("encounterId");
CREATE INDEX "HospitalConsultation_patientId_idx" ON "HospitalConsultation"("patientId");
CREATE INDEX "HospitalConsultation_status_idx" ON "HospitalConsultation"("status");
CREATE INDEX "HospitalConsultation_requestedService_idx" ON "HospitalConsultation"("requestedService");
CREATE INDEX "HospitalConsultation_priority_idx" ON "HospitalConsultation"("priority");
CREATE INDEX "HospitalConsultation_requestSignedAt_idx" ON "HospitalConsultation"("requestSignedAt");
CREATE INDEX "HospitalConsultation_responseSignedAt_idx" ON "HospitalConsultation"("responseSignedAt");
CREATE INDEX "HospitalConsultation_closedAt_idx" ON "HospitalConsultation"("closedAt");
CREATE INDEX "HospitalConsultation_requesterUserId_idx" ON "HospitalConsultation"("requesterUserId");
CREATE INDEX "HospitalConsultation_consultantUserId_idx" ON "HospitalConsultation"("consultantUserId");

ALTER TABLE "HospitalConsultation" ADD CONSTRAINT "HospitalConsultation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalConsultation" ADD CONSTRAINT "HospitalConsultation_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalConsultation" ADD CONSTRAINT "HospitalConsultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalConsultation" ADD CONSTRAINT "HospitalConsultation_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalConsultation" ADD CONSTRAINT "HospitalConsultation_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HospitalConsultation" ADD CONSTRAINT "HospitalConsultation_consultantUserId_fkey" FOREIGN KEY ("consultantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
