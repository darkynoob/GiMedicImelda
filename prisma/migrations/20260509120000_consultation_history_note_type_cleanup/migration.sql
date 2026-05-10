-- Remove legacy consultation-history fields that duplicated normalized record data.
-- The clinical date is EncounterSectionRecord.recordedAt, and the note type is
-- derived from metadataJson.versionNumber instead of being persisted separately.
UPDATE "public"."EncounterSectionRecord"
SET
  "formDataJson" = "formDataJson" - 'tipoHistoriaClinica' - 'fechaHistoria',
  "metadataJson" = CASE
    WHEN "metadataJson" IS NULL THEN NULL
    ELSE "metadataJson" - 'historyType'
  END
WHERE
  "encounterType" = 'OUTPATIENT'
  AND "tabKey" = 'Historia clínica'
  AND (
    "formDataJson" ? 'tipoHistoriaClinica'
    OR "formDataJson" ? 'fechaHistoria'
    OR COALESCE("metadataJson" ? 'historyType', FALSE)
  );
