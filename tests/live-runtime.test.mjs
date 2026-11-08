import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "live-runtime-"));
execFileSync(process.execPath, [
    "scripts/patch-live-runtime.mjs",
    "/tmp/live-now/index.js",
    "/tmp/live-now/Properties.js",
    "/tmp/live-now/index.html",
    "/tmp/live-now/sw.js",
    "/tmp/live-now/hero-media.js",
    outDir,
], { cwd: root });

const js = readFileSync(join(outDir, "assets/index-DvzcJoKV.js"), "utf8");
const properties = readFileSync(join(outDir, "assets/Properties-DEjQCnEQ.js"), "utf8");
const html = readFileSync(join(outDir, "index.html"), "utf8");
const sw = readFileSync(join(outDir, "sw.js"), "utf8");

test("błąd Firestore nadal oddaje 30 zapisów, a sukces je scala", () => {
    const seed = [{ id: 910001, review: { city: "Warszawa" }, published: true, title: "A", description: "a", location: "Warszawa", price: 1, type: "mieszkanie", status: "sprzedaz" }];
    const start = js.indexOf("jv=(s=!1)=>{");
    const end = js.indexOf(",xv=", start);
    const hook = js.slice(start, end);
    const calls = [];
    const B = { useState: (v) => [v, (n) => calls.push(n)], useEffect: (fn) => { calls.effect = fn; return fn; } };
    const Tp = (_ref, ok, err) => ({ ok, err });
    const Ap = () => "properties";
    const yd = {};
    const window = { __DOMIZ_PREVIEW_PROPS: seed };
    const fn = new Function("B", "Tp", "Ap", "yd", "window", `${hook}; return jv;`);
    const jv = fn(B, Tp, Ap, yd, window);
    const result = jv(false);
    assert.equal(result.properties.length, 1);
    assert.equal(result.loading, false);
    const sub = calls.effect();
    sub.err(new Error("permission"));
    const lists = calls.filter(Array.isArray);
    assert.equal(lists.at(-1).length, 1);
    assert.equal(lists.at(-1)[0].review.city, "Warszawa");
});

test("wideo jest w DOM także bez autoplay, a trasy i SW zostają", () => {
    assert.match(js, /const hasVideo=ee===_&&!!Y\.video/);
    assert.match(js, /controls:!allowVideo/);
    assert.match(js, /import\("\.\/Properties-DEjQCnEQ\.js"/);
    assert.match(js, /path:"\/admin"/);
    assert.match(js, /path:"\/osiedle-tluszcz"/);
    assert.doesNotMatch(js, /[^&]&e\.jsx/);
    assert.match(html, /src="\/assets\/index-DvzcJoKV\.js"/);
    assert.match(html, /src="\/hero\/hero-media\.js"/);
    assert.match(properties, /String\(i\.description\|\|""\)\.toLowerCase\(\)/);
    assert.match(properties, /catalogOk=catalog!=="kawalerki"\|\|!!s\.review/);
    assert.match(sw, /domiz-crm-v7/);
    assert.match(sw, /pathname\.startsWith\('\/hero\/'\)/);
    const fetchAt = sw.indexOf("fetch(request)");
    assert.ok(fetchAt > 0 && fetchAt < sw.indexOf("caches.match(request)"));
});
