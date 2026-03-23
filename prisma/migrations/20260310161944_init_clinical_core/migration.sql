-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('HOSPITAL', 'CLINIC', 'CONSULTING_ROOM', 'LABORATORY', 'IMAGING_CENTER', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalRecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "EncounterType" AS ENUM ('OUTPATIENT', 'EMERGENCY', 'HOSPITALIZATION', 'SURGERY', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('CONSULTATION', 'EMERGENCY', 'HOSPITALIZATION', 'SURGERY', 'NURSING', 'DIAGNOSTIC', 'LEGAL', 'DISCHARGE', 'DEATH', 'ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'READY_FOR_SIGNATURE', 'SIGNED', 'AMENDED', 'SUPERSEDED', 'VOID_ADMIN');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('SIMPLE_ELECTRONIC', 'ADVANCED_ELECTRONIC', 'DIGITAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'READ', 'EXPORT', 'PRINT', 'SIGN', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED');

-- CreateEnum
CREATE TYPE "AdmissionSource" AS ENUM ('CONSULTATION', 'EMERGENCY', 'TRANSFER', 'SURGERY', 'OTHER');

-- CreateEnum
CREATE TYPE "DischargeType" AS ENUM ('NORMAL', 'VOLUNTARY', 'TRANSFER', 'DEFUNCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "SexAtBirth" AS ENUM ('MALE', 'FEMALE', 'INTERSEX', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "facilityType" "FacilityType" NOT NULL,
    "institutionName" TEXT,
    "ownerName" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'MX',
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT,
    "specialtyId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "fullName" TEXT NOT NULL,
    "professionalLicense" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalCode" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "fullName" TEXT NOT NULL,
    "sexAtBirth" "SexAtBirth" NOT NULL,
    "birthDate" DATE,
    "ageSnapshot" INTEGER,
    "maritalStatus" TEXT,
    "bloodType" TEXT,
    "curp" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'MX',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientIdentifier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "status" "MedicalRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEncounterAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "serviceAreaId" TEXT,
    "specialtyId" TEXT,
    "medicalRecordId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterNumber" TEXT NOT NULL,
    "encounterType" "EncounterType" NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'OPEN',
    "admissionSource" "AdmissionSource",
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "attendingUserId" TEXT,
    "reasonForVisit" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "description" TEXT,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT true,
    "allowsMultiple" BOOLEAN NOT NULL DEFAULT true,
    "schemaJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "documentDate" TIMESTAMP(3) NOT NULL,
    "signedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentJson" JSONB NOT NULL,
    "narrativeText" TEXT,
    "hashSha256" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signatureType" "SignatureType" NOT NULL,
    "signedHash" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentStatusHistory" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fromStatus" "DocumentStatus",
    "toStatus" "DocumentStatus" NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DECIMAL(8,2),
    "heightCm" DECIMAL(8,2),
    "temperatureC" DECIMAL(4,1),
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "systolicBp" INTEGER,
    "diastolicBp" INTEGER,
    "oxygenSaturation" DECIMAL(5,2),
    "painScale" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "diagnosisType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT,
    "onsetAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientId" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationStatement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dose" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3),
    "performerUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcedureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyName" TEXT NOT NULL,
    "clinicalQuestion" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "labRequestId" TEXT,
    "studyName" TEXT NOT NULL,
    "resultText" TEXT,
    "interpretedBy" TEXT,
    "reportedAt" TIMESTAMP(3),
    "incidents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyName" TEXT NOT NULL,
    "clinicalQuestion" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "imagingRequestId" TEXT,
    "studyName" TEXT NOT NULL,
    "resultText" TEXT,
    "interpretedBy" TEXT,
    "reportedAt" TIMESTAMP(3),
    "incidents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagingReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "authoredByUserId" TEXT,
    "noteAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "habitusExterior" TEXT,
    "observations" TEXT,
    "painScale" INTEGER,
    "fallRiskLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NursingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentForm" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "clinicalDocumentId" TEXT,
    "title" TEXT NOT NULL,
    "authorizedAct" TEXT NOT NULL,
    "risksBenefits" TEXT,
    "emergencyAuthorization" BOOLEAN NOT NULL DEFAULT false,
    "grantedByName" TEXT NOT NULL,
    "grantedByRelation" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "witness1Name" TEXT,
    "witness2Name" TEXT,
    "physicianName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discharge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dischargeAt" TIMESTAMP(3) NOT NULL,
    "dischargeType" "DischargeType" NOT NULL,
    "reason" TEXT NOT NULL,
    "clinicalSummary" TEXT,
    "pendingProblems" TEXT,
    "treatmentPlan" TEXT,
    "ambulatoryRecommendations" TEXT,
    "prognosis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "notificationDate" TIMESTAMP(3) NOT NULL,
    "notifiedAct" TEXT NOT NULL,
    "injuryReport" TEXT,
    "agencyName" TEXT,
    "physicianName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeathRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientId" TEXT NOT NULL,
    "deathDate" TIMESTAMP(3),
    "causeOfDeath" TEXT,
    "fetalDeath" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeathRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT,
    "patientId" TEXT,
    "encounterId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "uploadedByUserId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "facilityId" TEXT,
    "patientId" TEXT,
    "encounterId" TEXT,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE INDEX "Specialty_tenantId_idx" ON "Specialty"("tenantId");

-- CreateIndex
CREATE INDEX "Specialty_name_idx" ON "Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_tenantId_code_key" ON "Specialty"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Facility_tenantId_idx" ON "Facility"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_tenantId_code_key" ON "Facility"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ServiceArea_tenantId_idx" ON "ServiceArea"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceArea_facilityId_idx" ON "ServiceArea"("facilityId");

-- CreateIndex
CREATE INDEX "ServiceArea_specialtyId_idx" ON "ServiceArea"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_facilityId_code_key" ON "ServiceArea"("facilityId", "code");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_facilityId_idx" ON "User"("facilityId");

-- CreateIndex
CREATE INDEX "User_specialtyId_idx" ON "User"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "Patient_tenantId_idx" ON "Patient"("tenantId");

-- CreateIndex
CREATE INDEX "Patient_fullName_idx" ON "Patient"("fullName");

-- CreateIndex
CREATE INDEX "Patient_curp_idx" ON "Patient"("curp");

-- CreateIndex
CREATE INDEX "PatientIdentifier_tenantId_idx" ON "PatientIdentifier"("tenantId");

-- CreateIndex
CREATE INDEX "PatientIdentifier_patientId_idx" ON "PatientIdentifier"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientIdentifier_tenantId_identifierType_identifierValue_key" ON "PatientIdentifier"("tenantId", "identifierType", "identifierValue");

-- CreateIndex
CREATE INDEX "MedicalRecord_tenantId_idx" ON "MedicalRecord"("tenantId");

-- CreateIndex
CREATE INDEX "MedicalRecord_facilityId_idx" ON "MedicalRecord"("facilityId");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_facilityId_recordNumber_key" ON "MedicalRecord"("facilityId", "recordNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_facilityId_patientId_key" ON "MedicalRecord"("facilityId", "patientId");

-- CreateIndex
CREATE INDEX "Encounter_tenantId_idx" ON "Encounter"("tenantId");

-- CreateIndex
CREATE INDEX "Encounter_facilityId_idx" ON "Encounter"("facilityId");

-- CreateIndex
CREATE INDEX "Encounter_serviceAreaId_idx" ON "Encounter"("serviceAreaId");

-- CreateIndex
CREATE INDEX "Encounter_specialtyId_idx" ON "Encounter"("specialtyId");

-- CreateIndex
CREATE INDEX "Encounter_medicalRecordId_idx" ON "Encounter"("medicalRecordId");

-- CreateIndex
CREATE INDEX "Encounter_patientId_idx" ON "Encounter"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Encounter_facilityId_encounterNumber_key" ON "Encounter"("facilityId", "encounterNumber");

-- CreateIndex
CREATE INDEX "DocumentType_tenantId_idx" ON "DocumentType"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentType_specialtyId_idx" ON "DocumentType"("specialtyId");

-- CreateIndex
CREATE INDEX "DocumentType_category_idx" ON "DocumentType"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_tenantId_code_key" ON "DocumentType"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalDocument_currentVersionId_key" ON "ClinicalDocument"("currentVersionId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_tenantId_idx" ON "ClinicalDocument"("tenantId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_facilityId_idx" ON "ClinicalDocument"("facilityId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_medicalRecordId_idx" ON "ClinicalDocument"("medicalRecordId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_encounterId_idx" ON "ClinicalDocument"("encounterId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_patientId_idx" ON "ClinicalDocument"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_documentTypeId_idx" ON "ClinicalDocument"("documentTypeId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_specialtyId_idx" ON "ClinicalDocument"("specialtyId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_authorUserId_idx" ON "ClinicalDocument"("authorUserId");

-- CreateIndex
CREATE INDEX "ClinicalDocument_status_idx" ON "ClinicalDocument"("status");

-- CreateIndex
CREATE INDEX "ClinicalDocument_documentDate_idx" ON "ClinicalDocument"("documentDate");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVersion_createdByUserId_idx" ON "DocumentVersion"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentId_idx" ON "DocumentSignature"("documentId");

-- CreateIndex
CREATE INDEX "DocumentSignature_userId_idx" ON "DocumentSignature"("userId");

-- CreateIndex
CREATE INDEX "DocumentSignature_signedAt_idx" ON "DocumentSignature"("signedAt");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_documentId_idx" ON "DocumentStatusHistory"("documentId");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_changedByUserId_idx" ON "DocumentStatusHistory"("changedByUserId");

-- CreateIndex
CREATE INDEX "DocumentStatusHistory_createdAt_idx" ON "DocumentStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "VitalSign_tenantId_idx" ON "VitalSign"("tenantId");

-- CreateIndex
CREATE INDEX "VitalSign_encounterId_idx" ON "VitalSign"("encounterId");

-- CreateIndex
CREATE INDEX "VitalSign_patientId_idx" ON "VitalSign"("patientId");

-- CreateIndex
CREATE INDEX "VitalSign_takenAt_idx" ON "VitalSign"("takenAt");

-- CreateIndex
CREATE INDEX "Diagnosis_tenantId_idx" ON "Diagnosis"("tenantId");

-- CreateIndex
CREATE INDEX "Diagnosis_encounterId_idx" ON "Diagnosis"("encounterId");

-- CreateIndex
CREATE INDEX "Diagnosis_patientId_idx" ON "Diagnosis"("patientId");

-- CreateIndex
CREATE INDEX "Diagnosis_code_idx" ON "Diagnosis"("code");

-- CreateIndex
CREATE INDEX "Problem_tenantId_idx" ON "Problem"("tenantId");

-- CreateIndex
CREATE INDEX "Problem_encounterId_idx" ON "Problem"("encounterId");

-- CreateIndex
CREATE INDEX "Problem_patientId_idx" ON "Problem"("patientId");

-- CreateIndex
CREATE INDEX "Allergy_tenantId_idx" ON "Allergy"("tenantId");

-- CreateIndex
CREATE INDEX "Allergy_encounterId_idx" ON "Allergy"("encounterId");

-- CreateIndex
CREATE INDEX "Allergy_patientId_idx" ON "Allergy"("patientId");

-- CreateIndex
CREATE INDEX "MedicationStatement_tenantId_idx" ON "MedicationStatement"("tenantId");

-- CreateIndex
CREATE INDEX "MedicationStatement_encounterId_idx" ON "MedicationStatement"("encounterId");

-- CreateIndex
CREATE INDEX "MedicationStatement_patientId_idx" ON "MedicationStatement"("patientId");

-- CreateIndex
CREATE INDEX "ProcedureRecord_tenantId_idx" ON "ProcedureRecord"("tenantId");

-- CreateIndex
CREATE INDEX "ProcedureRecord_encounterId_idx" ON "ProcedureRecord"("encounterId");

-- CreateIndex
CREATE INDEX "ProcedureRecord_patientId_idx" ON "ProcedureRecord"("patientId");

-- CreateIndex
CREATE INDEX "ProcedureRecord_performerUserId_idx" ON "ProcedureRecord"("performerUserId");

-- CreateIndex
CREATE INDEX "LabRequest_tenantId_idx" ON "LabRequest"("tenantId");

-- CreateIndex
CREATE INDEX "LabRequest_encounterId_idx" ON "LabRequest"("encounterId");

-- CreateIndex
CREATE INDEX "LabRequest_patientId_idx" ON "LabRequest"("patientId");

-- CreateIndex
CREATE INDEX "LabRequest_requestedByUserId_idx" ON "LabRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "LabResult_tenantId_idx" ON "LabResult"("tenantId");

-- CreateIndex
CREATE INDEX "LabResult_encounterId_idx" ON "LabResult"("encounterId");

-- CreateIndex
CREATE INDEX "LabResult_patientId_idx" ON "LabResult"("patientId");

-- CreateIndex
CREATE INDEX "LabResult_labRequestId_idx" ON "LabResult"("labRequestId");

-- CreateIndex
CREATE INDEX "ImagingRequest_tenantId_idx" ON "ImagingRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ImagingRequest_encounterId_idx" ON "ImagingRequest"("encounterId");

-- CreateIndex
CREATE INDEX "ImagingRequest_patientId_idx" ON "ImagingRequest"("patientId");

-- CreateIndex
CREATE INDEX "ImagingRequest_requestedByUserId_idx" ON "ImagingRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ImagingReport_tenantId_idx" ON "ImagingReport"("tenantId");

-- CreateIndex
CREATE INDEX "ImagingReport_encounterId_idx" ON "ImagingReport"("encounterId");

-- CreateIndex
CREATE INDEX "ImagingReport_patientId_idx" ON "ImagingReport"("patientId");

-- CreateIndex
CREATE INDEX "ImagingReport_imagingRequestId_idx" ON "ImagingReport"("imagingRequestId");

-- CreateIndex
CREATE INDEX "NursingNote_tenantId_idx" ON "NursingNote"("tenantId");

-- CreateIndex
CREATE INDEX "NursingNote_encounterId_idx" ON "NursingNote"("encounterId");

-- CreateIndex
CREATE INDEX "NursingNote_patientId_idx" ON "NursingNote"("patientId");

-- CreateIndex
CREATE INDEX "NursingNote_authoredByUserId_idx" ON "NursingNote"("authoredByUserId");

-- CreateIndex
CREATE INDEX "ConsentForm_tenantId_idx" ON "ConsentForm"("tenantId");

-- CreateIndex
CREATE INDEX "ConsentForm_facilityId_idx" ON "ConsentForm"("facilityId");

-- CreateIndex
CREATE INDEX "ConsentForm_patientId_idx" ON "ConsentForm"("patientId");

-- CreateIndex
CREATE INDEX "ConsentForm_encounterId_idx" ON "ConsentForm"("encounterId");

-- CreateIndex
CREATE INDEX "ConsentForm_clinicalDocumentId_idx" ON "ConsentForm"("clinicalDocumentId");

-- CreateIndex
CREATE INDEX "Discharge_tenantId_idx" ON "Discharge"("tenantId");

-- CreateIndex
CREATE INDEX "Discharge_encounterId_idx" ON "Discharge"("encounterId");

-- CreateIndex
CREATE INDEX "Discharge_patientId_idx" ON "Discharge"("patientId");

-- CreateIndex
CREATE INDEX "MpNotification_tenantId_idx" ON "MpNotification"("tenantId");

-- CreateIndex
CREATE INDEX "MpNotification_encounterId_idx" ON "MpNotification"("encounterId");

-- CreateIndex
CREATE INDEX "MpNotification_patientId_idx" ON "MpNotification"("patientId");

-- CreateIndex
CREATE INDEX "DeathRecord_tenantId_idx" ON "DeathRecord"("tenantId");

-- CreateIndex
CREATE INDEX "DeathRecord_encounterId_idx" ON "DeathRecord"("encounterId");

-- CreateIndex
CREATE INDEX "DeathRecord_patientId_idx" ON "DeathRecord"("patientId");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_idx" ON "Attachment"("tenantId");

-- CreateIndex
CREATE INDEX "Attachment_documentId_idx" ON "Attachment"("documentId");

-- CreateIndex
CREATE INDEX "Attachment_patientId_idx" ON "Attachment"("patientId");

-- CreateIndex
CREATE INDEX "Attachment_encounterId_idx" ON "Attachment"("encounterId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedByUserId_idx" ON "Attachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_facilityId_idx" ON "AuditLog"("facilityId");

-- CreateIndex
CREATE INDEX "AuditLog_patientId_idx" ON "AuditLog"("patientId");

-- CreateIndex
CREATE INDEX "AuditLog_encounterId_idx" ON "AuditLog"("encounterId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientIdentifier" ADD CONSTRAINT "PatientIdentifier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientIdentifier" ADD CONSTRAINT "PatientIdentifier_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ClinicalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ClinicalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ClinicalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentStatusHistory" ADD CONSTRAINT "DocumentStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationStatement" ADD CONSTRAINT "MedicationStatement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationStatement" ADD CONSTRAINT "MedicationStatement_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationStatement" ADD CONSTRAINT "MedicationStatement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_performerUserId_fkey" FOREIGN KEY ("performerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRequest" ADD CONSTRAINT "LabRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRequest" ADD CONSTRAINT "LabRequest_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRequest" ADD CONSTRAINT "LabRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRequest" ADD CONSTRAINT "LabRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_labRequestId_fkey" FOREIGN KEY ("labRequestId") REFERENCES "LabRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingRequest" ADD CONSTRAINT "ImagingRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingRequest" ADD CONSTRAINT "ImagingRequest_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingRequest" ADD CONSTRAINT "ImagingRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingRequest" ADD CONSTRAINT "ImagingRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingReport" ADD CONSTRAINT "ImagingReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingReport" ADD CONSTRAINT "ImagingReport_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingReport" ADD CONSTRAINT "ImagingReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingReport" ADD CONSTRAINT "ImagingReport_imagingRequestId_fkey" FOREIGN KEY ("imagingRequestId") REFERENCES "ImagingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingNote" ADD CONSTRAINT "NursingNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingNote" ADD CONSTRAINT "NursingNote_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingNote" ADD CONSTRAINT "NursingNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingNote" ADD CONSTRAINT "NursingNote_authoredByUserId_fkey" FOREIGN KEY ("authoredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_clinicalDocumentId_fkey" FOREIGN KEY ("clinicalDocumentId") REFERENCES "ClinicalDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discharge" ADD CONSTRAINT "Discharge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discharge" ADD CONSTRAINT "Discharge_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discharge" ADD CONSTRAINT "Discharge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpNotification" ADD CONSTRAINT "MpNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpNotification" ADD CONSTRAINT "MpNotification_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpNotification" ADD CONSTRAINT "MpNotification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathRecord" ADD CONSTRAINT "DeathRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathRecord" ADD CONSTRAINT "DeathRecord_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathRecord" ADD CONSTRAINT "DeathRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ClinicalDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
