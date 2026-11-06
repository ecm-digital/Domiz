// Widok zestawienia. Czysty HTML, bez dostępu do DOM — montuje go app.js po zalogowaniu.
import {
  UPDATED, BUDGET, BUDGET_NOTE, NORDIC_CENNIK, SPOTKANIE_YIT, UNITS, WNIOSKI,
  KOLEJNOSC_OPIS, OPINIE_MZ, WSPOLPRACA, PYTANIA, DATY,
  budzetKlasa, statusLabel, filterUnits, unique, cenaZaM2,
} from './zestawienie.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const safeUrl = (u) => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || '')) ? String(u) : '');

export function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return 'brak';
  const x = Number(n);
  const grosze = Math.abs(x - Math.round(x)) > 0.001;
  return x.toLocaleString('pl-PL', {
    minimumFractionDigits: grosze ? 2 : 0,
    maximumFractionDigits: grosze ? 2 : 0,
  });
}

const m2 = (n) => (n == null ? 'niepodane' : `${Number(n).toFixed(2).replace('.', ',')} m²`);

const BUDGET_TAG = {
  tak: '<span class="tag ok">Mieści się w 650 tys.</span>',
  nie: '<span class="tag no">Ponad 650 tys. z garażem</span>',
  brak: '<span class="tag chk">Brak sumy — nie wiadomo</span>',
  rezerwacja: '<span class="tag sale">Rezerwacja — nie liczyć jako wolne</span>',
  odrzut: '<span class="tag no">Poza rankingiem</span>',
};

const OGROD_TAG = {
  potwierdzony: 'ogród potwierdzony rzutem w paczce',
  podany: 'ogród podany w źródle, bez rzutu w tym wdrożeniu',
  niepotwierdzony: 'ogród niepotwierdzony załączonym rysunkiem',
  nieznany: 'ogród nieznany (puste pole ≠ brak)',
};

function link(url, label) {
  const s = safeUrl(url);
  if (!s) return '–';
  return `<a href="${esc(s)}" target="_blank" rel="noopener noreferrer nofollow">${esc(label)}</a>`;
}

function opts(values, current, all) {
  return [`<option value="">${esc(all)}</option>`, ...values.map((v) => `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${esc(v)}</option>`)].join('');
}

function card(u) {
  const klasa = budzetKlasa(u);
  const zl = cenaZaM2(u.cena, u.m2);
  const sumaLinia = u.suma == null
    ? `<b>brak sumy</b><div class="small">${esc(u.sumaStatus)}</div>${u.sumaSzacunek ? `<div class="small">${esc(u.sumaSzacunek)}</div>` : ''}`
    : `<b>${fmt(u.suma)} zł</b><div class="small">${esc(u.sumaStatus)}</div>${u.sumaPorownawcza != null ? `<div class="small">sam garaż 42 000: ${fmt(u.sumaPorownawcza)} zł</div>` : ''}`;
  const raty = u.harmonogram ? `<p>5% listopad 2026: ${fmt(u.harmonogram.w5)} zł<br>25% styczeń 2027: ${fmt(u.harmonogram.w25)} zł<br>70% maj 2027: ${fmt(u.harmonogram.w70)} zł<br><span class="small">${esc(u.harmonogram.bazaOpis)} Dni miesiąca brak.</span></p>` : '';
  const wykon = u.wykonczenie ? `<p>Dziś ok. ${fmt(u.wykonczenie.dzis)} zł. Po deklarowanym rabacie 29.11 ok. ${fmt(u.wykonczenie.poRabacie)} zł. ${esc(u.wykonczenie.status)}</p>` : '';
  return `<article class="card z-unit" id="lokal-${esc(u.id)}">
    <div class="z-kicker"><span class="tag">${esc(u.id)}</span> ${u.rola === 'punkt_odniesienia' ? '<span class="tag nordic">Punkt odniesienia</span>' : ''} ${BUDGET_TAG[klasa] || ''}</div>
    <h3>${esc(u.nazwa)}</h3>
    <p class="small">${esc(u.dev)} · ${esc(u.dzielnica)}${u.adres ? ` · ${esc(u.adres)}` : ''} · ${u.pokoje ? `${u.pokoje} pok.` : 'dom'}</p>
    <p><b>${esc(statusLabel(u.dostepnosc))}</b> <span class="small">stan ${esc(u.dostepnoscData || '—')}</span></p>
    <div class="kv"><span>Lokal</span><b>${m2(u.m2)}</b></div>
    <div class="kv"><span>Ogród</span><b>${u.ogrod == null ? 'nieznany' : m2(u.ogrod)}</b></div>
    <p class="small">${esc(OGROD_TAG[u.ogrodBucket] || '')}. ${esc(u.ogrodStatus || '')}</p>
    <div class="kv"><span>Taras</span><b>${esc(u.tarasTekst || (u.taras == null ? 'niepodany' : m2(u.taras)))}</b></div>
    <div class="kv"><span>Cena lokalu</span><b>${fmt(u.cena)} zł</b></div>
    <p class="small">${esc(u.cenaStatus || '')}${u.cenaPo != null ? ` Deklaracja od 20.11: ${fmt(u.cenaPo)} zł — niepotwierdzona 6.11.` : ''}</p>
    <div class="kv"><span>zł/m² lokalu</span><b>${zl == null ? 'brak' : `${fmt(zl)} zł`}</b></div>
    <div class="kv"><span>Garaż / MP</span><b class="wrap">${esc(u.mpTekst)}</b></div>
    <div class="kv"><span>EV</span><b class="wrap">${esc(u.evTekst)}</b></div>
    <div class="kv"><span>Suma do limitu</span><span>${sumaLinia}</span></div>
    ${u.parkingUwaga ? `<p class="small">${esc(u.parkingUwaga)}</p>` : ''}
    ${u.niedozwolonyStack ? `<p class="small">Nie używać ${fmt(u.niedozwolonyStack)} zł — to lokal + 42 000 + 49 000, czyli garaż policzony dwa razy.</p>` : ''}
    <div class="kv"><span>Odbiór</span><b>${esc(u.odbiór || u.odbiórTekst || 'niepodany')}</b></div>
    ${u.odbiórUwaga ? `<p class="small">${esc(u.odbiórUwaga)}</p>` : ''}
    ${u.metro ? `<p class="small">Dojazd: ${esc(u.metro)}</p>` : ''}
    <p>${esc(u.uzasadnienie)}</p>
    <p class="small">Ryzyko: ${esc(u.ryzyka || '')}</p>
    <p>${link(u.url, 'Karta oferty')} ${u.urlAlt ? ` · ${link(u.urlAlt, 'Drugie źródło')}` : ''}</p>
    <p class="small">${esc(u.zrodlo || '')} ${esc(u.rzut || '')}</p>
    ${(raty || wykon) ? `<details><summary>Raty i wykończenie</summary>${raty}${wykon}<p class="small">Wykończenie nie wchodzi do limitu ${fmt(BUDGET)} zł.</p></details>` : ''}
  </article>`;
}

export function html(state, tabsHtml) {
  const list = filterUnits(state);
  const chip = (act, val, label) => `<button type="button" class="mktbtn${state[act] === val ? ' on' : ''}" data-zact="${act}" data-zval="${esc(val)}">${esc(label)}</button>`;
  return `
  ${tabsHtml}
  <div class="banner">Zestawienie na ${esc(UPDATED)}, Europe/Warsaw. Budżet Tomasza: ${esc(BUDGET_NOTE)} Singiel, praca biuro/hybryda, Kia Optima PHEV — liczą się lokalizacja, dojazd, spokój po pracy i ładowanie, nie szkoły. Dwa tory: prywatny zakup i osobno Domiz dla klientów. Żadna prowizja nie jest potwierdzona.</div>
  <section class="card" id="cennik-ev">
    <h3>Cennik YIT — co znaczy 49 000 zł</h3>
    <p>Odczyt PDF „${esc(NORDIC_CENNIK.dokument)}”, pozycje z <b>${esc(NORDIC_CENNIK.dataPozycji)}</b>, plik sprawdzony ${esc(NORDIC_CENNIK.odczyt)}. ${link(NORDIC_CENNIK.url, 'Historia zmiany cen (PDF)')}.</p>
    <div class="kv"><span>Garaż podziemny</span><b>42 000 zł</b></div>
    <div class="kv"><span>Garaż podziemny z gniazdem do ładowania</span><b>49 000 zł</b></div>
    <div class="kv"><span>Miejsce naziemne</span><b>29 000 zł</b></div>
    <div class="kv"><span>Motocykl w garażu</span><b>15 000 zł</b></div>
    <div class="kv"><span>Komórka / boks na jednoślad</span><b>6 800 zł/m²</b></div>
    <p>${esc(NORDIC_CENNIK.pozycja49000)} Dla G 1.01 suma z tym miejscem to <b>600 355 zł</b> (551 355 + 49 000), a z samym garażem <b>593 355 zł</b>. Obu kwot nie dodajemy. 49 000 zł nie jest urządzeniem dokładanym do 42 000. Cena lokalu jest z oferty listopada; cena miejsca jest z cennika 26.06.2026 i mogła się zmienić. Konkretne miejsce w budynku G oraz formalne ładowanie pozostają niepotwierdzone.</p>
  </section>
  <h2 class="sec">Wnioski, bez punktacji</h2>
  <div class="legend"><b>Jak czytać kolejność.</b> ${esc(KOLEJNOSC_OPIS)}</div>
  <div class="caveats">${WNIOSKI.map((t) => `<div class="card"><p>${esc(t)}</p></div>`).join('')}</div>
  <h2 class="sec">Daty</h2>
  <div class="card"><p>Spotkanie YIT: <b>${esc(SPOTKANIE_YIT.kiedy)}</b>, ${esc(SPOTKANIE_YIT.gdzie)}, lokale ${esc(SPOTKANIE_YIT.lokale)}. Status: ${esc(SPOTKANIE_YIT.status)}.</p>
  <ul class="z-list">${DATY.map((d) => `<li><b>${esc(d.kiedy)}</b> — ${esc(d.co)}</li>`).join('')}</ul></div>
  <h2 class="sec">Metro Zachód — wnioski z 2.11, nie ceny</h2>
  <div class="card">
    <p class="small">${esc(OPINIE_MZ.typ)}, ${esc(OPINIE_MZ.data)}.</p>
    <p><b>Negocjacja.</b> ${esc(OPINIE_MZ.negocjacja)}</p>
    <p><b>Zamieszkanie i odsprzedaż.</b> ${esc(OPINIE_MZ.zamieszkanie)}</p>
    <p><b>Wykończenie.</b> ${esc(OPINIE_MZ.wykonczenie)}</p>
    <p><b>Umowa.</b> ${esc(OPINIE_MZ.umowa)}</p>
  </div>
  <h2 class="sec">Domiz / dla klientów</h2>
  <div class="card"><p>${esc(WSPOLPRACA)} Mail do Develii poszedł 6.11, odpowiedzi w tej paczce nie ma. Pytania o współpracę nie są zgodą.</p></div>
  <h2 class="sec">Filtr listy</h2>
  <div class="mkt" role="group" aria-label="Tor">${chip('tor', 'dla_mnie', 'Dla mnie')}${chip('tor', 'klienci', 'Domiz / klienci')}${chip('tor', 'poza', 'Rezerwacje i leady')}${chip('tor', 'odrzut', 'Odrzucone')}${chip('tor', 'wszystkie', 'Wszystkie')}</div>
  <div class="filters">
    <label>Szukaj<input data-zkey="q" value="${esc(state.q || '')}" placeholder="np. D/37"></label>
    <label>Deweloper<select data-zkey="dev">${opts(unique('dev'), state.dev, 'wszyscy')}</select></label>
    <label>Dzielnica<select data-zkey="dzielnica">${opts(unique('dzielnica'), state.dzielnica, 'wszystkie')}</select></label>
    <label>Inwestycja<select data-zkey="inwestycja">${opts(unique('inwestycja'), state.inwestycja, 'wszystkie')}</select></label>
    <label>Pokoje<select data-zkey="pokoje">${opts(['1', '2'], state.pokoje, 'wszystkie')}</select></label>
    <label>Dostępność<select data-zkey="status">${opts(['Free', 'Wolne', 'do_potwierdzenia', 'REZERWACJA_WSTEPNA', 'REZERWACJA', 'NIEZNANA'], state.status, 'wszystkie')}</select></label>
    <label>Ogród<select data-zkey="ogrod">${opts(['potwierdzony', 'podany', 'niepotwierdzony', 'nieznany'], state.ogrod, 'wszystkie')}</select></label>
    <label>Budżet 650 tys.<select data-zkey="budzet">
      <option value="">wszystkie</option>
      <option value="tak"${state.budzet === 'tak' ? ' selected' : ''}>mieści się (znane składniki)</option>
      <option value="nie"${state.budzet === 'nie' ? ' selected' : ''}>ponad limit</option>
      <option value="brak"${state.budzet === 'brak' ? ' selected' : ''}>brak sumy</option>
      <option value="rezerwacja"${state.budzet === 'rezerwacja' ? ' selected' : ''}>rezerwacja</option>
    </select></label>
    <label>Sortuj<select data-zkey="sort">
      ${[['kolejnosc', 'Kolejność rozmowy'], ['suma', 'Suma (puste na końcu)'], ['cena', 'Cena lokalu'], ['zl', 'zł/m² lokalu'], ['ogrod', 'Ogród'], ['m2', 'Metraż'], ['nazwa', 'Nazwa']].map(([v, t]) => `<option value="${v}"${state.sort === v ? ' selected' : ''}>${t}</option>`).join('')}
    </select></label>
  </div>
  <p class="small">Widoczne: <b>${list.length}</b> z ${UNITS.length}. Suma pusta zostaje pusta. Rezerwacja nie jest statusem „wolne”. Aura nie jest „sprzedane”.</p>
  <div class="z-list-cards">${list.map(card).join('') || '<div class="card">Nic nie pasuje do filtrów.</div>'}</div>
  <h2 class="sec">Pytania, zanim cokolwiek podpiszesz</h2>
  <div class="card"><ul class="z-list">${PYTANIA.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
  <p class="small">Historyczne kawalerki i 2 pokoje z odczytu 3.11.2026 są w sąsiednich zakładkach. Tych ofert nie usuwamy. Ich stare sumy z założonym MP 40 000 zł przy Metro Zachód nie są już traktowane jako pewne — patrz ta zakładka.</p>`;
}
