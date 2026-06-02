
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

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

const updateData = {
    title: "Funkcjonalny dom z potencjałem na dwa mieszkania - Tychy",
    price: 799000,
    description: `Na sprzedaż funkcjonalny dom jednorodzinny w Tychach przy ul. Kasztanowej. Idealny dla rodziny lub jako nieruchomość z potencjałem pod dwa niezależne lokale mieszkalne.

**Najważniejsze cechy:**
*   **Powierzchnia domu:** ok. 242 m²
*   **Powierzchnia działki:** 727 m²
*   **Kondygnacje:** 2
*   **Potencjał:** Możliwość wydzielenia dwóch mieszkań (osobne wejścia/strefy)

**Opis:**
Budynek wolnostojący, wykonany w tradycyjnej technologii murowanej, z dachem o klasycznej formie. Czytelny podział na strefę dzienną i nocną. Układ pozwala na komfortowe zamieszkanie rodziny wielopokoleniowej lub wynajem części domu.

**Lokalizacja:**
Ulica Kasztanowa to spokojna część Tychów z przewagą zabudowy jednorodzinnej. Cisza i kameralny charakter, a jednocześnie bliskość sklepów, szkół i komunikacji miejskiej. Szybki dojazd do centrum.

**Dla kogo?**
*   Rodzina szukająca większej przestrzeni.
*   Dwie zaprzyjaźnione rodziny.
*   Inwestor szukający nieruchomości pod wynajem.`,
    features: [
        "Powierzchnia 242 m²",
        "Działka 727 m²",
        "Możliwość 2 mieszkań",
        "Garaż",
        "Spokojna okolica",
        "Dla rodziny wielopokoleniowej",
        "Blisko centrum"
    ]
};

async function updateProperty() {
    console.log("Szukam oferty w Tychach na ul. Kasztanowej...");

    // Szukamy po lokalizacji, bo ID nie znamy (było losowe timestamp)
    const q = query(collection(db, "properties"), where("location", "==", "Tychy, ul. Kasztanowa"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Nie znaleziono oferty! Sprawdź czy adres jest dokładny.");
        process.exit(1);
    }

    // Aktualizujemy wszystkie pasujące (powinna być jedna)
    const updates = querySnapshot.docs.map(snap => {
        const ref = doc(db, "properties", snap.id);
        console.log(`Aktualizuję ofertę ID: ${snap.id}`);
        return updateDoc(ref, updateData);
    });

    await Promise.all(updates);
    console.log("Sukces! Zaktualizowano dane i cenę (799 000 PLN).");
    process.exit(0);
}

updateProperty().catch(console.error);
