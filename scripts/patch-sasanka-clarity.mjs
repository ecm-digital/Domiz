import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function once(source, from, to, label) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`${label}: oczekiwano 1 wystąpienia, jest ${count}`);
    return source.replace(from, () => to);
}

const TABLE_SECTION = 'e.jsx("section",{className:"tluszcz-section",children:e.jsxs("div",{className:"container",children:[DzSasankaTable(e,!1,a=>{U(a);const s=document.getElementById("kontakt");s?.scrollIntoView({behavior:"smooth",block:"start"})})]})}),';
const TABLE_MOVED = 'e.jsx("section",{id:"domy",className:"tluszcz-section",children:e.jsxs("div",{className:"container",children:[DzSasankaTable(e,!1,a=>{U(a);const s=document.getElementById("kontakt");s?.scrollIntoView({behavior:"smooth",block:"start"})})]})}),';
const INSERT_AT = 'Otwórz PDF"]})]})]})})}),e.jsx("section",{className:"tluszcz-availability-strip"';

const NEW_TABLE = `function DzSasankaTable(e,en,pick){
const rows=[
["A","Do potwierdzenia","Etap wg opisu strony: stan surowy zamknięty. Nie mamy nowszego potwierdzenia.","modelowo ok. 83 m² bez garażu","do potwierdzenia","do potwierdzenia"],
["B","Do potwierdzenia","Etap wg opisu strony: stan surowy zamknięty, prace przy kostce i drodze. Nie mamy nowszego potwierdzenia.","modelowo ok. 83 m² bez garażu","do potwierdzenia","do potwierdzenia"],
["C","Do potwierdzenia","Etap wg dotychczasowego opisu: stan 0. Nie wiemy, czy fundamenty istnieją.","modelowo ok. 83 m² bez garażu","do potwierdzenia","do potwierdzenia"],
["D","Do potwierdzenia","Etap wg dotychczasowego opisu: stan 0. Nie wiemy, czy fundamenty istnieją.","modelowo ok. 83 m² bez garażu","do potwierdzenia","do potwierdzenia"],
["E","Do potwierdzenia","7.11.2026: przygotowany grunt, bez fundamentów. To nie jest informacja o cenie ani sprzedaży.","modelowo ok. 83 m² bez garażu","do potwierdzenia","do potwierdzenia"]
];
const cols=en?["Home","Commercial availability","Construction stage as described","Model area","Price","Timing",""]:["Dom","Dostępność handlowa","Etap budowy","Metraż modelu","Cena","Termin",""];
const title=en?"Homes A–E":"Domy A–E";
const sub=en?"Commercial availability is separate from the construction stage. Price and timing are unconfirmed.":"Dostępność handlowa jest osobno od etapu budowy. Cena i termin są do potwierdzenia.";
const note=en?"The model card is about 83.00 m² without the garage. The garage is 18.09 m² separately. This is not a measured schedule for homes A–E. No current price is confirmed.":"Sasanka XL: modelowo 83,00 m² bez garażu. Garaż 18,09 m² jest osobno. To nie jest karta pomiarowa domów A–E. Nie podajemy historycznej kwoty jako aktualnej ceny.";
return e.jsxs("div",{className:"dz-sasanka",children:[e.jsxs("div",{className:"tluszcz-section-heading dz-sasanka-head",children:[e.jsx("span",{className:"section-label",children:en?"Zaściankowa, Tłuszcz":"ul. Zaściankowa, Tłuszcz"}),e.jsx("h2",{children:title}),e.jsx("p",{children:sub})]}),
e.jsx("div",{className:"dz-sasanka-wrap",children:e.jsxs("table",{className:"dz-sasanka-table",children:[e.jsx("thead",{children:e.jsx("tr",{children:cols.map((c,i)=>e.jsx("th",{scope:"col",children:c},i))})}),
e.jsx("tbody",{children:rows.map(([name,avail,stage,area,price,term])=>e.jsxs("tr",{children:[e.jsx("th",{scope:"row","data-label":cols[0],children:name==="E"?(en?"House E":"Dom E"):(en?"House ":"Dom ")+name}),e.jsx("td",{"data-label":cols[1],children:e.jsx("span",{className:"dz-badge",children:avail})}),e.jsx("td",{"data-label":cols[2],children:stage}),e.jsx("td",{"data-label":cols[3],children:area}),e.jsx("td",{"data-label":cols[4],children:price}),e.jsx("td",{"data-label":cols[5],children:term}),e.jsx("td",{className:"dz-cta","data-label":cols[6],children:pick?e.jsx("a",{className:"btn-primary dz-btn",href:"#kontakt",onClick:ev=>{ev.preventDefault();pick((en?"House ":"Dom ")+name)},children:en?"Ask about this home":"Zapytaj o ten dom"}):e.jsx("a",{className:"btn-primary dz-btn",href:"#kontakt",children:en?"Ask about this home":"Zapytaj o ten dom"})})]},name))})]})}),
e.jsx("p",{className:"dz-sasanka-note",children:note})]})}
`;

export function patchSasanka({ chunkPath, outDir }) {
    let js = readFileSync(chunkPath, "utf8");
    if (!js.includes(TABLE_SECTION) || js.split(INSERT_AT).length !== 2) {
        throw new Error("nie znalazłem unikalnego miejsca tabeli albo hero");
    }
    js = js.replace(TABLE_SECTION, "");
    js = js.replace(INSERT_AT, () => "Otwórz PDF\"]})]})]})})})," + TABLE_MOVED + "e.jsx(\"section\",{className:\"tluszcz-availability-strip\"");

    js = once(js, 'e.jsx("h1",{children:"Dom pod Warszawą: Sasanka XL z garażem w Tłuszczu"})', 'e.jsx("h1",{children:"Sasanka XL w Tłuszczu. Trzy sypialnie, własny ogród i garaż."})', "H1");
    js = once(
        js,
        'e.jsx("p",{children:"Powstanie 5 domów: cztery segmenty w dwóch budynkach bliźniaczych oraz jeden dom wolnostojący — każdy w wariancie Sasanka XL z garażem. To propozycja dla rodzin szukających domu z ogrodem pod Warszawą, w spokojnej lokalizacji z dostępem do PKP i codziennych usług."})',
        'e.jsx("p",{children:"Domy A–E przy ul. Zaściankowej. Dostępność handlowa i cena są do potwierdzenia. Etap A–B podajemy według dotychczasowego opisu strony. Dla E, 7.11.2026: przygotowany grunt, bez fundamentów."})',
        "lead",
    );
    js = once(js, '{value:"ok. 83 m²",label:"Sasanka XL z garażem"}', '{value:"83 m²",label:"model bez garażu; garaż 18,09 m² osobno"}', "metraż");
    js = once(js, '{value:"5",label:"domów w kameralnej inwestycji"}', '{value:"5",label:"oznaczeń A–E na planie; sprzedaż do potwierdzenia"}', "liczba domów");
    js = once(js, '{icon:F,label:"ok. 83 m²",desc:"kompaktowy metraż Sasanki XL"}', '{icon:F,label:"83 m²",desc:"model bez garażu; garaż 18,09 m² osobno"}', "pasek metrażu");
    if (js.split('status:"Dostępny"').length - 1 !== 5) throw new Error("status Dostępny nie występuje 5 razy");
    js = js.replaceAll('status:"Dostępny"', 'status:"Do potwierdzenia"');
    js = once(js, '["Approx. 83 m²","Sasanka XL with a garage"]', '["83 m²","model without garage; garage 18.09 m² separate"]', "metraż EN");
    js = once(js, "Find out which of the five homes you can reserve", "Compare homes A–E. Availability is unconfirmed", "pasek EN");
    js = once(
        js,
        "We will send you the current list of available homes, equipment options and details of viewings.",
        "Price, commercial availability and timing are unconfirmed. We confirm them before treating any home as for sale.",
        "kontakt EN",
    );
    js = once(
        js,
        'tluszcz-hero-actions",children:[e.jsx("a",{className:"btn-primary",href:"#kontakt",children:"Zapytaj o dostępność"})',
        'tluszcz-hero-actions",children:[e.jsx("a",{className:"btn-primary",href:"#domy",children:"Wybierz dom A–E"}),e.jsx("a",{className:"btn-secondary",href:"#kontakt",onClick:ev=>{ev.preventDefault();P(!0);document.getElementById("kontakt")?.scrollIntoView({behavior:"smooth",block:"start"})},children:"Umów oglądanie podobnych domów w Trojanach"})',
        "CTA hero",
    );
    js = once(js, 'e.jsx("h2",{children:"Sprawdź, który z 5 domów możesz zarezerwować"})', 'e.jsx("h2",{children:"Porównaj domy A–E"})', "pasek");
    js = once(js, 'price:"od 650 tys. zł (stan deweloperski)"', 'price:"cena do potwierdzenia"', "pakiet");
    js = once(js, '{value:"39",label:"osiedli z domami Sasanka"}', '{value:"39",label:"osiedli Sasanka w Polsce, nie w Tłuszczu"}', "licznik 39");
    js = once(js, '{value:"624",label:"Sasanki w całej Polsce"}', '{value:"624",label:"domów modelu w Polsce, nie na tej działce"}', "licznik 624");
    js = once(js, '{value:"144",label:"Sasanki dostępne w sprzedaży"}', '{value:"144",label:"modelu w sprzedaży w Polsce, nie tutaj"}', "licznik 144");
    js = once(
        js,
        "Zdjęcia pokazują modelową Sasankę XL i pomagają wyobrazić sobie skalę salonu, kuchni, sypialni, łazienek oraz praktycznych stref przechowywania. Materiały są poglądowe dla modelu domu.",
        "To nie są zdjęcia domów przy ul. Zaściankowej. Galeria pokazuje modelową Sasankę XL z innej realizacji.",
        "galeria",
    );
    js = once(
        js,
        "To materiał poglądowy z innej inwestycji. Pokazuje charakter zabudowy i standard komunikacji, a docelowe wideo Osiedla Tłuszcz możemy podmienić, gdy będzie gotowe.",
        "Film jest z innej inwestycji, nie z ul. Zaściankowej. Nie mamy datowanego zdjęcia ani filmu tej budowy.",
        "film",
    );
    js = once(
        js,
        "Plan poglądowy układu osiedla. Aktualną dostępność i szczegóły wybranego domu potwierdzimy podczas kontaktu.",
        "Plan ilustracyjny, nie geodezyjny. Nie odczytuj z niego powierzchni ogrodów A–E.",
        "plan",
    );
    js = once(
        js,
        "Obecnie używamy zdjęć poglądowych. Po otrzymaniu licencjonowanych materiałów Sasanka XL podmienimy je na właściwe zdjęcia projektu.",
        "Zdjęcia wnętrz i film nie pokazują budowy przy ul. Zaściankowej. Nie publikujemy ich jako aktualnej budowy.",
        "faq zdjęcia",
    );
    js = once(
        js,
        '{step:"02",title:"Bliźniak C–D oraz dom E: stan 0",desc:"Termin realizacji bliźniaka C–D i domu wolnostojącego E do potwierdzenia."}',
        '{step:"02",title:"C–D oraz E: etap bez nowej pewności",desc:"C–D: dotychczasowy opis to stan 0. Nie wiemy, czy fundamenty istnieją. E, potwierdzenie z 7.11.2026: przygotowany grunt, bez fundamentów. Stan 0 nie oznacza, że fundamenty są."}',
        "etap E",
    );
    js = once(
        js,
        '{step:"01",title:"Bliźniak A–B: stan surowy zamknięty",desc:"Trwa montaż instalacji elektrycznej i hydraulicznej. Równolegle prowadzone są prace gruntowe: układanie kostki oraz przygotowanie drogi.",current:!0}',
        '{step:"01",title:"Bliźniak A–B: etap wg opisu strony",desc:"Dotychczasowy opis: stan surowy zamknięty, montaż instalacji oraz prace przy kostce i drodze. Nie mamy nowszego potwierdzenia i nie nazywamy tego nową datą budowy.",current:!0}',
        "etap AB",
    );
    js = once(
        js,
        'e.jsxs("select",{value:k,onChange:a=>U(a.target.value),children:[e.jsx("option",{value:"",children:"Który dom Cię interesuje?"})',
        'e.jsxs("select",{"aria-label":"Który dom Cię interesuje?",value:k,onChange:a=>U(a.target.value),children:[e.jsx("option",{value:"",children:"Który dom Cię interesuje?"})',
        "nazwa domu",
    );
    js = once(
        js,
        'e.jsxs("select",{value:y,onChange:a=>A(a.target.value),children:[e.jsx("option",{value:"",children:"Wariant wyposażenia"})',
        'e.jsxs("select",{"aria-label":"Wariant wyposażenia",value:y,onChange:a=>A(a.target.value),children:[e.jsx("option",{value:"",children:"Wariant wyposażenia"})',
        "nazwa wariantu",
    );
    js = once(js, 'imageAlt:"Rzut 3D parteru domu Sasanka XL z garażem"', 'imageAlt:"Rzut modelowy SASANKA XL, parter. Poglądowy, nie pomiar domu A–E."', "alt parter");
    js = once(js, 'imageAlt:"Rzut 3D piętra domu Sasanka XL"', 'imageAlt:"Rzut modelowy SASANKA XL, piętro. Poglądowy, nie pomiar domu A–E."', "alt piętro");

    const start = js.indexOf("function DzSasankaTable");
    if (start < 0) throw new Error("brak tabeli");
    js = js.slice(0, start) + NEW_TABLE;
    if (js.includes("od 650") || js.includes("5 domów, 5 dostępnych") || js.includes("5 homes, 5 available")) {
        throw new Error("została stara obietnica dostępności albo ceny");
    }
    if (!js.includes("przygotowany grunt, bez fundamentów")) throw new Error("brak faktu o E");
    if (js.includes("WEWNETRZNE") || js.includes("przylacza")) throw new Error("skan przyłączy nie może wejść do chunka");

    mkdirSync(outDir, { recursive: true });
    const target = resolve(outDir, "OsiedleTluszcz-D2t5wflE.js");
    writeFileSync(target, js);
    return { bytes: js.length };
}

if (process.argv[1] && process.argv[1].endsWith("patch-sasanka-clarity.mjs")) {
    const [chunkPath, outDir] = process.argv.slice(2);
    console.log(patchSasanka({ chunkPath, outDir }));
}
