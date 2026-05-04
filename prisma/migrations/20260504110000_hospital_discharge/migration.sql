CREATE TABLE "HospitalDischarge" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "dischargeType" TEXT NOT NULL,
  "patientDestination" TEXT,
  "receivingUnit" TEXT,
  "dischargedAt" TIMESTAMP(3) NOT NULL,
  "admittedAt" TIMESTAMP(3),
  "stayDays" INTEGER,
  "dischargeCondition" TEXT NOT NULL,
  "admissionReason" TEXT,
  "admissionDiagnosis" TEXT,
  "finalDiagnosis" TEXT NOT NULL,
  "cie10" TEXT NOT NULL,
  "performedProcedures" TEXT,
  "managementPerformed" TEXT,
  "stayEvolution" TEXT,
  "pendingClinicalProblems" TEXT,
  "additionalNarrativeSummary" TEXT,
  "dischargeMedications" TEXT,
  "linkedPrescriptionId" TEXT,
  "prescriptionGenerated" TEXT,
  "prescriptionJustification" TEXT,
  "homeCare" TEXT,
  "diet" TEXT,
  "activityRestrictions" TEXT,
  "followUp" TEXT,
  "nextAppointmentDate" TIMESTAMP(3),
  "alarmSigns" TEXT NOT NULL,
  "patientEducation" TEXT,
  "patientComprehension" TEXT,
  "incapacityDays" INTEGER,
  "incapacityType" TEXT,
  "prognosis" TEXT NOT NULL,
  "responsiblePhysicianName" TEXT NOT NULL,
  "responsiblePhysicianLicense" TEXT NOT NULL,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "closedEncounterAt" TIMESTAMP(3),
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalDischarge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalDischarge_encounterId_key" ON "HospitalDischarge"("encounterId");
CREATE UNIQUE INDEX "HospitalDischarge_sectionRecordId_key" ON "HospitalDischarge"("sectionRecordId");
CREATE INDEX "HospitalDischarge_tenantId_idx" ON "HospitalDischarge"("tenantId");
CREATE INDEX "HospitalDischarge_patientId_idx" ON "HospitalDischarge"("patientId");
CREATE INDEX "HospitalDischarge_status_idx" ON "HospitalDischarge"("status");
CREATE INDEX "HospitalDischarge_dischargedAt_idx" ON "HospitalDischarge"("dischargedAt");
CREATE INDEX "HospitalDischarge_signedAt_idx" ON "HospitalDischarge"("signedAt");
CREATE INDEX "HospitalDischarge_signerUserId_idx" ON "HospitalDischarge"("signerUserId");

ALTER TABLE "HospitalDischarge" ADD CONSTRAINT "HospitalDischarge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDischarge" ADD CONSTRAINT "HospitalDischarge_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDischarge" ADD CONSTRAINT "HospitalDischarge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDischarge" ADD CONSTRAINT "HospitalDischarge_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDischarge" ADD CONSTRAINT "HospitalDischarge_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
