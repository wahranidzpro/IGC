-- PIN hashing migration
-- Adds pin_hash column to synced_pin_users, creates hash/verify functions, and auto-hash trigger

-- 1. Enable pgcrypto extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add pin_hash column to synced_pin_users
ALTER TABLE synced_pin_users ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 3. Function to hash a PIN using bcrypt
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT
LANGUAGE sql
STRICT
AS $$
  SELECT crypt(pin, gen_salt('bf'));
$$;

-- 4. Function to verify a PIN against a stored hash
CREATE OR REPLACE FUNCTION verify_pin(pin TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STRICT
AS $$
  SELECT crypt(pin, hash) = hash;
$$;

-- 5. Trigger function to auto-hash pin on insert/update
CREATE OR REPLACE FUNCTION auto_hash_pin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.pin IS DISTINCT FROM OLD.pin) THEN
    NEW.pin_hash := hash_pin(NEW.pin);
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_auto_hash_pin ON synced_pin_users;
CREATE TRIGGER trg_auto_hash_pin
  BEFORE INSERT OR UPDATE OF pin
  ON synced_pin_users
  FOR EACH ROW
  EXECUTE FUNCTION auto_hash_pin();
