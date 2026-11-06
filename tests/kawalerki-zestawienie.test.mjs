import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNITS, BUDGET, NORDIC_CENNIK, budzetKlasa, filterUnits, cenaZaM2, nordicSumy,
} from '../public/admin/kawalerki/zestawienie.js';
import { html, fmt } from '../public/admin/kawalerki/view.js';
import * as historical from '../public/admin/kawalerki/data.js';

const byId = (id) => UNITS.find((u) => u.id === id);
const base = { tor: 'wszystkie', dev: '', dzielnica: '', inwestycja: '', pokoje: '', status: '', ogrod: '', budzet: '', sort: 'kolejnosc', dir: 1, q: '' };

test('cennik 49 000 to pełne miejsce z gniazdem, a 600 355 to lokal plus ta pozycja', () => {
  assert.equal(NORDIC_CENNIK.garazPodziemny, 42000);
  assert.equal(NORDIC_CENNIK.garazPodziemnyZGniazdem, 49000);
  assert.match(NORDIC_CENNIK.pozycja49000, /pełna cena/);
  assert.match(NORDIC_CENNIK.pozycja49000, /nie dopłata do garażu 42 000/);
  const g = byId('NB-G101');
  assert.equal(g.cena, 551355);
  assert.deepEqual(nordicSumy(551355), { zGarazem: 593355, zGniazdem: 600355 });
  assert.equal(g.suma, 600355);
  assert.equal(g.sumaPorownawcza, 593355);
  assert.equal(g.niedozwolonyStack, 642355);
  assert.equal(budzetKlasa(g), 'tak');
});

test('H1 i G 1.03 nie używają stosu 42+49, a H1 nie mieści się w limicie', () => {
  const h = byId('NB-H1106');
  assert.equal(h.suma, 634983 + 49000);
  assert.equal(h.sumaPorownawcza, 634983 + 42000);
  assert.equal(h.niedozwolonyStack, 634983 + 42000 + 49000);
  assert.equal(budzetKlasa(h), 'nie');
  const g3 = byId('NB-G103');
  assert.equal(g3.suma, 839324 + 49000);
  assert.notEqual(g3.suma, 839324 + 42000 + 49000);
  assert.equal(budzetKlasa(g3), 'nie');
});

test('Myśliborska i Metro Zachód mają sumę null, nie zero', () => {
  for (const id of ['MOI-C1M1', 'MOI-C2M7', 'MZ-B2', 'MZ-D82', 'MZ-B41', 'MZ-D37']) {
    const u = byId(id);
    assert.equal(u.suma, null, id);
    assert.equal(u.mpLiczba ?? null, null, id);
    assert.equal(budzetKlasa(u), 'brak', id);
  }
  assert.match(byId('MOI-C2M7').mpTekst, /Nie przenosić/);
  assert.match(byId('MZ-D37').mpTekst, /40 000/);
  assert.match(byId('MZ-D37').mpTekst, /Nie wstawiać/);
});

test('rezerwacje nie są wolne, Aura nie jest sprzedana, ogród null nie jest zerem', () => {
  for (const id of ['SK-A224', 'SK-A225']) {
    assert.equal(byId(id).dostepnosc, 'REZERWACJA_WSTEPNA');
    assert.equal(budzetKlasa(byId(id)), 'rezerwacja');
    assert.equal(byId(id).suma, null);
  }
  for (const id of ['SM-FA0005', 'SM-FA0007']) {
    assert.equal(byId(id).dostepnosc, 'REZERWACJA');
    assert.equal(byId(id).ogrod, null);
    assert.equal(budzetKlasa(byId(id)), 'rezerwacja');
  }
  const aura = byId('AM-38');
  assert.equal(aura.dostepnosc, 'NIEZNANA');
  assert.equal(aura.suma, null);
  assert.equal(aura.ogrod, null);
  assert.match(aura.sumaStatus, /nie jest status „sprzedane”/);
  assert.match(aura.uzasadnienie, /niepotwierdzony/);
});

test('taras nie jest doliczany do ogrodu, a zł/m² liczy sam lokal', () => {
  const d = byId('MZ-D37');
  assert.equal(d.ogrod, 29.54);
  assert.equal(d.taras, 4.22);
  assert.equal(cenaZaM2(d.cena, d.m2), 19000);
  assert.equal(cenaZaM2(551355, 25.23), 21853);
  assert.equal(cenaZaM2(523966.71, 25.56), 20499);
  assert.notEqual(d.ogrod, d.ogrod + d.taras);
});

test('raty Metro Zachód schodzą się z ceną po 20.11 i nie mają dnia miesiąca', () => {
  const d = byId('MZ-D37');
  assert.equal(d.harmonogram.w5 + d.harmonogram.w25 + d.harmonogram.w70, 554328);
  assert.equal(d.harmonogram.baza, 554329);
  assert.match(d.harmonogram.bazaOpis, /554 329/);
  assert.equal(d.cenaPo, 554329);
  assert.equal(d.wykonczenie.dzis, 96996);
  assert.ok(d.wykonczenie.status.includes('Poza limitem'));
});

test('filtr budżetu, pokoi i statusu', () => {
  const wLimicie = filterUnits({ ...base, tor: 'dla_mnie', budzet: 'tak' }).map((u) => u.id);
  assert.deepEqual(wLimicie, ['NB-G101', 'SV-C16', 'BV-C2F44', 'BV-C2D04', 'BV-C5D95']);
  assert.ok(filterUnits({ ...base, budzet: 'tak' }).every((u) => u.suma != null && u.suma <= BUDGET));
  assert.ok(filterUnits({ ...base, budzet: 'brak' }).every((u) => u.suma == null));
  const dwa = filterUnits({ ...base, pokoje: '2' }).map((u) => u.id);
  assert.deepEqual(dwa.sort(), ['MOI-C2M7', 'NB-G103']);
  const rez = filterUnits({ ...base, status: 'REZERWACJA_WSTEPNA' });
  assert.equal(rez.length, 2);
  assert.ok(rez.every((u) => u.dostepnosc !== 'Wolne' && u.dostepnosc !== 'Free'));
});

test('widok nie zawiera kontaktów handlowców ani stosu jako sumy do limitu', () => {
  const page = html(base, '<div class="settabs"></div>');
  assert.match(page, /600[\s\u00a0\u202f]355/);
  assert.match(page, /Nie używać/);
  assert.match(page, /brak sumy/);
  assert.match(page, /Rezerwacja wstępna — nie wolne/);
  assert.match(page, /nie sprzedane/);
  assert.doesNotMatch(page, /@/);
  assert.doesNotMatch(page, /Paulina|PESEL|BIK|800 123 123|800 800 948/);
  assert.doesNotMatch(page, /\/workspace\/finanse/);
  assert.equal(fmt(600355).replace(/\s/g, ''), '600355');
});

test('historyczne oferty z 3.11 zostają w data.js', () => {
  const names = historical.UNITS.map((u) => u.name);
  assert.ok(names.some((n) => n.includes('G 1.01')));
  assert.ok(names.some((n) => n.includes('D/37')));
  assert.ok(names.some((n) => n.includes('F/31')));
  assert.equal(historical.BUDGET, 650000);
  assert.ok(historical.SET2.UNITS.length > 10);
});
