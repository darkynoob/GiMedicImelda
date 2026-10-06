-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'FINALIZED';

-- AlterTable
ALTER TABLE "ClinicalDocument" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0;
