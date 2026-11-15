// Domiz Homes – teksty zgody właściciela (wersjonowane).
// ZASADA: opublikowanej wersji NIE zmieniamy. Każda zmiana treści = nowa wersja (nowy klucz)
// + zmiana CURRENT_VERSION. Przy potwierdzeniu zapisujemy numer wersji ORAZ pełny tekst,
// który właściciel widział (consentTextSnapshot).

// Administrator danych – DO POTWIERDZENIA przez Tomasza (pełna nazwa firmy z CEIDG/KRS).
// Na stronie nie ma (i ma nie być) adresu biura ani stawek prowizji.
export const CONTROLLER = {
  name: 'Tomasz Gnat, Domiz Homes',
  email: 'hello@domizhomes.com',
  phone: '+48 535 330 323',
  site: 'domizhomes.com'
};

export const CURRENT_VERSION = 'zgoda-v2-2026-11-10';

const pl = n => (n == null || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('pl-PL');

export function propertyLabel(d) {
  const parts = [d.propertyType, d.location, d.areaM2 ? `${pl(d.areaM2)} m²` : '', d.pricePln ? `${pl(d.pricePln)} zł` : ''].filter(Boolean);
  return parts.join(', ');
}

// Wersja v1 – zwraca wszystkie fragmenty tekstu zgody dla danego dokumentu.
const V1 = d => ({
  intro: 'Bezpłatnie, bez wyłączności i bez umowy. Zgodę można wycofać w każdej chwili jednym kliknięciem na tej samej stronie albo mailem.',
  facts: [
    'Publikacja jest bezpłatna – za ogłoszenie nie pobieramy żadnej opłaty.',
    'Bez wyłączności – można nadal sprzedawać samodzielnie, na Otodom i w każdym innym miejscu.',
    'Bez umowy i bez zobowiązań – to nie jest umowa pośrednictwa.',
    'Zgodę można wycofać w każdej chwili – przyciskiem na tej stronie albo mailem na ' + CONTROLLER.email + '. Ogłoszenie zdejmujemy wtedy niezwłocznie, najpóźniej w ciągu 48 godzin.'
  ],
  what: [
    'Opis nieruchomości napisany przez Domiz Homes na podstawie ogłoszenia właściciela i naszej rozmowy.',
    'Podstawowe dane: rodzaj, lokalizacja (bez numeru mieszkania), metraż, cena.',
    'Zdjęcia – wyłącznie własne zdjęcia właściciela i tylko za jego wyraźną zgodą (np. gdy sam je prześle). Nie kopiujemy zdjęć z portali.',
    'Numer telefonu właściciela nie jest publikowany, chyba że zaznaczy to poniżej. Domyślnie kontakt z kupującymi idzie przez Domiz Homes.'
  ],
  where: [
    'Strona domizhomes.com',
    'Profile Domiz Homes na Instagramie i Facebooku – tylko po zaznaczeniu osobnej zgody.'
  ],
  checks: {
    consentSite: `Wyrażam zgodę na bezpłatne opublikowanie ogłoszenia mojej nieruchomości (${propertyLabel(d)}) na stronie domizhomes.com przez Domiz Homes, bez wyłączności i bez zawierania umowy. Wiem, że mogę ją wycofać w każdej chwili.`,
    consentSocial: 'Wyrażam zgodę na pokazanie tego ogłoszenia także na profilach Domiz Homes na Instagramie i Facebooku.',
    consentContact: 'Zgadzam się na kontakt telefoniczny i SMS od Tomasza Gnata (Domiz Homes) w sprawie tego ogłoszenia, np. gdy pojawi się zainteresowany kupujący.',
    consentPhoneInListing: 'Zgadzam się na pokazanie mojego numeru telefonu w ogłoszeniu (bez zaznaczenia numer nie będzie widoczny).'
  },
  rodo: `Administratorem danych osobowych (imię i nazwisko, treść zgody, data i godzina potwierdzenia, informacja o przeglądarce) jest ${CONTROLLER.name}, kontakt: ${CONTROLLER.email}. Dane przetwarzamy na podstawie zgody (art. 6 ust. 1 lit. a RODO) w celu publikacji ogłoszenia i kontaktu w jego sprawie oraz – w zakresie dowodu udzielenia i wycofania zgody – na podstawie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f RODO). Dane przechowujemy przez czas publikacji, a po wycofaniu zgody tylko tyle, ile potrzeba do wykazania, jakiej zgody udzielono (do 3 lat). Przysługuje prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu, przenoszenia oraz skargi do Prezesa UODO. Wycofanie zgody nie wpływa na zgodność z prawem publikacji przed jej wycofaniem. Podanie danych jest dobrowolne. Dane nie są sprzedawane ani przekazywane innym biurom; korzystamy z usług hostingowych Google (Firebase).`
});

// Wersja v2 – ten sam tekst co v1, z doprecyzowaniem opcjonalnej zgody na social media:
// krótkie filmy (rolki i pokazy slajdów) z zdjęć właściciela i danych z ogłoszenia.
const V2 = d => {
  const t = V1(d);
  return {
    ...t,
    checks: {
      ...t.checks,
      consentSocial: 'Wyrażam zgodę na pokazanie tego ogłoszenia także na profilach Domiz Homes na Instagramie i Facebooku, w tym w krótkich filmach (rolkach i pokazach slajdów z moich zdjęć oraz danych z ogłoszenia).'
    }
  };
};

export const VERSIONS = {
  'zgoda-v1-2026-11-05': V1,
  'zgoda-v2-2026-11-10': V2
};


// Pełny tekst, który zapisujemy jako dowód (to, co właściciel widział i zaznaczył).
export function snapshotText(version, d, sel, ownerName) {
  const t = VERSIONS[version](d);
  const box = (k) => `[${sel[k] ? 'x' : ' '}] ${t.checks[k]}`;
  return [
    `Wersja: ${version}`,
    `Nieruchomość: ${propertyLabel(d)}${d.listingUrl ? ' | ' + d.listingUrl : ''}`,
    t.intro, ...t.facts.map(x => '- ' + x),
    'Co publikujemy:', ...t.what.map(x => '- ' + x),
    'Gdzie:', ...t.where.map(x => '- ' + x),
    box('consentSite'), box('consentSocial'), box('consentContact'), box('consentPhoneInListing'),
    `Imię i nazwisko: ${ownerName}`,
    'RODO: ' + t.rodo
  ].join('\n');
}
