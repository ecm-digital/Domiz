// Mechanizm tła hero. Puste video i poster oznaczają: jeszcze nie podpięto filmu.
// Slajdy zostają przy dotychczasowych zdjęciach. Tu nie ma pliku MP4.

export const HERO_SLIDES = [
    {
        id: "gwiazdy",
        image: "/properties/gwiazdy/balkon-zachod.webp",
        video: "",
        poster: "",
    },
    {
        id: "pod-warszawa",
        image: "/properties/carousel/suburban_house.png",
        video: "",
        poster: "",
    },
    {
        id: "dubaj",
        image: "/properties/carousel/dubai-apartment.png",
        video: "",
        poster: "",
    },
];

export function heroMediaConfig(overrides = []) {
    return HERO_SLIDES.map((slide, index) => {
        const extra = overrides[index] || {};
        const video = typeof extra.video === "string" ? extra.video.trim() : slide.video;
        const poster = typeof extra.poster === "string" ? extra.poster.trim() : slide.poster;
        return { ...slide, video, poster };
    });
}

export function heroEnvironment({ reducedMotion = false, saveData = false, narrow = false } = {}) {
    return {
        reducedMotion: Boolean(reducedMotion),
        saveData: Boolean(saveData),
        narrow: Boolean(narrow),
        allowVideo: !(reducedMotion || saveData || narrow),
        allowAutoAdvance: !reducedMotion,
    };
}

export function slideVisual(slide, { active = false, allowVideo = false, paused = false } = {}) {
    const video = String(slide.video || "").trim();
    const poster = String(slide.poster || "").trim();
    const playVideo = Boolean(active && video && allowVideo);
    if (playVideo) {
        return {
            kind: "video",
            src: video,
            poster: poster || slide.image,
            autoplay: !paused,
            muted: true,
            loop: true,
            playsInline: true,
            preload: "none",
        };
    }
    const staticPoster = Boolean(video && poster && active && !allowVideo);
    return {
        kind: "image",
        src: staticPoster ? poster : slide.image,
        autoplay: false,
    };
}

export function visualsForSlides(slides, env, activeIndex, paused = false) {
    return slides.map((slide, index) => slideVisual(slide, {
        active: index === activeIndex,
        allowVideo: env.allowVideo,
        paused,
    }));
}
