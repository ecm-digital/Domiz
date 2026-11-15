
import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import type { Property } from '../data/properties';

const mapPropertiesSnapshot = (querySnapshot: QuerySnapshot<DocumentData>, includeDrafts: boolean): Property[] => {
    const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        // Upewniamy się, że id jest liczbą, jeśli w bazie jest inna
        id: Number(doc.data().id)
    })) as Property[];
    return includeDrafts ? data : data.filter((property) => property.published !== false);
};

export const useProperties = (includeDrafts = false) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const propertiesRef = collection(db, "properties");

        const fallbackTimer = window.setTimeout(() => {
            if (active) setLoading(false);
        }, 6000);

        getDocs(propertiesRef)
            .then((snapshot) => {
                if (!active) return;
                window.clearTimeout(fallbackTimer);
                setProperties(mapPropertiesSnapshot(snapshot, includeDrafts));
                setLoading(false);
            })
            .catch((error) => {
                console.error("Błąd jednorazowego pobierania ofert z Firebase:", error);
            });

        const unsubscribe = onSnapshot(
            propertiesRef,
            (querySnapshot) => {
                if (!active) return;
                window.clearTimeout(fallbackTimer);
                setProperties(mapPropertiesSnapshot(querySnapshot, includeDrafts));
                setLoading(false);
            },
            (error) => {
                console.error("Błąd pobierania ofert z Firebase:", error);
                if (active) {
                    window.clearTimeout(fallbackTimer);
                    setLoading(false);
                }
            }
        );

        return () => {
            active = false;
            window.clearTimeout(fallbackTimer);
            unsubscribe();
        };
    }, [includeDrafts]);

    return { properties, loading };
};
