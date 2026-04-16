-- CreateTable
CREATE TABLE "public"."EncounterProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "encounterType" "public"."EncounterType" NOT NULL,
    "sectionsJson" JSONB NOT NULL,
    "alertsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncounterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EncounterProfile_encounterId_key" ON "public"."EncounterProfile"("encounterId");

-- CreateIndex
CREATE INDEX "EncounterProfile_tenantId_idx" ON "public"."EncounterProfile"("tenantId");

-- CreateIndex
CREATE INDEX "EncounterProfile_encounterType_idx" ON "public"."EncounterProfile"("encounterType");

-- AddForeignKey
ALTER TABLE "public"."EncounterProfile" ADD CONSTRAINT "EncounterProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EncounterProfile" ADD CONSTRAINT "EncounterProfile_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
