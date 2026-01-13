
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Konfigurasi Firebase Kapten
export const firebaseConfig = {
  apiKey: "AIzaSyAsiPN8v3bsB2GAUYb5l8W6TsU9IUv1iA4",
  authDomain: "kasir-kapten.firebaseapp.com",
  projectId: "kasir-kapten",
  storageBucket: "kasir-kapten.firebasestorage.app",
  messagingSenderId: "16142572128",
  appId: "1:16142572128:web:6d3cc286e16b518dfec105",
  databaseURL: "https://kasir-kapten-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Mengaktifkan Offline Persistence agar data tetap singkron meski internet lambat
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
