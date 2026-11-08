import { heroMediaConfig, readHeroEnvironment, slideVisual } from "/hero/heroMedia.js";

const root = document.querySelector("[data-hero]");
if (!root) {
    throw new Error("Brak hero");
}

const captions = ["Śląsk", "Mazowsze", "Przegląd zewnętrzny"];
const notes = [
    "Własne oferty biura zostają na obecnej stronie.",
    "Domy pod Warszawą nie znikają z dotychczasowego adresu.",
    "Trzydzieści kawalerek z ogrodem, bez udawania własnej sprzedaży.",
];
const slides = heroMediaConfig(window.__DOMIZ_HERO_MEDIA || []).map((slide, index) => ({
    ...slide,
    image: "/podglad-2027/poster.svg",
    caption: captions[index] || slide.id,
    note: notes[index] || "",
}));

const still = root.querySelector("[data-hero-still]");
const caption = root.querySelector("[data-hero-caption]");
const note = root.querySelector("[data-hero-note]");
const pauseButton = root.querySelector("[data-hero-pause]");
const dots = [...root.querySelectorAll("[data-hero-dot]")];
let index = 0;
let paused = false;
let env = readHeroEnvironment(window);

function render() {
    const slide = slides[index];
    const visual = slideVisual(slide, {
        active: true,
        allowVideo: env.allowVideo,
        paused,
    });
    let video = root.querySelector("video");
    if (visual.kind === "video") {
        if (!video) {
            video = document.createElement("video");
            video.className = "hero-video";
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = "none";
            video.setAttribute("aria-hidden", "true");
            still.insertAdjacentElement("afterend", video);
        }
        video.poster = visual.poster;
        if (video.getAttribute("src") !== visual.src) video.src = visual.src;
        still.hidden = true;
        if (visual.autoplay) video.play?.().catch(() => {});
        else video.pause();
    } else if (video) {
        video.pause();
        video.remove();
        still.hidden = false;
    }
    caption.textContent = slide.caption;
    note.textContent = slide.note;
    dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
    });
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Wznów" : "Pauza";
}

function go(next) {
    index = (next + slides.length) % slides.length;
    render();
}

root.querySelector("[data-hero-prev]").addEventListener("click", () => go(index - 1));
root.querySelector("[data-hero-next]").addEventListener("click", () => go(index + 1));
pauseButton.addEventListener("click", () => {
    paused = !paused;
    render();
});
dots.forEach((dot) => {
    dot.addEventListener("click", () => go(Number(dot.dataset.heroDot)));
});

root.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight") {
        event.preventDefault();
        go(index + 1);
    }
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(index - 1);
    }
});

let timer = 0;
function schedule() {
    window.clearTimeout(timer);
    if (!env.allowAutoAdvance || paused || document.hidden) return;
    timer = window.setTimeout(() => {
        go(index + 1);
        schedule();
    }, 7000);
}

document.addEventListener("visibilitychange", schedule);
root.addEventListener("mouseenter", () => window.clearTimeout(timer));
root.addEventListener("mouseleave", schedule);
window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => {
    env = readHeroEnvironment(window);
    render();
    schedule();
});
window.matchMedia("(max-width: 767px)").addEventListener?.("change", () => {
    env = readHeroEnvironment(window);
    render();
});

render();
schedule();
