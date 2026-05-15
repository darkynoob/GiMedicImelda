CREATE TABLE "EmergencyNursingSheet" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "habitusExterior" TEXT,
  "painEva" INTEGER,
  "fallRiskLevel" TEXT,
  "observations" TEXT,
  "professionalName" TEXT,
  "professionalLicense" TEXT,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyNursingSheet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyNursingMedicationAdministration" (
  "id" TEXT NOT NULL,
  "nursingSheetId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "administeredTime" TEXT,
  "status" TEXT,
  "observations" TEXT,
  "responsibleName" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyNursingMedicationAdministration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmergencyNursingProcedure" (
  "id" TEXT NOT NULL,
  "nursingSheetId" TEXT NOT NULL,
  "procedureName" TEXT NOT NULL,
  "performedTime" TEXT,
  "observations" TEXT,
  "responsibleName" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyNursingProcedure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyNursingSheet_sectionRecordId_key"
  ON "EmergencyNursingSheet"("sectionRecordId");
CREATE INDEX "EmergencyNursingSheet_encounterId_idx"
  ON "EmergencyNursingSheet"("encounterId");
CREATE INDEX "EmergencyNursingSheet_patientId_idx"
  ON "EmergencyNursingSheet"("patientId");
CREATE INDEX "EmergencyNursingSheet_signerUserId_idx"
  ON "EmergencyNursingSheet"("signerUserId");
CREATE INDEX "EmergencyNursingMedicationAdministration_nursingSheetId_idx"
  ON "EmergencyNursingMedicationAdministration"("nursingSheetId");
CREATE INDEX "EmergencyNursingProcedure_nursingSheetId_idx"
  ON "EmergencyNursingProcedure"("nursingSheetId");

ALTER TABLE "EmergencyNursingSheet"
  ADD CONSTRAINT "EmergencyNursingSheet_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyNursingSheet_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyNursingSheet_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyNursingSheet_sectionRecordId_fkey"
  FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EmergencyNursingSheet_signerUserId_fkey"
  FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmergencyNursingMedicationAdministration"
  ADD CONSTRAINT "EmergencyNursingMedicationAdministration_nursingSheetId_fkey"
  FOREIGN KEY ("nursingSheetId") REFERENCES "EmergencyNursingSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyNursingProcedure"
  ADD CONSTRAINT "EmergencyNursingProcedure_nursingSheetId_fkey"
  FOREIGN KEY ("nursingSheetId") REFERENCES "EmergencyNursingSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EncounterSectionRecord"
ADD CONSTRAINT "EncounterSectionRecord_emergency_nursing_sheet_check"
CHECK (
  "encounterType" <> 'EMERGENCY'
  OR "tabKey" <> 'Hoja de enfermería'
  OR "status" <> 'SIGNED'
  OR (
    NULLIF(BTRIM("formDataJson" ->> 'habitusExteriorEnfUrg'), '') IS NOT NULL
    AND NULLIF(BTRIM("formDataJson" ->> 'dolorEvaEnfUrg'), '') IS NOT NULL
    AND "formDataJson" ->> 'riesgoCaidasEnfUrg' IN ('BAJO', 'MEDIO', 'ALTO')
    AND NULLIF(BTRIM("formDataJson" ->> 'elaboroEnfUrg'), '') IS NOT NULL
    AND NULLIF(BTRIM("formDataJson" ->> 'cedulaEnfUrg'), '') IS NOT NULL
  )
) NOT VALID;
