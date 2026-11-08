import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TITLE = "Sasanka XL w Tłuszczu";
const DESCRIPTION = "Trzy sypialnie, własny ogród i garaż. Sasanka XL przy ul. Zaściankowej w Tłuszczu. Grafika jest wizualizacją poglądową, nie zdjęciem budowy.";
const IMAGE = "https://domizhomes.com/osiedle-tluszcz/wizualizacja-osiedla-v6.png";
const URL = "https://domizhomes.com/osiedle-tluszcz";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1, jest ${count}`);
    return source.replace(from, () => to);
}

export function buildSasankaPreview(html) {
    if (!html.includes('src="/assets/index-DvzcJoKV.js"')) throw new Error("to nie jest aktualna skorupa SPA");
    let out = html;
    out = once(out, "<title>Kawalerka z ogródkiem w Warszawie i dom w powiecie wołomińskim | Domiz Homes</title>", `<title>${TITLE}</title>`, "title");
    out = once(out, 'name="title" content="Kawalerka z ogródkiem w Warszawie i dom w powiecie wołomińskim | Domiz Homes"', `name="title" content="${TITLE}"`, "meta title");
    out = once(out, 'name="description" content="Domiz Homes skupia się na małych mieszkaniach z ogrodem w Warszawie i domach z trzema sypialniami w powiecie wołomińskim."', `name="description" content="${DESCRIPTION}"`, "description");
    out = once(out, 'rel="canonical" href="https://domizhomes.com/"', `rel="canonical" href="${URL}"`, "canonical");
    out = once(out, 'property="og:url" content="https://domizhomes.com/"', `property="og:url" content="${URL}"`, "og:url");
    out = once(out, 'property="og:title" content="Kawalerka z ogródkiem w Warszawie i dom w powiecie wołomińskim | Domiz Homes"', `property="og:title" content="${TITLE}"`, "og:title");
    out = once(out, 'property="og:description" content="Domiz Homes skupia się na małych mieszkaniach z ogrodem w Warszawie i domach z trzema sypialniami w powiecie wołomińskim."', `property="og:description" content="${DESCRIPTION}"`, "og:description");
    out = once(out, 'property="og:image" content="https://domizhomes.com/og-image.png"', `property="og:image" content="${IMAGE}"`, "og:image");
    out = once(out, 'property="og:image:width" content="1200"', 'property="og:image:width" content="1536"', "og:width");
    out = once(out, 'property="og:image:height" content="630"', 'property="og:image:height" content="1024"', "og:height");
    out = once(out, 'property="twitter:url" content="https://domizhomes.com/"', `property="twitter:url" content="${URL}"`, "twitter:url");
    out = once(out, 'property="twitter:title" content="Kawalerka z ogródkiem w Warszawie i dom w powiecie wołomińskim | Domiz Homes"', `property="twitter:title" content="${TITLE}"`, "twitter:title");
    out = once(out, 'property="twitter:description" content="Domiz Homes skupia się na małych mieszkaniach z ogrodem w Warszawie i domach z trzema sypialniami w powiecie wołomińskim."', `property="twitter:description" content="${DESCRIPTION}"`, "twitter:description");
    out = once(out, 'property="twitter:image" content="https://domizhomes.com/og-image.png"', `property="twitter:image" content="${IMAGE}"`, "twitter:image");
    out = once(
        out,
        'property="og:image:height" content="1024" />',
        'property="og:image:height" content="1024" />\n  <meta property="og:image:alt" content="Wizualizacja poglądowa osiedla Sasanka XL w Tłuszczu. To nie jest zdjęcie budowy." />\n  <meta property="og:site_name" content="Domiz Homes" />',
        "alt",
    );
    out = once(
        out,
        `<h1>Kawalerka z ogródkiem w Warszawie. Dom w powiecie wołomińskim.</h1>
    <p>Domiz Homes skupia się na małych mieszkaniach z ogrodem i domach z trzema sypialniami. Sprawdź nieruchomości obsługiwane przez Domiz lub osobny przegląd rynku. Chcesz sprzedać? Porozmawiajmy o Twojej nieruchomości.</p>`,
        `<h1>Sasanka XL w Tłuszczu</h1>
    <p>Trzy sypialnie, własny ogród i garaż. Grafika osiedla jest wizualizacją poglądową, nie zdjęciem budowy.</p>`,
        "h1",
    );
    const schemaStart = out.indexOf('<script type="application/ld+json">');
    const schemaEnd = out.indexOf("</script>", schemaStart);
    if (schemaStart < 0 || schemaEnd < 0) throw new Error("brak JSON-LD");
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: TITLE,
        description: DESCRIPTION,
        url: URL,
        image: IMAGE,
        isPartOf: { "@type": "WebSite", name: "Domiz Homes", url: "https://domizhomes.com/" },
    };
    out = out.slice(0, schemaStart) + `<script type="application/ld+json">\n  ${JSON.stringify(schema, null, 2)}\n  ` + out.slice(schemaEnd);
    if (out.includes("Kawalerka z ogródkiem") || out.includes("https://domizhomes.com/og-image.png") || /od 650|650 tys|7\.11/.test(out)) {
        throw new Error("podgląd nadal ma stronę główną, logo albo cenę");
    }
    if (!out.includes('src="/assets/index-DvzcJoKV.js"') || !out.includes('href="/assets/index-CHx3K4sg.css"')) {
        throw new Error("skorupa SPA została naruszona");
    }
    return out;
}

if (process.argv[1] && process.argv[1].endsWith("build-sasanka-preview.mjs")) {
    const [source, target] = process.argv.slice(2);
    const html = buildSasankaPreview(readFileSync(source, "utf8"));
    mkdirSync(dirname(resolve(target)), { recursive: true });
    writeFileSync(target, html);
    console.log({ bytes: Buffer.byteLength(html) });
}
