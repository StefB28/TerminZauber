-- Align WaitingList schema with current Prisma model.
-- This migration is idempotent to support environments where db push was used before.

ALTER TABLE "WaitingList"
  ADD COLUMN IF NOT EXISTS "practiceId" TEXT,
  ADD COLUMN IF NOT EXISTS "patientId" TEXT,
  ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "WaitingList_practiceId_idx" ON "WaitingList"("practiceId");
CREATE INDEX IF NOT EXISTS "WaitingList_patientId_idx" ON "WaitingList"("patientId");
CREATE INDEX IF NOT EXISTS "WaitingList_isActive_idx" ON "WaitingList"("isActive");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'WaitingList_practiceId_fkey'
  ) THEN
    ALTER TABLE "WaitingList"
      ADD CONSTRAINT "WaitingList_practiceId_fkey"
      FOREIGN KEY ("practiceId") REFERENCES "Practice"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'WaitingList_patientId_fkey'
  ) THEN
    ALTER TABLE "WaitingList"
      ADD CONSTRAINT "WaitingList_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
