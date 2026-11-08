import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "sasanka-meta-"));
execFileSync(process.execPath, ["scripts/patch-sasanka-meta.mjs", "/tmp/sasanka-v2/OsiedleTluszcz-D2t5wflE.js", outDir], { cwd: root });
const js = readFileSync(join(outDir, "OsiedleTluszcz-D2t5wflE.js"), "utf8");

test("po JS meta są takie jak surowy HTML", () => {
    assert.match(js, /M="Sasanka XL w Tłuszczu"/);
    assert.match(js, /C="Trzy sypialnie, własny ogród i garaż\. Sasanka XL przy ul\. Zaściankowej w Tłuszczu\. Grafika jest wizualizacją poglądową, nie zdjęciem budowy\."/);
    assert.match(js, /R="https:\/\/domizhomes\.com\/osiedle-tluszcz\/wizualizacja-osiedla-v6\.png"/);
    assert.match(js, /w="https:\/\/domizhomes\.com\/osiedle-tluszcz"/);
    assert.doesNotMatch(js, /og-osiedle-tluszcz\.jpg/);
    assert.match(js, /Układ A–E na planie ilustracyjnym/);
    assert.match(js, /przygotowany grunt, bez fundamentów/);
});
