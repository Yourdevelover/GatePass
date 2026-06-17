import { supabase } from '../lib/supabase';
import { ParkingLocation, ParkingSession } from '../types';

export interface ParkingLocationDB {
  id: string;
  name: string;
  address: string;
  hourly_rate: number;
  total_slots: number;
  available_slots: number;
  created_at: string;
}

export interface ParkingSessionDB {
  id: string;
  user_id: string;
  vehicle_id: string;
  location_id: string;
  entry_time: string;
  exit_time: string | null;
  fee: number | null;
  status: 'active' | 'completed';
  created_at: string;
}

export const getParkingLocations = async (): Promise<ParkingLocation[]> => {
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

export const getParkingLocationById = async (id: string): Promise<ParkingLocation | null> => {
  const { data, error } = await supabase
    .from('parking_locations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    hourlyRate: Number(data.hourly_rate),
    totalSlots: data.total_slots,
    availableSlots: data.available_slots
  };
};

export const updateParkingLocationSlots = async (
  locationId: string,
  availableSlots: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('parking_locations')
      .update({ available_slots: availableSlots })
      .eq('id', locationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Gagal memperbarui slot parkir' };
  }
};

export const createParkingSession = async (
  userId: string,
  vehicleId: string,
  locationId: string,
  entryTime: string
): Promise<{ success: boolean; error?: string; session?: ParkingSession }> => {
  try {
    const { data, error } = await supabase
      .from('parking_sessions')
      .insert({
        user_id: userId,
        vehicle_id: vehicleId,
        location_id: locationId,
        entry_time: entryTime,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const session: ParkingSession = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      locationId: data.location_id,
      entryTime: data.entry_time,
      exitTime: data.exit_time,
      fee: data.fee ? Number(data.fee) : null,
      status: data.status
    };

    return { success: true, session };
  } catch {
    return { success: false, error: 'Gagal membuat sesi parkir' };
  }
};

export const completeParkingSession = async (
  sessionId: string,
  exitTime: string,
  fee: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('parking_sessions')
      .update({
        exit_time: exitTime,
        fee,
        status: 'completed'
      })
      .eq('id', sessionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Gagal menyelesaikan sesi parkir' };
  }
};

export const getActiveSessionsByUser = async (userId: string): Promise<ParkingSession[]> => {
  const { data, error } = await supabase
    .from('parking_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('entry_time', { ascending: false });

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

export const getParkingSessionsByUser = async (userId: string): Promise<ParkingSession[]> => {
  const { data, error } = await supabase
    .from('parking_sessions')
    .select('*')
    .eq('user_id', userId)
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

export const getParkingSessionById = async (sessionId: string): Promise<ParkingSession | null> => {
  const { data, error } = await supabase
    .from('parking_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    vehicleId: data.vehicle_id,
    locationId: data.location_id,
    entryTime: data.entry_time,
    exitTime: data.exit_time,
    fee: data.fee ? Number(data.fee) : null,
    status: data.status
  };
};
