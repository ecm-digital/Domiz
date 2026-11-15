import { useState } from 'react';
import type { QueueRow } from './workflowQueue';

const KIND_LABEL = {
    call: 'Do telefonu',
    callback: 'Oddzwonienie po terminie',
    stale: 'Bez właściciela od ponad 14 dni',
} as const;

export type QuickCallAction = 'no_answer' | 'callback_2d' | 'interested' | 'rejected';

interface CallQueuePanelProps {
    rows: QueueRow[];
    onOpenCall: (id: string) => void;
    onQuickCallAction?: (leadId: string, action: QuickCallAction) => Promise<void>;
    maxVisible?: number;
}

export const buildWhatsappUrl = (phone: string, text: string): string => {
    let digits = phone.replace(/\D+/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length === 9) digits = `48${digits}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

const buildQuickSmsText = (row: QueueRow) => {
    const title = row.lead.title || 'Państwa ogłoszenia nieruchomości';
    const location = row.lead.location ? ` (${row.lead.location})` : '';
    return `Dzień dobry, dzwoniłem przed chwilą w sprawie ${title}${location}. Reprezentuję Domiz Homes — mamy klientów poszukujących podobnych nieruchomości i chętnie porozmawiam o współpracy. Proszę o kontakt zwrotny w wolnej chwili.`;
};

export const CallQueuePanel = ({ rows, onOpenCall, onQuickCallAction, maxVisible }: CallQueuePanelProps) => {
    const [expanded, setExpanded] = useState(false);
    const [onlyWithPhone, setOnlyWithPhone] = useState(false);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const withPhoneCount = rows.filter((row) => Boolean(row.lead.ownerPhone?.trim())).length;
    const filteredRows = onlyWithPhone ? rows.filter((row) => Boolean(row.lead.ownerPhone?.trim())) : rows;
    const hasLimit = typeof maxVisible === 'number' && maxVisible > 0 && filteredRows.length > maxVisible;
    const visibleRows = hasLimit && !expanded ? filteredRows.slice(0, maxVisible) : filteredRows;

    const triggerQuickAction = async (leadId: string, action: QuickCallAction) => {
        if (!onQuickCallAction || busyKey) return;
        setBusyKey(`${leadId}:${action}`);
        try {
            await onQuickCallAction(leadId, action);
        } finally {
            setBusyKey(null);
        }
    };

    const copyQuickSms = async (row: QueueRow) => {
        try {
            await navigator.clipboard.writeText(buildQuickSmsText(row));
            setCopiedId(row.lead.id);
            window.setTimeout(() => setCopiedId((prev) => (prev === row.lead.id ? null : prev)), 2000);
        } catch {
            // Clipboard may be blocked in non-HTTPS contexts
        }
    };

    return (
        <section className="call-queue" aria-label="Dzwoń dziś">
            <header className="call-queue__head">
                <div>
                    <div className="admin-dashboard__eyebrow">DZWOŃ DZIŚ</div>
                    <h3>Kolejka telefonów {hasLimit && !expanded ? `(Top ${maxVisible} z ${filteredRows.length})` : ''}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="agent-action-btn"
                        aria-pressed={onlyWithPhone}
                        onClick={() => setOnlyWithPhone((prev) => !prev)}
                        style={onlyWithPhone ? { background: 'var(--color-primary, #1f5c43)', color: '#fff', borderColor: 'var(--color-primary, #1f5c43)' } : undefined}
                    >
                        Tylko z numerem tel. ({withPhoneCount})
                    </button>
                    {hasLimit && (
                        <button type="button" className="agent-action-btn" onClick={() => setExpanded((prev) => !prev)}>
                            {expanded ? `Zwiń do Top ${maxVisible}` : `Pokaż wszystkie (${filteredRows.length})`}
                        </button>
                    )}
                    <strong>{filteredRows.length}</strong>
                </div>
            </header>
            {filteredRows.length === 0 ? (
                <p className="call-queue__empty">{onlyWithPhone ? 'Brak ogłoszeń z zapisanym numerem telefonu w kolejce.' : 'Nic nie czeka na telefon. Nowe ogłoszenie z gotowym audytem albo etap „gotowe do kontaktu” pojawi się tutaj.'}</p>
            ) : (
                <ol className="call-queue__list">
                    {visibleRows.map((row) => {
                        const rawPhone = row.lead.ownerPhone?.trim() || '';
                        const phone = Boolean(rawPhone);
                        const telHref = phone ? `tel:${rawPhone.replace(/\s+/g, '')}` : '';
                        const rowBusy = busyKey?.startsWith(`${row.lead.id}:`) || false;
                        return (
                            <li key={`${row.kind}-${row.lead.id}`} className={`call-queue__row call-queue__row--${row.kind}`}>
                                <div className="call-queue__badge" aria-label={row.priority ? `Priorytet ${row.priority} z 5` : 'Bez priorytetu'}>
                                    {row.priority ?? '–'}
                                </div>
                                <div className="call-queue__body">
                                    <div className="call-queue__kind">
                                        {KIND_LABEL[row.kind]}
                                        {phone && (
                                            <a
                                                href={telHref}
                                                style={{ marginLeft: '0.5rem', color: 'var(--color-primary, #1f5c43)', fontWeight: 700, textDecoration: 'underline' }}
                                            >
                                                ☎ {rawPhone}
                                            </a>
                                        )}
                                    </div>
                                    <strong>{row.lead.title || 'Ogłoszenie'}</strong>
                                    <div>{[row.lead.location, row.lead.price].filter(Boolean).join(' · ') || 'Brak lokalizacji i ceny'}</div>
                                    {row.opener && <p>{row.opener}</p>}
                                    {onQuickCallAction && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                                            <button type="button" className="agent-action-btn" disabled={rowBusy} onClick={() => void triggerQuickAction(row.lead.id, 'no_answer')}>
                                                {busyKey === `${row.lead.id}:no_answer` ? 'Zapis...' : 'Nie odbiera'}
                                            </button>
                                            <button type="button" className="agent-action-btn" disabled={rowBusy} onClick={() => void triggerQuickAction(row.lead.id, 'callback_2d')}>
                                                {busyKey === `${row.lead.id}:callback_2d` ? 'Zapis...' : 'Oddzwonić +2d'}
                                            </button>
                                            <button type="button" className="agent-action-btn" disabled={rowBusy} onClick={() => void triggerQuickAction(row.lead.id, 'interested')}>
                                                {busyKey === `${row.lead.id}:interested` ? 'Zapis...' : 'Zainteresowany'}
                                            </button>
                                            <button type="button" className="agent-action-btn" disabled={rowBusy} onClick={() => void triggerQuickAction(row.lead.id, 'rejected')}>
                                                {busyKey === `${row.lead.id}:rejected` ? 'Zapis...' : 'Odpada'}
                                            </button>
                                            <button type="button" className="agent-action-btn" onClick={() => void copyQuickSms(row)}>
                                                {copiedId === row.lead.id ? 'Skopiowano SMS ✓' : 'Kopiuj SMS'}
                                            </button>
                                            {phone && (
                                                <a
                                                    href={buildWhatsappUrl(rawPhone, buildQuickSmsText(row))}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="agent-action-btn"
                                                    style={{ textDecoration: 'none', color: '#15803d', borderColor: '#86efac' }}
                                                >
                                                    WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="call-queue__actions">
                                    {phone ? (
                                        <button type="button" className="btn-primary" onClick={() => onOpenCall(row.lead.id)}>Karta rozmowy</button>
                                    ) : row.lead.url ? (
                                        <a className="btn-primary" href={row.lead.url} target="_blank" rel="noreferrer">Otwórz ogłoszenie</a>
                                    ) : (
                                        <button type="button" className="btn-primary" onClick={() => onOpenCall(row.lead.id)}>Karta rozmowy</button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
};
