import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const root = new URL("..", import.meta.url).pathname;
const manifestPath = "/home/ubuntu/.cursor/projects/workspace/uploads/manifest_d926.json";
const zipPath = "/home/ubuntu/.cursor/projects/workspace/uploads/domiz-oferty-assets-20261108_175b.zip";
const outDir = mkdtempSync(join(tmpdir(), "offer-media-"));
execFileSync(process.execPath, [
    "scripts/patch-offer-media.mjs",
    "/tmp/live-home/index.js",
    "/tmp/live-home/Details.js",
    manifestPath,
    zipPath,
    outDir,
], { cwd: root });

const js = readFileSync(join(outDir, "assets/index-DvzcJoKV.js"), "utf8");
const details = readFileSync(join(outDir, "assets/PropertyDetails-DkJEYQxI.js"), "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const start = js.indexOf("window.__DOMIZ_PREVIEW_PROPS=") + "window.__DOMIZ_PREVIEW_PROPS=".length;
const properties = JSON.parse(js.slice(start, js.indexOf("];", start) + 1));

test("29 obrazów trafia na właściwe karty, MZ-B2 zostaje bez pliku", () => {
    assert.equal(properties.length, 30);
    const ready = properties.filter((item) => item.review.imageLabel);
    const photos = ready.filter((item) => item.review.imageType === "zdjęcie lokalu");
    const plans = ready.filter((item) => item.review.imageType === "rzut");
    assert.equal(photos.length, 17);
    assert.equal(plans.length, 12);
    assert.equal(ready.filter((item) => item.review.imageLabel.startsWith("Wizualizacja")).length, 3);
    assert.equal(photos.filter((item) => /Wizualizacja|Rzut lokalu/.test(item.review.imageLabel)).length, 0);
    const bare = properties.find((item) => item.review.code === "MZ-B2");
    assert.equal(bare.id, 910011);
    assert.equal(bare.image, "/configurator/placeholder.svg");
    assert.equal(bare.review.imageLabel, undefined);
    const original = JSON.parse(readFileSync("/tmp/live-home/preview-props.json", "utf8"));
    for (const property of properties) {
        const before = original.find((item) => item.id === property.id);
        assert.equal(property.price, before.price);
        assert.equal(property.status, before.status);
        assert.equal(property.review.sourceUrl, before.review.sourceUrl);
    }
    for (const item of manifest.oferty.filter((entry) => entry.asset_path)) {
        const property = properties.find((entry) => entry.id === item.public_id);
        assert.equal(property.review.code, item.oferta_id);
        assert.equal(property.image, `/oferty-media/${item.asset_path.split("/").pop()}`);
        assert.equal(property.review.imageFit, "contain");
        assert.equal(property.review.rightsConfirmed, false);
    }
    const files = readdirSync(join(outDir, "oferty-media"));
    assert.equal(files.length, 29);
    assert.equal(files.includes("MZ-B2.jpg") || files.includes("MZ-B2.webp"), false);
});

test("film startuje od zera tylko przy wejściu, a trasy zostają", () => {
    assert.match(js, /if\(node\.currentTime>0\.05\)node\.currentTime=0/);
    assert.match(js, /node\.dataset\.domizFromZero/);
    assert.match(js, /node\.muted=!0;node\.defaultMuted=!0;node\.playsInline=!0/);
    assert.match(js, /autoPlay:!1/);
    assert.match(js, /domiz-hero-silent\.mp4/);
    assert.match(js, /path:"\/admin"/);
    assert.match(js, /path:"\/osiedle-tluszcz"/);
    assert.match(details, /objectFit:t\.review&&t\.review\.imageFit==="contain"\?"contain":"cover"/);
    assert.doesNotMatch(js, /[^&]&e\.jsx/);
    const hash = createHash("sha256").update(readFileSync(join(outDir, "oferty-media/BV-C2D04.jpg"))).digest("hex");
    assert.equal(hash, manifest.oferty.find((item) => item.oferta_id === "BV-C2D04").sha256);
});
