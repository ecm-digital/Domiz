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
import { useLanguage } from '../context/useLanguage';

const PHONE_DISPLAY = '+48 517 303 400';
const PHONE_LINK = 'tel:+48517303400';
const EMAIL = 'hello@domizhomes.com';
const OSIEDLE_TITLE = 'Osiedle Sasankowe Tłuszcz — domy Sasanka XL z garażem | Domiz Homes';
const OSIEDLE_DESCRIPTION = 'Osiedle Sasankowe Tłuszcz przy ul. Zaściankowej: 5 kameralnych domów Sasanka XL z garażem, ogrodem i dojazdem PKP do Warszawy.';
const OSIEDLE_KEYWORDS = 'Osiedle Sasankowe, Osiedle Sasankowe Tłuszcz, dom pod Warszawą, domy pod Warszawą, dom z garażem pod Warszawą, dom Tłuszcz, Sasanka XL Tłuszcz, dom z ogrodem Mazowieckie';
const OSIEDLE_URL = 'https://domizhomes.com/osiedle-tluszcz';
const OSIEDLE_OG_IMAGE = 'https://domizhomes.com/osiedle-tluszcz/og-osiedle-tluszcz.jpg';
const OSIEDLE_PDF_URL = '/osiedle-tluszcz/osiedle-tluszcz-oferta.pdf';
const OSIEDLE_BRAND = 'Osiedle Sasankowe Tłuszcz';
const HERO_IMAGE = '/osiedle-tluszcz/wizualizacja-osiedla-v6.png';
const SITE_PLAN_IMAGE = '/osiedle-tluszcz/plan-osiedla-v1.png';

function EnglishTluszczEstate() {
    const downloadPdf = () => trackEvent('lead_contact_click', { type: 'pdf_download', source: 'english_estate_page' });
    return (
        <div className="tluszcz-page sasankowe-page">
            <section className="sasankowe-hero">
                <img className="sasankowe-hero__media" src={HERO_IMAGE} alt="Osiedle Sasankowe Tłuszcz visualisation" />
                <div className="sasankowe-hero__shade" />
                <div className="sasankowe-hero__content">
                    <span className="sasankowe-hero__brand">Osiedle Sasankowe Tłuszcz</span>
                    <h1>Quiet Tłuszcz.<br />Warsaw within reach.</h1>
                    <p>Five Sasanka XL homes with garages — a boutique estate on Zaściankowa Street with rail access to Warsaw.</p>
                    <div className="sasankowe-hero__actions">
                        <a className="sasankowe-btn sasankowe-btn--primary" href="#wybierz-dom">Choose a home</a>
                        <a className="sasankowe-btn sasankowe-btn--ghost" href="#contact">Ask about availability</a>
                    </div>
                </div>
            </section>

            <section id="wybierz-dom" className="sasankowe-unit-search">
                <div className="container">
                    <div className="sasankowe-unit-search__intro">
                        <span className="section-label">Unit search</span>
                        <h2>Select home A–E on the estate plan</h2>
                        <p>Click a unit to see its status, then ask about current availability and pricing.</p>
                    </div>
                    <div className="sasankowe-unit-search__layout">
                        <figure className="sasankowe-plan">
                            <img src={SITE_PLAN_IMAGE} alt="Illustrative plan of Osiedle Sasankowe Tłuszcz" />
                            {DEVELOPMENT_UNITS.map((unit) => (
                                <a
                                    key={unit.id}
                                    href="#contact"
                                    className="sasankowe-hotspot"
                                    style={{ left: unit.hotspot.left, top: unit.hotspot.top }}
                                    aria-label={`Home ${unit.id}`}
                                >
                                    {unit.id}
                                </a>
                            ))}
                        </figure>
                        <div className="sasankowe-unit-list">
                            {DEVELOPMENT_UNITS.map((unit) => (
                                <a key={unit.id} href="#contact" className="sasankowe-unit-card">
                                    <span>{unit.id}</span>
                                    <div>
                                        <strong>{unit.label}</strong>
                                        <p>{unit.type}</p>
                                        <em>{unit.status}</em>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="tluszcz-section"><div className="container tluszcz-location-grid"><div><span className="section-label">Location</span><h2>Zaściankowa Street, Tłuszcz</h2><p>Osiedle Sasankowe is a quiet, boutique development with rail access and everyday services nearby.</p></div><div className="tluszcz-map-card"><iframe title="Map of Osiedle Sasankowe Tłuszcz" src="https://www.google.com/maps?q=ul.%20Za%C5%9Bciankowa%2C%20T%C5%82uszcz&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></div></section>

            <section id="contact" className="tluszcz-contact-section"><div className="container tluszcz-contact-grid"><div><span className="section-label">Contact</span><h2>Ask for the current price list and availability</h2></div><div className="tluszcz-contact-card"><a className="btn-primary" href={`mailto:${EMAIL}?subject=Osiedle%20Sasankowe%20Tluszcz`}>Email us</a><a className="btn-secondary" href={PHONE_LINK}><Phone size={18} />{PHONE_DISPLAY}</a><a className="btn-secondary" href={OSIEDLE_PDF_URL} target="_blank" rel="noreferrer" onClick={downloadPdf}><Download size={18} />Download PDF</a></div></div></section>
        </div>
    );
}

const TOP_FACTS = [
    { value: 'A–E', label: 'oznaczenia domów na planie' },
    { value: '5', label: 'domów w kameralnej inwestycji' },
    { value: 'ok. 83 m²', label: 'Sasanka XL z garażem' },
    { value: 'Tłuszcz', label: 'spokojna lokalizacja z PKP' },
];

const DEVELOPMENT_UNITS = [
    {
        id: 'A',
        label: 'Dom A',
        title: 'Sasanka XL z garażem',
        type: 'Segment bliźniaka A–B',
        status: 'Stan surowy zamknięty',
        availability: 'Zapytaj o dostępność',
        description: 'Segment w realizowanym bliźniaku A–B. Trwa montaż instalacji elektrycznej i hydraulicznej.',
        area: 'ok. 83 m²',
        rooms: '3 sypialnie',
        hotspot: { left: '22%', top: '48%' },
    },
    {
        id: 'B',
        label: 'Dom B',
        title: 'Sasanka XL z garażem',
        type: 'Segment bliźniaka A–B',
        status: 'Stan surowy zamknięty',
        availability: 'Zapytaj o dostępność',
        description: 'Drugi segment w realizowanym bliźniaku A–B. Równolegle prowadzone są prace przy kostce i drodze.',
        area: 'ok. 83 m²',
        rooms: '3 sypialnie',
        hotspot: { left: '34%', top: '48%' },
    },
    {
        id: 'C',
        label: 'Dom C',
        title: 'Sasanka XL z garażem',
        type: 'Segment bliźniaka C–D',
        status: 'Stan 0 · realizacja w sierpniu',
        availability: 'Zapytaj o dostępność',
        description: 'Segment w bliźniaku C–D. Rozpoczęcie realizacji bliźniaka jest planowane na sierpień.',
        area: 'ok. 83 m²',
        rooms: '3 sypialnie',
        hotspot: { left: '50%', top: '48%' },
    },
    {
        id: 'D',
        label: 'Dom D',
        title: 'Sasanka XL z garażem',
        type: 'Segment bliźniaka C–D',
        status: 'Stan 0 · realizacja w sierpniu',
        availability: 'Zapytaj o dostępność',
        description: 'Drugi segment w bliźniaku C–D, w układzie Sasanka XL z garażem.',
        area: 'ok. 83 m²',
        rooms: '3 sypialnie',
        hotspot: { left: '62%', top: '48%' },
    },
    {
        id: 'E',
        label: 'Dom E',
        title: 'Sasanka XL z garażem',
        type: 'Dom wolnostojący',
        status: 'Stan 0 · realizacja w sierpniu',
        availability: 'Największa prywatność',
        description: 'Dom wolnostojący z garażem. Rozpoczęcie realizacji jest planowane na sierpień.',
        area: 'ok. 83 m²',
        rooms: '3 sypialnie',
        hotspot: { left: '80%', top: '50%' },
    },
];

const AVAILABILITY = DEVELOPMENT_UNITS.map((unit) => ({
    name: unit.label,
    type: unit.title,
    status: unit.availability,
}));

const ATUTY = [
    'Kameralne osiedle — tylko 5 domów',
    'Sasanka XL z garażem w każdym domu',
    'Prywatny ogród zamiast balkonu',
    'Dojazd PKP do Warszawy',
    'Spokojna lokalizacja przy ul. Zaściankowej',
    'Układ rodzinny: 3 sypialnie i 2 łazienki',
];

const INVESTMENT_PROGRESS = [
    { step: '01', title: 'Bliźniak A–B: stan surowy zamknięty', desc: 'Trwa montaż instalacji elektrycznej i hydraulicznej. Równolegle prowadzone są prace gruntowe: układanie kostki oraz przygotowanie drogi.', current: true },
    { step: '02', title: 'Bliźniak C–D oraz dom E: stan 0', desc: 'Realizacja bliźniaka C–D i domu wolnostojącego E jest planowana na sierpień.' },
    { step: '03', title: 'Wybór domu i kolejny krok', desc: 'Możesz wskazać konkretny dom, otrzymać aktualną dostępność i wycenę oraz umówić rozmowę lub spotkanie.' },
];

const DECISION_MATERIALS = [
    { title: 'Oferta PDF', desc: 'Najważniejsze informacje o inwestycji w jednym dokumencie.', action: 'Otwórz PDF' },
    { title: 'Rzuty i metraże', desc: 'Układ parteru oraz piętra wraz z powierzchniami pomieszczeń.', action: 'Zobacz rzuty' },
    { title: 'Standard i warianty', desc: 'Zakres deweloperski oraz możliwe warianty wykończenia domu.', action: 'Poznaj warianty' },
    { title: 'Cena i finansowanie', desc: 'Aktualna wycena konkretnego domu i rozmowa o możliwościach finansowania.', action: 'Poproś o wycenę' },
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
    desc: 'To najbliższa realizacja referencyjna względem Osiedla Sasankowe Tłuszcz. Dla klientów zainteresowanych zakupem może być najlepszym punktem odniesienia do obejrzenia skali domu, układu wnętrz i charakteru zabudowy na żywo.',
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
        desc: 'Osiedle Sasankowe Tłuszcz to tylko 5 domów, więc jest dobrą propozycją dla osób, które szukają spokojniejszej alternatywy dla gęstej zabudowy bliżej Warszawy.',
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
        answer: 'Planowana jest mała inwestycja obejmująca 5 domów: cztery segmenty w dwóch budynkach bliźniaczych oraz jeden dom wolnostojący z garażem.',
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
        answer: 'Tak. Osiedle Sasankowe Tłuszcz jest kierowane do osób, które szukają domu pod Warszawą z ogrodem, garażem i spokojniejszą lokalizacją, ale nadal chcą mieć dojazd koleją i dostęp do usług w mieście.',
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
    const { language } = useLanguage();
    const [activeUnitId, setActiveUnitId] = useState(DEVELOPMENT_UNITS[0].id);
    const [contactSent, setContactSent] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactMessage, setContactMessage] = useState(`Interesuje mnie ${OSIEDLE_BRAND} — Sasanka XL z garażem.`);
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [showStickyCta, setShowStickyCta] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState('');
    const [selectedHome, setSelectedHome] = useState('');
    const [wantsTrojanyVisit, setWantsTrojanyVisit] = useState(false);
    const activeUnit = DEVELOPMENT_UNITS.find((unit) => unit.id === activeUnitId) || DEVELOPMENT_UNITS[0];

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
                    name: 'Osiedle Sasankowe Tłuszcz - domy Sasanka XL z garażem pod Warszawą',
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
            setContactMessage(`Interesuje mnie ${OSIEDLE_BRAND} — Sasanka XL z garażem.`);
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

    const scrollToContact = () => {
        const contactSection = document.getElementById('kontakt');
        contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
    };

    const selectUnit = (unitId: string, scrollToForm = false) => {
        const unit = DEVELOPMENT_UNITS.find((item) => item.id === unitId);
        if (!unit) return;
        setActiveUnitId(unit.id);
        setSelectedHome(unit.label);
        setContactMessage(`Interesuje mnie ${OSIEDLE_BRAND}. Proszę o dostępność i wycenę: ${unit.label} (${unit.type}).`);
        trackEvent('lead_contact_click', { type: 'unit_select', unit: unit.id, source: 'unit_search' });
        if (scrollToForm) scrollToContact();
    };

    const askForPackage = (packageName: string) => {
        setSelectedPackage(packageName);
        setContactMessage(`Interesuje mnie ${OSIEDLE_BRAND} — Sasanka XL z garażem. Proszę o cenę i szczegóły pakietu: ${packageName}.`);
        scrollToContact();
        trackEvent('lead_contact_click', { type: 'package', package: packageName, source: 'osiedle_packages' });
    };

    const askForTrojanyVisit = () => {
        setWantsTrojanyVisit(true);
        setContactMessage(`Interesuje mnie ${OSIEDLE_BRAND}. Chcę umówić obejrzenie podobnych domów Sasanka XL w Trojanach.`);
        scrollToContact();
        trackEvent('lead_contact_click', { type: 'reference_visit', source: 'trojany_reference' });
    };

    const askForPriceList = () => {
        setContactMessage(`Interesuje mnie ${OSIEDLE_BRAND}. Proszę o aktualny cennik, dostępność domów i informacje o wariantach wyposażenia.`);
        scrollToContact();
        trackEvent('lead_contact_click', { type: 'price_list', source: 'quick_lead' });
    };

    const trackPdfDownload = (source: string) => {
        trackEvent('lead_contact_click', { type: 'pdf_download', source });
    };

    const askForVisit = (visitType: string) => {
        setContactMessage(`Chcę umówić ${visitType}. Proszę o kontakt w sprawie dostępnych terminów.`);
        if (visitType.includes('Trojanach')) setWantsTrojanyVisit(true);
        trackEvent('lead_contact_click', { type: 'visit_request', source: visitType });
    };

    if (language === 'en') return <EnglishTluszczEstate />;

    return (
        <div className="tluszcz-page sasankowe-page">
            <section className="sasankowe-hero">
                <img
                    className="sasankowe-hero__media"
                    src={HERO_IMAGE}
                    alt="Wizualizacja Osiedla Sasankowe Tłuszcz: bliźniaki Sasanka XL i dom wolnostojący wśród zieleni"
                />
                <div className="sasankowe-hero__shade" aria-hidden="true" />
                <div className="sasankowe-hero__content">
                    <span className="sasankowe-hero__brand">{OSIEDLE_BRAND}</span>
                    <h1>Spokój Tłuszcza.<br />Bliskość Warszawy.</h1>
                    <p>
                        Kameralne osiedle 5 domów Sasanka XL z garażem przy ul. Zaściankowej —
                        dla rodzin, które chcą ogród, prywatność i dojazd PKP do stolicy.
                    </p>
                    <div className="sasankowe-hero__actions">
                        <a className="sasankowe-btn sasankowe-btn--primary" href="#wybierz-dom">Wybierz dom</a>
                        <a className="sasankowe-btn sasankowe-btn--ghost" href="#kontakt">Zapytaj o dostępność</a>
                        <a
                            className="sasankowe-btn sasankowe-btn--ghost"
                            href={OSIEDLE_PDF_URL}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackPdfDownload('hero')}
                        >
                            <Download size={18} />
                            Oferta PDF
                        </a>
                    </div>
                </div>
                <div className="sasankowe-hero__facts">
                    {TOP_FACTS.map((fact) => (
                        <div key={fact.label}>
                            <strong>{fact.value}</strong>
                            <span>{fact.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="sasankowe-atuty">
                <div className="container">
                    <div className="sasankowe-atuty__heading">
                        <span className="section-label">Atuty inwestycji</span>
                        <h2>{OSIEDLE_BRAND}</h2>
                        <p>
                            To odpowiedź na to, czego szuka coraz więcej rodzin — podmiejski spokój
                            z bezpośrednim dostępem do Warszawy i pełnym standardem rodzinnego domu.
                        </p>
                    </div>
                    <ul className="sasankowe-atuty__list">
                        {ATUTY.map((item) => (
                            <li key={item}><Check size={18} /><span>{item}</span></li>
                        ))}
                    </ul>
                </div>
            </section>

            <section id="wybierz-dom" className="sasankowe-unit-search">
                <div className="container">
                    <div className="sasankowe-unit-search__intro">
                        <span className="section-label">Wybierz dom</span>
                        <h2>Interaktywny plan Osiedla Sasankowe</h2>
                        <p>Kliknij dom A–E na planie, zobacz status realizacji i wyślij zapytanie o dostępność.</p>
                    </div>

                    <div className="sasankowe-unit-search__layout">
                        <figure className="sasankowe-plan">
                            <img
                                src={SITE_PLAN_IMAGE}
                                alt="Interaktywny plan Osiedla Sasankowe Tłuszcz: domy A–E"
                            />
                            {DEVELOPMENT_UNITS.map((unit) => (
                                <button
                                    key={unit.id}
                                    type="button"
                                    className={`sasankowe-hotspot${activeUnitId === unit.id ? ' is-active' : ''}`}
                                    style={{ left: unit.hotspot.left, top: unit.hotspot.top }}
                                    onClick={() => selectUnit(unit.id)}
                                    aria-pressed={activeUnitId === unit.id}
                                    aria-label={`${unit.label}: ${unit.status}`}
                                >
                                    {unit.id}
                                </button>
                            ))}
                            <figcaption>Plan poglądowy. Status i dostępność potwierdzimy podczas kontaktu.</figcaption>
                        </figure>

                        <aside className="sasankowe-unit-panel">
                            <div className="sasankowe-unit-panel__badge">{activeUnit.availability}</div>
                            <h3>{activeUnit.label}</h3>
                            <p className="sasankowe-unit-panel__type">{activeUnit.type}</p>
                            <dl className="sasankowe-unit-panel__meta">
                                <div><dt>Model</dt><dd>{activeUnit.title}</dd></div>
                                <div><dt>Metraż</dt><dd>{activeUnit.area}</dd></div>
                                <div><dt>Układ</dt><dd>{activeUnit.rooms}</dd></div>
                                <div><dt>Etap</dt><dd>{activeUnit.status}</dd></div>
                            </dl>
                            <p>{activeUnit.description}</p>
                            <div className="sasankowe-unit-panel__actions">
                                <button type="button" className="sasankowe-btn sasankowe-btn--primary" onClick={() => selectUnit(activeUnit.id, true)}>
                                    Zapytaj o ten dom
                                </button>
                                <a className="sasankowe-btn sasankowe-btn--ghost" href="#rzuty">Zobacz rzuty</a>
                            </div>
                        </aside>
                    </div>

                    <div className="sasankowe-unit-list">
                        {DEVELOPMENT_UNITS.map((unit) => (
                            <button
                                key={unit.id}
                                type="button"
                                className={`sasankowe-unit-card${activeUnitId === unit.id ? ' is-active' : ''}`}
                                onClick={() => selectUnit(unit.id)}
                            >
                                <span>{unit.id}</span>
                                <div>
                                    <strong>{unit.label}</strong>
                                    <p>{unit.type}</p>
                                    <em>{unit.status}</em>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tluszcz-quick-lead-section">
                <div className="container tluszcz-quick-lead">
                    <div>
                        <span className="section-label">Cennik i dostępność</span>
                        <h2>Wyślij mi aktualny cennik {OSIEDLE_BRAND}</h2>
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
                            onSubmit={(e) => handleContactSubmit(e, `Interesuje mnie ${OSIEDLE_BRAND}. Proszę o aktualny cennik, dostępność domów i informacje o wariantach wyposażenia.`)}
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

            <section className="tluszcz-section tluszcz-progress-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Aktualny etap inwestycji</span>
                        <h2>Na jakim etapie jest Osiedle Sasankowe Tłuszcz?</h2>
                        <p>Pokazujemy jasno, co jest aktualnie dostępne i jaki jest kolejny krok dla osób zainteresowanych zakupem.</p>
                    </div>
                    <div className="tluszcz-progress-grid">
                        {INVESTMENT_PROGRESS.map((item) => (
                            <article key={item.step} className={`tluszcz-progress-card${item.current ? ' is-current' : ''}`}>
                                <span>{item.current ? 'Teraz' : `Etap ${item.step}`}</span>
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                            </article>
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
                                title="Mapa lokalizacji Osiedla Sasankowe Tłuszcz przy ul. Zaściankowej"
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
                            Osiedle Sasankowe Tłuszcz jest dla osób, które chcą więcej prywatnej przestrzeni, ale nie chcą
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
                            do pracy, szkoły i usług. Osiedle Sasankowe Tłuszcz odpowiada właśnie na taką potrzebę.
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
                            <span role="columnheader">Dom w Osiedlu Sasankowe Tłuszcz</span>
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
                            garaż lub miejsce postojowe. W Osiedlu Sasankowe Tłuszcz komunikujemy wariant z garażem
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

            <section id="rzuty" className="tluszcz-section tluszcz-muted-section">
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

            <section className="tluszcz-section tluszcz-materials-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Materiały dla zdecydowanych</span>
                        <h2>Wszystko, czego potrzebujesz przed decyzją</h2>
                        <p>Zbierz podstawowe materiały, sprawdź układ domu i poproś o informacje dotyczące konkretnego wariantu.</p>
                    </div>
                    <div className="tluszcz-materials-grid">
                        {DECISION_MATERIALS.map((item, index) => {
                            const href = index === 0 ? OSIEDLE_PDF_URL : index === 1 ? '#rzuty' : index === 2 ? '#warianty' : '#kontakt';
                            const isPdf = index === 0;
                            return (
                                <a
                                    key={item.title}
                                    className="tluszcz-material-card"
                                    href={href}
                                    {...(isPdf ? { target: '_blank', rel: 'noreferrer' } : {})}
                                    onClick={() => {
                                        if (isPdf) trackPdfDownload('materials_section');
                                        if (index === 3) askForPriceList();
                                    }}
                                >
                                    <Download size={21} />
                                    <div><h3>{item.title}</h3><p>{item.desc}</p><strong>{item.action}</strong></div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section id="warianty" className="tluszcz-section">
                <div className="container">
                    <div className="tluszcz-section-heading">
                        <span className="section-label">Ceny i finansowanie</span>
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
                    <div className="tluszcz-finance-card">
                        <div>
                            <span className="section-label">Przejrzysta wycena</span>
                            <h3>Otrzymaj cenę konkretnego domu i sprawdź możliwości finansowania</h3>
                            <p>Cena zależy od wybranego domu i wariantu wykończenia. Przekazujemy aktualną wycenę dla wskazanego wariantu, a w sprawie finansowania współpracujemy z Credipass.</p>
                        </div>
                        <div className="tluszcz-finance-actions">
                            <a className="btn-primary" href="#kontakt" onClick={askForPriceList}>Poproś o aktualną wycenę</a>
                            <a className="btn-secondary" href="/kalkulatory">Sprawdź finansowanie</a>
                        </div>
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
                            Osiedle Sasankowe Tłuszcz bazuje na sprawdzonym modelu domu. Na oficjalnej stronie Sasanki
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
                            komunikacji, a docelowe wideo Osiedla Sasankowe Tłuszcz możemy podmienić, gdy będzie gotowe.
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

            <section className="tluszcz-section tluszcz-visit-section">
                <div className="container tluszcz-visit-grid">
                    <div>
                        <span className="section-label">Umów wizytę</span>
                        <h2>Wybierz sposób, w jaki chcesz poznać inwestycję</h2>
                        <p>Możemy zacząć od krótkiej rozmowy, przejść przez szczegóły inwestycji na spotkaniu albo umówić obejrzenie podobnych domów Sasanka XL w Trojanach.</p>
                    </div>
                    <div className="tluszcz-visit-actions">
                        <a href="#kontakt" className="btn-primary" onClick={() => askForVisit('rozmowę o inwestycji')}>Umów rozmowę</a>
                        <a href="#kontakt" className="btn-secondary" onClick={() => askForVisit('spotkanie w sprawie Osiedla Sasankowe Tłuszcz')}>Umów spotkanie</a>
                        <a href="#kontakt" className="btn-secondary" onClick={() => askForVisit('obejrzenie podobnych domów w Trojanach')}>Zobacz dom w Trojanach</a>
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
                            <h2>Zapytaj o Osiedle Sasankowe Tłuszcz</h2>
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
                                    Wysyłając formularz, prosisz o kontakt w sprawie Osiedla Sasankowe Tłuszcz. Dane wykorzystamy wyłącznie do obsługi zapytania.
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
