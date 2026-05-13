-- Normalize Consulta actual > Consentimiento informado > Comprensión values.
-- The field is stored in EncounterSectionRecord.formDataJson because Consulta
-- actual is a flexible section record, not a dedicated relational table.
UPDATE "public"."EncounterSectionRecord"
SET "formDataJson" = jsonb_set(
  "formDataJson",
  '{consentimientoComprension}',
  to_jsonb(
    CASE "formDataJson" ->> 'consentimientoComprension'
      WHEN 'COMPLETA' THEN 'Comprende y acepta'
      WHEN 'PARCIAL' THEN 'Comprensión parcial'
      WHEN 'INSUFICIENTE' THEN 'No comprende'
      ELSE "formDataJson" ->> 'consentimientoComprension'
    END
  ),
  TRUE
)
WHERE
  "encounterType" = 'OUTPATIENT'
  AND "tabKey" = 'Consulta actual'
  AND "formDataJson" ? 'consentimientoComprension'
  AND "formDataJson" ->> 'consentimientoComprension' IN (
    'COMPLETA',
    'PARCIAL',
    'INSUFICIENTE'
  );
