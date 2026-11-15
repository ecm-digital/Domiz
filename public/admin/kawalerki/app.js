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
const ui = { sort: 'total', dir: 1, hideOver: false, market: '', set: 'k' };
// Zestaw danych: 'k' = kawalerki (UNITS…), '2' = 2 pokoje z ogródkiem (SET2).
const S = () => (ui.set === '2' && D.SET2) ? D.SET2 : D;
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
  return S().UNITS.filter(u => (!ui.hideOver || u.budget !== 'nie') && (!ui.market || u.market === ui.market))
    .sort((a, b) => {
      const ra = TOP[a.id]?.rank ?? (WT[a.id] ? 10 + WT[a.id].rank : 99), rb = TOP[b.id]?.rank ?? (WT[b.id] ? 10 + WT[b.id].rank : 99);
      if (ra !== rb) return ra - rb; // Top 3, potem Top wtórny – zawsze na górze, w kolejności rankingu
      const x = a[k], y = b[k];
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pl')) * ui.dir;
    });
}

function render() {
  const X = S(), two = X !== D;
  const list = rows(), byId = Object.fromEntries(X.UNITS.map(u => [u.id, u]));
  const over = X.UNITS.filter(u => u.budget === 'nie').length;
  const nWt = X.UNITS.filter(u => u.market === 'wtórny').length, nPi = X.UNITS.length - nWt;
  const showP = ui.market !== 'wtórny', showW = ui.market !== 'pierwotny' && (X.TOP_WT || []).length;
  const card = (t, u, wt) => `<div class="card topcard ${wt ? 'wt' : t.medal}">
    <div class="ribbon ${wt ? 'wt' : t.medal}">${wt ? `🔑 Top wtórny ${t.rank}` : t.rank > 3 ? 'Poza podium · 4.' : `${MEDAL[t.rank]} TOP ${t.rank}`}${t.nordic ? ' · Nordic Bemowo' : ''}</div>
    <div class="tt">${esc(t.title)}</div>
    <div style="margin-top:.2rem"><b>${esc(u.name)}</b> ${mtag(u.market)}</div>
    <div class="small" style="margin:.2rem 0 .5rem">${esc(u.dev)} · ${esc(u.loc)}</div>
    <div class="why"><b>${wt ? 'Dlaczego w Top wtórny:' : t.rank > 3 ? 'Dlaczego wysoko:' : 'Dlaczego w top 3:'}</b> ${esc(t.why)}</div>
    ${(t.reasons || []).map(([k, v]) => `<div class="kv"><span>✔ ${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    <div style="margin-top:.5rem">${link(u)}</div></div>`;
  const th = (k, t) => `<th data-sort="${k}" title="Sortuj">${t}${ui.sort === k ? (ui.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  $app.innerHTML = `
  <div class="settabs" role="tablist">${[['k', `Kawalerki (${D.UNITS.length})`], ['2', `2 pokoje z ogródkiem (${D.SET2 ? D.SET2.UNITS.length : 0})`]].map(([k, t]) => `<button class="settab${ui.set === k ? ' on' : ''}" data-set="${k}" role="tab" aria-selected="${ui.set === k}">${esc(t)}</button>`).join('')}</div>
  <div class="banner">Stan na ${esc(X.UPDATED)} · ${two ? `${X.UNITS.length} mieszkań 2-pokojowych z ogródkiem (parter, 35–53 m²)` : `${X.UNITS.length} kawalerek (25–34 m²)`} – ${nPi} z rynku pierwotnego, ${nWt} z wtórnego · budżet ${fmt(D.BUDGET)} zł z miejscem postojowym (MP).
    ${two ? '<b>Żadne nie mieści się w budżecie</b> – przy każdym podano, o ile go przekracza. ' : ''}Ceny MP częściowo to szacunki („szac.”), a odległości do metra – linia prosta. Szczegóły w sekcji „Na co uważać”.</div>
  <div class="mkt" role="group" aria-label="Rynek"><span>Rynek:</span>${[['pierwotny', `pierwotny (${nPi})`], ['wtórny', `wtórny (${nWt})`], ['', `wszystkie (${X.UNITS.length})`]].map(([m, t]) => `<button class="mktbtn${ui.market === m ? ' on' : ''}" data-mkt="${m}">${esc(t)}</button>`).join('')}</div>
  ${showP ? `<h2 class="sec">🏆 Top 3 – najlepsze ${two ? '2 pokoje z ogródkiem' : 'kawalerki'} z rynku pierwotnego</h2>` : ''}
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
    ${two ? '' : `<label class="toggle"><input type="checkbox" id="hideOver" ${ui.hideOver ? 'checked' : ''}> Ukryj poza budżetem (&gt; ${fmt(D.BUDGET)} zł z MP, ${over} szt.)</label>`}
    <label>Rynek<select id="market">${[['', 'wszystkie'], ['pierwotny', 'pierwotny'], ['wtórny', 'wtórny']].map(([v, t]) => `<option value="${v}" ${ui.market === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Sortuj<select id="sortSel">${[['total', 'Razem z MP'], ['perM2', 'Cena za m²'], ['garden', 'Ogródek m²'], ['readySort', 'Termin odbioru'], ['metroKm', 'Odległość do metra']].map(([k, t]) => `<option value="${k}" ${ui.sort === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <span class="small">Widoczne: <b>${list.length}</b> z ${X.UNITS.length} · 🏆 Top 3, „Poza podium” i 🔑 Top wtórny zawsze na górze, reszta wg wybranego sortowania</span>
  </div>
  <div class="tablewrap"><table>
    <thead><tr>${th('id', '#')}${th('name', 'Opcja')}${th('m2', 'm²')}${th('garden', 'Ogródek m²')}<th>Piętro</th>${th('price', 'Cena zł')}${th('perM2', 'zł/m²')}<th>Miejsce post. zł</th>${th('total', 'Razem z MP zł')}${th('readySort', 'Odbiór')}${th('metroKm', 'Metro (linia prosta)')}${th('budget', 'W budżecie')}<th>Link</th></tr></thead>
    <tbody>${list.map(u => `<tr class="${u.budget === 'nie' ? 'over' : ''}${TOP[u.id] ? ' toprow ' + TOP[u.id].medal : WT[u.id] ? ' toprow wt' : ''}">
      <td class="num">${u.id}</td><td>${TOP[u.id] ? badge(TOP[u.id]) + ' ' : ''}${WT[u.id] ? `<span class="badge wt">🔑 Top wtórny ${WT[u.id].rank}</span> ` : ''}<b>${esc(u.name)}</b> ${mtag(u.market)}<div class="small">${esc(u.dev)} · ${esc(u.loc)}${u.note ? ` · ${esc(u.note)}` : ''}</div></td>
      <td class="num">${m2(u.m2)}</td><td class="num">${esc(u.gardenTxt)}</td><td>${esc(u.floor)}</td>
      <td class="num">${fmt(u.price)}</td><td class="num">${fmt(u.perM2)}</td><td>${esc(u.parking)}</td>
      <td class="num"><b>${esc(u.totalTxt)}</b></td><td>${esc(u.ready)}</td><td>${esc(u.metro)}</td>
      <td>${BUDGET_TAG[u.budget] || ''}${u.overTxt ? `<div class="small">${esc(u.overTxt)}</div>` : ''}</td><td>${link(u)}</td></tr>`).join('')}</tbody></table></div>
  <h2 class="sec">Na co uważać</h2>
  <div class="caveats">${X.CAVEATS.map(([t, d]) => `<div class="card"><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
  <p class="small" style="margin-top:1rem">Źródła: strony deweloperów i portali (linki w tabeli), sprawdzone ${esc(X.UPDATED)}; rynek wtórny – pojedyncze ogłoszenia Otodom, sprawdzone 31.10.2026. Bez zdjęć i opisów z ogłoszeń.</p>`;
}

$app.addEventListener('click', e => {
  const st = e.target.closest('button[data-set]');
  if (st) { if (ui.set !== st.dataset.set) { ui.set = st.dataset.set; ui.hideOver = false; ui.market = ''; setTop(); render(); } return; }
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
