import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { GARDEN_OFFERS, gardenStudioProperties } from '../src/data/gardenOffers.js';

const banned = ['SK-A224', 'SK-A225', 'NBIII-L1110', 'NB-G103', 'MOI-C2M7'];

test('lista ofert dostaje wyłącznie 30 kawalerek bez rezerwacji i archiwum', () => {
  assert.equal(GARDEN_OFFERS.length, 30);
  assert.equal(GARDEN_OFFERS.filter((o) => o.city === 'Warszawa').length, 27);
  assert.equal(GARDEN_OFFERS.filter((o) => o.city === 'Katowice').length, 3);
  assert.equal(GARDEN_OFFERS.filter((o) => o.status === 'wg_zrodla').length, 26);
  assert.equal(GARDEN_OFFERS.filter((o) => o.status === 'do_potwierdzenia').length, 4);
  assert.deepEqual(GARDEN_OFFERS.filter((o) => o.status === 'do_potwierdzenia').map((o) => o.id).sort(), ['MZ-B2', 'MZ-B41', 'MZ-D37', 'MZ-D82']);
  for (const id of banned) assert.equal(GARDEN_OFFERS.some((o) => o.id === id), false, id);
  const blob = JSON.stringify(GARDEN_OFFERS);
  assert.doesNotMatch(blob, /rezerwac|archiw|Kamil|@|PESEL|telefon/i);
  const g = GARDEN_OFFERS.find((o) => o.id === 'NB-G101');
  assert.equal(g.garden, null);
  assert.equal(g.price, 551355);
  assert.match(g.parking, /LUB/);
  assert.doesNotMatch(g.parking, /42000 \+ 49000|42000\+49000|642355/);
  const lumea = GARDEN_OFFERS.find((o) => o.id === 'WT-ID4DGHP');
  assert.equal(lumea.garden, null);
  assert.equal(lumea.combined, 36.64);
  assert.equal(lumea.parking, null);
  assert.ok(GARDEN_OFFERS.every((o) => o.price != null && /^https:\/\//.test(o.url)));

  const cards = gardenStudioProperties();
  assert.equal(cards.length, 30);
  assert.equal(new Set(cards.map((card) => card.id)).size, 30);
  assert.ok(cards.every((card) => card.image === '/configurator/placeholder.svg'));
  assert.ok(cards.every((card) => card.baths === null && card.review && card.type === 'mieszkanie'));
  assert.ok(cards.every((card) => card._staticPreview === true && card.sourceUrl == null && card.agent.name !== 'Tomasz Gnat'));
  assert.equal(cards.filter((card) => card.review.city === 'Katowice').length, 3);
  const joined = JSON.stringify(cards);
  assert.doesNotMatch(joined, /salon\.jpg|Tomasz Gnat|517 303 400|642355/);
  const nordic = cards.find((card) => card.review.code === 'NB-G101');
  assert.equal(nordic.price, 551355);
  assert.match(nordic.review.parking, /nieustalone|niepotwierdzony|LUB/);
  assert.equal(nordic.id, Number(String(nordic.title).split('-').pop()) || nordic.id);
  assert.equal(String(nordic.id), `${nordic.title}-${nordic.id}`.split('-').pop());
});

test('stary adres prowadzi do listy ofert ze slashem i bez', async () => {
  const html = readFileSync(new URL('../public/kawalerki-z-ogrodkiem/index.html', import.meta.url), 'utf8');
  assert.match(html, /location\.replace\("\/oferty\?katalog=kawalerki"\)/);
  assert.match(html, /url=\/oferty\?katalog=kawalerki/);
  assert.doesNotMatch(html, /src="\.\/|\.\/app\.js|katalog\.js/);
  const bare = new URL('http://127.0.0.1/kawalerki-z-ogrodkiem');
  const slashed = new URL('http://127.0.0.1/kawalerki-z-ogrodkiem/');
  assert.equal(new URL('/oferty?katalog=kawalerki', bare).pathname, '/oferty');
  assert.equal(new URL('/oferty?katalog=kawalerki', slashed).pathname, '/oferty');

  const server = createServer((req, res) => {
    const path = req.url.split('?')[0];
    if (path === '/kawalerki-z-ogrodkiem/') {
      res.writeHead(301, { Location: '/kawalerki-z-ogrodkiem' });
      res.end();
      return;
    }
    if (path === '/kawalerki-z-ogrodkiem') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    res.writeHead(404);
    res.end('missing');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    for (const path of ['/kawalerki-z-ogrodkiem', '/kawalerki-z-ogrodkiem/']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: 'follow' });
      assert.equal(response.status, 200, path);
      const body = await response.text();
      assert.match(body, /location\.replace\("\/oferty\?katalog=kawalerki"\)/);
      assert.doesNotMatch(body, /\.\/app\.js/);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
