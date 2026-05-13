-- Structured prior studies captured in Consulta > Historia clínica.
-- The narrative summary remains in EncounterSectionRecord.formDataJson, while
-- each study is queryable and tied to the clinical-history version record.
CREATE TYPE "public"."ConsultationPriorStudyType" AS ENUM (
  'LABORATORY',
  'IMAGING',
  'CABINET',
  'OTHER'
);

CREATE TABLE "public"."ConsultationHistoryPriorStudy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "sectionRecordId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "studyType" "public"."ConsultationPriorStudyType" NOT NULL,
  "studyName" TEXT NOT NULL,
  "studyDate" TIMESTAMP(3),
  "result" TEXT NOT NULL,
  "relevantFinding" TEXT,
  "sourceModule" TEXT,
  "sourceReferenceId" TEXT,
  "registeredByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConsultationHistoryPriorStudy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsultationHistoryPriorStudy_tenantId_idx" ON "public"."ConsultationHistoryPriorStudy"("tenantId");
CREATE INDEX "ConsultationHistoryPriorStudy_encounterId_idx" ON "public"."ConsultationHistoryPriorStudy"("encounterId");
CREATE INDEX "ConsultationHistoryPriorStudy_patientId_idx" ON "public"."ConsultationHistoryPriorStudy"("patientId");
CREATE INDEX "ConsultationHistoryPriorStudy_sectionRecordId_idx" ON "public"."ConsultationHistoryPriorStudy"("sectionRecordId");
CREATE INDEX "ConsultationHistoryPriorStudy_studyType_idx" ON "public"."ConsultationHistoryPriorStudy"("studyType");
CREATE INDEX "ConsultationHistoryPriorStudy_studyDate_idx" ON "public"."ConsultationHistoryPriorStudy"("studyDate");
CREATE INDEX "ConsultationHistoryPriorStudy_sourceModule_sourceReferenceId_idx" ON "public"."ConsultationHistoryPriorStudy"("sourceModule", "sourceReferenceId");

ALTER TABLE "public"."ConsultationHistoryPriorStudy"
  ADD CONSTRAINT "ConsultationHistoryPriorStudy_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ConsultationHistoryPriorStudy"
  ADD CONSTRAINT "ConsultationHistoryPriorStudy_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "public"."Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ConsultationHistoryPriorStudy"
  ADD CONSTRAINT "ConsultationHistoryPriorStudy_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ConsultationHistoryPriorStudy"
  ADD CONSTRAINT "ConsultationHistoryPriorStudy_sectionRecordId_fkey"
  FOREIGN KEY ("sectionRecordId") REFERENCES "public"."EncounterSectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ConsultationHistoryPriorStudy"
  ADD CONSTRAINT "ConsultationHistoryPriorStudy_registeredByUserId_fkey"
  FOREIGN KEY ("registeredByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "public"."ConsultationHistoryPriorStudy" (
  "id", "tenantId", "encounterId", "patientId", "sectionRecordId",
  "versionNumber", "studyType", "studyName", "studyDate", "result",
  "relevantFinding", "sourceModule", "sourceReferenceId",
  "registeredByUserId", "createdAt", "updatedAt"
)
SELECT
  md5(random()::TEXT || clock_timestamp()::TEXT || record."id" || study.item::TEXT),
  record."tenantId",
  record."encounterId",
  record."patientId",
  record."id",
  COALESCE((record."metadataJson" ->> 'versionNumber')::INTEGER, 1),
  CASE UPPER(COALESCE(study.item ->> 'tipoEstudio', 'OTHER'))
    WHEN 'LABORATORY' THEN 'LABORATORY'::"public"."ConsultationPriorStudyType"
    WHEN 'IMAGING' THEN 'IMAGING'::"public"."ConsultationPriorStudyType"
    WHEN 'CABINET' THEN 'CABINET'::"public"."ConsultationPriorStudyType"
    ELSE 'OTHER'::"public"."ConsultationPriorStudyType"
  END,
  COALESCE(NULLIF(BTRIM(study.item ->> 'nombreEstudio'), ''), 'Estudio no especificado'),
  CASE
    WHEN NULLIF(BTRIM(study.item ->> 'fechaEstudio'), '') IS NULL THEN NULL
    ELSE (study.item ->> 'fechaEstudio')::TIMESTAMP(3)
  END,
  COALESCE(BTRIM(study.item ->> 'resultado'), ''),
  NULLIF(BTRIM(study.item ->> 'interpretacionHallazgo'), ''),
  NULLIF(BTRIM(study.item ->> 'sourceModule'), ''),
  NULLIF(BTRIM(study.item ->> 'sourceReferenceId'), ''),
  record."authoredByUserId",
  NOW(),
  NOW()
FROM "public"."EncounterSectionRecord" record
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(record."formDataJson" -> 'estudiosPreviosRegistrados') = 'array'
      THEN record."formDataJson" -> 'estudiosPreviosRegistrados'
    ELSE '[]'::JSONB
  END
) AS study(item)
WHERE
  record."encounterType" = 'OUTPATIENT'
  AND record."tabKey" = 'Historia clínica'
  AND (
    NULLIF(BTRIM(study.item ->> 'tipoEstudio'), '') IS NOT NULL
    OR NULLIF(BTRIM(study.item ->> 'nombreEstudio'), '') IS NOT NULL
    OR NULLIF(BTRIM(study.item ->> 'fechaEstudio'), '') IS NOT NULL
    OR NULLIF(BTRIM(study.item ->> 'resultado'), '') IS NOT NULL
    OR NULLIF(BTRIM(study.item ->> 'interpretacionHallazgo'), '') IS NOT NULL
  );
