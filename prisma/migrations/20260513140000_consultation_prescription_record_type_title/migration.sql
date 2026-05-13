-- Normalize outpatient consultation prescriptions to a fixed record type and
-- episode-scoped version title. The version remains in metadataJson because
-- EncounterSectionRecord is a polymorphic record table for several tabs.
WITH ordered_prescriptions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "encounterId"
      ORDER BY
        CASE
          WHEN "metadataJson" ? 'versionNumber'
            AND ("metadataJson"->>'versionNumber') ~ '^[0-9]+$'
          THEN ("metadataJson"->>'versionNumber')::int
          ELSE 0
        END,
        "recordedAt",
        "createdAt",
        id
    ) AS episode_version
  FROM "EncounterSectionRecord"
  WHERE "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Receta / Indicaciones'
)
UPDATE "EncounterSectionRecord" AS record
SET
  "noteType" = 'Receta e indicaciones',
  "title" = CONCAT('Receta V', ordered_prescriptions.episode_version),
  "metadataJson" = jsonb_set(
    COALESCE(record."metadataJson"::jsonb, '{}'::jsonb),
    '{versionNumber}',
    to_jsonb(ordered_prescriptions.episode_version),
    true
  )
FROM ordered_prescriptions
WHERE record.id = ordered_prescriptions.id;

CREATE INDEX IF NOT EXISTS "EncounterSectionRecord_consultation_prescription_idx"
  ON "EncounterSectionRecord" ("encounterId", "recordedAt" DESC, "createdAt" DESC)
  WHERE "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Receta / Indicaciones';

CREATE UNIQUE INDEX IF NOT EXISTS "EncounterSectionRecord_consultation_prescription_version_key"
  ON "EncounterSectionRecord" (
    "encounterId",
    (("metadataJson"->>'versionNumber')::int)
  )
  WHERE "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Receta / Indicaciones'
    AND "metadataJson" ? 'versionNumber';
