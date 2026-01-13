
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users as UsersIcon, Award } from 'lucide-react';

const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as any)));
    });
    return unsubscribe;
  }, []);

  // Helpers for filtering by date
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const isWithinLastDays = (date: Date, days: number) => {
    const diff = new Date().getTime() - date.getTime();
    return diff <= days * 24 * 60 * 60 * 1000;
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date();
      if (period === 'daily') return isSameDay(tDate, now);
      if (period === 'weekly') return isWithinLastDays(tDate, 7);
      if (period === 'monthly') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (period === 'yearly') return tDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, period]);

  const stats = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const orderCount = filteredTransactions.length;
    const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;
    
    // Top Items Calculation
    const itemMap = new Map<string, number>();
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        itemMap.set(item.name, (itemMap.get(item.name) || 0) + item.quantity);
      });
    });

    const topItems = Array.from(itemMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sales by Category for Pie Chart
    const catMap = new Map<string, number>();
    // We need category info which isn't in transaction items directly, but we can aggregate
    // (In a real app, you might want to denormalize category into Transaction items)
    // For this mock, we'll just use the item name as a proxy for diversity

    return { totalSales, orderCount, avgOrder, topItems };
  }, [filteredTransactions]);

  const COLORS = ['#0ea5e9', '#eab308', '#22c55e', '#ef4444', '#a855f7', '#f97316'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Laporan Penjualan</h2>
          <p className="text-gray-500 dark:text-gray-400">Analisis kinerja Warung Kapten</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex shadow-sm">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                period === p 
                ? 'bg-primary-600 text-white shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:text-primary-600'
              }`}
            >
              {p === 'daily' ? 'Hari Ini' : p === 'weekly' ? 'Mingguan' : p === 'monthly' ? 'Bulanan' : 'Tahunan'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><DollarSign /></div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Omzet</p>
          <h3 className="text-2xl font-black dark:text-white">Rp {stats.totalSales.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl"><ShoppingBag /></div>
            <span className="text-xs font-bold text-green-500">+12%</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Pesanan</p>
          <h3 className="text-2xl font-black dark:text-white">{stats.orderCount} <span className="text-sm font-normal text-gray-400">Porsi</span></h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><UsersIcon /></div>
            <TrendingDown size={20} className="text-red-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Rata-rata per Transaksi</p>
          <h3 className="text-2xl font-black dark:text-white">Rp {stats.avgOrder.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Volume Penjualan Terlaris</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topItems}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {stats.topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="text-gold" size={24} />
            <h3 className="text-lg font-bold dark:text-white">Top 10 Menu</h3>
          </div>
          <div className="flex-1 space-y-4">
            {stats.topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${index < 3 ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm dark:text-gray-300 group-hover:text-primary-600 transition-colors">{item.name}</span>
                </div>
                <span className="font-bold text-gray-600 dark:text-gray-400">{item.count} <span className="text-[10px] font-normal">X</span></span>
              </div>
            ))}
            {stats.topItems.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">
                Belum ada data penjualan
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
