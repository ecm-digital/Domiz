import { useEffect, useMemo, useState } from 'react';
import {
    CALL_RESULTS,
    CONSENT_STATUS_LABEL,
    SMS_LINK_PLACEHOLDER,
    applyConsentLink,
    buildConsentLink,
    callResultLabel,
    consentCardStatus,
    defaultSmsBody,
    dialablePhone,
    smsComposerHref,
} from './callCardLogic';
import type { CallResultId, ConsentUiStatus, OwnerConsentLike } from './callCardLogic';
import './AcquisitionCallCard.css';

export interface AcquisitionCallCardLead {
    id: string;
    title?: string;
    ownerName?: string;
    ownerPhone?: string;
    callResult?: string;
    callbackAt?: string;
    lastCallAt?: string;
}

export interface PrepareConsentResult {
    token: string;
    link: string;
    reused: boolean;
}

interface AcquisitionCallCardProps {
    lead: AcquisitionCallCardLead;
    consent: OwnerConsentLike | null;
    onSavePhone: (phone: string) => Promise<void>;
    onSaveResult: (input: { result: CallResultId; note: string; callbackDate: string }) => Promise<void>;
    onPrepareConsent: () => Promise<PrepareConsentResult>;
}

const statusClass = (status: ConsentUiStatus) => `call-card__badge call-card__badge--${status}`;

const formatWhen = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
};

export const AcquisitionCallCard = ({ lead, consent, onSavePhone, onSaveResult, onPrepareConsent }: AcquisitionCallCardProps) => {
    const [phone, setPhone] = useState(lead.ownerPhone || '');
    const [phoneDirty, setPhoneDirty] = useState(false);
    const [selected, setSelected] = useState<CallResultId | ''>('');
    const [note, setNote] = useState('');
    const [callbackDate, setCallbackDate] = useState('');
    const [smsBody, setSmsBody] = useState(defaultSmsBody());
    const [link, setLink] = useState('');
    const [smsHref, setSmsHref] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);
    const [savingResult, setSavingResult] = useState(false);
    const [preparingSms, setPreparingSms] = useState(false);
    const [copied, setCopied] = useState<'sms' | 'link' | ''>('');
    const [error, setError] = useState('');
    const [savedResult, setSavedResult] = useState('');

    const status = consentCardStatus(consent);
    const phoneReady = dialablePhone(phoneDirty ? phone : (lead.ownerPhone || phone)).length >= 9;
    const shownPhone = phoneDirty ? phone : (lead.ownerPhone || phone);
    const canResendExisting = status === 'link_sent' || status === 'confirmed_site' || status === 'confirmed_social';

    useEffect(() => {
        const token = consent?.id || '';
        if (!token || !canResendExisting) return;
        const next = buildConsentLink(token);
        setLink(next);
        setSmsBody((body) => applyConsentLink(body, next));
    }, [canResendExisting, consent?.id]);

    const liveHref = useMemo(() => {
        if (!phoneReady) return '';
        const body = link ? applyConsentLink(smsBody, link) : smsBody;
        if (body.includes(SMS_LINK_PLACEHOLDER)) return '';
        return smsComposerHref(shownPhone, body);
    }, [link, phoneReady, shownPhone, smsBody]);

    const openHref = smsHref || liveHref;

    const copyText = async (value: string, kind: 'sms' | 'link') => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(kind);
        } catch {
            setError('Nie udało się skopiować. Zaznacz tekst i skopiuj ręcznie.');
        }
    };

    const savePhone = async () => {
        setError('');
        setSavingPhone(true);
        try {
            await onSavePhone(shownPhone.trim());
            setPhoneDirty(false);
            setPhone(shownPhone.trim());
        } catch (cause) {
            console.error(cause);
            setError('Nie udało się zapisać numeru.');
        } finally {
            setSavingPhone(false);
        }
    };

    const saveResult = async () => {
        if (!selected) {
            setError('Wybierz wynik rozmowy.');
            return;
        }
        setError('');
        setSavingResult(true);
        try {
            if (phoneDirty && shownPhone.trim()) await onSavePhone(shownPhone.trim());
            await onSaveResult({ result: selected, note, callbackDate });
            setSavedResult(callResultLabel(selected));
            setNote('');
            setSelected('');
            setPhoneDirty(false);
        } catch (cause) {
            console.error(cause);
            setError('Nie udało się zapisać wyniku rozmowy.');
        } finally {
            setSavingResult(false);
        }
    };

    const prepareSms = async () => {
        setError('');
        setPreparingSms(true);
        setSmsHref('');
        try {
            if (phoneDirty && shownPhone.trim()) await onSavePhone(shownPhone.trim());
            const prepared = await onPrepareConsent();
            const body = applyConsentLink(smsBody, prepared.link);
            setLink(prepared.link);
            setSmsBody(body);
            const href = dialablePhone(shownPhone) ? smsComposerHref(shownPhone, body) : '';
            setSmsHref(href);
            if (href) window.location.href = href;
        } catch (cause) {
            console.error(cause);
            setError('Nie udało się utworzyć linku zgody. Sprawdź, czy to konto administratora.');
        } finally {
            setPreparingSms(false);
        }
    };

    return (
        <section className="call-card" aria-label={`Karta rozmowy: ${lead.title || 'pozysk'}`}>
            <header className="call-card__head">
                <div>
                    <h3>Rozmowa</h3>
                    <p>{lead.ownerName || 'Właściciel bez imienia'}</p>
                </div>
                <span className={statusClass(status)}>{CONSENT_STATUS_LABEL[status]}</span>
            </header>

            {(lead.lastCallAt || lead.callbackAt) && (
                <p className="call-card__meta">
                    {lead.callResult ? <>Ostatni wynik: <strong>{callResultLabel(lead.callResult) || lead.callResult}</strong></> : 'Ostatni kontakt'}
                    {lead.lastCallAt ? ` · ${formatWhen(lead.lastCallAt)}` : ''}
                    {lead.callbackAt ? ` · oddzwonić ${formatWhen(lead.callbackAt)}` : ''}
                </p>
            )}
            {savedResult && <p className="call-card__meta">Zapisano: {savedResult}.</p>}

            <div className="call-card__phone">
                {phoneReady ? (
                    <a className="call-card__tap call-card__tap--call" href={`tel:${dialablePhone(shownPhone)}`}>Zadzwoń</a>
                ) : (
                    <span className="call-card__tap call-card__tap--disabled">Zadzwoń</span>
                )}
                <label className="call-card__field">
                    <span>Numer z rozmowy</span>
                    <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="np. +48 500 000 000"
                        value={shownPhone}
                        onChange={(event) => { setPhone(event.target.value); setPhoneDirty(true); setSmsHref(''); }}
                    />
                </label>
                {phoneDirty && (
                    <button type="button" className="call-card__tap" onClick={() => void savePhone()} disabled={savingPhone || !shownPhone.trim()}>
                        {savingPhone ? 'Zapisuję…' : 'Zapisz numer'}
                    </button>
                )}
            </div>

            <div className="call-card__results" role="group" aria-label="Wynik rozmowy">
                {CALL_RESULTS.map((result) => (
                    <button
                        key={result.id}
                        type="button"
                        aria-pressed={selected === result.id}
                        onClick={() => setSelected(result.id)}
                    >
                        {result.label}
                    </button>
                ))}
            </div>

            <label className="call-card__field">
                <span>Krótka notatka</span>
                <textarea rows={2} value={note} maxLength={500} placeholder="Np. prosi o telefon po 17" onChange={(event) => setNote(event.target.value)} />
            </label>
            <label className="call-card__field">
                <span>Data oddzwonienia (opcjonalnie)</span>
                <input type="date" value={callbackDate} onChange={(event) => setCallbackDate(event.target.value)} />
            </label>
            <button type="button" className="call-card__tap call-card__tap--save" onClick={() => void saveResult()} disabled={savingResult || !selected}>
                {savingResult ? 'Zapisuję…' : 'Zapisz wynik'}
            </button>

            <div className="call-card__sms">
                <h4>SMS ze zgodą</h4>
                <p>Nic nie wysyła się samo. Na iPhonie otwiera się aplikacja Wiadomości z gotową treścią — wysyłasz ją Ty.</p>
                <label className="call-card__field">
                    <span>Treść SMS</span>
                    <textarea rows={5} value={smsBody} onChange={(event) => { setSmsBody(event.target.value); setSmsHref(''); }} />
                </label>
                <button type="button" className="call-card__tap call-card__tap--sms" onClick={() => void prepareSms()} disabled={preparingSms}>
                    {preparingSms ? 'Tworzę link…' : phoneReady ? 'Przygotuj SMS i link' : 'Utwórz link zgody'}
                </button>
                {openHref && (
                    <a className="call-card__tap call-card__tap--sms" href={openHref}>Otwórz w Wiadomościach</a>
                )}
                <button type="button" className="call-card__tap" onClick={() => void copyText(link ? applyConsentLink(smsBody, link) : smsBody, 'sms')}>
                    {copied === 'sms' ? 'Skopiowano SMS' : 'Kopiuj SMS'}
                </button>
                {link && (
                    <>
                        <p className="call-card__link">{link}</p>
                        <button type="button" className="call-card__tap" onClick={() => void copyText(link, 'link')}>
                            {copied === 'link' ? 'Skopiowano link' : 'Kopiuj link'}
                        </button>
                    </>
                )}
            </div>
            {error && <p className="call-card__error" role="alert">{error}</p>}
        </section>
    );
};
