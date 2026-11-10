import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const TOKEN = 'CallCardToken0000000001';
const ADMIN = 'admin-call-card';
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const consentFields = {
  salutation: '',
  greeting: '',
  propertyType: 'Mieszkanie',
  location: 'ul. Lazurowa, Bemowo, Warszawa',
  areaM2: 48,
  pricePln: 890000,
  listingUrl: 'https://www.otodom.pl/pl/oferta/mieszkanie-ID1',
  consentTextVersion: 'zgoda-v2-2026-11-10',
  status: 'oczekuje',
  createdAt: serverTimestamp(),
  expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-domiz-callcard',
  firestore: { rules, host: '127.0.0.1', port: 8080 },
});

try {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admins', ADMIN), { role: 'admin' });
  });

  const admin = testEnv.authenticatedContext(ADMIN).firestore();
  const stranger = testEnv.authenticatedContext('not-an-admin').firestore();
  const guest = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(setDoc(doc(admin, 'ownerConsents', TOKEN), {
    ...consentFields,
    acquisitionListingId: 'lead-bemowo-1',
  }));

  const legacyToken = 'LegacyConsentToken00001';
  const legacy = { ...consentFields };
  delete legacy.acquisitionListingId;
  await assertSucceeds(setDoc(doc(admin, 'ownerConsents', legacyToken), legacy));

  await assertFails(setDoc(doc(admin, 'ownerConsents', 'PhoneInLocationToken001'), {
    ...consentFields,
    location: 'Zadzwoń 500 100 200 Warszawa',
    acquisitionListingId: 'lead-bemowo-1',
  }));

  await assertFails(setDoc(doc(stranger, 'ownerConsents', 'StrangerToken0000000001'), {
    ...consentFields,
    acquisitionListingId: 'lead-bemowo-1',
  }));

  await assertSucceeds(getDoc(doc(guest, 'ownerConsents', TOKEN)));
  const saved = await getDoc(doc(admin, 'ownerConsents', TOKEN));
  assert.equal(saved.data().acquisitionListingId, 'lead-bemowo-1');
  assert.equal(saved.data().status, 'oczekuje');
  assert.equal(saved.data().ownerPhone, undefined);

  await assertFails(getDoc(doc(guest, 'acquisitionListings', 'lead-bemowo-1')));

  const now = new Date().toISOString();
  await assertSucceeds(setDoc(doc(admin, 'acquisitionListings', 'lead-bemowo-1'), {
    title: 'Mieszkanie Bemowo',
    stage: 'ready_to_call',
    ownerPhone: '+48500100200',
    createdAt: now,
  }));
  await assertSucceeds(updateDoc(doc(admin, 'acquisitionListings', 'lead-bemowo-1'), {
    callResult: 'no_answer',
    callbackAt: '2026-11-12T09:00:00+01:00',
    lastCallAt: now,
    ownerConsentId: TOKEN,
    stage: 'nurture',
    stageHistory: [{
      id: 'hist-1',
      stage: 'nurture',
      label: 'Wrócić później',
      note: 'Wynik rozmowy: Nie odebrał.',
      createdAt: now,
      author: 'tomasz@domizhomes.com',
    }],
    updatedAt: now,
  }));
  const lead = await getDoc(doc(admin, 'acquisitionListings', 'lead-bemowo-1'));
  assert.equal(lead.data().callResult, 'no_answer');
  assert.equal(lead.data().ownerConsentId, TOKEN);
  assert.equal(lead.data().ownerPhone, '+48500100200');
  assert.equal(lead.data().stageHistory.length, 1);

  await assertFails(updateDoc(doc(guest, 'acquisitionListings', 'lead-bemowo-1'), { stage: 'rejected' }));
  console.log('owner-consent rules: ok');
} finally {
  await testEnv.cleanup();
}
