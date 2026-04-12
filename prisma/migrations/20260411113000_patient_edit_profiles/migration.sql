-- Patient edit modal enrichment inspired by the Nexus profile structure.
-- The create flow stays intact; these tables extend editing capabilities with
-- normalized sections for responsible party, coverage, administrative docs and
-- richer demographic/clinical profile data.

CREATE TABLE "PatientResponsibleContact" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "relationship" TEXT,
  "phone" TEXT NOT NULL,
  "alternatePhone" TEXT,
  "email" TEXT,
  "legalRepresentationType" TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "country" TEXT DEFAULT 'MX',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientResponsibleContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientCoverage" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "coverageType" TEXT NOT NULL,
  "providerName" TEXT NOT NULL,
  "planName" TEXT,
  "policyNumber" TEXT,
  "membershipNumber" TEXT,
  "insuredPersonName" TEXT,
  "relationshipToInsured" TEXT,
  "validFrom" DATE,
  "validUntil" DATE,
  "authorizationNotes" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientCoverage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientDocument" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "issuedBy" TEXT,
  "issuedAt" DATE,
  "expiresAt" DATE,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientDemographicProfile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "preferredName" TEXT,
  "genderIdentity" TEXT,
  "preferredPronouns" TEXT,
  "nationality" TEXT,
  "countryOfBirth" TEXT,
  "stateOfBirth" TEXT,
  "ethnicGroup" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientDemographicProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientClinicalProfile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "organDonorStatus" TEXT,
  "pregnancyStatus" TEXT,
  "disabilityNotes" TEXT,
  "clinicalAlerts" TEXT,
  "chronicConditionsNotes" TEXT,
  "currentMedicationsNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientClinicalProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientResponsibleContact_patientId_key"
ON "PatientResponsibleContact"("patientId");

CREATE UNIQUE INDEX "PatientDemographicProfile_patientId_key"
ON "PatientDemographicProfile"("patientId");

CREATE UNIQUE INDEX "PatientClinicalProfile_patientId_key"
ON "PatientClinicalProfile"("patientId");

CREATE INDEX "PatientResponsibleContact_tenantId_idx"
ON "PatientResponsibleContact"("tenantId");

CREATE INDEX "PatientResponsibleContact_patientId_idx"
ON "PatientResponsibleContact"("patientId");

CREATE INDEX "PatientCoverage_tenantId_idx"
ON "PatientCoverage"("tenantId");

CREATE INDEX "PatientCoverage_patientId_idx"
ON "PatientCoverage"("patientId");

CREATE INDEX "PatientCoverage_patientId_isPrimary_idx"
ON "PatientCoverage"("patientId", "isPrimary");

CREATE INDEX "PatientDocument_tenantId_idx"
ON "PatientDocument"("tenantId");

CREATE INDEX "PatientDocument_patientId_idx"
ON "PatientDocument"("patientId");

CREATE INDEX "PatientDocument_patientId_isPrimary_idx"
ON "PatientDocument"("patientId", "isPrimary");

CREATE INDEX "PatientDemographicProfile_tenantId_idx"
ON "PatientDemographicProfile"("tenantId");

CREATE INDEX "PatientDemographicProfile_patientId_idx"
ON "PatientDemographicProfile"("patientId");

CREATE INDEX "PatientClinicalProfile_tenantId_idx"
ON "PatientClinicalProfile"("tenantId");

CREATE INDEX "PatientClinicalProfile_patientId_idx"
ON "PatientClinicalProfile"("patientId");

ALTER TABLE "PatientResponsibleContact"
ADD CONSTRAINT "PatientResponsibleContact_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientResponsibleContact"
ADD CONSTRAINT "PatientResponsibleContact_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientCoverage"
ADD CONSTRAINT "PatientCoverage_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientCoverage"
ADD CONSTRAINT "PatientCoverage_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientDocument"
ADD CONSTRAINT "PatientDocument_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientDocument"
ADD CONSTRAINT "PatientDocument_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientDemographicProfile"
ADD CONSTRAINT "PatientDemographicProfile_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientDemographicProfile"
ADD CONSTRAINT "PatientDemographicProfile_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientClinicalProfile"
ADD CONSTRAINT "PatientClinicalProfile_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientClinicalProfile"
ADD CONSTRAINT "PatientClinicalProfile_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill a responsible profile from the emergency contact already captured in
-- Patient so the new edit modal has something coherent to show immediately.
INSERT INTO "PatientResponsibleContact" (
  "id",
  "tenantId",
  "patientId",
  "fullName",
  "relationship",
  "phone",
  "country",
  "createdAt",
  "updatedAt"
)
SELECT
  'prc-' || md5("id" || clock_timestamp()::text),
  "tenantId",
  "id",
  "emergencyContactName",
  "emergencyContactRelation",
  "emergencyContactPhone",
  COALESCE("country", 'MX'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Patient"
WHERE "emergencyContactName" IS NOT NULL
  AND "emergencyContactPhone" IS NOT NULL;
