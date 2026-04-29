-- Normalized emergency consultation records with timing audit and shared responsibility.
CREATE TABLE "EmergencyConsultation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sectionRecordId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "priority" TEXT NOT NULL,
    "targetResponseMinutes" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseTimeMinutes" INTEGER,
    "notificationMedium" TEXT,
    "requestingService" TEXT NOT NULL DEFAULT 'Urgencias',
    "requestedService" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterLicense" TEXT,
    "consultantUserId" TEXT,
    "consultantName" TEXT,
    "consultantLicense" TEXT,
    "reason" TEXT NOT NULL,
    "clinicalSummary" TEXT NOT NULL,
    "relatedDiagnosis" TEXT,
    "relatedCie10" TEXT,
    "consultantDiagnosis" TEXT,
    "suggestedConduct" TEXT,
    "recommendedFollowUp" TEXT,
    "decision" TEXT,
    "linkedOrdersSummary" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyConsultation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyConsultation_sectionRecordId_key" ON "EmergencyConsultation"("sectionRecordId");
CREATE INDEX "EmergencyConsultation_tenantId_idx" ON "EmergencyConsultation"("tenantId");
CREATE INDEX "EmergencyConsultation_encounterId_idx" ON "EmergencyConsultation"("encounterId");
CREATE INDEX "EmergencyConsultation_patientId_idx" ON "EmergencyConsultation"("patientId");
CREATE INDEX "EmergencyConsultation_status_idx" ON "EmergencyConsultation"("status");
CREATE INDEX "EmergencyConsultation_priority_idx" ON "EmergencyConsultation"("priority");
CREATE INDEX "EmergencyConsultation_requestedAt_idx" ON "EmergencyConsultation"("requestedAt");

ALTER TABLE "EmergencyConsultation"
ADD CONSTRAINT "EmergencyConsultation_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyConsultation"
ADD CONSTRAINT "EmergencyConsultation_encounterId_fkey"
FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyConsultation"
ADD CONSTRAINT "EmergencyConsultation_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyConsultation"
ADD CONSTRAINT "EmergencyConsultation_sectionRecordId_fkey"
FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyConsultation"
ADD CONSTRAINT "EmergencyConsultation_requesterUserId_fkey"
FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmergencyConsultation"
ADD CONSTRAINT "EmergencyConsultation_consultantUserId_fkey"
FOREIGN KEY ("consultantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
