
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { PROPERTIES } from "./data/properties";

export const seedDatabase = async () => {
    const collectionRef = collection(db, "properties");

    console.log("Rozpoczynam migrację danych do Firestore...");

    for (const property of PROPERTIES) {
        try {
            // Używamy ID jako nazwy dokumentu, żeby było łatwiej zarządzać (string)
            await setDoc(doc(collectionRef, property.id.toString()), property);
            console.log(`Dodano ofertę: ${property.title}`);
        } catch (error) {
            console.error(`Błąd przy dodawaniu ${property.title}:`, error);
        }
    }

    console.log("Migracja zakończona!");
    alert("Dane zostały załadowane do bazy Firestore!");
};
