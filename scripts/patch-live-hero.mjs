import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, to);
}

const SLIDES = `const ga=[{image:"/properties/gwiazdy/balkon-zachod.webp",title:{pl:"Apartament na Gwiazdach w Katowicach",en:"Apartment at Gwiazdy Estate in Katowice"},desc:{pl:"Apartament z panoramicznym widokiem na Osiedlu Gwiazdy w Katowicach.",en:"An apartment with panoramic views at the Gwiazdy Estate in Katowice."},video:"",poster:""},{image:"/properties/carousel/suburban_house.png",title:{pl:"Dom pod Warszawą",en:"Home near Warsaw"},desc:{pl:"Nowoczesny dom z ogrodem pod Warszawą.",en:"A modern home with a garden near Warsaw."},video:"",poster:""},{image:"/properties/carousel/dubai-apartment.png",title:{pl:"Apartament inwestycyjny w Dubaju",en:"Investment apartment in Dubai"},desc:{pl:"Apartament premium z widokiem na panoramę Dubaju.",en:"A premium apartment overlooking the Dubai skyline."},video:"",poster:""}].map((slide,index)=>{const extra=(window.__DOMIZ_HERO_MEDIA||[])[index]||{};return{...slide,video:String(extra.video||"").trim(),poster:String(extra.poster||"").trim()}}),Zp=5e3;`;

const STATIC_HERO = `
  <section class="hero-static-fallback">
    <h1>Nieruchomości na Śląsku, Mazowszu i w Dubaju Domiz Homes</h1>
    <p>Sprzedajemy nieruchomości na Śląsku, Mazowszu i w Dubaju. Pomagamy bezpiecznie kupować, sprzedawać i finansować nieruchomości.</p>
    <nav aria-label="Skróty strony głównej">
      <a href="/oferty">Przeglądaj Oferty</a>
      <a href="/dodaj-nieruchomosc">Sprzedaj Nieruchomość</a>
      <a href="/chrzanow">Warszawa – Chrzanów (Bemowo)</a>
    </nav>
    <form action="/oferty" method="get">
      <label>Lokalizacja lub nazwa <input name="search" type="text" placeholder="Wpisz miasto, ulicę..."></label>
      <label>Typ
        <select name="type">
          <option value="">Wszystkie</option>
          <option value="dom">Dom</option>
          <option value="mieszkanie">Mieszkanie</option>
          <option value="dzialka">Działka</option>
        </select>
      </label>
      <label>Cena do
        <select name="maxPrice">
          <option value="">Dowolna</option>
          <option value="500000">500 000 PLN</option>
          <option value="1000000">1 000 000 PLN</option>
          <option value="2000000">2 000 000 PLN</option>
        </select>
      </label>
      <button type="submit">Szukaj</button>
    </form>
  </section>`;

export function patchLiveHero({ bundlePath, htmlPath, outDir }) {
    let js = readFileSync(bundlePath, "utf8");
    js = once(
        js,
        'const ga=[{image:"/properties/gwiazdy/balkon-zachod.webp",title:{pl:"Apartament na Gwiazdach w Katowicach",en:"Apartment at Gwiazdy Estate in Katowice"},desc:{pl:"Apartament z panoramicznym widokiem na Osiedlu Gwiazdy w Katowicach.",en:"An apartment with panoramic views at the Gwiazdy Estate in Katowice."}},{image:"/properties/carousel/suburban_house.png",title:{pl:"Dom pod Warszawą",en:"Home near Warsaw"},desc:{pl:"Nowoczesny dom z ogrodem pod Warszawą.",en:"A modern home with a garden near Warsaw."}},{image:"/properties/carousel/dubai-apartment.png",title:{pl:"Apartament inwestycyjny w Dubaju",en:"Investment apartment in Dubai"},desc:{pl:"Apartament premium z widokiem na panoramę Dubaju.",en:"A premium apartment overlooking the Dubai skyline."}}],Zp=5e3;',
        SLIDES,
        "slajdy",
    );
    js = once(
        js,
        'function Qp(){const s=Ii(),{t:d,language:z}=La(),[f,A]=B.useState(""),[b,D]=B.useState(""),[w,N]=B.useState(""),[_,E]=B.useState(0),[O,H]=B.useState(!1),[pe,ve]=B.useState(()=>document.visibilityState==="visible");',
        'function Qp(){const s=Ii(),{t:d,language:z}=La(),[f,A]=B.useState(""),[b,D]=B.useState(""),[w,N]=B.useState(""),[_,E]=B.useState(0),[O,H]=B.useState(!1),[pe,ve]=B.useState(()=>document.visibilityState==="visible"),[heroPaused,setHeroPaused]=B.useState(!1),[allowVideo,setAllowVideo]=B.useState(!1),[allowAdvance,setAllowAdvance]=B.useState(!0);B.useEffect(()=>{const read=()=>{const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches,narrow=window.matchMedia("(max-width: 767px)").matches,save=!!(navigator.connection&&navigator.connection.saveData);setAllowVideo(!(reduce||narrow||save));setAllowAdvance(!reduce)};read();const motion=window.matchMedia("(prefers-reduced-motion: reduce)"),width=window.matchMedia("(max-width: 767px)");motion.addEventListener?.("change",read);width.addEventListener?.("change",read);return()=>{motion.removeEventListener?.("change",read);width.removeEventListener?.("change",read)}},[]);',
        "warunki odtwarzania",
    );
    js = once(
        js,
        'B.useEffect(()=>{if(O||!pe)return;const Y=window.setTimeout(()=>{E(ee=>(ee+1)%ga.length)},Zp);return()=>window.clearTimeout(Y)},[_,pe,O]);',
        'B.useEffect(()=>{if(O||!pe||heroPaused||!allowAdvance)return;const Y=window.setTimeout(()=>{E(ee=>(ee+1)%ga.length)},Zp);return()=>window.clearTimeout(Y)},[_,pe,O,heroPaused,allowAdvance]);B.useEffect(()=>{const node=document.querySelector(".hero-slide.active video");if(!node)return;if(heroPaused||!allowVideo)node.pause();else node.play?.().catch(()=>{})},[heroPaused,_,allowVideo]);',
        "autoplay i pauza",
    );
    js = once(
        js,
        'ga.map((Y,ee)=>c.jsx("div",{className:`hero-slide ${ee===_?"active":""}`,"aria-hidden":ee!==_,children:c.jsx("img",{className:"hero-slide-image",src:Y.image,alt:"",decoding:"async",fetchPriority:ee===0?"high":"low"})},ee))',
        'ga.map((Y,ee)=>{const play=ee===_&&!!Y.video&&allowVideo;return c.jsx("div",{className:`hero-slide ${ee===_?"active":""}`,"aria-hidden":ee!==_,children:play?c.jsx("video",{className:"hero-slide-image hero-slide-video",src:Y.video,poster:Y.poster||Y.image,muted:!0,autoPlay:!heroPaused,loop:!0,playsInline:!0,preload:"none","aria-hidden":!0}):c.jsx("img",{className:"hero-slide-image",src:Y.video&&Y.poster&&ee===_&&!allowVideo?Y.poster:Y.image,alt:"",decoding:"async",fetchPriority:ee===0?"high":"low"})},ee)})',
        "aktywny slajd",
    );
    js = once(
        js,
        'return c.jsxs("section",{className:"home-hero-section","aria-roledescription":"carousel","aria-label":z==="en"?"Featured properties":"Wyróżnione nieruchomości",onMouseEnter:()=>H(!0),onMouseLeave:()=>H(!1),onFocusCapture:()=>H(!0),onBlurCapture:Y=>{Y.currentTarget.contains(Y.relatedTarget)||H(!1)}',
        'return c.jsxs("section",{className:"home-hero-section","aria-roledescription":"carousel","aria-label":z==="en"?"Featured properties":"Wyróżnione nieruchomości",onMouseEnter:()=>H(!0),onMouseLeave:()=>H(!1),onFocusCapture:()=>H(!0),onBlurCapture:Y=>{Y.currentTarget.contains(Y.relatedTarget)||H(!1)},onKeyDown:Y=>{const tag=Y.target&&Y.target.tagName;if(tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA")return;if(Y.key==="ArrowRight"){Y.preventDefault();Ce()}if(Y.key==="ArrowLeft"){Y.preventDefault();Zt()}}',
        "klawiatura",
    );
    js = once(
        js,
        'c.jsx("button",{onClick:Zt,className:"carousel-control-btn","aria-label":"Previous slide",children:c.jsx(Py,{size:20})})',
        'c.jsx("button",{type:"button",onClick:Zt,className:"carousel-control-btn","aria-label":z==="en"?"Previous slide":"Poprzedni slajd",children:c.jsx(Py,{size:20})}),c.jsx("button",{type:"button",onClick:()=>setHeroPaused(Y=>!Y),className:"carousel-control-btn hero-pause-btn","aria-pressed":heroPaused,"aria-label":heroPaused?(z==="en"?"Play slideshow":"Wznów pokaz"):(z==="en"?"Pause slideshow":"Wstrzymaj pokaz"),children:heroPaused?(z==="en"?"Play":"Wznów"):(z==="en"?"Pause":"Pauza")})',
        "przycisk pauzy",
    );
    js = once(
        js,
        'c.jsx("button",{onClick:Ce,className:"carousel-control-btn","aria-label":"Next slide",children:c.jsx(Iy,{size:20})})',
        'c.jsx("button",{type:"button",onClick:Ce,className:"carousel-control-btn","aria-label":z==="en"?"Next slide":"Następny slajd",children:c.jsx(Iy,{size:20})})',
        "następny slajd",
    );
    if (js.includes("serhant.com") || js.includes(".mp4")) {
        throw new Error("mechanizm nie może zawierać filmu ani adresu SERHANT");
    }

    let html = readFileSync(htmlPath, "utf8");
    html = once(
        html,
        '<link rel="stylesheet" crossorigin href="/assets/index-CHx3K4sg.css">',
        '<link rel="stylesheet" crossorigin href="/assets/index-CHx3K4sg.css">\n  <link rel="stylesheet" href="/hero/hero-media.css">\n  <script src="/hero/hero-media.js"></script>',
        "podpięcie konfiguracji",
    );
    html = once(html, '<div id="root"></div>', `<div id="root">${STATIC_HERO}\n  </div>`, "statyczny H1");
    if (!html.includes("<h1>") || !html.includes('href="/oferty"')) {
        throw new Error("statyczny hero nie ma H1 albo linku ofert");
    }

    mkdirSync(resolve(outDir, "assets"), { recursive: true });
    mkdirSync(resolve(outDir, "hero"), { recursive: true });
    writeFileSync(resolve(outDir, "assets/index-DvzcJoKV.js"), js);
    writeFileSync(resolve(outDir, "index.html"), html);
    copyFileSync(resolve("public/hero/hero-media.js"), resolve(outDir, "hero/hero-media.js"));
    copyFileSync(resolve("public/hero/hero-media.css"), resolve(outDir, "hero/hero-media.css"));
    return { outDir };
}

if (process.argv[1] && process.argv[1].endsWith("patch-live-hero.mjs")) {
    const bundlePath = process.argv[2];
    const htmlPath = process.argv[3];
    const outDir = process.argv[4];
    if (!bundlePath || !htmlPath || !outDir) {
        console.error("użycie: node scripts/patch-live-hero.mjs <bundle-po-integracji> <index.html> <wyjście>");
        process.exit(1);
    }
    console.log(patchLiveHero({ bundlePath, htmlPath, outDir }));
}
