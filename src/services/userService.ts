import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string;
  phone: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone, balance, is_admin, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[userService] fetchProfile error:', error.message);
      return null;
    }

    return data as Profile | null;
  } catch (err) {
    console.error('[userService] fetchProfile exception:', err);
    return null;
  }
};

const createProfile = async (userId: string, name: string, phone: string): Promise<Profile | null> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({ id: userId, name, phone, balance: 0, is_admin: false });

    if (error) {
      console.error('[userService] createProfile error:', error.message);
    }

    await new Promise(r => setTimeout(r, 500));
    return await fetchProfile(userId);
  } catch (err) {
    console.error('[userService] createProfile exception:', err);
    return await fetchProfile(userId);
  }
};

const getOrCreateProfile = async (userId: string, email: string | undefined, metadata: Record<string, unknown> | undefined): Promise<Profile | null> => {
  let profile = await fetchProfile(userId);

  if (!profile) {
    const name = (metadata?.name as string) || email?.split('@')[0] || '';
    const phone = (metadata?.phone as string) || '';
    profile = await createProfile(userId, name, phone);
  }

  return profile;
};

export const signUp = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Email sudah terdaftar' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Gagal membuat akun' };
    }

    await new Promise(r => setTimeout(r, 500));

    const profile = await getOrCreateProfile(data.user.id, data.user.email, data.user.user_metadata);

    if (profile) {
      await supabase.from('profiles').update({ name, phone }).eq('id', data.user.id);
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || email,
      name: profile?.name || name,
      phone: profile?.phone || phone,
      balance: Number(profile?.balance) || 0,
      is_admin: profile?.is_admin ?? false,
      created_at: profile?.created_at || new Date().toISOString()
    };

    return { success: true, user };
  } catch (err) {
    console.error('[userService] signUp exception:', err);
    return { success: false, error: 'Terjadi kesalahan saat mendaftar' };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Email atau password salah' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Login gagal' };
    }

    await new Promise(r => setTimeout(r, 300));

    const profile = await getOrCreateProfile(data.user.id, data.user.email, data.user.user_metadata);

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || '',
      name: profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
      phone: profile?.phone || data.user.user_metadata?.phone || '',
      balance: Number(profile?.balance) || 0,
      is_admin: profile?.is_admin ?? false,
      created_at: profile?.created_at || new Date().toISOString()
    };

    return { success: true, user };
  } catch (err) {
    console.error('[userService] signIn exception:', err);
    return { success: false, error: 'Terjadi kesalahan saat login' };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[userService] signOut error:', err);
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return null;

    const profile = await getOrCreateProfile(session.user.id, session.user.email, session.user.user_metadata);

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
      phone: profile?.phone || session.user.user_metadata?.phone || '',
      balance: Number(profile?.balance) || 0,
      is_admin: profile?.is_admin ?? false,
      created_at: profile?.created_at || new Date().toISOString()
    };
  } catch (err) {
    console.error('[userService] getCurrentUser exception:', err);
    return null;
  }
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<Profile, 'name' | 'phone'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal memperbarui profil' };
  }
};

export const updateBalance = async (
  userId: string,
  newBalance: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal memperbarui saldo' };
  }
};

export const changePassword = async (
  _oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.message.includes('different from the old')) {
        return { success: false, error: 'Password baru harus berbeda dari password lama' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal mengubah password' };
  }
};
