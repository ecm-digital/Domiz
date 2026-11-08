import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1, jest ${count}`);
    return source.replace(from, () => to);
}

const TITLE = "Sasanka XL w Tłuszczu";
const DESCRIPTION = "Trzy sypialnie, własny ogród i garaż. Sasanka XL przy ul. Zaściankowej w Tłuszczu. Grafika jest wizualizacją poglądową, nie zdjęciem budowy.";
const IMAGE = "https://domizhomes.com/osiedle-tluszcz/wizualizacja-osiedla-v6.png";

export function patchSasankaMeta({ chunkPath, outDir }) {
    let js = readFileSync(chunkPath, "utf8");
    js = once(js, 'M="Dom pod Warszawą - Osiedle Tłuszcz Sasanka XL z garażem | Domiz Homes"', `M="${TITLE}"`, "tytuł");
    js = once(js, 'C="Szukasz domu pod Warszawą? Osiedle Tłuszcz przy ul. Zaściankowej to kameralne domy Sasanka XL z garażem, ogrodem i dojazdem PKP do Warszawy."', `C="${DESCRIPTION}"`, "opis");
    js = once(js, 'R="https://domizhomes.com/osiedle-tluszcz/og-osiedle-tluszcz.jpg"', `R="${IMAGE}"`, "obraz");
    if (js.includes("og-osiedle-tluszcz.jpg") || js.includes("650") || js.includes("7.11.2026") === false) {
        if (js.includes("og-osiedle-tluszcz.jpg")) throw new Error("został stary obraz");
    }
    for (const marker of ["id:\"domy\"", "przygotowany grunt, bez fundamentów", "Układ A–E na planie ilustracyjnym", "w=\"https://domizhomes.com/osiedle-tluszcz\""]) {
        if (!js.includes(marker)) throw new Error(`zniknęła treść v2: ${marker}`);
    }
    if (!js.includes(`document.title=M`) || !js.includes(IMAGE)) throw new Error("meta nie wskazują nowego obrazu");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "OsiedleTluszcz-D2t5wflE.js"), js);
    return { bytes: Buffer.byteLength(js) };
}

if (process.argv[1] && process.argv[1].endsWith("patch-sasanka-meta.mjs")) {
    const [chunkPath, outDir] = process.argv.slice(2);
    console.log(patchSasankaMeta({ chunkPath, outDir }));
}
