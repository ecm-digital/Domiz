import { useEffect, useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import {
    Bath,
    BedDouble,
    Building2,
    CalendarCheck,
    Car,
    Check,
    ClipboardCheck,
    Download,
    HelpCircle,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Ruler,
    ShieldCheck,
    ShoppingBag,
    School,
    Trees,
    Train,
} from 'lucide-react';
import { db } from '../firebase';
import agentPhoto from '../assets/tomaszgnat.jpeg';
import { trackEvent } from '../utils/analytics';

const PHONE_DISPLAY = '+48 517 303 400';
const PHONE_LINK = 'tel:+48517303400';
const EMAIL = 'hello@domizhomes.com';
const OSIEDLE_TITLE = 'Dom pod Warszawą - Osiedle Tłuszcz Sasanka XL z garażem | Domiz Homes';
const OSIEDLE_DESCRIPTION = 'Szukasz domu pod Warszawą? Osiedle Tłuszcz przy ul. Zaściankowej to kameralne domy Sasanka XL z garażem, ogrodem i dojazdem PKP do Warszawy.';
const OSIEDLE_KEYWORDS = 'dom pod Warszawą, domy pod Warszawą, dom z garażem pod Warszawą, domy okolice Warszawy, dom Tłuszcz, domy Tłuszcz, Sasanka XL Tłuszcz, dom z ogrodem Mazowieckie, dom powiat wołomiński';
const OSIEDLE_URL = 'https://domizhomes.com/osiedle-tluszcz';
const OSIEDLE_OG_IMAGE = 'https://domizhomes.com/osiedle-tluszcz/og-osiedle-tluszcz.jpg';
const OSIEDLE_PDF_URL = '/osiedle-tluszcz/osiedle-tluszcz-oferta.pdf';

const TOP_FACTS = [
    { value: '5', label: 'domów w inwestycji' },
    { value: '2+1', label: 'dwa bliźniaki i dom wolnostojący' },
    { value: 'ok. 83 m²', label: 'Sasanka XL z garażem' },
    { value: 'Tłuszcz', label: 'spokojna lokalizacja z PKP' },
];

const DEVELOPMENT_UNITS = [
    {
        label: 'Bliźniak A',
        title: 'Sasanka XL z garażem',
        status: 'W przygotowaniu',
        description: 'Segment w zabudowie bliźniaczej z prywatnym ogrodem i garażem w bryle.',
    },
    {
        label: 'Bliźniak B',
        title: 'Sasanka XL z garażem',
        status: 'W przygotowaniu',
        description: 'Drugi bliźniak w tym samym układzie, z analogicznym standardem i osobnym wjazdem.',
    },
    {
        label: 'Dom wolnostojący',
        title: 'Sasanka XL z garażem',
        status: 'Największa prywatność',
        description: 'Wolnostojący dom z garażem dla osób, które chcą więcej przestrzeni wokół budynku.',
    },
];

const AVAILABILITY = [
    { name: 'Bliźniak A / lokal 1', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność' },
    { name: 'Bliźniak A / lokal 2', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność' },
    { name: 'Bliźniak B / lokal 1', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność' },
    { name: 'Bliźniak B / lokal 2', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność' },
    { name: 'Dom wolnostojący', type: 'Sasanka XL z garażem', status: 'Największa prywatność' },
];

const BUYING_STEPS = [
    { icon: MessageSquare, title: 'Krótka rozmowa', desc: 'Ustalamy, który wariant domu Cię interesuje i jaki masz termin decyzji.' },
    { icon: ClipboardCheck, title: 'Materiały i standard', desc: 'Wysyłamy aktualne informacje o inwestycji, układzie i możliwych opcjach.' },
    { icon: CalendarCheck, title: 'Spotkanie lub rezerwacja', desc: 'Umawiamy rozmowę, prezentację szczegółów albo kolejny krok rezerwacyjny.' },
];

const MODEL_FEATURES = [
    { icon: Ruler, label: 'ok. 83 m²', desc: 'kompaktowy metraż Sasanki XL' },
    { icon: BedDouble, label: '3 sypialnie', desc: 'czytelny układ dla rodziny' },
    { icon: Bath, label: '2 łazienki', desc: 'wygoda na co dzień' },
    { icon: Car, label: 'garaż', desc: 'w bryle każdego domu' },
];

const SASANKA_HIGHLIGHTS = [
    {
        icon: BedDouble,
        title: 'Układ dla rodziny',
        desc: 'Trzy sypialnie, garderoba i prywatna strefa nocna pomagają wygodnie podzielić dom na codzienną część wspólną i odpoczynek.',
    },
    {
        icon: Ruler,
        title: 'Miejsce na przechowywanie',
        desc: 'Projekt przewiduje praktyczne strefy na szafy, schowki i zaplecze gospodarcze, więc dom łatwiej utrzymać w porządku.',
    },
    {
        icon: Trees,
        title: 'Ogródek zamiast balkonu',
        desc: 'Własna przestrzeń przy domu daje miejsce na taras, zabawę dzieci i spokojne popołudnia poza mieszkaniem w bloku.',
    },
    {
        icon: Bath,
        title: 'Wygodne łazienki',
        desc: 'Dwie łazienki i pomieszczenie gospodarcze upraszczają poranki, pranie oraz codzienne funkcjonowanie większej rodziny.',
    },
    {
        icon: Car,
        title: 'Garaż i codzienna logistyka',
        desc: 'Wariant z garażem daje miejsce na samochód, rowery, narzędzia i dodatkowe rzeczy, które zwykle trudno zmieścić w mieszkaniu.',
    },
    {
        icon: ShieldCheck,
        title: 'Niższe koszty wspólne',
        desc: 'Dom pozwala samodzielniej kontrolować media i opłaty, bez typowych kosztów części wspólnych znanych z budynków wielorodzinnych.',
    },
];

const FLOOR_PLANS = [
    {
        level: 'Parter',
        title: 'Strefa dzienna z garażem i jasną kuchnią',
        image: '/osiedle-tluszcz/sasanka-xl-parter.webp',
        imageAlt: 'Rzut 3D parteru domu Sasanka XL z garażem',
        highlights: [
            'Przestronny salon',
            'Widna kuchnia z możliwością wydzielenia',
            'Koszty utrzymania porównywalne z mieszkaniem w bloku o powierzchni 50 m²',
        ],
        rooms: [
            { no: '1', name: 'Wiatrołap', area: '3,74 m²' },
            { no: '2', name: 'Łazienka', area: '5,40 m²' },
            { no: '3', name: 'Salon', area: '22,47 m²' },
            { no: '4', name: 'Kuchnia', area: '7,79 m²' },
            { no: '5', name: 'Schowek', area: '0,73 m²' },
            { no: '6', name: 'Garaż', area: '18,09 m²' },
        ],
    },
    {
        level: 'Piętro',
        title: 'Trzy sypialnie, duża łazienka i garderoba',
        image: '/osiedle-tluszcz/sasanka-xl-pietro.webp',
        imageAlt: 'Rzut 3D piętra domu Sasanka XL',
        highlights: [
            '3 sypialnie i duża łazienka',
            '4 duże szafy, schowek pod schodami oraz garderoba',
            'Pojemny strych',
        ],
        rooms: [
            { no: '1', name: 'Schody', area: '5,39 m²' },
            { no: '2', name: 'Łazienka', area: '6,83 m²' },
            { no: '3', name: 'Pokój 1', area: '9,11 m²' },
            { no: '4', name: 'Pokój 2', area: '9,11 m²' },
            { no: '5', name: 'Korytarz', area: '3,72 m²' },
            { no: '6', name: 'Garderoba', area: '2,01 m²' },
            { no: '7', name: 'Pokój 3', area: '6,70 m²' },
        ],
    },
];

const EQUIPMENT_PACKAGES = [
    {
        name: 'Deweloperski',
        badge: 'Baza',
        price: 'Cena na zapytanie',
        desc: 'Dla osób, które chcą samodzielnie zaplanować wykończenie i kontrolować budżet.',
        features: ['dom Sasanka XL z garażem', 'układ 3 sypialnie + 2 łazienki', 'ogród i miejsce na taras', 'materiały inwestycji i rzuty'],
    },
    {
        name: 'Komfort',
        badge: 'Popularny',
        price: 'Wycena po kontakcie',
        desc: 'Rozsądny pakiet dla rodzin, które chcą szybciej przejść od zakupu do wykończenia.',
        features: ['zakres deweloperski', 'konsultacja układu funkcjonalnego', 'propozycja wykończenia łazienek', 'lista rekomendowanych materiałów'],
    },
    {
        name: 'Premium',
        badge: 'Wyższy standard',
        price: 'Wycena indywidualna',
        desc: 'Dla kupujących, którzy chcą wyższy standard materiałów i spójny efekt wnętrza.',
        features: ['zakres Komfort', 'propozycja kuchni i zabudów', 'standard materiałów premium', 'harmonogram prac wykończeniowych'],
    },
    {
        name: 'Pod klucz',
        badge: 'Najwygodniej',
        price: 'Oferta po rozmowie',
        desc: 'Najmniej angażujący wariant dla osób, które chcą dostać gotowy plan i jedną ścieżkę działania.',
        features: ['zakres Premium', 'pełna koncepcja wnętrz', 'koordynacja ekip i dostaw', 'przygotowanie do zamieszkania'],
    },
];

const REALIZED_INVESTMENTS = [
    { place: 'Ciechanów i Krubin', region: 'woj. mazowieckie', model: 'Sasanka XL' },
    { place: 'Brodnica', region: 'woj. kujawsko-pomorskie', model: 'Sasanka XL' },
    { place: 'Kąpino', region: 'woj. pomorskie', model: 'osiedla Sasanka' },
    { place: 'Lusówko', region: 'woj. wielkopolskie', model: 'Osiedle ze Spokojem' },
    { place: 'Jasienica i Bystra', region: 'okolice Bielska-Białej', model: 'Sasanka XL' },
    { place: 'Elbląg i Gutkowo', region: 'woj. warmińsko-mazurskie', model: 'Sasanka XL' },
];

const FEATURED_REFERENCE_INVESTMENT = {
    place: 'Trojany',
    eyebrow: 'Najbliżej do obejrzenia',
    title: 'Podobne domy Sasanka XL możesz zobaczyć w Trojanach',
    desc: 'To najbliższa realizacja referencyjna względem Osiedla Tłuszcz. Dla klientów zainteresowanych zakupem może być najlepszym punktem odniesienia do obejrzenia skali domu, układu wnętrz i charakteru zabudowy na żywo.',
};

const TROJANY_VISIT_POINTS = [
    'zobaczyć realną skalę domu Sasanka XL',
    'sprawdzić układ salonu, kuchni, sypialni i łazienek',
    'porównać zdjęcia i wirtualny spacer z rzeczywistymi proporcjami',
    'porozmawiać o tym, który dom w Tłuszczu najlepiej pasuje do Twojej rodziny',
];

const REALIZED_STATS = [
    { value: '39', label: 'osiedli z domami Sasanka' },
    { value: '624', label: 'Sasanki w całej Polsce' },
    { value: '144', label: 'Sasanki dostępne w sprzedaży' },
];

const INTERIOR_GALLERY = [
    { title: 'Wiatrołap z zabudową', image: '/osiedle-tluszcz/gallery/01-wiatrolap.webp' },
    { title: 'Łazienka na parterze', image: '/osiedle-tluszcz/gallery/02-lazienka-dol.webp' },
    { title: 'Salon z wyjściem do ogrodu', image: '/osiedle-tluszcz/gallery/03-salon.webp' },
    { title: 'Strefa dzienna', image: '/osiedle-tluszcz/gallery/04-salon-rodzina.webp' },
    { title: 'Salon i jadalnia', image: '/osiedle-tluszcz/gallery/05-wnetrza.webp' },
    { title: 'Jasna kuchnia', image: '/osiedle-tluszcz/gallery/06-kuchnia.webp' },
    { title: 'Kuchnia z oknem', image: '/osiedle-tluszcz/gallery/07-kuchnia-detal.webp' },
    { title: 'Blat roboczy i zabudowa', image: '/osiedle-tluszcz/gallery/08-kuchnia-blat.webp' },
    { title: 'Jadalnia przy salonie', image: '/osiedle-tluszcz/gallery/09-jadalnia.webp' },
    { title: 'Schody i komunikacja', image: '/osiedle-tluszcz/gallery/10-schody.webp' },
    { title: 'Garderoba na piętrze', image: '/osiedle-tluszcz/gallery/11-garderoba.webp' },
    { title: 'Łazienka z wanną', image: '/osiedle-tluszcz/gallery/12-lazienka-gora-wanna.webp' },
    { title: 'Łazienka na piętrze', image: '/osiedle-tluszcz/gallery/13-lazienka-gora.webp' },
    { title: 'Sypialnia rodziców', image: '/osiedle-tluszcz/gallery/14-sypialnia-rodzicow.webp' },
    { title: 'Sypialnia z szafą', image: '/osiedle-tluszcz/gallery/15-sypialnia.webp' },
    { title: 'Wejście na strych', image: '/osiedle-tluszcz/gallery/16-strych.webp' },
    { title: 'Pokój dziecka', image: '/osiedle-tluszcz/gallery/17-pokoj-dziecka-lewy.webp' },
    { title: 'Drugi pokój dziecka', image: '/osiedle-tluszcz/gallery/18-pokoj-dziecka-prawy.webp' },
];

const LOCATION_POINTS = [
    { icon: MapPin, title: 'ul. Zaściankowa', desc: 'dokładna lokalizacja inwestycji w Tłuszczu' },
    { icon: Train, title: 'PKP Tłuszcz', desc: 'kolejowy dojazd w stronę Warszawy i okolic' },
    { icon: ShoppingBag, title: 'Centrum i usługi', desc: 'sklepy, punkty usługowe i codzienne sprawy w zasięgu miasta' },
    { icon: School, title: 'Szkoły i przedszkola', desc: 'zaplecze edukacyjne potrzebne rodzinom z dziećmi' },
    { icon: Trees, title: 'Spokojna okolica', desc: 'kameralny charakter zabudowy poza gęstym centrum' },
    { icon: ShieldCheck, title: 'Tylko 5 domów', desc: 'mała inwestycja bez efektu dużego osiedla' },
];

const LOCATION_MAP_POINTS = [
    {
        label: 'Inwestycja',
        title: 'ul. Zaściankowa, Tłuszcz',
        href: 'https://www.google.com/maps/search/?api=1&query=ul.%20Za%C5%9Bciankowa%2C%20T%C5%82uszcz',
    },
    {
        label: 'Komunikacja',
        title: 'Stacja PKP Tłuszcz',
        href: 'https://www.google.com/maps/search/?api=1&query=PKP%20T%C5%82uszcz',
    },
    {
        label: 'Centrum',
        title: 'Centrum Tłuszcza',
        href: 'https://www.google.com/maps/search/?api=1&query=centrum%20T%C5%82uszcz',
    },
    {
        label: 'Edukacja',
        title: 'Szkoły i przedszkola w Tłuszczu',
        href: 'https://www.google.com/maps/search/?api=1&query=szko%C5%82y%20przedszkola%20T%C5%82uszcz',
    },
];

const SEO_INTENT_CARDS = [
    {
        title: 'Dom pod Warszawą bez dużego osiedla',
        desc: 'Osiedle Tłuszcz to tylko 5 domów, więc jest dobrą propozycją dla osób, które szukają spokojniejszej alternatywy dla gęstej zabudowy bliżej Warszawy.',
    },
    {
        title: 'Dojazd do Warszawy koleją',
        desc: 'Tłuszcz ma połączenie PKP, dlatego inwestycja może pasować osobom pracującym w Warszawie, które chcą mieszkać w domu z ogrodem poza miastem.',
    },
    {
        title: 'Dom z garażem i ogrodem',
        desc: 'Każdy dom komunikujemy jako Sasanka XL z garażem, prywatną przestrzenią przy domu, trzema sypialniami i wygodnym układem rodzinnym.',
    },
];

const WARSAW_COMMUTE_POINTS = [
    {
        icon: Train,
        title: 'PKP w stronę Warszawy',
        desc: 'Tłuszcz ma stację kolejową, więc codzienny dojazd do Warszawy można planować bez uzależnienia wyłącznie od samochodu.',
    },
    {
        icon: Car,
        title: 'Auto na krótsze trasy',
        desc: 'Garaż w bryle domu pomaga wygodnie ogarnąć codzienne wyjazdy: szkoła, zakupy, praca hybrydowa i weekendowe sprawy.',
    },
    {
        icon: CalendarCheck,
        title: 'Dobre dla pracy hybrydowej',
        desc: 'Dom pod Warszawą ma sens szczególnie wtedy, gdy nie musisz codziennie być w centrum, ale chcesz zachować dojazd do miasta.',
    },
    {
        icon: MapPin,
        title: 'Spokojniejsza baza dla rodziny',
        desc: 'Zamiast mieszkania przy ruchliwej ulicy dostajesz ogród, garaż i bardziej prywatną przestrzeń do życia.',
    },
];

const WARSAW_COMPARISON_ROWS = [
    { label: 'Przestrzeń prywatna', flat: 'balkon lub mały taras', house: 'ogród przy domu i więcej prywatności' },
    { label: 'Parkowanie', flat: 'miejsce zależne od budynku lub strefy', house: 'garaż w bryle domu' },
    { label: 'Układ dla rodziny', flat: 'często kompromis metrażowy', house: '3 sypialnie, 2 łazienki i strefa dzienna' },
    { label: 'Koszty wspólne', flat: 'czynsz i części wspólne', house: 'większa kontrola nad codziennymi kosztami' },
    { label: 'Dojazd do Warszawy', flat: 'bliżej centrum, ale drożej za metr', house: 'dojazd PKP lub autem, spokojniejsza lokalizacja' },
];

const FAQ = [
    {
        question: 'Ile domów powstaje w inwestycji?',
        answer: 'Planowana jest mała inwestycja: dwa budynki bliźniacze po dwa lokale oraz jeden dom wolnostojący z garażem.',
    },
    {
        question: 'Czy każdy dom ma garaż?',
        answer: 'Tak, komunikujemy wariant Sasanka XL z garażem dla każdego domu w tej inwestycji.',
    },
    {
        question: 'Czy mogę zapytać o konkretny lokal?',
        answer: 'Tak. W formularzu możesz wskazać bliźniak, lokal albo dom wolnostojący. Oddzwonimy z aktualną dostępnością.',
    },
    {
        question: 'Czy mogę zobaczyć podobne domy na żywo?',
        answer: 'Tak. Najbliższą realizacją referencyjną są Trojany, dlatego możemy umówić obejrzenie podobnych domów Sasanka XL i pokazać skalę budynku, układ oraz charakter zabudowy.',
    },
    {
        question: 'Czy podana cena zależy od wariantu wyposażenia?',
        answer: 'Tak. Przygotowaliśmy cztery warianty: Deweloperski, Komfort, Premium i Pod klucz. Po kontakcie wyślemy aktualną cenę dla konkretnego domu i zakresu wykończenia.',
    },
    {
        question: 'Co obejmuje wariant deweloperski?',
        answer: 'To bazowy wariant dla osób, które chcą samodzielnie zaplanować wykończenie. W rozmowie doprecyzujemy standard, dostępne materiały i zakres prac dla wybranego domu.',
    },
    {
        question: 'Czy można kupić dom wykończony pod klucz?',
        answer: 'Tak, przewidujemy wariant Pod klucz. Zakres wymaga indywidualnej rozmowy, bo zależy od oczekiwanego standardu, materiałów i terminu realizacji.',
    },
    {
        question: 'Jak wygląda pierwszy krok rezerwacji?',
        answer: 'Najpierw potwierdzamy dostępność wybranego lokalu lub domu wolnostojącego, potem przekazujemy szczegóły standardu, ceny i możliwy harmonogram kolejnych kroków.',
    },
    {
        question: 'Czy pomagacie w finansowaniu?',
        answer: 'Możemy skierować do rozmowy o możliwościach finansowania i przygotować informacje potrzebne do dalszych ustaleń. Szczegóły zależą od sytuacji kupującego i wybranego wariantu.',
    },
    {
        question: 'Czy lokalizacja jest dobra do dojazdu do Warszawy?',
        answer: 'Tłuszcz ma dostęp do PKP i codziennych usług, dlatego komunikujemy tę inwestycję jako spokojniejsze miejsce do życia z możliwością dojazdu do Warszawy.',
    },
    {
        question: 'Czy to dobra oferta dla osób szukających domu pod Warszawą?',
        answer: 'Tak. Osiedle Tłuszcz jest kierowane do osób, które szukają domu pod Warszawą z ogrodem, garażem i spokojniejszą lokalizacją, ale nadal chcą mieć dojazd koleją i dostęp do usług w mieście.',
    },
    {
        question: 'Czym różni się dom w Tłuszczu od mieszkania bliżej Warszawy?',
        answer: 'Najważniejsza różnica to własny ogród, garaż, trzy sypialnie i bardziej prywatna przestrzeń. Dla wielu rodzin to alternatywa dla mieszkania w bloku przy zachowaniu możliwości dojazdu do Warszawy.',
    },
    {
        question: 'Czy zdjęcia są docelowe?',
        answer: 'Obecnie używamy zdjęć poglądowych. Po otrzymaniu licencjonowanych materiałów Sasanka XL podmienimy je na właściwe zdjęcia projektu.',
    },
    {
        question: 'Kiedy dostanę pełne materiały o inwestycji?',
        answer: 'Po wysłaniu formularza lub telefonie możemy przekazać aktualne informacje o dostępności, wariantach wyposażenia, rzutach i kolejnych krokach zakupu.',
    },
];

export function OsiedleTluszcz() {
    const [contactSent, setContactSent] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactMessage, setContactMessage] = useState('Interesuje mnie Osiedle Tłuszcz - Sasanka XL z garażem.');
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [showStickyCta, setShowStickyCta] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState('');
    const [selectedHome, setSelectedHome] = useState('');
    const [wantsTrojanyVisit, setWantsTrojanyVisit] = useState(false);

    useEffect(() => {
        document.title = OSIEDLE_TITLE;

        const updateMeta = (selector: string, attribute: 'name' | 'property', content: string) => {
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, selector.match(/"([^"]+)"/)?.[1] || '');
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        updateMeta('meta[name="description"]', 'name', OSIEDLE_DESCRIPTION);
        updateMeta('meta[name="keywords"]', 'name', OSIEDLE_KEYWORDS);
        updateMeta('meta[property="og:title"]', 'property', OSIEDLE_TITLE);
        updateMeta('meta[property="og:description"]', 'property', OSIEDLE_DESCRIPTION);
        updateMeta('meta[property="og:image"]', 'property', OSIEDLE_OG_IMAGE);
        updateMeta('meta[property="og:url"]', 'property', OSIEDLE_URL);
        updateMeta('meta[property="twitter:title"]', 'property', OSIEDLE_TITLE);
        updateMeta('meta[property="twitter:description"]', 'property', OSIEDLE_DESCRIPTION);
        updateMeta('meta[property="twitter:image"]', 'property', OSIEDLE_OG_IMAGE);
        updateMeta('meta[property="twitter:url"]', 'property', OSIEDLE_URL);

        const canonical = document.querySelector('link[rel="canonical"]');
        canonical?.setAttribute('href', OSIEDLE_URL);

        const schema = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Residence',
                    '@id': `${OSIEDLE_URL}#residence`,
                    name: 'Osiedle Tłuszcz - domy Sasanka XL z garażem pod Warszawą',
                    description: OSIEDLE_DESCRIPTION,
                    image: [OSIEDLE_OG_IMAGE],
                    url: OSIEDLE_URL,
                    address: {
                        '@type': 'PostalAddress',
                        streetAddress: 'ul. Zaściankowa',
                        addressLocality: 'Tłuszcz',
                        addressRegion: 'Mazowieckie',
                        addressCountry: 'PL',
                    },
                    amenityFeature: [
                        { '@type': 'LocationFeatureSpecification', name: 'garaż', value: true },
                        { '@type': 'LocationFeatureSpecification', name: 'ogród', value: true },
                        { '@type': 'LocationFeatureSpecification', name: 'dojazd PKP do Warszawy', value: true },
                    ],
                },
                {
                    '@type': 'FAQPage',
                    '@id': `${OSIEDLE_URL}#faq`,
                    mainEntity: FAQ.map((item) => ({
                        '@type': 'Question',
                        name: item.question,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: item.answer,
                        },
                    })),
                },
            ],
        };
        let schemaElement = document.getElementById('osiedle-tluszcz-schema');
        if (!schemaElement) {
            schemaElement = document.createElement('script');
            schemaElement.id = 'osiedle-tluszcz-schema';
            schemaElement.setAttribute('type', 'application/ld+json');
            document.head.appendChild(schemaElement);
        }
        schemaElement.textContent = JSON.stringify(schema);
    }, []);

    useEffect(() => {
        if (window.location.hash === '#kontakt') {
            document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => setShowStickyCta(window.scrollY > 720);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleContactSubmit = async (e: React.FormEvent, messageOverride?: string) => {
        e.preventDefault();
        if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) return;
        setContactSubmitting(true);
        const params = new URLSearchParams(window.location.search);
        const inquiryMessage = messageOverride || contactMessage;
        const leadDetails = [
            selectedHome ? `Wybrany dom: ${selectedHome}` : null,
            selectedPackage ? `Wariant wyposażenia: ${selectedPackage}` : null,
            wantsTrojanyVisit ? 'Klient chce obejrzeć podobne domy w Trojanach' : null,
        ].filter(Boolean);
        const finalMessage = leadDetails.length
            ? `${inquiryMessage.trim()}\n\nSzczegóły zapytania:\n${leadDetails.join('\n')}`
            : inquiryMessage.trim();

        try {
            await addDoc(collection(db, 'inquiries'), {
                type: 'contact',
                name: contactName.trim(),
                email: contactEmail.trim(),
                phone: contactPhone.trim(),
                message: finalMessage,
                home: selectedHome || null,
                package: selectedPackage || null,
                wantsTrojanyVisit,
                createdAt: new Date().toISOString(),
                source: 'osiedle-tluszcz-sasanka-xl',
                campaign: {
                    utmSource: params.get('utm_source') || null,
                    utmMedium: params.get('utm_medium') || null,
                    utmCampaign: params.get('utm_campaign') || null,
                    utmContent: params.get('utm_content') || null,
                },
            });
            setContactSent(true);
            setContactName('');
            setContactEmail('');
            setContactPhone('');
            setContactMessage('Interesuje mnie Osiedle Tłuszcz - Sasanka XL z garażem.');
            setSelectedPackage('');
            setSelectedHome('');
            setWantsTrojanyVisit(false);
            trackEvent('lead_form_submit', {
                source: 'osiedle_tluszcz_contact_form',
                status: 'success',
                hasHome: Boolean(selectedHome),
                hasPackage: Boolean(selectedPackage),
                wantsTrojanyVisit,
            });
        } catch (err) {
            console.error(err);
            trackEvent('lead_form_submit', {
                source: 'osiedle_tluszcz_contact_form',
                status: 'error',
            });
        } finally {
            setContactSubmitting(false);
        }
    };

    const askForPackage = (packageName: string) => {
        setSelectedPackage(packageName);
        setContactMessage(`Interesuje mnie Osiedle Tłuszcz - Sasanka XL z garażem. Proszę o cenę i szczegóły pakietu: ${packageName}.`);
        const contactSection = document.getElementById('kontakt');
        contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
        trackEvent('lead_contact_click', { type: 'package', package: packageName, source: 'osiedle_packages' });
    };

    const askForTrojanyVisit = () => {
        setWantsTrojanyVisit(true);
        setContactMessage('Interesuje mnie Osiedle Tłuszcz. Chcę umówić obejrzenie podobnych domów Sasanka XL w Trojanach.');
        const contactSection = document.getElementById('kontakt');
        contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
        trackEvent('lead_contact_click', { type: 'reference_visit', source: 'trojany_reference' });
    };

    const askForPriceList = () => {
        setContactMessage('Interesuje mnie Osiedle Tłuszcz. Proszę o aktualny cennik, dostępność domów i informacje o wariantach wyposażenia.');
        const contactSection = document.getElementById('kontakt');
        contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
        trackEvent('lead_contact_click', { type: 'price_list', source: 'quick_lead' });
    };

    const trackPdfDownload = (source: string) => {
        trackEvent('lead_contact_click', { type: 'pdf_download', source });
    };

    return (
        <div className="tluszcz-page">
            <section className="tluszcz-hero">
                <div className="container tluszcz-hero-grid">
                    <div className="tluszcz-hero-copy">
                        <span className="tluszcz-eyebrow">Dom pod Warszawą | Osiedle Tłuszcz</span>
                        <h1>Dom pod Warszawą: Sasanka XL z garażem w Tłuszczu</h1>
                        <p>
                            Powstają dwa domy bliźniacze z garażami oraz jeden dom wolnostojący z garażem.
                            To propozycja dla rodzin szukających domu z ogrodem pod Warszawą, w spokojnej
                            lokalizacji z dostępem do PKP i codziennych usług.
                        </p>
                        <div className="tluszcz-hero-facts">
                            {TOP_FACTS.map((fact) => (
                                <div key={fact.label}>
                                    <strong>{fact.value}</strong>
                                    <span>{fact.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="tluszcz-hero-actions">
                            <a className="btn-primary" href="#kontakt">Zapytaj o dostępność</a>
                            <a className="btn-secondary" href={PHONE_LINK}>{PHONE_DISPLAY}</a>
                            <a
                                className="btn-secondary"
                                href={OSIEDLE_PDF_URL}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackPdfDownload('hero')}
                            >
                                <Download size={18} />
                                Otwórz PDF
                            </a>
                        </div>
                    </div>

                </div>
            </section>

            <section className="tluszcz-availability-strip">
                <div className="container tluszcz-availability-inner">
                    <div>
                        <span className="section-label">Dostępność</span>
                        <h2>Sprawdź, który z 5 domów możesz zarezerwować</h2>
                    </div>
                    <a className="btn-primary" href="#kontakt">Sprawdź dostępność</a>
                </div>
            </section>

            <section className="tluszcz-quick-lead-section">
                <div className="container tluszcz-quick-lead">
                    <div>
                        <span className="section-label">Cennik i dostępność</span>
                        <h2>Wyślij mi aktualny cennik Osiedla Tłuszcz</h2>
                        <p>
                            Zostaw kontakt, a odeślemy informacje o wolnych domach, wariantach wyposażenia
                            i możliwości obejrzenia podobnych domów w Trojanach.
                        </p>
                    </div>
                    {contactSent ? (
                        <div className="tluszcz-quick-success">
                            <Check size={24} />
                            <strong>Dziękujemy. Odezwemy się z cennikiem.</strong>
                        </div>
                    ) : (
                        <form
                            className="tluszcz-quick-lead-form"
                            onSubmit={(e) => handleContactSubmit(e, 'Interesuje mnie Osiedle Tłuszcz. Proszę o aktualny cennik, dostępność domów i informacje o wariantach wyposażenia.')}
                        >
                            <input type="text" placeholder="Imię" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                            <input type="email" placeholder="E-mail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                            <input type="tel" placeholder="Telefon" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                            <button type="submit" className="btn-primary" disabled={contactSubmitting}>
                                {contactSubmitting ? 'Wysyłanie...' : 'Wyślij cennik'}
                            </button>
                        </form>
                    )}
                    <div className="tluszcz-quick-actions">
                        <button type="button" className="btn-secondary" onClick={askForPriceList}>Wypełnij formularz niżej</button>
                        <a
                            className="btn-secondary"
                            href={OSIEDLE_PDF_URL}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackPdfDownload('quick_lead')}
                        >
                            <Download size={18} />
                            Otwórz ofertę PDF
                        </a>
                        <a className="btn-secondary" href={PHONE_LINK}>{PHONE_DISPLAY}</a>
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Co powstaje</span>
                        <h2>Trzy budynki, pięć domów, jeden spójny standard</h2>
                    </div>
                    <div className="tluszcz-units-grid">
                        {DEVELOPMENT_UNITS.map((unit) => (
                            <article key={unit.label} className="tluszcz-info-card">
                                <span>{unit.label}</span>
                                <h3>{unit.title}</h3>
                                <p>{unit.description}</p>
                                <strong>{unit.status}</strong>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-availability-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">5 domów</span>
                        <h2>Aktualna lista wariantów w inwestycji</h2>
                        <p>Wybierz konkretny lokal albo dom wolnostojący i poproś o aktualną dostępność, cenę oraz standard.</p>
                    </div>
                    <div className="tluszcz-availability-grid">
                        {AVAILABILITY.map((unit) => (
                            <a key={unit.name} href="#kontakt" className="tluszcz-availability-card">
                                <span>{unit.status}</span>
                                <strong>{unit.name}</strong>
                                <p>{unit.type}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-muted-section">
                <div className="container tluszcz-location-grid">
                    <div>
                        <span className="section-label">Lokalizacja</span>
                        <h2>ul. Zaściankowa w Tłuszczu: dom pod Warszawą z dojazdem PKP</h2>
                        <p>
                            Osiedle powstaje przy ul. Zaściankowej w Tłuszczu, w kameralnej części miasta.
                            To lokalizacja dla osób, które chcą mieszkać spokojniej, a jednocześnie mieć dostęp
                            do kolei, sklepów, szkół i codziennych usług bez wyprowadzki w zupełną samotnię.
                        </p>
                        <p>
                            Tłuszcz leży w powiecie wołomińskim i jest praktycznym wyborem dla rodzin szukających
                            domu pod Warszawą, ale poza intensywną zabudową stolicy. Miasto ma zaplecze edukacyjne,
                            lokalne sklepy, usługi oraz stację kolejową, która pomaga organizować dojazdy do pracy
                            i szkoły.
                        </p>
                    </div>

                    <div className="tluszcz-location-panel">
                        <div className="tluszcz-location-list">
                            {LOCATION_POINTS.map((point) => (
                                <div key={point.title} className="tluszcz-location-item">
                                    <point.icon size={22} />
                                    <div>
                                        <strong>{point.title}</strong>
                                        <span>{point.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="tluszcz-map-card">
                            <iframe
                                title="Mapa lokalizacji Osiedla Tłuszcz przy ul. Zaściankowej"
                                src="https://www.google.com/maps?q=ul.%20Za%C5%9Bciankowa%2C%20T%C5%82uszcz&output=embed"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <div className="tluszcz-map-points">
                                {LOCATION_MAP_POINTS.map((point) => (
                                    <a key={point.title} href={point.href} target="_blank" rel="noreferrer">
                                        <span>{point.label}</span>
                                        <strong>{point.title}</strong>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container tluszcz-commute-grid">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Dojazd do Warszawy</span>
                        <h2>Dom pod Warszawą, który nadal pozwala planować życie wokół miasta</h2>
                        <p>
                            Osiedle Tłuszcz jest dla osób, które chcą więcej prywatnej przestrzeni, ale nie chcą
                            odcinać się od Warszawy. Aktualny czas przejazdu warto zawsze sprawdzić w rozkładzie PKP
                            lub mapach, ale sama lokalizacja daje sensowną bazę dla pracy, szkoły i spraw rodzinnych.
                        </p>
                    </div>
                    <div className="tluszcz-commute-cards">
                        {WARSAW_COMMUTE_POINTS.map((point) => (
                            <article key={point.title} className="tluszcz-commute-card">
                                <point.icon size={22} />
                                <h3>{point.title}</h3>
                                <p>{point.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Domy pod Warszawą</span>
                        <h2>Dla osób, które chcą zamienić mieszkanie na dom z ogrodem</h2>
                        <p>
                            Jeżeli wpisujesz w Google „dom pod Warszawą”, najczęściej szukasz kompromisu:
                            więcej prywatnej przestrzeni niż w mieszkaniu, ale nadal z rozsądnym dojazdem
                            do pracy, szkoły i usług. Osiedle Tłuszcz odpowiada właśnie na taką potrzebę.
                        </p>
                    </div>
                    <div className="tluszcz-benefits-grid">
                        {SEO_INTENT_CARDS.map((item) => (
                            <article key={item.title} className="tluszcz-benefit-card">
                                <MapPin size={22} />
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-muted-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Porównanie</span>
                        <h2>Mieszkanie w Warszawie czy dom w Tłuszczu?</h2>
                        <p>
                            Dla wielu rodzin wybór nie sprowadza się tylko do lokalizacji. Chodzi o prywatność,
                            ogród, garaż, układ pomieszczeń i codzienną wygodę. Poniżej proste porównanie,
                            które pomaga klientowi szybko zrozumieć różnicę.
                        </p>
                    </div>
                    <div className="tluszcz-comparison-table" role="table" aria-label="Porównanie mieszkania w Warszawie i domu w Tłuszczu">
                        <div className="tluszcz-comparison-row tluszcz-comparison-head" role="row">
                            <span role="columnheader">Kryterium</span>
                            <span role="columnheader">Mieszkanie w Warszawie</span>
                            <span role="columnheader">Dom w Osiedlu Tłuszcz</span>
                        </div>
                        {WARSAW_COMPARISON_ROWS.map((row) => (
                            <div key={row.label} className="tluszcz-comparison-row" role="row">
                                <strong role="cell">{row.label}</strong>
                                <span role="cell">{row.flat}</span>
                                <span role="cell">{row.house}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-muted-section">
                <div className="container tluszcz-model-grid">
                    <div>
                        <span className="section-label">Model domu</span>
                        <h2>Sasanka XL: większy układ rodzinny, dostępny także jako wolnostojący</h2>
                        <p>
                            Sasanka XL to model zaprojektowany jako alternatywa dla mieszkania w bloku:
                            około 83 m² powierzchni użytkowej, trzy sypialnie, garderoba, ogródek oraz
                            garaż lub miejsce postojowe. W Osiedlu Tłuszcz komunikujemy wariant z garażem
                            dla każdego domu.
                        </p>
                        <a
                            className="tluszcz-reference-link"
                            href="https://sasanka.eu/sasanka-xl/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Źródło: oficjalna karta modelu Sasanka XL
                        </a>
                    </div>
                    <div className="tluszcz-feature-grid">
                        {MODEL_FEATURES.map((item) => (
                            <div key={item.label} className="tluszcz-feature">
                                <item.icon size={22} />
                                <strong>{item.label}</strong>
                                <span>{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Dlaczego Sasanka XL</span>
                        <h2>Dom pomyślany pod codzienne życie, nie tylko pod metraż</h2>
                        <p>
                            Najważniejsze atuty modelu opisujemy własnym językiem na podstawie oficjalnych
                            informacji o Sasance XL. Chodzi o prosty układ, dużo miejsca na przechowywanie,
                            ogródek i koszty codziennego użytkowania bardziej przewidywalne niż w dużej wspólnocie.
                        </p>
                    </div>
                    <div className="tluszcz-benefits-grid">
                        {SASANKA_HIGHLIGHTS.map((item) => (
                            <article key={item.title} className="tluszcz-benefit-card">
                                <item.icon size={22} />
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-muted-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Rzuty 3D</span>
                        <h2>Parter i piętro Sasanki XL z garażem</h2>
                        <p>
                            Zobacz układ najważniejszych pomieszczeń: wygodną strefę dzienną na parterze,
                            garaż w bryle oraz piętro z trzema sypialniami, dużą łazienką i garderobą.
                        </p>
                    </div>
                    <div className="tluszcz-floorplan-list">
                        {FLOOR_PLANS.map((plan) => (
                            <article key={plan.level} className="tluszcz-floorplan-card">
                                <div className="tluszcz-floorplan-visual">
                                    <img src={plan.image} alt={plan.imageAlt} loading="lazy" />
                                </div>
                                <div className="tluszcz-floorplan-content">
                                    <span className="section-label">{plan.level}</span>
                                    <h3>{plan.title}</h3>
                                    <ul className="tluszcz-floorplan-highlights">
                                        {plan.highlights.map((highlight) => (
                                            <li key={highlight}>
                                                <Check size={16} />
                                                <span>{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="tluszcz-room-table" role="table" aria-label={`Pomieszczenia - ${plan.level}`}>
                                        <div className="tluszcz-room-row tluszcz-room-head" role="row">
                                            <span role="columnheader">Nr</span>
                                            <span role="columnheader">Pomieszczenie</span>
                                            <span role="columnheader">Powierzchnia</span>
                                        </div>
                                        {plan.rooms.map((room) => (
                                            <div key={`${plan.level}-${room.no}`} className="tluszcz-room-row" role="row">
                                                <span role="cell">{room.no}</span>
                                                <span role="cell">{room.name}</span>
                                                <span role="cell">{room.area}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Cennik</span>
                        <h2>4 warianty wyposażenia domu</h2>
                        <p>
                            Finalna cena zależy od wybranego domu, dostępności i zakresu wyposażenia.
                            Zostaw kontakt, a wyślemy aktualny cennik dla konkretnego lokalu lub domu wolnostojącego.
                        </p>
                    </div>
                    <div className="tluszcz-package-grid">
                        {EQUIPMENT_PACKAGES.map((pkg) => (
                            <article key={pkg.name} className="tluszcz-package-card">
                                <span>{pkg.badge}</span>
                                <h3>{pkg.name}</h3>
                                <strong>{pkg.price}</strong>
                                <p>{pkg.desc}</p>
                                <ul>
                                    {pkg.features.map((feature) => (
                                        <li key={feature}><Check size={16} /> {feature}</li>
                                    ))}
                                </ul>
                                <button type="button" className="btn-secondary" onClick={() => askForPackage(pkg.name)}>
                                    Zapytaj o wariant
                                </button>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-inline-cta">
                <div className="container tluszcz-inline-cta-inner">
                    <div>
                        <span className="section-label">Kolejny krok</span>
                        <h2>Chcesz dostać aktualną cenę i dostępność?</h2>
                        <p>Wyślemy informacje o wolnych domach, wariantach wyposażenia i możliwej ścieżce rezerwacji.</p>
                    </div>
                    <div className="tluszcz-inline-actions">
                        <a className="btn-primary" href="#kontakt">Poproś o cennik</a>
                        <a
                            className="btn-secondary"
                            href={OSIEDLE_PDF_URL}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackPdfDownload('inline_cta')}
                        >
                            <Download size={18} />
                            Otwórz PDF
                        </a>
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container tluszcz-realized-grid">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Zrealizowane inwestycje</span>
                        <h2>Sasanki stoją już w wielu miejscach w Polsce</h2>
                        <p>
                            Osiedle Tłuszcz bazuje na sprawdzonym modelu domu. Na oficjalnej stronie Sasanki
                            można zobaczyć przykłady zrealizowanych osiedli w różnych regionach kraju.
                        </p>
                        <a
                            className="tluszcz-reference-link"
                            href="https://sasanka.eu/realizacje/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Zobacz oficjalną galerię realizacji
                        </a>
                    </div>

                    <div className="tluszcz-realized-panel">
                        <article className="tluszcz-featured-realization">
                            <div className="tluszcz-featured-realization-icon">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <span>{FEATURED_REFERENCE_INVESTMENT.eyebrow}</span>
                                <h3>{FEATURED_REFERENCE_INVESTMENT.title}</h3>
                                <p>{FEATURED_REFERENCE_INVESTMENT.desc}</p>
                                <div className="tluszcz-trojany-visit">
                                    <strong>Podczas takiego spotkania możesz:</strong>
                                    <ul>
                                        {TROJANY_VISIT_POINTS.map((point) => (
                                            <li key={point}><Check size={16} /> {point}</li>
                                        ))}
                                    </ul>
                                </div>
                                <button type="button" className="btn-primary" onClick={askForTrojanyVisit}>
                                    Umów obejrzenie podobnych domów
                                </button>
                            </div>
                        </article>
                        <div className="tluszcz-realized-stats">
                            {REALIZED_STATS.map((stat) => (
                                <div key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="tluszcz-realized-list">
                            {REALIZED_INVESTMENTS.map((item) => (
                                <article key={`${item.place}-${item.region}`} className="tluszcz-realized-card">
                                    <Building2 size={20} />
                                    <div>
                                        <h3>{item.place}</h3>
                                        <p>{item.region}</p>
                                        <span>{item.model}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Galeria wnętrz</span>
                        <h2>Zobacz przykładowe wnętrza modelowej Sasanki XL</h2>
                        <p>
                            Zdjęcia pokazują modelową Sasankę XL i pomagają wyobrazić sobie skalę salonu,
                            kuchni, sypialni, łazienek oraz praktycznych stref przechowywania. Materiały są
                            poglądowe dla modelu domu.
                        </p>
                    </div>
                    <div className="tluszcz-gallery-grid">
                        {INTERIOR_GALLERY.map((photo, index) => (
                            <a
                                key={photo.title}
                                className={`tluszcz-gallery-card${index === 0 ? ' tluszcz-gallery-featured' : ''}`}
                                href={photo.image}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <img src={photo.image} alt={photo.title} loading="lazy" />
                                <div>
                                    <span><Building2 size={16} /> Zdjęcie {index + 1}</span>
                                    <strong>{photo.title}</strong>
                                </div>
                            </a>
                        ))}
                    </div>
                    <a
                        className="tluszcz-reference-link"
                        href="https://sasanka.eu/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Zobacz oficjalne materiały Sasanka.eu
                    </a>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-video-section">
                <div className="container tluszcz-video-grid">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Wideo</span>
                        <h2>Zobacz klimat podobnej realizacji</h2>
                        <p>
                            To materiał poglądowy z innej inwestycji. Pokazuje charakter zabudowy i standard
                            komunikacji, a docelowe wideo Osiedla Tłuszcz możemy podmienić, gdy będzie gotowe.
                        </p>
                    </div>
                    <div className="tluszcz-video-frame">
                        <iframe
                            src="https://www.youtube.com/embed/3Vu53sKTh14"
                            title="Materiał wideo z innej inwestycji"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-tour-section">
                <div className="container tluszcz-video-grid">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Wirtualny spacer</span>
                        <h2>Wejdź do modelowej Sasanki XL</h2>
                        <p>
                            Spacer Matterport pozwala zobaczyć proporcje wnętrz, układ pomieszczeń i codzienną
                            funkcjonalność modelu Sasanka XL jeszcze przed rozmową o konkretnym domu w Tłuszczu.
                        </p>
                    </div>
                    <div className="tluszcz-video-frame tluszcz-tour-frame">
                        <iframe
                            src="https://my.matterport.com/show/?m=gs1VWpZqZun"
                            title="Wirtualny spacer po modelowej Sasance XL"
                            allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
                            allowFullScreen
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            <section className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Jak to działa</span>
                        <h2>Prosty proces dla osób zainteresowanych domem</h2>
                    </div>
                    <div className="tluszcz-steps-grid">
                        {BUYING_STEPS.map((step, index) => (
                            <div key={step.title} className="tluszcz-step-card">
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                <step.icon size={24} />
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-section tluszcz-muted-section">
                <div className="container tluszcz-faq-grid">
                    <div>
                        <span className="section-label">FAQ</span>
                        <h2>Najczęstsze pytania przed kontaktem</h2>
                        <p className="tluszcz-faq-intro">
                            Zebraliśmy odpowiedzi na pytania, które najczęściej pojawiają się przed rozmową:
                            o cenę, standard, możliwość obejrzenia podobnych domów i kolejne kroki rezerwacji.
                        </p>
                        <div className="tluszcz-faq-actions">
                            <a className="btn-primary" href="#kontakt">Zadaj własne pytanie</a>
                            <a className="btn-secondary" href={PHONE_LINK}>{PHONE_DISPLAY}</a>
                        </div>
                    </div>
                    <div className="tluszcz-faq-list">
                        {FAQ.map((item) => (
                            <article key={item.question} className="tluszcz-faq-item">
                                <HelpCircle size={20} />
                                <div>
                                    <h3>{item.question}</h3>
                                    <p>{item.answer}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="kontakt" className="tluszcz-contact-section">
                <div className="container">
                    <div className="tluszcz-contact-card">
                        <div>
                            <span className="section-label">Kontakt</span>
                            <h2>Zapytaj o Osiedle Tłuszcz</h2>
                            <p>
                                Podaj kontakt, a wrócimy z aktualnym statusem dostępności domów,
                                standardem i kolejnymi krokami rezerwacji.
                            </p>

                            <div className="tluszcz-agent">
                                <img src={agentPhoto} alt="Tomasz Gnat" />
                                <div>
                                    <strong>Tomasz Gnat</strong>
                                    <span>Domiz Homes</span>
                                </div>
                            </div>

                            <div className="tluszcz-contact-links">
                                <a href={PHONE_LINK} onClick={() => trackEvent('lead_contact_click', { type: 'phone', source: 'osiedle_contact_card' })}>
                                    <Phone size={18} /> {PHONE_DISPLAY}
                                </a>
                                <a href={`mailto:${EMAIL}`} onClick={() => trackEvent('lead_contact_click', { type: 'email', source: 'osiedle_contact_card' })}>
                                    <Mail size={18} /> {EMAIL}
                                </a>
                            </div>
                        </div>

                        {contactSent ? (
                            <div className="tluszcz-success">
                                <Check size={28} />
                                <strong>Dziękujemy za wiadomość.</strong>
                                <span>Skontaktujemy się wkrótce.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="tluszcz-form">
                                <input type="text" placeholder="Imię i nazwisko" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                                <input type="email" placeholder="E-mail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                                <input type="tel" placeholder="Telefon" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                                <select value={selectedHome} onChange={(e) => setSelectedHome(e.target.value)}>
                                    <option value="">Który dom Cię interesuje?</option>
                                    {AVAILABILITY.map((unit) => (
                                        <option key={unit.name} value={unit.name}>{unit.name}</option>
                                    ))}
                                </select>
                                <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)}>
                                    <option value="">Wariant wyposażenia</option>
                                    {EQUIPMENT_PACKAGES.map((pkg) => (
                                        <option key={pkg.name} value={pkg.name}>{pkg.name}</option>
                                    ))}
                                </select>
                                <label className="tluszcz-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={wantsTrojanyVisit}
                                        onChange={(e) => setWantsTrojanyVisit(e.target.checked)}
                                    />
                                    <span>Chcę obejrzeć podobne domy Sasanka XL w Trojanach</span>
                                </label>
                                <textarea placeholder="Wiadomość" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={4} />
                                <a
                                    className="tluszcz-pdf-link"
                                    href={OSIEDLE_PDF_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => trackPdfDownload('contact_form')}
                                >
                                    <Download size={18} />
                                    Otwórz ofertę PDF przed rozmową
                                </a>
                                <button type="submit" className="btn-primary" disabled={contactSubmitting}>
                                    {contactSubmitting ? 'Wysyłanie...' : 'Wyślij zapytanie'}
                                </button>
                                <p className="tluszcz-form-note">
                                    Wysyłając formularz, prosisz o kontakt w sprawie Osiedla Tłuszcz. Dane wykorzystamy wyłącznie do obsługi zapytania.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>
            <div className={`tluszcz-sticky-cta${showStickyCta ? ' is-visible' : ''}`}>
                <a href="#kontakt" className="btn-primary">Zapytaj o dostępność</a>
                <a
                    href={OSIEDLE_PDF_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary tluszcz-sticky-pdf"
                    onClick={() => trackPdfDownload('sticky_cta')}
                >
                    <Download size={18} />
                    Oferta PDF
                </a>
                <a href={PHONE_LINK} className="btn-secondary tluszcz-sticky-phone">{PHONE_DISPLAY}</a>
            </div>
        </div>
    );
}
