-- CreateEnum
CREATE TYPE "public"."EncounterRecordStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'SIGNED');

-- CreateTable
CREATE TABLE "public"."EncounterSectionRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterType" "public"."EncounterType" NOT NULL,
    "tabKey" TEXT NOT NULL,
    "noteType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authoredByUserId" TEXT,
    "formDataJson" JSONB NOT NULL,
    "metadataJson" JSONB,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncounterSectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_tenantId_idx" ON "public"."EncounterSectionRecord"("tenantId");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_encounterId_idx" ON "public"."EncounterSectionRecord"("encounterId");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_patientId_idx" ON "public"."EncounterSectionRecord"("patientId");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_encounterType_idx" ON "public"."EncounterSectionRecord"("encounterType");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_tabKey_idx" ON "public"."EncounterSectionRecord"("tabKey");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_status_idx" ON "public"."EncounterSectionRecord"("status");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_recordedAt_idx" ON "public"."EncounterSectionRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "EncounterSectionRecord_authoredByUserId_idx" ON "public"."EncounterSectionRecord"("authoredByUserId");

-- AddForeignKey
ALTER TABLE "public"."EncounterSectionRecord" ADD CONSTRAINT "EncounterSectionRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EncounterSectionRecord" ADD CONSTRAINT "EncounterSectionRecord_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EncounterSectionRecord" ADD CONSTRAINT "EncounterSectionRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EncounterSectionRecord" ADD CONSTRAINT "EncounterSectionRecord_authoredByUserId_fkey" FOREIGN KEY ("authoredByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
