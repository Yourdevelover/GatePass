import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactionsByUser, getTopUpsByUser } from '../services/transactionService';
import {
  History as HistoryIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Car,
  MapPin,
  Receipt,
  Wallet
} from 'lucide-react';

type TabType = 'all' | 'parking' | 'topup';

interface Activity {
  id: string;
  type: 'parking' | 'topup';
  date: string;
  amount: number;
  paymentMethod?: string;
  method?: string;
  status: string;
}

export const History: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [transactions, topUps] = await Promise.all([
      getTransactionsByUser(user.id),
      getTopUpsByUser(user.id)
    ]);

    const allActivities: Activity[] = [
      ...transactions.map((t) => ({
        id: t.id,
        type: 'parking' as const,
        date: t.createdAt,
        amount: t.amount,
        paymentMethod: t.paymentMethod,
        status: t.status,
      })),
      ...topUps.map((t) => ({
        id: t.id,
        type: 'topup' as const,
        date: t.createdAt,
        amount: t.amount,
        method: t.method,
        status: t.status,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setActivities(allActivities);
  };

  if (!user) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredActivities = activeTab === 'all'
    ? activities
    : activities.filter((a) => a.type === activeTab);

  const parkingCount = activities.filter(a => a.type === 'parking').length;
  const topupCount = activities.filter(a => a.type === 'topup').length;

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: activities.length },
    { id: 'parking', label: 'Parkir', count: parkingCount },
    { id: 'topup', label: 'Top Up', count: topupCount },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat Transaksi</h1>
          <p className="text-slate-500 dark:text-slate-400">Semua aktivitas akun Anda</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all ${
            showFilters
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Belum Ada Transaksi</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {activeTab === 'parking' && 'Mulai parkir untuk melihat riwayat transaksi'}
            {activeTab === 'topup' && 'Lakukan top up untuk melihat riwayat saldo'}
            {activeTab === 'all' && 'Aktivitas Anda akan muncul di sini'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={`${activity.type}-${activity.id}`} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {activity.type === 'parking' ? (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowDownLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-white">Pembayaran Parkir</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(activity.date)} · {formatTime(activity.date)}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          -{formatCurrency(activity.amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>Lokasi Parkir</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Car className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>Kendaraan</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Receipt className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="uppercase">{activity.paymentMethod}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            activity.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}>
                            {activity.status === 'completed' ? 'Selesai' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-white">Top Up Saldo</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(activity.date)} · {formatTime(activity.date)}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(activity.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Wallet className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="capitalize">{activity.method?.replace('_', ' ')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {activity.status === 'completed' ? 'Selesai' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Parkir</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {formatCurrency(activities.filter(a => a.type === 'parking').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Top Up</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {formatCurrency(activities.filter(a => a.type === 'topup').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
