
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Anchor, ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State untuk hidden bootstrap
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bsName, setBsName] = useState('');
  const [bsEmail, setBsEmail] = useState('');
  const [bsPassword, setBsPassword] = useState('');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const checkParams = () => {
      const fullUrl = window.location.href;
      if (fullUrl.includes('setup=true')) {
        setShowBootstrap(true);
      }
    };
    checkParams();
    window.addEventListener('hashchange', checkParams);
    return () => window.removeEventListener('hashchange', checkParams);
  }, []);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowBootstrap(true);
      setClickCount(0);
      alert('Mode Setup Aktif!');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Trim email untuk mencegah spasi liar di awal/akhir
    const cleanEmail = email.trim();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      console.error("Login Error:", err.code);
      if (err.code === 'auth/user-not-found') {
        setError('Email tidak terdaftar di sistem.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Password yang Anda masukkan salah.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else {
        setError('Gagal masuk. Pastikan koneksi internet stabil dan kredensial benar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, bsEmail.trim(), bsPassword);
      const { uid } = userCredential.user;
      
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: bsEmail.trim(),
        name: bsName,
        role: UserRole.OWNER
      });
      
      alert('Akun Owner berhasil dibuat!');
      setShowBootstrap(false);
      setBsName(''); setBsEmail(''); setBsPassword('');
    } catch (err: any) {
      alert(`Gagal membuat akun: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-900 relative overflow-hidden py-12">
      <div className="absolute top-10 left-10 opacity-10 rotate-12"><Anchor size={200} color="white" /></div>
      <div className="absolute bottom-10 right-10 opacity-10 -rotate-12"><Anchor size={250} color="white" /></div>

      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl z-10 mx-4 border border-white/20">
        <div className="text-center mb-8">
          <div 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4 cursor-pointer active:scale-90 transition-transform select-none"
          >
            <Anchor className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Warung Kapten</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Laporan & Kasir Digital</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-start space-x-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Email Kapten</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              placeholder="nama@warungkapten.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Membuka Dermaga...' : 'Masuk ke Kapal'}
          </button>
        </form>

        {showBootstrap && (
          <div className="mt-12 p-6 border-2 border-dashed border-red-500 rounded-2xl bg-red-50 dark:bg-red-900/10 animate-in slide-in-from-top duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-red-600">
                <ShieldAlert size={20} />
                <h2 className="font-bold">Setup Owner</h2>
              </div>
              <button onClick={() => setShowBootstrap(false)} className="text-xs text-gray-400 hover:text-gray-600">Tutup</button>
            </div>
            <form onSubmit={handleBootstrap} className="space-y-4">
              <input type="text" placeholder="Nama Lengkap Owner" value={bsName} onChange={(e) => setBsName(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800 dark:bg-gray-900 outline-none" />
              <input type="email" placeholder="Email Baru" value={bsEmail} onChange={(e) => setBsEmail(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800 dark:bg-gray-900 outline-none" />
              <input type="password" placeholder="Password Baru" value={bsPassword} onChange={(e) => setBsPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800 dark:bg-gray-900 outline-none" />
              <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-lg transition-colors">DAFTARKAN OWNER</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
