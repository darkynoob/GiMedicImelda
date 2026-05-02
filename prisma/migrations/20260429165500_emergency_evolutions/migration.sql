-- Normaliza la evolución médica de Urgencias para trazabilidad clínica,
-- signos vitales como nueva toma y diagnósticos longitudinales.
CREATE TABLE "EmergencyEvolution" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "evolutionDate" TIMESTAMP(3),
  "evolutionTime" TEXT,
  "evolutionDay" INTEGER,
  "clinicalStatus" TEXT,
  "patientReference" TEXT,
  "systolicBp" INTEGER,
  "diastolicBp" INTEGER,
  "heartRate" INTEGER,
  "respiratoryRate" INTEGER,
  "temperature" DECIMAL(4,1),
  "oxygenSaturation" INTEGER,
  "painScale" INTEGER,
  "glucose" INTEGER,
  "glasgow" INTEGER,
  "directedPhysicalExam" TEXT,
  "externalResultsSummary" TEXT,
  "diagnosesJson" JSONB,
  "adverseEvents" TEXT,
  "complications" TEXT,
  "treatmentPlan" TEXT,
  "pendingStudies" TEXT,
  "interconsultationsPlan" TEXT,
  "followUpPlan" TEXT,
  "consentStatus" TEXT,
  "informationProvided" TEXT,
  "clinicalJustification" TEXT,
  "treatmentResponse" TEXT,
  "nursingSnapshotJson" JSONB,
  "auxiliaryServicesSnapshotJson" JSONB,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmergencyEvolution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyEvolution_sectionRecordId_key" ON "EmergencyEvolution"("sectionRecordId");
CREATE INDEX "EmergencyEvolution_tenantId_idx" ON "EmergencyEvolution"("tenantId");
CREATE INDEX "EmergencyEvolution_encounterId_idx" ON "EmergencyEvolution"("encounterId");
CREATE INDEX "EmergencyEvolution_patientId_idx" ON "EmergencyEvolution"("patientId");
CREATE INDEX "EmergencyEvolution_status_idx" ON "EmergencyEvolution"("status");
CREATE INDEX "EmergencyEvolution_recordedAt_idx" ON "EmergencyEvolution"("recordedAt");
CREATE INDEX "EmergencyEvolution_clinicalStatus_idx" ON "EmergencyEvolution"("clinicalStatus");
CREATE INDEX "EmergencyEvolution_signerUserId_idx" ON "EmergencyEvolution"("signerUserId");

ALTER TABLE "EmergencyEvolution"
  ADD CONSTRAINT "EmergencyEvolution_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyEvolution"
  ADD CONSTRAINT "EmergencyEvolution_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyEvolution"
  ADD CONSTRAINT "EmergencyEvolution_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyEvolution"
  ADD CONSTRAINT "EmergencyEvolution_sectionRecordId_fkey"
  FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyEvolution"
  ADD CONSTRAINT "EmergencyEvolution_signerUserId_fkey"
  FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
