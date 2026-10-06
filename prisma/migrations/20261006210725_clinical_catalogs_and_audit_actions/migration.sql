-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_DRAFT';
ALTER TYPE "AuditAction" ADD VALUE 'FINALIZE';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_VERSION';
ALTER TYPE "AuditAction" ADD VALUE 'DOWNLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'MODIFY_FINALIZED_DENIED';
ALTER TYPE "AuditAction" ADD VALUE 'CLOSE_EPISODE';

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargePrescription" DROP CONSTRAINT "AmbulatoryDischargePrescription_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargePrescription" DROP CONSTRAINT "AmbulatoryDischargePrescription_patientId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargePrescription" DROP CONSTRAINT "AmbulatoryDischargePrescription_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargePrescription" DROP CONSTRAINT "AmbulatoryDischargePrescription_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargePrescription" DROP CONSTRAINT "AmbulatoryDischargePrescription_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargeSummary" DROP CONSTRAINT "AmbulatoryDischargeSummary_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargeSummary" DROP CONSTRAINT "AmbulatoryDischargeSummary_patientId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargeSummary" DROP CONSTRAINT "AmbulatoryDischargeSummary_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargeSummary" DROP CONSTRAINT "AmbulatoryDischargeSummary_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryDischargeSummary" DROP CONSTRAINT "AmbulatoryDischargeSummary_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryPreprocedureAssessment" DROP CONSTRAINT "AmbulatoryPreprocedureAssessment_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryPreprocedureAssessment" DROP CONSTRAINT "AmbulatoryPreprocedureAssessment_patientId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryPreprocedureAssessment" DROP CONSTRAINT "AmbulatoryPreprocedureAssessment_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryPreprocedureAssessment" DROP CONSTRAINT "AmbulatoryPreprocedureAssessment_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryPreprocedureAssessment" DROP CONSTRAINT "AmbulatoryPreprocedureAssessment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureDocument" DROP CONSTRAINT "AmbulatoryProcedureDocument_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureDocument" DROP CONSTRAINT "AmbulatoryProcedureDocument_patientId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureDocument" DROP CONSTRAINT "AmbulatoryProcedureDocument_preprocedureAssessmentId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureDocument" DROP CONSTRAINT "AmbulatoryProcedureDocument_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureDocument" DROP CONSTRAINT "AmbulatoryProcedureDocument_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureDocument" DROP CONSTRAINT "AmbulatoryProcedureDocument_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureSupportingDocument" DROP CONSTRAINT "AmbulatoryProcedureSupportingDocument_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureSupportingDocument" DROP CONSTRAINT "AmbulatoryProcedureSupportingDocument_patientId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureSupportingDocument" DROP CONSTRAINT "AmbulatoryProcedureSupportingDocument_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureSupportingDocument" DROP CONSTRAINT "AmbulatoryProcedureSupportingDocument_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryProcedureSupportingDocument" DROP CONSTRAINT "AmbulatoryProcedureSupportingDocument_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryRecoveryEvaluation" DROP CONSTRAINT "AmbulatoryRecoveryEvaluation_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryRecoveryEvaluation" DROP CONSTRAINT "AmbulatoryRecoveryEvaluation_patientId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryRecoveryEvaluation" DROP CONSTRAINT "AmbulatoryRecoveryEvaluation_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryRecoveryEvaluation" DROP CONSTRAINT "AmbulatoryRecoveryEvaluation_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "AmbulatoryRecoveryEvaluation" DROP CONSTRAINT "AmbulatoryRecoveryEvaluation_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyNursingSheet" DROP CONSTRAINT "EmergencyNursingSheet_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyNursingSheet" DROP CONSTRAINT "EmergencyNursingSheet_patientId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyNursingSheet" DROP CONSTRAINT "EmergencyNursingSheet_sectionRecordId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyNursingSheet" DROP CONSTRAINT "EmergencyNursingSheet_signerUserId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyNursingSheet" DROP CONSTRAINT "EmergencyNursingSheet_tenantId_fkey";

-- AlterTable
ALTER TABLE "EmergencyEvolutionDiagnosis" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmergencyEvolutionDiagnosticResult" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmergencyNursingMedicationAdministration" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmergencyNursingProcedure" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmergencyNursingSheet" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "IcdCatalogEntry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chapter" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IcdCatalogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationCatalogEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activeIngredient" TEXT,
    "presentation" TEXT,
    "defaultRoute" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationCatalogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IcdCatalogEntry_code_key" ON "IcdCatalogEntry"("code");

-- CreateIndex
CREATE INDEX "IcdCatalogEntry_description_idx" ON "IcdCatalogEntry"("description");

-- CreateIndex
CREATE INDEX "IcdCatalogEntry_isActive_idx" ON "IcdCatalogEntry"("isActive");

-- CreateIndex
CREATE INDEX "MedicationCatalogEntry_name_idx" ON "MedicationCatalogEntry"("name");

-- CreateIndex
CREATE INDEX "MedicationCatalogEntry_activeIngredient_idx" ON "MedicationCatalogEntry"("activeIngredient");

-- CreateIndex
CREATE INDEX "MedicationCatalogEntry_isActive_idx" ON "MedicationCatalogEntry"("isActive");

-- CreateIndex
CREATE INDEX "AmbulatoryProcedureSupportingDocument_sectionRecordId_idx" ON "AmbulatoryProcedureSupportingDocument"("sectionRecordId");

-- CreateIndex
CREATE INDEX "EmergencyNursingSheet_tenantId_idx" ON "EmergencyNursingSheet"("tenantId");

-- RenameForeignKey
ALTER TABLE "AmbulatoryProcedureCertificateDocument" RENAME CONSTRAINT "AmbulatoryProcedureCertificateDocument_supportingDocumentId_fke" TO "AmbulatoryProcedureCertificateDocument_supportingDocumentI_fkey";

-- RenameIndex
ALTER INDEX "AmbulatoryPreprocedureInformedConsent_anesthesiaConsentStatus_i" RENAME TO "AmbulatoryPreprocedureInformedConsent_anesthesiaConsentStat_idx";

-- RenameIndex
ALTER INDEX "AmbulatoryPreprocedurePreanestheticEvaluation_anesthesiaPlanned" RENAME TO "AmbulatoryPreprocedurePreanestheticEvaluation_anesthesiaPla_idx";

-- RenameIndex
ALTER INDEX "AmbulatoryPreprocedurePreanestheticEvaluation_anestheticRisk_id" RENAME TO "AmbulatoryPreprocedurePreanestheticEvaluation_anestheticRis_idx";

-- RenameIndex
ALTER INDEX "AmbulatoryPreprocedureRelevantHistory_assessmentId_conditionKey" RENAME TO "AmbulatoryPreprocedureRelevantHistory_assessmentId_conditio_key";

-- RenameIndex
ALTER INDEX "AmbulatoryPreprocedureRiskAssessment_capriniThromboembolicRisk_" RENAME TO "AmbulatoryPreprocedureRiskAssessment_capriniThromboembolicR_idx";

-- RenameIndex
ALTER INDEX "AmbulatoryProcedurePostanestheticNote_anesthesiologistLicense_i" RENAME TO "AmbulatoryProcedurePostanestheticNote_anesthesiologistLicen_idx";

-- RenameIndex
ALTER INDEX "AmbulatoryProcedureSupportingDocument_encounterId_documentType_" RENAME TO "AmbulatoryProcedureSupportingDocument_encounterId_documentT_key";

-- RenameIndex
ALTER INDEX "ConsultationHistoryPriorStudy_sourceModule_sourceReferenceId_id" RENAME TO "ConsultationHistoryPriorStudy_sourceModule_sourceReferenceI_idx";
