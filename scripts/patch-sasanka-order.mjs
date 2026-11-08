import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

function splitChildren(source, fromIndex) {
    const key = 'className:"tluszcz-page",children:[';
    const at = source.indexOf(key, fromIndex);
    if (at < 0) throw new Error("brak strony polskiej");
    const start = at + key.length;
    const parts = [];
    let buf = "";
    let depth = 0;
    let quote = "";
    let escape = false;
    for (let n = start; n < source.length; n += 1) {
        const ch = source[n];
        if (quote) {
            buf += ch;
            if (escape) escape = false;
            else if (ch === "\\") escape = true;
            else if (ch === quote) quote = "";
            continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
            quote = ch;
            buf += ch;
            continue;
        }
        if (ch === "(" || ch === "[" || ch === "{") {
            depth += 1;
            buf += ch;
            continue;
        }
        if (ch === ")" || ch === "]" || ch === "}") {
            if (depth === 0 && ch === "]") {
                parts.push(buf);
                return { at, start, end: n, parts };
            }
            depth -= 1;
            buf += ch;
            continue;
        }
        if (ch === "," && depth === 0) {
            parts.push(buf);
            buf = "";
            continue;
        }
        buf += ch;
    }
    throw new Error("nie domknięto listy sekcji");
}

const ORDER = [0, 1, 5, 3, 13, 15, 6, 7, 8, 24, 4, 16, 2, 14, 9, 10, 11, 12, 18, 19, 20, 21, 22, 23, 17, 25];

export function patchSasankaOrder({ chunkPath, outDir }) {
    let js = readFileSync(chunkPath, "utf8");
    for (const marker of ["id:\"domy\"", "przygotowany grunt, bez fundamentów", "83,00 m² bez garażu", "Wybierz dom A–E", "P(!0)"]) {
        if (!js.includes(marker)) throw new Error(`brak poprawki df673: ${marker}`);
    }
    if (js.includes("od 650") || js.includes("WEWNETRZNE")) throw new Error("chunk ma treść, której nie wolno przenieść");

    js = once(
        js,
        "Zostaw kontakt, a odeślemy informacje o wolnych domach, wariantach wyposażenia i możliwości obejrzenia podobnych domów w Trojanach.",
        "Zostaw kontakt, a potwierdzimy dostępność, warianty wyposażenia i możliwość obejrzenia podobnych domów w Trojanach.",
        "wolne domy",
    );
    js = once(
        js,
        "Wyślemy informacje o wolnych domach, wariantach wyposażenia i możliwej ścieżce rezerwacji.",
        "Potwierdzimy dostępność i wariant wyposażenia. Nie jest to aktualna lista wolnych domów.",
        "wolne domy CTA",
    );
    js = once(
        js,
        'className:"tluszcz-section",children:e.jsxs("div",{className:"container tluszcz-realized-grid",children:[',
        'className:"tluszcz-section tluszcz-muted-section",children:e.jsxs("div",{className:"container tluszcz-realized-grid",children:[e.jsx("style",{children:".tluszcz-realized-stats strong{font-size:1.05rem;font-weight:700;color:inherit}"}),',
        "liczniki",
    );

    const ze = js.indexOf("function Ze");
    const page = splitChildren(js, ze);
    if (page.parts.length !== 26) throw new Error(`sekcji jest ${page.parts.length}, oczekiwano 26`);
    if (new Set(ORDER).size !== 26 || ORDER.some((n) => n < 0 || n > 25)) throw new Error("zła kolejność");
    const joined = ORDER.map((n) => page.parts[n]).join(",");
    js = js.slice(0, page.start) + joined + js.slice(page.end);

    const again = splitChildren(js, js.indexOf("function Ze"));
    const text = again.parts.join("\n");
    const markers = [
        "Układ A–E na planie ilustracyjnym",
        "Pięć Sasanki XL w kameralnym układzie",
        "Rzut modelowy: parter i piętro",
        "4 warianty wyposażenia domu",
        "Na jakim etapie jest Osiedle Tłuszcz?",
        "ul. Zaściankowa w Tłuszczu",
        "Dojazd do Warszawy",
        "Zapytaj o Osiedle Tłuszcz",
        "Sasanki stoją już w wielu miejscach w Polsce",
    ];
    let previous = -1;
    for (const marker of markers) {
        const at = text.indexOf(marker);
        if (at < 0 || at <= previous) throw new Error(`kolejność sekcji: ${marker}`);
        previous = at;
    }
    const contact = text.indexOf('id:"kontakt"');
    const gallery = text.indexOf("Zobacz przykładowe wnętrza modelowej Sasanki XL");
    const stats = text.indexOf("Sasanki stoją już w wielu miejscach w Polsce");
    if (!(contact < gallery && gallery < stats)) throw new Error("opis modelu albo liczniki nie zeszły pod kontakt");
    if ((js.match(/P\(!0\)/g) || []).length !== 3) throw new Error("zmieniła się liczba wyborów oglądania w Trojanach");
    if (js.includes("RODO") || js.includes("marketing")) throw new Error("doszła zgoda, której nie było");

    mkdirSync(outDir, { recursive: true });
    const target = resolve(outDir, "OsiedleTluszcz-D2t5wflE.js");
    writeFileSync(target, js);
    return { bytes: Buffer.byteLength(js) };
}

if (process.argv[1] && process.argv[1].endsWith("patch-sasanka-order.mjs")) {
    const [chunkPath, outDir] = process.argv.slice(2);
    console.log(patchSasankaOrder({ chunkPath, outDir }));
}
