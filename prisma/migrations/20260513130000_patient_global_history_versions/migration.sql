-- Historia clínica versions are global per patient, while each record remains
-- linked to the encounter where it was created.
WITH ordered_history_records AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "patientId"
      ORDER BY
        COALESCE(("metadataJson" ->> 'versionNumber')::INTEGER, 0),
        "recordedAt",
        "createdAt",
        "id"
    ) AS patient_version
  FROM "public"."EncounterSectionRecord"
  WHERE
    "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Historia clínica'
)
UPDATE "public"."EncounterSectionRecord" record
SET
  "metadataJson" = jsonb_set(
    COALESCE(record."metadataJson", '{}'::JSONB),
    '{versionNumber}',
    to_jsonb(ordered.patient_version),
    TRUE
  ),
  "title" = CONCAT('Historia clínica versión ', ordered.patient_version)
FROM ordered_history_records ordered
WHERE record."id" = ordered."id";

UPDATE "public"."ConsultationHistoryPriorStudy" study
SET "versionNumber" = (record."metadataJson" ->> 'versionNumber')::INTEGER
FROM "public"."EncounterSectionRecord" record
WHERE
  study."sectionRecordId" = record."id"
  AND record."encounterType" = 'OUTPATIENT'
  AND record."tabKey" = 'Historia clínica'
  AND record."metadataJson" ? 'versionNumber';

CREATE INDEX "EncounterSectionRecord_patient_history_idx"
  ON "public"."EncounterSectionRecord"("patientId", "recordedAt")
  WHERE "encounterType" = 'OUTPATIENT' AND "tabKey" = 'Historia clínica';

CREATE UNIQUE INDEX "EncounterSectionRecord_patient_history_version_key"
  ON "public"."EncounterSectionRecord"(
    "patientId",
    ((("metadataJson" ->> 'versionNumber')::INTEGER))
  )
  WHERE
    "encounterType" = 'OUTPATIENT'
    AND "tabKey" = 'Historia clínica'
    AND "metadataJson" ? 'versionNumber';
