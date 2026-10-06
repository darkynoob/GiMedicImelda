-- CreateTable
CREATE TABLE "EvolutionNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "noteNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionNoteVersion" (
    "id" TEXT NOT NULL,
    "evolutionNoteId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ClinicalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "previousVersionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "finalizedByUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "clinicalStatus" TEXT,
    "complications" TEXT,
    "subjective" TEXT,
    "vitalSystolicBp" INTEGER,
    "vitalDiastolicBp" INTEGER,
    "vitalHeartRate" INTEGER,
    "vitalRespiratoryRate" INTEGER,
    "vitalTemperatureC" DECIMAL(4,1),
    "vitalOxygenSaturation" DECIMAL(5,2),
    "vitalWeightKg" DECIMAL(8,2),
    "vitalHeightCm" DECIMAL(8,2),
    "vitalCapillaryGlucose" DECIMAL(6,2),
    "vitalEva" INTEGER,
    "objectiveFindings" TEXT,
    "recentResults" TEXT,
    "primaryDiagnosisCode" TEXT,
    "primaryDiagnosisDescription" TEXT,
    "primaryDiagnosisStatus" TEXT,
    "primaryDiagnosisLinkedProblemId" TEXT,
    "secondaryDiagnosesJson" JSONB,
    "prognosisStatus" TEXT,
    "prognosisDetail" TEXT,
    "treatmentChangeType" TEXT,
    "treatmentNotes" TEXT,
    "plannedStudies" TEXT,
    "plannedConsultations" TEXT,
    "followUpNotes" TEXT,
    "nextAssessmentDate" TIMESTAMP(3),
    "consentCurrent" BOOLEAN NOT NULL DEFAULT false,
    "informationProvided" TEXT,
    "trend" TEXT,
    "comparativeAnalysis" TEXT,
    "pharmacologicalResponse" TEXT,
    "adverseEvents" TEXT,
    "clinicalJustification" TEXT,
    "glasgowOcular" INTEGER,
    "glasgowVerbal" INTEGER,
    "glasgowMotor" INTEGER,
    "cardiovascularRisk" TEXT,
    "karnofskyScore" INTEGER,
    "otherScaleName" TEXT,
    "otherScaleResult" TEXT,
    "legalSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionNoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvolutionNote_tenantId_idx" ON "EvolutionNote"("tenantId");

-- CreateIndex
CREATE INDEX "EvolutionNote_patientId_idx" ON "EvolutionNote"("patientId");

-- CreateIndex
CREATE INDEX "EvolutionNote_medicalRecordId_idx" ON "EvolutionNote"("medicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionNote_encounterId_noteNumber_key" ON "EvolutionNote"("encounterId", "noteNumber");

-- CreateIndex
CREATE INDEX "EvolutionNoteVersion_evolutionNoteId_idx" ON "EvolutionNoteVersion"("evolutionNoteId");

-- CreateIndex
CREATE INDEX "EvolutionNoteVersion_status_idx" ON "EvolutionNoteVersion"("status");

-- CreateIndex
CREATE INDEX "EvolutionNoteVersion_previousVersionId_idx" ON "EvolutionNoteVersion"("previousVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionNoteVersion_evolutionNoteId_versionNumber_key" ON "EvolutionNoteVersion"("evolutionNoteId", "versionNumber");

-- AddForeignKey
ALTER TABLE "EvolutionNote" ADD CONSTRAINT "EvolutionNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionNote" ADD CONSTRAINT "EvolutionNote_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionNote" ADD CONSTRAINT "EvolutionNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionNote" ADD CONSTRAINT "EvolutionNote_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionNoteVersion" ADD CONSTRAINT "EvolutionNoteVersion_evolutionNoteId_fkey" FOREIGN KEY ("evolutionNoteId") REFERENCES "EvolutionNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionNoteVersion" ADD CONSTRAINT "EvolutionNoteVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionNoteVersion" ADD CONSTRAINT "EvolutionNoteVersion_finalizedByUserId_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
