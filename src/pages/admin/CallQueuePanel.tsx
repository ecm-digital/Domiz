import { useState } from 'react';
import type { QueueRow } from './workflowQueue';

const KIND_LABEL = {
    call: 'Do telefonu',
    callback: 'Oddzwonienie po terminie',
    stale: 'Bez właściciela od ponad 14 dni',
} as const;

interface CallQueuePanelProps {
    rows: QueueRow[];
    onOpenCall: (id: string) => void;
    maxVisible?: number;
}

export const CallQueuePanel = ({ rows, onOpenCall, maxVisible }: CallQueuePanelProps) => {
    const [expanded, setExpanded] = useState(false);
    const hasLimit = typeof maxVisible === 'number' && maxVisible > 0 && rows.length > maxVisible;
    const visibleRows = hasLimit && !expanded ? rows.slice(0, maxVisible) : rows;

    return (
        <section className="call-queue" aria-label="Dzwoń dziś">
            <header className="call-queue__head">
                <div>
                    <div className="admin-dashboard__eyebrow">DZWOŃ DZIŚ</div>
                    <h3>Kolejka telefonów {hasLimit && !expanded ? `(Top ${maxVisible} z ${rows.length})` : ''}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {hasLimit && (
                        <button type="button" className="agent-action-btn" onClick={() => setExpanded((prev) => !prev)}>
                            {expanded ? `Zwiń do Top ${maxVisible}` : `Pokaż wszystkie (${rows.length})`}
                        </button>
                    )}
                    <strong>{rows.length}</strong>
                </div>
            </header>
            {rows.length === 0 ? (
                <p className="call-queue__empty">Nic nie czeka na telefon. Nowe ogłoszenie z gotowym audytem albo etap „gotowe do kontaktu” pojawi się tutaj.</p>
            ) : (
                <ol className="call-queue__list">
                    {visibleRows.map((row) => {
                        const phone = Boolean(row.lead.ownerPhone?.trim());
                        return (
                            <li key={`${row.kind}-${row.lead.id}`} className={`call-queue__row call-queue__row--${row.kind}`}>
                                <div className="call-queue__badge" aria-label={row.priority ? `Priorytet ${row.priority} z 5` : 'Bez priorytetu'}>
                                    {row.priority ?? '–'}
                                </div>
                                <div className="call-queue__body">
                                    <div className="call-queue__kind">{KIND_LABEL[row.kind]}</div>
                                    <strong>{row.lead.title || 'Ogłoszenie'}</strong>
                                    <div>{[row.lead.location, row.lead.price].filter(Boolean).join(' · ') || 'Brak lokalizacji i ceny'}</div>
                                    {row.opener && <p>{row.opener}</p>}
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
