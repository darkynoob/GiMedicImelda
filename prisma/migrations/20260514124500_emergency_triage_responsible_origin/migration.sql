-- Enforce structured responsible snapshot and origin/reference fields for new
-- non-signed Emergency triage records while keeping historical signed records readable.
ALTER TABLE "EncounterSectionRecord"
  ADD CONSTRAINT "EncounterSectionRecord_emergency_triage_responsible_origin_allowed"
  CHECK (
    "encounterType" <> 'EMERGENCY'
    OR "tabKey" <> 'Triage'
    OR "status" = 'SIGNED'
    OR (
      length(trim("formDataJson"->>'triageResponsableUserId')) > 0
      AND length(trim("formDataJson"->>'triageResponsableNombre')) > 0
      AND length(trim("formDataJson"->>'triageResponsableCedula')) > 0
      AND "formDataJson"->>'triageResponsableTipo' IN (
        'Enfermería',
        'Médico',
        'Paramédico'
      )
      AND "formDataJson"->>'triageResponsableTurno' IN (
        'Matutino',
        'Vespertino',
        'Nocturno'
      )
      AND "formDataJson"->>'triageResponsableArea' = 'Urgencias — Triaje'
      AND "formDataJson"->>'procedenciaIngreso' IN (
        'DOMICILIO',
        'VIA_PUBLICA',
        'TRABAJO',
        'ESCUELA',
        'OTRA_UNIDAD_MEDICA',
        'OTRO'
      )
      AND "formDataJson"->>'ingresoPorReferencia' IN ('NO', 'SI')
      AND (
        "formDataJson"->>'ingresoPorReferencia' = 'NO'
        OR length(trim("formDataJson"->>'unidadQueRefiere')) > 0
      )
      AND (
        COALESCE("formDataJson"->>'parentescoAcompanante', '') = ''
        OR "formDataJson"->>'parentescoAcompanante' IN (
          'ESPOSO_A',
          'HIJO_A',
          'PADRE_MADRE',
          'HERMANO_A',
          'OTRO',
          'NINGUNO'
        )
      )
      AND (
        COALESCE("formDataJson"->>'telefonoAcompanante', '') = ''
        OR "formDataJson"->>'telefonoAcompanante' ~ '^[0-9+\-\s()]{7,20}$'
      )
    )
  ) NOT VALID;
