import { createContext } from 'react';

export type Language = 'pl' | 'en';

export type LanguageContextType = {
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
