import { useState } from 'react';
import { AdminTabBar } from './AdminTabBar';
import { CallQueuePanel } from './CallQueuePanel';
import { AcquisitionCallCard } from './AcquisitionCallCard';
import { buildCallQueue, isOldUnpublishedImport } from './workflowQueue';
import './AdminDashboard.css';
import './admin-theme.css';

const NOW = new Date('2026-11-10T12:00:00Z');
const LEADS = [
    { id: 'mokotow', stage: 'new', title: '3 pokoje, Mokotów', location: 'ul. Puławska, Warszawa', price: '1 240 000 zł', ownerPhone: '+48 500 100 200', createdAt: '2026-11-09T08:00:00Z', auditData: { callPriority: 5, contactAngle: 'Dzień dobry, dzwonię w sprawie ogłoszenia na Puławskiej — mam jedną konkretną uwagę do zdjęć.' }, auditSummary: 'Priorytet: 5' },
    { id: 'wola', stage: 'ready_to_call', title: 'Kawalerka, Wola', location: 'ul. Wolska, Warszawa', price: '690 000 zł', ownerPhone: '+48 501 200 300', createdAt: '2026-11-08T08:00:00Z', callPriority: 3, auditSummary: 'Gotowe do kontaktu' },
    { id: 'praga', stage: 'new', title: '2 pokoje po obniżce, Praga', location: 'ul. Stalowa, Warszawa', price: '820 000 zł', url: 'https://www.otodom.pl/pl/oferta/praga-przyklad', createdAt: '2026-11-02T08:00:00Z', sourceDetails: { previousPricePln: 910000, advertiserType: 'private' }, auditSummary: 'Priorytet: 4\nZagajenie: Cena spadła o 90 tysięcy — pytam, czy to dobry moment na rozmowę.' },
    { id: 'late', stage: 'nurture', title: 'Dom, Wawer', location: 'Wawer', price: '1 800 000 zł', ownerName: 'Jan', ownerPhone: '+48 502 300 400', callbackAt: '2026-11-01T09:00:00+01:00', createdAt: '2026-10-20T08:00:00Z' },
    { id: 'stale', stage: 'nurture', title: 'Działka bez właściciela', location: 'Zielonka', price: '450 000 zł', updatedAt: '2026-10-01T08:00:00Z', createdAt: '2026-09-01T08:00:00Z' },
];

const OFFERS = [
    { id: 1, title: 'Szkic po zgodzie — Bemowo', location: 'Bemowo', price: 890000, published: false, sourceAgency: '' },
    { id: 2, title: 'Dom 130 m² — Orzesze', location: 'Orzesze', price: 499000, published: false, sourceAgency: 'Bąkowski Nieruchomości', importedAt: '2026-06-22T16:07:30.442Z' },
];

export const WorkflowPreview = () => {
    const [moreOpen, setMoreOpen] = useState(true);
    const [tab, setTab] = useState<'dashboard' | 'offers' | 'leads' | 'acquisition' | 'estates' | 'presentation' | 'proposals' | 'agreements' | 'clientAccounts' | 'videos' | 'settings'>('dashboard');
    const [showOld, setShowOld] = useState(false);
    const rows = buildCallQueue(LEADS, NOW);
    const visibleOffers = showOld ? OFFERS : OFFERS.filter((item) => !isOldUnpublishedImport(item));
    return (
        <div className="app app--admin" style={{ minHeight: '100vh', padding: '0.75rem' }}>
            <p className="admin-dashboard__eyebrow">PODGLĄD Z DANYMI PRZYKŁADOWYMI — NIC NIE ZAPISUJE SIĘ W BAZIE</p>
            <AdminTabBar
                activeTab={tab}
                presentationMode="agency"
                counts={{ offers: OFFERS.length, leads: 2, acquisition: LEADS.length, proposals: 1, agreements: 0 }}
                ownerLeadCount={0}
                moreOpen={moreOpen}
                onToggleMore={() => setMoreOpen((open) => !open)}
                onTab={setTab}
                onPresentation={() => { setMoreOpen(false); setTab('presentation'); }}
            />
            {tab === 'dashboard' && <CallQueuePanel rows={rows} onOpenCall={() => setTab('acquisition')} />}
            {tab === 'offers' && (
                <section className="glass-panel admin-offers" style={{ padding: '1rem' }}>
                    <div className="admin-offers__toolbar">
                        <button type="button" aria-pressed={showOld} onClick={() => setShowOld((value) => !value)}>{showOld ? 'Ukryj stare importy' : `Pokaż stare importy (${OFFERS.length - visibleOffers.length})`}</button>
                    </div>
                    <ul>
                        {visibleOffers.map((offer) => <li key={offer.id}><strong>{offer.title}</strong> — {offer.published ? 'opublikowana' : 'szkic'}</li>)}
                    </ul>
                </section>
            )}
            {tab === 'acquisition' && (
                <section>
                    <p><strong>Etap po zgodzie:</strong> Zgoda — szkic oferty. Publikacja zablokowana bez zgody na stronę. Instagram tylko przy zgodzie social.</p>
                    <AcquisitionCallCard
                        lead={{ id: 'mokotow', title: '3 pokoje, Mokotów', ownerName: 'Anna', ownerPhone: '+48 500 100 200' }}
                        consent={{ id: 'podglad', status: 'potwierdzona', consentSite: true, consentSocial: true }}
                        onSavePhone={async () => undefined}
                        onSaveResult={async () => undefined}
                        onPrepareConsent={async () => ({ token: 'podglad', link: 'https://domizhomes.com/zgoda?t=podglad', reused: true })}
                    />
                </section>
            )}
        </div>
    );
};
