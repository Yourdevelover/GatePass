import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllUsers,
  getAllParkingLocations,
  getAllTransactions,
  getAllTopUps,
  getAllParkingSessions,
  addParkingLocation,
  updateParkingLocation,
  getAdminStats,
  AdminUser,
  AdminStats
} from '../services/adminService';
import { ParkingLocation, Transaction, TopUp, ParkingSession } from '../types';
import {
  Shield,
  Users,
  Car,
  MapPin,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  Search,
  Plus,
  X,
  Bike,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ParkingCircle,
  ParkingMeter,
  ChevronRight,
  Zap,
  Building2,
  CreditCard,
  Smartphone,
  Edit2,
  Save,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

type AdminTab = 'overview' | 'locations' | 'users' | 'transactions';

export const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', hourlyRate: 0, totalSlots: 0 });
  const [editLocationData, setEditLocationData] = useState<Partial<ParkingLocation>>({});

  useEffect(() => {
    if (user && user.isAdmin) {
      loadAdminData();
    } else if (user && !user.isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersData, locationsData, transactionsData, topUpsData, sessionsData, statsData] = await Promise.all([
        getAllUsers(),
        getAllParkingLocations(),
        getAllTransactions(),
        getAllTopUps(),
        getAllParkingSessions(),
        getAdminStats()
      ]);
      setUsers(usersData);
      setLocations(locationsData);
      setTransactions(transactionsData);
      setTopUps(topUpsData);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-200 dark:border-amber-900 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Memuat admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Anda tidak memiliki akses ke dashboard admin</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery));

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.address || !newLocation.hourlyRate || !newLocation.totalSlots) return;
    const result = await addParkingLocation(newLocation.name, newLocation.address, newLocation.hourlyRate, newLocation.totalSlots);
    if (result.success) {
      setShowAddLocation(false);
      setNewLocation({ name: '', address: '', hourlyRate: 0, totalSlots: 0 });
      loadAdminData();
    }
  };

  const handleUpdateLocation = async (locationId: string) => {
    const result = await updateParkingLocation(locationId, editLocationData);
    if (result.success) {
      setEditingLocation(null);
      setEditLocationData({});
      loadAdminData();
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'motor': return <Bike className="w-4 h-4" />;
      case 'mobil': return <Car className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'nfc': return <Zap className="w-4 h-4" />;
      case 'qr': return <Smartphone className="w-4 h-4" />;
      case 'ewallet': return <Wallet className="w-4 h-4" />;
      case 'debit': case 'credit': return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <Building2 className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Admin Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white">GatePass</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 dark:text-white truncate">{user.name}</p>
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Shield className="w-3 h-3" /> Administrator
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'locations', icon: MapPin, label: 'Lokasi Parkir' },
            { id: 'users', icon: Users, label: 'Pengguna' },
            { id: 'transactions', icon: Activity, label: 'Transaksi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{resolvedTheme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'locations' && 'Kelola Lokasi Parkir'}
              {activeTab === 'users' && 'Kelola Pengguna'}
              {activeTab === 'transactions' && 'Riwayat Transaksi'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">GatePass Management System</p>
          </div>
          <p className="font-medium text-slate-800 dark:text-white">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: 'from-emerald-500 to-teal-600' },
                { icon: TrendingUp, label: 'Total Top Up', value: formatCurrency(stats.totalTopUp), color: 'from-blue-500 to-indigo-600' },
                { icon: Users, label: 'Total Users', value: stats.totalUsers.toString(), color: 'from-amber-500 to-orange-600' },
                { icon: ParkingCircle, label: 'Okupansi', value: `${stats.occupancyRate}%`, color: 'from-purple-500 to-pink-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Transaksi Terbaru</h3>
                {transactions.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Belum ada transaksi</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((txn) => {
                      const txnUser = users.find(u => u.id === txn.userId);
                      return (
                        <div key={txn.id} className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                            {txnUser?.name.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 dark:text-white">{txnUser?.name || 'Unknown'}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{txn.paymentMethod.toUpperCase()}</p>
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(txn.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Sesi Parkir Aktif</h3>
                  <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-2 py-1 rounded text-sm font-medium">
                    {sessions.filter(s => s.status === 'active').length} aktif
                  </span>
                </div>
                {sessions.filter(s => s.status === 'active').length === 0 ? (
                  <div className="text-center py-8">
                    <ParkingMeter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">Tidak ada sesi aktif</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.filter(s => s.status === 'active').slice(0, 5).map((s) => {
                      const sessionUser = users.find(u => u.id === s.userId);
                      const sessionLocation = locations.find(l => l.id === s.locationId);
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50">
                          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 dark:text-white">{sessionUser?.name || 'Unknown'}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{sessionLocation?.name || 'Unknown'}</p>
                          </div>
                          <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Active</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Ringkasan Hari Ini</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center border border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Pendapatan</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.todayRevenue)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-900/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Transaksi</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.todayTransactions}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center border border-amber-100 dark:border-amber-900/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Slot Tersedia</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.availableSlots}/{stats.totalSlots}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daftar Lokasi Parkir</h2>
              <button onClick={() => setShowAddLocation(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700">
                <Plus className="w-4 h-4" /> Tambah Lokasi
              </button>
            </div>

            <div className="grid gap-4">
              {locations.map((loc) => {
                const occupancy = Math.round(((loc.totalSlots - loc.availableSlots) / loc.totalSlots) * 100);
                const isEditing = editingLocation === loc.id;

                return (
                  <div key={loc.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <input value={editLocationData.name || loc.name} onChange={(e) => setEditLocationData({ ...editLocationData, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                          <input value={editLocationData.address || loc.address} onChange={(e) => setEditLocationData({ ...editLocationData, address: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                          <input type="number" value={editLocationData.hourlyRate || loc.hourlyRate} onChange={(e) => setEditLocationData({ ...editLocationData, hourlyRate: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                          <input type="number" value={editLocationData.availableSlots || loc.availableSlots} onChange={(e) => setEditLocationData({ ...editLocationData, availableSlots: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateLocation(loc.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm"> <Save className="w-3 h-3" /> Simpan </button>
                          <button onClick={() => { setEditingLocation(null); setEditLocationData({}); }} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">{loc.name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{loc.address}</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(loc.hourlyRate)}/jam</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Okupansi</p>
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                              <div className={`h-full rounded-full ${occupancy < 70 ? 'bg-emerald-500' : occupancy < 90 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${occupancy}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{loc.availableSlots}/{loc.totalSlots} slot</p>
                          </div>
                          <button onClick={() => { setEditingLocation(loc.id); setEditLocationData({}); }} className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daftar Pengguna</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="Cari nama atau telepon..." />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Phone</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Balance</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Vehicles</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">{u.name.charAt(0).toUpperCase()}</div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{u.phone}</td>
                      <td className="px-4 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(u.balance)}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {u.vehicles.slice(0, 3).map((v) => (
                            <span key={v.id} className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-600 dark:text-slate-400">{getVehicleTypeIcon(v.type)}</span>
                          ))}
                          {u.vehicles.length === 0 && <span className="text-xs text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full font-medium"><Shield className="w-3 h-3" /> Admin</span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">User</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Transaksi</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownLeft className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-400 font-medium">Total Pembayaran</span>
                </div>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}</p>
                <p className="text-xs text-red-600/60 dark:text-red-400/60 mt-1">{transactions.length} transaksi</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Total Top Up</span>
                </div>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(topUps.reduce((sum, t) => sum + t.amount, 0))}</p>
                <p className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mt-1">{topUps.length} top up</p>
              </div>
            </div>
            <div className="space-y-2">
              {[...transactions.map(t => ({ ...t, type: 'parking' as const })), ...topUps.map(t => ({ ...t, type: 'topup' as const }))]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 30)
                .map((item) => {
                  const txnUser = users.find(u => u.id === item.userId);
                  return (
                    <div key={`${item.type}-${item.id}`} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'parking' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        {getMethodIcon(item.type === 'parking' ? (item as Transaction).paymentMethod : (item as TopUp).method)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 dark:text-white">{txnUser?.name || 'Unknown'}</p>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold uppercase ${item.type === 'parking' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                            {item.type === 'parking' ? 'Parkir' : 'Top Up'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)} {formatTime(item.createdAt)}</p>
                      </div>
                      <span className={`text-sm font-bold ${item.type === 'parking' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {item.type === 'parking' ? '-' : '+'}{formatCurrency(item.amount)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
          )}
        </main>

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Lokasi Parkir</h3>
              <button onClick={() => setShowAddLocation(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="Nama lokasi" />
              <input value={newLocation.address} onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="Alamat" />
              <input type="number" value={newLocation.hourlyRate || ''} onChange={(e) => setNewLocation({ ...newLocation, hourlyRate: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="Tarif per jam" />
              <input type="number" value={newLocation.totalSlots || ''} onChange={(e) => setNewLocation({ ...newLocation, totalSlots: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" placeholder="Jumlah slot" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddLocation(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium">Batal</button>
              <button onClick={handleAddLocation} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium">Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};