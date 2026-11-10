
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Property } from '../data/properties';

export const useProperties = (includeDrafts = false) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "properties"),
            (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({
                    ...doc.data(),
                    // Upewniamy się, że id jest liczbą, jeśli w bazie jest inna
                    id: Number(doc.data().id)
                })) as Property[];
                setProperties(includeDrafts ? data : data.filter((property) => property.published !== false));
                setLoading(false);
            },
            (error) => {
                console.error("Błąd pobierania ofert z Firebase:", error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [includeDrafts]);

    return { properties, loading };
};
