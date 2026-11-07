import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), "oferty-cta-"));
execFileSync(process.execPath, ["scripts/patch-live-oferty.mjs", "/tmp/live", outDir], { cwd: root });
const details = readFileSync(join(outDir, "assets/PropertyDetails-DkJEYQxI.js"), "utf8");

function mobileChildren() {
    const marker = 'className:"mobile-sticky-cta",children:';
    const start = details.indexOf(marker);
    assert.notEqual(start, -1);
    const from = start + marker.length;
    const end = details.indexOf('}),e.jsx("style"', from);
    assert.notEqual(end, -1);
    return details.slice(from, end);
}

function render(expr, property, phone) {
    const e = {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
    };
    return new Function("e", "t", "$", "p", "b", "x", "G", "K", `return (${expr})`)(
        e,
        property,
        phone,
        "pl",
        () => {},
        () => {},
        "icon",
        "icon",
    );
}

function textOf(node) {
    return JSON.stringify(node);
}

test("zwykła oferta zachowuje mobilne Zadzwoń i nie renderuje 0", () => {
    const expr = mobileChildren();
    assert.equal((details.match(/className:"mobile-sticky-cta",children:/g) || []).length, 1);
    assert.doesNotMatch(expr, /[^&]&e\.jsx/);
    const phone = "+48 535 330 323";
    const rendered = render(expr, { id: 9, review: undefined }, phone);
    const dump = textOf(rendered);
    assert.match(dump, /Zadzwoń/);
    assert.match(dump, /tel:\+48 535 330 323/);
    assert.match(dump, /Formularz kontaktowy/);
    assert.equal(rendered.includes(0), false);
    assert.equal(rendered.some((item) => item === 0), false);
});

test("ogłoszenie zewnętrzne ma osobny link źródła zamiast telefonu biura", () => {
    const expr = mobileChildren();
    const rendered = render(expr, {
        id: 910015,
        review: { sourceUrl: "https://www.yit.pl/warszawa/nordic-bemowo-v/pdpl110205" },
    }, "+48 535 330 323");
    const dump = textOf(rendered);
    assert.match(dump, /Otwórz źródło/);
    assert.match(dump, /https:\/\/www\.yit\.pl\/warszawa\/nordic-bemowo-v\/pdpl110205/);
    assert.doesNotMatch(dump, /Zadzwoń|tel:/);
    assert.equal(rendered.some((item) => item === 0), false);
});
