import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "home-2027-"));
execFileSync(process.execPath, [
    "scripts/patch-home-2027.mjs",
    "/tmp/runtime-fix/assets/index-DvzcJoKV.js",
    "/tmp/runtime-fix/index.html",
    outDir,
], { cwd: root });

const js = readFileSync(join(outDir, "assets/index-DvzcJoKV.js"), "utf8");
const html = readFileSync(join(outDir, "index.html"), "utf8");
const hero = js.slice(js.indexOf("function Qp"), js.indexOf("const Fi="));

test("nowa główna zostawia trasy SPA i obie dostawy", () => {
    for (const route of ["/oferty", "/oferty/:id", "/osiedle-tluszcz", "/dodaj-nieruchomosc", "/admin", "/panel-klienta", "/kawalerki-z-ogrodkiem"]) {
        assert.match(js, new RegExp(route.replace("/", "\\/")));
    }
    assert.match(js, /__DOMIZ_PREVIEW_PROPS/);
    assert.match(js, /domiz-hero-silent\.mp4/);
    assert.match(js, /const hasVideo=!!Y\.video/);
    assert.match(js, /defaultMuted:!0,autoPlay:play,loop:!0,playsInline:!0/);
    assert.match(js, /H\.muted=!0;H\.defaultMuted=!0/);
    assert.match(js, /Odtwarzaj film/);
    assert.match(js, /Wstrzymaj film/);
    assert.doesNotMatch(hero, /Wstrzymaj pokaz/);
    assert.match(js, /if\(!s\)z\(Array\.isArray\(window\.__DOMIZ_PREVIEW_PROPS\)/);
    assert.doesNotMatch(js, /[^&]&e\.jsx/);
    assert.match(html, /src="\/assets\/index-DvzcJoKV\.js"/);
    assert.match(html, /src="\/hero\/hero-media\.js"/);
    assert.match(html, /<h1>Miejsce na decyzję\.<\/h1>/);
    assert.match(html, /href="\/oferty"/);
    assert.match(html, /href="\/osiedle-tluszcz"/);
    assert.match(html, /href="\/admin"/);
});

test("hero nie ma roboczego copy i prowadzi do obu specjalizacji", () => {
    assert.match(hero, /Miejsce na decyzję\./);
    assert.match(hero, /\/oferty\?katalog=kawalerki/);
    assert.match(hero, /\/osiedle-tluszcz/);
    assert.match(hero, /\/dodaj-nieruchomosc/);
    assert.match(hero, /Ogłoszenia zewnętrzne są oznaczone/);
    assert.match(hero, /onError:H=>\{H\.currentTarget\.style\.display="none"\}/);
    assert.doesNotMatch(hero, /podgląd|Obecna strona|Make a Move|serhant|hero\.badge/i);
    assert.match(hero, /Materiał wizerunkowy/);
});
