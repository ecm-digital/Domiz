const SITE_URL = 'https://domizhomes.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export type SeoConfig = {
    title: string;
    description: string;
    path?: string;
    image?: string;
    type?: 'website' | 'article';
    keywords?: string;
    noindex?: boolean;
};

export const defaultSeo: SeoConfig = {
    title: 'Nieruchomości Śląsk, Mazowsze i Dubaj | Domiz Homes',
    description: 'Domy i mieszkania na Śląsku, Mazowszu oraz wybrane inwestycje w Dubaju. Sprawdź aktualne oferty i skorzystaj ze wsparcia Domiz Homes przy zakupie lub sprzedaży.',
    path: '/',
    image: DEFAULT_IMAGE,
    keywords: 'nieruchomości Śląsk, nieruchomości Mazowsze, nieruchomości Dubaj, mieszkania Katowice, domy Tłuszcz, inwestycje Dubaj, Domiz Homes',
};

export const routeSeo: Record<string, SeoConfig> = {
    '/': defaultSeo,
    '/admin': {
        title: 'Panel administratora | Domiz Homes',
        description: 'Wewnętrzny panel zarządzania ofertami i procesem pozyskiwania Domiz Homes.',
        path: '/admin',
        noindex: true,
    },
    '/admin/login': {
        title: 'Logowanie do panelu | Domiz Homes',
        description: 'Logowanie do wewnętrznego panelu Domiz Homes.',
        path: '/admin/login',
        noindex: true,
    },
    '/panel-klienta': {
        title: 'Panel właściciela | Domiz Homes',
        description: 'Prywatny panel właściciela nieruchomości Domiz Homes.',
        path: '/panel-klienta',
        noindex: true,
    },
    '/panel-klienta/demo': {
        title: 'Panel właściciela | Domiz Homes',
        description: 'Prywatny panel właściciela nieruchomości Domiz Homes.',
        path: '/panel-klienta/demo',
        noindex: true,
    },
    '/panel-klienta/logowanie': {
        title: 'Logowanie do panelu właściciela | Domiz Homes',
        description: 'Logowanie do prywatnego panelu właściciela Domiz Homes.',
        path: '/panel-klienta/logowanie',
        noindex: true,
    },
    '/oferty': {
        title: 'Oferty nieruchomości Śląsk, Mazowsze i Dubaj | Domiz Homes',
        description: 'Przeglądaj domy i mieszkania na Śląsku, Mazowszu oraz wybrane inwestycje w Dubaju. Aktualne ceny, galerie i szczegółowe opisy.',
        path: '/oferty',
        keywords: 'oferty nieruchomości Śląsk, nieruchomości Mazowsze, nieruchomości Dubaj, mieszkania Katowice, domy na sprzedaż, nieruchomości Tłuszcz, inwestycje Dubaj',
    },
    '/kalkulatory': {
        title: 'Finansowanie nieruchomości z Credipass | Domiz Homes',
        description: 'Wsparcie w finansowaniu zakupu, budowy i inwestycji w nieruchomości we współpracy z Credipass.',
        path: '/kalkulatory',
        keywords: 'finansowanie nieruchomości, Credipass, kredyt hipoteczny, finansowanie budowy domu, rata kredytu',
    },
    '/blog': {
        title: 'Blog o nieruchomościach i poradnik kupującego | Domiz Homes',
        description: 'Porady o zakupie domu, rynku nieruchomości, kredycie hipotecznym, inwestowaniu i smart home od Domiz Homes.',
        path: '/blog',
        type: 'article',
        keywords: 'blog nieruchomości, zakup domu, porady nieruchomości, rynek nieruchomości, kredyt hipoteczny',
    },
    '/osiedle-tluszcz': {
        title: 'Dom pod Warszawą - Osiedle Tłuszcz Sasanka XL z garażem | Domiz Homes',
        description: 'Szukasz domu pod Warszawą? Osiedle Tłuszcz przy ul. Zaściankowej to kameralne domy Sasanka XL z garażem, ogrodem i dojazdem PKP do Warszawy.',
        path: '/osiedle-tluszcz',
        image: `${SITE_URL}/osiedle-tluszcz/og-osiedle-tluszcz.jpg`,
        keywords: 'dom pod Warszawą, domy pod Warszawą, dom z garażem pod Warszawą, dom Tłuszcz, Sasanka XL Tłuszcz, dom z ogrodem Mazowieckie',
    },
    '/smart-home': {
        title: 'Smart Home Loxone | Domiz Homes',
        description: 'Domiz Homes jest partnerem Loxone. Pomagamy tworzyć inteligentne domy dopasowane do potrzeb mieszkańców.',
        path: '/smart-home',
        keywords: 'Loxone, partner Loxone, smart home, inteligentny dom, automatyka domowa',
    },
    '/dodaj-nieruchomosc': {
        title: 'Dodaj nieruchomość do sprzedaży | Domiz Homes',
        description: 'Zgłoś dom, mieszkanie lub działkę do sprzedaży z Domiz Homes.',
        path: '/dodaj-nieruchomosc',
        noindex: true,
    },
    '/ulubione': {
        title: 'Ulubione oferty | Domiz Homes',
        description: 'Twoja lista zapisanych ofert nieruchomości w Domiz Homes.',
        path: '/ulubione',
        noindex: true,
    },
};

function absoluteUrl(path = '/') {
    if (/^https?:\/\//.test(path)) return path;
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function absoluteImage(image?: string) {
    if (!image) return DEFAULT_IMAGE;
    if (/^https?:\/\//.test(image)) return image;
    return absoluteUrl(image);
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
    let element = document.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

export function setSeo(config: SeoConfig) {
    const seo = { ...defaultSeo, ...config };
    const url = absoluteUrl(seo.path);
    const image = absoluteImage(seo.image);

    document.title = seo.title;

    upsertMeta('name', 'title', seo.title);
    upsertMeta('name', 'description', seo.description);
    upsertMeta('name', 'keywords', seo.keywords || defaultSeo.keywords || '');
    upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:type', seo.type === 'article' ? 'article' : 'website');
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:title', seo.title);
    upsertMeta('property', 'og:description', seo.description);
    upsertMeta('property', 'og:image', image);

    upsertMeta('property', 'twitter:card', 'summary_large_image');
    upsertMeta('property', 'twitter:url', url);
    upsertMeta('property', 'twitter:title', seo.title);
    upsertMeta('property', 'twitter:description', seo.description);
    upsertMeta('property', 'twitter:image', image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
}

export function getRouteSeo(pathname: string) {
    const normalized = (pathname.replace(/\/+$/, '') || '/') as keyof typeof routeSeo;
    if (routeSeo[pathname as keyof typeof routeSeo]) return routeSeo[pathname as keyof typeof routeSeo];
    if (routeSeo[normalized]) return routeSeo[normalized];
    if (normalized.startsWith('/panel-klienta')) {
        return routeSeo['/panel-klienta'];
    }
    return {
        title: 'Strona nie znaleziona | Domiz Homes',
        description: 'Nie znaleziono strony. Wróć do aktualnych ofert nieruchomości Domiz Homes.',
        path: pathname,
        noindex: true,
    };
}
