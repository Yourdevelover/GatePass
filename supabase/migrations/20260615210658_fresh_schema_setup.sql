-- GatePass Parking App Database Schema

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  balance numeric(15,2) NOT NULL DEFAULT 0,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  plate_number text NOT NULL,
  type text NOT NULL CHECK (type IN ('motor', 'mobil', 'truk')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plate_number)
);

-- Create parking_locations table
CREATE TABLE IF NOT EXISTS parking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  hourly_rate numeric(10,2) NOT NULL,
  total_slots integer NOT NULL,
  available_slots integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create parking_sessions table
CREATE TABLE IF NOT EXISTS parking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
  entry_time timestamptz NOT NULL,
  exit_time timestamptz,
  fee numeric(10,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  parking_session_id uuid NOT NULL REFERENCES parking_sessions(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('nfc', 'qr', 'ewallet', 'debit', 'credit')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create topups table
CREATE TABLE IF NOT EXISTS topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL,
  method text NOT NULL CHECK (method IN ('bank_transfer', 'debit', 'credit', 'gopay', 'ovo', 'dana', 'shopeepay')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topups ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Users can read own vehicles" ON vehicles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Parking locations policies (public read, admin write)
CREATE POLICY "Anyone can read parking locations" ON parking_locations FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert parking locations" ON parking_locations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update parking locations" ON parking_locations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Parking sessions policies
CREATE POLICY "Users can read own parking sessions" ON parking_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own parking sessions" ON parking_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parking sessions" ON parking_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Topups policies
CREATE POLICY "Users can read own topups" ON topups FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topups" ON topups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin policies for managing all data
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can read all parking sessions" ON parking_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can read all transactions" ON transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can read all topups" ON topups FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_user_id ON parking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_status ON parking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_topups_user_id ON topups(user_id);

-- Insert default parking locations
INSERT INTO parking_locations (name, address, hourly_rate, total_slots, available_slots) VALUES
  ('Mall Central Park', 'Jl. Letjen S. Parman, Jakarta', 5000, 500, 342),
  ('Grand Indonesia', 'Jl. MH Thamrin, Jakarta', 7000, 800, 156),
  ('Plaza Indonesia', 'Jl. MH Thamrin Kav 1, Jakarta', 6000, 350, 89),
  ('Senayan City', 'Jl. Asia Afrika, Jakarta', 5000, 450, 201),
  ('Pondok Indah Mall', 'Jl. Metro Pondok Indah, Jakarta', 6000, 600, 412)
ON CONFLICT DO NOTHING;

-- Function to handle new user signup (create profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, balance, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    0,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();