-- Block new duplicate initial notes while preserving any historical duplicates
-- that may already exist before this migration.
UPDATE "EncounterSectionRecord"
SET "title" = 'Nota inicial'
WHERE "encounterType" = 'EMERGENCY'
  AND "tabKey" = 'Nota inicial'
  AND "noteType" = 'Nota inicial';

CREATE OR REPLACE FUNCTION "prevent_emergency_initial_note_duplicate"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."encounterType" = 'EMERGENCY'
    AND NEW."tabKey" = 'Nota inicial'
    AND NEW."noteType" = 'Nota inicial'
  THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW."encounterId"));

    IF EXISTS (
      SELECT 1
      FROM "EncounterSectionRecord"
      WHERE "encounterId" = NEW."encounterId"
        AND "encounterType" = 'EMERGENCY'
        AND "tabKey" = 'Nota inicial'
        AND "noteType" = 'Nota inicial'
        AND "id" <> NEW."id"
    ) THEN
      RAISE EXCEPTION 'Emergency encounter already has an initial note';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EncounterSectionRecord_emergency_initial_note_singleton"
  BEFORE INSERT OR UPDATE OF "encounterId", "encounterType", "tabKey", "noteType"
  ON "EncounterSectionRecord"
  FOR EACH ROW
  EXECUTE FUNCTION "prevent_emergency_initial_note_duplicate"();

-- Internal audited snapshots kept when a signed initial note is reopened for correction.
CREATE TABLE "EmergencyInitialNoteCorrection" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "correctedByUserId" TEXT,
  "correctionReason" TEXT,
  "previousFormDataJson" JSONB NOT NULL,
  "previousMetadataJson" JSONB,
  "previousSignedAt" TIMESTAMP(3),
  "correctedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resignedAt" TIMESTAMP(3),
  "resignedByUserId" TEXT,
  CONSTRAINT "EmergencyInitialNoteCorrection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmergencyInitialNoteCorrection_tenantId_idx"
  ON "EmergencyInitialNoteCorrection" ("tenantId");
CREATE INDEX "EmergencyInitialNoteCorrection_encounterId_idx"
  ON "EmergencyInitialNoteCorrection" ("encounterId");
CREATE INDEX "EmergencyInitialNoteCorrection_sectionRecordId_idx"
  ON "EmergencyInitialNoteCorrection" ("sectionRecordId");
CREATE INDEX "EmergencyInitialNoteCorrection_correctedAt_idx"
  ON "EmergencyInitialNoteCorrection" ("correctedAt");

ALTER TABLE "EmergencyInitialNoteCorrection"
  ADD CONSTRAINT "EmergencyInitialNoteCorrection_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteCorrection"
  ADD CONSTRAINT "EmergencyInitialNoteCorrection_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteCorrection"
  ADD CONSTRAINT "EmergencyInitialNoteCorrection_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteCorrection"
  ADD CONSTRAINT "EmergencyInitialNoteCorrection_sectionRecordId_fkey"
  FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteCorrection"
  ADD CONSTRAINT "EmergencyInitialNoteCorrection_correctedByUserId_fkey"
  FOREIGN KEY ("correctedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteCorrection"
  ADD CONSTRAINT "EmergencyInitialNoteCorrection_resignedByUserId_fkey"
  FOREIGN KEY ("resignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
