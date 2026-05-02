-- Normaliza Órdenes / Indicaciones de Urgencias para ejecución operativa,
-- trazabilidad multiequipo y auditoría clínica NOM-004.
CREATE TABLE "EmergencyOrderSet" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "recordType" TEXT NOT NULL DEFAULT 'Órdenes e indicaciones',
  "monitoringInstructions" TEXT,
  "oxygenType" TEXT,
  "oxygenFlow" TEXT,
  "oxygenTarget" TEXT,
  "diet" TEXT,
  "rest" TEXT,
  "fluidControl" TEXT,
  "allergyAlert" TEXT,
  "therapeuticDuplicationAlert" TEXT,
  "safeDoseAlert" TEXT,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyOrderSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyOrderMedication" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderSetId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "dose" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "indication" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyOrderMedication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyOrderIntravenousSolution" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderSetId" TEXT NOT NULL,
  "solutionType" TEXT,
  "volume" DECIMAL(10,2),
  "rate" TEXT,
  "duration" TEXT,
  "addedMedication" TEXT,
  "instructions" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyOrderIntravenousSolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyOrderRequestedStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderSetId" TEXT NOT NULL,
  "studyType" TEXT NOT NULL,
  "studyName" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "justification" TEXT,
  "frequency" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyOrderRequestedStudy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyOrderTrace" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderSetId" TEXT NOT NULL,
  "orderLabel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "responsibleName" TEXT,
  "executedAt" TIMESTAMP(3),
  "area" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyOrderTrace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyOrderTransfusion" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderSetId" TEXT NOT NULL,
  "bloodProductType" TEXT,
  "volume" DECIMAL(10,2),
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "adverseReactions" TEXT,
  "responsibleName" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyOrderTransfusion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyOrderSet_sectionRecordId_key" ON "EmergencyOrderSet"("sectionRecordId");
CREATE INDEX "EmergencyOrderSet_tenantId_idx" ON "EmergencyOrderSet"("tenantId");
CREATE INDEX "EmergencyOrderSet_encounterId_idx" ON "EmergencyOrderSet"("encounterId");
CREATE INDEX "EmergencyOrderSet_patientId_idx" ON "EmergencyOrderSet"("patientId");
CREATE INDEX "EmergencyOrderSet_status_idx" ON "EmergencyOrderSet"("status");
CREATE INDEX "EmergencyOrderSet_recordedAt_idx" ON "EmergencyOrderSet"("recordedAt");
CREATE INDEX "EmergencyOrderSet_signerUserId_idx" ON "EmergencyOrderSet"("signerUserId");

CREATE INDEX "EmergencyOrderMedication_tenantId_idx" ON "EmergencyOrderMedication"("tenantId");
CREATE INDEX "EmergencyOrderMedication_orderSetId_idx" ON "EmergencyOrderMedication"("orderSetId");
CREATE INDEX "EmergencyOrderMedication_medicationName_idx" ON "EmergencyOrderMedication"("medicationName");

CREATE INDEX "EmergencyOrderIntravenousSolution_tenantId_idx" ON "EmergencyOrderIntravenousSolution"("tenantId");
CREATE INDEX "EmergencyOrderIntravenousSolution_orderSetId_idx" ON "EmergencyOrderIntravenousSolution"("orderSetId");

CREATE INDEX "EmergencyOrderRequestedStudy_tenantId_idx" ON "EmergencyOrderRequestedStudy"("tenantId");
CREATE INDEX "EmergencyOrderRequestedStudy_orderSetId_idx" ON "EmergencyOrderRequestedStudy"("orderSetId");
CREATE INDEX "EmergencyOrderRequestedStudy_studyType_idx" ON "EmergencyOrderRequestedStudy"("studyType");
CREATE INDEX "EmergencyOrderRequestedStudy_status_idx" ON "EmergencyOrderRequestedStudy"("status");

CREATE INDEX "EmergencyOrderTrace_tenantId_idx" ON "EmergencyOrderTrace"("tenantId");
CREATE INDEX "EmergencyOrderTrace_orderSetId_idx" ON "EmergencyOrderTrace"("orderSetId");
CREATE INDEX "EmergencyOrderTrace_status_idx" ON "EmergencyOrderTrace"("status");
CREATE INDEX "EmergencyOrderTrace_area_idx" ON "EmergencyOrderTrace"("area");

CREATE INDEX "EmergencyOrderTransfusion_tenantId_idx" ON "EmergencyOrderTransfusion"("tenantId");
CREATE INDEX "EmergencyOrderTransfusion_orderSetId_idx" ON "EmergencyOrderTransfusion"("orderSetId");

ALTER TABLE "EmergencyOrderSet" ADD CONSTRAINT "EmergencyOrderSet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderSet" ADD CONSTRAINT "EmergencyOrderSet_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderSet" ADD CONSTRAINT "EmergencyOrderSet_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderSet" ADD CONSTRAINT "EmergencyOrderSet_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderSet" ADD CONSTRAINT "EmergencyOrderSet_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmergencyOrderMedication" ADD CONSTRAINT "EmergencyOrderMedication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderMedication" ADD CONSTRAINT "EmergencyOrderMedication_orderSetId_fkey" FOREIGN KEY ("orderSetId") REFERENCES "EmergencyOrderSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyOrderIntravenousSolution" ADD CONSTRAINT "EmergencyOrderIntravenousSolution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderIntravenousSolution" ADD CONSTRAINT "EmergencyOrderIntravenousSolution_orderSetId_fkey" FOREIGN KEY ("orderSetId") REFERENCES "EmergencyOrderSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyOrderRequestedStudy" ADD CONSTRAINT "EmergencyOrderRequestedStudy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderRequestedStudy" ADD CONSTRAINT "EmergencyOrderRequestedStudy_orderSetId_fkey" FOREIGN KEY ("orderSetId") REFERENCES "EmergencyOrderSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyOrderTrace" ADD CONSTRAINT "EmergencyOrderTrace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderTrace" ADD CONSTRAINT "EmergencyOrderTrace_orderSetId_fkey" FOREIGN KEY ("orderSetId") REFERENCES "EmergencyOrderSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyOrderTransfusion" ADD CONSTRAINT "EmergencyOrderTransfusion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyOrderTransfusion" ADD CONSTRAINT "EmergencyOrderTransfusion_orderSetId_fkey" FOREIGN KEY ("orderSetId") REFERENCES "EmergencyOrderSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
