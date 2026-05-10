CREATE TABLE "AmbulatoryProcedureSupportingDocument" (
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
  "pdfGeneratedAt" TIMESTAMP(3),
  "pdfFileName" TEXT,
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureSupportingDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureSupportingDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmbulatoryProcedureSupportingDocument_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmbulatoryProcedureSupportingDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmbulatoryProcedureSupportingDocument_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AmbulatoryProcedureSupportingDocument_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbulatoryProcedureSupportingDocument_sectionRecordId_key" ON "AmbulatoryProcedureSupportingDocument"("sectionRecordId");
CREATE UNIQUE INDEX "AmbulatoryProcedureSupportingDocument_folio_key" ON "AmbulatoryProcedureSupportingDocument"("folio");
CREATE UNIQUE INDEX "AmbulatoryProcedureSupportingDocument_encounterId_documentType_versionNumber_key" ON "AmbulatoryProcedureSupportingDocument"("encounterId", "documentType", "versionNumber");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_tenantId_idx" ON "AmbulatoryProcedureSupportingDocument"("tenantId");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_encounterId_idx" ON "AmbulatoryProcedureSupportingDocument"("encounterId");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_patientId_idx" ON "AmbulatoryProcedureSupportingDocument"("patientId");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_documentType_idx" ON "AmbulatoryProcedureSupportingDocument"("documentType");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_status_idx" ON "AmbulatoryProcedureSupportingDocument"("status");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_recordedAt_idx" ON "AmbulatoryProcedureSupportingDocument"("recordedAt");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_signerUserId_idx" ON "AmbulatoryProcedureSupportingDocument"("signerUserId");
CREATE INDEX "AmbulatoryProcedureSupportingDocument_documentHash_idx" ON "AmbulatoryProcedureSupportingDocument"("documentHash");

CREATE TABLE "AmbulatoryProcedureDocumentLabStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "supportingDocumentId" TEXT NOT NULL,
  "studyType" TEXT NOT NULL,
  "clinicalIndication" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureDocumentLabStudy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureDocumentLabStudy_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "AmbulatoryProcedureSupportingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AmbulatoryProcedureDocumentLabStudy_supportingDocumentId_idx" ON "AmbulatoryProcedureDocumentLabStudy"("supportingDocumentId");
CREATE INDEX "AmbulatoryProcedureDocumentLabStudy_studyType_idx" ON "AmbulatoryProcedureDocumentLabStudy"("studyType");

CREATE TABLE "AmbulatoryProcedureLabRequest" (
  "id" TEXT NOT NULL,
  "supportingDocumentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "requestType" TEXT,
  "priority" TEXT,
  "diagnosis" TEXT,
  "cie10" TEXT,
  "clinicalReason" TEXT,
  "fasting" TEXT,
  "preparation" TEXT,
  "additionalStudies" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureLabRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureLabRequest_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "AmbulatoryProcedureSupportingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbulatoryProcedureLabRequest_supportingDocumentId_key" ON "AmbulatoryProcedureLabRequest"("supportingDocumentId");
CREATE INDEX "AmbulatoryProcedureLabRequest_encounterId_idx" ON "AmbulatoryProcedureLabRequest"("encounterId");
CREATE INDEX "AmbulatoryProcedureLabRequest_priority_idx" ON "AmbulatoryProcedureLabRequest"("priority");
CREATE INDEX "AmbulatoryProcedureLabRequest_cie10_idx" ON "AmbulatoryProcedureLabRequest"("cie10");

CREATE TABLE "AmbulatoryProcedureImagingRequest" (
  "id" TEXT NOT NULL,
  "supportingDocumentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "imageType" TEXT,
  "anatomicalRegion" TEXT,
  "clinicalReason" TEXT,
  "probableDiagnosis" TEXT,
  "cie10" TEXT,
  "contrast" TEXT,
  "preparation" TEXT,
  "contrastAlert" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureImagingRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureImagingRequest_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "AmbulatoryProcedureSupportingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbulatoryProcedureImagingRequest_supportingDocumentId_key" ON "AmbulatoryProcedureImagingRequest"("supportingDocumentId");
CREATE INDEX "AmbulatoryProcedureImagingRequest_encounterId_idx" ON "AmbulatoryProcedureImagingRequest"("encounterId");
CREATE INDEX "AmbulatoryProcedureImagingRequest_imageType_idx" ON "AmbulatoryProcedureImagingRequest"("imageType");
CREATE INDEX "AmbulatoryProcedureImagingRequest_cie10_idx" ON "AmbulatoryProcedureImagingRequest"("cie10");

CREATE TABLE "AmbulatoryProcedureReferralDocument" (
  "id" TEXT NOT NULL,
  "supportingDocumentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "referralType" TEXT,
  "destinationHospital" TEXT,
  "destinationClinic" TEXT,
  "destinationPhysician" TEXT,
  "reason" TEXT,
  "diagnosis" TEXT,
  "performedProcedure" TEXT,
  "briefEvolution" TEXT,
  "currentTreatment" TEXT,
  "medication" TEXT,
  "planRecommendations" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureReferralDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureReferralDocument_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "AmbulatoryProcedureSupportingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbulatoryProcedureReferralDocument_supportingDocumentId_key" ON "AmbulatoryProcedureReferralDocument"("supportingDocumentId");
CREATE INDEX "AmbulatoryProcedureReferralDocument_encounterId_idx" ON "AmbulatoryProcedureReferralDocument"("encounterId");
CREATE INDEX "AmbulatoryProcedureReferralDocument_referralType_idx" ON "AmbulatoryProcedureReferralDocument"("referralType");

CREATE TABLE "AmbulatoryProcedureConsentDocument" (
  "id" TEXT NOT NULL,
  "supportingDocumentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "institutionName" TEXT,
  "legalName" TEXT,
  "procedureName" TEXT,
  "anesthesiaType" TEXT,
  "risks" TEXT,
  "benefits" TEXT,
  "alternatives" TEXT,
  "legalAuthorization" TEXT,
  "patientSignature" TEXT,
  "witnessOneSignature" TEXT,
  "witnessTwoSignature" TEXT,
  "physicianSignature" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureConsentDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureConsentDocument_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "AmbulatoryProcedureSupportingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbulatoryProcedureConsentDocument_supportingDocumentId_key" ON "AmbulatoryProcedureConsentDocument"("supportingDocumentId");
CREATE INDEX "AmbulatoryProcedureConsentDocument_encounterId_idx" ON "AmbulatoryProcedureConsentDocument"("encounterId");
CREATE INDEX "AmbulatoryProcedureConsentDocument_procedureName_idx" ON "AmbulatoryProcedureConsentDocument"("procedureName");

CREATE TABLE "AmbulatoryProcedureCertificateDocument" (
  "id" TEXT NOT NULL,
  "supportingDocumentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "certificateType" TEXT,
  "incapacityDays" INTEGER,
  "incapacityType" TEXT,
  "certificateText" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "diagnosis" TEXT,
  "observations" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryProcedureCertificateDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AmbulatoryProcedureCertificateDocument_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "AmbulatoryProcedureSupportingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbulatoryProcedureCertificateDocument_supportingDocumentId_key" ON "AmbulatoryProcedureCertificateDocument"("supportingDocumentId");
CREATE INDEX "AmbulatoryProcedureCertificateDocument_encounterId_idx" ON "AmbulatoryProcedureCertificateDocument"("encounterId");
CREATE INDEX "AmbulatoryProcedureCertificateDocument_certificateType_idx" ON "AmbulatoryProcedureCertificateDocument"("certificateType");
