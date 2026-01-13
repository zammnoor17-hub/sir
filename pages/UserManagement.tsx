
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
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
  const [username, setUsername] = useState('');
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
    const cleanUsername = username.trim().toLowerCase();
    
    if (password.length < 6) return alert("Password minimal 6 karakter!");
    if (cleanUsername.length < 3) return alert("Username minimal 3 karakter!");
    if (cleanUsername.includes(' ')) return alert("Username tidak boleh mengandung spasi!");
    
    setLoading(true);
    setLoadingStep('Menyiapkan koneksi aman...');
    
    // Pemetaan ke email internal
    const internalEmail = `${cleanUsername}@warungkapten.id`;
    const secondaryAppName = `kapten-reg-${Date.now()}`;
    let secondaryApp;
    
    try {
      // 1. Inisialisasi Auth Sekunder
      setLoadingStep('Menghubungkan ke Pusat Data...');
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      // 2. Buat user di Firebase Authentication (Gunakan email internal)
      setLoadingStep('Mendaftarkan username di sistem keamanan...');
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, internalEmail, password);
      const { uid } = userCredential.user;
      
      // 3. Simpan data profil ke Firestore
      setLoadingStep('Menyimpan jabatan ke database...');
      const profile: UserProfile = { 
        uid, 
        email: internalEmail, 
        username: cleanUsername,
        name, 
        role 
      };
      await setDoc(doc(db, 'users', uid), profile);
      
      // 4. Logout dan Bersihkan
      setLoadingStep('Menyelesaikan...');
      await signOut(secondaryAuth);
      
      // Berhasil
      setLoadingStep('Sukses!');
      setTimeout(() => {
        setShowAddModal(false);
        setName(''); setUsername(''); setPassword(''); setRole(UserRole.CASHIER);
        setShowPassword(false);
        setLoading(false);
        setLoadingStep('');
      }, 800);

      alert(`BERHASIL!\nAkun ${role} untuk ${name} aktif.\nUsername: ${cleanUsername}\nPassword: ${password}`);
    } catch (err: any) {
      console.error("Creation Error:", err);
      let errorMsg = `Gagal: ${err.message}`;
      if (err.code === 'auth/email-already-in-use') errorMsg = "Username ini sudah digunakan!";
      alert(errorMsg);
      setLoading(false);
      setLoadingStep('');
    } finally {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (e) {}
      }
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (confirm(`Hapus akun ${user.name} (${user.role})?`)) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        alert('Profil berhasil dihapus.');
      } catch (err) {
        alert("Gagal menghapus: " + err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-primary-900 dark:text-white uppercase tracking-tight">Manajemen Akun</h2>
            {isSyncing && <RefreshCw size={18} className="text-primary-500 animate-spin" />}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Kelola akses Owner & Kasir via Username</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama/username..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.uid} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
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
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate">{u.name}</h4>
              <p className="text-xs text-gray-500 font-mono">@{u.username || u.email.split('@')[0]}</p>
            </div>

            <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Akses Dashboard</span>
              <button 
                onClick={() => handleDeleteUser(u)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-xl font-black text-primary-900 dark:text-white uppercase tracking-tight">Daftarkan User</h3>
                <p className="text-xs text-gray-500">Gunakan username unik tanpa spasi</p>
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
                  <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-primary-600 font-black animate-pulse uppercase tracking-widest">{loadingStep}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Nama Panggilan</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Budi" className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium" required />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Username Kapten</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="budi_kapten" className="w-full pl-10 pr-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest px-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          placeholder="Min. 6 karakter" 
                          className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                          required 
                          minLength={6} 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Jabatan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setRole(UserRole.CASHIER)} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center space-y-1 ${role === UserRole.CASHIER ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-500/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'}`}>
                          <UserCheck size={20} />
                          <span>KASIR</span>
                        </button>
                        <button type="button" onClick={() => setRole(UserRole.OWNER)} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center space-y-1 ${role === UserRole.OWNER ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'}`}>
                          <Shield size={20} />
                          <span>OWNER</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center space-x-3 mt-4">
                    <span>Simpan User</span>
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
