import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyA32xY58swvW3P86Kp1hPujdmZojPCU67k",
    authDomain: "domiz-a6a6c.firebaseapp.com",
    projectId: "domiz-a6a6c",
    storageBucket: "domiz-a6a6c.firebasestorage.app",
    messagingSenderId: "636428718547",
    appId: "1:636428718547:web:a0dfd6f16b30aecd805f26",
    measurementId: "G-6JNT3XB3MD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, analytics, db, auth, storage };
