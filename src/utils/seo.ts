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
    title: 'Domiz Homes - Biuro Nieruchomości Tłuszcz, Wołomin',
    description: 'Szukasz domu lub działki w Tłuszczu? Domiz Homes to Twoje lokalne biuro nieruchomości. Profesjonalna sprzedaż, kupno i wynajem. Sprawdź oferty!',
    path: '/',
    image: DEFAULT_IMAGE,
    keywords: 'nieruchomości tłuszcz, biuro nieruchomości, domy na sprzedaż tłuszcz, działki tłuszcz, agencja nieruchomości wołomin, domiz homes',
};

export const routeSeo: Record<string, SeoConfig> = {
    '/': defaultSeo,
    '/oferty': {
        title: 'Oferty nieruchomości - domy, mieszkania i działki | Domiz Homes',
        description: 'Aktualne oferty Domiz Homes: domy, mieszkania i działki na sprzedaż lub wynajem w Tłuszczu, Wołominie i okolicach Warszawy.',
        path: '/oferty',
        keywords: 'oferty nieruchomości, domy na sprzedaż, mieszkania na sprzedaż, działki na sprzedaż, nieruchomości Tłuszcz, nieruchomości Wołomin',
    },
    '/kalkulatory': {
        title: 'Kalkulatory kredytu i kosztów budowy domu | Domiz Homes',
        description: 'Oblicz orientacyjną ratę kredytu hipotecznego i koszt budowy domu. Praktyczne kalkulatory dla kupujących i budujących nieruchomość.',
        path: '/kalkulatory',
        keywords: 'kalkulator kredytu hipotecznego, kalkulator budowy domu, koszt budowy domu, rata kredytu hipotecznego',
    },
    '/blog': {
        title: 'Blog o nieruchomościach, zakupie domu i rynku | Domiz Homes',
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
        title: 'Smart Home - inteligentny dom i automatyka | Domiz Homes',
        description: 'Systemy smart home dla domów i mieszkań: oświetlenie, ogrzewanie, monitoring, alarmy, zamki elektroniczne i automatyka budynkowa.',
        path: '/smart-home',
        keywords: 'smart home, inteligentny dom, automatyka domowa, monitoring domu, inteligentne oświetlenie',
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
    return routeSeo[pathname] || {
        title: 'Strona nie znaleziona | Domiz Homes',
        description: 'Nie znaleziono strony. Wróć do aktualnych ofert nieruchomości Domiz Homes.',
        path: pathname,
        noindex: true,
    };
}
