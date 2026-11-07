import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNITS, BUDGET, NORDIC_CENNIK, budzetKlasa, filterUnits, cenaZaM2, nordicSumy,
} from '../public/admin/kawalerki/zestawienie.js';
import { WTORNY_UNITS } from '../public/admin/kawalerki/wtorny.js';
import { html, fmt } from '../public/admin/kawalerki/view.js';
import * as historical from '../public/admin/kawalerki/data.js';

const byId = (id) => UNITS.find((u) => u.id === id);
const base = { tor: 'wszystkie', rynek: '', miasto: '', dev: '', dzielnica: '', inwestycja: '', pokoje: '', status: '', ogrod: '', budzet: '', sort: 'kolejnosc', dir: 1, q: '' };

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
  const wLimicie = filterUnits({ ...base, miasto: 'Warszawa', tor: 'dla_mnie', rynek: 'pierwotny', budzet: 'tak' }).map((u) => u.id);
  assert.deepEqual(wLimicie, ['NB-G101', 'SV-C16', 'BV-C2F44', 'BV-C2D04', 'BV-C5D95']);
  assert.ok(filterUnits({ ...base, budzet: 'tak' }).every((u) => u.suma != null && u.suma <= BUDGET));
  assert.ok(filterUnits({ ...base, budzet: 'brak' }).every((u) => u.suma == null));
  const dwa = filterUnits({ ...base, miasto: 'Warszawa', pokoje: '2' }).map((u) => u.id);
  assert.deepEqual(dwa.sort(), ['MOI-C2M7', 'NB-G103', 'WT-ID4Dvkv']);
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

test('wtórna Warszawa: puste parkingi nie wchodzą do limitu, 659 tys. jest ponad', () => {
  const g101 = byId('NB-G101');
  assert.equal(g101.ogrod, 5.56);
  assert.equal(g101.ogrodBucket, 'niepotwierdzony');
  assert.equal(WTORNY_UNITS.length, 15);
  const dpi = byId('WT-ID4Dpi4');
  assert.equal(dpi.m2, 33.1);
  assert.equal(dpi.ogrod, 25);
  assert.match(dpi.ogrodStatus, /nie z rzutu/);
  assert.match(dpi.ogrodStatus, /33,1 m² to metraż mieszkania/);
  assert.equal(dpi.suma, 659000);
  assert.equal(budzetKlasa(dpi), 'nie');
  for (const id of ['WT-ID4DGHP', 'WT-ID4wZGj', 'WT-ID4CONP', 'WT-ID4DSsk', 'WT-ID4ydIW', 'WT-ID4DDtY', 'WT-ID4CUe7']) {
    assert.equal(byId(id).suma, null, id);
    assert.notEqual(budzetKlasa(byId(id)), 'tak', id);
  }
  assert.equal(budzetKlasa(byId('WT-ID4wZGj')), 'brak');
  assert.equal(budzetKlasa(byId('WT-ID4CY3i')), 'nie');
  assert.equal(byId('WT-ID4CY3i').suma, null);
  assert.equal(budzetKlasa(byId('WT-ID4Dvkv')), 'nie');
  assert.equal(byId('WT-ID4Dvkv').suma, 710000);
  assert.equal(byId('WT-ID4DANN').suma, 590881);
  assert.equal(byId('WT-ID4DANN').pokoje, 1);
  assert.match(byId('WT-ID4DANN').odbiórTekst, /cesja/);
  assert.equal(byId('WT-ID4DLdc').suma, 452430);
  assert.match(byId('WT-ID4DLdc').ogrodStatus, /wyłączne korzystanie/);
  assert.match(byId('WT-ID4DLdc').ogrodStatus, /nie wpis w księdze/);
  assert.equal(byId('WT-ID4DA8t').pokoje, null);
  assert.equal(budzetKlasa(byId('WT-ID4DA8t')), 'weryfikacja');
  assert.equal(budzetKlasa(byId('WT-ID4yN2E')), 'weryfikacja');
  assert.match(byId('WT-ID4DGHP').ogrodStatus, /łącznie/);
  assert.match(byId('WT-ID4DGHP').uzasadnienie, /skleić z ID4DGHP/);
  const wtornyLimit = filterUnits({ ...base, miasto: 'Warszawa', rynek: 'wtórny', budzet: 'tak' }).map((u) => u.id);
  assert.deepEqual(wtornyLimit, ['WT-ID4DLdc', 'WT-ID4DKcM', 'WT-ID4DANN']);
  assert.ok(filterUnits({ ...base, miasto: 'Warszawa', rynek: 'pierwotny' }).every((u) => u.rynek === 'pierwotny' && !String(u.id).startsWith('KT-')));
  assert.equal(filterUnits({ ...base, miasto: 'Warszawa', rynek: 'wtórny', status: 'OGLOSZENIE' }).length, 15);
  assert.match(byId('WT-ID4DGHP').uzasadnienie, /nie zakładam, że miejsce da się dokupić/);
  assert.doesNotMatch(byId('WT-ID4DGHP').uzasadnienie, /Kamil/);
  const page = html({ ...base, rynek: 'wtórny', tor: 'dla_mnie' }, '<div class="settabs"></div>');
  assert.match(page, /noopener noreferrer nofollow/);
  assert.match(page, /https:\/\/www\.otodom\.pl\/pl\/oferta\/ID4Dpi4/);
  assert.match(page, /659/);
  assert.doesNotMatch(page, /Kamila|@|PESEL|BIK/);
  assert.equal(byId('WT-ID4DGHP').miasto, 'Warszawa');
});

test('Katowice: miasto, cennik garażu i puste MP', () => {
  const b4 = byId('KT-CP-B4B04');
  assert.equal(b4.miasto, 'Katowice');
  assert.equal(b4.suma, 491765.77);
  assert.equal(budzetKlasa(b4), 'tak');
  assert.match(b4.mpTekst, /nie jest dowód/);
  assert.match(b4.odbiórTekst, /nie pozwolenie/);
  assert.equal(byId('KT-CP-B6A07').suma, 405352.32);
  assert.equal(byId('KT-CP-B6A06').suma, 497738.62);
  const b5 = byId('KT-CP-B5A12');
  assert.equal(b5.cena, 548012.02);
  assert.equal(b5.suma, 586011.82);
  assert.equal(budzetKlasa(b5), 'cena');
  assert.match(b5.cenaStatus, /526 002,02/);
  const inspire = byId('KT-WT-ID4Aufs');
  assert.equal(inspire.suma, 560000);
  assert.match(inspire.sumaStatus, /12 000/);
  assert.match(inspire.odbiórTekst, /Cesja nie byłaby/);
  const ligocka = byId('KT-PI-ID4CYTg');
  assert.equal(ligocka.ogrod, 60.8);
  assert.equal(ligocka.taras, 6.3);
  assert.equal(ligocka.suma, null);
  assert.equal(budzetKlasa(ligocka), 'brak');
  const francuska = byId('KT-WT-ID4CNI6');
  assert.equal(francuska.ogrod, null);
  assert.equal(francuska.ogrodBucket, 'laczny');
  assert.equal(francuska.suma, 655000);
  assert.equal(budzetKlasa(francuska), 'nie');
  const noho = byId('KT-WT-ID4xTAt');
  assert.equal(noho.suma, 657700);
  assert.equal(budzetKlasa(noho), 'nie');
  assert.match(noho.zrodlo, /Faktura VAT/);
  const bezMp = ['KT-WT-ID4BO1Z', 'KT-PI-ID4CYTg', 'KT-WT-ID4BGWE', 'KT-WT-ID4Clsa', 'KT-PI-ID4CAEh'];
  for (const id of bezMp) {
    assert.equal(byId(id).suma, null, id);
    assert.notEqual(budzetKlasa(byId(id)), 'tak', id);
  }
  const katLimit = filterUnits({ ...base, miasto: 'Katowice', budzet: 'tak' }).map((u) => u.id);
  assert.deepEqual(katLimit.sort(), ['KT-CP-B4B04', 'KT-CP-B6A06', 'KT-CP-B6A07', 'KT-WT-ID4Aufs']);
  assert.ok(filterUnits({ ...base, miasto: 'Warszawa' }).every((u) => !String(u.id).startsWith('KT-')));
  assert.equal(filterUnits({ ...base, miasto: 'Katowice', rynek: 'pierwotny' }).length, 6);
  assert.equal(filterUnits({ ...base, miasto: 'Katowice', rynek: 'wtórny' }).length, 6);
  const page = html({ ...base, miasto: 'Katowice', tor: 'dla_mnie' }, '<div class="settabs"></div>');
  assert.match(page, /Ceglana Park/);
  assert.match(page, /noopener noreferrer nofollow/);
  assert.doesNotMatch(page, /600 355/);
  assert.match(html({ ...base, miasto: 'Warszawa' }, '<div></div>'), /600 355/);
});

test('historyczne oferty z 3.11 zostają w data.js', () => {
  const names = historical.UNITS.map((u) => u.name);
  assert.ok(names.some((n) => n.includes('G 1.01')));
  assert.ok(names.some((n) => n.includes('D/37')));
  assert.ok(names.some((n) => n.includes('F/31')));
  assert.equal(historical.BUDGET, 650000);
  assert.ok(historical.SET2.UNITS.length > 10);
});
