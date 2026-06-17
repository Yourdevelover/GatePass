import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActiveSessionsByUser } from '../services/parkingService';
import { getTransactionsByUser, getTopUpsByUser } from '../services/transactionService';
import { ParkingSession, Transaction, TopUp } from '../types';
import {
  Wallet,
  Car,
  Truck,
  History,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  MapPin,
  QrCode,
  Wifi,
  TrendingUp,
  Sparkles,
  Bike,
  Shield,
  Settings,
  Users,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentTopUps, setRecentTopUps] = useState<TopUp[]>([]);

  // Debug log
  useEffect(() => {
    console.log('[Dashboard] Current user:', user);
    console.log('[Dashboard] Is Admin:', user?.isAdmin);
  }, [user]);

  useEffect(() => {
    updateUserData();
  }, []);

  useEffect(() => {
    if (user && !user.isAdmin) {
      // Only fetch data for non-admin users
      getActiveSessionsByUser(user.id).then(setActiveSessions);
      getTransactionsByUser(user.id).then(t => setRecentTransactions(t.slice(0, 3)));
      getTopUpsByUser(user.id).then(t => setRecentTopUps(t.slice(0, 3)));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Memuat...</p>
        </div>
      </div>
    );
  }

  // Admin redirect - do this IMMEDIATELY, not in useEffect
  if (user.isAdmin) {
    console.log('[Dashboard] User is admin, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  // Regular user dashboard
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motor': return <Bike className="w-5 h-5" />;
      case 'mobil': return <Car className="w-5 h-5" />;
      case 'truk': return <Truck className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  const quickActions = [
    { to: '/topup', icon: Wallet, label: 'Top Up', color: 'from-blue-500 to-blue-600' },
    { to: '/parking', icon: QrCode, label: 'Bayar Parkir', color: 'from-emerald-500 to-teal-600' },
    { to: '/history', icon: History, label: 'Riwayat', color: 'from-amber-500 to-orange-500' },
    { to: '/profile', icon: Car, label: 'Kendaraan', color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Halo, <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Kelola parkir digital Anda</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-700">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Member Aktif</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-2xl opacity-30 dark:opacity-20" />
        <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-5 md:p-6 text-white shadow-xl shadow-emerald-500/20 dark:shadow-emerald-900/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300 rounded-full blur-2xl transform -translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4 md:mb-6">
              <div>
                <p className="text-emerald-100 text-sm mb-1">Saldo GatePass</p>
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {showBalance ? formatCurrency(user.balance) : 'Rp ••••••••'}
                  </h2>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-emerald-200 hover:text-white transition-colors"
                  >
                    {showBalance ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <Link
                to="/topup"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 md:px-4 py-2 rounded-xl transition-all border border-white/10 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Top Up</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">NFC Ready</p>
                  <p className="font-medium">Aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">QR Code</p>
                  <p className="font-medium">Tersedia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group"
          >
            <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-900/20 transition-all duration-300">
              <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Active Parking Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Parkir Aktif</h3>
                <p className="text-sm text-amber-100">Anda memiliki sesi parkir yang sedang berlangsung</p>
              </div>
            </div>
            <Link
              to="/parking"
              className="inline-flex items-center gap-2 text-white font-medium hover:text-amber-100 transition-colors"
            >
              Lihat Detail <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Vehicles */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">Kendaraan Terdaftar</h3>
          <Link
            to="/profile"
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Kelola <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {user.vehicles.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Belum ada kendaraan terdaftar</p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4" />
              Tambah Kendaraan
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {user.vehicles.map((vehicle) => (
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">Parkir Terakhir</h3>
            <Link
              to="/history"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Lihat Semua
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada transaksi parkir</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500 dark:text-red-400">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {txn.paymentMethod.toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(txn.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Top Ups */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">Top-Up Terakhir</h3>
            <Link
              to="/topup"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Top Up
            </Link>
          </div>

          {recentTopUps.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada riwayat top-up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTopUps.map((topup) => (
                <div key={topup.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {topup.method.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(topup.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(topup.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
