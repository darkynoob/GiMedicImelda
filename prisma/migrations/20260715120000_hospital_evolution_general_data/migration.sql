ALTER TABLE "HospitalEvolution"
  ADD COLUMN "hospitalStayDay" INTEGER,
  ADD COLUMN "hospitalStayDayManuallyAdjusted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "clinicalStatus" TEXT,
  ADD COLUMN "shift" TEXT,
  ADD COLUMN "previousEvolutionRecordedAt" TIMESTAMP(3),
  ADD COLUMN "previousEvolutionLabel" TEXT,
  ADD COLUMN "responsibleSpecialtyId" TEXT,
  ADD COLUMN "responsibleServiceAreaId" TEXT,
  ADD COLUMN "responsibleSpecialtySnapshot" TEXT;

CREATE INDEX "HospitalEvolution_responsibleSpecialtyId_idx" ON "HospitalEvolution"("responsibleSpecialtyId");
CREATE INDEX "HospitalEvolution_responsibleServiceAreaId_idx" ON "HospitalEvolution"("responsibleServiceAreaId");
CREATE INDEX "HospitalEvolution_clinicalStatus_idx" ON "HospitalEvolution"("clinicalStatus");
CREATE INDEX "HospitalEvolution_shift_idx" ON "HospitalEvolution"("shift");

ALTER TABLE "HospitalEvolution"
  ADD CONSTRAINT "HospitalEvolution_previousEvolutionRecordId_fkey"
  FOREIGN KEY ("previousEvolutionRecordId") REFERENCES "EncounterSectionRecord"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalEvolution"
  ADD CONSTRAINT "HospitalEvolution_responsibleSpecialtyId_fkey"
  FOREIGN KEY ("responsibleSpecialtyId") REFERENCES "Specialty"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalEvolution"
  ADD CONSTRAINT "HospitalEvolution_responsibleServiceAreaId_fkey"
  FOREIGN KEY ("responsibleServiceAreaId") REFERENCES "ServiceArea"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
