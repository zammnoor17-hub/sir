
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Anchor } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // Gunakan cache dari localStorage untuk mempercepat loading tampilan pertama
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('kapten_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Menghubungkan ke Kapal...');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    // 1. Cek status Auth (Login/Logout)
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        setLoadingText('Sinkronisasi Data...');
        
        // 2. Ambil Profil Secara Realtime
        const profileRef = doc(db, 'users', authUser.uid);
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setProfile(profileData);
            // Simpan ke cache agar kunjungan berikutnya instan
            localStorage.setItem('kapten_profile', JSON.stringify(profileData));
            setLoading(false);
          } else {
            console.warn("Profil tidak ditemukan di Firestore");
            // Berikan waktu toleransi jika database lambat
            setTimeout(() => setLoading(false), 2000);
          }
        }, (err) => {
          console.error("Error fetching profile:", err);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        localStorage.removeItem('kapten_profile');
        setLoading(false);
      }
    });
    
    // Timeout keamanan: Jika dalam 5 detik tidak ada respon dari Firebase, paksa tampilkan UI
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const logout = async () => {
    localStorage.removeItem('kapten_profile');
    await signOut(auth);
    window.location.reload();
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-primary-900 text-white">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-gold"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Anchor className="text-gold animate-pulse" size={32} />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 tracking-widest uppercase">{loadingText}</h2>
        <p className="text-primary-300 text-sm animate-pulse">Mohon tunggu sebentar, Kapten...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      <Router>
        <div className="min-h-screen">
          <button 
            onClick={toggleDarkMode}
            className="fixed bottom-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform no-print"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route 
              path="/*" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
