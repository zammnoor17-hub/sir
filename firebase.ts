
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Konfigurasi Firebase Kapten
export const firebaseConfig = {
  apiKey: "AIzaSyBpVwn1uoWl1vs8lqQsvtkONmsdNUO7-RQ",
  authDomain: "azaza-50107.firebaseapp.com",
  projectId: "azaza-50107",
  storageBucket: "azaza-50107.firebasestorage.app",
  messagingSenderId: "311453488260",
  appId: "1:16142572128:web:6d3cc286e16b518dfec105",
  databaseURL: "https://azaza-50107-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Mengaktifkan Offline Persistence agar data tetap singkron meski internet lambat
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
