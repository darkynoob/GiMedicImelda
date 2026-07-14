CREATE TABLE "EmergencyEvolutionDiagnosticResult" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "emergencyEvolutionId" TEXT NOT NULL,
  "studyType" TEXT,
  "otherStudyName" TEXT,
  "problemUnderStudy" TEXT,
  "resultText" TEXT,
  "clinicalInterpretation" TEXT,
  "incidents" TEXT,
  "studyPerformedAt" TIMESTAMP(3),
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyEvolutionDiagnosticResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmergencyEvolutionDiagnosticResult_tenantId_idx"
  ON "EmergencyEvolutionDiagnosticResult"("tenantId");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_encounterId_idx"
  ON "EmergencyEvolutionDiagnosticResult"("encounterId");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_patientId_idx"
  ON "EmergencyEvolutionDiagnosticResult"("patientId");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_emergencyEvolutionId_idx"
  ON "EmergencyEvolutionDiagnosticResult"("emergencyEvolutionId");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_studyType_idx"
  ON "EmergencyEvolutionDiagnosticResult"("studyType");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_studyPerformedAt_idx"
  ON "EmergencyEvolutionDiagnosticResult"("studyPerformedAt");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_createdByUserId_idx"
  ON "EmergencyEvolutionDiagnosticResult"("createdByUserId");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_updatedByUserId_idx"
  ON "EmergencyEvolutionDiagnosticResult"("updatedByUserId");
CREATE INDEX "EmergencyEvolutionDiagnosticResult_deletedAt_idx"
  ON "EmergencyEvolutionDiagnosticResult"("deletedAt");

ALTER TABLE "EmergencyEvolutionDiagnosticResult"
  ADD CONSTRAINT "EmergencyEvolutionDiagnosticResult_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosticResult_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosticResult_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosticResult_emergencyEvolutionId_fkey"
  FOREIGN KEY ("emergencyEvolutionId") REFERENCES "EmergencyEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosticResult_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyEvolutionDiagnosticResult_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "EmergencyEvolutionDiagnosticResult" (
  "id", "tenantId", "encounterId", "patientId", "emergencyEvolutionId",
  "studyType", "otherStudyName", "resultText", "clinicalInterpretation",
  "incidents", "displayOrder", "createdAt", "updatedAt"
)
SELECT
  CONCAT("EmergencyEvolution"."id", '-aux-0'),
  "EmergencyEvolution"."tenantId",
  "EmergencyEvolution"."encounterId",
  "EmergencyEvolution"."patientId",
  "EmergencyEvolution"."id",
  'OTRO',
  'Servicios auxiliares previos',
  NULLIF(CONCAT_WS(E'\n',
    CASE
      WHEN BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'ecg') NOT ILIKE 'Sin %'
        THEN NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'ecg'), '')
      ELSE NULL
    END,
    CASE
      WHEN BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'laboratorios') NOT ILIKE 'Sin %'
        THEN NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'laboratorios'), '')
      ELSE NULL
    END
  ), ''),
  CASE
    WHEN BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'interpretacion') NOT ILIKE 'Sin %'
      THEN NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'interpretacion'), '')
    ELSE NULL
  END,
  CASE
    WHEN BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'incidentes') NOT ILIKE 'Sin %'
      THEN NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'incidentes'), '')
    ELSE NULL
  END,
  0,
  "EmergencyEvolution"."createdAt",
  "EmergencyEvolution"."updatedAt"
FROM "EmergencyEvolution"
WHERE "EmergencyEvolution"."auxiliaryServicesSnapshotJson" IS NOT NULL
  AND (
    (
      NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'ecg'), '') IS NOT NULL
      AND BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'ecg') NOT ILIKE 'Sin %'
    )
    OR (
      NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'laboratorios'), '') IS NOT NULL
      AND BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'laboratorios') NOT ILIKE 'Sin %'
    )
    OR (
      NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'interpretacion'), '') IS NOT NULL
      AND BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'interpretacion') NOT ILIKE 'Sin %'
    )
    OR (
      NULLIF(BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'incidentes'), '') IS NOT NULL
      AND BTRIM("EmergencyEvolution"."auxiliaryServicesSnapshotJson" ->> 'incidentes') NOT ILIKE 'Sin %'
    )
  );
