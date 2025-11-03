-- Add simpleId column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "simpleId" TEXT;

-- Create unique index for simpleId
CREATE UNIQUE INDEX IF NOT EXISTS "users_simpleId_key" ON "users"("simpleId");

-- Generate simple IDs for existing users (00001, 00002, etc.)
DO $$
DECLARE
    user_rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR user_rec IN SELECT id FROM "users" ORDER BY "createdAt" ASC LOOP
        UPDATE "users" 
        SET "simpleId" = LPAD(counter::TEXT, 5, '0')
        WHERE id = user_rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make simpleId NOT NULL after filling existing records
ALTER TABLE "users" ALTER COLUMN "simpleId" SET NOT NULL;

