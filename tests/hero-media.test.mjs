import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
    HERO_SLIDES,
    heroEnvironment,
    heroMediaConfig,
    visualsForSlides,
} from "../src/hero/heroMedia.js";

test("bez filmu hero zostaje na obecnych trzech tłach", () => {
    const slides = heroMediaConfig();
    assert.equal(slides.length, 3);
    assert.deepEqual(slides.map((slide) => slide.image), HERO_SLIDES.map((slide) => slide.image));
    assert.ok(slides.every((slide) => slide.video === "" && slide.poster === ""));
    const visuals = visualsForSlides(slides, heroEnvironment(), 0, false);
    assert.ok(visuals.every((visual) => visual.kind === "image" && visual.autoplay === false));
    assert.equal(visuals.filter((visual) => visual.kind === "video").length, 0);
});

test("film ładuje się tylko na aktywnym slajdzie i tylko gdy ruch jest dozwolony", () => {
    const slides = heroMediaConfig([
        { video: "/hero/przyszly.mp4", poster: "/hero/przyszly.jpg" },
        { video: "/hero/inny.mp4", poster: "/hero/inny.jpg" },
    ]);
    const desktop = heroEnvironment();
    const playing = visualsForSlides(slides, desktop, 0, false);
    assert.equal(playing[0].kind, "video");
    assert.equal(playing[0].src, "/hero/przyszly.mp4");
    assert.equal(playing[0].poster, "/hero/przyszly.jpg");
    assert.equal(playing[0].muted, true);
    assert.equal(playing[0].loop, true);
    assert.equal(playing[0].playsInline, true);
    assert.equal(playing[0].preload, "none");
    assert.equal(playing[0].autoplay, true);
    assert.equal(playing[1].kind, "image");
    assert.equal(playing[1].src, slides[1].image);
    assert.equal(playing[2].kind, "image");
    const paused = visualsForSlides(slides, desktop, 0, true);
    assert.equal(paused[0].autoplay, false);
    assert.equal(paused[0].kind, "video");
});

test("mobile, reduced motion i save-data zostają przy statycznym kadrze", () => {
    const slides = heroMediaConfig([
        { video: "/hero/przyszly.mp4", poster: "/hero/przyszly.jpg" },
    ]);
    for (const env of [
        heroEnvironment({ narrow: true }),
        heroEnvironment({ reducedMotion: true }),
        heroEnvironment({ saveData: true }),
    ]) {
        const visuals = visualsForSlides(slides, env, 0, false);
        assert.equal(visuals[0].kind, "image");
        assert.equal(visuals[0].src, "/hero/przyszly.jpg");
        assert.equal(visuals[0].autoplay, false);
        assert.equal(visuals.filter((visual) => visual.kind === "video").length, 0);
    }
    assert.equal(heroEnvironment({ reducedMotion: true }).allowAutoAdvance, false);
    assert.equal(heroEnvironment().allowAutoAdvance, true);
});

test("opublikowana konfiguracja nie zawiera filmu", () => {
    const config = readFileSync(new URL("../public/hero/hero-media.js", import.meta.url), "utf8");
    assert.match(config, /window\.__DOMIZ_HERO_MEDIA/);
    assert.doesNotMatch(config, /\.mp4|serhant|heygen/i);
    assert.equal((config.match(/video: ""/g) || []).length, 3);
    assert.equal((config.match(/poster: ""/g) || []).length, 3);
});

test("łata hero dokłada pauzę i statyczny H1, bez podmiany ofert", () => {
    const outDir = mkdtempSync(join(tmpdir(), "hero-patch-"));
    execFileSync(process.execPath, [
        "scripts/patch-live-hero.mjs",
        "/tmp/oferty-overlay/assets/index-DvzcJoKV.js",
        "/tmp/live/index.html",
        outDir,
    ], { cwd: new URL("..", import.meta.url).pathname });
    const js = readFileSync(join(outDir, "assets/index-DvzcJoKV.js"), "utf8");
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    execFileSync(process.execPath, ["--check", join(outDir, "assets/index-DvzcJoKV.js")]);
    assert.match(js, /__DOMIZ_HERO_MEDIA/);
    assert.match(js, /prefers-reduced-motion/);
    assert.match(js, /saveData/);
    assert.match(js, /playsInline:!0/);
    assert.match(js, /preload:"none"/);
    assert.match(js, /ee===_&&!!Y\.video&&allowVideo/);
    assert.match(js, /Wstrzymaj pokaz/);
    assert.match(js, /ArrowRight/);
    assert.match(js, /NB-G101|__DOMIZ_PREVIEW_PROPS/);
    assert.doesNotMatch(js, /\.mp4|serhant/i);
    assert.match(html, /<h1>Nieruchomości na Śląsku, Mazowszu i w Dubaju Domiz Homes<\/h1>/);
    assert.match(html, /href="\/oferty"/);
    assert.match(html, /href="\/dodaj-nieruchomosc"/);
    assert.match(html, /href="\/chrzanow"/);
    assert.match(html, /src="\/hero\/hero-media\.js"/);
    assert.match(html, /src="\/assets\/index-DvzcJoKV\.js"/);
});
