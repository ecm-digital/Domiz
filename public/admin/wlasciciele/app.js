// Domiz Homes – panel "Właściciele do kontaktu".
// Plik NIE zawiera żadnych danych ogłoszeń. Dane są w Firestore (kolekcja ownerLeads),
// czytane dopiero po zalogowaniu; dostęp wymusza reguła isAdmin() (dokument admins/{uid}).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, onSnapshot, updateDoc, writeBatch, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';

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
const COL = 'ownerLeads';

const STATUSES = [
  ['nowy', 'Nowy'], ['napisano', 'Napisano'], ['rozmowa', 'Rozmowa'], ['umowa', 'Umowa'], ['odpada', 'Odpada']
];
const STATUS_IDS = STATUSES.map(s => s[0]);

// Kolumny CSV -> pola Firestore. Tylko te kolumny są importowane (biała lista);
// wszystko inne (np. imię, telefon, e-mail) jest pomijane.
const CSV_MAP = {
  portal: 'portal', id_ogloszenia: 'listingId', url: 'url', typ: 'type', cena_pln: 'pricePln',
  czynsz_adm_pln: 'adminFeePln', m2: 'areaM2', pokoje: 'rooms', pietro: 'floor', adres_osiedle: 'location',
  nordic_bemowo: 'nordic', dodatki: 'extras', data_dodania: 'addedDate', od_wlasciciela: 'ownerCheck',
  tez_na: 'alsoOn', link_sprawdzony: 'linkChecked', uwagi: 'remarks'
};
const NUM_FIELDS = new Set(['pricePln', 'adminFeePln', 'areaM2', 'rooms']);

const $app = document.getElementById('app');
const $import = document.getElementById('importBtn');
const $file = document.getElementById('csvFile');
const $logout = document.getElementById('logoutBtn');

let leads = [];
let unsub = null;
const ui = { type: '', portal: '', loc: '', nordic: '', status: '', q: '', minP: '', maxP: '', sort: 'addedDate', dir: -1 };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || '')) ? String(u) : '');
const fmt = n => (n == null || n === '' || isNaN(n)) ? '–' : Number(n).toLocaleString('pl-PL');
const isNordic = l => String(l.nordic || '').toLowerCase().startsWith('tak');
const isSale = l => String(l.type || '').toLowerCase().startsWith('sprzeda');
const msg = html => { $app.innerHTML = `<div class="msg">${html}</div>`; };

// Lokalizacja -> ulica (ogólna normalizacja, bez listy ulic w kodzie)
function street(loc) {
  const s = String(loc || '').trim();
  if (!s) return 'brak';
  if (/okolic/i.test(s)) return 'okolice (wg opisu)';
  const parts = s.split(',');
  const city = parts.length > 1 ? parts[parts.length - 1].trim() : '';
  let st = (parts.length > 1 ? parts.slice(0, -1).join(',') : s)
    .replace(/\(.*?\)/g, '').replace(/\b(ul|gen|al|os)\./gi, '').replace(/\d+\s*[a-z]?\b/gi, '').replace(/\d+/g, '').trim();
  if (!st || /^(bemowo|chrzan[oó]w)\b/i.test(st)) return (city || st || s).replace(/\(.*?\)/g, '').trim() + ' (bez ulicy)';
  const w = st.split(/[\s\-–]+/).filter(x => x && !/^[A-ZŁŚŻŹĆŃÓ]\.$/i.test(x));
  let last = w[w.length - 1] || st;
  if (w.length >= 2 && /^chłopskich$/i.test(last)) last = w.slice(-2).join(' ');
  last = last.split(' ').map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(' ');
  return city && !/chrzan/i.test(city) ? `${last} (${city})` : last;
}

function count(list, fn) {
  const m = new Map();
  list.forEach(l => { const k = fn(l); m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function filtered() {
  const q = ui.q.trim().toLowerCase();
  return leads.filter(l =>
    (!ui.type || (ui.type === 'sprzedaż' ? isSale(l) : !isSale(l))) &&
    (!ui.portal || l.portal === ui.portal) &&
    (!ui.loc || street(l.location) === ui.loc) &&
    (!ui.nordic || (ui.nordic === 'tak' ? isNordic(l) : !isNordic(l))) &&
    (!ui.status || (l.status || 'nowy') === ui.status) &&
    (!ui.minP || (l.pricePln ?? 0) >= Number(ui.minP)) &&
    (!ui.maxP || (l.pricePln ?? Infinity) <= Number(ui.maxP)) &&
    (!q || [l.listingId, l.location, l.note, l.remarks, l.extras, l.portal].join(' ').toLowerCase().includes(q))
  ).sort((a, b) => {
    const k = ui.sort;
    let x = k === 'ppm' ? ppm(a) : a[k], y = k === 'ppm' ? ppm(b) : b[k];
    if (x == null || x === '') return 1; if (y == null || y === '') return -1;
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pl')) * ui.dir;
  });
}
const ppm = l => (l.pricePln && l.areaM2 && isSale(l)) ? Math.round(l.pricePln / l.areaM2) : null;

function cardList(title, rows, key) {
  return `<div class="card"><h3>${esc(title)}</h3>${rows.map(([k, v]) =>
    `<div class="kv"><button data-f="${key}" data-v="${esc(k)}">${esc(k)}</button><b>${v}</b></div>`).join('')}</div>`;
}

function render() {
  const all = leads, rows = filtered();
  const sale = all.filter(isSale).length, nord = all.filter(isNordic);
  const opt = (vals, cur, label) => `<option value="">${label}</option>` + vals.map(v => `<option ${v === cur ? 'selected' : ''} value="${esc(v)}">${esc(v)}</option>`).join('');
  const portals = [...new Set(all.map(l => l.portal))].sort();
  const locs = count(all, l => street(l.location)).map(x => x[0]);
  const th = (k, t) => `<th data-sort="${k}">${t}${ui.sort === k ? (ui.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  $app.innerHTML = `
  ${all.length === 0 ? `<div class="banner">Brak rekordów w Firestore (kolekcja <code>${COL}</code>). Użyj przycisku <b>Importuj CSV</b> i wskaż plik z dysku.</div>` : ''}
  <div class="cards">
    <div class="card"><h3>Razem</h3><div class="big">${all.length}</div>
      <div class="kv"><button data-f="type" data-v="sprzedaż">Sprzedaż</button><b>${sale}</b></div>
      <div class="kv"><button data-f="type" data-v="najem">Najem</button><b>${all.length - sale}</b></div></div>
    <div class="card"><h3>Nordic Bemowo</h3><div class="big">${nord.length}</div>
      <div class="kv"><span>Sprzedaż</span><b>${nord.filter(isSale).length}</b></div>
      <div class="kv"><span>Najem</span><b>${nord.length - nord.filter(isSale).length}</b></div>
      <div class="kv"><button data-f="nordic" data-v="tak">Pokaż tylko Nordic</button><b></b></div></div>
    ${cardList('Wg portalu', count(all, l => l.portal || '–'), 'portal')}
    ${cardList('Status kontaktu', STATUSES.map(([id, lab]) => [id, all.filter(l => (l.status || 'nowy') === id).length]), 'status')}
    ${cardList('Wg lokalizacji', count(all, l => street(l.location)), 'loc')}
  </div>
  <div class="filters">
    <label>Typ<select data-k="type">${opt(['sprzedaż', 'najem'], ui.type, 'wszystkie')}</select></label>
    <label>Portal<select data-k="portal">${opt(portals, ui.portal, 'wszystkie')}</select></label>
    <label>Lokalizacja<select data-k="loc">${opt(locs, ui.loc, 'wszystkie')}</select></label>
    <label>Nordic<select data-k="nordic">${opt(['tak', 'nie'], ui.nordic, 'wszystkie')}</select></label>
    <label>Status<select data-k="status">${opt(STATUS_IDS, ui.status, 'wszystkie')}</select></label>
    <label>Cena od<input data-k="minP" type="number" value="${esc(ui.minP)}" style="width:110px"></label>
    <label>Cena do<input data-k="maxP" type="number" value="${esc(ui.maxP)}" style="width:110px"></label>
    <label>Szukaj<input data-k="q" value="${esc(ui.q)}" placeholder="ID, ulica, notatka…"></label>
    <button class="btn" id="clear">Wyczyść</button>
    <span class="small">Widoczne: <b>${rows.length}</b> z ${all.length}</span>
  </div>
  <div class="tablewrap"><table>
    <thead><tr>${th('status', 'Status')}${th('type', 'Typ')}${th('portal', 'Portal')}${th('listingId', 'ID / link')}${th('pricePln', 'Cena zł')}${th('ppm', 'zł/m²')}${th('adminFeePln', 'Czynsz adm.')}${th('areaM2', 'm²')}${th('rooms', 'Pok.')}${th('floor', 'Piętro')}${th('location', 'Lokalizacja')}${th('nordic', 'Nordic')}${th('addedDate', 'Dodano')}<th>Notatka</th><th>Też na / uwagi</th></tr></thead>
    <tbody>${rows.map(l => {
      const u = safeUrl(l.url), alsoUrl = safeUrl((String(l.alsoOn || '').match(/https:\/\/\S+/) || [])[0]);
      const st = l.status || 'nowy';
      return `<tr>
      <td class="s-${esc(st)}"><select data-id="${esc(l.id)}" data-edit="status">${STATUSES.map(([id, lab]) => `<option value="${id}" ${id === st ? 'selected' : ''}>${lab}</option>`).join('')}</select></td>
      <td><span class="tag ${isSale(l) ? 'sale' : 'rent'}">${esc(l.type)}</span></td>
      <td>${esc(l.portal)}</td>
      <td>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(l.listingId)} ↗</a>` : esc(l.listingId)}</td>
      <td class="num">${fmt(l.pricePln)}</td><td class="num">${fmt(ppm(l))}</td><td class="num">${fmt(l.adminFeePln)}</td>
      <td class="num">${fmt(l.areaM2)}</td><td class="num">${fmt(l.rooms)}</td><td>${esc(l.floor)}</td>
      <td>${esc(l.location)}<div class="small">${esc(l.extras || '')}</div></td>
      <td>${isNordic(l) ? '<span class="tag nordic">tak</span>' : `<span class="small">${esc(l.nordic)}</span>`}</td>
      <td style="white-space:nowrap">${esc(l.addedDate)}</td>
      <td><textarea data-id="${esc(l.id)}" data-edit="note" maxlength="2000" placeholder="notatka…">${esc(l.note || '')}</textarea><div class="saved" data-saved="${esc(l.id)}"></div></td>
      <td class="small">${alsoUrl ? `<a href="${esc(alsoUrl)}" target="_blank" rel="noopener noreferrer">${esc(String(l.alsoOn).split(' ')[0])} ↗</a><br>` : ''}${esc(l.remarks || '')}</td>
    </tr>`; }).join('')}</tbody></table></div>`;
}

$app.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.f) { ui[t.dataset.f] = t.dataset.v; render(); }
  else if (t.dataset.sort) { ui.dir = ui.sort === t.dataset.sort ? -ui.dir : 1; ui.sort = t.dataset.sort; render(); }
  else if (t.id === 'clear') { Object.assign(ui, { type: '', portal: '', loc: '', nordic: '', status: '', q: '', minP: '', maxP: '' }); render(); }
});
$app.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.k) { ui[t.dataset.k] = t.value; render(); return; }
  if (t.dataset.edit) await save(t.dataset.id, t.dataset.edit, t.value);
});
$app.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.k === 'q') { ui.q = t.value; clearTimeout(t._d); t._d = setTimeout(() => { render(); const el = $app.querySelector('[data-k="q"]'); el.focus(); el.setSelectionRange(ui.q.length, ui.q.length); }, 250); }
});

async function save(id, field, value) {
  const info = $app.querySelector(`[data-saved="${CSS.escape(id)}"]`);
  try {
    if (field === 'status' && !STATUS_IDS.includes(value)) return;
    await updateDoc(doc(db, COL, id), { [field]: field === 'note' ? String(value).slice(0, 2000) : value, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
    if (info) info.textContent = 'zapisano';
  } catch (err) {
    console.error(err);
    if (info) { info.textContent = 'błąd zapisu'; info.className = 'saved err'; } else alert('Błąd zapisu: ' + err.message);
  }
}

// ---------- Import CSV (w przeglądarce zalogowanego admina, bez kluczy serwisowych) ----------
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const out = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); out.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); out.push(row); }
  return out.filter(r => r.some(x => x.trim()));
}
// maskowanie ewentualnych telefonów / e-maili w polach tekstowych
const scrub = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail usunięty]').replace(/(?<![\w/.-])\+?\d[\d \-]{7,}\d(?![\w/.-])/g, m => (m.replace(/\D/g, '').length >= 9 ? '[telefon usunięty]' : m));

function rowsToLeads(table) {
  const head = table[0].map(h => h.trim());
  const skipped = head.filter(h => !CSV_MAP[h]);
  const items = table.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => {
      const f = CSV_MAP[h]; if (!f) return;
      let v = (r[i] ?? '').trim();
      if (NUM_FIELDS.has(f)) { const n = Number(v.replace(/\s/g, '').replace(',', '.')); o[f] = v === '' || isNaN(n) ? null : n; }
      else o[f] = ['url'].includes(f) ? v : scrub(v).slice(0, 1000);
    });
    o.nordicFlag = String(o.nordic || '').toLowerCase().startsWith('tak');
    return o;
  }).filter(o => o.listingId && safeUrl(o.url));
  return { items, skipped };
}
const leadId = o => `${String(o.portal || 'x').split('.')[0]}_${o.listingId}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);

$file.addEventListener('change', async () => {
  const f = $file.files[0]; $file.value = '';
  if (!f) return;
  try {
    const { items, skipped } = rowsToLeads(parseCSV(await f.text()));
    const existing = new Set(leads.map(l => l.id));
    const fresh = items.filter(o => !existing.has(leadId(o))).length;
    if (!items.length) { alert('Nie znaleziono poprawnych wierszy (wymagane kolumny: id_ogloszenia, url).'); return; }
    if (!confirm(`Import do Firestore (${COL}):\n• wierszy: ${items.length}\n• nowych: ${fresh}\n• aktualizowanych: ${items.length - fresh} (status i notatka zostają)\n• pominięte kolumny: ${skipped.join(', ') || 'brak'}\n\nKontynuować?`)) return;
    for (let i = 0; i < items.length; i += 400) {
      const b = writeBatch(db);
      items.slice(i, i + 400).forEach(o => {
        const id = leadId(o);
        const data = { ...o, importedAt: serverTimestamp() };
        if (!existing.has(id)) Object.assign(data, { status: 'nowy', note: '' });
        b.set(doc(db, COL, id), data, { merge: true });
      });
      await b.commit();
    }
    alert(`Zaimportowano ${items.length} rekordów.`);
  } catch (err) { console.error(err); alert('Import nieudany: ' + err.message); }
});

$logout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async user => {
  if (unsub) { unsub(); unsub = null; }
  leads = [];
  $import.hidden = $logout.hidden = true;
  if (!user) { msg('<h2>Zaloguj się</h2><p>Ta strona jest dostępna tylko dla administratorów Domiz Homes.</p><p><a class="btn primary" href="/admin/login">Zaloguj się do panelu</a></p><p class="small">Po zalogowaniu otwórz zakładkę „Właściciele do kontaktu” w panelu.</p>'); return; }
  $logout.hidden = false;
  let ok = false;
  try { ok = (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch (e) { ok = false; }
  if (!ok) { msg('<h2>Brak uprawnień</h2><p>To konto nie ma roli administratora (brak wpisu w <code>admins</code>).</p><p class="small">Dostęp nadaje się w konsoli Firebase.</p>'); return; }
  $import.hidden = false;
  msg('Ładowanie danych…');
  unsub = onSnapshot(collection(db, COL), snap => {
    leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const active = document.activeElement;
    if (active && active.tagName === 'TEXTAREA' && active.dataset.edit) return; // nie przerywaj pisania notatki
    render();
  }, err => { console.error(err); msg(`<h2>Brak dostępu do danych</h2><p class="err">${esc(err.code || err.message)}</p>`); });
});
