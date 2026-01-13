
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { db, firebaseConfig } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { 
  UserPlus, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  EyeOff,
  UserCheck,
  Search,
  Mail
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.CASHIER);
  
  // Loading State with detail
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  useEffect(() => {
    setIsSyncing(true);
    const q = query(collection(db, 'users'), orderBy('role'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
      setIsSyncing(false);
    }, (error) => {
      console.error("Gagal sinkron data karyawan:", error);
      setIsSyncing(false);
    });
    return unsubscribe;
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    
    if (password.length < 6) return alert("Password minimal 6 karakter!");
    if (!cleanEmail.includes('@')) return alert("Format email tidak valid!");
    
    setLoading(true);
    setLoadingStep('Menyiapkan koneksi aman...');
    
    const secondaryAppName = `kapten-reg-${Date.now()}`;
    let secondaryApp;
    
    try {
      // 1. Inisialisasi Auth Sekunder
      setLoadingStep('Menghubungkan ke Pusat Data Firebase...');
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      // 2. Buat user di Firebase Authentication
      setLoadingStep('Mendaftarkan email di sistem keamanan...');
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
      const { uid } = userCredential.user;
      
      // 3. Simpan data profil ke Firestore
      setLoadingStep('Menyimpan informasi jabatan ke database...');
      const profile: UserProfile = { 
        uid, 
        email: cleanEmail, 
        name, 
        role 
      };
      await setDoc(doc(db, 'users', uid), profile);
      
      // 4. Logout dan Bersihkan
      setLoadingStep('Menyelesaikan proses pendaftaran...');
      await signOut(secondaryAuth);
      
      // Berhasil
      setLoadingStep('Sukses!');
      setTimeout(() => {
        setShowAddModal(false);
        setName(''); setEmail(''); setPassword(''); setRole(UserRole.CASHIER);
        setShowPassword(false);
        setLoading(false);
        setLoadingStep('');
      }, 1000);

      alert(`BERHASIL!\nAkun ${role} untuk ${name} telah aktif.\nEmail: ${cleanEmail}\nPassword: ${password}\n\nSilakan coba login di perangkat baru.`);
    } catch (err: any) {
      console.error("Creation Error:", err);
      let errorMsg = `Gagal: ${err.message}`;
      if (err.code === 'auth/email-already-in-use') errorMsg = "Email ini sudah terdaftar!";
      if (err.code === 'auth/invalid-email') errorMsg = "Format email salah!";
      alert(errorMsg);
      setLoading(false);
      setLoadingStep('');
    } finally {
      // Pastikan secondary app dihapus agar tidak membebani memori
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      }
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (confirm(`Hapus akun ${user.name} (${user.role})?\nUser tidak akan bisa login ke dashboard ini lagi.`)) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        alert('Profil karyawan berhasil dihapus.');
      } catch (err) {
        alert("Gagal menghapus: " + err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-primary-900 dark:text-white uppercase tracking-tight">Daftar Akun Kapten</h2>
            {isSyncing && <RefreshCw size={18} className="text-primary-500 animate-spin" />}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total {users.length} akun terdaftar di sistem</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm min-w-[240px]"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            <UserPlus size={20} />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.uid} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            {/* Role Stripe */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${u.role === UserRole.OWNER ? 'bg-gold' : 'bg-primary-500'}`}></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${u.role === UserRole.OWNER ? 'bg-gold shadow-gold/20' : 'bg-primary-600 shadow-primary-500/20'}`}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === UserRole.OWNER ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                  <Shield size={10} />
                  <span>{u.role}</span>
                </span>
                <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center justify-end space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>AKTIF</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate">{u.name}</h4>
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-xs mt-1">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="text-[10px] font-bold text-gray-400">
                  AKSES: {u.role === UserRole.OWNER ? 'PENUH (ALL)' : 'KASIR (POS)'}
                </div>
                <button 
                  onClick={() => handleDeleteUser(u)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Hapus Akun"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
          <UserIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak ada akun ditemukan</h3>
          <p className="text-gray-500">Coba kata kunci pencarian lain.</p>
        </div>
      )}

      {/* Modal Tambah Akun */}
      {showAddModal && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-xl font-black text-primary-900 dark:text-white uppercase tracking-tight">Tambah Anggota Kapal</h3>
                <p className="text-xs text-gray-500">Daftarkan akun Owner atau Kasir baru</p>
              </div>
              {!loading && (
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all">
                  <X />
                </button>
              )}
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <UserPlus className="text-primary-600 animate-pulse" size={32} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold dark:text-white mb-1">Sedang Memproses...</h4>
                    <p className="text-sm text-primary-600 font-medium animate-pulse">{loadingStep}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Nama Lengkap</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm" required />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Email Login</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@warungkapten.com" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          placeholder="Minimal 6 karakter" 
                          className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm" 
                          required 
                          minLength={6} 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Pilih Jabatan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button" 
                          onClick={() => setRole(UserRole.CASHIER)} 
                          className={`py-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center space-y-1 ${role === UserRole.CASHIER ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-500/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-primary-200'}`}
                        >
                          <UserCheck size={20} />
                          <span>KASIR</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setRole(UserRole.OWNER)} 
                          className={`py-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center space-y-1 ${role === UserRole.OWNER ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-yellow-200'}`}
                        >
                          <Shield size={20} />
                          <span>OWNER</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center space-x-3 mt-4"
                  >
                    <span>Daftarkan Sekarang</span>
                    <CheckCircle2 size={20} />
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
