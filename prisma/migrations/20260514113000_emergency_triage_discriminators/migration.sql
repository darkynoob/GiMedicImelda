UPDATE "EncounterSectionRecord"
SET "formDataJson" =
  jsonb_set(
    jsonb_set(
      "formDataJson"::jsonb - 'discAlteracionConciencia',
      '{discEstadoMentalAlterado}',
      CASE
        WHEN "formDataJson"::jsonb ? 'discEstadoMentalAlterado'
          THEN "formDataJson"::jsonb->'discEstadoMentalAlterado'
        ELSE COALESCE("formDataJson"::jsonb->'discAlteracionConciencia', 'false'::jsonb)
      END,
      true
    ),
    '{banderaRojaAutomatica}',
    to_jsonb(
      CASE
        WHEN "formDataJson"->>'discDolorToracico' = 'true'
          OR "formDataJson"->>'discDisneaSevera' = 'true'
          OR "formDataJson"->>'discEstadoMentalAlterado' = 'true'
          OR "formDataJson"->>'discAlteracionConciencia' = 'true'
          OR "formDataJson"->>'discSangradoActivo' = 'true'
          OR "formDataJson"->>'discFiebreMayor385' = 'true'
          OR "formDataJson"->>'discHipotensionSistolicaMenor90' = 'true'
          OR "formDataJson"->>'discConvulsiones' = 'true'
          OR "formDataJson"->>'discDeficitNeurologicoFocal' = 'true'
          OR "formDataJson"->>'discDolorAbdominalSevero' = 'true'
          OR "formDataJson"->>'discSepsis' = 'true'
          OR "formDataJson"->>'discTraumaMayor' = 'true'
          OR "formDataJson"->>'discOtro' = 'true'
          THEN 'Sí'
        ELSE 'No'
      END
    ),
    true
  )
WHERE "encounterType" = 'EMERGENCY'
  AND "tabKey" = 'Triage';
