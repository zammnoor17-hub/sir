
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';
import { Clock, User, CreditCard, Banknote, Search, RefreshCw } from 'lucide-react';

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsSyncing(true);
    // Gunakan listener onSnapshot agar jika perangkat lain menambah transaksi, 
    // perangkat ini langsung mendapatkan datanya tanpa refresh.
    const q = query(
      collection(db, 'transactions'), 
      orderBy('timestamp', 'desc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as any));
      
      setTransactions(data);
      setLoading(false);
      setIsSyncing(false);
      
      // Feedback sinkronisasi ke konsol
      if (snapshot.metadata.hasPendingWrites) {
        console.log("Data sedang dikirim ke server...");
      } else {
        console.log("Data sudah singkron dengan server.");
      }
    }, (error) => {
      console.error("Gagal sinkronisasi transaksi:", error);
      setLoading(false);
      setIsSyncing(false);
    });

    return unsubscribe;
  }, []);

  const filtered = transactions.filter(t => 
    t.customerName?.toLowerCase().includes(search.toLowerCase()) || 
    t.cashierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold dark:text-white">Riwayat Transaksi</h2>
            {isSyncing && <RefreshCw size={16} className="text-primary-500 animate-spin" />}
          </div>
          <p className="text-gray-500 dark:text-gray-400">Update otomatis setiap ada pesanan baru</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama/kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
           <p className="text-gray-500 animate-pulse">Menghubungkan ke pusat data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${t.paymentMethod === 'CASH' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                    {t.paymentMethod === 'CASH' ? <Banknote size={24} /> : <CreditCard size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg dark:text-white">{t.customerName || 'Pelanggan'}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center space-x-1"><Clock size={14} /> <span>{t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : 'Memproses...'}</span></span>
                      <span className="flex items-center space-x-1"><User size={14} /> <span>Kasir: {t.cashierName}</span></span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-primary-600">Rp {t.total?.toLocaleString()}</p>
                  <p className="text-xs font-bold uppercase text-gray-400">{t.paymentMethod}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {t.items?.map((item: any, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium dark:text-gray-300">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              Belum ada data transaksi yang masuk.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
