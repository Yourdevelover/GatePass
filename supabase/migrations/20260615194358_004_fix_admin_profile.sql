-- Fix RLS policy issue for profile retrieval during login
-- The current "Users can read own profile" policy is being blocked somehow
-- Let's check and ensure policy works correctly

-- First, let's see current policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname, qual FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        RAISE NOTICE 'Policy: % - Qual: %', policy_rec.policyname, policy_rec.qual;
    END LOOP;
END $$;

-- Ensure the profile for admin user has correct is_admin value
UPDATE public.profiles SET is_admin = true WHERE id = '9ef68fc1-9938-48ff-b1f9-d97a95e0f103';
UPDATE public.profiles SET is_admin = false WHERE id = '89ea69c7-b3d6-45bc-b7ed-c91a5e912099';

-- Verify
SELECT p.id, p.name, p.is_admin, u.email 
FROM public.profiles p 
JOIN auth.users u ON u.id = p.id
ORDER BY u.email;