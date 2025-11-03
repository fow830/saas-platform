-- Remove DELETED from UserStatus enum
-- First, update any users with DELETED status to SUSPENDED
UPDATE "users" SET "status" = 'SUSPENDED' WHERE "status" = 'DELETED';

-- Remove DELETED from the enum (PostgreSQL doesn't support removing enum values directly)
-- We need to recreate the enum without DELETED
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus" USING "status"::text::"UserStatus";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "UserStatus_old";

