CREATE TABLE "AmbulatoryPreprocedureAssessment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "preoperativeDiagnosis" TEXT NOT NULL,
  "preoperativeCie10" TEXT NOT NULL,
  "indicatedProcedure" TEXT NOT NULL,
  "procedureCode" TEXT,
  "procedureCodeSystem" TEXT,
  "clinicalIndication" TEXT NOT NULL,
  "procedureType" TEXT NOT NULL,
  "currentSymptoms" TEXT NOT NULL,
  "illnessEvolution" TEXT NOT NULL,
  "relevantHistoryDetail" TEXT,
  "physicalExam" TEXT NOT NULL,
  "preoperativeStudies" TEXT NOT NULL,
  "anesthesiaPlanned" TEXT NOT NULL,
  "hasAnesthesia" BOOLEAN NOT NULL DEFAULT false,
  "asaClassification" TEXT NOT NULL,
  "surgicalRisk" TEXT NOT NULL,
  "cardiovascularRisk" TEXT,
  "capriniThromboembolicRisk" TEXT,
  "informedProcedureRisks" TEXT NOT NULL,
  "prognosis" TEXT NOT NULL,
  "indicatedProphylaxis" TEXT,
  "clinicalAlerts" TEXT,
  "preoperativePreparation" TEXT NOT NULL,
  "fastingHours" DECIMAL(5,2),
  "fastingConfirmed" TEXT NOT NULL,
  "medicationSuspension" TEXT,
  "prophylacticAntibiotic" TEXT,
  "specialPreparation" TEXT,
  "professionalName" TEXT NOT NULL,
  "professionalLicense" TEXT NOT NULL,
  "professionalSpecialty" TEXT NOT NULL,
  "careLocation" TEXT NOT NULL,
  "signerUserId" TEXT,
  "signedAt" TIMESTAMP(3),
  "documentHash" TEXT NOT NULL,
  "digitalSeal" TEXT NOT NULL,
  "procedureStageEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pdfGeneratedAt" TIMESTAMP(3),
  "pdfFileName" TEXT,
  "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
  "pdfLastDownloadedAt" TIMESTAMP(3),
  "contentJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureRelevantHistory" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "conditionKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "present" BOOLEAN NOT NULL DEFAULT true,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureRelevantHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureComorbidity" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "cie10" TEXT,
  "controlStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureComorbidity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureAllergy" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "substance" TEXT NOT NULL,
  "reaction" TEXT,
  "severity" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureAllergy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureMedication" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "drugName" TEXT NOT NULL,
  "dose" TEXT,
  "frequency" TEXT,
  "sourceFromRecord" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureMedication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureVitalMeasurement" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "weightKg" DECIMAL(8,2) NOT NULL,
  "heightCm" DECIMAL(8,2) NOT NULL,
  "bmi" DECIMAL(8,2),
  "bloodPressure" TEXT NOT NULL,
  "heartRate" INTEGER NOT NULL,
  "respiratoryRate" INTEGER NOT NULL,
  "oxygenSaturation" DECIMAL(5,2) NOT NULL,
  "temperatureC" DECIMAL(4,1) NOT NULL,
  "capillaryGlucose" DECIMAL(8,2),
  "measuredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureVitalMeasurement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedurePreanestheticEvaluation" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "anesthesiaPlanned" TEXT NOT NULL,
  "mallampati" TEXT,
  "mouthOpening" TEXT,
  "cervicalMobility" TEXT,
  "thyromentalDistance" TEXT,
  "anestheticRisk" TEXT NOT NULL,
  "functionalCapacityMets" TEXT,
  "functionalLimitation" TEXT,
  "clinicalEvaluation" TEXT,
  "anestheticHistory" TEXT,
  "anesthesiaPlanType" TEXT,
  "anesthesiaSpecificRisk" TEXT,
  "anesthesiaRelevantAllergies" TEXT,
  "anesthesiaPlan" TEXT,
  "anesthesiologistName" TEXT,
  "anesthesiologistLicense" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedurePreanestheticEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureRiskAssessment" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "asaClassification" TEXT NOT NULL,
  "surgicalRisk" TEXT NOT NULL,
  "cardiovascularRisk" TEXT,
  "capriniThromboembolicRisk" TEXT,
  "informedProcedureRisks" TEXT NOT NULL,
  "prognosis" TEXT NOT NULL,
  "indicatedProphylaxis" TEXT,
  "clinicalAlerts" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureRiskAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureSafetyChecklist" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "patientIdentified" BOOLEAN NOT NULL DEFAULT false,
  "procedureConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "surgicalSiteMarked" BOOLEAN NOT NULL DEFAULT false,
  "consentSigned" BOOLEAN NOT NULL DEFAULT false,
  "allergiesVerified" BOOLEAN NOT NULL DEFAULT false,
  "studiesAvailable" BOOLEAN NOT NULL DEFAULT false,
  "fastingVerified" BOOLEAN NOT NULL DEFAULT false,
  "antibioticProphylaxisIndicated" BOOLEAN NOT NULL DEFAULT false,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureSafetyChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbulatoryPreprocedureInformedConsent" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "institutionName" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "documentTitle" TEXT NOT NULL,
  "placeAndDate" TEXT NOT NULL,
  "surgicalConsentStatus" TEXT NOT NULL,
  "anesthesiaConsentStatus" TEXT,
  "consentSignedDate" TIMESTAMP(3) NOT NULL,
  "explainingPhysician" TEXT NOT NULL,
  "authorizedAct" TEXT NOT NULL,
  "expectedRisks" TEXT NOT NULL,
  "expectedBenefits" TEXT NOT NULL,
  "contingencyAuthorization" TEXT NOT NULL,
  "patientExplanation" TEXT NOT NULL,
  "authorizerName" TEXT NOT NULL,
  "relationshipToPatient" TEXT NOT NULL,
  "witnessOneName" TEXT NOT NULL,
  "witnessTwoName" TEXT NOT NULL,
  "performerName" TEXT NOT NULL,
  "patientUnderstands" BOOLEAN NOT NULL DEFAULT false,
  "responsibleInformed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbulatoryPreprocedureInformedConsent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbulatoryPreprocedureAssessment_sectionRecordId_key" ON "AmbulatoryPreprocedureAssessment"("sectionRecordId");
CREATE INDEX "AmbulatoryPreprocedureAssessment_tenantId_idx" ON "AmbulatoryPreprocedureAssessment"("tenantId");
CREATE INDEX "AmbulatoryPreprocedureAssessment_encounterId_idx" ON "AmbulatoryPreprocedureAssessment"("encounterId");
CREATE INDEX "AmbulatoryPreprocedureAssessment_patientId_idx" ON "AmbulatoryPreprocedureAssessment"("patientId");
CREATE INDEX "AmbulatoryPreprocedureAssessment_sectionRecordId_idx" ON "AmbulatoryPreprocedureAssessment"("sectionRecordId");
CREATE INDEX "AmbulatoryPreprocedureAssessment_status_idx" ON "AmbulatoryPreprocedureAssessment"("status");
CREATE INDEX "AmbulatoryPreprocedureAssessment_recordedAt_idx" ON "AmbulatoryPreprocedureAssessment"("recordedAt");
CREATE INDEX "AmbulatoryPreprocedureAssessment_signedAt_idx" ON "AmbulatoryPreprocedureAssessment"("signedAt");
CREATE INDEX "AmbulatoryPreprocedureAssessment_preoperativeCie10_idx" ON "AmbulatoryPreprocedureAssessment"("preoperativeCie10");
CREATE INDEX "AmbulatoryPreprocedureAssessment_procedureCode_idx" ON "AmbulatoryPreprocedureAssessment"("procedureCode");
CREATE INDEX "AmbulatoryPreprocedureAssessment_documentHash_idx" ON "AmbulatoryPreprocedureAssessment"("documentHash");

CREATE UNIQUE INDEX "AmbulatoryPreprocedureRelevantHistory_assessmentId_conditionKey_key" ON "AmbulatoryPreprocedureRelevantHistory"("assessmentId", "conditionKey");
CREATE INDEX "AmbulatoryPreprocedureRelevantHistory_conditionKey_idx" ON "AmbulatoryPreprocedureRelevantHistory"("conditionKey");

CREATE INDEX "AmbulatoryPreprocedureComorbidity_assessmentId_idx" ON "AmbulatoryPreprocedureComorbidity"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureComorbidity_cie10_idx" ON "AmbulatoryPreprocedureComorbidity"("cie10");
CREATE INDEX "AmbulatoryPreprocedureComorbidity_controlStatus_idx" ON "AmbulatoryPreprocedureComorbidity"("controlStatus");

CREATE INDEX "AmbulatoryPreprocedureAllergy_assessmentId_idx" ON "AmbulatoryPreprocedureAllergy"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureAllergy_substance_idx" ON "AmbulatoryPreprocedureAllergy"("substance");
CREATE INDEX "AmbulatoryPreprocedureAllergy_severity_idx" ON "AmbulatoryPreprocedureAllergy"("severity");

CREATE INDEX "AmbulatoryPreprocedureMedication_assessmentId_idx" ON "AmbulatoryPreprocedureMedication"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureMedication_drugName_idx" ON "AmbulatoryPreprocedureMedication"("drugName");

CREATE UNIQUE INDEX "AmbulatoryPreprocedureVitalMeasurement_assessmentId_key" ON "AmbulatoryPreprocedureVitalMeasurement"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureVitalMeasurement_measuredAt_idx" ON "AmbulatoryPreprocedureVitalMeasurement"("measuredAt");

CREATE UNIQUE INDEX "AmbulatoryPreprocedurePreanestheticEvaluation_assessmentId_key" ON "AmbulatoryPreprocedurePreanestheticEvaluation"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedurePreanestheticEvaluation_anesthesiaPlanned_idx" ON "AmbulatoryPreprocedurePreanestheticEvaluation"("anesthesiaPlanned");
CREATE INDEX "AmbulatoryPreprocedurePreanestheticEvaluation_anestheticRisk_idx" ON "AmbulatoryPreprocedurePreanestheticEvaluation"("anestheticRisk");

CREATE UNIQUE INDEX "AmbulatoryPreprocedureRiskAssessment_assessmentId_key" ON "AmbulatoryPreprocedureRiskAssessment"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureRiskAssessment_asaClassification_idx" ON "AmbulatoryPreprocedureRiskAssessment"("asaClassification");
CREATE INDEX "AmbulatoryPreprocedureRiskAssessment_surgicalRisk_idx" ON "AmbulatoryPreprocedureRiskAssessment"("surgicalRisk");
CREATE INDEX "AmbulatoryPreprocedureRiskAssessment_cardiovascularRisk_idx" ON "AmbulatoryPreprocedureRiskAssessment"("cardiovascularRisk");
CREATE INDEX "AmbulatoryPreprocedureRiskAssessment_capriniThromboembolicRisk_idx" ON "AmbulatoryPreprocedureRiskAssessment"("capriniThromboembolicRisk");

CREATE UNIQUE INDEX "AmbulatoryPreprocedureSafetyChecklist_assessmentId_key" ON "AmbulatoryPreprocedureSafetyChecklist"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureSafetyChecklist_completed_idx" ON "AmbulatoryPreprocedureSafetyChecklist"("completed");

CREATE UNIQUE INDEX "AmbulatoryPreprocedureInformedConsent_assessmentId_key" ON "AmbulatoryPreprocedureInformedConsent"("assessmentId");
CREATE INDEX "AmbulatoryPreprocedureInformedConsent_surgicalConsentStatus_idx" ON "AmbulatoryPreprocedureInformedConsent"("surgicalConsentStatus");
CREATE INDEX "AmbulatoryPreprocedureInformedConsent_anesthesiaConsentStatus_idx" ON "AmbulatoryPreprocedureInformedConsent"("anesthesiaConsentStatus");
CREATE INDEX "AmbulatoryPreprocedureInformedConsent_consentSignedDate_idx" ON "AmbulatoryPreprocedureInformedConsent"("consentSignedDate");

ALTER TABLE "AmbulatoryPreprocedureAssessment" ADD CONSTRAINT "AmbulatoryPreprocedureAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureAssessment" ADD CONSTRAINT "AmbulatoryPreprocedureAssessment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureAssessment" ADD CONSTRAINT "AmbulatoryPreprocedureAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureAssessment" ADD CONSTRAINT "AmbulatoryPreprocedureAssessment_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureAssessment" ADD CONSTRAINT "AmbulatoryPreprocedureAssessment_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AmbulatoryPreprocedureRelevantHistory" ADD CONSTRAINT "AmbulatoryPreprocedureRelevantHistory_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureComorbidity" ADD CONSTRAINT "AmbulatoryPreprocedureComorbidity_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureAllergy" ADD CONSTRAINT "AmbulatoryPreprocedureAllergy_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureMedication" ADD CONSTRAINT "AmbulatoryPreprocedureMedication_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureVitalMeasurement" ADD CONSTRAINT "AmbulatoryPreprocedureVitalMeasurement_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedurePreanestheticEvaluation" ADD CONSTRAINT "AmbulatoryPreprocedurePreanestheticEvaluation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureRiskAssessment" ADD CONSTRAINT "AmbulatoryPreprocedureRiskAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureSafetyChecklist" ADD CONSTRAINT "AmbulatoryPreprocedureSafetyChecklist_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryPreprocedureInformedConsent" ADD CONSTRAINT "AmbulatoryPreprocedureInformedConsent_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AmbulatoryPreprocedureAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
