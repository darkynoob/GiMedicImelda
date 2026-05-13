-- Normalize the patient comprehension field used only by outpatient
-- prescription/indications records. The option set is validated in the service.
UPDATE "EncounterSectionRecord"
SET "formDataJson" = jsonb_set(
  "formDataJson"::jsonb,
  '{recetaComprensionPaciente}',
  to_jsonb(
    CASE "formDataJson"->>'recetaComprensionPaciente'
      WHEN 'COMPLETA' THEN 'Comprende y acepta'
      WHEN 'PARCIAL' THEN 'Comprensión parcial'
      WHEN 'LIMITADA' THEN 'No comprende'
      ELSE "formDataJson"->>'recetaComprensionPaciente'
    END
  ),
  true
)
WHERE "encounterType" = 'OUTPATIENT'
  AND "tabKey" IN ('Receta e indicaciones', 'Receta / Indicaciones')
  AND "formDataJson"::jsonb ? 'recetaComprensionPaciente'
  AND "formDataJson"->>'recetaComprensionPaciente' IN (
    'COMPLETA',
    'PARCIAL',
    'LIMITADA'
  );
