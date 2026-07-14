ALTER TABLE "EmergencyOrderSet"
ADD COLUMN "documentType" TEXT NOT NULL DEFAULT 'ORDEN_MEDICA',
ADD COLUMN "specialCareInstructions" TEXT,
ADD COLUMN "generalIndications" TEXT;

ALTER TABLE "EmergencyOrderTransfusion"
ADD COLUMN "otherBloodProductType" TEXT,
ADD COLUMN "units" INTEGER,
ADD COLUMN "adverseReactionOccurred" BOOLEAN,
ADD COLUMN "indicatedByName" TEXT,
ADD COLUMN "applyingStaffName" TEXT,
ADD COLUMN "applyingServiceName" TEXT,
ADD COLUMN "observations" TEXT;

UPDATE "EmergencyOrderSet"
SET "documentType" = 'HOJA_INDICACIONES'
WHERE "recordType" = 'Hoja de indicaciones';

CREATE INDEX "EmergencyOrderSet_documentType_idx" ON "EmergencyOrderSet"("documentType");
