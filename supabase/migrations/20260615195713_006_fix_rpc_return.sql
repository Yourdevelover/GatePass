-- Fix the RPC function to return a single record instead of table
-- This makes it easier to consume in JavaScript

DROP FUNCTION IF EXISTS get_current_profile();

CREATE OR REPLACE FUNCTION get_current_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'phone', p.phone,
    'balance', p.balance,
    'is_admin', p.is_admin,
    'created_at', p.created_at
  ) INTO result
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_current_profile() TO authenticated;