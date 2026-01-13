
import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { 
  ShoppingCart, 
  History, 
  Users, 
  Utensils, 
  BarChart3, 
  LogOut,
  Anchor,
  AlertTriangle
} from 'lucide-react';
import CashierDesk from './CashierDesk';
import TransactionHistory from './TransactionHistory';
import UserManagement from './UserManagement';
import MenuManagement from './MenuManagement';
import Reports from './Reports';

const Dashboard: React.FC = () => {
  const { profile, logout, user } = useAuth();
  const location = useLocation();

  // Jika user sudah login di Auth tapi profil belum ditemukan di Firestore
  if (!profile && user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/30 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profil Belum Terdaftar</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Akun Anda ({user.email}) telah login, namun data profil kapten tidak ditemukan di database. Hubungi Owner untuk memverifikasi pendaftaran Anda.
          </p>
          <button
            onClick={logout}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
          >
            <LogOut size={20} />
            <span>Keluar & Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const navItems = [
    { label: 'Kasir', icon: ShoppingCart, path: '/', roles: [UserRole.OWNER, UserRole.CASHIER] },
    { label: 'History', icon: History, path: '/history', roles: [UserRole.OWNER, UserRole.CASHIER] },
    { label: 'Laporan', icon: BarChart3, path: '/reports', roles: [UserRole.OWNER] },
    { label: 'Menu', icon: Utensils, path: '/menu', roles: [UserRole.OWNER] },
    { label: 'Karyawan', icon: Users, path: '/users', roles: [UserRole.OWNER] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(profile.role));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-900 text-white flex-shrink-0 flex flex-col no-print hidden md:flex">
        <div className="p-6 flex items-center space-x-3">
          <Anchor className="text-gold" size={32} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Warung Kapten</h1>
            <p className="text-xs text-primary-300 capitalize">{profile.role.toLowerCase()}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-700 text-white shadow-lg' 
                    : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-gold font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-xs text-primary-400 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-primary-300 hover:bg-red-900/30 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:hidden no-print flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Anchor className="text-primary-600" size={24} />
            <span className="font-bold dark:text-white">Warung Kapten</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto">
             {filteredNavItems.map(item => (
                <Link key={item.path} to={item.path} className="p-2 text-gray-500 dark:text-gray-400">
                  <item.icon size={20} />
                </Link>
             ))}
             <button onClick={logout} className="p-2 text-red-500"><LogOut size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<CashierDesk />} />
            <Route path="/history" element={<TransactionHistory />} />
            {profile.role === UserRole.OWNER && (
              <>
                <Route path="/reports" element={<Reports />} />
                <Route path="/menu" element={<MenuManagement />} />
                <Route path="/users" element={<UserManagement />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
