import assert from 'node:assert/strict';
import test from 'node:test';
import {
    CONSENT_TEXT_VERSION,
    applyConsentLink,
    buildConsentLink,
    buildOwnerConsentFields,
    callbackDateToIso,
    consentCardStatus,
    consentForLead,
    consentListingUrl,
    consentLocation,
    defaultSmsBody,
    dialablePhone,
    formatCallNote,
    newConsentToken,
    smsComposerHref,
    stageAfterConsentLink,
    stageForCallResult,
} from '../src/pages/admin/callCardLogic.ts';

const lead = {
    id: 'lead-abc-123',
    title: 'Kawalerka z ogródkiem na Bemowie',
    location: 'ul. Lazurowa, Bemowo, Warszawa',
    price: '650 000 zł',
    areaM2: 32,
    url: 'https://www.otodom.pl/pl/oferta/kawalerka-ID123',
};

test('token ma 24 znaki z alfabetu zgody i link jest w formacie ?t=', () => {
    const token = newConsentToken();
    assert.equal(token.length, 24);
    assert.match(token, /^[A-Za-z0-9]+$/);
    assert.equal(buildConsentLink(token), `https://domizhomes.com/zgoda?t=${token}`);
});

test('SMS ma treść Tomasza i format iPhone sms:numer?&body=', () => {
    const link = buildConsentLink('abcDEF0123456789xyzXYZ12');
    const body = defaultSmsBody(link);
    assert.match(body, /Tomasz Gnat z Domiz Homes/);
    assert.match(body, /może Pan\/Pani potwierdzić bezpłatną publikację/);
    assert.ok(body.includes(link));
    const href = smsComposerHref('+48 500 100 200', body);
    assert.ok(href.startsWith('sms:+48500100200?&body='));
    assert.equal(decodeURIComponent(href.split('?&body=')[1]), body);
    assert.equal(dialablePhone('500 100 200'), '500100200');
});

test('placeholder linku w edytowanej treści jest podmieniany, bez drugiego dopisania', () => {
    const link = buildConsentLink('TokenTokenTokenToken12');
    const edited = defaultSmsBody().replace('Pozdrawiam.', 'Pozdrawiam, Tomasz.');
    const once = applyConsentLink(edited, link);
    assert.equal(once.includes(link), true);
    assert.equal(once.includes('«link»'), false);
    assert.equal(applyConsentLink(once, link), once);
});

test('wynik rozmowy przesuwa etap i zawsze ma notatkę do historii', () => {
    assert.equal(stageForCallResult('new', 'no_answer', false), 'ready_to_call');
    assert.equal(stageForCallResult('ready_to_call', 'no_answer', true), 'nurture');
    assert.equal(stageForCallResult('audit', 'callback', false), 'nurture');
    assert.equal(stageForCallResult('ready_to_call', 'interested_sms', false), 'contacted');
    assert.equal(stageForCallResult('meeting', 'interested_sms', false), 'meeting');
    assert.equal(stageForCallResult('contacted', 'refused', false), 'rejected');
    assert.equal(stageForCallResult('ready_to_call', 'agency', false), 'rejected');
    assert.equal(stageForCallResult('acquired', 'refused', false), 'acquired');
    assert.equal(stageForCallResult('consent_draft', 'no_answer', false), 'consent_draft');
    assert.equal(stageAfterConsentLink('ready_to_call'), 'contacted');
    assert.equal(stageAfterConsentLink('consent_draft'), 'consent_draft');
    assert.equal(stageAfterConsentLink('proposal'), 'proposal');
    const note = formatCallNote('no_answer', 'drugi raz', '2026-11-12');
    assert.match(note, /Nie odebrał/);
    assert.match(note, /drugi raz/);
    assert.match(note, /2026-11-12/);
    assert.equal(callbackDateToIso('2026-11-12'), '2026-11-12T09:00:00+01:00');
});

test('status zgody czyta dokument ownerConsents', () => {
    assert.equal(consentCardStatus(null), 'none');
    assert.equal(consentCardStatus({ status: 'oczekuje', expiresAt: Date.now() + 86_400_000 }), 'link_sent');
    assert.equal(consentCardStatus({ status: 'oczekuje', expiresAt: Date.now() - 1000 }), 'expired');
    assert.equal(consentCardStatus({ status: 'potwierdzona', consentSite: true, consentSocial: false }), 'confirmed_site');
    assert.equal(consentCardStatus({ status: 'potwierdzona', consentSite: true, consentSocial: true }), 'confirmed_social');
    assert.equal(consentCardStatus({ status: 'wycofana' }), 'withdrawn');
    assert.equal(consentCardStatus({ status: 'odmowa' }), 'declined');
    assert.equal(consentCardStatus({ status: 'oczekuje', expiresAt: { toMillis: () => Date.now() + 5000 } }), 'link_sent');
});

test('dokument zgody ma kształt z /admin/zgody i opcjonalne id leada, bez telefonu', () => {
    const fields = buildOwnerConsentFields(lead, true);
    assert.deepEqual(Object.keys(fields).sort(), [
        'acquisitionListingId', 'areaM2', 'consentTextVersion', 'greeting', 'listingUrl', 'location', 'pricePln', 'propertyType', 'salutation', 'status',
    ]);
    assert.equal(fields.status, 'oczekuje');
    assert.equal(fields.consentTextVersion, CONSENT_TEXT_VERSION);
    assert.equal(fields.propertyType, 'Kawalerka z ogródkiem');
    assert.equal(fields.pricePln, 650000);
    assert.equal(fields.areaM2, 32);
    assert.equal(fields.listingUrl, lead.url);
    assert.equal(fields.acquisitionListingId, lead.id);
    assert.equal(fields.greeting, '');
    assert.equal(String(fields.location).includes('500'), false);
    const legacy = buildOwnerConsentFields({ ...lead, url: 'https://olx.pl/oferta/1', location: 'Zadzwoń 500 100 200 Warszawa' }, false);
    assert.equal('acquisitionListingId' in legacy, false);
    assert.equal(legacy.listingUrl, '');
    assert.equal(legacy.location.includes('500'), false);
    assert.equal(consentListingUrl('http://www.otodom.pl/x'), '');
    assert.equal(consentLocation({ location: '', title: '' }), 'Warszawa');
});

test('zgodę da się znaleźć po id na leadzie albo po acquisitionListingId', () => {
    const consents = {
        token1: { id: 'token1', acquisitionListingId: 'other', status: 'oczekuje' },
        token2: { id: 'token2', acquisitionListingId: 'lead-1', status: 'potwierdzona' },
    };
    assert.equal(consentForLead({ id: 'lead-1', ownerConsentId: 'token1' }, consents)?.id, 'token1');
    assert.equal(consentForLead({ id: 'lead-1' }, consents)?.id, 'token2');
    assert.equal(consentForLead({ id: 'brak' }, consents), null);
});
