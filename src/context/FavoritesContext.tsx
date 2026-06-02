import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'domiz-favorites';

function load(): number[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

type FavoritesContextType = {
    favorites: number[];
    toggle: (id: number) => void;
    isFavorite: (id: number) => boolean;
};

const Context = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<number[]>(load);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const toggle = useCallback((id: number) => {
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const isFavorite = useCallback(
        (id: number) => favorites.includes(id),
        [favorites]
    );

    return (
        <Context.Provider value={{ favorites, toggle, isFavorite }}>
            {children}
        </Context.Provider>
    );
}

export function useFavorites() {
    const ctx = useContext(Context);
    if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
    return ctx;
}
