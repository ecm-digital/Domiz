// Domiz Homes – strona zgody właściciela: /zgoda/<token> (albo /zgoda?t=<token>).
// Czyta WYŁĄCZNIE jeden dokument ownerConsents/<token> (reguły nie pozwalają listować kolekcji).
// Zapisuje tylko pola zgody (jednorazowo) – resztę wymuszają reguły Firestore.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
import { CONTROLLER, VERSIONS, propertyLabel, snapshotText } from '/zgoda/teksty.js';

const app = initializeApp({
  apiKey: 'AIzaSyA32xY58swvW3P86Kp1hPujdmZojPCU67k',
  authDomain: 'domiz-a6a6c.firebaseapp.com',
  projectId: 'domiz-a6a6c',
  storageBucket: 'domiz-a6a6c.firebasestorage.app',
  messagingSenderId: '636428718547',
  appId: '1:636428718547:web:a0dfd6f16b30aecd805f26'
});
const db = getFirestore(app);
// Tylko test lokalny: emulator na localhost (?emu=1). Na domizhomes.com nieaktywne.
if (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('emu') === '1') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

const $app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pl = n => (n == null || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('pl-PL');
const when = ts => ts && ts.toDate ? ts.toDate().toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Warsaw' }) : '';
const otodomUrl = u => (/^https:\/\/(www\.)?otodom\.pl\/[^\s"'<>]+$/i.test(String(u || '')) ? String(u) : '');
const ua = () => String(navigator.userAgent || '').slice(0, 400);

function getToken() {
  const m = location.pathname.match(/^\/zgoda\/([A-Za-z0-9]{20,64})\/?$/);
  if (m) return m[1];
  const t = new URLSearchParams(location.search).get('t') || '';
  return /^[A-Za-z0-9]{20,64}$/.test(t) ? t : '';
}
const token = getToken();
const ref = token ? doc(db, 'ownerConsents', token) : null;
const shortRef = token ? token.slice(-6).toUpperCase() : '';
const mailWithdraw = `mailto:${CONTROLLER.email}?subject=${encodeURIComponent('Wycofanie zgody – ' + shortRef)}&body=${encodeURIComponent('Dzień dobry,\nwycofuję zgodę na publikację ogłoszenia mojej nieruchomości (nr ' + shortRef + ').\n')}`;

const agent = `
  <div class="agent">
    <img src="/assets/tomaszgnat-CQM_mjMX.jpeg" alt="Tomasz Gnat" width="64" height="64">
    <div><div class="n">Tomasz Gnat</div><div class="r">Domiz Homes · nieruchomości</div>
    <div class="r"><a href="tel:+48535330323">+48 535 330 323</a> · <a href="mailto:${CONTROLLER.email}">${CONTROLLER.email}</a></div></div>
  </div>`;

const contactCard = (title, body) => `<div class="card center">${title}${body}</div><div class="card">${agent}</div>`;

function propCard(d) {
  const u = otodomUrl(d.listingUrl);
  const rows = [['Rodzaj', d.propertyType], ['Lokalizacja', d.location], ['Powierzchnia', d.areaM2 ? pl(d.areaM2) + ' m²' : ''], ['Cena', d.pricePln ? pl(d.pricePln) + ' zł' : '']]
    .filter(r => r[1]).map(([k, v]) => `<div class="row"><span>${k}</span><span>${esc(v)}</span></div>`).join('');
  return `<div class="card"><h2>Nieruchomość</h2><div class="prop">${rows}</div>
    ${u ? `<p class="small" style="margin:.7rem 0 0">Na podstawie ogłoszenia: <a href="${esc(u)}" target="_blank" rel="noopener noreferrer">zobacz ogłoszenie na Otodom ↗</a></p>` : ''}</div>`;
}

function renderForm(d) {
  const t = VERSIONS[d.consentTextVersion](d);
  const hello = d.greeting ? `Dzień dobry, ${esc(d.greeting)}!` : 'Dzień dobry!';
  $app.innerHTML = `
  <div class="card">
    ${agent}
    <h1 style="margin-top:1rem">${hello}</h1>
    <p>Dziękuję za rozmowę. Zgodnie z ustaleniami, na tej stronie można potwierdzić <b>bezpłatną publikację ogłoszenia</b> na domizhomes.com.</p>
    <div class="badges">
      <div class="badge">✓ Bezpłatnie</div><div class="badge">✓ Bez wyłączności</div>
      <div class="badge">✓ Bez umowy</div><div class="badge">✓ Wycofanie 1 kliknięciem</div>
    </div>
  </div>
  ${propCard(d)}
  <div class="card"><h2>Zasady</h2><ul class="ticks">${t.facts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="card"><h2>Co publikujemy</h2><ul class="ticks">${t.what.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <h2 style="margin-top:1rem">Gdzie</h2><ul class="ticks">${t.where.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <form class="card" id="f" novalidate>
    <h2>Zgoda</h2>
    <label class="chk"><input type="checkbox" name="consentSite" required><span>${esc(t.checks.consentSite)} <span class="tag req">wymagane</span></span></label>
    <label class="chk"><input type="checkbox" name="consentSocial"><span>${esc(t.checks.consentSocial)} <span class="tag opt">opcjonalne</span></span></label>
    <label class="chk"><input type="checkbox" name="consentContact"><span>${esc(t.checks.consentContact)} <span class="tag opt">opcjonalne</span></span></label>
    <label class="chk"><input type="checkbox" name="consentPhoneInListing"><span>${esc(t.checks.consentPhoneInListing)} <span class="tag opt">opcjonalne</span></span></label>
    <div class="field"><label for="ownerName">Imię i nazwisko właściciela</label>
      <input id="ownerName" name="ownerName" autocomplete="name" maxlength="120" placeholder="np. Anna Kowalska" required></div>
    <details class="rodo"><summary>Informacja o danych osobowych (RODO)</summary><p>${esc(t.rodo)}</p>
      <p>Więcej: <a href="/polityka-prywatnosci">polityka prywatności</a>.</p></details>
    <p class="rodo" style="margin:.6rem 0 1rem">Administrator danych: ${esc(CONTROLLER.name)}, ${esc(CONTROLLER.email)}. <a href="/polityka-prywatnosci">Polityka prywatności</a></p>
    <button class="btn" id="go" type="submit" disabled>Potwierdzam</button>
    <p class="err small" id="e" role="alert"></p>
    <p class="center" style="margin:.4rem 0 0"><button class="linkbtn" type="button" id="no">Nie wyrażam zgody</button></p>
  </form>`;
  const f = document.getElementById('f'), go = document.getElementById('go'), e = document.getElementById('e');
  const valid = () => f.consentSite.checked && f.ownerName.value.trim().length >= 3 && !/\d{3}/.test(f.ownerName.value);
  f.addEventListener('input', () => { go.disabled = !valid(); });
  f.addEventListener('change', () => { go.disabled = !valid(); });
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!valid()) { e.textContent = 'Proszę zaznaczyć zgodę na publikację na stronie i wpisać imię i nazwisko.'; return; }
    go.disabled = true; go.textContent = 'Zapisuję…'; e.textContent = '';
    const sel = { consentSite: true, consentSocial: f.consentSocial.checked, consentContact: f.consentContact.checked, consentPhoneInListing: f.consentPhoneInListing.checked };
    const ownerName = f.ownerName.value.trim().replace(/\s+/g, ' ');
    try {
      await updateDoc(ref, { ...sel, status: 'potwierdzona', ownerName, consentTextSnapshot: snapshotText(d.consentTextVersion, d, sel, ownerName), confirmedAt: serverTimestamp(), userAgent: ua() });
      await load(true);
    } catch (err) {
      console.error(err); go.disabled = false; go.textContent = 'Potwierdzam';
      e.innerHTML = `Nie udało się zapisać (${esc(err.code || 'błąd')}). Proszę spróbować ponownie albo napisać: <a href="mailto:${CONTROLLER.email}">${CONTROLLER.email}</a>.`;
    }
  });
  document.getElementById('no').addEventListener('click', async () => {
    if (!confirm('Potwierdzić brak zgody? Niczego nie opublikujemy.')) return;
    try { await updateDoc(ref, { status: 'odmowa', declinedAt: serverTimestamp(), declineUserAgent: ua() }); await load(); }
    catch (err) { console.error(err); e.textContent = 'Nie udało się zapisać. Proszę napisać na ' + CONTROLLER.email + '.'; }
  });
}

function renderConfirmed(d, fresh) {
  const yes = b => b ? '<b style="color:#059669">Tak</b>' : '<span class="muted">Nie</span>';
  $app.innerHTML = `
  <div class="card center">
    <div class="ok">✓</div>
    <h1>${fresh ? 'Dziękuję! Zgoda zapisana.' : 'Zgoda jest aktywna'}</h1>
    <p class="muted">Potwierdzono ${esc(when(d.confirmedAt))}${d.ownerName ? ' przez: ' + esc(d.ownerName) : ''}. Nr ${esc(shortRef)}.</p>
    <div class="status">
      <div><span>Publikacja na domizhomes.com</span>${yes(d.consentSite)}</div>
      <div><span>Instagram i Facebook Domiz Homes</span>${yes(d.consentSocial)}</div>
      <div><span>Kontakt telefoniczny / SMS w sprawie ogłoszenia</span>${yes(d.consentContact)}</div>
      <div><span>Numer telefonu widoczny w ogłoszeniu</span>${yes(d.consentPhoneInListing)}</div>
    </div>
    <p class="small">Odezwę się przed publikacją. Ten link zachowuje ważność – w każdej chwili można tu sprawdzić status albo wycofać zgodę.</p>
  </div>
  ${propCard(d)}
  <div class="card">
    <h2>Wycofanie zgody</h2>
    <p class="small muted">Jednym kliknięciem. Ogłoszenie zdejmujemy niezwłocznie, najpóźniej w ciągu 48 godzin.</p>
    <button class="btn danger" id="w">Wycofaj zgodę</button>
    <p class="center small" style="margin:.6rem 0 0">albo mailem: <a href="${esc(mailWithdraw)}">${CONTROLLER.email}</a></p>
    <p class="err small" id="e" role="alert"></p>
  </div>
  <div class="card">${agent}</div>`;
  document.getElementById('w').addEventListener('click', async () => {
    if (!confirm('Wycofać zgodę na publikację? Ogłoszenie zdejmiemy najpóźniej w ciągu 48 godzin.')) return;
    try { await updateDoc(ref, { status: 'wycofana', withdrawnAt: serverTimestamp(), withdrawUserAgent: ua() }); await load(); }
    catch (err) { console.error(err); document.getElementById('e').innerHTML = `Nie udało się. Proszę napisać: <a href="${esc(mailWithdraw)}">${CONTROLLER.email}</a>.`; }
  });
}

async function load(fresh = false) {
  if (!ref) { $app.innerHTML = contactCard('<h1>Link jest niepełny</h1>', '<p class="muted">Proszę sprawdzić, czy otwarto cały adres z SMS-a, albo skontaktować się ze mną.</p>'); return; }
  let s;
  try { s = await getDoc(ref); } catch (err) {
    console.error(err);
    $app.innerHTML = contactCard('<h1>Nie udało się wczytać</h1>', '<p class="muted">Proszę odświeżyć stronę za chwilę.</p>'); return;
  }
  if (!s.exists()) { $app.innerHTML = contactCard('<h1>Link jest nieaktywny</h1>', '<p class="muted">Nie znaleźliśmy tej zgody. Jeśli link przyszedł ode mnie SMS-em, proszę o telefon lub wiadomość – wyślę nowy.</p>'); return; }
  const d = s.data();
  if (!VERSIONS[d.consentTextVersion]) { $app.innerHTML = contactCard('<h1>Link jest nieaktywny</h1>', ''); return; }
  if (d.status === 'potwierdzona') return renderConfirmed(d, fresh);
  if (d.status === 'wycofana') {
    $app.innerHTML = contactCard('<div class="ok gray">✓</div><h1>Zgoda wycofana</h1>', `<p class="muted">Wycofano ${esc(when(d.withdrawnAt))}. Ogłoszenie zdejmiemy najpóźniej w ciągu 48 godzin. Nr ${esc(shortRef)}.</p><p class="small">Jeśli to pomyłka – proszę o telefon, przygotuję nowy link.</p>`); return;
  }
  if (d.status === 'odmowa') {
    $app.innerHTML = contactCard('<div class="ok gray">✓</div><h1>Odnotowane – bez publikacji</h1>', '<p class="muted">Niczego nie publikujemy. Dziękuję za rozmowę.</p>'); return;
  }
  if (d.expiresAt && d.expiresAt.toMillis() < Date.now()) {
    $app.innerHTML = contactCard('<h1>Link wygasł</h1>', '<p class="muted">Ze względów bezpieczeństwa link jest ważny przez ograniczony czas. Proszę o telefon lub wiadomość – wyślę nowy.</p>'); return;
  }
  renderForm(d);
}
load();
