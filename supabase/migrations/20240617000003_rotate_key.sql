-- API key rotation migration
-- Creates api_keys table and a function to rotate keys

-- 1. Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_name TEXT UNIQUE NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Function to rotate an API key: deactivates the old key and inserts a new one
CREATE OR REPLACE FUNCTION rotate_api_key(old_key TEXT, new_key_hash TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate the old key
  UPDATE api_keys
    SET is_active = false,
        last_rotated_at = now()
    WHERE key_name = old_key AND is_active = true;

  -- Insert the new key
  INSERT INTO api_keys (key_name, key_hash)
    VALUES (old_key, new_key_hash);
END;
$$;

COMMENT ON TABLE api_keys IS 'Stores hashed API keys for external service authentication';
COMMENT ON FUNCTION rotate_api_key IS 'Deactivates the old API key and inserts a new one with the provided hash. Actual key values should be managed via Supabase dashboard or vault.';
