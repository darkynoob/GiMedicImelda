ALTER TABLE "Patient"
ADD COLUMN "rfc" TEXT;

ALTER TABLE "PatientClinicalProfile"
ADD COLUMN "rhFactor" TEXT,
ADD COLUMN "clinicalObservations" TEXT;

CREATE TABLE "PatientBillingProfile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "requiresInvoice" BOOLEAN NOT NULL DEFAULT false,
  "businessName" TEXT,
  "taxRfc" TEXT,
  "taxRegime" TEXT,
  "taxPostalCode" TEXT,
  "billingEmail" TEXT,
  "cfdiUse" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PatientBillingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientBillingProfile_patientId_key"
ON "PatientBillingProfile"("patientId");

CREATE INDEX "Patient_rfc_idx"
ON "Patient"("rfc");

CREATE INDEX "PatientBillingProfile_tenantId_idx"
ON "PatientBillingProfile"("tenantId");

CREATE INDEX "PatientBillingProfile_patientId_idx"
ON "PatientBillingProfile"("patientId");

CREATE INDEX "PatientBillingProfile_requiresInvoice_idx"
ON "PatientBillingProfile"("requiresInvoice");

ALTER TABLE "PatientBillingProfile"
ADD CONSTRAINT "PatientBillingProfile_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientBillingProfile"
ADD CONSTRAINT "PatientBillingProfile_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
