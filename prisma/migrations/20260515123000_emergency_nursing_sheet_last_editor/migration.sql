ALTER TABLE "EmergencyNursingSheet"
  ADD COLUMN "lastEditedByUserId" TEXT;

CREATE INDEX "EmergencyNursingSheet_lastEditedByUserId_idx"
  ON "EmergencyNursingSheet"("lastEditedByUserId");
