-- Fix the unique constraint issue on phone field
-- Remove the unique constraint and allow empty phones
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Update the function to generate unique phone if not provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  unique_phone text;
BEGIN
  -- Generate a unique phone number if not provided
  IF NEW.raw_user_meta_data->>'phone' IS NULL OR (NEW.raw_user_meta_data->>'phone') = '' THEN
    -- Use user ID as a unique phone placeholder
    unique_phone := 'pending_' || REPLACE(NEW.id::text, '-', '');
  ELSE
    unique_phone := NEW.raw_user_meta_data->>'phone';
  END IF;

  INSERT INTO public.profiles (id, name, phone, balance, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    unique_phone,
    0,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', EXCLUDED.name),
    phone = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), EXCLUDED.phone);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;