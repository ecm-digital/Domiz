export type ClientOfferStage = 'preparation' | 'published' | 'presentations' | 'negotiations' | 'finalization';

export interface ClientOffer {
  id: string;
  ownerName: string;
  title: string;
  address: string;
  price: number;
  area: number;
  rooms: number;
  image: string;
  stage: ClientOfferStage;
  agreementSigned?: boolean;
  signedAt: string;
  agent: { name: string; role: string; phone: string; email: string; image: string };
  metrics: { label: string; value: string; detail: string }[];
  milestones: { date: string; title: string; description: string; status: 'complete' | 'current' | 'upcoming' }[];
  checklist: { id: string; title: string; description: string; complete: boolean }[];
  documents: { name: string; category: string; date: string; status: 'ready' | 'pending'; content?: string }[];
}

export const COOPERATION_PACKAGES = [
  { id: 'start', name: 'Start — profesjonalne uruchomienie sprzedaży', description: 'Solidna podstawa: przygotowanie oferty, prezentacja i sprawna obsługa sprzedaży.', services: ['Analiza ceny i strategii sprzedaży', 'Profesjonalna sesja zdjęciowa', 'Opis oraz publikacja ogłoszenia', 'Obsługa zapytań i prezentacji', 'Wsparcie w negocjacjach', 'Bieżące podsumowania zainteresowania'] },
  { id: 'premium', name: 'Premium — aktywna sprzedaż', description: 'Najbardziej uniwersalny wariant: pełna prezentacja i aktywne dotarcie do kupujących.', services: ['Wszystko z wariantu Start', 'Konsultacja home stagingowa', 'Film promocyjny i materiały social media', 'Kampania reklamowa i dotarcie do bazy klientów', 'Cykliczne raporty oraz rekomendacje zmian'] },
  { id: 'signature', name: 'Signature — maksymalna ekspozycja', description: 'Indywidualna strategia i najszersza promocja dla nieruchomości, które mają się wyróżnić.', services: ['Wszystko z wariantu Premium', 'Indywidualny plan premiery oferty', 'Rozszerzona sesja i krótkie formaty wideo', 'Materiały ofertowe PL / EN / IT', 'Spacer 3D lub dron — gdy ma to sens'] },
] as const;

export const TEST_CLIENT_OFFER: ClientOffer = {
  id: '1784754054299',
  ownerName: 'Pani Anna',
  title: 'Gwiazdy — mieszkanie na 24. piętrze z widokiem i balkonem',
  address: 'Katowice, ul. Roździeńskiego 90 · Osiedle Gwiazdy',
  price: 440000,
  area: 55,
  rooms: 3,
  image: '/properties/gwiazdy/salon.jpg',
  stage: 'preparation',
  agreementSigned: false,
  signedAt: '',
  agent: {
    name: 'Tomasz Gnat',
    role: 'Opiekun sprzedaży',
    phone: '+48 517 303 400',
    email: 'tomasz@domiz.pl',
    image: '/tomaszgnat.jpeg',
  },
  metrics: [
    { label: 'Etap współpracy', value: '01', detail: 'jesteśmy przed podpisaniem umowy' },
    { label: 'Dokumenty', value: '0/3', detail: 'przygotujemy je po ustaleniu zakresu' },
    { label: 'Następny krok', value: 'Twój wybór', detail: 'wybierz wariant współpracy' },
  ],
  milestones: [
    { date: 'Teraz', title: 'Wybór zakresu współpracy', description: 'Wybierz wariant i działania, które są dla Ciebie najważniejsze.', status: 'current' },
    { date: 'Następnie', title: 'Uzupełnienie danych nieruchomości', description: 'Zbierzemy informacje i dokumenty potrzebne do przygotowania umowy.', status: 'upcoming' },
    { date: 'Kolejny krok', title: 'Przygotowanie i podpisanie umowy', description: 'Otrzymasz gotowe dokumenty do wglądu i podpisu.', status: 'upcoming' },
    { date: 'Po podpisaniu', title: 'Start przygotowania oferty', description: 'Dopiero wtedy uruchomimy sesję, materiały i publikację.', status: 'upcoming' },
  ],
  checklist: [
    { id: 'keys', title: 'Przekazanie kluczy / dostęp do mieszkania', description: 'Ustalimy wygodny sposób organizacji prezentacji.', complete: false },
    { id: 'docs', title: 'Dokumenty nieruchomości', description: 'Prosimy o przesłanie dokumentów z poniższej listy.', complete: false },
    { id: 'photo', title: 'Przygotowanie do sesji', description: 'Przed sesją prześlemy krótką checklistę przygotowania wnętrza.', complete: true },
  ],
  documents: [
    { name: 'Proposal współpracy', category: 'Dokument roboczy', date: 'w przygotowaniu', status: 'pending' },
    { name: 'Umowa pośrednictwa', category: 'Dokument roboczy', date: 'w przygotowaniu', status: 'pending' },
    { name: 'Karta nieruchomości', category: 'Do uzupełnienia', date: 'oczekuje na dane', status: 'pending' },
    { name: 'Zgoda na działania marketingowe', category: 'Do podpisu', date: 'oczekuje na podpis', status: 'pending' },
  ],
};
