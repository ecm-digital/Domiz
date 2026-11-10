import { useMemo, useState } from 'react';
import { AcquisitionCallCard } from './AcquisitionCallCard';
import { consentCardStatus } from './callCardLogic';
import type { CallResultId, ConsentUiStatus, OwnerConsentLike } from './callCardLogic';
import './AdminDashboard.css';
import './admin-theme.css';

const FUTURE = Date.now() + 7 * 24 * 60 * 60 * 1000;

const STATES: Array<{ id: string; status: ConsentUiStatus; consent: OwnerConsentLike | null }> = [
    { id: 'brak', status: 'none', consent: null },
    { id: 'link', status: 'link_sent', consent: { id: 'PreviewTokenLinkSent0001', status: 'oczekuje', expiresAt: FUTURE, acquisitionListingId: 'lead-link' } },
    { id: 'strona', status: 'confirmed_site', consent: { id: 'PreviewTokenSiteOnly0001', status: 'potwierdzona', consentSite: true, consentSocial: false, acquisitionListingId: 'lead-site' } },
    { id: 'social', status: 'confirmed_social', consent: { id: 'PreviewTokenSocial000001', status: 'potwierdzona', consentSite: true, consentSocial: true, acquisitionListingId: 'lead-social' } },
    { id: 'wycofana', status: 'withdrawn', consent: { id: 'PreviewTokenWithdrawn001', status: 'wycofana', acquisitionListingId: 'lead-off' } },
];

const leadFor = (id: string, phone: boolean) => ({
    id: `lead-${id}`,
    title: 'Mieszkanie 3 pokoje, Bemowo',
    ownerName: 'Anna Kowalska',
    ownerPhone: phone ? '+48 500 100 200' : '',
    location: 'ul. Lazurowa, Bemowo, Warszawa',
    price: '890 000 zł',
    callResult: id === 'brak' ? undefined : 'callback' as CallResultId,
    lastCallAt: id === 'brak' ? undefined : '2026-11-10T09:30:00+01:00',
    callbackAt: id === 'link' ? '2026-11-12T09:00:00+01:00' : undefined,
});

export const CallCardPreview = () => {
    const requested = new URLSearchParams(window.location.search).get('stan') || 'wszystkie';
    const visible = useMemo(() => requested === 'wszystkie' ? STATES : STATES.filter((item) => item.id === requested), [requested]);
    const [phones, setPhones] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState<Record<string, string>>({});

    return (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '0.75rem', background: '#f8fafc', minHeight: '100vh' }}>
            {visible.map((item) => {
                const base = leadFor(item.id, item.id !== 'brak');
                const lead = { ...base, ownerPhone: phones[item.id] ?? base.ownerPhone };
                return (
                    <article key={item.id} data-consent-state={item.status} style={{ marginBottom: '1rem', padding: '0.85rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f766e' }}>OTODOM · 890 000 zł</div>
                        <h2 style={{ margin: '0.2rem 0', fontSize: '1.05rem' }}>{lead.title}</h2>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>ul. Lazurowa, Bemowo, Warszawa</div>
                        {saved[item.id] && <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>Podgląd zapisał: {saved[item.id]}</p>}
                        <AcquisitionCallCard
                            lead={lead}
                            consent={item.consent}
                            onSavePhone={async (phone) => { setPhones((current) => ({ ...current, [item.id]: phone })); }}
                            onSaveResult={async (input) => { setSaved((current) => ({ ...current, [item.id]: `${input.result} ${input.callbackDate}` })); }}
                            onPrepareConsent={async () => ({ token: item.consent?.id || 'PreviewTokenFresh0000001', link: `https://domizhomes.com/zgoda?t=${item.consent?.id || 'PreviewTokenFresh0000001'}`, reused: consentCardStatus(item.consent) === 'link_sent' })}
                        />
                    </article>
                );
            })}
        </main>
    );
};
