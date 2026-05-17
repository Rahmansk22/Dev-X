-- Add fileActions column to Message table for real-time file tracking
ALTER TABLE "Message"
ADD COLUMN "fileActions" JSONB;