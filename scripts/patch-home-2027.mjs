import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

const REQUIRED_ROUTES = [
    'path:"/oferty"',
    'path:"/oferty/:id"',
    'path:"/osiedle-tluszcz"',
    'path:"/dodaj-nieruchomosc"',
    'path:"/admin"',
    'path:"/admin/login"',
    'path:"/panel-klienta"',
    'path:"/kawalerki-z-ogrodkiem"',
];

export function patchHome2027({ bundlePath, htmlPath, outDir }) {
    let js = readFileSync(bundlePath, "utf8");
    js = once(
        js,
        'className:"home-hero-section"',
        'className:"home-hero-section home-2027"',
        "klasa hero",
    );
    js = once(
        js,
        'c.jsxs("div",{className:"hero-badge animate-fade-in",children:[c.jsx("span",{className:"hero-badge-dot"}),c.jsx("span",{children:d("hero.badge")})]}),',
        "",
        "stary badge",
    );
    js = once(
        js,
        'c.jsxs("h1",{className:"hero-title text-white",children:[d("hero.titleTop")," ",c.jsx("br",{}),c.jsx("span",{className:"text-gradient-white",children:"Domiz Homes"})]})',
        'c.jsx("h1",{className:"hero-title text-white home-2027-title",children:"Miejsce na decyzję."})',
        "nagłówek",
    );
    js = once(
        js,
        'c.jsxs("p",{className:"hero-subtitle text-white-muted",children:[ga[_].desc[z]," ",d("hero.subtitle")]})',
        'c.jsx("p",{className:"hero-subtitle text-white-muted",children:z==="en"?"Garden studios and homes near Warsaw. The apartment price is separate from parking. External listings are marked and are not Domiz listings.":"Kawalerki z ogrodem i domy pod Warszawą. Cena lokalu jest osobno od parkingu. Ogłoszenia zewnętrzne są oznaczone i nie są ofertą biura."})',
        "lead",
    );
    js = once(
        js,
        'c.jsxs("div",{className:"hero-actions",children:[c.jsxs("button",{className:"btn-primary hero-btn-primary",onClick:()=>{Qe("hero_cta_click",{cta:"browse_offers"}),s("/oferty")},children:[d("hero.browse"),c.jsx(Dl,{size:20,strokeWidth:2.5})]}),c.jsx("button",{className:"btn-secondary-white hero-btn-secondary",onClick:()=>{Qe("hero_cta_click",{cta:"sell_property"}),s("/dodaj-nieruchomosc")},children:d("hero.sell")}),c.jsx("a",{href:"/chrzanow",className:"btn-secondary-white hero-btn-secondary",style:{textDecoration:"none"},onClick:()=>{Qe("hero_cta_click",{cta:"chrzanow"})},children:d("hero.chrzanow")})]})',
        'c.jsxs("div",{className:"hero-actions",children:[c.jsx("a",{href:"/oferty?katalog=kawalerki",className:"btn-primary hero-btn-primary",style:{textDecoration:"none"},onClick:()=>Qe("hero_cta_click",{cta:"garden_studios"}),children:"Kawalerki z ogródkiem"}),c.jsx("a",{href:"/osiedle-tluszcz",className:"btn-secondary-white hero-btn-secondary",style:{textDecoration:"none"},onClick:()=>Qe("hero_cta_click",{cta:"homes_near_warsaw"}),children:"Domy pod Warszawą"}),c.jsx("a",{href:"/dodaj-nieruchomosc",className:"btn-secondary-white hero-btn-secondary",style:{textDecoration:"none"},onClick:()=>Qe("hero_cta_click",{cta:"sell_property"}),children:d("hero.sell")})]})',
        "specjalizacje",
    );
    js = once(
        js,
        'c.jsx("h3",{className:"search-card-title text-white",children:d("hero.searchTitle")})',
        'c.jsx("h3",{className:"search-card-title",children:z==="en"?"Find a home":"Szukaj oferty"})',
        "tytuł wyszukiwarki",
    );
    js = once(
        js,
        "[heroPaused,setHeroPaused]=B.useState(!1)",
        "[heroPaused,setHeroPaused]=B.useState(()=>window.matchMedia(\"(max-width: 767px)\").matches||window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches||!!(navigator.connection&&navigator.connection.saveData))",
        "start bez wymuszonego autoplay",
    );
    js = once(
        js,
        "setAllowVideo(!(reduce||narrow||save));setAllowAdvance(!reduce)",
        "const allow=!(reduce||narrow||save);setAllowVideo(allow);setAllowAdvance(!reduce);if(!allow)setHeroPaused(!0)",
        "pauza gdy autoplay wyłączony",
    );
    js = once(
        js,
        'B.useEffect(()=>{const node=document.querySelector(".hero-slide.active video");if(!node)return;if(heroPaused||!allowVideo)node.pause();else node.play?.().catch(()=>{})},[heroPaused,_,allowVideo]);',
        'B.useEffect(()=>{document.querySelectorAll(".hero-slide-video").forEach(node=>{node.muted=!0;node.defaultMuted=!0;const active=node.closest(".hero-slide")?.classList.contains("active");if(!active||heroPaused){node.pause();return;}const attempt=node.play?.();attempt&&attempt.catch&&attempt.catch(()=>setHeroPaused(!0))})},[heroPaused,_,allowVideo]);',
        "odtwarzanie filmu",
    );
    js = once(
        js,
        'const hasVideo=ee===_&&!!Y.video;const play=hasVideo&&allowVideo&&!heroPaused;return c.jsx("div",{className:`hero-slide ${ee===_?"active":""}`,"aria-hidden":ee!==_,children:hasVideo?c.jsx("video",{className:"hero-slide-image hero-slide-video",src:Y.video,poster:Y.poster||Y.image,muted:!0,autoPlay:play,controls:!allowVideo,loop:!0,playsInline:!0,preload:"metadata"},ee):',
        'const hasVideo=!!Y.video;const play=ee===_&&hasVideo&&allowVideo&&!heroPaused;return c.jsx("div",{className:`hero-slide ${ee===_?"active":""}`,"aria-hidden":ee!==_,children:hasVideo?c.jsx("video",{className:"hero-slide-image hero-slide-video",src:Y.video,poster:Y.poster||Y.image,muted:!0,defaultMuted:!0,autoPlay:play,loop:!0,playsInline:!0,preload:"metadata",ref:H=>{if(H){H.muted=!0;H.defaultMuted=!0;}}},ee):',
        "stały element video",
    );
    js = once(
        js,
        'c.jsx("button",{type:"button",onClick:()=>setHeroPaused(Y=>!Y),className:"carousel-control-btn hero-pause-btn","aria-pressed":heroPaused,"aria-label":heroPaused?(z==="en"?"Play slideshow":"Wznów pokaz"):(z==="en"?"Pause slideshow":"Wstrzymaj pokaz"),children:heroPaused?(z==="en"?"Play":"Wznów"):(z==="en"?"Pause":"Pauza")})',
        'c.jsx("button",{type:"button",onClick:()=>{const node=document.querySelector(".hero-slide-video");if(node){node.muted=!0;node.defaultMuted=!0;if(node.paused){const attempt=node.play();attempt&&attempt.catch&&attempt.catch(()=>{});setHeroPaused(!1);}else{node.pause();setHeroPaused(!0);}}},className:"carousel-control-btn hero-pause-btn hero-film-toggle","aria-pressed":!heroPaused,"aria-label":heroPaused?(z==="en"?"Play the film":"Odtwarzaj film"):(z==="en"?"Pause the film":"Wstrzymaj film"),children:heroPaused?(z==="en"?"Play film":"Odtwarzaj film"):(z==="en"?"Pause film":"Wstrzymaj film")})',
        "przycisk filmu",
    );
    if (!js.includes('onError:H=>{H.currentTarget.style.display="none"}')) {
        throw new Error("brak ukrycia uszkodzonego obrazu z łatki runtime");
    }
    if (!js.includes("if(!s)z(Array.isArray(window.__DOMIZ_PREVIEW_PROPS)")) {
        throw new Error("brak dopięcia 30 rekordów przy błędzie Firestore");
    }
    if (!js.includes("defaultMuted:!0") || !js.includes("H.muted=!0") || !js.includes("H.defaultMuted=!0")) {
        throw new Error("film nie ustawia muted jako property");
    }
    for (const route of REQUIRED_ROUTES) {
        if (!js.includes(route)) throw new Error(`brak trasy ${route}`);
    }
    if (!js.includes("__DOMIZ_PREVIEW_PROPS") || !js.includes("domiz-hero-silent.mp4")) {
        throw new Error("brak ofert albo tymczasowego filmu");
    }
    if (/[^&]&e\.jsx/.test(js)) throw new Error("bitowe & w głównej");
    if (/podgląd|Obecna strona/i.test(js.slice(js.indexOf("function Qp"), js.indexOf("const Fi=")))) {
        throw new Error("zostało robocze copy w hero");
    }

    let html = readFileSync(htmlPath, "utf8");
    if (!html.includes('src="/assets/index-DvzcJoKV.js"')) throw new Error("index.html traci moduł SPA");
    html = once(
        html,
        '<link rel="stylesheet" crossorigin href="/assets/index-CHx3K4sg.css">',
        '<link rel="stylesheet" crossorigin href="/assets/index-CHx3K4sg.css">\n  <link rel="stylesheet" href="/home-2027.css">\n  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,460&display=swap" rel="stylesheet">',
        "css głównej",
    );
    html = once(
        html,
        '<div id="root"></div>',
        `<div id="root">
  <section class="home-static">
    <p>Domiz Homes</p>
    <h1>Miejsce na decyzję.</h1>
    <p>Kawalerki z ogrodem i domy pod Warszawą. Cena lokalu jest osobno od parkingu. Ogłoszenia zewnętrzne są oznaczone i nie są ofertą biura.</p>
    <nav aria-label="Strona">
      <a href="/oferty">Oferty</a>
      <a href="/oferty?katalog=kawalerki">Kawalerki z ogródkiem</a>
      <a href="/osiedle-tluszcz">Domy pod Warszawą</a>
      <a href="/dodaj-nieruchomosc">Sprzedaj nieruchomość</a>
      <a href="/admin">Panel</a>
    </nav>
    <form action="/oferty" method="get">
      <label>Lokalizacja <input name="search" type="search" placeholder="Miasto lub dzielnica"></label>
      <button type="submit">Szukaj</button>
    </form>
  </section>
</div>`,
        "html bez js",
    );
    if (!html.includes('src="/assets/index-DvzcJoKV.js"') || !html.includes('src="/hero/hero-media.js"')) {
        throw new Error("SPA albo konfiguracja wideo zniknęła");
    }

    mkdirSync(outDir, { recursive: true });
    mkdirSync(resolve(outDir, "assets"), { recursive: true });
    writeFileSync(resolve(outDir, "assets/index-DvzcJoKV.js"), js);
    writeFileSync(resolve(outDir, "index.html"), html);
    writeFileSync(resolve(outDir, "home-2027.css"), readFileSync(resolve("public/home-2027.css")));
    return { outDir };
}

if (process.argv[1] && process.argv[1].endsWith("patch-home-2027.mjs")) {
    const [bundlePath, htmlPath, outDir] = process.argv.slice(2);
    if (!bundlePath || !htmlPath || !outDir) {
        console.error("użycie: node scripts/patch-home-2027.mjs <index.js po video> <index.html po video> <wyjście>");
        process.exit(1);
    }
    console.log(patchHome2027({ bundlePath, htmlPath, outDir }));
}
