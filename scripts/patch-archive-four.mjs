import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const HIDE = [1784754054299, 1784755046567, 1784827486549, 1786414768122];

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

export function patchArchiveFour({ indexPath, sitemapPath, outDir }) {
    let js = readFileSync(indexPath, "utf8");
    const list = `[${HIDE.join(",")}]`;
    js = once(
        js,
        "z(s?w:w.filter(N=>N.published!==!1))",
        `z(s?w:w.filter(N=>N.published!==!1&&!${list}.includes(Number(N.id))))`,
        "publiczny filtr",
    );
    if (!js.includes('path:"/admin"') || !js.includes("domiz-hero-silent.mp4") || !js.includes("/oferty-media/BV-C2D04.jpg")) {
        throw new Error("łatka ruszyła stronę główną albo katalog");
    }
    if (!js.includes('"id":910011') || !js.includes("Kawalerka z ogródkiem w Warszawie. Dom w powiecie wołomińskim.")) {
        throw new Error("brak aktualnej strony głównej albo 30 ofert");
    }
    if (js.includes("202610280110")) throw new Error("Nordic Bemowo III nie może wejść na listę wycofania");

    let sitemap = readFileSync(sitemapPath, "utf8");
    for (const id of [1784754054299, 1784827486549]) {
        const loc = sitemap.indexOf(String(id));
        if (loc < 0) throw new Error(`brak adresu ${id} w sitemapie`);
        const start = sitemap.lastIndexOf("<url>", loc);
        const end = sitemap.indexOf("</url>", loc) + "</url>".length;
        sitemap = sitemap.slice(0, start) + sitemap.slice(end);
    }
    if (sitemap.includes("1784754054299") || sitemap.includes("1784827486549")) {
        throw new Error("adres wycofanej oferty został w sitemapie");
    }

    mkdirSync(resolve(outDir, "assets"), { recursive: true });
    writeFileSync(resolve(outDir, "assets/index-DvzcJoKV.js"), js);
    writeFileSync(resolve(outDir, "sitemap.xml"), sitemap);
    return { hide: HIDE };
}

if (process.argv[1] && process.argv[1].endsWith("patch-archive-four.mjs")) {
    const [indexPath, sitemapPath, outDir] = process.argv.slice(2);
    console.log(patchArchiveFour({ indexPath, sitemapPath, outDir }));
}
