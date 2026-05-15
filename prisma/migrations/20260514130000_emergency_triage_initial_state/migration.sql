-- Enforce structured initial general/mental state fields for new non-signed
-- Emergency triage records while keeping historical signed records readable.
ALTER TABLE "EncounterSectionRecord"
  ADD CONSTRAINT "EncounterSectionRecord_emergency_triage_initial_state_allowed"
  CHECK (
    "encounterType" <> 'EMERGENCY'
    OR "tabKey" <> 'Triage'
    OR "status" = 'SIGNED'
    OR (
      "formDataJson"->>'estadoGeneralInicial' IN (
        'BUENO',
        'REGULAR',
        'GRAVE'
      )
      AND "formDataJson"->>'estadoMentalInicial' IN (
        'ORIENTADO_COOPERADOR',
        'CONFUSO',
        'AGITADO',
        'SOMNOLIENTO',
        'ESTUPOROSO',
        'COMATOSO'
      )
      AND "formDataJson"->>'riesgoVitalAparente' IN (
        'NO',
        'SI',
        'INDETERMINADO'
      )
      AND "formDataJson"->>'aislamientoRequerido' IN (
        'NO',
        'CONTACTO',
        'GOTAS',
        'AEROSOLES'
      )
    )
  ) NOT VALID;
