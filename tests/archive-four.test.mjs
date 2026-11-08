import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "archive-four-"));
execFileSync(process.execPath, [
    "scripts/patch-archive-four.mjs",
    "/tmp/live-archive/index.js",
    "/tmp/live-archive/sitemap.xml",
    outDir,
], { cwd: root });
const js = readFileSync(join(outDir, "assets/index-DvzcJoKV.js"), "utf8");
const sitemap = readFileSync(join(outDir, "sitemap.xml"), "utf8");

test("cztery oferty znikają tylko z publicznej listy", () => {
    assert.match(js, /z\(s\?w:w\.filter\(N=>N\.published!==!1&&!\[1784754054299,1784755046567,1784827486549,1786414768122\]\.includes\(Number\(N\.id\)\)\)\)/);
    assert.doesNotMatch(js, /202610280110/);
    assert.match(js, /\/oferty-media\/BV-C2D04\.jpg/);
    assert.match(js, /Kawalerka z ogródkiem w Warszawie\. Dom w powiecie wołomińskim\./);
    assert.doesNotMatch(sitemap, /1784754054299|1784827486549/);
    assert.match(sitemap, /https:\/\/domizhomes\.com\/oferty</);
});
