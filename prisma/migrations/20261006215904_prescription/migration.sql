-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "prescriptionNumber" INTEGER NOT NULL,
    "folio" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionVersion" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ClinicalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "previousVersionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "finalizedByUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "verificationCode" TEXT,
    "prescriptionType" TEXT NOT NULL DEFAULT 'ORDINARIA',
    "validityOption" TEXT,
    "validityExpiresAt" DATE,
    "primaryDiagnosisCode" TEXT,
    "primaryDiagnosisDescription" TEXT,
    "secondaryDiagnosesJson" JSONB,
    "generalInstructions" TEXT,
    "medicationsJson" JSONB,
    "allergyValidationStatus" TEXT,
    "allergyValidationDetailJson" JSONB,
    "duplicateTherapyValidationStatus" TEXT,
    "duplicateTherapyDetailJson" JSONB,
    "interactionValidationStatus" TEXT DEFAULT 'NOT_CONFIGURED',
    "criticalAlertAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "criticalAlertJustification" TEXT,
    "warningSignsJson" JSONB,
    "nextAppointmentDate" DATE,
    "educationInfoProvided" TEXT,
    "educationNonPharmacological" TEXT,
    "patientComprehension" TEXT,
    "educationalMaterialsJson" JSONB,
    "followUpType" TEXT,
    "followUpInstructions" TEXT,
    "legalSnapshotJson" JSONB,
    "officialPdfAvailableAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_folio_key" ON "Prescription"("folio");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_idx" ON "Prescription"("tenantId");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_medicalRecordId_idx" ON "Prescription"("medicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_encounterId_prescriptionNumber_key" ON "Prescription"("encounterId", "prescriptionNumber");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_prescriptionId_idx" ON "PrescriptionVersion"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_status_idx" ON "PrescriptionVersion"("status");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_previousVersionId_idx" ON "PrescriptionVersion"("previousVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionVersion_prescriptionId_versionNumber_key" ON "PrescriptionVersion"("prescriptionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionVersion_verificationCode_key" ON "PrescriptionVersion"("verificationCode");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_finalizedByUserId_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
