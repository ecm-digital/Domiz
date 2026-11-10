export const COOPERATION_PACKAGES = [
  {
    id: 'start',
    name: 'Start — profesjonalne uruchomienie sprzedaży',
    services: [
      'Przygotowanie oferty i rekomendacja ceny',
      'Profesjonalna sesja zdjęciowa',
      'Opis oraz publikacja ogłoszenia',
      'Obsługa zapytań i prezentacji',
      'Wsparcie w negocjacjach',
    ],
  },
  {
    id: 'premium',
    name: 'Premium — aktywna sprzedaż',
    services: [
      'Wszystko z wariantu podstawowego',
      'Konsultacja home stagingowa',
      'Film promocyjny i materiały social media',
      'Kampania reklamowa i dotarcie do bazy klientów',
      'Cykliczne raporty oraz strategia promocji',
    ],
  },
  {
    id: 'signature',
    name: 'Signature — maksymalna ekspozycja',
    services: [
      'Wszystko z wariantu Premium',
      'Indywidualny plan premiery oferty',
      'Rozszerzona sesja i krótkie formaty wideo',
      'Materiały ofertowe PL / EN / IT',
      'Spacer 3D lub dron — gdy ma to sens',
    ],
  },
] as const;

export interface ClientOffer {
  id: number;
  title: string;
  address: string;
  ownerName: string;
  price: number;
  area: number;
  rooms: number;
  agreementSigned: boolean;
  signedAt: string;
  agent: { name: string; phone: string; email: string };
  metrics: Array<{ label: string; value: string }>;
  milestones: Array<{ title: string; status: 'complete' | 'current' | 'upcoming' }>;
  checklist: Array<{ id: string; complete: boolean }>;
  documents: Array<{ name: string; status: 'ready' | 'pending'; date: string }>;
}

export const TEST_CLIENT_OFFER: ClientOffer = {
  id: 1784754054299,
  title: 'Gwiazdy — mieszkanie na 24. piętrze z widokiem i balkonem',
  address: 'Katowice, ul. Roździeńskiego 90 · Osiedle Gwiazdy',
  ownerName: 'Właściciel',
  price: 890000,
  area: 63.5,
  rooms: 3,
  agreementSigned: false,
  signedAt: '',
  agent: { name: 'Tomasz Gnat', phone: '+48 500 000 000', email: 'hello@domizhomes.com' },
  metrics: [
    { label: 'Etap współpracy', value: 'Przed podpisaniem umowy' },
    { label: 'Dokumenty', value: 'W przygotowaniu' },
    { label: 'Następny krok', value: 'Wybór zakresu współpracy' },
  ],
  milestones: [
    { title: 'Wybór zakresu współpracy', status: 'current' },
    { title: 'Uzupełnienie danych nieruchomości', status: 'upcoming' },
    { title: 'Przygotowanie i podpisanie umowy', status: 'upcoming' },
  ],
  checklist: [
    { id: 'contact', complete: false },
    { id: 'documents', complete: false },
    { id: 'scope', complete: false },
  ],
  documents: [
    { name: 'Proposal współpracy', status: 'pending', date: '' },
    { name: 'Umowa pośrednictwa', status: 'pending', date: '' },
    { name: 'Karta nieruchomości', status: 'pending', date: '' },
    { name: 'Zgoda marketingowa', status: 'pending', date: '' },
  ],
};
