-- Enrich patient intake with the structured fields required by the
-- adapted "nuevo paciente" flow that now mirrors the Nexus capture model.
ALTER TABLE "Patient"
ADD COLUMN "alternatePhone" TEXT,
ADD COLUMN "municipality" TEXT,
ADD COLUMN "neighborhood" TEXT,
ADD COLUMN "street" TEXT,
ADD COLUMN "exteriorNumber" TEXT,
ADD COLUMN "interiorNumber" TEXT,
ADD COLUMN "emergencyContactRelation" TEXT,
ADD COLUMN "patientStatus" TEXT NOT NULL DEFAULT 'Activo',
ADD COLUMN "patientType" TEXT,
ADD COLUMN "medicalUnit" TEXT,
ADD COLUMN "hasKnownAllergies" BOOLEAN,
ADD COLUMN "allergiesNotes" TEXT,
ADD COLUMN "occupation" TEXT,
ADD COLUMN "educationLevel" TEXT,
ADD COLUMN "religion" TEXT,
ADD COLUMN "primaryLanguage" TEXT,
ADD COLUMN "requiresTranslator" BOOLEAN,
ADD COLUMN "registrationSource" TEXT,
ADD COLUMN "administrativeNotes" TEXT;

CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX "Patient_externalCode_idx" ON "Patient"("externalCode");
