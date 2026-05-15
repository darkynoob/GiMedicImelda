-- Protect new non-signed Emergency triage records with structured destination
-- and reevaluation data while keeping historical signed records readable.
ALTER TABLE "EncounterSectionRecord"
  ADD CONSTRAINT "EncounterSectionRecord_emergency_triage_destination_reevaluation_allowed"
  CHECK (
    "encounterType" <> 'EMERGENCY'
    OR "tabKey" <> 'Triage'
    OR "status" = 'SIGNED'
    OR (
      "formDataJson"->>'destinoInicial' IN (
        'SALA_ESPERA',
        'OBSERVACION',
        'SALA_CHOQUE',
        'CONSULTA_MEDICA',
        'UCI',
        'HOSPITALIZACION'
      )
      AND "formDataJson"->>'requiereReevaluacion' IN ('NO', 'SI')
      AND (
        "formDataJson"->>'requiereReevaluacion' = 'NO'
        OR (
          "formDataJson"->>'horaReevaluacion' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND "formDataJson"->>'nuevaPrioridadReevaluacion' IN (
            'SIN_CAMBIO',
            'REANIMACION',
            'EMERGENCIA',
            'URGENTE',
            'MENOR_URGENCIA',
            'NO_URGENTE'
          )
          AND length(trim("formDataJson"->>'motivoCambioReevaluacion')) > 0
        )
      )
    )
  ) NOT VALID;
