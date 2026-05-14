-- Enforce structured quick clinical state values for non-signed Emergency
-- triage records. NOT VALID keeps historical signed records with legacy values
-- readable and auditable while protecting new draft/open/closed writes.
ALTER TABLE "EncounterSectionRecord"
  ADD CONSTRAINT "EncounterSectionRecord_emergency_triage_quick_state_allowed"
  CHECK (
    "encounterType" <> 'EMERGENCY'
    OR "tabKey" <> 'Triage'
    OR "status" = 'SIGNED'
    OR (
      "formDataJson"->>'viaAerea' IN ('PERMEABLE', 'COMPROMETIDA', 'INTUBADA')
      AND "formDataJson"->>'estadoHemodinamico' IN ('ESTABLE', 'INESTABLE', 'CHOQUE')
      AND "formDataJson"->>'estadoNeurologico' IN (
        'ALERTA',
        'RESPONDE_VOZ',
        'RESPONDE_DOLOR',
        'INCONSCIENTE'
      )
    )
  ) NOT VALID;
