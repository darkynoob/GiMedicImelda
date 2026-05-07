CREATE TABLE "AmbulatoryDischargeSummary" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sectionRecordId" TEXT NOT NULL,
    "linkedPrescriptionId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "dischargeType" TEXT,
    "destination" TEXT,
    "dischargeDate" TIMESTAMP(3),
    "dischargeTime" TEXT,
    "finalDiagnosis" TEXT,
    "finalCie10" TEXT,
    "dischargeCondition" TEXT,
    "clinicalStatusAtDischarge" TEXT,
    "prognosis" TEXT,
    "procedureReason" TEXT,
    "performedProcedure" TEXT,
    "recoveryEvolution" TEXT,
    "statusSummaryAtDischarge" TEXT,
    "linkedPrescriptionPlan" TEXT,
    "linkedMedications" TEXT,
    "linkedPrescriptionFolio" TEXT,
    "followUp" TEXT,
    "disabilityDays" INTEGER,
    "disabilityType" TEXT,
    "patientEducation" TEXT,
    "patientUnderstands" BOOLEAN NOT NULL DEFAULT false,
    "companionInformed" BOOLEAN NOT NULL DEFAULT false,
    "responsiblePhysician" TEXT NOT NULL,
    "responsiblePhysicianLicense" TEXT NOT NULL,
    "professionalName" TEXT NOT NULL,
    "professionalLicense" TEXT NOT NULL,
    "professionalSpecialty" TEXT NOT NULL,
    "careLocation" TEXT NOT NULL,
    "closureWarning" TEXT,
    "signerUserId" TEXT,
    "signedAt" TIMESTAMP(3),
    "closedEncounterAt" TIMESTAMP(3),
    "documentHash" TEXT NOT NULL,
    "digitalSeal" TEXT NOT NULL,
    "pdfGeneratedAt" TIMESTAMP(3),
    "pdfFileName" TEXT,
    "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "pdfLastDownloadedAt" TIMESTAMP(3),
    "contentJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmbulatoryDischargeSummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryDischargeVitalSnapshot" (
    "id" TEXT NOT NULL,
    "dischargeSummaryId" TEXT NOT NULL,
    "bloodPressure" TEXT,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "temperatureC" DECIMAL(4,1),
    "oxygenSaturation" DECIMAL(5,2),
    "capillaryGlucose" DECIMAL(8,2),
    "painEva" INTEGER,
    "aldreteScore" INTEGER,
    "prognosis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmbulatoryDischargeVitalSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryDischargeCriteria" (
    "id" TEXT NOT NULL,
    "dischargeSummaryId" TEXT NOT NULL,
    "stableVitalsOneHour" BOOLEAN NOT NULL DEFAULT false,
    "controlledPain" BOOLEAN NOT NULL DEFAULT false,
    "oralTolerance" BOOLEAN NOT NULL DEFAULT false,
    "independentAmbulation" BOOLEAN NOT NULL DEFAULT false,
    "spontaneousUrination" BOOLEAN NOT NULL DEFAULT false,
    "woundsWithoutBleeding" BOOLEAN NOT NULL DEFAULT false,
    "aldreteAtLeastNine" BOOLEAN NOT NULL DEFAULT false,
    "responsibleCompanion" BOOLEAN NOT NULL DEFAULT false,
    "writtenInstructionsDelivered" BOOLEAN NOT NULL DEFAULT false,
    "prescriptionDelivered" BOOLEAN NOT NULL DEFAULT false,
    "meetsCriteria" TEXT,
    "finalAldrete" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmbulatoryDischargeCriteria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryDischargeTransferReference" (
    "id" TEXT NOT NULL,
    "dischargeSummaryId" TEXT NOT NULL,
    "referenceDateTime" TIMESTAMP(3),
    "referralReason" TEXT,
    "clinicalSummary" TEXT,
    "physicalExam" TEXT,
    "studyResults" TEXT,
    "diagnoses" TEXT,
    "previousTreatmentPlan" TEXT,
    "prognosis" TEXT,
    "sendingFacility" TEXT,
    "receivingFacility" TEXT,
    "receivingPhysician" TEXT,
    "transportMethod" TEXT,
    "transportConditions" TEXT,
    "transferVitalSigns" TEXT,
    "issuingPhysician" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmbulatoryDischargeTransferReference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbulatoryDischargeSummary_sectionRecordId_key" ON "AmbulatoryDischargeSummary"("sectionRecordId");
CREATE INDEX "AmbulatoryDischargeSummary_tenantId_idx" ON "AmbulatoryDischargeSummary"("tenantId");
CREATE INDEX "AmbulatoryDischargeSummary_encounterId_idx" ON "AmbulatoryDischargeSummary"("encounterId");
CREATE INDEX "AmbulatoryDischargeSummary_patientId_idx" ON "AmbulatoryDischargeSummary"("patientId");
CREATE INDEX "AmbulatoryDischargeSummary_sectionRecordId_idx" ON "AmbulatoryDischargeSummary"("sectionRecordId");
CREATE INDEX "AmbulatoryDischargeSummary_linkedPrescriptionId_idx" ON "AmbulatoryDischargeSummary"("linkedPrescriptionId");
CREATE INDEX "AmbulatoryDischargeSummary_status_idx" ON "AmbulatoryDischargeSummary"("status");
CREATE INDEX "AmbulatoryDischargeSummary_recordedAt_idx" ON "AmbulatoryDischargeSummary"("recordedAt");
CREATE INDEX "AmbulatoryDischargeSummary_signedAt_idx" ON "AmbulatoryDischargeSummary"("signedAt");
CREATE INDEX "AmbulatoryDischargeSummary_closedEncounterAt_idx" ON "AmbulatoryDischargeSummary"("closedEncounterAt");
CREATE INDEX "AmbulatoryDischargeSummary_finalCie10_idx" ON "AmbulatoryDischargeSummary"("finalCie10");
CREATE INDEX "AmbulatoryDischargeSummary_documentHash_idx" ON "AmbulatoryDischargeSummary"("documentHash");
CREATE UNIQUE INDEX "AmbulatoryDischargeVitalSnapshot_dischargeSummaryId_key" ON "AmbulatoryDischargeVitalSnapshot"("dischargeSummaryId");
CREATE INDEX "AmbulatoryDischargeVitalSnapshot_aldreteScore_idx" ON "AmbulatoryDischargeVitalSnapshot"("aldreteScore");
CREATE INDEX "AmbulatoryDischargeVitalSnapshot_oxygenSaturation_idx" ON "AmbulatoryDischargeVitalSnapshot"("oxygenSaturation");
CREATE UNIQUE INDEX "AmbulatoryDischargeCriteria_dischargeSummaryId_key" ON "AmbulatoryDischargeCriteria"("dischargeSummaryId");
CREATE INDEX "AmbulatoryDischargeCriteria_completed_idx" ON "AmbulatoryDischargeCriteria"("completed");
CREATE INDEX "AmbulatoryDischargeCriteria_finalAldrete_idx" ON "AmbulatoryDischargeCriteria"("finalAldrete");
CREATE UNIQUE INDEX "AmbulatoryDischargeTransferReference_dischargeSummaryId_key" ON "AmbulatoryDischargeTransferReference"("dischargeSummaryId");
CREATE INDEX "AmbulatoryDischargeTransferReference_referenceDateTime_idx" ON "AmbulatoryDischargeTransferReference"("referenceDateTime");
CREATE INDEX "AmbulatoryDischargeTransferReference_receivingFacility_idx" ON "AmbulatoryDischargeTransferReference"("receivingFacility");

ALTER TABLE "AmbulatoryDischargeSummary" ADD CONSTRAINT "AmbulatoryDischargeSummary_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeSummary" ADD CONSTRAINT "AmbulatoryDischargeSummary_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeSummary" ADD CONSTRAINT "AmbulatoryDischargeSummary_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeSummary" ADD CONSTRAINT "AmbulatoryDischargeSummary_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeSummary" ADD CONSTRAINT "AmbulatoryDischargeSummary_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeVitalSnapshot" ADD CONSTRAINT "AmbulatoryDischargeVitalSnapshot_dischargeSummaryId_fkey" FOREIGN KEY ("dischargeSummaryId") REFERENCES "AmbulatoryDischargeSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeCriteria" ADD CONSTRAINT "AmbulatoryDischargeCriteria_dischargeSummaryId_fkey" FOREIGN KEY ("dischargeSummaryId") REFERENCES "AmbulatoryDischargeSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryDischargeTransferReference" ADD CONSTRAINT "AmbulatoryDischargeTransferReference_dischargeSummaryId_fkey" FOREIGN KEY ("dischargeSummaryId") REFERENCES "AmbulatoryDischargeSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
