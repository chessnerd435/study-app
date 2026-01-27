import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCbbNGW32LIOa3PFJ3HAsgpfkTN6h-i2gs",
    authDomain: "study-fd8dd.firebaseapp.com",
    projectId: "study-fd8dd",
    storageBucket: "study-fd8dd.firebasestorage.app",
    messagingSenderId: "113410686819",
    appId: "1:113410686819:web:ef8594bf287d4bb2441d56",
    measurementId: "G-VXJ5RGVY85"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
