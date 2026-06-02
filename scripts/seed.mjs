
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

const properties = [
    {
        id: 1,
        title: "Nowoczesny Bliźniak w Tłuszczu",
        price: 850000,
        location: "Tłuszcz, ul. Spokojna",
        beds: 4,
        baths: 2,
        sqft: 145,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
        featured: true,
        description: "Nowoczesny dom w zabudowie bliźniaczej w cichej i spokojnej okolicy Tłuszcza. Idealny dla rodziny. Wysoki standard, ogród, garaż.",
        images: [
            "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2670&auto=format&fit=crop"
        ],
        features: ["Garaż", "Ogród", "Stan deweloperski", "Pompa ciepła", "Ogrzewanie podłogowe"],
        agent: {
            name: "Anna Nowak",
            phone: "+48 517 303 400",
            email: "anna.nowak@domiz.pl",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"
        }
    },
    {
        id: 9,
        title: "Nowoczesne 3-pokojowe mieszkanie z panoramicznym widokiem - Gwiazdy",
        price: 495000,
        location: "Katowice, Al. Roździeńskiego (Os. Gwiazdy)",
        beds: 3,
        baths: 1,
        sqft: 61,
        type: "mieszkanie",
        status: "sprzedaz",
        image: "/properties/gwiazdy/salon.jpg",
        featured: true,
        description: "Zapraszam do wyjątkowego mieszkania w sercu osiedla Gwiazdy – przestronnej nieruchomości, która połączy Twoje marzenia o nowoczesnym stylu życia z bliskim dostępem do wszystkiego.\n\n61 m² przestrzeni obejmuje: salon z widokiem na miasto i balkonem, oddzielną kuchnię, sypialnie z pięknym widokiem, łazienkę, osobne WC oraz trzeci pokój (sypialnia/gabinet). Dodatkowo komórka lokatorska.\n\nMieszkanie w doskonałym stanie. Budynek posiada trzy nowe windy, monitoring i ochronę.\n\nLokalizacja: Strefa Kultury, transport, sklepy, szkoły. Idealne dla pary, rodziny lub pod inwestycję (sprawdzona historia wynajmu przez 15 lat).\n\n15. piętro zapewnia spektakularne zachody słońca i widok na centrum Katowic.",
        images: [
            "/properties/gwiazdy/salon.jpg",
            "/properties/gwiazdy/kuchnia.jpg",
            "/properties/gwiazdy/pokoj.jpg",
            "/properties/gwiazdy/lazienka.jpg",
            "/properties/gwiazdy/przedpokoj.jpg"
        ],
        features: ["3 Pokoje", "15. piętro", "Balkon", "Widok na panoramę", "Winda", "Monitoring", "Osobne WC", "Komórka lokatorska"],
        agent: {
            name: "Marek Wiśniewski",
            phone: "+48 517 303 400",
            email: "marek.wisniewski@domiz.pl",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2670&auto=format&fit=crop"
        }
    }
];

const seedDatabase = async () => {
    console.log("Rozpoczynam seedowanie bazy Firestore...");
    const collectionRef = collection(db, "properties");

    for (const property of properties) {
        try {
            await setDoc(doc(collectionRef, property.id.toString()), property);
            console.log(`Dodano ofertę: ${property.title} (ID: ${property.id})`);
        } catch (error) {
            console.error(`Błąd przy dodawaniu ${property.title}:`, error);
        }
    }
    console.log("Seedowanie zakończone!");
    process.exit(0);
};

seedDatabase().catch(err => {
    console.error("Wystąpił nieoczekiwany błąd:", err);
    process.exit(1);
});
