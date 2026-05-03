CREATE TABLE "HospitalMedicalOrder" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "diet" TEXT,
  "restActivity" TEXT,
  "position" TEXT,
  "generalCare" TEXT,
  "nursingMonitoring" TEXT,
  "oxygen" TEXT,
  "fluidControl" TEXT,
  "indicationsStartTime" TEXT,
  "nextShiftSchedule" TEXT,
  "executorUserLabel" TEXT,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalMedicalOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalOrderMedication" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "dose" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "priority" TEXT,
  "frequency" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "indication" TEXT,
  "pharmacyStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalOrderMedication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalOrderIntravenousSolution" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "solutionType" TEXT NOT NULL,
  "volumeMl" DECIMAL(10,2) NOT NULL,
  "rateMlHour" DECIMAL(10,2),
  "duration" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalOrderIntravenousSolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalOrderRequestedStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "studyType" TEXT NOT NULL,
  "priority" TEXT,
  "indication" TEXT,
  "systemStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "targetModule" TEXT,
  "linkedRequestId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalOrderRequestedStudy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalOrderConsultationRequest" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "reason" TEXT,
  "priority" TEXT,
  "systemStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "linkedConsultationId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalOrderConsultationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalOrderTrace" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderLabel" TEXT NOT NULL,
  "responsibleArea" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "executorUserLabel" TEXT,
  "executionTime" TIMESTAMP(3),
  "sourceType" TEXT NOT NULL,
  "sourceIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalOrderTrace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalMedicalOrder_sectionRecordId_key" ON "HospitalMedicalOrder"("sectionRecordId");
CREATE UNIQUE INDEX "HospitalMedicalOrder_encounterId_versionNumber_key" ON "HospitalMedicalOrder"("encounterId", "versionNumber");
CREATE INDEX "HospitalMedicalOrder_tenantId_idx" ON "HospitalMedicalOrder"("tenantId");
CREATE INDEX "HospitalMedicalOrder_encounterId_idx" ON "HospitalMedicalOrder"("encounterId");
CREATE INDEX "HospitalMedicalOrder_patientId_idx" ON "HospitalMedicalOrder"("patientId");
CREATE INDEX "HospitalMedicalOrder_status_idx" ON "HospitalMedicalOrder"("status");
CREATE INDEX "HospitalMedicalOrder_recordedAt_idx" ON "HospitalMedicalOrder"("recordedAt");
CREATE INDEX "HospitalMedicalOrder_signerUserId_idx" ON "HospitalMedicalOrder"("signerUserId");

CREATE INDEX "HospitalOrderMedication_tenantId_idx" ON "HospitalOrderMedication"("tenantId");
CREATE INDEX "HospitalOrderMedication_encounterId_idx" ON "HospitalOrderMedication"("encounterId");
CREATE INDEX "HospitalOrderMedication_patientId_idx" ON "HospitalOrderMedication"("patientId");
CREATE INDEX "HospitalOrderMedication_orderId_idx" ON "HospitalOrderMedication"("orderId");
CREATE INDEX "HospitalOrderMedication_medicationName_idx" ON "HospitalOrderMedication"("medicationName");
CREATE INDEX "HospitalOrderMedication_pharmacyStatus_idx" ON "HospitalOrderMedication"("pharmacyStatus");

CREATE INDEX "HospitalOrderIntravenousSolution_tenantId_idx" ON "HospitalOrderIntravenousSolution"("tenantId");
CREATE INDEX "HospitalOrderIntravenousSolution_encounterId_idx" ON "HospitalOrderIntravenousSolution"("encounterId");
CREATE INDEX "HospitalOrderIntravenousSolution_patientId_idx" ON "HospitalOrderIntravenousSolution"("patientId");
CREATE INDEX "HospitalOrderIntravenousSolution_orderId_idx" ON "HospitalOrderIntravenousSolution"("orderId");
CREATE INDEX "HospitalOrderIntravenousSolution_solutionType_idx" ON "HospitalOrderIntravenousSolution"("solutionType");

CREATE INDEX "HospitalOrderRequestedStudy_tenantId_idx" ON "HospitalOrderRequestedStudy"("tenantId");
CREATE INDEX "HospitalOrderRequestedStudy_encounterId_idx" ON "HospitalOrderRequestedStudy"("encounterId");
CREATE INDEX "HospitalOrderRequestedStudy_patientId_idx" ON "HospitalOrderRequestedStudy"("patientId");
CREATE INDEX "HospitalOrderRequestedStudy_orderId_idx" ON "HospitalOrderRequestedStudy"("orderId");
CREATE INDEX "HospitalOrderRequestedStudy_studyType_idx" ON "HospitalOrderRequestedStudy"("studyType");
CREATE INDEX "HospitalOrderRequestedStudy_systemStatus_idx" ON "HospitalOrderRequestedStudy"("systemStatus");
CREATE INDEX "HospitalOrderRequestedStudy_targetModule_idx" ON "HospitalOrderRequestedStudy"("targetModule");
CREATE INDEX "HospitalOrderRequestedStudy_linkedRequestId_idx" ON "HospitalOrderRequestedStudy"("linkedRequestId");

CREATE INDEX "HospitalOrderConsultationRequest_tenantId_idx" ON "HospitalOrderConsultationRequest"("tenantId");
CREATE INDEX "HospitalOrderConsultationRequest_encounterId_idx" ON "HospitalOrderConsultationRequest"("encounterId");
CREATE INDEX "HospitalOrderConsultationRequest_patientId_idx" ON "HospitalOrderConsultationRequest"("patientId");
CREATE INDEX "HospitalOrderConsultationRequest_orderId_idx" ON "HospitalOrderConsultationRequest"("orderId");
CREATE INDEX "HospitalOrderConsultationRequest_serviceName_idx" ON "HospitalOrderConsultationRequest"("serviceName");
CREATE INDEX "HospitalOrderConsultationRequest_systemStatus_idx" ON "HospitalOrderConsultationRequest"("systemStatus");
CREATE INDEX "HospitalOrderConsultationRequest_linkedConsultationId_idx" ON "HospitalOrderConsultationRequest"("linkedConsultationId");

CREATE INDEX "HospitalOrderTrace_tenantId_idx" ON "HospitalOrderTrace"("tenantId");
CREATE INDEX "HospitalOrderTrace_encounterId_idx" ON "HospitalOrderTrace"("encounterId");
CREATE INDEX "HospitalOrderTrace_patientId_idx" ON "HospitalOrderTrace"("patientId");
CREATE INDEX "HospitalOrderTrace_orderId_idx" ON "HospitalOrderTrace"("orderId");
CREATE INDEX "HospitalOrderTrace_responsibleArea_idx" ON "HospitalOrderTrace"("responsibleArea");
CREATE INDEX "HospitalOrderTrace_status_idx" ON "HospitalOrderTrace"("status");
CREATE INDEX "HospitalOrderTrace_sourceType_idx" ON "HospitalOrderTrace"("sourceType");

ALTER TABLE "HospitalMedicalOrder" ADD CONSTRAINT "HospitalMedicalOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicalOrder" ADD CONSTRAINT "HospitalMedicalOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicalOrder" ADD CONSTRAINT "HospitalMedicalOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicalOrder" ADD CONSTRAINT "HospitalMedicalOrder_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalMedicalOrder" ADD CONSTRAINT "HospitalMedicalOrder_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalOrderMedication" ADD CONSTRAINT "HospitalOrderMedication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderMedication" ADD CONSTRAINT "HospitalOrderMedication_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderMedication" ADD CONSTRAINT "HospitalOrderMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderMedication" ADD CONSTRAINT "HospitalOrderMedication_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HospitalMedicalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalOrderIntravenousSolution" ADD CONSTRAINT "HospitalOrderIntravenousSolution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderIntravenousSolution" ADD CONSTRAINT "HospitalOrderIntravenousSolution_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderIntravenousSolution" ADD CONSTRAINT "HospitalOrderIntravenousSolution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderIntravenousSolution" ADD CONSTRAINT "HospitalOrderIntravenousSolution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HospitalMedicalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalOrderRequestedStudy" ADD CONSTRAINT "HospitalOrderRequestedStudy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderRequestedStudy" ADD CONSTRAINT "HospitalOrderRequestedStudy_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderRequestedStudy" ADD CONSTRAINT "HospitalOrderRequestedStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderRequestedStudy" ADD CONSTRAINT "HospitalOrderRequestedStudy_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HospitalMedicalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalOrderConsultationRequest" ADD CONSTRAINT "HospitalOrderConsultationRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderConsultationRequest" ADD CONSTRAINT "HospitalOrderConsultationRequest_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderConsultationRequest" ADD CONSTRAINT "HospitalOrderConsultationRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderConsultationRequest" ADD CONSTRAINT "HospitalOrderConsultationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HospitalMedicalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalOrderTrace" ADD CONSTRAINT "HospitalOrderTrace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderTrace" ADD CONSTRAINT "HospitalOrderTrace_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderTrace" ADD CONSTRAINT "HospitalOrderTrace_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalOrderTrace" ADD CONSTRAINT "HospitalOrderTrace_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HospitalMedicalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
