-- Create or update test users

-- First, ensure the trigger for new user signup is working
-- We'll use auth.users directly with proper upsert

-- Check if users exist and update their passwords
DO $$
DECLARE
  admin_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  user_id uuid := 'b1ffcd00-0d1c-5f09-cc7e-7cca0e491b22';
BEGIN
  -- Try to update admin user
  UPDATE auth.users SET
    encrypted_password = crypt('admin111', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE email = 'admin@gmail.com';
  
  -- If admin doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'admin@gmail.com',
      crypt('admin111', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin GatePass","phone":"081111111111"}',
      false,
      'authenticated'
    );
  END IF;
  
  -- Try to update regular user
  UPDATE auth.users SET
    encrypted_password = crypt('user111', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE email = 'aldo@gmail.com';
  
  -- If user doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'aldo@gmail.com',
      crypt('user111', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"User GatePass","phone":"082222222222"}',
      false,
      'authenticated'
    );
  END IF;
END $$;

-- Ensure profiles exist with correct data
INSERT INTO profiles (id, name, phone, balance, is_admin, created_at)
SELECT id, 'Admin GatePass', '081111111111', 0, true, NOW()
FROM auth.users WHERE email = 'admin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  name = 'Admin GatePass',
  phone = '081111111111',
  is_admin = true;

INSERT INTO profiles (id, name, phone, balance, is_admin, created_at)
SELECT id, 'User GatePass', '082222222222', 100000, false, NOW()
FROM auth.users WHERE email = 'aldo@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  name = 'User GatePass',
  phone = '082222222222',
  balance = 100000,
  is_admin = false;

-- Ensure parking locations exist
INSERT INTO parking_locations (name, address, hourly_rate, total_slots, available_slots, created_at)
VALUES 
  ('Mall Central Park', 'Jl. Letjen S. Parman, Jakarta Barat', 5000, 500, 342, NOW()),
  ('Grand Indonesia', 'Jl. MH Thamrin, Jakarta Pusat', 7000, 800, 156, NOW()),
  ('Plaza Indonesia', 'Jl. MH Thamrin Kav 1, Jakarta Pusat', 6000, 350, 89, NOW()),
  ('Senayan City', 'Jl. Asia Afrika, Jakarta Pusat', 5000, 450, 201, NOW()),
  ('Pondok Indah Mall', 'Jl. Metro Pondok Indah, Jakarta Selatan', 6000, 600, 412, NOW())
ON CONFLICT DO NOTHING;

-- Create vehicles for users if they don't exist
INSERT INTO vehicles (user_id, plate_number, type, created_at)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'aldo@gmail.com'),
  'B1234XYZ', 'motor', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM vehicles v 
  WHERE v.user_id = (SELECT id FROM auth.users WHERE email = 'aldo@gmail.com')
);

INSERT INTO vehicles (user_id, plate_number, type, created_at)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'admin@gmail.com'),
  'B5678ABC', 'mobil', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM vehicles v 
  WHERE v.user_id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com')
);