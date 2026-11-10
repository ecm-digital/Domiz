// Czysta logika karty rozmowy w Pozyskach.
// Kształt dokumentu ownerConsents jest taki sam jak w public/admin/zgody/app.js,
// plus opcjonalne acquisitionListingId (wymaga reguły z tego PR).

export type AcquisitionStage = 'new' | 'audit' | 'ready_to_call' | 'contacted' | 'meeting' | 'proposal' | 'acquired' | 'nurture' | 'rejected';

export type CallResultId = 'no_answer' | 'callback' | 'interested_sms' | 'refused' | 'agency';

export type ConsentUiStatus = 'none' | 'link_sent' | 'confirmed_site' | 'confirmed_social' | 'withdrawn' | 'declined' | 'expired';

export const CONSENT_TEXT_VERSION = 'zgoda-v2-2026-11-10';
export const CONSENT_SITE = 'https://domizhomes.com';
export const SMS_LINK_PLACEHOLDER = '«link»';
export const CONSENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const CALL_RESULTS: Array<{ id: CallResultId; label: string }> = [
    { id: 'no_answer', label: 'Nie odebrał' },
    { id: 'callback', label: 'Oddzwonić' },
    { id: 'interested_sms', label: 'Zainteresowany – wysłać SMS' },
    { id: 'refused', label: 'Odmowa' },
    { id: 'agency', label: 'To biuro, nie prywatny' },
];

export const STAGE_LABELS: Record<AcquisitionStage, string> = {
    new: 'Nowe ogłoszenie',
    audit: 'Audyt ogłoszenia',
    ready_to_call: 'Gotowe do kontaktu',
    contacted: 'Rozmowa z właścicielem',
    meeting: 'Spotkanie / prezentacja planu',
    proposal: 'Oferta współpracy',
    acquired: 'Umowa podpisana',
    nurture: 'Wrócić później',
    rejected: 'Nieaktualne / przegrane',
};

export const CONSENT_STATUS_LABEL: Record<ConsentUiStatus, string> = {
    none: 'Brak zgody',
    link_sent: 'Link wysłany',
    confirmed_site: 'Potwierdzona (tylko strona)',
    confirmed_social: 'Potwierdzona + social',
    withdrawn: 'Wycofana',
    declined: 'Odmowa',
    expired: 'Link wygasł',
};

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const OTODOM_URL = /^https:\/\/(www\.)?otodom\.pl\/[^\s<>"]+$/;
const PHONE_LIKE = /\d[\d ()+.-]{7,}\d/;

export interface CallCardLead {
    id: string;
    title?: string;
    location?: string;
    price?: string;
    areaM2?: number;
    url?: string;
    ownerName?: string;
    ownerPhone?: string;
    stage?: AcquisitionStage;
    callResult?: CallResultId;
    callbackAt?: string;
    lastCallAt?: string;
    ownerConsentId?: string;
    propertyDraft?: { type?: string };
}

export interface OwnerConsentLike {
    id?: string;
    status?: string;
    consentSite?: boolean;
    consentSocial?: boolean;
    expiresAt?: unknown;
    acquisitionListingId?: string;
}

export function callResultLabel(id?: string): string {
    return CALL_RESULTS.find((item) => item.id === id)?.label || '';
}

/** Ten sam algorytm co newToken() w public/admin/zgody/app.js (24 znaki, bez biasu modulo). */
export function newConsentToken(len = 24): string {
    const alphabet = TOKEN_ALPHABET;
    let out = '';
    while (out.length < len) {
        const buf = crypto.getRandomValues(new Uint8Array(len * 2));
        for (const byte of buf) {
            if (byte < 248 && out.length < len) out += alphabet[byte % 62];
        }
    }
    return out;
}

export function buildConsentLink(token: string): string {
    return `${CONSENT_SITE}/zgoda?t=${token}`;
}

export function defaultSmsBody(link: string = SMS_LINK_PLACEHOLDER): string {
    return `Dzień dobry, tu Tomasz Gnat z Domiz Homes, rozmawialiśmy przed chwilą. Pod tym linkiem może Pan/Pani potwierdzić bezpłatną publikację ogłoszenia na domizhomes.com: ${link}. Pozdrawiam.`;
}

export function applyConsentLink(body: string, link: string): string {
    if (body.includes(SMS_LINK_PLACEHOLDER)) return body.split(SMS_LINK_PLACEHOLDER).join(link);
    if (body.includes(link)) return body;
    const replaced = body.replace(/https:\/\/domizhomes\.com\/zgoda\?t=[A-Za-z0-9]+/g, link);
    if (replaced !== body) return replaced;
    const trimmed = body.trim();
    return trimmed ? `${trimmed} ${link}` : defaultSmsBody(link);
}

export function dialablePhone(phone: string): string {
    const trimmed = phone.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';
    return hasPlus ? `+${digits}` : digits;
}

/** Format iPhone: sms:<numer>?&body=<treść>. Nic nie wysyła — otwiera Wiadomości. */
export function smsComposerHref(phone: string, body: string): string {
    return `sms:${dialablePhone(phone)}?&body=${encodeURIComponent(body)}`;
}

export function callbackDateToIso(date: string): string {
    return `${date}T09:00:00+01:00`;
}

export function stageForCallResult(current: AcquisitionStage | undefined, result: CallResultId, hasCallback: boolean): AcquisitionStage {
    const stage = current || 'new';
    if (stage === 'acquired') return 'acquired';
    if (result === 'refused' || result === 'agency') return 'rejected';
    if (result === 'interested_sms') {
        if (stage === 'meeting' || stage === 'proposal') return stage;
        return 'contacted';
    }
    if (result === 'callback' || (result === 'no_answer' && hasCallback)) {
        if (stage === 'meeting' || stage === 'proposal') return stage;
        return 'nurture';
    }
    if (stage === 'meeting' || stage === 'proposal') return stage;
    return 'ready_to_call';
}

export function stageAfterConsentLink(current: AcquisitionStage | undefined): AcquisitionStage {
    const stage = current || 'new';
    if (stage === 'meeting' || stage === 'proposal' || stage === 'acquired') return stage;
    return 'contacted';
}

export function formatCallNote(result: CallResultId, note: string, callbackDate: string): string {
    const parts = [`Wynik rozmowy: ${callResultLabel(result)}.`];
    const trimmed = note.trim();
    if (trimmed) parts.push(trimmed);
    if (callbackDate) parts.push(`Oddzwonić: ${callbackDate}.`);
    return parts.join(' ');
}

export function expiresAtMillis(value: unknown): number | null {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof value === 'object') {
        const record = value as { toMillis?: () => number; seconds?: number };
        if (typeof record.toMillis === 'function') {
            const millis = record.toMillis();
            return Number.isFinite(millis) ? millis : null;
        }
        if (typeof record.seconds === 'number') return record.seconds * 1000;
    }
    return null;
}

export function consentCardStatus(consent: OwnerConsentLike | null | undefined, now = Date.now()): ConsentUiStatus {
    if (!consent) return 'none';
    const status = consent.status || '';
    if (status === 'wycofana') return 'withdrawn';
    if (status === 'odmowa') return 'declined';
    if (status === 'potwierdzona') return consent.consentSocial ? 'confirmed_social' : 'confirmed_site';
    if (status === 'wygasla') return 'expired';
    const expires = expiresAtMillis(consent.expiresAt);
    if ((status === 'oczekuje' || status === '') && expires != null && expires < now) return 'expired';
    if (status === 'oczekuje') return 'link_sent';
    return 'none';
}

export function parsePricePln(price?: string): number | null {
    if (!price) return null;
    const digits = price.replace(/[^\d]/g, '');
    if (!digits) return null;
    const value = Number(digits);
    return Number.isFinite(value) ? value : null;
}

export function consentPropertyType(lead: Pick<CallCardLead, 'title' | 'propertyDraft'>): string {
    const blob = `${lead.title || ''} ${lead.propertyDraft?.type || ''}`.toLowerCase();
    if (blob.includes('działk') || blob.includes('dzialk')) return 'Działka';
    if (blob.includes('bliź') || blob.includes('bliz')) return 'Dom w zabudowie bliźniaczej';
    if (blob.includes('segment')) return 'Segment';
    if (blob.includes('kawaler') && (blob.includes('ogród') || blob.includes('ogrod'))) return 'Kawalerka z ogródkiem';
    if (blob.includes('kawaler')) return 'Kawalerka';
    if (lead.propertyDraft?.type === 'dom' || /(^|[^a-ząćęłńóśźż])dom([^a-ząćęłńóśźż]|$)/.test(blob)) return 'Dom';
    if (blob.includes('ogród') || blob.includes('ogrod')) return 'Mieszkanie z ogródkiem';
    return 'Mieszkanie';
}

export function consentLocation(lead: Pick<CallCardLead, 'location' | 'title'>): string {
    const source = (lead.location || lead.title || 'Warszawa').replace(PHONE_LIKE, ' ').replace(/\s+/g, ' ').trim();
    const location = (source || 'Warszawa').slice(0, 120);
    return location || 'Warszawa';
}

export function consentListingUrl(url?: string): string {
    const value = (url || '').trim();
    if (!value || value.length > 300 || !OTODOM_URL.test(value)) return '';
    return value;
}

/** Pola tworzone tak jak w /admin/zgody, bez znaczników czasu (te dokłada Firestore). */
export function buildOwnerConsentFields(lead: CallCardLead, includeLeadId = true): Record<string, string | number | null> {
    const fields: Record<string, string | number | null> = {
        salutation: '',
        greeting: '',
        propertyType: consentPropertyType(lead),
        location: consentLocation(lead),
        areaM2: typeof lead.areaM2 === 'number' && Number.isFinite(lead.areaM2) ? lead.areaM2 : null,
        pricePln: parsePricePln(lead.price),
        listingUrl: consentListingUrl(lead.url),
        consentTextVersion: CONSENT_TEXT_VERSION,
        status: 'oczekuje',
    };
    if (includeLeadId) fields.acquisitionListingId = lead.id;
    return fields;
}

export function consentForLead<T extends OwnerConsentLike>(lead: { id: string; ownerConsentId?: string }, consents: Record<string, T>): T | null {
    if (lead.ownerConsentId && consents[lead.ownerConsentId]) return consents[lead.ownerConsentId];
    return Object.values(consents).find((item) => item.acquisitionListingId === lead.id) || null;
}
