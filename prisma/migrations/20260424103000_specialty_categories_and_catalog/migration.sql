-- CreateEnum
CREATE TYPE "public"."SpecialtyCategory" AS ENUM ('BASIC', 'CLINICAL', 'SURGICAL', 'DIAGNOSTIC_SUPPORT', 'COMPLEMENTARY');

-- AlterTable
ALTER TABLE "public"."Specialty"
ADD COLUMN "category" "public"."SpecialtyCategory" NOT NULL DEFAULT 'CLINICAL';
