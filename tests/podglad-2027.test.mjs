import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { filterOffers } from "../public/podglad-2027/filterOffers.js";
import { gardenStudioProperties } from "../src/data/gardenOffers.js";

execFileSync(process.execPath, ["scripts/build-podglad-2027.mjs"], { cwd: new URL("..", import.meta.url).pathname });

const read = (path) => readFileSync(new URL(`../public/podglad-2027/${path}`, import.meta.url), "utf8");

test("filtry miast i wyszukiwarka trzymają się trzydziestu zapisów", () => {
    const offers = gardenStudioProperties().map((offer) => ({
        city: offer.review.city,
        title: offer.title,
        location: offer.location,
        code: offer.review.code,
        price: offer.price,
    }));
    assert.equal(filterOffers(offers, {}).length, 30);
    assert.equal(filterOffers(offers, { city: "Warszawa" }).length, 27);
    assert.equal(filterOffers(offers, { city: "Katowice" }).length, 3);
    const nordic = filterOffers(offers, { q: "G 1.01" });
    assert.equal(nordic.length, 1);
    assert.equal(nordic[0].code, "NB-G101");
    assert.equal(nordic[0].price, 551355);
});

test("podgląd ma strony, kanoniczne adresy i nie udaje filmu", () => {
    const home = read("index.html");
    const all = read("oferty/index.html");
    const warsaw = read("oferty/warszawa/index.html");
    const katowice = read("oferty/katowice/index.html");
    const detail = read("oferty/nb-g101/index.html");
    assert.match(home, /<h1>Miejsce na decyzję\.<\/h1>/);
    assert.match(home, /href="\/podglad-2027\/oferty"/);
    assert.match(home, /href="\/"/);
    assert.match(home, /data-hero/);
    assert.match(home, /poster\.svg/);
    assert.doesNotMatch(home, /\.mp4|serhant|Make a Move|Most Followed/i);
    assert.equal((all.match(/data-offer/g) || []).length, 30);
    assert.equal((warsaw.match(/data-offer/g) || []).length, 27);
    assert.equal((katowice.match(/data-offer/g) || []).length, 3);
    assert.match(detail, /551&nbsp;355 zł|551\u00a0355 zł/);
    assert.match(detail, /LUB/);
    assert.match(detail, /niepotwierdzony|NIEPOTWIERDZONE/);
    assert.doesNotMatch(detail, /Tomasz|517 303|535 330|642355|salon\.jpg/);
    assert.doesNotMatch(`${all}${warsaw}${katowice}${detail}`, /SK-A224|SK-A225|NBIII-L1110|NB-G103|MOI-C2M7/);
    const files = ["index.html", "oferty/index.html", "oferty/warszawa/index.html", "oferty/katowice/index.html", "oferty/nb-g101/index.html"];
    const canonicals = files.map((file) => read(file).match(/rel="canonical" href="([^"]+)"/)[1]);
    assert.equal(new Set(canonicals).size, canonicals.length);
    const detailCount = readdirSync(new URL("../public/podglad-2027/oferty", import.meta.url), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== "warszawa" && entry.name !== "katowice").length;
    assert.equal(detailCount, 30);
});
