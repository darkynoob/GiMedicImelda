CREATE TABLE "HospitalEvolution" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "subjective" TEXT,
  "systolicBp" DECIMAL(10,2),
  "diastolicBp" DECIMAL(10,2),
  "heartRate" DECIMAL(10,2),
  "respiratoryRate" DECIMAL(10,2),
  "temperature" DECIMAL(10,2),
  "oxygenSaturation" DECIMAL(10,2),
  "painEva" DECIMAL(10,2),
  "capillaryGlucose" DECIMAL(10,2),
  "physicalExam" TEXT,
  "clinicalInterpretation" TEXT,
  "clinicalChanges" TEXT,
  "nom004Justification" TEXT,
  "adverseEvents" TEXT,
  "complications" TEXT,
  "treatmentPlan" TEXT,
  "studiesPlan" TEXT,
  "consultationsPlan" TEXT,
  "followUpPlan" TEXT,
  "prognosis" TEXT,
  "currentConsent" TEXT,
  "patientFamilyInformation" TEXT,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "previousEvolutionRecordId" TEXT,
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalEvolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalEvolutionResult" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "hospitalEvolutionId" TEXT NOT NULL,
  "studyName" TEXT NOT NULL,
  "resultText" TEXT,
  "resultDate" TIMESTAMP(3) NOT NULL,
  "sourceType" TEXT,
  "sourceRecordId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalEvolutionResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalEvolutionDiagnosis" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "hospitalEvolutionId" TEXT NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "cie10" TEXT,
  "status" TEXT NOT NULL,
  "sourceDiagnosisId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalEvolutionDiagnosis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalEvolution_sectionRecordId_key" ON "HospitalEvolution"("sectionRecordId");
CREATE UNIQUE INDEX "HospitalEvolution_encounterId_versionNumber_key" ON "HospitalEvolution"("encounterId", "versionNumber");
CREATE INDEX "HospitalEvolution_tenantId_idx" ON "HospitalEvolution"("tenantId");
CREATE INDEX "HospitalEvolution_encounterId_idx" ON "HospitalEvolution"("encounterId");
CREATE INDEX "HospitalEvolution_patientId_idx" ON "HospitalEvolution"("patientId");
CREATE INDEX "HospitalEvolution_status_idx" ON "HospitalEvolution"("status");
CREATE INDEX "HospitalEvolution_recordedAt_idx" ON "HospitalEvolution"("recordedAt");
CREATE INDEX "HospitalEvolution_signerUserId_idx" ON "HospitalEvolution"("signerUserId");
CREATE INDEX "HospitalEvolution_previousEvolutionRecordId_idx" ON "HospitalEvolution"("previousEvolutionRecordId");

CREATE INDEX "HospitalEvolutionResult_tenantId_idx" ON "HospitalEvolutionResult"("tenantId");
CREATE INDEX "HospitalEvolutionResult_encounterId_idx" ON "HospitalEvolutionResult"("encounterId");
CREATE INDEX "HospitalEvolutionResult_patientId_idx" ON "HospitalEvolutionResult"("patientId");
CREATE INDEX "HospitalEvolutionResult_hospitalEvolutionId_idx" ON "HospitalEvolutionResult"("hospitalEvolutionId");
CREATE INDEX "HospitalEvolutionResult_resultDate_idx" ON "HospitalEvolutionResult"("resultDate");
CREATE INDEX "HospitalEvolutionResult_sourceType_idx" ON "HospitalEvolutionResult"("sourceType");
CREATE INDEX "HospitalEvolutionResult_sourceRecordId_idx" ON "HospitalEvolutionResult"("sourceRecordId");

CREATE INDEX "HospitalEvolutionDiagnosis_tenantId_idx" ON "HospitalEvolutionDiagnosis"("tenantId");
CREATE INDEX "HospitalEvolutionDiagnosis_encounterId_idx" ON "HospitalEvolutionDiagnosis"("encounterId");
CREATE INDEX "HospitalEvolutionDiagnosis_patientId_idx" ON "HospitalEvolutionDiagnosis"("patientId");
CREATE INDEX "HospitalEvolutionDiagnosis_hospitalEvolutionId_idx" ON "HospitalEvolutionDiagnosis"("hospitalEvolutionId");
CREATE INDEX "HospitalEvolutionDiagnosis_status_idx" ON "HospitalEvolutionDiagnosis"("status");
CREATE INDEX "HospitalEvolutionDiagnosis_sourceDiagnosisId_idx" ON "HospitalEvolutionDiagnosis"("sourceDiagnosisId");

ALTER TABLE "HospitalEvolution" ADD CONSTRAINT "HospitalEvolution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolution" ADD CONSTRAINT "HospitalEvolution_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolution" ADD CONSTRAINT "HospitalEvolution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolution" ADD CONSTRAINT "HospitalEvolution_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolution" ADD CONSTRAINT "HospitalEvolution_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalEvolutionResult" ADD CONSTRAINT "HospitalEvolutionResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolutionResult" ADD CONSTRAINT "HospitalEvolutionResult_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolutionResult" ADD CONSTRAINT "HospitalEvolutionResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolutionResult" ADD CONSTRAINT "HospitalEvolutionResult_hospitalEvolutionId_fkey" FOREIGN KEY ("hospitalEvolutionId") REFERENCES "HospitalEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalEvolutionDiagnosis" ADD CONSTRAINT "HospitalEvolutionDiagnosis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolutionDiagnosis" ADD CONSTRAINT "HospitalEvolutionDiagnosis_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolutionDiagnosis" ADD CONSTRAINT "HospitalEvolutionDiagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalEvolutionDiagnosis" ADD CONSTRAINT "HospitalEvolutionDiagnosis_hospitalEvolutionId_fkey" FOREIGN KEY ("hospitalEvolutionId") REFERENCES "HospitalEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
