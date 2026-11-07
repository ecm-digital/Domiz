import { OFFERS, READ, LINK_CHECK } from '/kawalerki-z-ogrodkiem/katalog.js';

const $ = (id) => document.getElementById(id);
const state = { city: '', status: '', q: '' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const money = (n) => (n == null ? 'nieustalone' : `${Number(n).toLocaleString('pl-PL', {
  minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
  maximumFractionDigits: 2,
})} zł`);

const area = (n) => (n == null ? 'nieustalony' : `${Number(n).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} m²`);

function visible() {
  const q = state.q.trim().toLowerCase();
  return OFFERS.filter((o) => {
    if (state.city && o.city !== state.city) return false;
    if (state.status && o.status !== state.status) return false;
    if (!q) return true;
    return `${o.id} ${o.city} ${o.location} ${o.unit}`.toLowerCase().includes(q);
  }).sort((a, b) => String(a.city).localeCompare(b.city, 'pl') || (a.price ?? 0) - (b.price ?? 0));
}

function card(o) {
  const confirm = o.status === 'do_potwierdzenia';
  const garden = o.garden == null
    ? `nieustalony${o.combined ? `. W opisie łącznie z tarasem: ${area(o.combined)} — to nie jest sam ogród` : ''}`
    : area(o.garden);
  return `<article class="card">
    <div class="kicker">
      <span class="tag">${esc(o.city)}</span>
      <span class="tag">${o.market === 'wtorny' ? 'wtórny' : 'pierwotny'}</span>
      <span class="tag ${confirm ? 'warn' : 'ok'}">${confirm ? 'Dostępność do potwierdzenia' : 'Aktywne wg zapisu źródła'}</span>
    </div>
    <h2>${esc(o.unit ? `${o.location} · ${o.unit}` : o.location)}</h2>
    <p class="where">${esc(o.id)} · 1 pokój</p>
    <div class="kv"><span>Mieszkanie</span><b>${area(o.area)}</b></div>
    <div class="kv"><span>Ogród</span><b>${garden}</b></div>
    ${o.gardenNote ? `<p class="small">${esc(o.gardenNote)}</p>` : ''}
    <div class="kv"><span>Cena lokalu</span><b>${money(o.price)}</b></div>
    <div class="kv"><span>Parking</span><b>${o.parking ? esc(o.parking) : 'nieustalone'}</b></div>
    <p class="small">Zapis źródła: ${esc(o.checked)}. ${esc(o.sourceStatus)}. Nie jest to dostępność sprawdzona dzisiaj.</p>
    <a class="out" href="${esc(o.url)}" target="_blank" rel="noopener noreferrer nofollow">Oryginalna karta</a>
  </article>`;
}

function chip(key, value, label) {
  const on = state[key] === value ? ' on' : '';
  return `<button type="button" class="${on}" data-k="${key}" data-v="${esc(value)}">${esc(label)}</button>`;
}

function draw() {
  const list = visible();
  const active = OFFERS.filter((o) => o.status === 'wg_zrodla').length;
  const pending = OFFERS.filter((o) => o.status === 'do_potwierdzenia').length;
  $('read').textContent = `${READ} ${LINK_CHECK} W tym zestawie: ${active} aktywnych według zapisu źródła i ${pending} z Metro Zachodu z dostępnością do potwierdzenia.`;
  $('filters').innerHTML = [
    chip('city', '', 'Wszystkie miasta'),
    chip('city', 'Warszawa', 'Warszawa'),
    chip('city', 'Katowice', 'Katowice'),
    chip('status', '', 'Wszystkie statusy'),
    chip('status', 'wg_zrodla', 'Aktywne wg źródła'),
    chip('status', 'do_potwierdzenia', 'Dostępność do potwierdzenia'),
    `<input id="q" placeholder="Szukaj lokalizacji" value="${esc(state.q)}" aria-label="Szukaj">`,
  ].join('');
  $('count').textContent = `Widoczne: ${list.length} z ${OFFERS.length}.`;
  $('list').innerHTML = list.map(card).join('') || '<p>Brak pozycji dla tego filtra.</p>';
}

document.body.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]');
  if (!b) return;
  state[b.dataset.k] = b.dataset.v;
  draw();
});
document.body.addEventListener('input', (e) => {
  if (e.target.id !== 'q') return;
  state.q = e.target.value;
  const list = visible();
  $('count').textContent = `Widoczne: ${list.length} z ${OFFERS.length}.`;
  $('list').innerHTML = list.map(card).join('') || '<p>Brak pozycji dla tego filtra.</p>';
});

draw();
