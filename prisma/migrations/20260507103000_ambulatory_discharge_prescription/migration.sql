CREATE TABLE "AmbulatoryDischargePrescription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sectionRecordId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "prescriptionFolio" TEXT NOT NULL,
    "prescriptionType" TEXT,
    "issuedAt" TIMESTAMP(3),
    "validity" TEXT,
    "issuerInstitution" TEXT NOT NULL,
    "physicianRfc" TEXT NOT NULL,
    "sanitaryLicense" TEXT NOT NULL,
    "verificationQr" TEXT,
    "qrActive" BOOLEAN NOT NULL DEFAULT false,
    "allergyAlerts" TEXT,
    "medicationValidationSummary" TEXT,
    "medicationTrafficLight" TEXT,
    "dietInstructions" TEXT,
    "physicalActivityLevel" TEXT,
    "physicalActivityDetail" TEXT,
    "woundCare" TEXT,
    "homeMonitoring" TEXT,
    "alarmSigns" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpType" TEXT,
    "followUpReason" TEXT,
    "patientEducation" TEXT,
    "patientUnderstands" BOOLEAN NOT NULL DEFAULT false,
    "companionInformed" BOOLEAN NOT NULL DEFAULT false,
    "professionalName" TEXT NOT NULL,
    "professionalLicense" TEXT NOT NULL,
    "professionalSpecialty" TEXT NOT NULL,
    "careLocation" TEXT NOT NULL,
    "signerUserId" TEXT,
    "signedAt" TIMESTAMP(3),
    "documentHash" TEXT NOT NULL,
    "digitalSeal" TEXT NOT NULL,
    "prescriptionPdfGeneratedAt" TIMESTAMP(3),
    "completePdfGeneratedAt" TIMESTAMP(3),
    "pdfFileName" TEXT,
    "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "pdfLastDownloadedAt" TIMESTAMP(3),
    "contentJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmbulatoryDischargePrescription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryDischargePrescriptionMedication" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dose" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "medicationType" TEXT,
    "indication" TEXT,
    "sourceCatalogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmbulatoryDischargePrescriptionMedication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryDischargePrescriptionValidation" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "validationType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AmbulatoryDischargePrescriptionValidation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbulatoryDischargePrescription_sectionRecordId_key" ON "AmbulatoryDischargePrescription"("sectionRecordId");
CREATE UNIQUE INDEX "AmbulatoryDischargePrescription_prescriptionFolio_key" ON "AmbulatoryDischargePrescription"("prescriptionFolio");
CREATE INDEX "AmbulatoryDischargePrescription_tenantId_idx" ON "AmbulatoryDischargePrescription"("tenantId");
CREATE INDEX "AmbulatoryDischargePrescription_encounterId_idx" ON "AmbulatoryDischargePrescription"("encounterId");
CREATE INDEX "AmbulatoryDischargePrescription_patientId_idx" ON "AmbulatoryDischargePrescription"("patientId");
CREATE INDEX "AmbulatoryDischargePrescription_sectionRecordId_idx" ON "AmbulatoryDischargePrescription"("sectionRecordId");
CREATE INDEX "AmbulatoryDischargePrescription_status_idx" ON "AmbulatoryDischargePrescription"("status");
CREATE INDEX "AmbulatoryDischargePrescription_recordedAt_idx" ON "AmbulatoryDischargePrescription"("recordedAt");
CREATE INDEX "AmbulatoryDischargePrescription_signedAt_idx" ON "AmbulatoryDischargePrescription"("signedAt");
CREATE INDEX "AmbulatoryDischargePrescription_prescriptionFolio_idx" ON "AmbulatoryDischargePrescription"("prescriptionFolio");
CREATE INDEX "AmbulatoryDischargePrescription_documentHash_idx" ON "AmbulatoryDischargePrescription"("documentHash");
CREATE INDEX "AmbulatoryDischargePrescriptionMedication_prescriptionId_idx" ON "AmbulatoryDischargePrescriptionMedication"("prescriptionId");
CREATE INDEX "AmbulatoryDischargePrescriptionMedication_medicationName_idx" ON "AmbulatoryDischargePrescriptionMedication"("medicationName");
CREATE INDEX "AmbulatoryDischargePrescriptionMedication_medicationType_idx" ON "AmbulatoryDischargePrescriptionMedication"("medicationType");
CREATE INDEX "AmbulatoryDischargePrescriptionMedication_route_idx" ON "AmbulatoryDischargePrescriptionMedication"("route");
CREATE INDEX "AmbulatoryDischargePrescriptionValidation_severity_idx" ON "AmbulatoryDischargePrescriptionValidation"("severity");
CREATE INDEX "AmbulatoryDischargePrescriptionValidation_validationType_idx" ON "AmbulatoryDischargePrescriptionValidation"("validationType");
CREATE INDEX "AmbulatoryDischargePrescriptionValidation_blocking_idx" ON "AmbulatoryDischargePrescriptionValidation"("blocking");

ALTER TABLE "AmbulatoryDischargePrescription" ADD CONSTRAINT "AmbulatoryDischargePrescription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargePrescription" ADD CONSTRAINT "AmbulatoryDischargePrescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargePrescription" ADD CONSTRAINT "AmbulatoryDischargePrescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargePrescription" ADD CONSTRAINT "AmbulatoryDischargePrescription_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargePrescription" ADD CONSTRAINT "AmbulatoryDischargePrescription_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargePrescriptionMedication" ADD CONSTRAINT "AmbulatoryDischargePrescriptionMedication_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "AmbulatoryDischargePrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargePrescriptionValidation" ADD CONSTRAINT "AmbulatoryDischargePrescriptionValidation_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "AmbulatoryDischargePrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
