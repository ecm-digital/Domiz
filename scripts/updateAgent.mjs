
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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
const db = getFirestore(app);

const newAgent = {
    name: "Tomasz Gnat",
    phone: "+48 517 303 400",
    email: "tomasz.gnat@domiz.pl",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=2574"
};

async function updateAllAgents() {
    console.log("Rozpoczynam aktualizację agentów...");
    const propertiesCol = collection(db, "properties");
    const snapshot = await getDocs(propertiesCol);

    console.log(`Znaleziono ${snapshot.size} ofert.`);

    const updates = snapshot.docs.map(snap => {
        const ref = doc(db, "properties", snap.id);
        return updateDoc(ref, { agent: newAgent })
            .then(() => console.log(`Zaktualizowano ofertę ID: ${snap.id}`));
    });

    await Promise.all(updates);
    console.log("Zakończono! Wszyscy agenci to teraz Tomasz Gnat.");
    process.exit(0);
}

updateAllAgents().catch(err => {
    console.error("Błąd:", err);
    process.exit(1);
});
