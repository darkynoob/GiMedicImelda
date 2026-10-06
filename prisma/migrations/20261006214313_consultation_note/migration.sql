-- CreateTable
CREATE TABLE "ConsultationNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationNoteVersion" (
    "id" TEXT NOT NULL,
    "consultationNoteId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ClinicalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "previousVersionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "finalizedByUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "secondaryComplaint" TEXT,
    "evolutionTimeValue" INTEGER,
    "evolutionTimeUnit" TEXT,
    "currentIllnessOnsetDate" DATE,
    "currentIllnessEvolutionType" TEXT,
    "currentIllnessDescription" TEXT,
    "currentIllnessEvaIntensity" INTEGER,
    "currentIllnessLocation" TEXT,
    "currentIllnessIrradiation" TEXT,
    "currentIllnessAssociatedSymptoms" TEXT,
    "currentIllnessAggravatingFactors" TEXT,
    "currentIllnessRelievingFactors" TEXT,
    "currentIllnessPriorTreatments" TEXT,
    "vitalSystolicBp" INTEGER,
    "vitalDiastolicBp" INTEGER,
    "vitalHeartRate" INTEGER,
    "vitalRespiratoryRate" INTEGER,
    "vitalTemperatureC" DECIMAL(4,1),
    "vitalOxygenSaturation" DECIMAL(5,2),
    "vitalWeightKg" DECIMAL(8,2),
    "vitalHeightCm" DECIMAL(8,2),
    "vitalEva" INTEGER,
    "vitalGlucose" DECIMAL(6,2),
    "vitalIrregularRhythm" BOOLEAN NOT NULL DEFAULT false,
    "examGeneralState" TEXT,
    "examHeadStatus" TEXT,
    "examHeadDetail" TEXT,
    "examNeckStatus" TEXT,
    "examNeckDetail" TEXT,
    "examCardiovascularStatus" TEXT,
    "examCardiovascularDetail" TEXT,
    "examRespiratoryStatus" TEXT,
    "examRespiratoryDetail" TEXT,
    "examAbdomenStatus" TEXT,
    "examAbdomenDetail" TEXT,
    "examGenitourinaryStatus" TEXT,
    "examGenitourinaryDetail" TEXT,
    "examExtremitiesStatus" TEXT,
    "examExtremitiesDetail" TEXT,
    "examNeurologicalStatus" TEXT,
    "examNeurologicalDetail" TEXT,
    "examSkinStatus" TEXT,
    "examSkinDetail" TEXT,
    "examLymphaticStatus" TEXT,
    "examLymphaticDetail" TEXT,
    "priorResultsSummary" TEXT,
    "primaryDiagnosisCode" TEXT,
    "primaryDiagnosisDescription" TEXT,
    "primaryDiagnosisType" TEXT,
    "primaryDiagnosisStatus" TEXT,
    "secondaryDiagnosesJson" JSONB,
    "pharmacologicalTreatmentJson" JSONB,
    "nonPharmacologicalTreatment" TEXT,
    "plannedStudies" TEXT,
    "plannedReferrals" TEXT,
    "plannedConsultations" TEXT,
    "disabilityDays" INTEGER,
    "disabilityFrom" DATE,
    "disabilityTo" DATE,
    "disabilityReason" TEXT,
    "prognosis" TEXT,
    "followUpDate" DATE,
    "consentCurrent" BOOLEAN NOT NULL DEFAULT false,
    "consentExplanation" TEXT,
    "consentComprehension" TEXT,
    "riskSuddenSevereHeadache" BOOLEAN NOT NULL DEFAULT false,
    "riskFocalNeuroDeficit" BOOLEAN NOT NULL DEFAULT false,
    "riskVisionLoss" BOOLEAN NOT NULL DEFAULT false,
    "riskChestPain" BOOLEAN NOT NULL DEFAULT false,
    "riskDyspnea" BOOLEAN NOT NULL DEFAULT false,
    "riskHighFever" BOOLEAN NOT NULL DEFAULT false,
    "riskUnexplainedWeightLoss" BOOLEAN NOT NULL DEFAULT false,
    "riskActiveBleeding" BOOLEAN NOT NULL DEFAULT false,
    "riskAlteredConsciousness" BOOLEAN NOT NULL DEFAULT false,
    "riskFindingsNotes" TEXT,
    "functionalCapacity" TEXT,
    "functionalImpact" TEXT,
    "functionalDescription" TEXT,
    "pharmacologicalAdherence" TEXT,
    "nonPharmacologicalAdherence" TEXT,
    "adherenceNotes" TEXT,
    "legalSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationNoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNote_encounterId_key" ON "ConsultationNote"("encounterId");

-- CreateIndex
CREATE INDEX "ConsultationNote_tenantId_idx" ON "ConsultationNote"("tenantId");

-- CreateIndex
CREATE INDEX "ConsultationNote_patientId_idx" ON "ConsultationNote"("patientId");

-- CreateIndex
CREATE INDEX "ConsultationNote_medicalRecordId_idx" ON "ConsultationNote"("medicalRecordId");

-- CreateIndex
CREATE INDEX "ConsultationNoteVersion_consultationNoteId_idx" ON "ConsultationNoteVersion"("consultationNoteId");

-- CreateIndex
CREATE INDEX "ConsultationNoteVersion_status_idx" ON "ConsultationNoteVersion"("status");

-- CreateIndex
CREATE INDEX "ConsultationNoteVersion_previousVersionId_idx" ON "ConsultationNoteVersion"("previousVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNoteVersion_consultationNoteId_versionNumber_key" ON "ConsultationNoteVersion"("consultationNoteId", "versionNumber");

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNoteVersion" ADD CONSTRAINT "ConsultationNoteVersion_consultationNoteId_fkey" FOREIGN KEY ("consultationNoteId") REFERENCES "ConsultationNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNoteVersion" ADD CONSTRAINT "ConsultationNoteVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNoteVersion" ADD CONSTRAINT "ConsultationNoteVersion_finalizedByUserId_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
