-- Ensure admin user has correct is_admin value
-- This is a permanent fix to ensure the admin user always has is_admin = true

-- Update admin user
UPDATE profiles SET is_admin = true WHERE id = '9ef68fc1-9938-48ff-b1f9-d97a95e0f103';

-- Create a function to preserve admin status
CREATE OR REPLACE FUNCTION preserve_admin_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the admin user and is_admin is being set to false, prevent it
  IF OLD.id = '9ef68fc1-9938-48ff-b1f9-d97a95e0f103'::uuid AND NEW.is_admin = false THEN
    NEW.is_admin = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS preserve_admin_trigger ON profiles;
CREATE TRIGGER preserve_admin_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION preserve_admin_status();

-- Final verification
SELECT id, name, is_admin, (SELECT email FROM auth.users WHERE id = profiles.id) as email FROM profiles;