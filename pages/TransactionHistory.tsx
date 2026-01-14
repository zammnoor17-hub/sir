
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, UserRole } from '../types';
import { useAuth } from '../App';
import { Clock, User as UserIcon, CreditCard, Banknote, Search, RefreshCw, Trash2, Smartphone, Zap } from 'lucide-react';

const TransactionHistory: React.FC = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsSyncing(true);
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
    }, (error) => {
      console.error("Gagal sinkronisasi transaksi:", error);
      setLoading(false);
      setIsSyncing(false);
    });

    return unsubscribe;
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Hapus permanen data transaksi ini dari kapal?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        alert('Transaksi dihapus.');
      } catch (err) {
        alert('Gagal hapus transaksi.');
      }
    }
  };

  const filtered = transactions.filter(t => 
    t.customerName?.toLowerCase().includes(search.toLowerCase()) || 
    t.cashierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-primary-900 dark:text-white uppercase tracking-tighter">Riwayat Kapal</h2>
            {isSyncing && <RefreshCw size={18} className="text-primary-500 animate-spin" />}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Log transaksi realtime</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama pelanggan/kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
           <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
           <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Menarik Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start space-x-5">
                  <div className={`p-4 rounded-2xl shadow-sm ${t.platform === 'NORMAL' ? 'bg-primary-900 text-white' : t.platform === 'GRAB' ? 'bg-green-600 text-white' : 'bg-primary-600 text-white'}`}>
                    {t.platform === 'NORMAL' ? <Banknote size={24} /> : t.platform === 'GRAB' ? <Smartphone size={24} /> : <Zap size={24} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                       <h4 className="font-black text-lg dark:text-white uppercase tracking-tight">{t.customerName || 'UMUM'}</h4>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${t.platform === 'NORMAL' ? 'bg-gray-100 text-gray-500' : t.platform === 'GRAB' ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                         {t.platform}
                       </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center space-x-1"><Clock size={12} /> <span>{t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString('id-ID') : 'MENYIMPAN...'}</span></span>
                      <span className="flex items-center space-x-1"><UserIcon size={12} /> <span>{t.cashierName}</span></span>
                      <span className="flex items-center space-x-1">
                        {t.paymentMethod === 'CASH' ? <Banknote size={12} /> : <CreditCard size={12} />}
                        <span>{t.paymentMethod}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary-900 dark:text-white font-mono">Rp{t.total?.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{t.id.slice(-6).toUpperCase()}</p>
                  </div>
                  {profile?.role === UserRole.OWNER && (
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                      title="Hapus Transaksi"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {t.items?.map((item: any, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-20 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
              <RefreshCw size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="font-black text-gray-400 uppercase tracking-widest">Belum Ada Transaksi</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
