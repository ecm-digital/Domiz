import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

const H1 = "Kawalerka z ogródkiem w Warszawie. Dom w powiecie wołomińskim.";
const LEAD = "Domiz Homes skupia się na małych mieszkaniach z ogrodem i domach z trzema sypialniami. Sprawdź nieruchomości obsługiwane przez Domiz lub osobny przegląd rynku. Chcesz sprzedać? Porozmawiajmy o Twojej nieruchomości.";
const SASANKA = "Sasanka XL w Tłuszczu: dom około 83 m², trzy sypialnie. Poznaj układ i szczegóły konkretnego domu.";
const MARKET = "Porównaj kawalerki z zewnętrznych ogłoszeń. To przegląd rynku, nie portfolio Domiz. Dostępność potwierdza ogłoszeniodawca.";
const TITLE = "Kawalerka z ogródkiem w Warszawie i dom w powiecie wołomińskim | Domiz Homes";
const META = "Domiz Homes skupia się na małych mieszkaniach z ogrodem w Warszawie i domach z trzema sypialniami w powiecie wołomińskim.";

export function patchHomeStage1({ indexPath, htmlPath, cssPath, outDir }) {
    let js = readFileSync(indexPath, "utf8");
    js = once(
        js,
        '[heroPaused,setHeroPaused]=B.useState(()=>window.matchMedia("(max-width: 767px)").matches||window.matchMedia("(prefers-reduced-motion: reduce)").matches||!!(navigator.connection&&navigator.connection.saveData))',
        '[heroPaused,setHeroPaused]=B.useState(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches||!!(navigator.connection&&navigator.connection.saveData))',
        "start pauzy",
    );
    js = once(
        js,
        'const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches,narrow=window.matchMedia("(max-width: 767px)").matches,save=!!(navigator.connection&&navigator.connection.saveData);const allow=!(reduce||narrow||save);setAllowVideo(allow);setAllowAdvance(!reduce);if(!allow)setHeroPaused(!0)',
        'const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches,save=!!(navigator.connection&&navigator.connection.saveData);const allow=!(reduce||save);setAllowVideo(allow);setAllowAdvance(!1);if(reduce||save)setHeroPaused(!0)',
        "autoplay na wąskim ekranie",
    );
    js = once(
        js,
        'c.jsx("h1",{className:"hero-title text-white home-2027-title",children:"Miejsce na decyzję."})',
        `c.jsx("h1",{className:"hero-title text-white home-2027-title",children:${JSON.stringify(H1)}})`,
        "H1",
    );
    js = once(
        js,
        'c.jsx("p",{className:"hero-subtitle text-white-muted",children:z==="en"?"Garden studios and homes near Warsaw. The apartment price is separate from parking. External listings are marked and are not Domiz listings.":"Kawalerki z ogrodem i domy pod Warszawą. Cena lokalu jest osobno od parkingu. Ogłoszenia zewnętrzne są oznaczone i nie są ofertą biura."})',
        `c.jsx("p",{className:"hero-subtitle text-white-muted",children:${JSON.stringify(LEAD)}})`,
        "podtytuł",
    );
    js = once(
        js,
        'c.jsxs("div",{className:"hero-actions",children:[c.jsx("a",{href:"/oferty?katalog=kawalerki",className:"btn-primary hero-btn-primary",style:{textDecoration:"none"},onClick:()=>Qe("hero_cta_click",{cta:"garden_studios"}),children:"Kawalerki z ogródkiem"}),c.jsx("a",{href:"/osiedle-tluszcz",className:"btn-secondary-white hero-btn-secondary",style:{textDecoration:"none"},onClick:()=>Qe("hero_cta_click",{cta:"homes_near_warsaw"}),children:"Domy pod Warszawą"}),c.jsx("a",{href:"/dodaj-nieruchomosc",className:"btn-secondary-white hero-btn-secondary",style:{textDecoration:"none"},onClick:()=>Qe("hero_cta_click",{cta:"sell_property"}),children:d("hero.sell")})]})',
        'c.jsxs("div",{className:"hero-actions",children:[c.jsx("a",{href:"/dodaj-nieruchomosc",className:"btn-primary hero-btn-primary",style:{textDecoration:"none"},children:"Chcę sprzedać"}),c.jsx("a",{href:"#wybor-nieruchomosci",className:"btn-secondary-white hero-btn-secondary",style:{textDecoration:"none"},children:"Szukam nieruchomości"})]})',
        "CTA hero",
    );
    const localStart = js.indexOf('c.jsx("section",{className:"home-section local-info-section"');
    const featuresStart = js.indexOf('c.jsx(Kp,{}),c.jsxs("section",{className:"home-section home-features"');
    if (localStart < 0 || featuresStart < localStart) throw new Error("nie znaleziono sekcji strony głównej");
    const choice = [
        'c.jsx("section",{id:"wybor-nieruchomosci",className:"home-section local-info-section",style:{background:"var(--color-bg-light)"},children:c.jsxs("div",{className:"container",children:[c.jsx("h2",{children:"Szukam nieruchomości"}),c.jsx("p",{className:"home-section-desc",children:"Dwie kategorie, nie dwie przypadkowe karty lokali."}),c.jsxs("div",{className:"features-bento",children:[c.jsxs("a",{href:"/oferty?katalog=kawalerki&miasto=Warszawa",className:"feature-card-bento home-choice-card",children:[c.jsx("h3",{children:"Kawalerki z ogródkiem — Warszawa"}),c.jsx("p",{children:"Osobny przegląd kawalerek z ogrodem. Warszawa jest ustawiona od razu."})]}),c.jsxs("a",{href:"/osiedle-tluszcz",className:"feature-card-bento home-choice-card",children:[c.jsx("h3",{children:"Domy z trzema sypialniami — powiat wołomiński"}),c.jsx("p",{children:"Projekt obsługiwany przez Domiz: Sasanka XL w Tłuszczu."})]})]})]})}),',
        `c.jsx("section",{id:"sasanka",className:"home-section home-properties",children:c.jsxs("div",{className:"container",style:{maxWidth:"760px"},children:[c.jsx("span",{className:"section-label",children:"Oferty obsługiwane przez Domiz"}),c.jsx("h2",{style:{marginTop:"0.5rem"},children:${JSON.stringify(SASANKA)}}),c.jsx("p",{children:"Na dziś jest to jeden konkretny dom. Szczegóły układu są na stronie projektu."}),c.jsx("a",{className:"btn-primary",href:"/osiedle-tluszcz",style:{textDecoration:"none",display:"inline-flex",marginTop:"1rem"},children:"Zobacz Sasankę"})]})}),`,
        `c.jsx("section",{id:"przeglad-rynku",className:"home-section",children:c.jsxs("div",{className:"container",style:{maxWidth:"760px"},children:[c.jsx("h2",{children:"Przegląd rynku"}),c.jsx("p",{children:${JSON.stringify(MARKET)}}),c.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem",marginTop:"1rem"},children:[c.jsx("a",{className:"btn-primary",href:"/oferty?katalog=kawalerki&miasto=Warszawa",style:{textDecoration:"none"},children:"Porównaj kawalerki"}),c.jsx("a",{className:"btn-secondary",href:"/oferty?katalog=kawalerki&miasto=Katowice",style:{textDecoration:"none"},children:"Katowice"})]})]})}),`,
    ].join("");
    js = js.slice(0, localStart) + choice + js.slice(featuresStart);
    js = once(
        js,
        'c.jsx("span",{className:"section-label",children:f("home.whyLabel")}),c.jsxs("h2",{children:[f("home.whyTitlePrefix")," ",c.jsx("span",{className:"text-gradient",children:"Domiz Homes"}),"?"]}),c.jsx("p",{className:"home-section-desc",children:f("home.whyDesc")})',
        'c.jsx("h2",{children:"Co warto sprawdzić przed wyborem"}),c.jsx("p",{className:"home-section-desc",children:"Mieszkanie: prawo do ogródka, prywatność i koszt parkingu. Dom: układ sypialni, media i dojazd. Brak potwierdzonych danych oznaczamy wprost."})',
        "checklista",
    );
    js = once(
        js,
        '"home.feature1Title":"Premium Standard","home.feature1Desc":"Tylko zweryfikowane i sprawdzone nieruchomości w najlepszych lokalizacjach.","home.feature2Title":"Bezpieczna Transakcja","home.feature2Desc":"Jasne zasady i weryfikacja dokumentów na każdym etapie zakupu i sprzedaży.","home.feature3Title":"Oszczędność Czasu","home.feature3Desc":"Dopasujemy oferty idealnie do Twoich potrzeb i możliwości."',
        '"home.feature1Title":"Mieszkanie","home.feature1Desc":"Prawo do ogródka, prywatność i koszt parkingu.","home.feature2Title":"Dom","home.feature2Desc":"Układ sypialni, media i dojazd.","home.feature3Title":"Źródło","home.feature3Desc":"Przy ogłoszeniu zewnętrznym dostępność potwierdza ogłoszeniodawca."',
        "checklista pl",
    );
    js = once(
        js,
        '"home.feature1Title":"Premium Standard","home.feature1Desc":"Only verified and carefully checked properties in top locations.","home.feature2Title":"Secure Transaction","home.feature2Desc":"Clear terms and document checks at every stage of buying and selling.","home.feature3Title":"Save Time","home.feature3Desc":"We match listings precisely to your needs and budget."',
        '"home.feature1Title":"Apartment","home.feature1Desc":"The right to the garden, privacy and the cost of parking.","home.feature2Title":"House","home.feature2Desc":"Bedroom layout, utilities and access.","home.feature3Title":"Source","home.feature3Desc":"For an external listing, the advertiser confirms availability."',
        "checklista en",
    );
    js = once(
        js,
        'c.jsx("span",{className:"section-label",children:f("home.processLabel")}),c.jsxs("h2",{children:[f("home.processTitlePrefix")," ",c.jsx("span",{className:"text-gradient",children:f("home.processTitleHighlight")}),"?"]})',
        'c.jsx("h2",{children:"Dla sprzedających"}),c.jsx("p",{className:"home-section-desc",children:"Masz kawalerkę z ogródkiem lub niewielki dom w powiecie wołomińskim? Opisz nieruchomość i porozmawiajmy o możliwej współpracy."})',
        "sprzedający",
    );
    js = once(
        js,
        '"home.step1Title":"Kontakt","home.step1Desc":"Opowiedz nam o swoich potrzebach - umówimy bezpłatną konsultację.","home.step2Title":"Wycena i oferty","home.step2Desc":"Przygotujemy wycenę nieruchomości lub dobierzemy oferty pod Twoje kryteria.","home.step3Title":"Wizyta i negocjacje","home.step3Desc":"Zorganizujemy zwiedzanie obiektów i poprowadzimy negocjacje.","home.step4Title":"Umowa i odbiór","home.step4Desc":"Zapewnimy opiekę prawną, podpisanie umowy i przekazanie kluczy."',
        '"home.step1Title":"Zgłoszenie","home.step1Desc":"Opisz nieruchomość. Nie obiecyjemy przyjęcia każdej oferty.","home.step2Title":"Rozmowa","home.step2Desc":"Porozmawiamy o możliwej współpracy, bez obietnicy sprzedaży w określonym czasie.","home.step3Title":"Dane","home.step3Desc":"Podaj lokalizację oraz to, co wiesz o ogrodzie, parkingu, mediach i dojeździe.","home.step4Title":"Dalej","home.step4Desc":"Następny krok to kontakt. Nie podajemy wyceny z góry."',
        "kroki pl",
    );
    js = once(
        js,
        '"home.step1Title":"Contact","home.step1Desc":"Tell us what you need - we will arrange a free consultation.","home.step2Title":"Valuation and offers","home.step2Desc":"We prepare a property valuation or select listings that match your criteria.","home.step3Title":"Viewing and negotiation","home.step3Desc":"We organize viewings and lead the negotiation process.","home.step4Title":"Contract and handover","home.step4Desc":"We provide legal support, contract signing and key handover."',
        '"home.step1Title":"Enquiry","home.step1Desc":"Describe the property. We do not promise to take every instruction.","home.step2Title":"Conversation","home.step2Desc":"We can talk about possible cooperation, without promising a sale by a date.","home.step3Title":"Facts","home.step3Desc":"Share the location and what you know about the garden, parking, utilities and access.","home.step4Title":"Next","home.step4Desc":"The next step is contact. We do not quote a valuation in advance."',
        "kroki en",
    );
    js = once(js, '"home.ctaTitle":"Gotowy na zmianę adresu?"', '"home.ctaTitle":"Kontakt"', "cta tytuł pl");
    js = once(js, '"home.ctaTitle":"Ready for a new address?"', '"home.ctaTitle":"Contact"', "cta tytuł en");
    js = once(js, '"home.ctaDesc":"Szukasz nieruchomości na Śląsku, Mazowszu lub w Dubaju? Pomożemy Ci znaleźć właściwą ofertę."', '"home.ctaDesc":"Napisz, czy chcesz sprzedać, czy szukasz nieruchomości. Dodaj lokalizację i najważniejsze oczekiwania."', "cta opis pl");
    js = once(js, '"home.ctaDesc":"Looking in Silesia, Mazovia or Dubai? We will help you find the right property."', '"home.ctaDesc":"Write whether you want to sell or you are looking. Add the location and what matters most."', "cta opis en");
    js = once(js, '"home.trust1":"Bezpłatna wycena"', '"home.trust1":"+48 535 330 323"', "telefon pl");
    js = once(js, '"home.trust1":"Free valuation"', '"home.trust1":"+48 535 330 323"', "telefon en");
    js = once(js, '"home.trust2":"Doradztwo na każdym etapie"', '"home.trust2":"hello@domizhomes.com"', "mail pl");
    js = once(js, '"home.trust3":"Obsługa prawna"', '"home.trust3":"Bez obietnicy czasu odpowiedzi"', "czas pl");
    js = once(
        js,
        'c.jsx("a",{className:"btn-primary",href:"mailto:hello@domizhomes.com",children:b?"Book a consultation":"Umów konsultację"}),c.jsx("button",{className:"btn-secondary",onClick:()=>s("/oferty"),children:b?"View listings":"Zobacz oferty"})',
        'c.jsx("a",{className:"btn-primary",href:"/dodaj-nieruchomosc",style:{textDecoration:"none"},children:"Porozmawiajmy o sprzedaży"}),c.jsx("a",{className:"btn-secondary",href:"#wybor-nieruchomosci",style:{textDecoration:"none"},children:"Szukam nieruchomości"})',
        "dolny kontakt",
    );
    js = once(
        js,
        'c.jsx("h2",{children:b?"Our agent":"Nasi agenci"}),c.jsx("p",{children:b?"Meet the person who will guide you smoothly through buying or selling a property.":"Poznaj osoby, które pomogą Ci sprawnie przejść przez zakup lub sprzedaż nieruchomości."})',
        'c.jsx("h2",{children:"Kontakt w Domiz"}),c.jsx("p",{children:"Tomasz Gnat. Napisz, czy chcesz sprzedać, czy szukasz nieruchomości."})',
        "kontakt osoby",
    );
    js = once(
        js,
        "Oferty nieruchomości ze Śląska, Mazowsza i Dubaju. Wspieramy klientów w zakupie, sprzedaży i finansowaniu.",
        "Kawalerki z ogródkiem w Warszawie i domy z trzema sypialniami w powiecie wołomińskim.",
        "stopka",
    );
    js = once(
        js,
        'title:"Nieruchomości Śląsk, Mazowsze i Dubaj | Domiz Homes",description:"Domy i mieszkania na Śląsku, Mazowszu oraz wybrane inwestycje w Dubaju. Sprawdź aktualne oferty i skorzystaj ze wsparcia Domiz Homes przy zakupie lub sprzedaży."',
        `title:${JSON.stringify(TITLE)},description:${JSON.stringify(META)}`,
        "domyślny tytuł",
    );
    js = once(
        js,
        '"hero.titleTop":"Nieruchomości na Śląsku, Mazowszu i w Dubaju"',
        `"hero.titleTop":${JSON.stringify(H1)}`,
        "stary tytuł hero",
    );
    if (!js.includes('path:"/dodaj-nieruchomosc"') || !js.includes('path:"/osiedle-tluszcz"') || !js.includes('path:"/admin"')) {
        throw new Error("zniknęła trasa");
    }
    if (!js.includes("domiz-hero-silent.mp4") || !js.includes("if(node.currentTime>0.05)node.currentTime=0") || !js.includes("ev.persisted")) {
        throw new Error("zniknęła łatka filmu");
    }
    if (js.includes("w.map(_=>c.jsx(Ip")) throw new Error("wyróżnione karty zostały");
    const home = js.slice(js.indexOf('className:"home-page"'), js.indexOf("const pd=B.createContext"));
    const region = home.match(/Dubaj|Śląsku, Mazowszu/);
    if (region) {
        const at = home.indexOf(region[0]);
        throw new Error(`slogan regionu został na stronie głównej: ${home.slice(Math.max(0, at - 80), at + 80)}`);
    }
    if (!js.includes('"id":910001') || !js.includes("/oferty-media/BV-C2D04.jpg") || !js.includes('"id":910011')) {
        throw new Error("zniknęły opublikowane oferty");
    }

    let html = readFileSync(htmlPath, "utf8");
    html = html.replaceAll("Nieruchomości Śląsk, Mazowsze i Dubaj | Domiz Homes", TITLE);
    html = html.replaceAll("Domy i mieszkania na Śląsku, Mazowszu oraz wybrane inwestycje w Dubaju. Sprawdź aktualne oferty i skorzystaj ze wsparcia Domiz Homes przy zakupie lub sprzedaży.", META);
    html = once(html, "<h1>Miejsce na decyzję.</h1>", `<h1>${H1}</h1>`, "statyczny H1");
    html = once(
        html,
        "<p>Kawalerki z ogrodem i domy pod Warszawą. Cena lokalu jest osobno od parkingu. Ogłoszenia zewnętrzne są oznaczone i nie są ofertą biura.</p>",
        `<p>${LEAD}</p>`,
        "statyczny lead",
    );
    html = once(
        html,
        'Oferty domów i mieszkań na Śląsku oraz w powiecie wołomińskim. Wsparcie w zakupie, sprzedaży i finansowaniu nieruchomości.',
        META,
        "schema",
    );
    if (!html.includes('src="/assets/index-DvzcJoKV.js"')) throw new Error("html traci moduł");

    mkdirSync(resolve(outDir, "assets"), { recursive: true });
    writeFileSync(resolve(outDir, "assets/index-DvzcJoKV.js"), js);
    writeFileSync(resolve(outDir, "index.html"), html);
    copyFileSync(cssPath, resolve(outDir, "home-2027.css"));
    return { bytes: js.length };
}

if (process.argv[1] && process.argv[1].endsWith("patch-home-stage1.mjs")) {
    const [indexPath, htmlPath, cssPath, outDir] = process.argv.slice(2);
    console.log(patchHomeStage1({ indexPath, htmlPath, cssPath, outDir }));
}
