// Kolejka „Dzwoń dziś” i decyzje zgoda → szkic.
// Importu nie ma w tym repozytorium. Priorytet 1–5 (5 = najpierw) czytamy z pól,
// których rutyna może użyć, a gdy ich nie ma — z tekstu audytu („Priorytet: 5”).

export type QueueKind = 'call' | 'callback' | 'stale';

export interface QueueLead {
    id: string;
    title?: string;
    location?: string;
    price?: string;
    url?: string;
    ownerName?: string;
    ownerPhone?: string;
    stage?: string;
    createdAt?: string;
    updatedAt?: string;
    auditedAt?: string;
    auditSummary?: string;
    callbackAt?: string;
    lastCallAt?: string;
    lastContactAt?: string;
    draftPropertyId?: string | number;
    activePropertyId?: string | number;
    callPriority?: number | string;
    priority?: number | string;
    auditData?: {
        callPriority?: number | string;
        priority?: number | string;
        contactAngle?: string;
        opener?: string;
        summary?: string;
    } | null;
    sourceDetails?: {
        advertiserType?: string;
        callPriority?: number | string;
        priority?: number | string;
        priceDrop?: number | string;
        priceDropPln?: number | string;
        previousPrice?: number | string;
        previousPricePln?: number | string;
    } | null;
}

export interface QueueRow {
    lead: QueueLead;
    kind: QueueKind;
    priority: number | null;
    opener: string;
    priceDropPln: number;
}

const PRIORITY_FIELDS = (lead: QueueLead): unknown[] => [
    lead.callPriority,
    lead.priority,
    lead.auditData?.callPriority,
    lead.auditData?.priority,
    lead.sourceDetails?.callPriority,
    lead.sourceDetails?.priority,
];

export function readCallPriority(lead: QueueLead): number | null {
    for (const value of PRIORITY_FIELDS(lead)) {
        const number = Number(value);
        if (number >= 1 && number <= 5) return number;
    }
    const text = `${lead.auditSummary || ''}\n${lead.auditData?.summary || ''}`;
    const match = text.match(/priorytet\D{0,16}([1-5])(?:\s*\/\s*5)?/i);
    return match ? Number(match[1]) : null;
}

export function readOpener(lead: QueueLead): string {
    const direct = lead.auditData?.contactAngle || lead.auditData?.opener || '';
    if (direct.trim()) return direct.trim();
    const text = lead.auditSummary || lead.auditData?.summary || '';
    const labeled = text.match(/zagajenie\s*[:\-–]\s*(.+)/i);
    if (labeled?.[1]) return labeled[1].split('\n')[0].trim();
    const line = text.split('\n').map((item) => item.trim()).find((item) => item && !/^priorytet\b/i.test(item));
    return line || '';
}

export function hasFinishedAudit(lead: QueueLead): boolean {
    return Boolean(lead.auditSummary?.trim() || lead.auditedAt || lead.auditData?.summary || lead.auditData?.contactAngle || readCallPriority(lead) != null);
}

export function isPrivateAdvertiser(value?: string): boolean {
    const text = (value || '').toLocaleLowerCase('pl-PL');
    return text === 'private' || /prywat|osoba prywatna|\bprivate\b/.test(text);
}

export function priceDropPln(lead: QueueLead): number {
    const details = lead.sourceDetails;
    const explicit = Number(details?.priceDropPln ?? details?.priceDrop);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const previous = Number(details?.previousPricePln ?? details?.previousPrice);
    const current = Number((lead.price || '').replace(/[^\d]/g, ''));
    if (Number.isFinite(previous) && previous > current && current > 0) return previous - current;
    return 0;
}

const dayStamp = (iso?: string) => (iso ? iso.slice(0, 10) : '');

export function buildCallQueue(leads: QueueLead[], now = new Date()): QueueRow[] {
    const today = now.toISOString().slice(0, 10);
    const staleBefore = now.getTime() - 14 * 24 * 60 * 60 * 1000;
    const rows: QueueRow[] = [];
    for (const lead of leads) {
        const stage = lead.stage || 'new';
        if (stage === 'acquired' || stage === 'rejected') continue;
        const priority = readCallPriority(lead);
        const opener = readOpener(lead);
        const drop = priceDropPln(lead);
        const callbackDay = dayStamp(lead.callbackAt);
        if (callbackDay && callbackDay < today) {
            rows.push({ lead, kind: 'callback', priority, opener, priceDropPln: drop });
            continue;
        }
        const ready = stage === 'ready_to_call' || ((stage === 'new' || stage === 'audit') && hasFinishedAudit(lead));
        if (ready) {
            rows.push({ lead, kind: 'call', priority, opener, priceDropPln: drop });
            continue;
        }
        const touched = lead.updatedAt || lead.lastContactAt || lead.lastCallAt || lead.createdAt;
        const noOwner = !lead.ownerName?.trim() && !lead.ownerPhone?.trim();
        if (stage === 'nurture' && noOwner && touched && new Date(touched).getTime() < staleBefore) {
            rows.push({ lead, kind: 'stale', priority, opener, priceDropPln: drop });
        }
    }
    const kindRank: Record<QueueKind, number> = { callback: 0, call: 1, stale: 2 };
    return rows.sort((a, b) => {
        if (kindRank[a.kind] !== kindRank[b.kind]) return kindRank[a.kind] - kindRank[b.kind];
        const priorityDelta = (b.priority ?? 0) - (a.priority ?? 0);
        if (priorityDelta) return priorityDelta;
        if (b.priceDropPln !== a.priceDropPln) return b.priceDropPln - a.priceDropPln;
        return (b.lead.createdAt || '').localeCompare(a.lead.createdAt || '');
    });
}

export const EXTRA_LISTING_SOURCES = ['kazo', 'adresowo', 'abyhom', 'nieruchomosci-online'] as const;

export function listingSourceKey(lead: { url?: string; source?: string }): string {
    const source = (lead.source || '').toLowerCase();
    const host = (lead.url || '').toLowerCase();
    const extra = EXTRA_LISTING_SOURCES.find((name) => source === name || host.includes(name));
    if (extra) return extra;
    if (host.includes('otodom.pl') || source.startsWith('otodom')) return 'Otodom';
    if (host.includes('olx.pl') || source === 'olx') return 'OLX';
    if (host.includes('facebook.com') || host.includes('fb.com') || source === 'facebook') return 'Facebook';
    return source;
}

export interface ConsentPublishInput {
    status?: string;
    consentSite?: boolean;
    consentSocial?: boolean;
}

export function publishBlockReason(consent: ConsentPublishInput | null | undefined): string | null {
    if (!consent) return 'Brak powiązanej zgody właściciela na publikację na stronie.';
    if (consent.status !== 'potwierdzona') return 'Zgoda nie jest potwierdzona — oferta zostaje szkicem.';
    if (consent.consentSite !== true) return 'Właściciel nie zaznaczył zgody na publikację na stronie.';
    return null;
}

export function shouldCreateConsentDraft(lead: QueueLead, consent: ConsentPublishInput | null | undefined): boolean {
    if (!consent || consent.status !== 'potwierdzona' || consent.consentSite !== true) return false;
    if (lead.draftPropertyId || lead.activePropertyId) return false;
    if (lead.stage === 'rejected') return false;
    return true;
}

export function stageAfterConfirmedConsent(current?: string): 'consent_draft' | string {
    if (current === 'acquired' || current === 'rejected' || current === 'consent_draft') return current;
    return 'consent_draft';
}

export function isOldUnpublishedImport(property: {
    published?: boolean;
    source?: string;
    sourceAgency?: string;
    sourceUrl?: string;
    importer?: string;
    importedBy?: string;
    importBatch?: string;
    importSource?: string;
    createdAt?: string;
    importedAt?: string;
}): boolean {
    if (property.published !== false) return false;
    const blob = [property.source, property.sourceAgency, property.sourceUrl, property.importer, property.importedBy, property.importBatch, property.importSource]
        .map((value) => String(value || ''))
        .join(' ')
        .toLocaleLowerCase('pl-PL');
    return /bakowski|bąkowski/.test(blob);
}
