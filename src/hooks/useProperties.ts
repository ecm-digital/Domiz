
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Property } from '../data/properties';

export const useProperties = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "properties"));
                const data = querySnapshot.docs.map(doc => ({
                    ...doc.data(),
                    // Upewniamy się, że id jest liczbą, jeśli w bazie jest inna
                    id: Number(doc.data().id)
                })) as Property[];
                setProperties(data);
            } catch (error) {
                console.error("Błąd pobierania ofert z Firebase:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    return { properties, loading };
};
