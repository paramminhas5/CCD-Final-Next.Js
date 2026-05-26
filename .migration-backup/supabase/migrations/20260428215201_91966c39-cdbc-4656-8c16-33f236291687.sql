CREATE OR REPLACE FUNCTION public.verify_cron_secret(_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  stored text;
BEGIN
  SELECT decrypted_secret INTO stored FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1;
  IF stored IS NULL OR _input IS NULL THEN
    RETURN false;
  END IF;
  RETURN stored = _input;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text) TO service_role;