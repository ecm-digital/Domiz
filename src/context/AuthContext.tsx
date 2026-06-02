
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from './useLanguage';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        const fallbackTimer = window.setTimeout(() => {
            setLoading(false);
        }, 2500);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            window.clearTimeout(fallbackTimer);
            setUser(currentUser);
            setLoading(false);
        });

        return () => {
            window.clearTimeout(fallbackTimer);
            unsubscribe();
        };
    }, []);

    const logout = () => firebaseSignOut(auth);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg-light)' }}>
            {t('common.loading')}
        </div>;
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
