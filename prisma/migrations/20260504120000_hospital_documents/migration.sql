CREATE TABLE "HospitalDocument" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "folio" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "documentDate" TIMESTAMP(3),
  "documentTime" TEXT,
  "patientName" TEXT NOT NULL,
  "patientCurp" TEXT,
  "medicalRecordNumber" TEXT,
  "encounterFolio" TEXT NOT NULL,
  "responsibleName" TEXT NOT NULL,
  "professionalLicense" TEXT,
  "professionalSpecialty" TEXT,
  "careLocation" TEXT,
  "verificationCode" TEXT,
  "documentHash" TEXT,
  "digitalSeal" TEXT,
  "contentJson" JSONB,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalDocumentLabStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "hospitalDocumentId" TEXT NOT NULL,
  "studyType" TEXT NOT NULL,
  "priority" TEXT,
  "clinicalIndication" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalDocumentLabStudy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalDocumentImagingStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "hospitalDocumentId" TEXT NOT NULL,
  "studyName" TEXT NOT NULL,
  "imageType" TEXT,
  "anatomicalRegion" TEXT,
  "projection" TEXT,
  "priority" TEXT,
  "clinicalIndication" TEXT,
  "contrastAllergy" TEXT,
  "pregnancy" TEXT,
  "renalFunction" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalDocumentImagingStudy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalDocumentSigner" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "hospitalDocumentId" TEXT NOT NULL,
  "signerType" TEXT NOT NULL,
  "signerName" TEXT NOT NULL,
  "signatureLabel" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalDocumentSigner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalDocument_sectionRecordId_key" ON "HospitalDocument"("sectionRecordId");
CREATE UNIQUE INDEX "HospitalDocument_folio_key" ON "HospitalDocument"("folio");
CREATE UNIQUE INDEX "HospitalDocument_encounterId_documentType_versionNumber_key" ON "HospitalDocument"("encounterId", "documentType", "versionNumber");
CREATE INDEX "HospitalDocument_tenantId_idx" ON "HospitalDocument"("tenantId");
CREATE INDEX "HospitalDocument_encounterId_idx" ON "HospitalDocument"("encounterId");
CREATE INDEX "HospitalDocument_patientId_idx" ON "HospitalDocument"("patientId");
CREATE INDEX "HospitalDocument_documentType_idx" ON "HospitalDocument"("documentType");
CREATE INDEX "HospitalDocument_status_idx" ON "HospitalDocument"("status");
CREATE INDEX "HospitalDocument_recordedAt_idx" ON "HospitalDocument"("recordedAt");
CREATE INDEX "HospitalDocument_signerUserId_idx" ON "HospitalDocument"("signerUserId");

CREATE INDEX "HospitalDocumentLabStudy_tenantId_idx" ON "HospitalDocumentLabStudy"("tenantId");
CREATE INDEX "HospitalDocumentLabStudy_encounterId_idx" ON "HospitalDocumentLabStudy"("encounterId");
CREATE INDEX "HospitalDocumentLabStudy_patientId_idx" ON "HospitalDocumentLabStudy"("patientId");
CREATE INDEX "HospitalDocumentLabStudy_hospitalDocumentId_idx" ON "HospitalDocumentLabStudy"("hospitalDocumentId");
CREATE INDEX "HospitalDocumentLabStudy_studyType_idx" ON "HospitalDocumentLabStudy"("studyType");

CREATE INDEX "HospitalDocumentImagingStudy_tenantId_idx" ON "HospitalDocumentImagingStudy"("tenantId");
CREATE INDEX "HospitalDocumentImagingStudy_encounterId_idx" ON "HospitalDocumentImagingStudy"("encounterId");
CREATE INDEX "HospitalDocumentImagingStudy_patientId_idx" ON "HospitalDocumentImagingStudy"("patientId");
CREATE INDEX "HospitalDocumentImagingStudy_hospitalDocumentId_idx" ON "HospitalDocumentImagingStudy"("hospitalDocumentId");
CREATE INDEX "HospitalDocumentImagingStudy_imageType_idx" ON "HospitalDocumentImagingStudy"("imageType");

CREATE INDEX "HospitalDocumentSigner_tenantId_idx" ON "HospitalDocumentSigner"("tenantId");
CREATE INDEX "HospitalDocumentSigner_encounterId_idx" ON "HospitalDocumentSigner"("encounterId");
CREATE INDEX "HospitalDocumentSigner_patientId_idx" ON "HospitalDocumentSigner"("patientId");
CREATE INDEX "HospitalDocumentSigner_hospitalDocumentId_idx" ON "HospitalDocumentSigner"("hospitalDocumentId");
CREATE INDEX "HospitalDocumentSigner_signerType_idx" ON "HospitalDocumentSigner"("signerType");

ALTER TABLE "HospitalDocument" ADD CONSTRAINT "HospitalDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocument" ADD CONSTRAINT "HospitalDocument_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocument" ADD CONSTRAINT "HospitalDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocument" ADD CONSTRAINT "HospitalDocument_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocument" ADD CONSTRAINT "HospitalDocument_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalDocumentLabStudy" ADD CONSTRAINT "HospitalDocumentLabStudy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentLabStudy" ADD CONSTRAINT "HospitalDocumentLabStudy_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentLabStudy" ADD CONSTRAINT "HospitalDocumentLabStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentLabStudy" ADD CONSTRAINT "HospitalDocumentLabStudy_hospitalDocumentId_fkey" FOREIGN KEY ("hospitalDocumentId") REFERENCES "HospitalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalDocumentImagingStudy" ADD CONSTRAINT "HospitalDocumentImagingStudy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentImagingStudy" ADD CONSTRAINT "HospitalDocumentImagingStudy_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentImagingStudy" ADD CONSTRAINT "HospitalDocumentImagingStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentImagingStudy" ADD CONSTRAINT "HospitalDocumentImagingStudy_hospitalDocumentId_fkey" FOREIGN KEY ("hospitalDocumentId") REFERENCES "HospitalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HospitalDocumentSigner" ADD CONSTRAINT "HospitalDocumentSigner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentSigner" ADD CONSTRAINT "HospitalDocumentSigner_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentSigner" ADD CONSTRAINT "HospitalDocumentSigner_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalDocumentSigner" ADD CONSTRAINT "HospitalDocumentSigner_hospitalDocumentId_fkey" FOREIGN KEY ("hospitalDocumentId") REFERENCES "HospitalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
