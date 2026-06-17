import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addVehicle, removeVehicle, getUserVehicles } from '../services/vehicleService';
import { VehicleType, Vehicle } from '../types';
import {
  User,
  Mail,
  Phone,
  Car,
  Truck,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  Calendar,
  Bike
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUserData, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<'info' | 'vehicles' | 'security'>('info');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plateNumber: '', type: 'motor' as VehicleType });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localVehicles, setLocalVehicles] = useState<Vehicle[] | null>(null);

  // Use local vehicles if available, otherwise use user vehicles
  const vehicles = localVehicles !== null ? localVehicles : (user?.vehicles || []);

  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.plateNumber.trim()) return;

    const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
    if (!plateRegex.test(newVehicle.plateNumber.replace(/\s/g, ''))) {
      setError('Format plat nomor tidak valid (contoh: B 1234 ABC)');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await addVehicle(user.id, newVehicle.plateNumber, newVehicle.type);

    if (result.success && result.vehicle) {
      // Optimistically add to local state
      setLocalVehicles([...vehicles, result.vehicle]);
      setNewVehicle({ plateNumber: '', type: 'motor' });
      setShowAddVehicle(false);
      setSuccess('Kendaraan berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
      // Sync with auth context in background
      updateUserData().catch(() => {});
    } else {
      setError(result.error || 'Gagal menambahkan kendaraan');
    }

    setIsLoading(false);
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kendaraan ini?')) {
      setIsLoading(true);
      const result = await removeVehicle(user.id, vehicleId);
      if (result.success) {
        // Optimistically remove from local state
        setLocalVehicles(vehicles.filter(v => v.id !== vehicleId));
        setSuccess('Kendaraan berhasil dihapus');
        setTimeout(() => setSuccess(''), 3000);
        // Sync with auth context in background
        updateUserData().catch(() => {});
      } else {
        setError(result.error || 'Gagal menghapus kendaraan');
      }
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');

    if (passwords.new.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    const result = await changePassword(passwords.old, passwords.new);
    if (result.success) {
      setShowChangePassword(false);
      setPasswords({ old: '', new: '', confirm: '' });
      setSuccess('Password berhasil diubah');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Gagal mengubah password');
    }
    setIsLoading(false);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motor':
        return <Bike className="w-6 h-6" />;
      case 'mobil':
        return <Car className="w-6 h-6" />;
      case 'truk':
        return <Truck className="w-6 h-6" />;
      default:
        return <Car className="w-6 h-6" />;
    }
  };

  const sections = [
    { id: 'info', label: 'Info Pribadi', icon: User },
    { id: 'vehicles', label: 'Kendaraan', icon: Car },
    { id: 'security', label: 'Keamanan', icon: Lock },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profil</h1>
        <p className="text-slate-500 dark:text-slate-400">Kelola informasi akun Anda</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2 animate-fade-in">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/25">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            {user.isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <Shield className="w-3 h-3" /> Administrator
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Member sejak</p>
            <p className="font-medium text-slate-800 dark:text-white">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id as typeof activeSection);
              setError('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <section.icon className="w-5 h-5" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Personal Info Section */}
      {activeSection === 'info' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-6">Informasi Pribadi</h3>

          <div className="space-y-4">
            {[
              { icon: User, color: 'emerald', label: 'Nama Lengkap', value: user.name },
              { icon: Mail, color: 'blue', label: 'Email', value: user.email },
              { icon: Phone, color: 'purple', label: 'Nomor HP', value: user.phone },
              { icon: Calendar, color: 'amber', label: 'Tanggal Bergabung', value: formatDate(user.createdAt) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className={`w-10 h-10 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="font-medium text-slate-800 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles Section */}
      {activeSection === 'vehicles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white">Kendaraan Terdaftar</h3>
              <button
                onClick={() => {
                  setShowAddVehicle(true);
                  setError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-2">Belum ada kendaraan terdaftar</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Tambahkan kendaraan untuk menggunakan layanan parkir</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                      {getVehicleIcon(vehicle.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 dark:text-white">{vehicle.plateNumber}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{vehicle.type}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveVehicle(vehicle.id)}
                      disabled={isLoading}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Vehicle Modal */}
          {showAddVehicle && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Kendaraan</h3>
                  <button onClick={() => setShowAddVehicle(false)} disabled={isLoading} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Plat Nomor
                    </label>
                    <input
                      type="text"
                      value={newVehicle.plateNumber}
                      onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white uppercase focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="B 1234 ABC"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Jenis Kendaraan
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['motor', 'mobil', 'truk'] as VehicleType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewVehicle({ ...newVehicle, type })}
                          disabled={isLoading}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            newVehicle.type === type
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            newVehicle.type === type ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {getVehicleIcon(type)}
                          </div>
                          <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddVehicle(false)}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddVehicle}
                    disabled={!newVehicle.plateNumber.trim() || isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:from-slate-400 disabled:to-slate-400 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-6">Keamanan Akun</h3>

          <div className="space-y-4">
            <button
              onClick={() => {
                setShowChangePassword(true);
                setError('');
              }}
              className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left border border-slate-100 dark:border-slate-700"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-white">Ubah Password</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ganti password akun Anda</p>
              </div>
              <Edit2 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </button>
          </div>

          {/* Change Password Modal */}
          {showChangePassword && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ubah Password</h3>
                  <button onClick={() => setShowChangePassword(false)} disabled={isLoading} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password Lama
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.old}
                      onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        placeholder="Minimal 6 karakter"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowChangePassword(false)}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={!passwords.old || !passwords.new || !passwords.confirm || isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:from-slate-400 disabled:to-slate-400 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
