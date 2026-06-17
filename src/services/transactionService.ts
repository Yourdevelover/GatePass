import { supabase } from '../lib/supabase';
import { Transaction, TopUp } from '../types';

export interface TransactionDB {
  id: string;
  user_id: string;
  vehicle_id: string;
  parking_session_id: string;
  amount: number;
  payment_method: 'nfc' | 'qr' | 'ewallet' | 'debit' | 'credit';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface TopUpDB {
  id: string;
  user_id: string;
  amount: number;
  method: 'bank_transfer' | 'debit' | 'credit' | 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export const createTransaction = async (
  userId: string,
  vehicleId: string,
  parkingSessionId: string,
  amount: number,
  paymentMethod: Transaction['paymentMethod']
): Promise<{ success: boolean; error?: string; transaction?: Transaction }> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        vehicle_id: vehicleId,
        parking_session_id: parkingSessionId,
        amount,
        payment_method: paymentMethod,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const transaction: Transaction = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      parkingSessionId: data.parking_session_id,
      amount: Number(data.amount),
      paymentMethod: data.payment_method,
      status: data.status,
      createdAt: data.created_at
    };

    return { success: true, transaction };
  } catch {
    return { success: false, error: 'Gagal membuat transaksi' };
  }
};

export const getTransactionsByUser = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
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

export const createTopUp = async (
  userId: string,
  amount: number,
  method: TopUp['method']
): Promise<{ success: boolean; error?: string; topup?: TopUp }> => {
  try {
    // Insert topup record
    const { data, error } = await supabase
      .from('topups')
      .insert({
        user_id: userId,
        amount,
        method,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Get current balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    const currentBalance = profile?.balance || 0;
    const newBalance = Number(currentBalance) + amount;

    // Update user balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const topup: TopUp = {
      id: data.id,
      userId: data.user_id,
      amount: Number(data.amount),
      method: data.method,
      status: data.status,
      createdAt: data.created_at
    };

    return { success: true, topup };
  } catch {
    return { success: false, error: 'Gagal melakukan top up' };
  }
};

export const getTopUpsByUser = async (userId: string): Promise<TopUp[]> => {
  const { data, error } = await supabase
    .from('topups')
    .select('*')
    .eq('user_id', userId)
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
