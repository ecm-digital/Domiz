import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSasankaPreview } from "../scripts/build-sasanka-preview.mjs";

const live = readFileSync("/tmp/live-now/home.html", "utf8");
const html = buildSasankaPreview(live);
const firebase = readFileSync(new URL("../firebase.json", import.meta.url), "utf8");
const config = JSON.parse(firebase);

test("podgląd Sasanki nie podmienia strony głównej", () => {
    assert.match(html, /<title>Sasanka XL w Tłuszczu<\/title>/);
    assert.match(html, /property="og:title" content="Sasanka XL w Tłuszczu"/);
    assert.match(html, /property="og:description" content="Trzy sypialnie, własny ogród i garaż\./);
    assert.match(html, /property="og:image" content="https:\/\/domizhomes\.com\/osiedle-tluszcz\/wizualizacja-osiedla-v6\.png"/);
    assert.match(html, /property="og:url" content="https:\/\/domizhomes\.com\/osiedle-tluszcz"/);
    assert.match(html, /rel="canonical" href="https:\/\/domizhomes\.com\/osiedle-tluszcz"/);
    assert.match(html, /property="twitter:title" content="Sasanka XL w Tłuszczu"/);
    assert.match(html, /Wizualizacja poglądowa/);
    assert.match(html, /src="\/assets\/index-DvzcJoKV\.js"/);
    assert.doesNotMatch(html, /Kawalerka z ogródkiem|https:\/\/domizhomes\.com\/og-image\.png|od 650|7\.11/);
    assert.match(html, /rel="icon" type="image\/png" href="\/og-image\.png"/);
    assert.match(live, /<title>Kawalerka z ogródkiem w Warszawie i dom w powiecie wołomińskim \| Domiz Homes<\/title>/);
    assert.deepEqual(config.hosting.rewrites.slice(0, 2), [
        { source: "/osiedle-tluszcz", destination: "/osiedle-tluszcz/index.html" },
        { source: "/osiedle-tluszcz/", destination: "/osiedle-tluszcz/index.html" },
    ]);
    assert.equal(config.hosting.rewrites.at(-1).source, "**");
    assert.equal(config.hosting.rewrites.some((rule) => rule.source === "/osiedle-tluszcz/**"), false);
});
