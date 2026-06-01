-- Los registros históricos permanecen consultables; la restricción se aplica
-- a nuevos estados firmados para mantener el contrato clínico actual.
ALTER TABLE "EncounterSectionRecord"
ADD CONSTRAINT "EncounterSectionRecord_emergency_initial_note_prognosis_state_check"
CHECK (
  "encounterType" <> 'EMERGENCY'
  OR "tabKey" <> 'Nota inicial'
  OR "status" <> 'SIGNED'
  OR (
    "formDataJson" ->> 'pronosticoNota' IN ('BUENO', 'RESERVADO', 'MALO', 'MUY_GRAVE')
    AND NULLIF(BTRIM("formDataJson" ->> 'resumenPronostico'), '') IS NOT NULL
    AND (
      NULLIF(BTRIM("formDataJson" ->> 'estadoMentalNota'), '') IS NULL
      OR "formDataJson" ->> 'estadoMentalNota' IN (
        'ORIENTADO_COOPERADOR',
        'CONFUSO',
        'AGITADO',
        'SOMNOLIENTO',
        'ESTUPOROSO',
        'COMATOSO'
      )
    )
  )
) NOT VALID;
