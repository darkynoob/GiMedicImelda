-- Documento único de egreso de Urgencias. La restricción UNIQUE sobre encounterId
-- impide múltiples egresos activos/finales para el mismo episodio.
CREATE TABLE "EmergencyDischarge" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "dischargeType" TEXT,
  "destination" TEXT,
  "receivingService" TEXT,
  "receivingPhysician" TEXT,
  "dischargedAt" TIMESTAMP(3),
  "admissionReason" TEXT,
  "dischargeDiagnosis" TEXT,
  "cie10" TEXT,
  "emergencyManagement" TEXT,
  "performedProcedures" TEXT,
  "stayEvolution" TEXT,
  "dischargeCondition" TEXT,
  "dischargeMedications" TEXT,
  "generalCare" TEXT,
  "specificCare" TEXT,
  "diet" TEXT,
  "physicalActivity" TEXT,
  "followUp" TEXT,
  "alarmSigns" TEXT,
  "linkedPrescription" TEXT,
  "prescriptionJustification" TEXT,
  "incapacityGranted" TEXT,
  "incapacityDays" INTEGER,
  "incapacityType" TEXT,
  "patientEducation" TEXT,
  "patientComprehension" TEXT,
  "transferOriginUnit" TEXT,
  "transferDestinationUnit" TEXT,
  "transferVitalSigns" TEXT,
  "transferClinicalSummary" TEXT,
  "transferDiagnosis" TEXT,
  "transferPreviousTreatment" TEXT,
  "transferConditions" TEXT,
  "transferReceivingPhysician" TEXT,
  "consentProcedure" TEXT,
  "consentRisks" TEXT,
  "consentBenefits" TEXT,
  "consentAuthorization" TEXT,
  "consentSignatures" TEXT,
  "publicMinistryNotice" TEXT,
  "deathCertificateData" TEXT,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "closedEncounterAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyDischarge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyDischarge_encounterId_key" ON "EmergencyDischarge"("encounterId");
CREATE UNIQUE INDEX "EmergencyDischarge_sectionRecordId_key" ON "EmergencyDischarge"("sectionRecordId");
CREATE INDEX "EmergencyDischarge_tenantId_idx" ON "EmergencyDischarge"("tenantId");
CREATE INDEX "EmergencyDischarge_patientId_idx" ON "EmergencyDischarge"("patientId");
CREATE INDEX "EmergencyDischarge_status_idx" ON "EmergencyDischarge"("status");
CREATE INDEX "EmergencyDischarge_recordedAt_idx" ON "EmergencyDischarge"("recordedAt");
CREATE INDEX "EmergencyDischarge_dischargeType_idx" ON "EmergencyDischarge"("dischargeType");
CREATE INDEX "EmergencyDischarge_signerUserId_idx" ON "EmergencyDischarge"("signerUserId");

ALTER TABLE "EmergencyDischarge" ADD CONSTRAINT "EmergencyDischarge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDischarge" ADD CONSTRAINT "EmergencyDischarge_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDischarge" ADD CONSTRAINT "EmergencyDischarge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDischarge" ADD CONSTRAINT "EmergencyDischarge_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyDischarge" ADD CONSTRAINT "EmergencyDischarge_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
