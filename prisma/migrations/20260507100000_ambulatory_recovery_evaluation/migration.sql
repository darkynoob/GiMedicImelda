-- CreateTable
CREATE TABLE "AmbulatoryRecoveryEvaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sectionRecordId" TEXT NOT NULL,
    "procedureDocumentId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EncounterRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "evaluationDate" TIMESTAMP(3),
    "evaluationTime" TEXT,
    "postprocedureTime" TEXT,
    "monitoringFrequency" TEXT,
    "patientSymptoms" TEXT,
    "oralTolerance" TEXT,
    "ambulation" TEXT,
    "urination" TEXT,
    "consciousnessState" TEXT,
    "generalState" TEXT,
    "postprocedureExam" TEXT,
    "postprocedureComplications" TEXT,
    "complicationManagement" TEXT,
    "adverseEvent" TEXT,
    "adverseEventAction" TEXT,
    "surveillancePlan" TEXT,
    "recoveryTimeMinutes" INTEGER,
    "postRecoveryDestination" TEXT,
    "immediateChanges" TEXT,
    "alertsSummary" TEXT,
    "trafficLight" TEXT,
    "redAlertActive" BOOLEAN NOT NULL DEFAULT false,
    "readyForDischarge" BOOLEAN NOT NULL DEFAULT false,
    "professionalName" TEXT NOT NULL,
    "professionalLicense" TEXT NOT NULL,
    "professionalSpecialty" TEXT NOT NULL,
    "careLocation" TEXT NOT NULL,
    "signerUserId" TEXT,
    "signedAt" TIMESTAMP(3),
    "documentHash" TEXT NOT NULL,
    "digitalSeal" TEXT NOT NULL,
    "pdfGeneratedAt" TIMESTAMP(3),
    "pdfFileName" TEXT,
    "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "pdfLastDownloadedAt" TIMESTAMP(3),
    "contentJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulatoryRecoveryEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulatoryRecoveryVitalMeasurement" (
    "id" TEXT NOT NULL,
    "recoveryEvaluationId" TEXT NOT NULL,
    "systolicBloodPressure" INTEGER,
    "diastolicBloodPressure" INTEGER,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "oxygenSaturation" DECIMAL(5,2),
    "temperatureC" DECIMAL(4,1),
    "painEva" INTEGER,
    "glasgow" INTEGER,
    "capillaryGlucose" DECIMAL(8,2),
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulatoryRecoveryVitalMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulatoryRecoveryAldreteScore" (
    "id" TEXT NOT NULL,
    "recoveryEvaluationId" TEXT NOT NULL,
    "motorActivity" INTEGER,
    "respiration" INTEGER,
    "circulation" INTEGER,
    "consciousness" INTEGER,
    "oxygenSaturation" INTEGER,
    "totalScore" INTEGER,
    "interpretation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulatoryRecoveryAldreteScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulatoryRecoveryDischargeChecklist" (
    "id" TEXT NOT NULL,
    "recoveryEvaluationId" TEXT NOT NULL,
    "oralToleranceWithoutNausea" BOOLEAN NOT NULL DEFAULT false,
    "independentAmbulation" BOOLEAN NOT NULL DEFAULT false,
    "spontaneousUrination" BOOLEAN NOT NULL DEFAULT false,
    "controlledPain" BOOLEAN NOT NULL DEFAULT false,
    "noNauseaVomiting" BOOLEAN NOT NULL DEFAULT false,
    "stableVitalsOneHour" BOOLEAN NOT NULL DEFAULT false,
    "woundsWithoutBleeding" BOOLEAN NOT NULL DEFAULT false,
    "aldreteAtLeastNine" BOOLEAN NOT NULL DEFAULT false,
    "responsibleCompanionPresent" BOOLEAN NOT NULL DEFAULT false,
    "dischargeInstructionsDelivered" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulatoryRecoveryDischargeChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulatoryRecoveryAlert" (
    "id" TEXT NOT NULL,
    "recoveryEvaluationId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourceMetric" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbulatoryRecoveryAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulatoryRecoveryNursingRecord" (
    "id" TEXT NOT NULL,
    "recoveryEvaluationId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3),
    "recordTime" TEXT,
    "shift" TEXT,
    "authorName" TEXT,
    "habitusExterior" TEXT,
    "medicationAdministration" TEXT,
    "nursingProcedures" TEXT,
    "painEva" INTEGER,
    "fallRisk" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulatoryRecoveryNursingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulatoryRecoveryAuxiliaryService" (
    "id" TEXT NOT NULL,
    "recoveryEvaluationId" TEXT NOT NULL,
    "studyDateTime" TIMESTAMP(3),
    "requestedStudy" TEXT,
    "clinicalProblem" TEXT,
    "incidentsOrAccidents" TEXT,
    "resultsDescription" TEXT,
    "treatingPhysicianInterpretation" TEXT,
    "physicianName" TEXT,
    "studyFolio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbulatoryRecoveryAuxiliaryService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmbulatoryRecoveryEvaluation_sectionRecordId_key" ON "AmbulatoryRecoveryEvaluation"("sectionRecordId");
CREATE INDEX "AmbulatoryRecoveryEvaluation_tenantId_idx" ON "AmbulatoryRecoveryEvaluation"("tenantId");
CREATE INDEX "AmbulatoryRecoveryEvaluation_encounterId_idx" ON "AmbulatoryRecoveryEvaluation"("encounterId");
CREATE INDEX "AmbulatoryRecoveryEvaluation_patientId_idx" ON "AmbulatoryRecoveryEvaluation"("patientId");
CREATE INDEX "AmbulatoryRecoveryEvaluation_sectionRecordId_idx" ON "AmbulatoryRecoveryEvaluation"("sectionRecordId");
CREATE INDEX "AmbulatoryRecoveryEvaluation_procedureDocumentId_idx" ON "AmbulatoryRecoveryEvaluation"("procedureDocumentId");
CREATE INDEX "AmbulatoryRecoveryEvaluation_status_idx" ON "AmbulatoryRecoveryEvaluation"("status");
CREATE INDEX "AmbulatoryRecoveryEvaluation_recordedAt_idx" ON "AmbulatoryRecoveryEvaluation"("recordedAt");
CREATE INDEX "AmbulatoryRecoveryEvaluation_signedAt_idx" ON "AmbulatoryRecoveryEvaluation"("signedAt");
CREATE INDEX "AmbulatoryRecoveryEvaluation_trafficLight_idx" ON "AmbulatoryRecoveryEvaluation"("trafficLight");
CREATE INDEX "AmbulatoryRecoveryEvaluation_redAlertActive_idx" ON "AmbulatoryRecoveryEvaluation"("redAlertActive");
CREATE INDEX "AmbulatoryRecoveryEvaluation_readyForDischarge_idx" ON "AmbulatoryRecoveryEvaluation"("readyForDischarge");
CREATE INDEX "AmbulatoryRecoveryEvaluation_documentHash_idx" ON "AmbulatoryRecoveryEvaluation"("documentHash");
CREATE UNIQUE INDEX "AmbulatoryRecoveryVitalMeasurement_recoveryEvaluationId_key" ON "AmbulatoryRecoveryVitalMeasurement"("recoveryEvaluationId");
CREATE INDEX "AmbulatoryRecoveryVitalMeasurement_measuredAt_idx" ON "AmbulatoryRecoveryVitalMeasurement"("measuredAt");
CREATE INDEX "AmbulatoryRecoveryVitalMeasurement_oxygenSaturation_idx" ON "AmbulatoryRecoveryVitalMeasurement"("oxygenSaturation");
CREATE INDEX "AmbulatoryRecoveryVitalMeasurement_painEva_idx" ON "AmbulatoryRecoveryVitalMeasurement"("painEva");
CREATE INDEX "AmbulatoryRecoveryVitalMeasurement_glasgow_idx" ON "AmbulatoryRecoveryVitalMeasurement"("glasgow");
CREATE UNIQUE INDEX "AmbulatoryRecoveryAldreteScore_recoveryEvaluationId_key" ON "AmbulatoryRecoveryAldreteScore"("recoveryEvaluationId");
CREATE INDEX "AmbulatoryRecoveryAldreteScore_totalScore_idx" ON "AmbulatoryRecoveryAldreteScore"("totalScore");
CREATE UNIQUE INDEX "AmbulatoryRecoveryDischargeChecklist_recoveryEvaluationId_key" ON "AmbulatoryRecoveryDischargeChecklist"("recoveryEvaluationId");
CREATE INDEX "AmbulatoryRecoveryDischargeChecklist_completed_idx" ON "AmbulatoryRecoveryDischargeChecklist"("completed");
CREATE INDEX "AmbulatoryRecoveryAlert_severity_idx" ON "AmbulatoryRecoveryAlert"("severity");
CREATE INDEX "AmbulatoryRecoveryAlert_code_idx" ON "AmbulatoryRecoveryAlert"("code");
CREATE INDEX "AmbulatoryRecoveryNursingRecord_recordDate_idx" ON "AmbulatoryRecoveryNursingRecord"("recordDate");
CREATE INDEX "AmbulatoryRecoveryNursingRecord_shift_idx" ON "AmbulatoryRecoveryNursingRecord"("shift");
CREATE INDEX "AmbulatoryRecoveryNursingRecord_authorName_idx" ON "AmbulatoryRecoveryNursingRecord"("authorName");
CREATE INDEX "AmbulatoryRecoveryNursingRecord_fallRisk_idx" ON "AmbulatoryRecoveryNursingRecord"("fallRisk");
CREATE INDEX "AmbulatoryRecoveryAuxiliaryService_studyDateTime_idx" ON "AmbulatoryRecoveryAuxiliaryService"("studyDateTime");
CREATE INDEX "AmbulatoryRecoveryAuxiliaryService_requestedStudy_idx" ON "AmbulatoryRecoveryAuxiliaryService"("requestedStudy");
CREATE INDEX "AmbulatoryRecoveryAuxiliaryService_studyFolio_idx" ON "AmbulatoryRecoveryAuxiliaryService"("studyFolio");

-- AddForeignKey
ALTER TABLE "AmbulatoryRecoveryEvaluation" ADD CONSTRAINT "AmbulatoryRecoveryEvaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryEvaluation" ADD CONSTRAINT "AmbulatoryRecoveryEvaluation_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryEvaluation" ADD CONSTRAINT "AmbulatoryRecoveryEvaluation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryEvaluation" ADD CONSTRAINT "AmbulatoryRecoveryEvaluation_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryEvaluation" ADD CONSTRAINT "AmbulatoryRecoveryEvaluation_procedureDocumentId_fkey" FOREIGN KEY ("procedureDocumentId") REFERENCES "AmbulatoryProcedureDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryEvaluation" ADD CONSTRAINT "AmbulatoryRecoveryEvaluation_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryVitalMeasurement" ADD CONSTRAINT "AmbulatoryRecoveryVitalMeasurement_recoveryEvaluationId_fkey" FOREIGN KEY ("recoveryEvaluationId") REFERENCES "AmbulatoryRecoveryEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryAldreteScore" ADD CONSTRAINT "AmbulatoryRecoveryAldreteScore_recoveryEvaluationId_fkey" FOREIGN KEY ("recoveryEvaluationId") REFERENCES "AmbulatoryRecoveryEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryDischargeChecklist" ADD CONSTRAINT "AmbulatoryRecoveryDischargeChecklist_recoveryEvaluationId_fkey" FOREIGN KEY ("recoveryEvaluationId") REFERENCES "AmbulatoryRecoveryEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryAlert" ADD CONSTRAINT "AmbulatoryRecoveryAlert_recoveryEvaluationId_fkey" FOREIGN KEY ("recoveryEvaluationId") REFERENCES "AmbulatoryRecoveryEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryNursingRecord" ADD CONSTRAINT "AmbulatoryRecoveryNursingRecord_recoveryEvaluationId_fkey" FOREIGN KEY ("recoveryEvaluationId") REFERENCES "AmbulatoryRecoveryEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmbulatoryRecoveryAuxiliaryService" ADD CONSTRAINT "AmbulatoryRecoveryAuxiliaryService_recoveryEvaluationId_fkey" FOREIGN KEY ("recoveryEvaluationId") REFERENCES "AmbulatoryRecoveryEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
