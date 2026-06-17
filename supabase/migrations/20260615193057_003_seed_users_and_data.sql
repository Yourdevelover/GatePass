-- Seed users and sample data for GatePass
-- This ensures the app has working data on first load

-- Update existing user passwords with bcrypt
-- admin@gmail.com -> admin111
-- aldo@gmail.com -> user111

-- Update admin password
UPDATE auth.users SET
  encrypted_password = crypt('admin111', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@gmail.com';

-- Update regular user password  
UPDATE auth.users SET
  encrypted_password = crypt('user111', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'aldo@gmail.com';

-- Update profiles with proper data
UPDATE public.profiles SET
  name = 'Admin GatePass',
  phone = '081111111111',
  is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');

UPDATE public.profiles SET
  name = 'User GatePass', 
  phone = '082222222222',
  balance = 50000,
  is_admin = false
WHERE id = (SELECT id FROM auth.users WHERE email = 'aldo@gmail.com');

-- Insert profile if missing
INSERT INTO public.profiles (id, name, phone, balance, is_admin, created_at)
SELECT id, 'User GatePass', '082222222222', 50000, false, NOW()
FROM auth.users 
WHERE email = 'aldo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.users.id);

-- Ensure parking locations exist with sample data
INSERT INTO public.parking_locations (name, address, hourly_rate, total_slots, available_slots, created_at)
VALUES 
  ('Mall Central Park', 'Jl. Letjen S. Parman, Jakarta Barat', 5000, 500, 342, NOW()),
  ('Grand Indonesia', 'Jl. MH Thamrin, Jakarta Pusat', 7000, 800, 156, NOW()),
  ('Plaza Indonesia', 'Jl. MH Thamrin Kav 1, Jakarta Pusat', 6000, 350, 89, NOW()),
  ('Senayan City', 'Jl. Asia Afrika, Jakarta Pusat', 5000, 450, 201, NOW()),
  ('Pondok Indah Mall', 'Jl. Metro Pondok Indah, Jakarta Selatan', 6000, 600, 412, NOW())
ON CONFLICT DO NOTHING;