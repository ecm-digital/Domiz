import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

export function patchLiveRuntime({ indexPath, propertiesPath, htmlPath, swPath, heroMediaPath, outDir }) {
    let js = readFileSync(indexPath, "utf8");
    js = once(
        js,
        'jv=(s=!1)=>{const[d,z]=B.useState([]),[f,A]=B.useState(!0);return B.useEffect(()=>Tp(Ap(yd,"properties"),D=>{const w=D.docs.map(N=>({...N.data(),id:Number(N.data().id)}));!s&&(window.__DOMIZ_PREVIEW_PROPS||[]).forEach(N=>{w.some(x=>x.id===N.id)||w.push(N)});z(s?w:w.filter(N=>N.published!==!1)),A(!1)},D=>{console.error("Błąd pobierania ofert z Firebase:",D),A(!1)}),[s]),{properties:d,loading:f}}',
        'jv=(s=!1)=>{const seed=!s&&Array.isArray(window.__DOMIZ_PREVIEW_PROPS)?window.__DOMIZ_PREVIEW_PROPS.slice():[];const[d,z]=B.useState(seed),[f,A]=B.useState(!seed.length);return B.useEffect(()=>Tp(Ap(yd,"properties"),D=>{const w=D.docs.map(N=>({...N.data(),id:Number(N.data().id)}));!s&&(window.__DOMIZ_PREVIEW_PROPS||[]).forEach(N=>{w.some(x=>x.id===N.id)||w.push(N)});z(s?w:w.filter(N=>N.published!==!1)),A(!1)},D=>{console.error("Błąd pobierania ofert z Firebase:",D);if(!s)z(Array.isArray(window.__DOMIZ_PREVIEW_PROPS)?window.__DOMIZ_PREVIEW_PROPS.slice():[]);A(!1)}),[s]),{properties:d,loading:f}}',
        "oferty przy błędzie Firestore",
    );
    js = once(
        js,
        'const play=ee===_&&!!Y.video&&allowVideo;return c.jsx("div",{className:`hero-slide ${ee===_?"active":""}`,"aria-hidden":ee!==_,children:play?c.jsx("video",{className:"hero-slide-image hero-slide-video",src:Y.video,poster:Y.poster||Y.image,muted:!0,autoPlay:!heroPaused,loop:!0,playsInline:!0,preload:"metadata","aria-hidden":!0}):c.jsx("img",{className:"hero-slide-image",src:Y.video&&Y.poster&&ee===_&&!allowVideo?Y.poster:Y.image,alt:"",decoding:"async",fetchPriority:ee===0?"high":"low"})},ee)})',
        'const hasVideo=ee===_&&!!Y.video;const play=hasVideo&&allowVideo&&!heroPaused;return c.jsx("div",{className:`hero-slide ${ee===_?"active":""}`,"aria-hidden":ee!==_,children:hasVideo?c.jsx("video",{className:"hero-slide-image hero-slide-video",src:Y.video,poster:Y.poster||Y.image,muted:!0,autoPlay:play,controls:!allowVideo,loop:!0,playsInline:!0,preload:"metadata"},ee):c.jsx("img",{className:"hero-slide-image",src:Y.poster||Y.image,alt:"",decoding:"async",fetchPriority:ee===0?"high":"low",onError:H=>{H.currentTarget.style.display="none"}})},ee)})',
        "element video",
    );
    // Nazwy chunków zostają. Zmiana nazwy entry rozdziela Reacta, bo Properties importuje ./index-DvzcJoKV.js.
    js = once(
        js,
        'navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(s=>s.update())',
        'navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"})',
        "rejestracja service workera",
    );
    if (!js.includes('path:"/oferty"') || !js.includes('path:"/admin"') || !js.includes('path:"/osiedle-tluszcz"')) {
        throw new Error("łatka usunęła trasę SPA");
    }
    if (/[^&]&e\.jsx/.test(js)) throw new Error("bitowe & w bundle");

    let properties = readFileSync(propertiesPath, "utf8");
    properties = once(
        properties,
        "i.description.toLowerCase()",
        'String(i.description||"").toLowerCase()',
        "opis filtra",
    );
    properties = once(
        properties,
        "i.title.toLowerCase()",
        'String(i.title||"").toLowerCase()',
        "tytuł filtra",
    );

    let html = readFileSync(htmlPath, "utf8");
    if (!html.includes('src="/assets/index-DvzcJoKV.js"') || !html.includes('src="/hero/hero-media.js"')) {
        throw new Error("index.html ma inne nazwy niż żywy release");
    }

    let sw = readFileSync(swPath, "utf8");
    sw = once(sw, "const CACHE_NAME = 'domiz-crm-v6';", "const CACHE_NAME = 'domiz-crm-v7';", "wersja cache");
    sw = once(
        sw,
        "if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/pwa/')) {",
        "if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/pwa/') || url.pathname.startsWith('/hero/')) {",
        "hero network-first",
    );
    if (!sw.includes("fetch(request)") || sw.indexOf("caches.match(request)") < sw.indexOf("fetch(request)")) {
        throw new Error("service worker nie jest network-first");
    }

    mkdirSync(resolve(outDir, "assets"), { recursive: true });
    mkdirSync(resolve(outDir, "hero"), { recursive: true });
    writeFileSync(resolve(outDir, "assets/index-DvzcJoKV.js"), js);
    writeFileSync(resolve(outDir, "assets/Properties-DEjQCnEQ.js"), properties);
    writeFileSync(resolve(outDir, "index.html"), html);
    writeFileSync(resolve(outDir, "sw.js"), sw);
    copyFileSync(heroMediaPath, resolve(outDir, "hero/hero-media.js"));
    return { outDir };
}

if (process.argv[1] && process.argv[1].endsWith("patch-live-runtime.mjs")) {
    const [indexPath, propertiesPath, htmlPath, swPath, heroMediaPath, outDir] = process.argv.slice(2);
    console.log(patchLiveRuntime({ indexPath, propertiesPath, htmlPath, swPath, heroMediaPath, outDir }));
}
