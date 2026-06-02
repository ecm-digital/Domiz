
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

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

const newProperty = {
    id: Date.now(), // Unikalne ID
    title: "Przestronny dom z potencjałem inwestycyjnym",
    price: 1250000, // Przykładowa cena, do edycji
    location: "Tychy, ul. Kasztanowa",
    beds: 6,
    baths: 3,
    sqft: 242,
    type: "dom",
    status: "sprzedaz",
    // Zdjęcie poglądowe (placeholder)
    image: "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
    featured: true,
    description: "Wyjątkowa oferta sprzedaży domu o powierzchni 242 m² położonego na działce 727 m² przy ul. Kasztanowej w Tychach.\n\nNieruchomość posiada ogromny potencjał adaptacyjny – istnieje możliwość wydzielenia dwóch niezależnych mieszkań, co czyni ją idealną propozycją dla rodziny wielopokoleniowej lub jako inwestycję pod wynajem.\n\nDoskonała lokalizacja łączy spokój osiedla domów jednorodzinnych z szybkim dojazdem do centrum miasta.",
    images: [
        "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop"
    ],
    features: ["Działka 727 m²", "Możliwość podziału", "Garaż", "Ogród", "Dla dwóch rodzin", "Spokojna okolica"],
    agent: {
        name: "Tomasz Gnat",
        phone: "+48 517 303 400",
        email: "tomasz.gnat@domiz.pl",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=2574"
    }
};

const addProperty = async () => {
    console.log("Dodawanie nieruchomości w Tychach...");
    try {
        await setDoc(doc(db, "properties", newProperty.id.toString()), newProperty);
        console.log(`Sukces! Dodano ofertę: ${newProperty.title}`);
    } catch (error) {
        console.error("Błąd przy dodawaniu:", error);
    }
    process.exit(0);
};

addProperty();
