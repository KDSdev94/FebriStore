import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration untuk Febri Store
const firebaseConfig = {
  apiKey: "AIzaSyDtoX8vCs2uaYNDtgxcGsFYB6NuuRaMmBw",
  authDomain: "febri-store.firebaseapp.com",
  projectId: "febri-store",
  storageBucket: "febri-store.firebasestorage.app",
  messagingSenderId: "573330612766",
  appId: "1:573330612766:android:42c4f571b568faac72c40f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;