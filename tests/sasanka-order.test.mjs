import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "sasanka-order-"));
execFileSync(process.execPath, [
    "scripts/patch-sasanka-order.mjs",
    "/tmp/live-now/OsiedleTluszcz.js",
    outDir,
], { cwd: root });
const js = readFileSync(join(outDir, "OsiedleTluszcz-D2t5wflE.js"), "utf8");
const ze = js.slice(js.indexOf("function Ze"), js.indexOf("export{Ze"));

test("kolejność decyzji jest przed opisem modelu", () => {
    const markers = [
        "Układ A–E na planie ilustracyjnym",
        "Rzut modelowy: parter i piętro",
        "4 warianty wyposażenia domu",
        "Na jakim etapie jest Osiedle Tłuszcz?",
        "ul. Zaściankowa w Tłuszczu",
        'id:"kontakt"',
        "Zobacz przykładowe wnętrza modelowej Sasanki XL",
        "Sasanki stoją już w wielu miejscach w Polsce",
    ];
    let previous = -1;
    for (const marker of markers) {
        const at = ze.indexOf(marker);
        assert.ok(at > previous, marker);
        previous = at;
    }
    assert.match(js, /przygotowany grunt, bez fundamentów/);
    assert.match(js, /83,00 m² bez garażu/);
    assert.doesNotMatch(js, /od 650|wolnych domach|WEWNETRZNE/);
    assert.equal(js.match(/P\(!0\)/g).length, 3);
    assert.match(js, /from"\.\/index-DvzcJoKV\.js"/);
});
