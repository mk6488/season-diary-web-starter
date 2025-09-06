import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCAolG2Ftvid-79V-q9q6My7ZAb03Vicqk",
    authDomain: "inter-boys.firebaseapp.com",
    projectId: "inter-boys",
    storageBucket: "inter-boys.firebasestorage.app",
    messagingSenderId: "403180048584",
    appId: "1:403180048584:web:8a0fcb467ea4fa341b55fd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
