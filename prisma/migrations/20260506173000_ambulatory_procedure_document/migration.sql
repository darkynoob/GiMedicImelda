CREATE TABLE "AmbulatoryProcedureDocument" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "preprocedureAssessmentId" TEXT,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "procedureDate" TIMESTAMP(3) NOT NULL,
  "realStartTime" TEXT NOT NULL,
  "realEndTime" TEXT NOT NULL,
  "durationMinutes" INTEGER,
  "operatingRoom" TEXT NOT NULL,
  "procedureCode" TEXT,
  "preoperativeDiagnosis" TEXT NOT NULL,
  "preoperativeCie10" TEXT NOT NULL,
  "postoperativeDiagnosis" TEXT NOT NULL,
  "postoperativeCie10" TEXT NOT NULL,
  "performedProcedure" TEXT NOT NULL,
  "anesthesiaType" TEXT NOT NULL,
  "anesthesiaMedications" TEXT,
  "anesthesiaEvents" TEXT,
  "anesthesiaAlerts" TEXT,
  "hasAnesthesia" BOOLEAN NOT NULL DEFAULT false,
  "surgicalTechnique" TEXT NOT NULL,
  "transoperativeFindings" TEXT NOT NULL,
  "woundClassification" TEXT NOT NULL,
  "estimatedBleedingMl" DECIMAL(10,2) NOT NULL,
  "ivFluids" TEXT,
  "transfusions" TEXT,
  "drainsPlaced" TEXT,
  "implantsDevices" TEXT,
  "lotsSeries" TEXT,
  "spongeInstrumentCount" TEXT NOT NULL,
  "surgicalSpecimenDescription" TEXT,
  "sentToPathology" TEXT,
  "pathologyFolio" TEXT,
  "hadComplications" TEXT NOT NULL,
  "openConversion" TEXT,
  "complicationType" TEXT,
  "complicationManagement" TEXT,
  "postprocedureDestination" TEXT NOT NULL,
  "requiresMonitoring" TEXT NOT NULL,
  "immediatePostprocedureIndications" TEXT NOT NULL,
  "destinationAlert" TEXT,
  "availableForDischarge" BOOLEAN NOT NULL DEFAULT false,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT NOT NULL,
  "professionalSpecialty" TEXT NOT NULL,
  "careLocation" TEXT NOT NULL,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "documentHash" TEXT NOT NULL,
  "digitalSeal" TEXT NOT NULL,
  "pdfGeneratedAt" TIMESTAMP(3),
  "pdfFileName" TEXT,
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryProcedureTeamMember" (
  "id" TEXT NOT NULL,
  "procedureDocumentId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryProcedureTimeOutChecklist" (
  "id" TEXT NOT NULL,
  "procedureDocumentId" TEXT NOT NULL,
  "patientVerified" BOOLEAN NOT NULL DEFAULT false,
  "procedureConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "surgicalSiteConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "timeOutBeforeIncision" BOOLEAN NOT NULL DEFAULT false,
  "antibioticProphylaxisAdministered" BOOLEAN NOT NULL DEFAULT false,
  "equipmentInstrumentalVerified" BOOLEAN NOT NULL DEFAULT false,
  "informedConsentVerified" BOOLEAN NOT NULL DEFAULT false,
  "imagingAvailableInRoom" BOOLEAN NOT NULL DEFAULT false,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureTimeOutChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryProcedureMaterial" (
  "id" TEXT NOT NULL,
  "procedureDocumentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" TEXT,
  "lotSerial" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureMaterial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryProcedurePostanestheticNote" (
  "id" TEXT NOT NULL,
  "procedureDocumentId" TEXT NOT NULL,
  "anestheticMedicationsUsed" TEXT NOT NULL,
  "anesthesiaDuration" TEXT NOT NULL,
  "bloodApplied" TEXT,
  "solutionsApplied" TEXT NOT NULL,
  "anesthesiaIncidents" TEXT NOT NULL,
  "clinicalStatusAtRoomDischarge" TEXT NOT NULL,
  "postanestheticManagementPlan" TEXT NOT NULL,
  "anesthesiologistName" TEXT NOT NULL,
  "anesthesiologistLicense" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedurePostanestheticNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbulatoryProcedureDocument_sectionRecordId_key" ON "AmbulatoryProcedureDocument"("sectionRecordId");
CREATE INDEX "AmbulatoryProcedureDocument_tenantId_idx" ON "AmbulatoryProcedureDocument"("tenantId");
CREATE INDEX "AmbulatoryProcedureDocument_encounterId_idx" ON "AmbulatoryProcedureDocument"("encounterId");
CREATE INDEX "AmbulatoryProcedureDocument_patientId_idx" ON "AmbulatoryProcedureDocument"("patientId");
CREATE INDEX "AmbulatoryProcedureDocument_sectionRecordId_idx" ON "AmbulatoryProcedureDocument"("sectionRecordId");
CREATE INDEX "AmbulatoryProcedureDocument_preprocedureAssessmentId_idx" ON "AmbulatoryProcedureDocument"("preprocedureAssessmentId");
CREATE INDEX "AmbulatoryProcedureDocument_status_idx" ON "AmbulatoryProcedureDocument"("status");
CREATE INDEX "AmbulatoryProcedureDocument_recordedAt_idx" ON "AmbulatoryProcedureDocument"("recordedAt");
CREATE INDEX "AmbulatoryProcedureDocument_signedAt_idx" ON "AmbulatoryProcedureDocument"("signedAt");
CREATE INDEX "AmbulatoryProcedureDocument_procedureCode_idx" ON "AmbulatoryProcedureDocument"("procedureCode");
CREATE INDEX "AmbulatoryProcedureDocument_preoperativeCie10_idx" ON "AmbulatoryProcedureDocument"("preoperativeCie10");
CREATE INDEX "AmbulatoryProcedureDocument_postoperativeCie10_idx" ON "AmbulatoryProcedureDocument"("postoperativeCie10");
CREATE INDEX "AmbulatoryProcedureDocument_documentHash_idx" ON "AmbulatoryProcedureDocument"("documentHash");

CREATE UNIQUE INDEX "AmbulatoryProcedureTeamMember_procedureDocumentId_role_key" ON "AmbulatoryProcedureTeamMember"("procedureDocumentId", "role");
CREATE INDEX "AmbulatoryProcedureTeamMember_role_idx" ON "AmbulatoryProcedureTeamMember"("role");
CREATE INDEX "AmbulatoryProcedureTeamMember_userId_idx" ON "AmbulatoryProcedureTeamMember"("userId");

CREATE UNIQUE INDEX "AmbulatoryProcedureTimeOutChecklist_procedureDocumentId_key" ON "AmbulatoryProcedureTimeOutChecklist"("procedureDocumentId");
CREATE INDEX "AmbulatoryProcedureTimeOutChecklist_completed_idx" ON "AmbulatoryProcedureTimeOutChecklist"("completed");

CREATE INDEX "AmbulatoryProcedureMaterial_procedureDocumentId_idx" ON "AmbulatoryProcedureMaterial"("procedureDocumentId");
CREATE INDEX "AmbulatoryProcedureMaterial_name_idx" ON "AmbulatoryProcedureMaterial"("name");
CREATE INDEX "AmbulatoryProcedureMaterial_lotSerial_idx" ON "AmbulatoryProcedureMaterial"("lotSerial");

CREATE UNIQUE INDEX "AmbulatoryProcedurePostanestheticNote_procedureDocumentId_key" ON "AmbulatoryProcedurePostanestheticNote"("procedureDocumentId");
CREATE INDEX "AmbulatoryProcedurePostanestheticNote_anesthesiologistName_idx" ON "AmbulatoryProcedurePostanestheticNote"("anesthesiologistName");
CREATE INDEX "AmbulatoryProcedurePostanestheticNote_anesthesiologistLicense_idx" ON "AmbulatoryProcedurePostanestheticNote"("anesthesiologistLicense");

ALTER TABLE "AmbulatoryProcedureDocument" ADD CONSTRAINT "AmbulatoryProcedureDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureDocument" ADD CONSTRAINT "AmbulatoryProcedureDocument_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureDocument" ADD CONSTRAINT "AmbulatoryProcedureDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureDocument" ADD CONSTRAINT "AmbulatoryProcedureDocument_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureDocument" ADD CONSTRAINT "AmbulatoryProcedureDocument_preprocedureAssessmentId_fkey" FOREIGN KEY ("preprocedureAssessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureDocument" ADD CONSTRAINT "AmbulatoryProcedureDocument_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AmbulatoryProcedureTeamMember" ADD CONSTRAINT "AmbulatoryProcedureTeamMember_procedureDocumentId_fkey" FOREIGN KEY ("procedureDocumentId") REFERENCES "AmbulatoryProcedureDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureTimeOutChecklist" ADD CONSTRAINT "AmbulatoryProcedureTimeOutChecklist_procedureDocumentId_fkey" FOREIGN KEY ("procedureDocumentId") REFERENCES "AmbulatoryProcedureDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedureMaterial" ADD CONSTRAINT "AmbulatoryProcedureMaterial_procedureDocumentId_fkey" FOREIGN KEY ("procedureDocumentId") REFERENCES "AmbulatoryProcedureDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryProcedurePostanestheticNote" ADD CONSTRAINT "AmbulatoryProcedurePostanestheticNote_procedureDocumentId_fkey" FOREIGN KEY ("procedureDocumentId") REFERENCES "AmbulatoryProcedureDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
