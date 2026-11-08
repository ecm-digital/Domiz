import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

function applyMedia(properties, manifestOffers) {
    const byCode = new Map(manifestOffers.map((item) => [item.oferta_id, item]));
    let photos = 0;
    let plans = 0;
    let visualizations = 0;
    for (const property of properties) {
        const code = property.review?.code;
        const item = byCode.get(code);
        if (!item) throw new Error(`brak manifestu dla ${code}`);
        if (item.public_id !== property.id) throw new Error(`public_id ${code}: ${item.public_id} !== ${property.id}`);
        const price = property.price;
        const status = property.status;
        if (item.status === "brak_pliku") {
            if (code !== "MZ-B2" || property.id !== 910011) throw new Error("jedyny brak pliku to MZ-B2 / 910011");
            property.image = "/configurator/placeholder.svg";
            property.images = [];
            delete property.review.imageLabel;
            delete property.review.imageType;
            delete property.review.imageAlt;
            delete property.review.imageFit;
            delete property.review.imageSource;
        } else {
            const file = item.asset_path.split("/").pop();
            const src = `/oferty-media/${file}`;
            property.image = src;
            property.images = [];
            property.review.imageLabel = item.label;
            property.review.imageType = item.typ;
            property.review.imageAlt = item.alt;
            property.review.imageFit = "contain";
            property.review.imageSource = item.zrodlo_obrazu;
            property.review.rightsConfirmed = false;
            if (item.typ === "zdjęcie lokalu") photos += 1;
            else if (item.typ === "rzut") plans += 1;
            else throw new Error(`nieznany typ ${item.typ}`);
            if (item.label.startsWith("Wizualizacja")) visualizations += 1;
            if (item.typ === "zdjęcie lokalu" && item.label.includes("Wizualizacja")) {
                throw new Error(`zdjęcie oznaczone jako wizualizacja: ${code}`);
            }
        }
        if (property.price !== price || property.status !== status) throw new Error(`zmieniono cenę albo status ${code}`);
    }
    return { photos, plans, visualizations };
}

export function patchOfferMedia({ indexPath, detailsPath, manifest, outDir }) {
    let js = readFileSync(indexPath, "utf8");
    const marker = "window.__DOMIZ_PREVIEW_PROPS=";
    const at = js.indexOf(marker);
    if (at < 0) throw new Error("brak listy 30");
    const start = at + marker.length;
    let depth = 0;
    let end = start;
    let inString = false;
    let escaped = false;
    for (; end < js.length; end += 1) {
        const char = js[end];
        if (inString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === "\"") inString = false;
            continue;
        }
        if (char === "\"") inString = true;
        else if (char === "[") depth += 1;
        else if (char === "]") {
            depth -= 1;
            if (depth === 0) {
                end += 1;
                break;
            }
        }
    }
    const properties = JSON.parse(js.slice(start, end));
    const counts = applyMedia(properties, manifest.oferty);
    if (counts.photos !== 17 || counts.plans !== 12 || counts.visualizations !== 3) {
        throw new Error(`liczby ${counts.photos}/${counts.plans}/${counts.visualizations}`);
    }
    js = js.slice(0, start) + JSON.stringify(properties) + js.slice(end);

    js = once(
        js,
        'c.jsx("img",{src:E,alt:w,className:"card-image",loading:"lazy",style:{objectPosition:"center center"},onError:H=>{if(!s.review)H.currentTarget.src=Jm}})',
        'c.jsx("img",{src:E,alt:s.review&&s.review.imageAlt||w,className:"card-image",loading:"lazy",style:{objectPosition:"center center",objectFit:s.review&&s.review.imageFit==="contain"?"contain":void 0,background:s.review&&s.review.imageFit==="contain"?"#f4f1ec":void 0},onError:H=>{if(!s.review)H.currentTarget.src=Jm}})',
        "karta obrazu",
    );
    js = once(
        js,
        'children:b("common.featured")})]})]}),c.jsxs("div",{className:"card-content"',
        'children:b("common.featured")})]}),s.review&&s.review.imageLabel?c.jsx("div",{style:{position:"absolute",left:"1rem",bottom:"1rem",zIndex:2,background:"rgba(28,25,21,.9)",color:"#f7f4ef",padding:"0.35rem 0.7rem",borderRadius:"999px",fontSize:"0.75rem",fontWeight:650},children:s.review.imageLabel}):null]}),c.jsxs("div",{className:"card-content"',
        "etykieta karty",
    );
    js = once(
        js,
        'B.useEffect(()=>{document.querySelectorAll(".hero-slide-video").forEach(node=>{node.muted=!0;node.defaultMuted=!0;const active=node.closest(".hero-slide")?.classList.contains("active");if(!active||heroPaused){node.pause();return;}const attempt=node.play?.();attempt&&attempt.catch&&attempt.catch(()=>setHeroPaused(!0))})},[heroPaused,_,allowVideo]);',
        'B.useEffect(()=>{const arm=node=>{node.muted=!0;node.defaultMuted=!0;node.playsInline=!0;if(node.readyState<1){node.addEventListener("loadedmetadata",()=>arm(node),{once:!0});return}if(!node.dataset.domizFromZero){node.dataset.domizFromZero="1";if(node.currentTime>0.05)node.currentTime=0}const attempt=node.play?.();attempt&&attempt.catch&&attempt.catch(()=>setHeroPaused(!0))};document.querySelectorAll(".hero-slide-video").forEach(node=>{const active=node.closest(".hero-slide")?.classList.contains("active");if(!active||heroPaused){node.pause();return}arm(node)})},[heroPaused,_,allowVideo]);B.useEffect(()=>{const onShow=ev=>{if(!ev.persisted)return;document.querySelectorAll(".hero-slide-video").forEach(node=>{node.muted=!0;node.defaultMuted=!0;delete node.dataset.domizFromZero;try{node.currentTime=0}catch(e){}})};window.addEventListener("pageshow",onShow);return()=>window.removeEventListener("pageshow",onShow)},[]);',
        "start filmu od zera",
    );
    js = once(
        js,
        'muted:!0,defaultMuted:!0,autoPlay:play,loop:!0,playsInline:!0,preload:"metadata",ref:H=>{if(H){H.muted=!0;H.defaultMuted=!0;}}',
        'muted:!0,defaultMuted:!0,autoPlay:!1,loop:!0,playsInline:!0,preload:"metadata",ref:H=>{if(H){H.muted=!0;H.defaultMuted=!0;H.playsInline=!0;}}',
        "muted przed play",
    );

    let details = readFileSync(detailsPath, "utf8");
    details = once(
        details,
        'e.jsx("img",{src:k[g]||t.image,alt:a,style:{width:"100%",height:"100%",objectFit:"cover"}})',
        'e.jsx("img",{src:k[g]||t.image,alt:t.review&&t.review.imageAlt||a,style:{width:"100%",height:"100%",objectFit:t.review&&t.review.imageFit==="contain"?"contain":"cover",background:t.review&&t.review.imageFit==="contain"?"#f4f1ec":"transparent"}})',
        "detal obrazu",
    );
    details = once(
        details,
        ':"transparent"}}),e.jsx("div",{style:{position:"absolute",top:"1rem",left:"1rem",display:"flex",gap:"0.5rem"},children:e.jsx("span",{style:{background:t.review?"#222222"',
        ':"transparent"}}),t.review&&t.review.imageLabel?e.jsx("div",{style:{position:"absolute",left:"1rem",bottom:"1rem",zIndex:2,background:"rgba(28,25,21,.9)",color:"#f7f4ef",padding:"0.4rem 0.75rem",borderRadius:"999px",fontSize:"0.85rem",fontWeight:650},children:t.review.imageLabel}):null,e.jsx("div",{style:{position:"absolute",top:"1rem",left:"1rem",display:"flex",gap:"0.5rem"},children:e.jsx("span",{style:{background:t.review?"#222222"',
        "etykieta detalu",
    );

    if (!js.includes('path:"/admin"') || !js.includes('path:"/osiedle-tluszcz"') || !js.includes("domiz-hero-silent.mp4")) {
        throw new Error("łatka ruszyła trasy albo film");
    }
    if (/[^&]&e\.jsx/.test(js) || /[^&]&e\.jsx/.test(details)) throw new Error("bitowe &");
    mkdirSync(resolve(outDir, "assets"), { recursive: true });
    writeFileSync(resolve(outDir, "assets/index-DvzcJoKV.js"), js);
    writeFileSync(resolve(outDir, "assets/PropertyDetails-DkJEYQxI.js"), details);
    return counts;
}

export function copyMedia(zipPath, outDir) {
    const mediaDir = resolve(outDir, "oferty-media");
    mkdirSync(mediaDir, { recursive: true });
    execFileSync("unzip", ["-o", "-j", zipPath, "assets/*", "-d", mediaDir], { stdio: "pipe" });
}

export function sha256(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}

if (process.argv[1] && process.argv[1].endsWith("patch-offer-media.mjs")) {
    const [indexPath, detailsPath, manifestPath, zipPath, outDir] = process.argv.slice(2);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    console.log(patchOfferMedia({ indexPath, detailsPath, manifest, outDir }));
    if (zipPath) copyMedia(zipPath, outDir);
}
