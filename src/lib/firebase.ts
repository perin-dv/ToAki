import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// A configuração Web é pública, mas credenciais de servidor NUNCA pertencem ao front-end.
// IDs técnicos do Firebase nunca serão mostrados como títulos de empresa, pessoa ou pedido.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAlEwcePvdIVM8LGvS95jJflfSeK27dytg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "toaki-cf058.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "toaki-cf058",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "toaki-cf058.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "591288979843",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:591288979843:web:270400b62b87c5d844e6b6",
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
