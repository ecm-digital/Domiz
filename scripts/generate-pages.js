import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'https://domizhomes.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

const STATIC_PAGES = [
    {
        path: '/',
        title: 'Domiz Homes - Biuro Nieruchomości Tłuszcz, Wołomin',
        description: 'Szukasz domu lub działki w Tłuszczu? Domiz Homes to Twoje lokalne biuro nieruchomości. Profesjonalna sprzedaż, kupno i wynajem. Sprawdź oferty!',
        keywords: 'nieruchomości tłuszcz, biuro nieruchomości, domy na sprzedaż tłuszcz, działki tłuszcz, agencja nieruchomości wołomin, domiz homes',
        image: DEFAULT_IMAGE,
        priority: '1.0',
    },
    {
        path: '/oferty',
        title: 'Oferty nieruchomości - domy, mieszkania i działki | Domiz Homes',
        description: 'Aktualne oferty Domiz Homes: domy, mieszkania i działki na sprzedaż lub wynajem w Tłuszczu, Wołominie i okolicach Warszawy.',
        keywords: 'oferty nieruchomości, domy na sprzedaż, mieszkania na sprzedaż, działki na sprzedaż, nieruchomości Tłuszcz, nieruchomości Wołomin',
        image: DEFAULT_IMAGE,
        priority: '0.9',
    },
    {
        path: '/kalkulatory',
        title: 'Kalkulatory kredytu i kosztów budowy domu | Domiz Homes',
        description: 'Oblicz orientacyjną ratę kredytu hipotecznego i koszt budowy domu. Praktyczne kalkulatory dla kupujących i budujących nieruchomość.',
        keywords: 'kalkulator kredytu hipotecznego, kalkulator budowy domu, koszt budowy domu, rata kredytu hipotecznego',
        image: DEFAULT_IMAGE,
        priority: '0.7',
    },
    {
        path: '/blog',
        title: 'Blog o nieruchomościach, zakupie domu i rynku | Domiz Homes',
        description: 'Porady o zakupie domu, rynku nieruchomości, kredycie hipotecznym, inwestowaniu i smart home od Domiz Homes.',
        keywords: 'blog nieruchomości, zakup domu, porady nieruchomości, rynek nieruchomości, kredyt hipoteczny',
        image: DEFAULT_IMAGE,
        priority: '0.7',
    },
    {
        path: '/osiedle-tluszcz',
        title: 'Dom pod Warszawą - Osiedle Tłuszcz Sasanka XL z garażem | Domiz Homes',
        description: 'Szukasz domu pod Warszawą? Osiedle Tłuszcz przy ul. Zaściankowej to kameralne domy Sasanka XL z garażem, ogrodem i dojazdem PKP do Warszawy.',
        keywords: 'dom pod Warszawą, domy pod Warszawą, dom z garażem pod Warszawą, domy okolice Warszawy, dom Tłuszcz, domy Tłuszcz, Sasanka XL Tłuszcz, dom z ogrodem Mazowieckie, dom powiat wołomiński',
        image: `${BASE_URL}/osiedle-tluszcz/og-osiedle-tluszcz.jpg`,
        priority: '0.9',
    },
    {
        path: '/smart-home',
        title: 'Smart Home - inteligentny dom i automatyka | Domiz Homes',
        description: 'Systemy smart home dla domów i mieszkań: oświetlenie, ogrzewanie, monitoring, alarmy, zamki elektroniczne i automatyka budynkowa.',
        keywords: 'smart home, inteligentny dom, automatyka domowa, monitoring domu, inteligentne oświetlenie',
        image: DEFAULT_IMAGE,
        priority: '0.6',
    },
];

// URL do publicznego API Firestore (zakładając read: public)
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/domiz-a6a6c/databases/(default)/documents/properties';

const DIST_DIR = path.join(__dirname, '../dist');
const OFFERS_DIR = path.join(DIST_DIR, 'oferty');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function applyMeta(template, { title, description, image, url, keywords, noindex }) {
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeImage = escapeHtml(image);
    const safeUrl = escapeHtml(url);
    const safeKeywords = keywords ? escapeHtml(keywords) : null;

    let html = template
        .replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`)
        .replace(/<meta name="title" content=".*?" \/>/g, `<meta name="title" content="${safeTitle}" />`)
        .replace(/<meta name="description"\s+content="[\s\S]*?" \/>/g, `<meta name="description" content="${safeDescription}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${safeTitle}" />`)
        .replace(/<meta property="og:description"\s+content="[\s\S]*?" \/>/g, `<meta property="og:description" content="${safeDescription}" />`)
        .replace(/<meta property="og:image" content=".*?" \/>/g, `<meta property="og:image" content="${safeImage}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/g, `<meta property="og:url" content="${safeUrl}" />`)
        .replace(/<meta property="twitter:title" content=".*?" \/>/g, `<meta property="twitter:title" content="${safeTitle}" />`)
        .replace(/<meta property="twitter:description" content=".*?" \/>/g, `<meta property="twitter:description" content="${safeDescription}" />`)
        .replace(/<meta property="twitter:image" content=".*?" \/>/g, `<meta property="twitter:image" content="${safeImage}" />`)
        .replace(/<meta property="twitter:url" content=".*?" \/>/g, `<meta property="twitter:url" content="${safeUrl}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/g, `<link rel="canonical" href="${safeUrl}" />`);

    const robots = noindex ? 'noindex, nofollow' : 'index, follow';
    if (html.includes('<meta name="robots"')) {
        html = html.replace(/<meta name="robots"\s+content="[\s\S]*?" \/>/g, `<meta name="robots" content="${robots}" />`);
    } else {
        html = html.replace('</head>', `  <meta name="robots" content="${robots}" />\n</head>`);
    }

    if (safeKeywords) {
        if (html.includes('<meta name="keywords"')) {
            html = html.replace(/<meta name="keywords"\s+content="[\s\S]*?" \/>/g, `<meta name="keywords" content="${safeKeywords}" />`);
        } else {
            html = html.replace('</head>', `  <meta name="keywords" content="${safeKeywords}" />\n</head>`);
        }
    }

    return html;
}

// Funkcja slugify (musi być taka sama jak w frontendzie)
function createSlug(title) {
    return title
        .toLowerCase()
        .replace(/ł/g, 'l')
        .replace(/ś/g, 's')
        .replace(/ć/g, 'c')
        .replace(/ą/g, 'a')
        .replace(/ę/g, 'e')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fetchProperties() {
    return new Promise((resolve, reject) => {
        https.get(FIRESTORE_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.documents) {
                        const properties = json.documents.map(doc => {
                            const fields = doc.fields;
                            const id = doc.name.split('/').pop();

                            // Pomocnicza funkcja do wyciągania wartości z Firestore REST JSON structure
                            const getValue = (field) => {
                                if (!field) return null;
                                if (field.stringValue) return field.stringValue;
                                if (field.integerValue) return Number(field.integerValue);
                                if (field.doubleValue) return Number(field.doubleValue);
                                if (field.booleanValue) return field.booleanValue;
                                if (field.arrayValue && field.arrayValue.values) {
                                    return field.arrayValue.values.map(v => getValue(v));
                                }
                                return null;
                            };

                            return {
                                id: id,
                                title: getValue(fields.title) || 'Oferta',
                                description: getValue(fields.description) || '',
                                image: getValue(fields.image) || '',
                                price: getValue(fields.price) || 0,
                                location: getValue(fields.location) || '',
                                // ... inne pola jeśli potrzebne
                            };
                        });
                        resolve(properties);
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function generatePages() {
    console.log('Fetching properties from Firestore...');
    const properties = await fetchProperties();
    console.log(`Found ${properties.length} properties.`);

    if (!fs.existsSync(OFFERS_DIR)) {
        fs.mkdirSync(OFFERS_DIR, { recursive: true });
    }

    const template = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    const urls = [];

    for (const page of STATIC_PAGES) {
        const url = `${BASE_URL}${page.path === '/' ? '/' : page.path}`;
        urls.push({ url, priority: page.priority });

        if (page.path === '/') {
            const homeHtml = applyMeta(template, { ...page, url });
            fs.writeFileSync(INDEX_HTML_PATH, homeHtml);
            console.log('Updated static meta for: /');
            continue;
        }

        if (page.path === '/osiedle-tluszcz') continue;

        const pageDir = path.join(DIST_DIR, page.path.replace(/^\//, ''));
        if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
        }

        const html = applyMeta(template, { ...page, url });
        fs.writeFileSync(path.join(pageDir, 'index.html'), html);
        console.log(`Generated static page for: ${page.path}`);
    }

    const osiedleDir = path.join(DIST_DIR, 'osiedle-tluszcz');
    if (!fs.existsSync(osiedleDir)) {
        fs.mkdirSync(osiedleDir, { recursive: true });
    }

    const osiedlePage = STATIC_PAGES.find((page) => page.path === '/osiedle-tluszcz');
    const osiedleMeta = {
        ...osiedlePage,
        url: `${BASE_URL}/osiedle-tluszcz`,
    };

    const osiedleFaq = [
        {
            question: 'Ile domów powstaje w inwestycji?',
            answer: 'Planowana jest mała inwestycja: dwa budynki bliźniacze po dwa lokale oraz jeden dom wolnostojący z garażem.'
        },
        {
            question: 'Czy każdy dom ma garaż?',
            answer: 'Tak, komunikujemy wariant Sasanka XL z garażem dla każdego domu w tej inwestycji.'
        },
        {
            question: 'Czy lokalizacja jest dobra do dojazdu do Warszawy?',
            answer: 'Tłuszcz ma dostęp do PKP i codziennych usług, dlatego komunikujemy tę inwestycję jako spokojniejsze miejsce do życia z możliwością dojazdu do Warszawy.'
        },
        {
            question: 'Czy to dobra oferta dla osób szukających domu pod Warszawą?',
            answer: 'Tak. Osiedle Tłuszcz jest kierowane do osób, które szukają domu pod Warszawą z ogrodem, garażem i spokojniejszą lokalizacją, ale nadal chcą mieć dojazd koleją i dostęp do usług w mieście.'
        },
        {
            question: 'Czym różni się dom w Tłuszczu od mieszkania bliżej Warszawy?',
            answer: 'Najważniejsza różnica to własny ogród, garaż, trzy sypialnie i bardziej prywatna przestrzeń. Dla wielu rodzin to alternatywa dla mieszkania w bloku przy zachowaniu możliwości dojazdu do Warszawy.'
        }
    ];

    const osiedleSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Residence",
                "@id": `${osiedleMeta.url}#residence`,
                "name": "Osiedle Tłuszcz - domy Sasanka XL z garażem pod Warszawą",
                "description": osiedleMeta.description,
                "image": [osiedleMeta.image],
                "url": osiedleMeta.url,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "ul. Zaściankowa",
                    "addressLocality": "Tłuszcz",
                    "addressRegion": "Mazowieckie",
                    "addressCountry": "PL"
                },
                "amenityFeature": [
                    { "@type": "LocationFeatureSpecification", "name": "garaż", "value": true },
                    { "@type": "LocationFeatureSpecification", "name": "ogród", "value": true },
                    { "@type": "LocationFeatureSpecification", "name": "dojazd PKP do Warszawy", "value": true }
                ]
            },
            {
                "@type": "FAQPage",
                "@id": `${osiedleMeta.url}#faq`,
                "mainEntity": osiedleFaq.map((item) => ({
                    "@type": "Question",
                    "name": item.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item.answer
                    }
                }))
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${osiedleMeta.url}#breadcrumbs`,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Domiz Homes", "item": BASE_URL },
                    { "@type": "ListItem", "position": 2, "name": "Dom pod Warszawą - Osiedle Tłuszcz", "item": osiedleMeta.url }
                ]
            }
        ]
    };

    const osiedleHtml = applyMeta(template, osiedleMeta)
        .replace('</head>', `
    <script type="application/ld+json">
    ${JSON.stringify(osiedleSchema, null, 2)}
    </script>
</head>`);
    fs.writeFileSync(path.join(osiedleDir, 'index.html'), osiedleHtml);
    console.log('Generated page for: osiedle-tluszcz');

    for (const property of properties) {
        const slug = createSlug(property.title);
        const urlSlug = `${slug}-${property.id}`;
        const pageDir = path.join(OFFERS_DIR, urlSlug);

        if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
        }

        const title = `${property.title} | Domiz Homes`;
        const description = property.description
            ? `${property.description.substring(0, 157)}...`
            : `Domiz Homes - Oferta ${property.title}`;
        const image = property.image || `${BASE_URL}/og-image.png`;
        const url = `${BASE_URL}/oferty/${urlSlug}`;

        urls.push({ url, priority: '0.9' });

        // JSON-LD Schema.org
        const schema = {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": property.title,
            "image": [image],
            "description": property.description || "",
            "url": url,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": property.location || "Tłuszcz",
                "addressRegion": "Mazowieckie",
                "addressCountry": "PL"
            },
            "price": property.price,
            "priceCurrency": "PLN"
        };

        const schemaScript = `
    <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
    </script>`;

        let html = applyMeta(template, { title, description, image, url });

        // Wstrzyknij meta tagi jeśli ich nie ma (fallback)
        if (!html.includes('<meta property="og:title"')) {
            const headEnd = '</head>';
            const metaTags = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <!-- ... inne tagi ... -->
             `;
            html = html.replace(headEnd, metaTags + headEnd);
        }

        // Wstrzyknij Schema.org JSON-LD
        html = html.replace('</head>', `${schemaScript}\n</head>`);

        fs.writeFileSync(path.join(pageDir, 'index.html'), html);
        console.log(`Generated page for: ${urlSlug}`);
    }

    // Generowanie sitemap.xml
    const uniqueUrls = Array.from(new Map(urls.map((item) => [item.url, item])).values());
    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map(({ url, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
    console.log(`Sitemap generated with ${uniqueUrls.length} URLs.`);

    console.log('Pages generation complete!');
}

generatePages().catch(console.error);
