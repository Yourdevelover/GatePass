import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getParkingLocations, createParkingSession, completeParkingSession } from '../services/parkingService';
import { createTransaction } from '../services/transactionService';
import { updateBalance } from '../services/userService';
import { ParkingLocation } from '../types';
import {
  QrCode,
  MapPin,
  Car,
  Clock,
  X,
  ArrowRight,
  CreditCard,
  Receipt,
  Zap,
  Nfc,
  CheckCircle2
} from 'lucide-react';

type Step = 'ready' | 'nfc-tap' | 'qr-scan' | 'processing' | 'success';

const simulateNFCReader = (locations: ParkingLocation[]): { locationId: string; entryTime: string } => {
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const hoursAgo = Math.floor(Math.random() * 4) + 1;
  const entryTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  return { locationId: randomLocation.id, entryTime };
};

const simulateQRScan = (locations: ParkingLocation[]): { locationId: string; entryTime: string } => {
  return simulateNFCReader(locations);
};

export const Parking: React.FC = () => {
  const { user, updateUserData, updateUserBalance } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('ready');
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [paymentResult, setPaymentResult] = useState<{
    location: ParkingLocation;
    entryTime: string;
    exitTime: string;
    duration: number;
    fee: number;
    method: string;
    transactionId: string;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [localBalance, setLocalBalance] = useState<number | null>(null);

  useEffect(() => {
    getParkingLocations().then(setLocations);
  }, []);

  if (!user) return null;

  // Use local balance for instant UI update
  const currentBalance = localBalance !== null ? localBalance : user.balance;

  if (user.vehicles.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center shadow-sm">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-2">Tambahkan Kendaraan</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-6">Daftarkan kendaraan Anda terlebih dahulu untuk menggunakan pembayaran parkir</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
          >
            Tambah Kendaraan
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayment = async (method: 'nfc' | 'qr') => {
    setStep(method === 'nfc' ? 'nfc-tap' : 'qr-scan');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep('processing');

    const detected = method === 'nfc' ? simulateNFCReader(locations) : simulateQRScan(locations);
    const location = locations.find(l => l.id === detected.locationId);

    if (!location) {
      setStep('ready');
      return;
    }

    const entryTime = new Date(detected.entryTime);
    const exitTime = new Date();
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const fee = durationHours * location.hourlyRate;

    if (user.balance < fee) {
      setStep('ready');
      alert('Saldo tidak mencukupi. Silakan top up terlebih dahulu.');
      return;
    }

    // Optimistic update - deduct balance immediately
    setLocalBalance(user.balance - fee);
    if (updateUserBalance) {
      updateUserBalance(-fee);
    }

    // Show success immediately with temp ID
    const tempTransactionId = `temp-${Date.now()}`;
    setPaymentResult({
      location,
      entryTime: detected.entryTime,
      exitTime: exitTime.toISOString(),
      duration: durationHours,
      fee,
      method: method.toUpperCase(),
      transactionId: tempTransactionId,
    });
    setStep('success');

    // Actually process the payment in database
    try {
      const sessionResult = await createParkingSession(
        user.id,
        user.vehicles[0].id,
        location.id,
        detected.entryTime
      );

      if (!sessionResult.success || !sessionResult.session) {
        throw new Error('Failed to create session');
      }

      await completeParkingSession(sessionResult.session.id, exitTime.toISOString(), fee);

      const transactionResult = await createTransaction(
        user.id,
        user.vehicles[0].id,
        sessionResult.session.id,
        fee,
        method
      );

      if (transactionResult.success && transactionResult.transaction) {
        // Update with real transaction ID
        setPaymentResult(prev => prev ? { ...prev, transactionId: transactionResult.transaction!.id } : null);
      }

      // Update balance in database
      await updateBalance(user.id, user.balance - fee);

      // Sync balance
      await updateUserData();
    } catch (err) {
      console.error('Parking payment error:', err);
      // Rollback - restore balance
      setLocalBalance(null);
      if (updateUserBalance) {
        updateUserBalance(fee);
      }
      setStep('ready');
      alert('Terjadi kesalahan saat memproses pembayaran');
    }
  };

  const reset = () => {
    setStep('ready');
    setPaymentResult(null);
    setShowReceipt(false);
    setLocalBalance(null);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Ready State */}
      {step === 'ready' && (
        <div className="space-y-6">
          {/* Balance Display */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl blur-2xl opacity-50 dark:opacity-30" />
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">GatePass</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Saldo Anda</p>
                  <p className="text-xl font-bold">{formatCurrency(currentBalance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm relative z-['dark:text-slate-500']">
                <Car className="w-4 h-4" />
                <span>{user.vehicles[0]?.plateNumber || '-'}</span>
              </div>
            </div>
          </div>

          {/* Main Pay Button */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-6">
              Bayar Parkir
            </h2>

            <div className="grid gap-4">
              {/* NFC Option */}
              <button
                onClick={() => handlePayment('nfc')}
                className="relative w-full p-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden group hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                      <Nfc className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Tap NFC</p>
                      <p className="text-blue-200 text-sm">Tempelkan HP ke mesin</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-200" />
                </div>
              </button>

              {/* QR Option */}
              <button
                onClick={() => handlePayment('qr')}
                className="relative w-full p-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white overflow-hidden group hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Scan QR Code</p>
                      <p className="text-purple-200 text-sm">Scan QR di gerbang keluar</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-purple-200" />
                </div>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              <span className="font-medium">Cara pakai:</span> Saat keluar parkir, tap NFC atau scan QR Code di mesin gerbang. Pembayaran otomatis dipotong dari saldo.
            </p>
          </div>
        </div>
      )}

      {/* NFC Tapping Animation */}
      {step === 'nfc-tap' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Nfc className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Mendeteksi NFC...</h3>
          <p className="text-slate-500 dark:text-slate-400">Tempelkan HP ke mesin reader</p>
        </div>
      )}

      {/* QR Scanning Animation */}
      {step === 'qr-scan' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-600 dark:border-purple-400 rounded-tl-xl animate-pulse" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-600 dark:border-purple-400 rounded-tr-xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-600 dark:border-purple-400 rounded-bl-xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-600 dark:border-purple-400 rounded-br-xl animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-20 h-20 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="w-full h-1 bg-purple-500 dark:bg-purple-400 animate-bounce absolute" style={{ top: '50%' }} />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Scanning QR Code...</h3>
          <p className="text-slate-500 dark:text-slate-400">Arahkan kamera ke QR Code</p>
        </div>
      )}

      {/* Processing Animation */}
      {step === 'processing' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
          <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Memproses Pembayaran...</h3>
          <p className="text-slate-500 dark:text-slate-400">Mohon tunggu sebentar</p>
        </div>
      )}

      {/* Success */}
      {step === 'success' && paymentResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 border border-white/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold mb-1 relative z-10">Berhasil!</h3>
              <p className="text-emerald-100 relative z-10">Pembayaran parkir berhasil</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Bayar</p>
                <p className="text-4xl font-bold text-slate-800 dark:text-white">{formatCurrency(paymentResult.fee)}</p>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  { icon: MapPin, label: 'Lokasi', value: paymentResult.location.name },
                  { icon: Clock, label: 'Durasi', value: `${paymentResult.duration} jam` },
                  { icon: CreditCard, label: 'Metode', value: paymentResult.method },
                  { icon: Car, label: 'Kendaraan', value: user.vehicles[0]?.plateNumber },
                  { icon: Receipt, label: 'ID Transaksi', value: paymentResult.transactionId, mono: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                    <item.icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400 flex-1">{item.label}</span>
                    <span className={`font-semibold text-slate-800 dark:text-white ${item.mono ? 'font-mono text-xs' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400">Saldo Tersisa</span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(currentBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowReceipt(true)}
              className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              Struk
            </button>
            <button
              onClick={reset}
              className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && paymentResult && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6" />
                <span className="font-bold">GatePass</span>
              </div>
              <button onClick={() => setShowReceipt(false)} className="hover:opacity-80 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Struk Digital</p>
                <div className="inline-block p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-32 h-32 bg-slate-800 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-white dark:text-slate-300" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Lokasi</span>
                  <span className="font-medium text-slate-800 dark:text-white">{paymentResult.location.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Masuk</span>
                  <span className="font-medium text-slate-800 dark:text-white">{new Date(paymentResult.entryTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Keluar</span>
                  <span className="font-medium text-slate-800 dark:text-white">{new Date(paymentResult.exitTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Kendaraan</span>
                  <span className="font-medium text-slate-800 dark:text-white uppercase">{user.vehicles[0]?.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Metode</span>
                  <span className="font-medium text-slate-800 dark:text-white">{paymentResult.method}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Total</span>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(paymentResult.fee)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowReceipt(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
