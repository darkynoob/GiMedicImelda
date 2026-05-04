CREATE TABLE "HospitalNursingShift" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "recordType" TEXT NOT NULL DEFAULT 'Enfermería',
  "shiftType" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "habitusExterior" TEXT,
  "fluidIntakeMl" DECIMAL(10,2),
  "fluidOutputMl" DECIMAL(10,2),
  "fluidBalanceMl" DECIMAL(10,2),
  "woundCare" TEXT,
  "mobilization" TEXT,
  "hygiene" TEXT,
  "surveillance" TEXT,
  "devices" TEXT,
  "morseFallRisk" TEXT,
  "bradenUppRisk" TEXT,
  "adverseEvent" TEXT,
  "adverseEventType" TEXT,
  "adverseEventDescriptionAction" TEXT,
  "generalObservations" TEXT,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalNursingShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalNursingVitalSign" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "nursingShiftId" TEXT NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL,
  "systolicBp" INTEGER NOT NULL,
  "diastolicBp" INTEGER NOT NULL,
  "heartRate" INTEGER NOT NULL,
  "respiratoryRate" INTEGER NOT NULL,
  "temperatureC" DECIMAL(5,2) NOT NULL,
  "oxygenSaturation" DECIMAL(5,2) NOT NULL,
  "capillaryGlucose" DECIMAL(8,2),
  "painEva" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalNursingVitalSign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalMedicationAdministration" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "nursingShiftId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "scheduledTime" TEXT NOT NULL,
  "administeredTime" TEXT,
  "status" TEXT NOT NULL,
  "omissionReason" TEXT,
  "nurseName" TEXT NOT NULL,
  "sourceMedicalOrderId" TEXT,
  "sourceMedicationId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalMedicationAdministration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalNursingProcedure" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "nursingShiftId" TEXT NOT NULL,
  "procedureName" TEXT NOT NULL,
  "performedTime" TEXT,
  "performedBy" TEXT,
  "observations" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalNursingProcedure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalNursingShift_sectionRecordId_key" ON "HospitalNursingShift"("sectionRecordId");
CREATE UNIQUE INDEX "HospitalNursingShift_encounterId_versionNumber_key" ON "HospitalNursingShift"("encounterId", "versionNumber");
CREATE INDEX "HospitalNursingShift_tenantId_idx" ON "HospitalNursingShift"("tenantId");
CREATE INDEX "HospitalNursingShift_encounterId_idx" ON "HospitalNursingShift"("encounterId");
CREATE INDEX "HospitalNursingShift_patientId_idx" ON "HospitalNursingShift"("patientId");
CREATE INDEX "HospitalNursingShift_shiftType_idx" ON "HospitalNursingShift"("shiftType");
CREATE INDEX "HospitalNursingShift_status_idx" ON "HospitalNursingShift"("status");
CREATE INDEX "HospitalNursingShift_recordedAt_idx" ON "HospitalNursingShift"("recordedAt");
CREATE INDEX "HospitalNursingShift_signerUserId_idx" ON "HospitalNursingShift"("signerUserId");

CREATE INDEX "HospitalNursingVitalSign_tenantId_idx" ON "HospitalNursingVitalSign"("tenantId");
CREATE INDEX "HospitalNursingVitalSign_encounterId_idx" ON "HospitalNursingVitalSign"("encounterId");
CREATE INDEX "HospitalNursingVitalSign_patientId_idx" ON "HospitalNursingVitalSign"("patientId");
CREATE INDEX "HospitalNursingVitalSign_nursingShiftId_idx" ON "HospitalNursingVitalSign"("nursingShiftId");
CREATE INDEX "HospitalNursingVitalSign_takenAt_idx" ON "HospitalNursingVitalSign"("takenAt");

CREATE INDEX "HospitalMedicationAdministration_tenantId_idx" ON "HospitalMedicationAdministration"("tenantId");
CREATE INDEX "HospitalMedicationAdministration_encounterId_idx" ON "HospitalMedicationAdministration"("encounterId");
CREATE INDEX "HospitalMedicationAdministration_patientId_idx" ON "HospitalMedicationAdministration"("patientId");
CREATE INDEX "HospitalMedicationAdministration_nursingShiftId_idx" ON "HospitalMedicationAdministration"("nursingShiftId");
CREATE INDEX "HospitalMedicationAdministration_status_idx" ON "HospitalMedicationAdministration"("status");
CREATE INDEX "HospitalMedicationAdministration_sourceMedicalOrderId_idx" ON "HospitalMedicationAdministration"("sourceMedicalOrderId");
CREATE INDEX "HospitalMedicationAdministration_sourceMedicationId_idx" ON "HospitalMedicationAdministration"("sourceMedicationId");

CREATE INDEX "HospitalNursingProcedure_tenantId_idx" ON "HospitalNursingProcedure"("tenantId");
CREATE INDEX "HospitalNursingProcedure_encounterId_idx" ON "HospitalNursingProcedure"("encounterId");
CREATE INDEX "HospitalNursingProcedure_patientId_idx" ON "HospitalNursingProcedure"("patientId");
CREATE INDEX "HospitalNursingProcedure_nursingShiftId_idx" ON "HospitalNursingProcedure"("nursingShiftId");

ALTER TABLE "HospitalNursingShift" ADD CONSTRAINT "HospitalNursingShift_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingShift" ADD CONSTRAINT "HospitalNursingShift_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingShift" ADD CONSTRAINT "HospitalNursingShift_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingShift" ADD CONSTRAINT "HospitalNursingShift_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingShift" ADD CONSTRAINT "HospitalNursingShift_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalNursingVitalSign" ADD CONSTRAINT "HospitalNursingVitalSign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingVitalSign" ADD CONSTRAINT "HospitalNursingVitalSign_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingVitalSign" ADD CONSTRAINT "HospitalNursingVitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingVitalSign" ADD CONSTRAINT "HospitalNursingVitalSign_nursingShiftId_fkey" FOREIGN KEY ("nursingShiftId") REFERENCES "HospitalNursingShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalMedicationAdministration" ADD CONSTRAINT "HospitalMedicationAdministration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicationAdministration" ADD CONSTRAINT "HospitalMedicationAdministration_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicationAdministration" ADD CONSTRAINT "HospitalMedicationAdministration_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicationAdministration" ADD CONSTRAINT "HospitalMedicationAdministration_nursingShiftId_fkey" FOREIGN KEY ("nursingShiftId") REFERENCES "HospitalNursingShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalNursingProcedure" ADD CONSTRAINT "HospitalNursingProcedure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingProcedure" ADD CONSTRAINT "HospitalNursingProcedure_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingProcedure" ADD CONSTRAINT "HospitalNursingProcedure_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalNursingProcedure" ADD CONSTRAINT "HospitalNursingProcedure_nursingShiftId_fkey" FOREIGN KEY ("nursingShiftId") REFERENCES "HospitalNursingShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
