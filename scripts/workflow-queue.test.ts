import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildCallQueue,
    isOldUnpublishedImport,
    isPrivateAdvertiser,
    listingSourceKey,
    publishBlockReason,
    readCallPriority,
    readOpener,
    shouldCreateConsentDraft,
    stageAfterConfirmedConsent,
} from '../src/pages/admin/workflowQueue.ts';

test('priorytet 5 jest wyżej niż 1, a new z audytem wchodzi do kolejki', () => {
    const rows = buildCallQueue([
        { id: 'a', stage: 'new', title: 'A', auditSummary: 'Priorytet: 1\nZagajenie: cicho', createdAt: '2026-11-01' },
        { id: 'b', stage: 'new', title: 'B', auditData: { callPriority: 5, contactAngle: 'Dzień dobry' }, createdAt: '2026-11-02' },
        { id: 'c', stage: 'ready_to_call', title: 'C', createdAt: '2026-11-03' },
        { id: 'd', stage: 'new', title: 'bez audytu', createdAt: '2026-11-09' },
    ], new Date('2026-11-10T12:00:00Z'));
    assert.deepEqual(rows.map((row) => row.lead.id), ['b', 'a', 'c']);
    assert.equal(rows[0].opener, 'Dzień dobry');
    assert.equal(rows[1].opener, 'cicho');
    assert.equal(readCallPriority({ id: 'x', auditSummary: 'Priorytet 4/5' }), 4);
});

test('obniżka ceny wyprzedza nowszy lead o tym samym priorytecie', () => {
    const rows = buildCallQueue([
        { id: 'new', stage: 'ready_to_call', callPriority: 3, createdAt: '2026-11-09', price: '500000' },
        { id: 'drop', stage: 'ready_to_call', callPriority: 3, createdAt: '2026-11-01', price: '400 000 zł', sourceDetails: { previousPricePln: 500000 } },
    ], new Date('2026-11-10T12:00:00Z'));
    assert.deepEqual(rows.map((row) => row.lead.id), ['drop', 'new']);
});

test('oddzwonienie po terminie i nurture bez właściciela po 14 dniach', () => {
    const rows = buildCallQueue([
        { id: 'late', stage: 'nurture', callbackAt: '2026-11-01T09:00:00+01:00', ownerName: 'Anna', ownerPhone: '500100200' },
        { id: 'stale', stage: 'nurture', updatedAt: '2026-10-01T00:00:00Z' },
        { id: 'fresh', stage: 'nurture', updatedAt: '2026-11-09T00:00:00Z' },
    ], new Date('2026-11-10T12:00:00Z'));
    assert.deepEqual(rows.map((row) => `${row.lead.id}:${row.kind}`), ['late:callback', 'stale:stale']);
});

test('filtr prywatnych łapie private, prywatny i osobę prywatną', () => {
    assert.equal(isPrivateAdvertiser('private'), true);
    assert.equal(isPrivateAdvertiser('Prywatny'), true);
    assert.equal(isPrivateAdvertiser('osoba prywatna'), true);
    assert.equal(isPrivateAdvertiser('biuro'), false);
    assert.equal(listingSourceKey({ source: 'kazo', url: '' }), 'kazo');
    assert.equal(listingSourceKey({ source: '', url: 'https://adresowo.pl/o/1' }), 'adresowo');
    assert.equal(listingSourceKey({ source: 'otodom', url: 'https://www.otodom.pl/x' }), 'Otodom');
});

test('potwierdzona zgoda na stronę tworzy szkic, a publikacja bez zgody jest zablokowana', () => {
    const lead = { id: 'lead', stage: 'contacted' };
    assert.equal(shouldCreateConsentDraft(lead, { status: 'potwierdzona', consentSite: true }), true);
    assert.equal(shouldCreateConsentDraft({ ...lead, draftPropertyId: '1' }, { status: 'potwierdzona', consentSite: true }), false);
    assert.equal(shouldCreateConsentDraft(lead, { status: 'oczekuje', consentSite: true }), false);
    assert.equal(stageAfterConfirmedConsent('contacted'), 'consent_draft');
    assert.equal(stageAfterConfirmedConsent('acquired'), 'acquired');
    assert.equal(publishBlockReason(null), 'Brak powiązanej zgody właściciela na publikację na stronie.');
    assert.equal(publishBlockReason({ status: 'potwierdzona', consentSite: false }), 'Właściciel nie zaznaczył zgody na publikację na stronie.');
    assert.equal(publishBlockReason({ status: 'potwierdzona', consentSite: true }), null);
});

test('stare nieopublikowane importy Bakowskiego są rozpoznawane po biurze źródłowym, nie po id', () => {
    assert.equal(isOldUnpublishedImport({ published: false, sourceAgency: 'Bąkowski Nieruchomości', importedAt: '2026-06-22T16:07:30.442Z' }), true);
    assert.equal(isOldUnpublishedImport({ published: false, sourceUrl: 'https://bakowskinieruchomosci.pl/oferta' }), true);
    assert.equal(isOldUnpublishedImport({ published: true, sourceAgency: 'Bąkowski Nieruchomości' }), false);
    assert.equal(isOldUnpublishedImport({ published: false, source: 'reczny', createdAt: '2026-11-01' }), false);
    assert.equal(readOpener({ id: 'z', auditSummary: 'Priorytet: 2\nZagajenie: Proszę o chwilę.' }), 'Proszę o chwilę.');
});
