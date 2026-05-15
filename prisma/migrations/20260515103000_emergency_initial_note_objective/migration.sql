CREATE TABLE "EmergencyInitialNoteObjective" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "sourceTriageRecordId" TEXT,
  "habitusExterior" TEXT,
  "cardiovascular" TEXT,
  "respiratory" TEXT,
  "neurologic" TEXT,
  "abdomen" TEXT,
  "extremities" TEXT,
  "systolicBloodPressure" DECIMAL(8,2),
  "diastolicBloodPressure" DECIMAL(8,2),
  "heartRate" DECIMAL(8,2),
  "respiratoryRate" DECIMAL(8,2),
  "oxygenSaturation" DECIMAL(8,2),
  "temperature" DECIMAL(8,2),
  "painEva" DECIMAL(8,2),
  "glucose" DECIMAL(8,2),
  "glasgow" DECIMAL(8,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmergencyInitialNoteObjective_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyInitialNoteObjective_sectionRecordId_key"
  ON "EmergencyInitialNoteObjective" ("sectionRecordId");
CREATE INDEX "EmergencyInitialNoteObjective_tenantId_idx"
  ON "EmergencyInitialNoteObjective" ("tenantId");
CREATE INDEX "EmergencyInitialNoteObjective_encounterId_idx"
  ON "EmergencyInitialNoteObjective" ("encounterId");
CREATE INDEX "EmergencyInitialNoteObjective_patientId_idx"
  ON "EmergencyInitialNoteObjective" ("patientId");
CREATE INDEX "EmergencyInitialNoteObjective_sourceTriageRecordId_idx"
  ON "EmergencyInitialNoteObjective" ("sourceTriageRecordId");

ALTER TABLE "EmergencyInitialNoteObjective"
  ADD CONSTRAINT "EmergencyInitialNoteObjective_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteObjective"
  ADD CONSTRAINT "EmergencyInitialNoteObjective_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteObjective"
  ADD CONSTRAINT "EmergencyInitialNoteObjective_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteObjective"
  ADD CONSTRAINT "EmergencyInitialNoteObjective_sectionRecordId_fkey"
  FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyInitialNoteObjective"
  ADD CONSTRAINT "EmergencyInitialNoteObjective_sourceTriageRecordId_fkey"
  FOREIGN KEY ("sourceTriageRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
