-- Add balance column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balance" DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Update existing users to have 0 balance if NULL
UPDATE "users" SET "balance" = 0 WHERE "balance" IS NULL;

