import { supabase } from '../lib/supabase';
import { ParkingLocation, ParkingSession, Transaction, TopUp, Vehicle } from '../types';

// Admin service - separate from user services
// All functions here require admin privileges

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
  vehicles: Vehicle[];
}

export interface AdminStats {
  totalRevenue: number;
  totalTopUp: number;
  todayRevenue: number;
  todayTransactions: number;
  activeSessions: number;
  totalUsers: number;
  totalSlots: number;
  availableSlots: number;
  occupancyRate: number;
}

// Check if current user is admin
export const checkAdminRole = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.is_admin;
};

// Get all users with their vehicles
export const getAllUsers = async (): Promise<AdminUser[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !profiles) {
    return [];
  }

  // Get all vehicles
  const { data: allVehicles } = await supabase
    .from('vehicles')
    .select('*');

  // Get emails from auth users (via edge function or admin API)
  // For now, we'll use the email from the session

  return profiles.map(p => {
    const userVehicles = (allVehicles || [])
      .filter(v => v.user_id === p.id)
      .map(v => ({
        id: v.id,
        userId: v.user_id,
        plateNumber: v.plate_number,
        type: v.type,
        createdAt: v.created_at
      }));

    return {
      id: p.id,
      email: '', // Email is not accessible from profiles table
      name: p.name,
      phone: p.phone,
      balance: Number(p.balance),
      is_admin: p.is_admin,
      created_at: p.created_at,
      vehicles: userVehicles
    };
  });
};

// Get all parking locations
export const getAllParkingLocations = async (): Promise<ParkingLocation[]> => {
  const { data, error } = await supabase
    .from('parking_locations')
    .select('*')
    .order('name', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    hourlyRate: Number(loc.hourly_rate),
    totalSlots: loc.total_slots,
    availableSlots: loc.available_slots
  }));
};

// Update parking location (admin only)
export const updateParkingLocation = async (
  locationId: string,
  updates: Partial<Pick<ParkingLocation, 'name' | 'address' | 'hourlyRate' | 'totalSlots' | 'availableSlots'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate;
    if (updates.totalSlots !== undefined) updateData.total_slots = updates.totalSlots;
    if (updates.availableSlots !== undefined) updateData.available_slots = updates.availableSlots;

    const { error } = await supabase
      .from('parking_locations')
      .update(updateData)
      .eq('id', locationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Gagal memperbarui lokasi parkir' };
  }
};

// Add new parking location (admin only)
export const addParkingLocation = async (
  name: string,
  address: string,
  hourlyRate: number,
  totalSlots: number
): Promise<{ success: boolean; error?: string; location?: ParkingLocation }> => {
  try {
    const { data, error } = await supabase
      .from('parking_locations')
      .insert({
        name,
        address,
        hourly_rate: hourlyRate,
        total_slots: totalSlots,
        available_slots: totalSlots
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const location: ParkingLocation = {
      id: data.id,
      name: data.name,
      address: data.address,
      hourlyRate: Number(data.hourly_rate),
      totalSlots: data.total_slots,
      availableSlots: data.available_slots
    };

    return { success: true, location };
  } catch {
    return { success: false, error: 'Gagal menambahkan lokasi parkir' };
  }
};

// Get all transactions
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(t => ({
    id: t.id,
    userId: t.user_id,
    vehicleId: t.vehicle_id,
    parkingSessionId: t.parking_session_id,
    amount: Number(t.amount),
    paymentMethod: t.payment_method,
    status: t.status,
    createdAt: t.created_at
  }));
};

// Get all topups
export const getAllTopUps = async (): Promise<TopUp[]> => {
  const { data, error } = await supabase
    .from('topups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(t => ({
    id: t.id,
    userId: t.user_id,
    amount: Number(t.amount),
    method: t.method,
    status: t.status,
    createdAt: t.created_at
  }));
};

// Get all parking sessions
export const getAllParkingSessions = async (): Promise<ParkingSession[]> => {
  const { data, error } = await supabase
    .from('parking_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(s => ({
    id: s.id,
    userId: s.user_id,
    vehicleId: s.vehicle_id,
    locationId: s.location_id,
    entryTime: s.entry_time,
    exitTime: s.exit_time,
    fee: s.fee ? Number(s.fee) : null,
    status: s.status
  }));
};

// Get admin dashboard stats
export const getAdminStats = async (): Promise<AdminStats> => {
  const [transactions, topups, sessions, locations, users] = await Promise.all([
    getAllTransactions(),
    getAllTopUps(),
    getAllParkingSessions(),
    getAllParkingLocations(),
    getAllUsers()
  ]);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTopUp = topups.reduce((sum, t) => sum + t.amount, 0);

  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(
    t => new Date(t.createdAt).toDateString() === today
  );
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const totalSlots = locations.reduce((sum, l) => sum + l.totalSlots, 0);
  const availableSlots = locations.reduce((sum, l) => sum + l.availableSlots, 0);
  const occupancyRate = totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 0;

  return {
    totalRevenue,
    totalTopUp,
    todayRevenue,
    todayTransactions: todayTransactions.length,
    activeSessions,
    totalUsers: users.length,
    totalSlots,
    availableSlots,
    occupancyRate
  };
};

// Update user admin status
export const setUserAdminStatus = async (
  userId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Gagal memperbarui status admin' };
  }
};
