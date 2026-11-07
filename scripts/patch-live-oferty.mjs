import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gardenStudioProperties } from '../src/data/gardenOffers.js';

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    }
    return source.replace(from, () => to);
}

export function patchLiveOffers({ liveDir, outDir }) {
    const studios = gardenStudioProperties();
    if (studios.length !== 30) throw new Error(`oczekiwano 30 kart, jest ${studios.length}`);
    const props = JSON.stringify(studios);

    let index = readFileSync(resolve(liveDir, 'index-DvzcJoKV.js'), 'utf8');
    index = once(
        index,
        'E=s.image.toLowerCase().includes(".png")?Jm:s.image',
        'E=s.review?s.image:s.image.toLowerCase().includes(".png")?Jm:s.image',
        'obraz karty',
    );
    index = once(
        index,
        'onError:H=>{H.currentTarget.src=Jm}',
        'onError:H=>{if(!s.review)H.currentTarget.src=Jm}',
        'fallback zdjęcia',
    );
    index = once(
        index,
        'children:s.status==="zarezerwowane"?b("common.reserved"):s.status==="sprzedaz"?b("common.forSale"):b("common.forRent")',
        'children:s.review?(A==="en"?"External listing":"Ogłoszenie zewnętrzne"):s.status==="zarezerwowane"?b("common.reserved"):s.status==="sprzedaz"?b("common.forSale"):b("common.forRent")',
        'plakietka karty',
    );
    index = once(
        index,
        'c.jsx("span",{style:{color:"var(--color-primary)",fontWeight:"700",fontSize:"1rem",whiteSpace:"nowrap"},children:_})',
        'c.jsxs("span",{style:{color:"var(--color-primary)",fontWeight:"700",fontSize:"1rem",whiteSpace:"nowrap",textAlign:"right"},children:s.review?[_,c.jsx("span",{style:{display:"block",color:"var(--color-text-muted)",fontWeight:"500",fontSize:"0.75rem"},children:A==="en"?"apartment price":"cena lokalu"})]:_})',
        'cena lokalu',
    );
    index = once(
        index,
        'c.jsxs("div",{style:{borderLeft:"1px solid var(--color-border)"},children:[c.jsx(ap,{size:18}),c.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"500",color:"var(--color-text-muted)"},children:s.baths})]})',
        's.baths!=null&&c.jsxs("div",{style:{borderLeft:"1px solid var(--color-border)"},children:[c.jsx(ap,{size:18}),c.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"500",color:"var(--color-text-muted)"},children:s.baths})]})',
        'łazienki karty',
    );
    index = once(
        index,
        's.sourceUrl&&/yit\\.pl/.test(s.sourceUrl)&&c.jsxs("p",{className:"developer-offer-note"',
        's.review&&c.jsxs("p",{className:"developer-offer-note",style:{fontSize:"0.78rem",color:"var(--color-text-muted)",margin:"0 0 0.75rem",lineHeight:1.45},children:[s.review.availability==="do_potwierdzenia"?(A==="en"?"Availability to be confirmed. ":"Dostępność do potwierdzenia. "):(A==="en"?"Active in the source record; seller not confirmed. ":"Aktywne według zapisu źródła; sprzedający nie potwierdził. "),c.jsx("a",{href:s.review.sourceUrl,target:"_blank",rel:"noopener noreferrer nofollow",onClick:H=>H.stopPropagation(),style:{color:"var(--color-primary)",textDecoration:"underline"},children:A==="en"?"Source":"Źródło"})]}),s.sourceUrl&&/yit\\.pl/.test(s.sourceUrl)&&c.jsxs("p",{className:"developer-offer-note"',
        'notka źródła',
    );
    index = once(
        index,
        '{key:"nav.smartHome",path:"/smart-home"},{key:"nav.aboutTluszcz",path:"/o-tluszczu"}]',
        '{key:"nav.smartHome",path:"/smart-home"},{key:"nav.gardenStudios",path:"/kawalerki-z-ogrodkiem"},{key:"nav.aboutTluszcz",path:"/o-tluszczu"}]',
        'pozycja menu',
    );
    index = once(
        index,
        '"nav.smartHome":"Smart Home","nav.modular":"Domy modułowe"',
        '"nav.smartHome":"Smart Home","nav.gardenStudios":"Kawalerki z ogródkiem","nav.modular":"Domy modułowe"',
        'etykieta PL',
    );
    index = once(
        index,
        '"nav.smartHome":"Smart Home","nav.modular":"Modular Homes"',
        '"nav.smartHome":"Smart Home","nav.gardenStudios":"Studios with a garden","nav.modular":"Modular Homes"',
        'etykieta EN',
    );
    index = once(
        index,
        'c.jsx(Ne,{path:"/oferty",element:c.jsx(Bv,{})})',
        'c.jsx(Ne,{path:"/oferty",element:c.jsx(Bv,{})}),c.jsx(Ne,{path:"/kawalerki-z-ogrodkiem",element:c.jsx(()=>{window.location.replace("/oferty?katalog=kawalerki");return null},{})}),c.jsx(Ne,{path:"/kawalerki-z-ogrodkiem/",element:c.jsx(()=>{window.location.replace("/oferty?katalog=kawalerki");return null},{})})',
        'trasa przekierowania',
    );
    index = once(
        index,
        'Bp.createRoot(document.getElementById("root"))',
        `window.__DOMIZ_PREVIEW_PROPS=${props};Bp.createRoot(document.getElementById("root"))`,
        'dane 30 kart',
    );

    let properties = readFileSync(resolve(liveDir, 'Properties-DEjQCnEQ.js'), 'utf8');
    properties = once(
        properties,
        'o[1]<2e6&&o[1]>0&&i.set("maxPrice",String(o[1]));const f=i.toString()',
        'o[1]<2e6&&o[1]>0&&i.set("maxPrice",String(o[1]));const keptCity=d.get("miasto"),keptCatalog=d.get("katalog");keptCity&&keptCity!=="wszystkie"&&i.set("miasto",keptCity),keptCatalog&&i.set("katalog",keptCatalog);const f=i.toString()',
        'parametry adresu',
    );
    properties = once(
        properties,
        'B=s.price>=o[0]&&s.price<=o[1];return f&&k&&R&&B',
        'B=s.price>=o[0]&&s.price<=o[1],city=d.get("miasto"),catalog=d.get("katalog"),cityOk=!city||city==="wszystkie"||s.review&&s.review.city===city||String(s.location||"").toLowerCase().includes(String(city).toLowerCase()),catalogOk=catalog!=="kawalerki"||!!s.review;return f&&k&&R&&B&&cityOk&&catalogOk',
        'filtr miasta',
    );
    properties = once(
        properties,
        'e.jsx("section",{style:{padding:"2rem 0 4rem"},children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"properties-results-header"',
        'e.jsx("section",{style:{padding:"2rem 0 4rem"},children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{style:{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"1rem"},children:["wszystkie","Warszawa","Katowice"].map(city=>e.jsx("button",{type:"button",onClick:()=>{const params=new URLSearchParams(d);city==="wszystkie"?params.delete("miasto"):params.set("miasto",city);w(params,{replace:!0})},style:{padding:"0.5rem 0.9rem",borderRadius:"999px",border:"1px solid var(--color-border)",background:(d.get("miasto")||"wszystkie")===city?"var(--color-text-main)":"white",color:(d.get("miasto")||"wszystkie")===city?"white":"var(--color-text-main)",cursor:"pointer",fontWeight:600,fontSize:"0.875rem"},children:city==="wszystkie"?(S==="en"?"All cities":"Wszystkie miasta"):city},city))}),d.get("katalog")==="kawalerki"&&e.jsxs("div",{className:"glass-panel",style:{padding:"1rem 1.25rem",marginBottom:"1rem"},children:[e.jsx("p",{style:{margin:"0 0 0.75rem",color:"var(--color-text-secondary)",lineHeight:1.5},children:S==="en"?"The same listing cards, limited to 30 garden studios from outside the agency. Domiz is not their seller. The price is the apartment price.":"Te same karty ofert, zawężone do 30 kawalerek z ogrodem spoza biura. Domiz nie jest ich sprzedającym. Cena to cena lokalu, parking osobno albo nieustalony."}),e.jsx("button",{type:"button",className:"btn-secondary",onClick:()=>{const params=new URLSearchParams(d);params.delete("katalog");w(params,{replace:!0})},children:S==="en"?"Show agency listings too":"Pokaż też oferty biura"})]}),e.jsxs("div",{className:"properties-results-header"',
        'przełącznik miast',
    );

    let details = readFileSync(resolve(liveDir, 'PropertyDetails-DkJEYQxI.js'), 'utf8');
    details = once(
        details,
        'e.jsx("img",{src:le,alt:t.agent.name,style:{width:"70px",height:"70px",borderRadius:"50%",objectFit:"cover",border:"2px solid white",boxShadow:"var(--shadow-sm)"}})',
        '!t.review&&e.jsx("img",{src:le,alt:t.agent.name,style:{width:"70px",height:"70px",borderRadius:"50%",objectFit:"cover",border:"2px solid white",boxShadow:"var(--shadow-sm)"}})',
        'portret agenta',
    );
    details = once(
        details,
        't.status==="zarezerwowane"?"#b45309":t.status==="sprzedaz"?"#10b981":"#3b82f6",color:"white",padding:"0.5rem 1rem",borderRadius:"9999px",fontSize:"0.875rem",fontWeight:"600",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"},children:t.status==="zarezerwowane"?r("common.reserved"):t.status==="sprzedaz"?r("common.forSale"):r("common.forRent")',
        't.review?"#222222":t.status==="zarezerwowane"?"#b45309":t.status==="sprzedaz"?"#10b981":"#3b82f6",color:"white",padding:"0.5rem 1rem",borderRadius:"9999px",fontSize:"0.875rem",fontWeight:"600",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"},children:t.review?(p==="en"?"External listing":"Ogłoszenie zewnętrzne"):t.status==="zarezerwowane"?r("common.reserved"):t.status==="sprzedaz"?r("common.forSale"):r("common.forRent")',
        'plakietka szczegółów',
    );
    details = once(
        details,
        'e.jsxs("div",{className:"glass-panel",style:{padding:"1.5rem",marginTop:"1.5rem",background:"linear-gradient(to bottom right, #ffffff, #f0fdf4)"',
        '!t.review&&e.jsxs("div",{className:"glass-panel",style:{padding:"1.5rem",marginTop:"1.5rem",background:"linear-gradient(to bottom right, #ffffff, #f0fdf4)"',
        'panel współpracy',
    );
    details = once(
        details,
        'children:t.agent.name',
        'children:t.review?(p==="en"?"External listing":"Ogłoszenie zewnętrzne"):t.agent.name',
        'nazwa sprzedającego',
    );
    details = once(
        details,
        'children:r("property.agentRole")',
        'children:t.review?(p==="en"?"Not a Domiz listing. The seller has not confirmed availability.":"To nie jest oferta Domiz. Sprzedający nie potwierdził dostępności."):r("property.agentRole")',
        'rola agenta',
    );
    details = once(
        details,
        'e.jsx("button",{type:"button",className:"btn-primary",style:{width:"100%",justifyContent:"center"},onClick:me,children:r("property.bookViewing")})',
        't.review?e.jsxs("div",{children:[e.jsx("p",{style:{margin:"0 0 0.75rem",color:"var(--color-text-secondary)",fontSize:"0.95rem",lineHeight:1.5},children:(p==="en"?"Parking: ":"Parking: ")+(t.review.parking||(p==="en"?"not set":"nieustalone"))}),e.jsx("p",{style:{margin:"0 0 1rem",color:"var(--color-text-secondary)",fontSize:"0.95rem"},children:(p==="en"?"Garden: ":"Ogród: ")+t.review.gardenLabel}),e.jsx("a",{href:t.review.sourceUrl,target:"_blank",rel:"noopener noreferrer nofollow",className:"btn-primary",style:{width:"100%",justifyContent:"center",textDecoration:"none"},children:p==="en"?"Open source":"Otwórz źródło"})]}):e.jsx("button",{type:"button",className:"btn-primary",style:{width:"100%",justifyContent:"center"},onClick:me,children:r("property.bookViewing")})',
        'przycisk źródła',
    );
    details = once(
        details,
        'e.jsxs("button",{type:"button",className:"btn-secondary",style:{justifyContent:"center",background:"transparent",border:"1px solid var(--color-border)"},onClick:()=>{b("lead_contact_click",{type:"form",source:"property_details_sidebar",property_id:t.id}),x("/osiedle-tluszcz#kontakt")},children:[e.jsx(K,{size:18})," ",r("property.contactForm")]})',
        '!t.review&&e.jsxs("button",{type:"button",className:"btn-secondary",style:{justifyContent:"center",background:"transparent",border:"1px solid var(--color-border)"},onClick:()=>{b("lead_contact_click",{type:"form",source:"property_details_sidebar",property_id:t.id}),x("/osiedle-tluszcz#kontakt")},children:[e.jsx(K,{size:18})," ",r("property.contactForm")]})',
        'formularz biura',
    );
    details = once(
        details,
        'e.jsxs("div",{className:"mobile-sticky-cta",children:[$&&e.jsxs("a",{href:`tel:${$}`,className:"cta-button primary",onClick:()=>{b("lead_contact_click",{type:"phone",source:"property_details_mobile_sticky",property_id:t.id})},children:[e.jsx(G,{size:18})," Zadzwoń"]}),e.jsxs("button",{className:"cta-button secondary",onClick:()=>{b("lead_contact_click",{type:"form",source:"property_details_mobile_sticky",property_id:t.id}),x("/osiedle-tluszcz#kontakt")},children:[e.jsx(K,{size:18})," Formularz kontaktowy"]})]})',
        'e.jsxs("div",{className:"mobile-sticky-cta",children:t.review?[e.jsx("a",{href:t.review.sourceUrl,target:"_blank",rel:"noopener noreferrer nofollow",className:"cta-button primary",style:{textDecoration:"none"},children:p==="en"?"Open source":"Otwórz źródło"})]:[$&&e.jsxs("a",{href:`tel:${$}`,className:"cta-button primary",onClick:()=>{b("lead_contact_click",{type:"phone",source:"property_details_mobile_sticky",property_id:t.id})},children:[e.jsx(G,{size:18})," Zadzwoń"]}),e.jsxs("button",{className:"cta-button secondary",onClick:()=>{b("lead_contact_click",{type:"form",source:"property_details_mobile_sticky",property_id:t.id}),x("/osiedle-tluszcz#kontakt")},children:[e.jsx(K,{size:18})," Formularz kontaktowy"]})]})',
        'pasek mobilny',
    );
    details = once(
        details,
        'e.jsxs("div",{style:{textAlign:"center",borderLeft:"1px solid #e5e7eb"},children:[e.jsx(Be,{size:28,color:"#10b981",style:{margin:"0 auto 0.5rem"}}),e.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:r("property.bathrooms")}),e.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"bold"},children:t.baths})]})',
        't.baths!=null&&e.jsxs("div",{style:{textAlign:"center",borderLeft:"1px solid #e5e7eb"},children:[e.jsx(Be,{size:28,color:"#10b981",style:{margin:"0 auto 0.5rem"}}),e.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:r("property.bathrooms")}),e.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"bold"},children:t.baths})]})',
        'łazienki szczegółów',
    );
    if (/[^&]&e\.jsx/.test(details)) {
        throw new Error('pasek mobilny ma bitowe & między elementami Reacta');
    }

    mkdirSync(resolve(outDir, 'assets'), { recursive: true });
    mkdirSync(resolve(outDir, 'kawalerki-z-ogrodkiem'), { recursive: true });
    mkdirSync(resolve(outDir, 'configurator'), { recursive: true });
    writeFileSync(resolve(outDir, 'assets/index-DvzcJoKV.js'), index);
    writeFileSync(resolve(outDir, 'assets/Properties-DEjQCnEQ.js'), properties);
    writeFileSync(resolve(outDir, 'assets/PropertyDetails-DkJEYQxI.js'), details);
    copyFileSync(resolve('public/kawalerki-z-ogrodkiem/index.html'), resolve(outDir, 'kawalerki-z-ogrodkiem/index.html'));
    copyFileSync(resolve('public/configurator/placeholder.svg'), resolve(outDir, 'configurator/placeholder.svg'));
    return { studios: studios.length, outDir };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const liveDir = process.argv[2];
    const outDir = process.argv[3];
    if (!liveDir || !outDir) {
        console.error('użycie: node scripts/patch-live-oferty.mjs <katalog-plików-live> <katalog-wyjściowy>');
        process.exit(1);
    }
    const result = patchLiveOffers({ liveDir, outDir });
    console.log(`zapisano ${result.studios} kart do ${result.outDir}`);
}
