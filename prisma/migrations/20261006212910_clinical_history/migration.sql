-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "sourceVersionId" TEXT;

-- AlterTable
ALTER TABLE "MedicationStatement" ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "sourceVersionId" TEXT;

-- AlterTable
ALTER TABLE "VitalSign" ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "sourceVersionId" TEXT;

-- CreateTable
CREATE TABLE "ClinicalHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalHistoryVersion" (
    "id" TEXT NOT NULL,
    "clinicalHistoryId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ClinicalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "previousVersionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "finalizedByUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "currentIllness" TEXT,
    "familyHistoryDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryHypertension" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryCancer" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryHeartDisease" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryStroke" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryKidneyDisease" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryAutoimmune" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryPsychiatric" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryOther" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryOtherDetail" TEXT,
    "familyHistoryNotes" TEXT,
    "personalPathologicalChronicDiseases" TEXT,
    "personalPathologicalSurgical" TEXT,
    "personalPathologicalHospitalizations" TEXT,
    "personalPathologicalTraumatic" TEXT,
    "personalPathologicalTransfusional" TEXT,
    "personalPathologicalInfectious" TEXT,
    "allergiesSnapshotJson" JSONB,
    "allergiesStatus" TEXT,
    "nonPathologicalDiet" TEXT,
    "nonPathologicalPhysicalActivity" TEXT,
    "nonPathologicalSmoking" TEXT,
    "nonPathologicalSmokingDetail" TEXT,
    "nonPathologicalAlcohol" TEXT,
    "nonPathologicalAlcoholDetail" TEXT,
    "nonPathologicalSubstances" TEXT,
    "nonPathologicalSubstancesDetail" TEXT,
    "nonPathologicalHousing" TEXT,
    "nonPathologicalHygiene" TEXT,
    "nonPathologicalImmunizations" TEXT,
    "gynecoMenarche" INTEGER,
    "gynecoMenstrualRhythm" TEXT,
    "gynecoMenstrualRhythmDetail" TEXT,
    "gynecoLastMenstrualPeriod" DATE,
    "gynecoSexualActivityOnsetAge" INTEGER,
    "gynecoPregnancies" INTEGER,
    "gynecoBirths" INTEGER,
    "gynecoMiscarriages" INTEGER,
    "gynecoCSections" INTEGER,
    "gynecoFamilyPlanningMethod" TEXT,
    "gynecoFamilyPlanningDetail" TEXT,
    "gynecoMammographyDate" DATE,
    "gynecoMammographyResult" TEXT,
    "gynecoMenopauseStatus" TEXT,
    "gynecoMenopauseAgeOrDate" TEXT,
    "reviewCardiovascularStatus" TEXT,
    "reviewCardiovascularDetail" TEXT,
    "reviewRespiratoryStatus" TEXT,
    "reviewRespiratoryDetail" TEXT,
    "reviewDigestiveStatus" TEXT,
    "reviewDigestiveDetail" TEXT,
    "reviewGenitourinaryStatus" TEXT,
    "reviewGenitourinaryDetail" TEXT,
    "reviewMusculoskeletalStatus" TEXT,
    "reviewMusculoskeletalDetail" TEXT,
    "reviewNervousStatus" TEXT,
    "reviewNervousDetail" TEXT,
    "reviewEndocrineStatus" TEXT,
    "reviewEndocrineDetail" TEXT,
    "reviewSkinStatus" TEXT,
    "reviewSkinDetail" TEXT,
    "reviewHematologicStatus" TEXT,
    "reviewHematologicDetail" TEXT,
    "reviewOphthalmologicStatus" TEXT,
    "reviewOphthalmologicDetail" TEXT,
    "reviewEntStatus" TEXT,
    "reviewEntDetail" TEXT,
    "reviewPsychiatricStatus" TEXT,
    "reviewPsychiatricDetail" TEXT,
    "vitalTemperatureC" DECIMAL(4,1),
    "vitalSystolicBp" INTEGER,
    "vitalDiastolicBp" INTEGER,
    "vitalHeartRate" INTEGER,
    "vitalRespiratoryRate" INTEGER,
    "vitalWeightKg" DECIMAL(8,2),
    "vitalHeightCm" DECIMAL(8,2),
    "physicalExamGeneralAppearance" TEXT,
    "physicalExamHead" TEXT,
    "physicalExamNeck" TEXT,
    "physicalExamChest" TEXT,
    "physicalExamAbdomen" TEXT,
    "physicalExamExtremities" TEXT,
    "physicalExamGenitals" TEXT,
    "physicalExamOtherFindings" TEXT,
    "primaryDiagnosisCode" TEXT,
    "primaryDiagnosisDescription" TEXT,
    "primaryDiagnosisType" TEXT,
    "secondaryDiagnosesJson" JSONB,
    "priorStudiesJson" JSONB,
    "priorStudiesSummary" TEXT,
    "currentTreatmentMedicationsJson" JSONB,
    "chronicMedicationsJson" JSONB,
    "nonPharmacologicalTreatment" TEXT,
    "followUpPlan" TEXT,
    "prognosis" TEXT,
    "pharmacologicalAdherence" TEXT,
    "nonPharmacologicalAdherence" TEXT,
    "adherenceNotes" TEXT,
    "riskFactorSmoking" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorAlcohol" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorSedentary" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorObesity" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorDiet" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorStress" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorCardiovascularHistory" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorSubstanceUse" BOOLEAN NOT NULL DEFAULT false,
    "riskFactorClassification" TEXT,
    "riskFactorNotes" TEXT,
    "legalSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalHistoryVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalHistory_encounterId_key" ON "ClinicalHistory"("encounterId");

-- CreateIndex
CREATE INDEX "ClinicalHistory_tenantId_idx" ON "ClinicalHistory"("tenantId");

-- CreateIndex
CREATE INDEX "ClinicalHistory_patientId_idx" ON "ClinicalHistory"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalHistory_medicalRecordId_idx" ON "ClinicalHistory"("medicalRecordId");

-- CreateIndex
CREATE INDEX "ClinicalHistoryVersion_clinicalHistoryId_idx" ON "ClinicalHistoryVersion"("clinicalHistoryId");

-- CreateIndex
CREATE INDEX "ClinicalHistoryVersion_status_idx" ON "ClinicalHistoryVersion"("status");

-- CreateIndex
CREATE INDEX "ClinicalHistoryVersion_previousVersionId_idx" ON "ClinicalHistoryVersion"("previousVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalHistoryVersion_clinicalHistoryId_versionNumber_key" ON "ClinicalHistoryVersion"("clinicalHistoryId", "versionNumber");

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistoryVersion" ADD CONSTRAINT "ClinicalHistoryVersion_clinicalHistoryId_fkey" FOREIGN KEY ("clinicalHistoryId") REFERENCES "ClinicalHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistoryVersion" ADD CONSTRAINT "ClinicalHistoryVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistoryVersion" ADD CONSTRAINT "ClinicalHistoryVersion_finalizedByUserId_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
