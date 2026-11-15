// Domiz Homes – panel "Mieszkania z ogródkiem – Warszawa" (porównanie do zakupu).
// Dane (data.js) są ładowane dopiero po zalogowaniu i potwierdzeniu roli admina (admins/{uid}).
// Tylko fakty i linki do źródeł – bez zdjęć i opisów z ogłoszeń.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyA32xY58swvW3P86Kp1hPujdmZojPCU67k',
  authDomain: 'domiz-a6a6c.firebaseapp.com',
  projectId: 'domiz-a6a6c',
  storageBucket: 'domiz-a6a6c.firebasestorage.app',
  messagingSenderId: '636428718547',
  appId: '1:636428718547:web:a0dfd6f16b30aecd805f26'
});
const auth = getAuth(app);
const db = getFirestore(app);

const $app = document.getElementById('app');
const $logout = document.getElementById('logoutBtn');
let D = null;
let TOP = {};
let WT = {}; // Top wtórny (odsprzedaże)
const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4.' };
const badge = (t, big) => t.rank > 3 ? `<span class="badge off">Poza podium</span>` : `<span class="badge ${t.medal}${big ? ' big' : ''}">🏆 TOP ${t.rank}</span>`;
const ui = { sort: 'total', dir: 1, hideOver: false, market: '', set: 'k', estate: '', district: '', showAllEstates: false, cart: [], clientView: false };
const allUnitsCatalog = () => SET_DEFS.filter(([, , , get]) => get()).flatMap(([k, title, short, get]) => get().UNITS.map(u => ({ ...u, _setShort: short, _setTitle: title })));
const cartUnits = () => {
  const byId = Object.fromEntries(allUnitsCatalog().map(u => [u.id, u]));
  return ui.cart.map(id => byId[id]).filter(Boolean);
};
const formatClientCartText = items => {
  const lines = items.map((u, idx) => `${idx + 1}. ${u.name} (${u._setShort}, ${u.loc})\n   Metraż: ${m2(u.m2)} m² | Ogródek: ${u.gardenTxt} | Odbiór: ${u.ready}\n   Cena: ${fmt(u.price)} zł (${fmt(u.perM2)} zł/m²)${u.url ? `\n   Link: ${u.url}` : ''}`);
  return `Dzień dobry, przesyłam wybrane mieszkania z ogródkiem w Warszawie przygotowane przez Domiz Homes:\n\n${lines.join('\n\n')}`;
};
// Zestaw danych: 'k' = kawalerki, '2' = 2 pokoje, '3' = 3 pokoje, '4' = 4 pokoje.
const SET_DEFS = [
  ['k', 'Kawalerki', '1 pok.', () => D],
  ['2', '2 pokoje z ogródkiem', '2 pok.', () => D.SET2],
  ['3', '3 pokoje z ogródkiem', '3 pok.', () => D.SET3],
  ['4', '4 pokoje z ogródkiem', '4 pok.', () => D.SET4],
];
const S = () => (SET_DEFS.find(([k]) => k === ui.set)?.[3]() || D);
const estateKey = u => String(u.name || '').split('–')[0].trim();
const DISTRICT_GROUPS = [
  ['', 'Wszystkie dzielnice'],
  ['bemowo', 'Bemowo / Chrzanów'],
  ['bialoleka', 'Białołęka / Tarchomin'],
  ['centrum_zachod', 'Wola / Mokotów / Ursus / Włochy'],
  ['wschod', 'Wawer / Wesoła / inne'],
];
function districtGroup(u) {
  const txt = `${u.loc || ''} ${u.metro || ''} ${u.name || ''}`.toLowerCase();
  if (/bemow|chrzan[oó]w|lazurow|szeligow|cooper|sochaczew|kocjana|pe[łl]czy|czumy|batalion|karolin|lumea/.test(txt)) return 'bemowo';
  if (/bia[łl]o[łl][eę]k|tarchomin|[żz]era[ńn]|lewand[oó]w|frachtow|zdziarsk|szamocin|modli[ńn]sk|kartograf|sprawn|daniszew|pancer|berenson|k[ąa]ty|mochty[ńn]|hemar|ostr[óo]dzk|sarenki|anilinow|p[łl]ochoci[ńn]sk|w[łl]odkowica/.test(txt)) return 'bialoleka';
  if (/wola|mokot[oó]w|stegn|ursus|go[łl][ąa]bki|w[łl]ochy|coko[łl]ow|capri|fajansow|prystora|[łl]opusza[ńn]sk|brodatego|piast[oó]w/.test(txt)) return 'centrum_zachod';
  return 'wschod';
}

function buildEstateDashboard() {
  const allSets = SET_DEFS.filter(([, , , get]) => get()).map(([k, title, short, get]) => ({ k, title, short, data: get() }));
  const allUnits = allSets.flatMap(s => s.data.UNITS.map(u => ({ ...u, _setKey: s.k, _setShort: s.short })));
  const primaryUnits = allUnits.filter(u => u.market === 'pierwotny');
  const map = new Map();
  for (const u of primaryUnits) {
    const key = estateKey(u);
    if (!map.has(key)) {
      map.set(key, {
        name: key, dev: u.dev, loc: u.loc, units: [], sets: new Set(), setCounts: {},
        minPrice: Infinity, minM2: Infinity, maxM2: 0, minPerM2: Infinity, maxPerM2: 0, maxGarden: 0, bestReadySort: '9999', bestReady: u.ready, url: u.url, site: u.site,
      });
    }
    const e = map.get(key);
    e.units.push(u);
    e.sets.add(u._setShort);
    e.setCounts[u._setKey] = (e.setCounts[u._setKey] || 0) + 1;
    if (u.price && u.price < e.minPrice) e.minPrice = u.price;
    if (u.m2) {
      if (u.m2 < e.minM2) e.minM2 = u.m2;
      if (u.m2 > e.maxM2) e.maxM2 = u.m2;
    }
    if (u.perM2) {
      if (u.perM2 < e.minPerM2) e.minPerM2 = u.perM2;
      if (u.perM2 > e.maxPerM2) e.maxPerM2 = u.perM2;
    }
    if (u.garden && u.garden > e.maxGarden) e.maxGarden = u.garden;
    if (u.readySort && u.readySort < e.bestReadySort) { e.bestReadySort = u.readySort; e.bestReady = u.ready; }
  }
  const estates = Array.from(map.values()).sort((a, b) => b.units.length - a.units.length || a.minPrice - b.minPrice);
  const readyNowOr2026 = estates.filter(e => /^(2024|2025|2026)/.test(e.bestReadySort)).length;
  const min12 = primaryUnits.filter(u => u._setKey === 'k' || u._setKey === '2').reduce((m, u) => (u.price && u.price < m ? u.price : m), Infinity);
  const min34 = primaryUnits.filter(u => u._setKey === '3' || u._setKey === '4').reduce((m, u) => (u.price && u.price < m ? u.price : m), Infinity);
  return { estates, totalUnits: allUnits.length, totalPrimary: primaryUnits.length, readyNowOr2026, min12, min34 };
}
const setTop = () => { TOP = Object.fromEntries([...S().TOP3, ...(S().OFF_PODIUM || [])].map(t => [t.id, t])); WT = Object.fromEntries((S().TOP_WT || []).map(t => [t.id, t])); };
const mtag = m => m === 'wtórny' ? '<span class="tag wt">wtórny</span>' : `<span class="tag">${esc(m)}</span>`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || '')) ? String(u) : '');
const fmt = n => (n == null || isNaN(n)) ? '–' : Number(n).toLocaleString('pl-PL');
const m2 = n => Number(n).toFixed(2).replace('.', ',');
const msg = html => { $app.innerHTML = `<div class="msg">${html}</div>`; };
const BUDGET_TAG = { tak: '<span class="tag ok">Tak</span>', nie: '<span class="tag no">Nie</span>', potw: '<span class="tag chk">Do potw.</span>' };
const link = u => { const s = safeUrl(u.url); return s ? `<a href="${esc(s)}" target="_blank" rel="noopener noreferrer nofollow">${esc(u.site)} ↗</a>` : '–'; };

function rows() {
  const k = ui.sort;
  return S().UNITS.filter(u => (!ui.hideOver || u.budget !== 'nie') && (!ui.market || u.market === ui.market) && (!ui.estate || estateKey(u) === ui.estate) && (!ui.district || districtGroup(u) === ui.district))
    .sort((a, b) => {
      const ra = TOP[a.id]?.rank ?? (WT[a.id] ? 10 + WT[a.id].rank : 99), rb = TOP[b.id]?.rank ?? (WT[b.id] ? 10 + WT[b.id].rank : 99);
      if (ra !== rb) return ra - rb; // Top 3, potem Top wtórny – zawsze na górze, w kolejności rankingu
      const x = a[k], y = b[k];
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pl')) * ui.dir;
    });
}

function render() {
  if (ui.clientView) {
    const selected = cartUnits();
    $app.innerHTML = `
      <div style="max-width:960px;margin:0 auto;padding:1rem 0">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem" class="no-print">
          <button type="button" class="estate-btn" id="closeClientViewBtn">← Wróć do porównywarki</button>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button type="button" class="estate-btn" id="copyCartMsgBtn">Kopiuj wiadomość dla klienta</button>
            <button type="button" class="estate-btn on" id="printClientViewBtn">Drukuj / Zapisz jako PDF</button>
          </div>
        </div>
        <section style="background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:1.25rem">
          <div class="eyebrow">DOMIZ HOMES · PROPOZYCJA OFERT DLA KLIENTA</div>
          <h2 style="margin:.25rem 0 .35rem">Wybrane mieszkania z ogródkiem — Warszawa (${selected.length})</h2>
          <p class="small" style="margin:0 0 1rem">Zestawienie przygotowane ${new Date().toLocaleDateString('pl-PL')} · ceny brutto lokalu wg cenników źródłowych.</p>
          ${selected.length === 0 ? '<p>Brak wybranych mieszkań w zestawieniu.</p>' : `<div class="tablewrap"><table>
            <thead><tr><th>Opcja</th><th>Pokoje</th><th>Metraż</th><th>Ogródek</th><th>Cena</th><th>zł/m²</th><th>Odbiór</th><th>Link</th></tr></thead>
            <tbody>${selected.map(u => `<tr>
              <td><b>${esc(u.name)}</b><div class="small">${esc(u.loc)} · ${esc(u.dev)}</div></td>
              <td>${esc(u._setShort)}</td>
              <td class="num">${m2(u.m2)} m²</td>
              <td class="num">${esc(u.gardenTxt)}</td>
              <td class="num"><b>${fmt(u.price)} zł</b></td>
              <td class="num">${fmt(u.perM2)} zł/m²</td>
              <td>${esc(u.ready)}</td>
              <td>${link(u)}</td>
            </tr>`).join('')}</tbody>
          </table></div>`}
        </section>
      </div>`;
    return;
  }
  const X = S(), isKawalerki = X === D, hasBudgetCheck = X.hasBudgetCheck ?? isKawalerki;
  const scopeLabel = X.bannerScope || (isKawalerki ? 'kawalerek (25–34 m²)' : 'mieszkań 2-pokojowych z ogródkiem (parter, 35–53 m²)');
  const topTitle = isKawalerki ? 'kawalerki' : (X.label || '2 pokoje z ogródkiem');
  const list = rows(), byId = Object.fromEntries(X.UNITS.map(u => [u.id, u]));
  const over = X.UNITS.filter(u => u.budget === 'nie').length;
  const nWt = X.UNITS.filter(u => u.market === 'wtórny').length, nPi = X.UNITS.length - nWt;
  const showP = ui.market !== 'wtórny', showW = ui.market !== 'pierwotny' && (X.TOP_WT || []).length;
  const card = (t, u, wt) => `<div class="card topcard ${wt ? 'wt' : t.medal}">
    <div class="ribbon ${wt ? 'wt' : t.medal}">${wt ? `🔑 Top wtórny ${t.rank}` : t.rank > 3 ? 'Poza podium · 4.' : `${MEDAL[t.rank]} TOP ${t.rank}`}${t.nordic ? ' · Nordic Bemowo' : ''}</div>
    <div class="tt">${esc(t.title)}</div>
    <div style="margin-top:.2rem"><b>${esc(u.name)}</b> ${mtag(u.market)}</div>
    <div class="small" style="margin:.2rem 0 .35rem">${esc(u.dev)} · ${esc(u.loc)}</div>
    <div class="small" style="margin:0 0 .5rem;color:#0f172a"><b>${m2(u.m2)} m²</b> · <b>${fmt(u.perM2)} zł/m²</b> · ${fmt(u.price)} zł (${esc(u.gardenTxt)} ogródek)</div>
    <div class="why"><b>${wt ? 'Dlaczego w Top wtórny:' : t.rank > 3 ? 'Dlaczego wysoko:' : 'Dlaczego w top 3:'}</b> ${esc(t.why)}</div>
    ${(t.reasons || []).map(([k, v]) => `<div class="kv"><span>✔ ${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    <div style="margin-top:.5rem">${link(u)}</div></div>`;
  const th = (k, t) => `<th data-sort="${k}" title="Sortuj">${t}${ui.sort === k ? (ui.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  const dash = buildEstateDashboard();
  const visibleEstates = dash.estates.filter(e => !ui.district || e.units.some(u => districtGroup(u) === ui.district));
  const hasMoreEstates = visibleEstates.length > 8;
  const topEstates = ui.showAllEstates ? visibleEstates : visibleEstates.slice(0, 8);
  const estateDashHtml = `
  <section class="estate-dash" aria-label="Dashboard najlepszych osiedli od deweloperów">
    <div class="estate-dash__head">
      <div>
        <div class="eyebrow">RYNEK PIERWOTNY · MIESZKANIA Z OGRÓDKIEM</div>
        <h2>Najlepsze osiedla od deweloperów w Warszawie</h2>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
        ${hasMoreEstates ? `<button class="estate-btn${ui.showAllEstates ? ' on' : ''}" id="toggleAllEstatesBtn" type="button">${ui.showAllEstates ? 'Zwiń do Top 8' : `Pokaż wszystkie (${visibleEstates.length})`}</button>` : ''}
        ${ui.estate ? `<button class="estate-btn on" id="clearEstateBtn" type="button">Filtr osiedla: ${esc(ui.estate)} ×</button>` : `<span class="small">Kliknij dzielnicę lub osiedle, aby przefiltrować lokale poniżej</span>`}
      </div>
    </div>
    <div class="estate-kpis">
      <div class="estate-kpi"><div class="estate-kpi__label">Osiedla z ogródkiem</div><div class="estate-kpi__val">${dash.estates.length}</div><div class="estate-kpi__sub">inwestycji deweloperskich</div></div>
      <div class="estate-kpi"><div class="estate-kpi__label">Lokali w bazie (1–4 pok.)</div><div class="estate-kpi__val">${dash.totalUnits}</div><div class="estate-kpi__sub">${dash.totalPrimary} pierwotny · ${dash.totalUnits - dash.totalPrimary} wtórny</div></div>
      <div class="estate-kpi"><div class="estate-kpi__label">1–2 pok. od dewelopera</div><div class="estate-kpi__val">${dash.min12 < Infinity ? `${fmt(dash.min12)} zł` : '–'}</div><div class="estate-kpi__sub">3–4 pok. od ${dash.min34 < Infinity ? `${fmt(dash.min34)} zł` : '–'}</div></div>
      <div class="estate-kpi"><div class="estate-kpi__label">Gotowe / odbiór 2026</div><div class="estate-kpi__val">${dash.readyNowOr2026}</div><div class="estate-kpi__sub">osiedla z szybkim odbiorem</div></div>
    </div>
    <div class="estate-districts" role="group" aria-label="Dzielnica">
      ${DISTRICT_GROUPS.map(([k, label]) => `<button type="button" class="estate-btn${ui.district === k ? ' on' : ''}" data-district="${k}">${esc(label)}</button>`).join('')}
    </div>
    <div class="estate-grid">
      ${topEstates.map(e => {
        const targetSet = e.setCounts[ui.set] ? ui.set : Object.keys(e.setCounts)[0];
        const safe = safeUrl(e.url);
        return `<article class="estate-card${ui.estate === e.name ? ' is-active' : ''}">
          <div>
            <div class="estate-card__top">
              <div class="estate-card__name">${esc(e.name)}</div>
              <span class="badge">${e.units.length} szt.</span>
            </div>
            <div class="estate-card__meta">${esc(e.dev)} · ${esc(e.loc)}</div>
          </div>
          <div class="estate-card__stats">
            <div><span>Od:</span> <b>${e.minPrice < Infinity ? `${fmt(e.minPrice)} zł` : '–'}</b></div>
            <div><span>Cena/m²:</span> <b>${e.minPerM2 < Infinity ? (e.minPerM2 === e.maxPerM2 ? `${fmt(e.minPerM2)} zł/m²` : `${fmt(e.minPerM2)}–${fmt(e.maxPerM2)} zł/m²`) : '–'}</b></div>
            <div><span>Metraż:</span> <b>${e.minM2 < Infinity ? (e.minM2 === e.maxM2 ? `${m2(e.minM2)} m²` : `${m2(e.minM2)}–${m2(e.maxM2)} m²`) : '–'}</b></div>
            <div><span>Ogródek max:</span> <b>${e.maxGarden ? `${m2(e.maxGarden)} m²` : 'w opisie'}</b></div>
            <div><span>Pokoje:</span> <b>${esc(Array.from(e.sets).join(', '))}</b></div>
            <div><span>Odbiór:</span> <b>${esc(e.bestReady)}</b></div>
          </div>
          <div class="estate-card__actions">
            <button type="button" class="estate-btn${ui.estate === e.name ? ' on' : ''}" data-estate="${esc(e.name)}" data-target-set="${esc(targetSet)}">${ui.estate === e.name ? 'Wybrano w tabeli' : `Pokaż lokale (${e.units.length})`}</button>
            ${safe ? `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer nofollow">${esc(e.site)} ↗</a>` : ''}
          </div>
        </article>`;
      }).join('')}
    </div>
  </section>`;

  $app.innerHTML = `${estateDashHtml}
  <div class="settabs" role="tablist">${SET_DEFS.filter(([, , , get]) => get()).map(([k, title, , get]) => `<button class="settab${ui.set === k ? ' on' : ''}" data-set="${k}" role="tab" aria-selected="${ui.set === k}">${esc(`${title} (${get().UNITS.length})`)}</button>`).join('')}</div>
  <div class="banner">Stan na ${esc(X.UPDATED)} · ${X.UNITS.length} ${esc(scopeLabel)} – ${nPi} z rynku pierwotnego, ${nWt} z wtórnego${hasBudgetCheck || X === D.SET2 ? ` · budżet ${fmt(D.BUDGET)} zł z miejscem postojowym (MP)` : ''}.
    ${X === D.SET2 ? '<b>Żadne nie mieści się w budżecie</b> – przy każdym podano, o ile go przekracza. ' : ''}Ceny MP częściowo to szacunki („szac.”)${isKawalerki || X === D.SET2 ? ', a odległości do metra – linia prosta' : ''}. Szczegóły w sekcji „Na co uważać”.</div>
  <div class="mkt" role="group" aria-label="Rynek"><span>Rynek:</span>${[['pierwotny', `pierwotny (${nPi})`], ['wtórny', `wtórny (${nWt})`], ['', `wszystkie (${X.UNITS.length})`]].map(([m, t]) => `<button class="mktbtn${ui.market === m ? ' on' : ''}" data-mkt="${m}">${esc(t)}</button>`).join('')}</div>
  ${showP ? `<h2 class="sec">🏆 Top 3 – najlepsze ${esc(topTitle)} z rynku pierwotnego</h2>` : ''}
  <div class="legend"><b>Jak liczony jest ranking</b> (w tej kolejności):
    <ol>${(X.RANK_CRITERIA || []).map(([t, d]) => `<li><b>${esc(t)}</b> – ${esc(d)}</li>`).join('')}</ol>
    <span class="small">„szac.” = cena miejsca postojowego oszacowana z cennika wcześniejszego etapu, do potwierdzenia u dewelopera.</span></div>
  ${showP && X.NORDIC_RULE ? `<div class="legend nordic"><b>🏠 Zasada:</b> ${esc(X.NORDIC_RULE)}</div>` : ''}
  ${showP ? `<div class="top3">${[...X.TOP3, ...(X.OFF_PODIUM || [])].map(t => card(t, byId[t.id], false)).join('')}</div>` : ''}
  ${showW ? `<h2 class="sec">🔑 Top wtórny – gotowe od ręki (odsprzedaże)</h2>
  <div class="legend wt"><b>Plus rynku wtórnego:</b> można wprowadzić się teraz – bez czekania do 2027–2028 i bez ryzyka opóźnień budowy. <b>Minus:</b> +2% PCC (i ew. prowizja agencji), nie wliczone w budżet.${X.NORDIC_WT ? `<br>🏠 ${esc(X.NORDIC_WT)}` : ''}</div>
  <div class="top3">${X.TOP_WT.map(t => card(t, byId[t.id], true)).join('')}</div>` : ''}
  <p class="small">${esc(X.READY_NOW)}</p>
  <h2 class="sec">Porównanie</h2>
  <div class="filters">
    ${!hasBudgetCheck ? '' : `<label class="toggle"><input type="checkbox" id="hideOver" ${ui.hideOver ? 'checked' : ''}> Ukryj poza budżetem (&gt; ${fmt(D.BUDGET)} zł z MP, ${over} szt.)</label>`}
    <label>Rynek<select id="market">${[['', 'wszystkie'], ['pierwotny', 'pierwotny'], ['wtórny', 'wtórny']].map(([v, t]) => `<option value="${v}" ${ui.market === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Sortuj<select id="sortSel">${[['total', 'Razem z MP'], ['perM2', 'Cena za m²'], ['garden', 'Ogródek m²'], ['readySort', 'Termin odbioru'], ['metroKm', 'Odległość do metra']].map(([k, t]) => `<option value="${k}" ${ui.sort === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <span class="small">Widoczne: <b>${list.length}</b> z ${X.UNITS.length} · 🏆 Top 3, „Poza podium” i 🔑 Top wtórny zawsze na górze, reszta wg wybranego sortowania</span>
  </div>
  <div class="tablewrap"><table>
    <thead><tr>${th('id', '#')}${th('name', 'Opcja')}${th('m2', 'm²')}${th('garden', 'Ogródek m²')}<th>Piętro</th>${th('price', 'Cena zł')}${th('perM2', 'zł/m²')}<th>Miejsce post. zł</th>${th('total', 'Razem z MP zł')}${th('readySort', 'Odbiór')}${th('metroKm', 'Metro / lokalizacja')}<th>${hasBudgetCheck || X === D.SET2 ? 'W budżecie' : 'Podatek / PCC'}</th><th>Link</th></tr></thead>
    <tbody>${list.map(u => `<tr class="${(hasBudgetCheck || X === D.SET2) && u.budget === 'nie' ? 'over' : ''}${TOP[u.id] ? ' toprow ' + TOP[u.id].medal : WT[u.id] ? ' toprow wt' : ''}">
      <td class="num">${u.id}</td><td>${TOP[u.id] ? badge(TOP[u.id]) + ' ' : ''}${WT[u.id] ? `<span class="badge wt">🔑 Top wtórny ${WT[u.id].rank}</span> ` : ''}<b>${esc(u.name)}</b> ${mtag(u.market)}<div class="small">${esc(u.dev)} · ${esc(u.loc)}${u.note ? ` · ${esc(u.note)}` : ''}</div></td>
      <td class="num">${m2(u.m2)}</td><td class="num">${esc(u.gardenTxt)}</td><td>${esc(u.floor)}</td>
      <td class="num">${fmt(u.price)}</td><td class="num">${fmt(u.perM2)}</td><td>${esc(u.parking)}</td>
      <td class="num"><b>${esc(u.totalTxt)}</b></td><td>${esc(u.ready)}</td><td>${esc(u.metro)}</td>
      <td>${hasBudgetCheck || X === D.SET2 ? (BUDGET_TAG[u.budget] || '') : (u.market === 'pierwotny' ? '<span class="tag ok">bez PCC</span>' : '<span class="tag chk">+2% PCC</span>')}${u.overTxt && (hasBudgetCheck || X === D.SET2) ? `<div class="small">${esc(u.overTxt)}</div>` : ''}</td><td>${link(u)}<button type="button" class="copy-btn" data-copy-id="${u.id}">Kopiuj</button> <button type="button" class="copy-btn${ui.cart.includes(u.id) ? ' ok' : ''}" data-cart-id="${u.id}">${ui.cart.includes(u.id) ? 'W zestawie ✓' : '+ Zestaw'}</button>${u.market === 'wtórny' && u.url ? ` <a class="copy-btn" href="/admin?tab=acquisition&prefillUrl=${encodeURIComponent(u.url)}&prefillTitle=${encodeURIComponent(`${u.name} · ${u.loc} (${m2(u.m2)} m²)`)}&prefillPrice=${encodeURIComponent(`${fmt(u.price)} zł`)}" style="text-decoration:none">+ Pozysk</a>` : ''}</td></tr>`).join('')}</tbody></table></div>
  <h2 class="sec">Na co uważać</h2>
  <div class="caveats">${X.CAVEATS.map(([t, d]) => `<div class="card"><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
  <p class="small" style="margin-top:1rem">Źródła: strony deweloperów i portali (linki w tabeli), sprawdzone ${esc(X.UPDATED)}; rynek wtórny – pojedyncze ogłoszenia Otodom, sprawdzone 31.10.2026. Bez zdjęć i opisów z ogłoszeń.</p>
  ${ui.cart.length > 0 ? `<div style="position:sticky;bottom:1rem;z-index:40;margin-top:1rem;padding:.75rem 1rem;border-radius:12px;background:#0f172a;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;box-shadow:0 12px 28px rgba(15,23,42,.35)">
    <div><strong>Zestawienie dla klienta: ${ui.cart.length} ${ui.cart.length === 1 ? 'oferta' : ui.cart.length < 5 ? 'oferty' : 'ofert'}</strong></div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      <button type="button" class="estate-btn" id="copyCartMsgBtn">Kopiuj wiadomość</button>
      <button type="button" class="estate-btn on" id="openClientViewBtn">Widok / PDF dla klienta</button>
      <button type="button" class="estate-btn" id="clearCartBtn">Wyczyść</button>
    </div>
  </div>` : ''}`;
}

$app.addEventListener('click', e => {
  const cartBtn = e.target.closest('button[data-cart-id]');
  if (cartBtn) {
    const id = Number(cartBtn.dataset.cartId);
    if (ui.cart.includes(id)) ui.cart = ui.cart.filter(x => x !== id);
    else ui.cart = [...ui.cart, id];
    render();
    return;
  }
  if (e.target.closest('#openClientViewBtn')) { ui.clientView = true; render(); return; }
  if (e.target.closest('#closeClientViewBtn')) { ui.clientView = false; render(); return; }
  if (e.target.closest('#clearCartBtn')) { ui.cart = []; ui.clientView = false; render(); return; }
  if (e.target.closest('#printClientViewBtn')) { window.print(); return; }
  const copyMsgBtn = e.target.closest('#copyCartMsgBtn');
  if (copyMsgBtn) {
    const selected = cartUnits();
    if (selected.length && navigator.clipboard) {
      navigator.clipboard.writeText(formatClientCartText(selected)).then(() => {
        copyMsgBtn.textContent = 'Skopiowano ✓';
        setTimeout(() => { copyMsgBtn.textContent = 'Kopiuj wiadomość'; }, 1800);
      }).catch(() => {});
    }
    return;
  }
  const cb = e.target.closest('button[data-copy-id]');
  if (cb) {
    const id = Number(cb.dataset.copyId);
    const u = S().UNITS.find(x => x.id === id);
    if (u && navigator.clipboard) {
      const txt = `${u.name} (${u.market}) — ${u.loc}\nMetraż: ${m2(u.m2)} m² | Ogródek: ${u.gardenTxt} | Odbiór: ${u.ready}\nCena: ${fmt(u.price)} zł (${u.totalTxt} z MP)\nLink: ${u.url}`;
      navigator.clipboard.writeText(txt).then(() => {
        cb.textContent = 'Skopiowano ✓';
        cb.classList.add('ok');
        setTimeout(() => { cb.textContent = 'Kopiuj'; cb.classList.remove('ok'); }, 1800);
      }).catch(() => {});
    }
    return;
  }
  const dbBtn = e.target.closest('button[data-district]');
  if (dbBtn) {
    ui.district = dbBtn.dataset.district || '';
    ui.estate = '';
    render();
    return;
  }
  if (e.target.closest('#toggleAllEstatesBtn')) { ui.showAllEstates = !ui.showAllEstates; render(); return; }
  if (e.target.closest('#clearEstateBtn')) { ui.estate = ''; render(); return; }
  const eb = e.target.closest('button[data-estate]');
  if (eb) {
    const nextEstate = ui.estate === eb.dataset.estate ? '' : eb.dataset.estate;
    ui.estate = nextEstate;
    if (nextEstate && eb.dataset.targetSet && ui.set !== eb.dataset.targetSet) { ui.set = eb.dataset.targetSet; ui.hideOver = false; ui.market = 'pierwotny'; setTop(); }
    render();
    return;
  }
  const st = e.target.closest('button[data-set]');
  if (st) { if (ui.set !== st.dataset.set) { ui.set = st.dataset.set; ui.hideOver = false; ui.market = ''; ui.estate = ''; setTop(); render(); } return; }
  const mb = e.target.closest('button[data-mkt]');
  if (mb) { ui.market = mb.dataset.mkt; render(); return; }
  const s = e.target.closest('th[data-sort]');
  if (!s) return;
  ui.dir = ui.sort === s.dataset.sort ? -ui.dir : 1; ui.sort = s.dataset.sort; render();
});
$app.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'hideOver') ui.hideOver = t.checked;
  else if (t.id === 'market') ui.market = t.value;
  else if (t.id === 'sortSel') { ui.sort = t.value; ui.dir = t.value === 'garden' ? -1 : 1; }
  else return;
  render();
});
$logout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async user => {
  $logout.hidden = true;
  if (!user) { msg('<h2>Zaloguj się</h2><p>Ta strona jest dostępna tylko dla administratorów Domiz Homes.</p><p><a class="btn primary" href="/admin/login">Zaloguj się do panelu</a></p>'); return; }
  $logout.hidden = false;
  let ok = false;
  try { ok = (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch (e) { ok = false; }
  if (!ok) { msg('<h2>Brak uprawnień</h2><p>To konto nie ma roli administratora (brak wpisu w <code>admins</code>).</p><p class="small">Dostęp nadaje się w konsoli Firebase.</p>'); return; }
  msg('Ładowanie danych…');
  try { D = await import('/admin/kawalerki/data.js'); setTop(); render(); }
  catch (err) { console.error(err); msg(`<h2>Błąd ładowania danych</h2><p class="err">${esc(err.message)}</p>`); }
});
