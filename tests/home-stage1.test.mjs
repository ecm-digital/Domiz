import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "home-stage1-"));
execFileSync(process.execPath, [
    "scripts/patch-home-stage1.mjs",
    "/tmp/live-stage1/index.js",
    "/tmp/live-stage1/index.html",
    "public/home-2027.css",
    outDir,
], { cwd: root });
const js = readFileSync(join(outDir, "assets/index-DvzcJoKV.js"), "utf8");
const html = readFileSync(join(outDir, "index.html"), "utf8");
const home = js.slice(js.indexOf('className:"home-page"'), js.indexOf("const pd=B.createContext"));

test("komunikat strony głównej i zachowany film oraz oferty", () => {
    assert.match(js, /Kawalerka z ogródkiem w Warszawie\. Dom w powiecie wołomińskim\./);
    assert.match(js, /Chcę sprzedać/);
    assert.match(home, /href:"\/dodaj-nieruchomosc"/);
    assert.match(home, /href:"#wybor-nieruchomosci"/);
    assert.match(home, /Kawalerki z ogródkiem — Warszawa/);
    assert.match(home, /href:"\/oferty\?katalog=kawalerki&miasto=Warszawa"/);
    assert.match(home, /Domy z trzema sypialniami — powiat wołomiński/);
    assert.match(home, /Sasanka XL w Tłuszczu: dom około 83 m², trzy sypialnie/);
    assert.match(home, /To przegląd rynku, nie portfolio Domiz/);
    assert.match(home, /href:"\/oferty\?katalog=kawalerki&miasto=Katowice"/);
    assert.doesNotMatch(home, /Dubaj|w\.map\(_=>c\.jsx\(Ip/);
    assert.match(js, /if\(node\.currentTime>0\.05\)node\.currentTime=0/);
    assert.match(js, /const allow=!\(reduce\|\|save\)/);
    assert.doesNotMatch(js, /max-width: 767px"\)\.matches\|\|window\.matchMedia\("\(prefers-reduced-motion/);
    assert.match(js, /\/oferty-media\/BV-C2D04\.jpg/);
    assert.match(js, /"id":910011/);
    assert.match(js, /domiz-hero-silent\.mp4/);
    assert.match(html, /Kawalerka z ogródkiem w Warszawie\. Dom w powiecie wołomińskim\./);
    assert.doesNotMatch(html, /Śląsk, Mazowsze i Dubaj/);
});
