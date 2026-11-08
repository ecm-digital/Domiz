import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gardenStudioProperties } from "../src/data/gardenOffers.js";

const root = resolve("public/podglad-2027");
const offers = gardenStudioProperties();
const banned = ["SK-A224", "SK-A225", "NBIII-L1110", "NB-G103", "MOI-C2M7"];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function money(value) {
    const [whole, fraction] = Math.abs(value).toFixed(2).split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
    return fraction === "00" ? grouped : `${grouped},${fraction}`;
}

function slug(code) {
    return String(code).toLowerCase();
}

function pageUrl(path) {
    return `https://domizhomes.com${path}`;
}

function write(path, html) {
    const file = resolve(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
}

function header({ home = false, current = "" } = {}) {
    const item = (href, label, key) => `<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
    return `<a class="skip" href="#tresc">Przejdź do treści</a>
<header class="wrap site-header">
  <a class="logo" href="/podglad-2027">Domiz <span>Homes</span></a>
  <nav class="nav" aria-label="Podgląd">
    ${item("/podglad-2027", "Początek", "home")}
    ${item("/podglad-2027/oferty", "Kawalerki", "offers")}
    ${item("/", "Obecna strona", "")}
  </nav>
</header>`;
}

function footer() {
    return `<footer class="wrap site-footer">
  <p>Podgląd 2027. Nie zastępuje strony głównej Domiz Homes.</p>
  <a href="/">Wróć do domizhomes.com</a>
</footer>`;
}

function head({ title, description, path, json }) {
    return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${pageUrl(path)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,460;9..144,560&amp;family=Plus+Jakarta+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/podglad-2027/podglad.css">
  <script type="application/ld+json">${JSON.stringify(json)}</script>
</head>`;
}

function card(offer) {
    const code = offer.review.code;
    const parking = offer.review.parking || "nieustalone";
    return `<a class="offer" href="/podglad-2027/oferty/${slug(code)}" data-offer data-city="${escapeHtml(offer.review.city)}" data-title="${escapeHtml(offer.title)}" data-location="${escapeHtml(offer.location)}" data-code="${escapeHtml(code)}" data-price="${offer.price}">
  <img src="/configurator/placeholder.svg" alt="Brak zdjęcia tej kawalerki" width="320" height="220">
  <div>
    <p class="meta">${escapeHtml(offer.review.city)} · ${offer.review.market === "pierwotny" ? "rynek pierwotny" : "rynek wtórny"} · ${escapeHtml(code)}</p>
    <h2>${escapeHtml(offer.title)}</h2>
    <p class="price">${money(offer.price)} zł <small>cena lokalu</small></p>
    <p class="facts">${offer.sqft} m² · ogród: ${escapeHtml(offer.review.gardenLabel)} · parking: ${escapeHtml(parking)}</p>
    <p class="meta">${offer.review.availability === "do_potwierdzenia" ? "Dostępność do potwierdzenia." : "Aktywne według zapisu źródła. Sprzedający nie potwierdził."}</p>
  </div>
</a>`;
}

function listPage({ path, title, city, items }) {
    const cityLink = (href, label, key) => `<a href="${href}"${city === key ? ' aria-current="page"' : ""}>${label}</a>`;
    const description = `${items.length} kawalerek z ogrodem w podglądzie Domiz Homes. Cena lokalu osobno, parking osobno, dostępność niepotwierdzona.`;
    return `${head({
        title: `${title} | Domiz Homes`,
        description,
        path,
        json: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url: pageUrl(path),
            mainEntity: {
                "@type": "ItemList",
                numberOfItems: items.length,
                itemListElement: items.map((offer, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    url: pageUrl(`/podglad-2027/oferty/${slug(offer.review.code)}`),
                    name: offer.title,
                })),
            },
        },
    })}
<body data-city="${escapeHtml(city)}">
${header({ current: "offers" })}
<main id="tresc" class="wrap page">
  <div class="page-head">
    <h1>${escapeHtml(title)}</h1>
    <p>Ogłoszenia zewnętrzne. Domiz Homes nie jest sprzedającym. Zapis z 6–7 listopada 2026. Bez rezerwacji i bez archiwum.</p>
  </div>
  <div class="filters">
    ${cityLink("/podglad-2027/oferty", "Wszystkie", "wszystkie")}
    ${cityLink("/podglad-2027/oferty/warszawa", "Warszawa", "Warszawa")}
    ${cityLink("/podglad-2027/oferty/katowice", "Katowice", "Katowice")}
    <form data-filter action="${path}" method="get">
      <label>Szukaj <input name="q" type="search" placeholder="Dzielnica, kod, lokal"></label>
    </form>
  </div>
  <p><strong data-count>${items.length}</strong> ofert</p>
  <div class="offer-list">
    ${items.map(card).join("\n")}
  </div>
</main>
${footer()}
<script type="module" src="/podglad-2027/lista.js"></script>
</body>
</html>`;
}

function detailPage(offer) {
    const code = offer.review.code;
    const path = `/podglad-2027/oferty/${slug(code)}`;
    const parking = offer.review.parking || "nieustalone";
    return `${head({
        title: `${offer.title} | Domiz Homes`,
        description: `Cena lokalu ${money(offer.price)} zł. Parking: ${parking}. Domiz nie sprzedaje tej kawalerki.`,
        path,
        json: {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: offer.title,
            url: pageUrl(path),
            description: offer.description,
            image: pageUrl("/configurator/placeholder.svg"),
            floorSize: { "@type": "QuantitativeValue", value: offer.sqft, unitCode: "MTK" },
            address: { "@type": "PostalAddress", addressLocality: offer.review.city, addressCountry: "PL" },
            offers: { "@type": "Offer", price: offer.price, priceCurrency: "PLN" },
        },
    })}
<body>
${header({ current: "offers" })}
<main id="tresc" class="wrap page detail">
  <article>
    <p class="meta"><a href="/podglad-2027/oferty">Kawalerki</a> · ${escapeHtml(code)}</p>
    <h1>${escapeHtml(offer.title)}</h1>
    <p class="price">${money(offer.price)} zł <small>cena lokalu, bez parkingu</small></p>
    <div class="plate"><img src="/configurator/placeholder.svg" alt="Brak licencji na zdjęcie tej kawalerki" width="640" height="420"></div>
    <p class="prose">${escapeHtml(offer.description)}</p>
  </article>
  <aside>
    <h2>Ogłoszenie zewnętrzne</h2>
    <p>Domiz Homes nie jest sprzedającym ani pośrednikiem tej nieruchomości. Dostępności nie potwierdzono u sprzedającego.</p>
    <ul class="fact-list">
      <li><span>Miasto</span><span>${escapeHtml(offer.review.city)}</span></li>
      <li><span>Metraż</span><span>${offer.sqft} m²</span></li>
      <li><span>Ogród</span><span>${escapeHtml(offer.review.gardenLabel)}</span></li>
      <li><span>Parking</span><span>${escapeHtml(parking)}</span></li>
      <li><span>Zapis</span><span>${escapeHtml(offer.review.checked)}</span></li>
      <li><span>Status źródła</span><span>${escapeHtml(offer.review.sourceStatus)}</span></li>
    </ul>
    <a class="button" href="${escapeHtml(offer.review.sourceUrl)}" rel="noreferrer">Otwórz źródło</a>
  </aside>
</main>
${footer()}
</body>
</html>`;
}

const homeOffers = ["NB-G101", "KT-CP-B6A07", "WT-ID4DGHP"].map((code) => offers.find((offer) => offer.review.code === code));
const home = `${head({
    title: "Domiz Homes, podgląd 2027",
    description: "Podgląd butikowego biura Domiz Homes. Kawalerki z ogrodem zostają przy cenach lokalu i niepotwierdzonej dostępności.",
    path: "/podglad-2027",
    json: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Podgląd Domiz Homes 2027",
        url: pageUrl("/podglad-2027"),
        isPartOf: { "@type": "WebSite", name: "Domiz Homes", url: "https://domizhomes.com/" },
    },
})}
<body class="is-home">
${header({ home: true, current: "home" })}
<main id="tresc">
  <section class="hero" data-hero aria-roledescription="karuzela" aria-label="Podgląd Domiz Homes">
    <img class="hero-still" data-hero-still src="/podglad-2027/poster.svg" alt="" width="1600" height="900">
    <div class="hero-shade"></div>
    <div class="hero-copy">
      <div>
        <p class="eyebrow">Domiz Homes · podgląd 2027</p>
        <h1>Miejsce na decyzję.</h1>
        <p class="lede">Własne oferty zostają na obecnej stronie. Ten podgląd pokazuje trzydzieści kawalerek z ogrodem tak, jak powinny być czytane: cena lokalu osobno, parking osobno, dostępność tylko według zapisu źródła.</p>
        <div class="hero-actions">
          <a class="button" href="/podglad-2027/oferty">Kawalerki z ogródkiem</a>
          <a class="button quiet" href="/">Obecna strona</a>
        </div>
      </div>
      <div class="hero-side">
        <p class="eyebrow" data-hero-caption>Śląsk</p>
        <p data-hero-note>Własne oferty biura zostają na obecnej stronie.</p>
        <form class="hero-actions" action="/podglad-2027/oferty" method="get">
          <label>Szukaj kawalerki <input name="q" type="search" placeholder="Bemowo, Katowice, kod"></label>
          <button type="submit">Szukaj</button>
        </form>
      </div>
    </div>
    <div class="hero-controls">
      <button type="button" data-hero-prev>Poprzedni</button>
      <button type="button" data-hero-pause aria-pressed="false">Pauza</button>
      <button type="button" data-hero-next>Następny</button>
      <div class="dots" role="group" aria-label="Slajdy">
        <button type="button" data-hero-dot="0" aria-current="true">1</button>
        <button type="button" data-hero-dot="1">2</button>
        <button type="button" data-hero-dot="2">3</button>
      </div>
    </div>
  </section>
  <section class="wrap page">
    <div class="page-head">
      <h2>Trzy zapisy, bez upiększania.</h2>
      <p>Brak zdjęcia zostaje brakiem zdjęcia. Film hero nie jest jeszcze podpięty.</p>
    </div>
    <div class="offer-list">
      ${homeOffers.map(card).join("\n")}
    </div>
  </section>
</main>
${footer()}
<script src="/hero/hero-media.js"></script>
<script type="module" src="/podglad-2027/hero.js"></script>
</body>
</html>`;

if (offers.length !== 30) throw new Error(`oczekiwano 30 ofert, jest ${offers.length}`);
for (const id of banned) {
    if (offers.some((offer) => offer.review.code === id)) throw new Error(id);
}

write("index.html", home);
write("oferty/index.html", listPage({ path: "/podglad-2027/oferty", title: "Kawalerki z ogródkiem", city: "wszystkie", items: offers }));
write("oferty/warszawa/index.html", listPage({
    path: "/podglad-2027/oferty/warszawa",
    title: "Kawalerki w Warszawie",
    city: "Warszawa",
    items: offers.filter((offer) => offer.review.city === "Warszawa"),
}));
write("oferty/katowice/index.html", listPage({
    path: "/podglad-2027/oferty/katowice",
    title: "Kawalerki w Katowicach",
    city: "Katowice",
    items: offers.filter((offer) => offer.review.city === "Katowice"),
}));
for (const offer of offers) write(`oferty/${slug(offer.review.code)}/index.html`, detailPage(offer));

console.log(`podgląd: ${offers.length} ofert`);
