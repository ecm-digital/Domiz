import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { OFFERS } from '../public/kawalerki-z-ogrodkiem/katalog.js';

const banned = ['SK-A224', 'SK-A225', 'NBIII-L1110', 'NB-G103', 'MOI-C2M7'];

test('publiczny katalog ma wyłącznie 30 kawalerek bez rezerwacji i archiwum', () => {
  assert.equal(OFFERS.length, 30);
  assert.equal(OFFERS.filter((o) => o.city === 'Warszawa').length, 27);
  assert.equal(OFFERS.filter((o) => o.city === 'Katowice').length, 3);
  assert.equal(OFFERS.filter((o) => o.status === 'wg_zrodla').length, 26);
  assert.equal(OFFERS.filter((o) => o.status === 'do_potwierdzenia').length, 4);
  assert.deepEqual(OFFERS.filter((o) => o.status === 'do_potwierdzenia').map((o) => o.id).sort(), ['MZ-B2', 'MZ-B41', 'MZ-D37', 'MZ-D82']);
  for (const id of banned) assert.equal(OFFERS.some((o) => o.id === id), false, id);
  const blob = JSON.stringify(OFFERS);
  assert.doesNotMatch(blob, /rezerwac|archiw|Kamil|@|PESEL|telefon/i);
  const g = OFFERS.find((o) => o.id === 'NB-G101');
  assert.equal(g.garden, null);
  assert.match(g.parking, /LUB/);
  assert.doesNotMatch(g.parking, /42000 \+ 49000|42000\+49000/);
  const lumea = OFFERS.find((o) => o.id === 'WT-ID4DGHP');
  assert.equal(lumea.garden, null);
  assert.equal(lumea.combined, 36.64);
  assert.ok(OFFERS.every((o) => o.price != null && /^https:\/\//.test(o.url)));
});

test('skrypty katalogu nie zależą od ukośnika na końcu adresu', () => {
  const html = readFileSync(new URL('../public/kawalerki-z-ogrodkiem/index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../public/kawalerki-z-ogrodkiem/app.js', import.meta.url), 'utf8');
  assert.match(html, /src="\/kawalerki-z-ogrodkiem\/app\.js"/);
  assert.match(app, /from '\/kawalerki-z-ogrodkiem\/katalog\.js'/);
  assert.doesNotMatch(html, /src="\.\/app\.js"/);
  const bare = new URL('http://127.0.0.1/kawalerki-z-ogrodkiem');
  const slashed = new URL('http://127.0.0.1/kawalerki-z-ogrodkiem/');
  assert.equal(new URL('/kawalerki-z-ogrodkiem/app.js', bare).pathname, '/kawalerki-z-ogrodkiem/app.js');
  assert.equal(new URL('/kawalerki-z-ogrodkiem/app.js', slashed).pathname, '/kawalerki-z-ogrodkiem/app.js');
  assert.equal(new URL('./app.js', bare).pathname, '/app.js');
  const moduleUrl = new URL('http://127.0.0.1/kawalerki-z-ogrodkiem/app.js');
  assert.equal(new URL('/kawalerki-z-ogrodkiem/katalog.js', moduleUrl).pathname, '/kawalerki-z-ogrodkiem/katalog.js');
});
