-- Use the clinical tab label as the canonical tab key for outpatient
-- prescriptions, while keeping the record type fixed and versioned per episode.
DROP INDEX IF EXISTS "EncounterSectionRecord_consultation_prescription_version_key";
DROP INDEX IF EXISTS "EncounterSectionRecord_consultation_prescription_idx";

UPDATE "EncounterSectionRecord"
SET "tabKey" = 'Receta e indicaciones'
WHERE "encounterType" = 'OUTPATIENT'
  AND "tabKey" = 'Receta / Indicaciones';

UPDATE "EncounterProfile"
SET "sectionsJson" =
  ("sectionsJson"::jsonb - 'Receta / Indicaciones') ||
  jsonb_build_object(
    'Receta e indicaciones',
    COALESCE(
      "sectionsJson"::jsonb->'Receta e indicaciones',
      "sectionsJson"::jsonb->'Receta / Indicaciones',
      '{}'::jsonb
    )
  )
WHERE "encounterType" = 'OUTPATIENT'
  AND "sectionsJson"::jsonb ? 'Receta / Indicaciones';

CREATE INDEX IF NOT EXISTS "EncounterSectionRecord_consultation_prescription_idx"
  ON "EncounterSectionRecord" ("encounterId", "recordedAt" DESC, "createdAt" DESC)
  WHERE "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Receta e indicaciones';

CREATE UNIQUE INDEX IF NOT EXISTS "EncounterSectionRecord_consultation_prescription_version_key"
  ON "EncounterSectionRecord" (
    "encounterId",
    (("metadataJson"->>'versionNumber')::int)
  )
  WHERE "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Receta e indicaciones'
    AND "metadataJson" ? 'versionNumber';
