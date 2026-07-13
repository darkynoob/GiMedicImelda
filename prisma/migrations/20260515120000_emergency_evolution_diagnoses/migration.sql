CREATE TABLE "EmergencyEvolutionDiagnosis" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "emergencyEvolutionId" TEXT NOT NULL,
  "diagnosisName" TEXT NOT NULL,
  "cie10Code" TEXT,
  "diagnosisType" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyEvolutionDiagnosis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmergencyEvolutionDiagnosis_tenantId_idx"
  ON "EmergencyEvolutionDiagnosis"("tenantId");
CREATE INDEX "EmergencyEvolutionDiagnosis_encounterId_idx"
  ON "EmergencyEvolutionDiagnosis"("encounterId");
CREATE INDEX "EmergencyEvolutionDiagnosis_patientId_idx"
  ON "EmergencyEvolutionDiagnosis"("patientId");
CREATE INDEX "EmergencyEvolutionDiagnosis_emergencyEvolutionId_idx"
  ON "EmergencyEvolutionDiagnosis"("emergencyEvolutionId");
CREATE INDEX "EmergencyEvolutionDiagnosis_diagnosisType_idx"
  ON "EmergencyEvolutionDiagnosis"("diagnosisType");
CREATE INDEX "EmergencyEvolutionDiagnosis_cie10Code_idx"
  ON "EmergencyEvolutionDiagnosis"("cie10Code");
CREATE INDEX "EmergencyEvolutionDiagnosis_createdByUserId_idx"
  ON "EmergencyEvolutionDiagnosis"("createdByUserId");
CREATE INDEX "EmergencyEvolutionDiagnosis_deletedAt_idx"
  ON "EmergencyEvolutionDiagnosis"("deletedAt");

ALTER TABLE "EmergencyEvolutionDiagnosis"
  ADD CONSTRAINT "EmergencyEvolutionDiagnosis_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosis_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosis_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosis_emergencyEvolutionId_fkey"
  FOREIGN KEY ("emergencyEvolutionId") REFERENCES "EmergencyEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosis_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "EmergencyEvolutionDiagnosis" (
  "id", "tenantId", "encounterId", "patientId", "emergencyEvolutionId",
  "diagnosisName", "cie10Code", "diagnosisType", "displayOrder",
  "createdAt", "updatedAt"
)
SELECT
  CONCAT("EmergencyEvolution"."id", '-', diagnosis_items.ordinality - 1),
  "EmergencyEvolution"."tenantId",
  "EmergencyEvolution"."encounterId",
  "EmergencyEvolution"."patientId",
  "EmergencyEvolution"."id",
  COALESCE(NULLIF(BTRIM(diagnosis_items.item ->> 'diagnostico'), ''), 'Diagnóstico sin especificar'),
  NULLIF(BTRIM(diagnosis_items.item ->> 'cie10'), ''),
  CASE
    WHEN COALESCE(diagnosis_items.item ->> 'tipo', diagnosis_items.item ->> 'estado') IN ('PRESUNTIVO', 'CONFIRMADO', 'DIFERENCIAL')
      THEN COALESCE(diagnosis_items.item ->> 'tipo', diagnosis_items.item ->> 'estado')
    ELSE NULL
  END,
  diagnosis_items.ordinality - 1,
  "EmergencyEvolution"."createdAt",
  "EmergencyEvolution"."updatedAt"
FROM "EmergencyEvolution"
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof("EmergencyEvolution"."diagnosesJson") = 'array'
      THEN "EmergencyEvolution"."diagnosesJson"
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS diagnosis_items(item, ordinality)
WHERE (
    NULLIF(BTRIM(diagnosis_items.item ->> 'diagnostico'), '') IS NOT NULL
    OR NULLIF(BTRIM(diagnosis_items.item ->> 'cie10'), '') IS NOT NULL
  );
