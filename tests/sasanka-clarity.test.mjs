import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "sasanka-clarity-"));
execFileSync(process.execPath, [
    "scripts/patch-sasanka-clarity.mjs",
    "/tmp/live-sas/OsiedleTluszcz.js",
    outDir,
], { cwd: root });
const js = readFileSync(join(outDir, "OsiedleTluszcz-D2t5wflE.js"), "utf8");

test("Sasanka nie obiecuje ceny, pięciu dostępnych ani fundamentów", () => {
    assert.match(js, /Sasanka XL w Tłuszczu\. Trzy sypialnie, własny ogród i garaż\./);
    assert.match(js, /id:"domy"/);
    assert.match(js, /Wybierz dom A–E/);
    assert.match(js, /Umów oglądanie podobnych domów w Trojanach/);
    assert.match(js, /83,00 m² bez garażu/);
    assert.match(js, /Garaż 18,09 m² jest osobno/);
    assert.match(js, /przygotowany grunt, bez fundamentów/);
    assert.match(js, /Nie wiemy, czy fundamenty istnieją/);
    assert.match(js, /Plan ilustracyjny, nie geodezyjny/);
    assert.match(js, /To nie jest lista sprzedaży/);
    assert.match(js, /Rzut modelu SASANKA XL, nie karta pomiarowa/);
    assert.match(js, /Nie publikujemy kwoty, dopóki nie ma aktualnego cennika/);
    assert.match(js, /To nie są zdjęcia domów przy ul\. Zaściankowej/);
    assert.match(js, /aria-label":"Który dom Cię interesuje\?"/);
    assert.match(js, /pick\(\(en\?"House ":"Dom "\)\+name\)/);
    assert.doesNotMatch(js, /od 650|5 dostępnych|Dostępny|WEWNETRZNE|przylacza/);
    assert.match(js, /from"\.\/index-DvzcJoKV\.js"/);
});
