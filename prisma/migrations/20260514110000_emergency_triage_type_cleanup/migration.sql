UPDATE "EncounterSectionRecord"
SET "formDataJson" =
  jsonb_set(
    ("formDataJson"::jsonb - 'tipoRegistro' - 'tipoTriage'),
    '{tipoTriaje}',
    to_jsonb('Triaje inicial'::text),
    true
  )
WHERE "encounterType" = 'EMERGENCY'
  AND "tabKey" = 'Triage'
  AND (
    "formDataJson"::jsonb ? 'tipoRegistro'
    OR "formDataJson"::jsonb ? 'tipoTriage'
    OR "formDataJson"->>'tipoTriaje' IS DISTINCT FROM 'Triaje inicial'
  );
