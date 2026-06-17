import { supabase } from '../lib/supabase';
import { Vehicle, VehicleType } from '../types';

export interface VehicleDB {
  id: string;
  user_id: string;
  plate_number: string;
  type: VehicleType;
  created_at: string;
}

export const getUserVehicles = async (userId: string): Promise<Vehicle[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(v => ({
    id: v.id,
    userId: v.user_id,
    plateNumber: v.plate_number,
    type: v.type,
    createdAt: v.created_at
  }));
};

export const addVehicle = async (
  userId: string,
  plateNumber: string,
  type: VehicleType
): Promise<{ success: boolean; error?: string; vehicle?: Vehicle }> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: userId,
        plate_number: plateNumber.toUpperCase(),
        type
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Plat nomor sudah terdaftar' };
      }
      return { success: false, error: error.message };
    }

    const vehicle: Vehicle = {
      id: data.id,
      userId: data.user_id,
      plateNumber: data.plate_number,
      type: data.type,
      createdAt: data.created_at
    };

    return { success: true, vehicle };
  } catch {
    return { success: false, error: 'Gagal menambahkan kendaraan' };
  }
};

export const removeVehicle = async (
  userId: string,
  vehicleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Gagal menghapus kendaraan' };
  }
};

export const getVehicleById = async (vehicleId: string): Promise<Vehicle | null> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    plateNumber: data.plate_number,
    type: data.type,
    createdAt: data.created_at
  };
};
