ALTER TABLE "HospitalDischarge"
  ADD COLUMN "voluntaryDischargeReason" TEXT,
  ADD COLUMN "explainedRisks" TEXT,
  ADD COLUMN "voluntaryResponsibleProfessionalName" TEXT,
  ADD COLUMN "conformitySignerName" TEXT,
  ADD COLUMN "conformitySignerRelationship" TEXT,
  ADD COLUMN "conformitySignerCapacity" TEXT,
  ADD COLUMN "conformitySignedAt" TIMESTAMP(3),
  ADD COLUMN "conformitySignatureReference" TEXT,
  ADD COLUMN "receivingPhysicianName" TEXT,
  ADD COLUMN "receivingPhysicianLicense" TEXT,
  ADD COLUMN "receivingService" TEXT,
  ADD COLUMN "transportMethod" TEXT,
  ADD COLUMN "deathOccurredAt" TIMESTAMP(3),
  ADD COLUMN "causeOfDeath" TEXT,
  ADD COLUMN "deathCertificateId" TEXT,
  ADD COLUMN "lastContactAt" TIMESTAMP(3),
  ADD COLUMN "abandonmentCircumstances" TEXT,
  ADD COLUMN "abandonmentDocumentedByName" TEXT,
  ADD COLUMN "abandonmentDocumentedAt" TIMESTAMP(3);

CREATE INDEX "HospitalDischarge_dischargeType_idx" ON "HospitalDischarge"("dischargeType");
CREATE INDEX "HospitalDischarge_deathCertificateId_idx" ON "HospitalDischarge"("deathCertificateId");
CREATE INDEX "HospitalDischarge_transportMethod_idx" ON "HospitalDischarge"("transportMethod");

ALTER TABLE "HospitalDischarge"
  ADD CONSTRAINT "HospitalDischarge_deathCertificateId_fkey"
  FOREIGN KEY ("deathCertificateId") REFERENCES "ClinicalDocument"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalDischarge"
  ADD CONSTRAINT "HospitalDischarge_dischargeType_allowed_chk"
  CHECK ("dischargeType" IN ('', 'ALTA_MEDICA', 'ALTA_VOLUNTARIA', 'TRASLADO', 'REFERENCIA', 'DEFUNCION', 'FUGA_ABANDONO')) NOT VALID;

ALTER TABLE "HospitalDischarge"
  ADD CONSTRAINT "HospitalDischarge_transportMethod_allowed_chk"
  CHECK ("transportMethod" IS NULL OR "transportMethod" IN ('AMBULANCIA_BASICA', 'AMBULANCIA_AVANZADA', 'TRANSPORTE_INSTITUCIONAL', 'TRANSPORTE_PARTICULAR', 'OTRO')) NOT VALID;

ALTER TABLE "HospitalDischarge"
  ADD CONSTRAINT "HospitalDischarge_conformitySignerCapacity_allowed_chk"
  CHECK ("conformitySignerCapacity" IS NULL OR "conformitySignerCapacity" IN ('PACIENTE', 'FAMILIAR', 'TUTOR_LEGAL')) NOT VALID;

ALTER TABLE "HospitalDischarge"
  ADD CONSTRAINT "HospitalDischarge_conformitySignatureReference_allowed_chk"
  CHECK ("conformitySignatureReference" IS NULL OR "conformitySignatureReference" IN ('FIRMADA', 'NO_FIRMA')) NOT VALID;
