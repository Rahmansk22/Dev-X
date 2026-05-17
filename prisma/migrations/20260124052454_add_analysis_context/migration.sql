-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'QUESTION';
ALTER TYPE "MessageType" ADD VALUE 'ANALYSIS';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "confidenceScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contextData" JSONB,
ADD COLUMN     "isAnalyzed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDetailed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "questionsAsked" JSONB;
