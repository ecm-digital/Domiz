// Domiz Homes – panel "Zgody właścicieli" (/admin/zgody).
// Tworzy dokument ownerConsents/<token> (tylko admin – reguła isAdmin()) i przygotowuje SMS.
// NIE zapisujemy numerów telefonów: numer Tomasz wpisuje sam w aplikacji Wiadomości.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
import { CURRENT_VERSION, propertyLabel } from '/zgoda/teksty.js';

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
// Tylko test lokalny (localhost + ?emu=1). Na domizhomes.com nieaktywne.
const EMU = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('emu') === '1';
if (EMU) { connectFirestoreEmulator(db, '127.0.0.1', 8080); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); window.__auth = auth; }

const COL = 'ownerConsents';
const SITE = 'https://domizhomes.com'; // link zawsze na domenie głównej (wiarygodność)
const TYPES = ['Kawalerka', 'Kawalerka z ogródkiem', 'Mieszkanie', 'Mieszkanie z ogródkiem', 'Dom', 'Dom w zabudowie bliźniaczej', 'Segment', 'Działka'];

const $app = document.getElementById('app');
const $logout = document.getElementById('logoutBtn');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = ts => ts && ts.toDate ? ts.toDate().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' }) : '';
const PHONE_RE = /\d[\d ()+.\-]{7,}\d/;
let rows = [], unsub = null, last = null, filter = '';

function newToken(len = 24) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  while (out.length < len) {
    const buf = crypto.getRandomValues(new Uint8Array(len * 2));
    for (const b of buf) { if (b < 248 && out.length < len) out += A[b % 62]; } // bez biasu modulo
  }
  return out;
}
const linkFor = t => `${SITE}/zgoda/${t}`;
function noun(type) {
  const t = String(type || '').toLowerCase();
  if (t.startsWith('dom') || t.startsWith('segment')) return 'domu';
  if (t.startsWith('działka')) return 'działce';
  return 'mieszkaniu';
}
function smsText(d, token) {
  const who = d.salutation === 'pan' ? 'Pana' : d.salutation === 'pani' ? 'Pani' : 'Pana/Pani';
  return `Dzień dobry, tu Tomasz Gnat z Domiz Homes, rozmawialiśmy przed chwilą o ${who} ${noun(d.propertyType)}. Zgodnie z rozmową, tu można potwierdzić bezpłatną publikację ogłoszenia na domizhomes.com: ${linkFor(token)} Zgodę można wycofać w każdej chwili. Pozdrawiam, Tomasz`;
}
const smsHref = body => 'sms:&body=' + encodeURIComponent(body); // iPhone: otwiera Wiadomości z treścią, numer wpisujesz sam
const statusOf = r => (r.status === 'oczekuje' && r.expiresAt && r.expiresAt.toMillis() < Date.now()) ? 'wygasla' : (r.status || 'oczekuje');
const ST_LABEL = { oczekuje: 'Czeka na potwierdzenie', potwierdzona: 'Potwierdzona', wycofana: 'Wycofana', odmowa: 'Odmowa', wygasla: 'Link wygasł' };

function resultBox(d, token) {
  const sms = smsText(d, token);
  return `<div class="result" id="res">
    <b>Gotowe – link do zgody:</b><br><code id="lnk">${esc(linkFor(token))}</code>
    <div class="actions"><button class="btn sm" data-copy="lnk">Kopiuj link</button><a class="btn sm" href="${esc(linkFor(token))}" target="_blank" rel="noopener">Podgląd strony ↗</a></div>
    <p style="margin:.8rem 0 .3rem"><b>SMS</b> <span class="small">(${sms.length} znaków; numer wpisujesz sam w Wiadomościach)</span></p>
    <textarea id="smsTxt">${esc(sms)}</textarea>
    <div class="actions">
      <a class="btn primary" id="smsLink" href="${esc(smsHref(sms))}">📱 Otwórz w Wiadomościach</a>
      <button class="btn" data-copy="smsTxt">Kopiuj SMS</button>
    </div>
    <p class="small" style="margin:.5rem 0 0">Najpierw rozmowa telefoniczna, dopiero potem SMS. Numeru telefonu nie zapisujemy w systemie.</p>
  </div>`;
}

function render() {
  const counts = rows.reduce((m, r) => (m[statusOf(r)] = (m[statusOf(r)] || 0) + 1, m), {});
  const list = rows.filter(r => !filter || statusOf(r) === filter);
  const yn = (r, k) => r.status === 'oczekuje' || r.status === 'odmowa' ? '·' : (r[k] ? '✓' : '–');
  $app.innerHTML = `
  <section class="card">
    <h2>Nowa zgoda właściciela</h2>
    <form id="f" autocomplete="off">
      <div class="row2">
        <label>Forma<select name="salutation"><option value="pan">Pan</option><option value="pani">Pani</option><option value="">Pan/Pani</option></select></label>
        <label>Powitanie (opcjonalne)<input name="greeting" maxlength="40" placeholder="np. Panie Marku"></label>
      </div>
      <label>Rodzaj nieruchomości<select name="propertyType">${TYPES.map(t => `<option>${t}</option>`).join('')}</select></label>
      <label>Lokalizacja (osiedle / ulica, dzielnica, miasto – bez nr mieszkania)<input name="location" required maxlength="120" placeholder="np. ul. Lazurowa, Bemowo, Warszawa"></label>
      <div class="row2">
        <label>Metraż m²<input name="areaM2" type="number" step="0.01" min="0" inputmode="decimal"></label>
        <label>Cena zł<input name="pricePln" type="number" step="1" min="0" inputmode="numeric"></label>
      </div>
      <label>Link do ogłoszenia na Otodom<input name="listingUrl" type="url" maxlength="300" placeholder="https://www.otodom.pl/pl/oferta/..."></label>
      <label>Link ważny (dni)<select name="days"><option>14</option><option selected>30</option><option>60</option><option>90</option></select></label>
      <button class="btn primary" type="submit" id="go">Utwórz link i SMS</button>
      <p class="err small" id="e"></p>
      <p class="small">Nie wpisuj tu numeru telefonu sprzedającego – formularz go odrzuci.</p>
    </form>
    ${last ? resultBox(last.d, last.token) : ''}
  </section>
  <section class="card">
    <h2>Zgody (${rows.length})</h2>
    <div class="filters">
      <button class="btn sm ${!filter ? 'on' : ''}" data-filter="">Wszystkie</button>
      ${Object.entries(ST_LABEL).map(([k, v]) => `<button class="btn sm ${filter === k ? 'on' : ''}" data-filter="${k}">${v} (${counts[k] || 0})</button>`).join('')}
    </div>
    ${rows.length === 0 ? '<div class="banner">Brak zgód. Utwórz pierwszą formularzem obok.</div>' : ''}
    <div class="tablewrap"><table>
      <thead><tr><th>Status</th><th>Utworzono</th><th>Nieruchomość</th><th>Właściciel</th><th title="WWW / Social / Kontakt / Telefon w ogłoszeniu">WWW · Soc · Kont · Tel</th><th>Potwierdzono / wycofano</th><th></th></tr></thead>
      <tbody>${list.map(r => `<tr>
        <td><span class="st st-${statusOf(r)}">${ST_LABEL[statusOf(r)]}</span></td>
        <td style="white-space:nowrap">${esc(when(r.createdAt))}</td>
        <td>${esc(propertyLabel(r))}${r.listingUrl ? `<br><a class="small" href="${esc(r.listingUrl)}" target="_blank" rel="noopener noreferrer">Otodom ↗</a>` : ''}</td>
        <td>${esc(r.ownerName || '')}${r.greeting ? `<div class="small">${esc(r.greeting)}</div>` : ''}</td>
        <td class="yn">${yn(r, 'consentSite')} · ${yn(r, 'consentSocial')} · ${yn(r, 'consentContact')} · ${yn(r, 'consentPhoneInListing')}</td>
        <td class="small" style="white-space:nowrap">${r.confirmedAt ? '✓ ' + esc(when(r.confirmedAt)) : ''}${r.withdrawnAt ? '<br>✗ ' + esc(when(r.withdrawnAt)) : ''}${r.declinedAt ? '✗ ' + esc(when(r.declinedAt)) : ''}</td>
        <td style="white-space:nowrap"><button class="btn sm" data-link="${esc(r.id)}">Link</button>${r.status === 'oczekuje' ? ` <a class="btn sm" href="${esc(smsHref(smsText(r, r.id)))}">SMS</a>` : ''}</td>
      </tr>`).join('')}</tbody></table></div>
    <p class="small">Dowód zgody (wersja tekstu, pełna treść, data, przeglądarka) jest zapisany w dokumencie. Wycofana zgoda = zdjąć ogłoszenie i posty w ciągu 48 h.</p>
  </section>`;
}

async function create(f) {
  const e = document.getElementById('e'); e.textContent = '';
  const v = Object.fromEntries(new FormData(f).entries());
  const txt = ['greeting', 'location'].map(k => String(v[k] || '').trim());
  if (txt.some(x => PHONE_RE.test(x))) { e.textContent = 'Wygląda na numer telefonu – nie zapisujemy numerów. Usuń go.'; return; }
  if (!txt[1]) { e.textContent = 'Wpisz lokalizację.'; return; }
  const url = String(v.listingUrl || '').trim();
  if (url && !/^https:\/\/(www\.)?otodom\.pl\/[^\s<>"]+$/.test(url)) { e.textContent = 'Link musi prowadzić do otodom.pl (https://www.otodom.pl/...).'; return; }
  const num = x => { const n = Number(String(x || '').replace(',', '.')); return x === '' || isNaN(n) ? null : n; };
  const d = {
    salutation: ['pan', 'pani'].includes(v.salutation) ? v.salutation : '',
    greeting: txt[0], propertyType: v.propertyType, location: txt[1],
    areaM2: num(v.areaM2), pricePln: num(v.pricePln), listingUrl: url,
    consentTextVersion: CURRENT_VERSION, status: 'oczekuje',
    createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + Number(v.days || 30) * 864e5)
  };
  const go = document.getElementById('go'); go.disabled = true;
  try {
    const token = newToken();
    await setDoc(doc(db, COL, token), d);
    last = { d, token };
    render();
    document.getElementById('res')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) { console.error(err); e.textContent = 'Nie udało się zapisać: ' + (err.code || err.message); go.disabled = false; }
}

$app.addEventListener('submit', ev => { if (ev.target.id === 'f') { ev.preventDefault(); create(ev.target); } });
$app.addEventListener('input', ev => {
  if (ev.target.id === 'smsTxt') document.getElementById('smsLink').href = smsHref(ev.target.value);
});
$app.addEventListener('click', async ev => {
  const t = ev.target.closest('button'); if (!t) return;
  if ('filter' in t.dataset) { filter = t.dataset.filter; render(); }
  else if (t.dataset.copy) {
    const el = document.getElementById(t.dataset.copy);
    await navigator.clipboard.writeText(el.value ?? el.textContent).catch(() => {});
    t.textContent = 'Skopiowano ✓';
  } else if (t.dataset.link) {
    const r = rows.find(x => x.id === t.dataset.link);
    last = { d: r, token: r.id }; render();
    document.getElementById('res')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
$logout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async user => {
  if (unsub) { unsub(); unsub = null; }
  rows = []; last = null; $logout.hidden = true;
  const msg = h => { $app.innerHTML = `<div class="msg">${h}</div>`; };
  if (!user) { msg('<h2>Zaloguj się</h2><p>Ta strona jest dostępna tylko dla administratorów Domiz Homes.</p><p><a class="btn primary" href="/admin/login">Zaloguj się do panelu</a></p>'); return; }
  $logout.hidden = false;
  let ok = false;
  try { ok = (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch (e) { ok = false; }
  if (!ok) { msg('<h2>Brak uprawnień</h2><p>To konto nie ma roli administratora (brak wpisu w <code>admins</code>).</p>'); return; }
  msg('Ładowanie…');
  unsub = onSnapshot(collection(db, COL), snap => {
    rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const a = document.activeElement;
    if (a && a.closest && a.closest('#f') && a.tagName !== 'BUTTON') return; // nie przerywaj wpisywania
    render();
  }, err => { console.error(err); msg(`<h2>Brak dostępu do danych</h2><p class="err">${esc(err.code || err.message)}</p>`); });
});
