import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createTopUp, getTopUpsByUser } from '../services/transactionService';
import { TopUp as TopUpType } from '../types';
import {
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  Check,
  ArrowRight,
  History,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

const paymentMethods = [
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, banks: ['BCA', 'BNI', 'BRI', 'Mandiri'] },
  { id: 'debit', name: 'Kartu Debit', icon: CreditCard, banks: ['Visa', 'Mastercard'] },
  { id: 'credit', name: 'Kartu Kredit', icon: CreditCard, banks: ['Visa', 'Mastercard'] },
  { id: 'gopay', name: 'GoPay', icon: Smartphone, color: 'from-green-500 to-green-600' },
  { id: 'ovo', name: 'OVO', icon: Smartphone, color: 'from-purple-500 to-purple-600' },
  { id: 'dana', name: 'DANA', icon: Smartphone, color: 'from-blue-500 to-blue-600' },
  { id: 'shopeepay', name: 'ShopeePay', icon: Smartphone, color: 'from-orange-500 to-orange-600' },
] as const;

export const TopUp: React.FC = () => {
  const { user, updateUserData, updateUserBalance } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');
  const [topUpResult, setTopUpResult] = useState<TopUpType | null>(null);
  const [topUpHistory, setTopUpHistory] = useState<TopUpType[]>([]);
  const [localBalance, setLocalBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      getTopUpsByUser(user.id).then(setTopUpHistory);
    }
  }, [user]);

  if (!user) return null;

  // Use local balance for instant UI update
  const currentBalance = localBalance !== null ? localBalance : user.balance;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amt);
  };

  const handleQuickAmount = (amt: number) => {
    setAmount(amt);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numValue)) {
      setCustomAmount('');
      setAmount(0);
    } else {
      setCustomAmount(new Intl.NumberFormat('id-ID').format(numValue));
      setAmount(numValue);
    }
  };

  const handleContinue = () => {
    if (step === 'amount' && amount >= 10000) {
      setStep('method');
    } else if (step === 'method' && selectedMethod) {
      handleTopUp();
    }
  };

  const handleTopUp = async () => {
    setStep('processing');

    // Optimistic update - immediately show success with pending state
    const tempTopUp: TopUpType = {
      id: `temp-${Date.now()}`,
      userId: user.id,
      amount,
      method: selectedMethod as TopUpType['method'],
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Update local balance immediately
    setLocalBalance(currentBalance + amount);
    setTopUpResult(tempTopUp);
    setTopUpHistory(prev => [tempTopUp, ...prev]);

    // Actually create the topup in database
    const result = await createTopUp(user.id, amount, selectedMethod as TopUpType['method']);

    if (result.success && result.topup) {
      // Replace temp with real data
      setTopUpResult(result.topup);
      setTopUpHistory(prev => prev.map(t => t.id === tempTopUp.id ? result.topup! : t));

      // Sync balance from server
      if (updateUserBalance) {
        await updateUserBalance(result.topup.amount);
      } else {
        await updateUserData();
      }

      // Refresh history with real data
      const history = await getTopUpsByUser(user.id);
      setTopUpHistory(history);
    } else {
      // Rollback on failure
      setLocalBalance(user.balance);
      setTopUpHistory(prev => prev.filter(t => t.id !== tempTopUp.id));
      setStep('method');
      alert(result.error || 'Gagal melakukan top up');
      return;
    }

    setStep('success');
  };

  const handleReset = () => {
    setAmount(0);
    setCustomAmount('');
    setSelectedMethod('');
    setStep('amount');
    setTopUpResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Top Up Saldo</h1>
        <p className="text-slate-500 dark:text-slate-400">Isi saldo GatePass Anda</p>
      </div>

      {/* Current Balance */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-2xl opacity-30 dark:opacity-20" />
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-500/20 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-emerald-100 text-sm">Saldo Saat Ini</p>
              <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Success State */}
      {step === 'success' && topUpResult && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Top Up Berhasil!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Saldo Anda telah ditambahkan sebesar <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(topUpResult.amount)}</span>
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">ID Transaksi</p>
                  <p className="font-medium text-slate-800 dark:text-white">{topUpResult.id}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Metode</p>
                  <p className="font-medium text-slate-800 dark:text-white capitalize">{topUpResult.method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Waktu</p>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {new Date(topUpResult.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Saldo Baru</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(user.balance)}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              Top Up Lagi
            </button>
          </div>
        </div>
      )}

      {/* Steps */}
      {step !== 'success' && (
        <>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              step === 'amount' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {step === 'method' || step === 'processing' ? <Check className="w-4 h-4" /> : '1'}
              <span>Jumlah</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              step === 'method' || step === 'processing' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {step === 'processing' ? <div className="w-4 h-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" /> : '2'}
              <span>Bayar</span>
            </div>
          </div>

          {/* Step 1: Amount Selection */}
          {step === 'amount' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Pilih Nominal</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleQuickAmount(amt)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${
                      amount === amt
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Atau masukkan nominal lain
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="10.000"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Minimal Rp 10.000</p>
              </div>

              {amount < 10000 && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-4 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Minimal top up Rp 10.000
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={amount < 10000}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
              >
                Lanjutkan
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 'method' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-white">Pilih Metode Pembayaran</h3>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</span>
              </div>

              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                      selectedMethod === method.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${
                      'color' in method ? `bg-gradient-to-br ${method.color}` : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-slate-800 dark:text-white">{method.name}</p>
                      {'banks' in method && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{method.banks.join(', ')}</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedMethod === method.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {selectedMethod === method.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!selectedMethod}
                  className={`flex-1 py-3 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedMethod
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-400'
                  }`}
                >
                  Bayar Sekarang
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
              <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Memproses Pembayaran</h3>
              <p className="text-slate-500 dark:text-slate-400">Mohon tunggu sebentar...</p>
            </div>
          )}
        </>
      )}

      {/* Top Up History */}
      {topUpHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Riwayat Top Up</h3>
          </div>

          <div className="space-y-3">
            {topUpHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-white capitalize">{item.method.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(item.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
